import { fail, ok } from "@/lib/apiResponse";
import { processarStripeWebhook } from "@/modules/billing/billing.service";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return fail("Webhook Stripe nao configurado.", 500);
  }

  if (!signature) {
    return fail("Assinatura Stripe ausente.", 400);
  }

  try {
    const payload = await request.json();

    await processarStripeWebhook({
      data: payload.data ?? {},
      id: payload.id,
      type: payload.type,
    });

    return ok({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar webhook.";
    return fail(message, 400);
  }
}
