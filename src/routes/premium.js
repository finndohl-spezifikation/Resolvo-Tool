import { Router } from "express";
import { createCheckoutSession, constructWebhookEvent } from "../stripe.js";
import { db, guildsTable, usersTable } from "../db.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/premium/checkout", async (req, res) => {
  const { user, guild } = req.query;
  if (!user || !guild) { res.status(400).json({ error: "user und guild Parameter fehlen" }); return; }

  try {
    const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
    const url = await createCheckoutSession(
      String(user), String(guild),
      `${baseUrl}/premium/success?guild=${guild}`,
      `${baseUrl}/premium/cancel`,
    );
    res.redirect(url);
  } catch (err) {
    console.error("Stripe Checkout Fehler:", err);
    res.status(500).json({ error: "Checkout fehlgeschlagen" });
  }
});

router.post("/premium/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) { res.status(400).json({ error: "Fehlende stripe-signature" }); return; }

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("Webhook Signatur ungültig:", err);
    res.status(400).json({ error: "Ungültige Signatur" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const guildId = session.metadata?.guild_id;
    const userId = session.metadata?.discord_user_id;

    if (guildId && userId) {
      await db.update(guildsTable)
        .set({ isPremium: true, premiumSince: new Date(), premiumUserId: userId, updatedAt: new Date() })
        .where(eq(guildsTable.id, guildId));

      await db.update(usersTable)
        .set({ isPremium: true, premiumSince: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      console.log(`Premium aktiviert für Guild ${guildId}, User ${userId}`);
    }
  }

  res.json({ received: true });
});

export default router;
