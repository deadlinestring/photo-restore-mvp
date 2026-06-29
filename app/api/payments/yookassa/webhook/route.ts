import { NextResponse } from "next/server";
import {
  getYooKassaPayment,
  handleYooKassaPaymentCanceled,
  handleYooKassaPaymentSucceeded
} from "@/lib/payments/yookassa";

export const runtime = "nodejs";

type YooKassaWebhookBody = {
  event?: string;
  object?: {
    id?: string;
  };
};

export async function POST(request: Request) {
  let body: YooKassaWebhookBody;

  try {
    body = (await request.json()) as YooKassaWebhookBody;
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body.event !== "payment.succeeded" && body.event !== "payment.canceled") {
    return NextResponse.json({ ok: true });
  }

  const paymentId = body.object?.id;

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const verifiedPayment = await getYooKassaPayment(paymentId);

    if (body.event === "payment.succeeded") {
      if (verifiedPayment.status === "succeeded" && verifiedPayment.paid === true) {
        await handleYooKassaPaymentSucceeded(verifiedPayment);
      }

      return NextResponse.json({ ok: true });
    }

    if (verifiedPayment.status === "canceled") {
      await handleYooKassaPaymentCanceled(verifiedPayment);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
