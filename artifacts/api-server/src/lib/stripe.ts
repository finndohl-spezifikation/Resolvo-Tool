import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    stripeInstance = new Stripe(key, { apiVersion: "2025-05-28.basil" });
  }
  return stripeInstance;
}

export async function createCheckoutSession(
  discordUserId: string,
  guildId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
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
            images: [],
          },
          unit_amount: 599,
        },
        quantity: 1,
      },
    ],
    metadata: {
      discord_user_id: discordUserId,
      guild_id: guildId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
