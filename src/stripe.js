import Stripe from "stripe";

let stripeInstance = null;

export function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY nicht gesetzt");
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function createCheckoutSession(discordUserId, guildId, successUrl, cancelUrl) {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Resolvo Tool Premium",
            description: "Einmaliger Kauf – dauerhafter Premium-Zugang für deinen Server",
          },
          unit_amount: 599,
        },
        quantity: 1,
      },
    ],
    metadata: { discord_user_id: discordUserId, guild_id: guildId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url;
}

export function constructWebhookEvent(payload, signature) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET nicht gesetzt");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
