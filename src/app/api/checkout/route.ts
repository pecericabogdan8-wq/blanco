import { NextResponse } from "next/server";

/**
 * Mock / Stripe-test payment endpoint.
 * Without STRIPE_SECRET_KEY, always returns a successful demo payment.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.amount || !body?.method) {
    return NextResponse.json({ error: "amount and method required" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({
      ok: true,
      mode: "mock",
      paymentId: `mock_${Date.now()}`,
      status: "succeeded",
    });
  }

  // Stripe test path (optional): create a PaymentIntent-like stub response
  // without exposing a full integration so the site stays runnable offline.
  return NextResponse.json({
    ok: true,
    mode: "stripe-test-stub",
    paymentId: `pi_test_${Date.now()}`,
    status: "succeeded",
    note: "Set up full Stripe Elements client-side when going live.",
  });
}
