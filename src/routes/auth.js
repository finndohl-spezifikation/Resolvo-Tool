import { Router } from "express";
import { upsertUser } from "../db.js";

const router = Router();

const FALLBACK_CLIENT_ID = "1508500695110647839";

function getClientId() {
  return process.env.DISCORD_CLIENT_ID || FALLBACK_CLIENT_ID;
}

function getDiscordOAuthUrl(state = "") {
  const clientId = getClientId();
  const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
  const redirectUri = encodeURIComponent(`${baseUrl}/auth/callback`);
  const scope = encodeURIComponent("identify guilds");
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=consent${state ? `&state=${state}` : ""}`;
}

router.get("/auth/login", (req, res) => {
  const clientId = getClientId();
  if (!clientId) {
    res.status(500).send("DISCORD_CLIENT_ID nicht konfiguriert.");
    return;
  }
  const redirect = req.query.redirect || "/servers";
  const state = Buffer.from(redirect).toString("base64");
  res.redirect(getDiscordOAuthUrl(state));
});

router.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code) { res.redirect("/?error=no_code"); return; }

  const clientId = getClientId();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;

  if (!clientId || !clientSecret) {
    res.status(500).send("OAuth2 nicht konfiguriert.");
    return;
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("OAuth token exchange failed:", err);
      res.redirect("/?error=oauth_failed");
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json();

    // Get user guilds
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guilds = await guildsRes.json();

    // Store in session (simple cookie-based)
    const session = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      guilds: Array.isArray(guilds) ? guilds : [],
      accessToken,
    };

    res.cookie("session", Buffer.from(JSON.stringify(session)).toString("base64"), {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    upsertUser(user.id, user.username);

    const redirect = state ? Buffer.from(state, "base64").toString() : "/servers";
    res.redirect(redirect);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect("/?error=server_error");
  }
});

router.get("/auth/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/");
});

export function getSession(req) {
  try {
    const cookie = req.cookies?.session;
    if (!cookie) return null;
    return JSON.parse(Buffer.from(cookie, "base64").toString());
  } catch { return null; }
}

export default router;
