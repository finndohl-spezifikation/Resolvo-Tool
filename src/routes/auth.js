import { Router } from "express";
  import { upsertUser } from "../db.js";

  const router = Router();

  const FALLBACK_CLIENT_ID = "1508500695110647839";

  function getClientId() {
    return process.env.DISCORD_CLIENT_ID || FALLBACK_CLIENT_ID;
  }

  function getBaseUrl(req) {
    // Try to detect the actual public URL from various sources
    const dashboardUrl = process.env.DASHBOARD_URL;
    if (dashboardUrl) return dashboardUrl.replace(/\/$/, "");

    const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
    if (railwayDomain) return `https://${railwayDomain}`;

    // Fallback to request headers (for Railway internal routing)
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    if (host && host !== "localhost") return `${proto}://${host}`;

    return "http://localhost:3000";
  }

  function getDiscordOAuthUrl(req, state = "") {
    const clientId = getClientId();
    const baseUrl = getBaseUrl(req);
    const redirectUri = encodeURIComponent(`${baseUrl}/auth/callback`);
    const scope = encodeURIComponent("identify guilds");
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=consent${state ? `&state=${state}` : ""}`;
  }

  router.get("/auth/login", (req, res) => {
    const clientId = getClientId();
    if (!clientId) {
      res.status(500).send(`
        <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Fehler - Resolvo Tool</title>
        <style>body{font-family:system-ui;background:#070a14;color:#e6f1ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .box{background:#0d1526;border:1px solid #1a2a4a;border-radius:16px;padding:40px;max-width:420px;text-align:center}
        h1{color:#ff5252;font-size:1.4rem;margin-bottom:16px}p{color:#8aa2c9;line-height:1.6}
        code{background:#121e36;padding:2px 8px;border-radius:4px;color:#00e5ff;font-size:.9rem}
        </style></head><body>
        <div class="box"><h1>Client ID fehlt</h1><p>DISCORD_CLIENT_ID ist nicht konfiguriert.<br>Bitte setze die Umgebungsvariable in Railway.</p></div>
        </body></html>
      `);
      return;
    }
    const redirect = req.query.redirect || "/servers";
    const state = Buffer.from(redirect).toString("base64");
    res.redirect(getDiscordOAuthUrl(req, state));
  });

  router.get("/auth/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    if (!code) { res.redirect("/?error=no_code"); return; }

    const clientId = getClientId();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const baseUrl = getBaseUrl(req);

    if (!clientSecret) {
      res.status(500).send(`
        <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Fehler - Resolvo Tool</title>
        <style>body{font-family:system-ui;background:#070a14;color:#e6f1ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .box{background:#0d1526;border:1px solid #1a2a4a;border-radius:16px;padding:40px;max-width:480px;text-align:center}
        h1{color:#ff5252;font-size:1.4rem;margin-bottom:16px}p{color:#8aa2c9;line-height:1.6;margin-bottom:12px}
        .url{background:#121e36;padding:10px 14px;border-radius:8px;color:#00e5ff;font-size:.82rem;word-break:break-all;margin:16px 0}
        </style></head><body>
        <div class="box"><h1>OAuth2 nicht konfiguriert</h1><p>DISCORD_CLIENT_SECRET fehlt. Außerdem muss im Discord Developer Portal diese URL als Redirect eingetragen sein:</p>
        <div class="url">${baseUrl}/auth/callback</div>
        <p style="font-size:.85rem;margin-top:20px">Gehe zu <a href="https://discord.com/developers/applications/${clientId}/oauth2" style="color:#2979ff">Discord Developer Portal → OAuth2</a> und füge die URL oben hinzu.</p>
        </div></body></html>
      `);
      return;
    }

    try {
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
        // Show helpful error with redirect_uri info
        res.status(400).send(`
          <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Fehler - Resolvo Tool</title>
          <style>body{font-family:system-ui;background:#070a14;color:#e6f1ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
          .box{background:#0d1526;border:1px solid #1a2a4a;border-radius:16px;padding:40px;max-width:500px;text-align:center}
          h1{color:#ff5252;font-size:1.4rem;margin-bottom:16px}p{color:#8aa2c9;line-height:1.6;margin-bottom:12px}
          .url{background:#121e36;padding:10px 14px;border-radius:8px;color:#00e5ff;font-size:.82rem;word-break:break-all;margin:12px 0}
          .hint{color:#5a7a9a;font-size:.8rem;margin-top:16px}
          </style></head><body>
          <div class="box"><h1>Discord Login fehlgeschlagen</h1><p>Discord hat den Login abgelehnt. Stelle sicher, dass diese URL im Discord Developer Portal unter OAuth2 → Redirects eingetragen ist:</p>
          <div class="url">${baseUrl}/auth/callback</div>
          <p class="hint">Aktueller Fehler: ${err.slice(0,120)}</p>
          <p style="margin-top:20px"><a href="/" style="color:#2979ff;text-decoration:none">Zurück zur Startseite</a></p>
          </div></body></html>
        `);
        return;
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await userRes.json();

      const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const guilds = await guildsRes.json();

      const session = {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        guilds: Array.isArray(guilds) ? guilds : [],
        accessToken,
      };

      res.cookie("session", Buffer.from(JSON.stringify(session)).toString("base64"), {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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

  
  // OAuth setup helper - shows current redirect URI
  router.get("/auth/setup", (req, res) => {
    const baseUrl = getBaseUrl(req);
    const clientId = getClientId();
    const redirectUri = `${baseUrl}/auth/callback`;
    res.send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>OAuth Setup - Resolvo Tool</title>
      <style>body{font-family:system-ui;background:#070a14;color:#e6f1ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
      .box{background:#0d1526;border:1px solid #1a2a4a;border-radius:16px;padding:40px;max-width:520px;text-align:center}
      h1{color:#4f8cff;font-size:1.5rem;margin-bottom:8px}p{color:#8aa2c9;line-height:1.6;margin:8px 0}
      .url{background:#121e36;padding:12px 16px;border-radius:8px;color:#00e5ff;font-family:monospace;font-size:.9rem;word-break:break-all;margin:16px 0;border:1px solid #1a2a4a}
      .btn{background:#4f8cff;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:16px;text-decoration:none;display:inline-block}
      .btn:hover{background:#3a7aee}
      .step{background:#121e36;padding:16px;border-radius:8px;margin:12px 0;text-align:left;border:1px solid #1a2a4a}
      .step h3{color:#4f8cff;margin:0 0 8px 0;font-size:1rem}
      .step p{margin:4px 0;font-size:.9rem}
      code{background:#1a2a4a;padding:2px 6px;border-radius:4px;color:#00e5ff;font-size:.85rem}
      </style></head><body>
      <div class="box">
        <h1>Discord OAuth2 Setup</h1>
        <p>Fuege diese URL in deiner Discord App als Redirect ein:</p>
        <div class="url" id="uri">${redirectUri}</div>
        <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('uri').innerText);this.innerText='Kopiert!';setTimeout(()=>this.innerText='URL kopieren',2000)">URL kopieren</button>
        <div class="step">
          <h3>Schritt 1: Discord Developer Portal</h3>
          <p>1. Gehe zu <a href="https://discord.com/developers/applications/${clientId}/oauth2" style="color:#2979ff" target="_blank">Discord Developer Portal</a></p>
          <p>2. Fuege unter "Redirects" diese URL hinzu:</p>
          <p><code>${redirectUri}</code></p>
        </div>
        <div class="step">
          <h3>Schritt 2: Zurueck zum Dashboard</h3>
          <p>Nach dem Speichern in Discord kannst du dich <a href="/auth/login" style="color:#2979ff">hier einloggen</a>.</p>
        </div>
        <p style="font-size:.8rem;color:#5a7099;margin-top:16px">Erkannte Domain: <code>${baseUrl}</code></p>
      </div></body></html>
    `);
  });

  export default router;
  