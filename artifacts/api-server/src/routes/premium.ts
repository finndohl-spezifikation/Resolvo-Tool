import { Router } from "express";
import { createCheckoutSession, constructWebhookEvent } from "../lib/stripe.js";
import { db } from "@workspace/db";
import { guildsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/premium/checkout", async (req, res) => {
  const { user, guild } = req.query;

  if (!user || !guild) {
    res.status(400).json({ error: "Missing user or guild parameter" });
    return;
  }

  try {
    const baseUrl = process.env["DASHBOARD_URL"] || `https://${process.env["RAILWAY_PUBLIC_DOMAIN"] || "localhost"}`;
    const successUrl = `${baseUrl}/premium/success?guild=${guild}`;
    const cancelUrl = `${baseUrl}/premium/cancel`;

    const url = await createCheckoutSession(
      String(user),
      String(guild),
      successUrl,
      cancelUrl,
    );

    res.redirect(url);
  } catch (err) {
    logger.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: "Checkout failed" });
  }
});

router.post("/premium/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature" });
    return;
  }

  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.error({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const guildId: string = session.metadata?.guild_id;
    const userId: string = session.metadata?.discord_user_id;

    if (guildId && userId) {
      await db
        .update(guildsTable)
        .set({ isPremium: true, premiumSince: new Date(), premiumUserId: userId, updatedAt: new Date() })
        .where(eq(guildsTable.id, guildId));

      await db
        .update(usersTable)
        .set({ isPremium: true, premiumSince: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      logger.info({ guildId, userId }, "Premium activated");
    }
  }

  res.json({ received: true });
});

export default router;
