import { NextResponse } from "next/server";
import {
  assertYooKassaConfigured,
  createYooKassaPayment,
  YooKassaConfigError,
  YooKassaPaymentError
} from "@/lib/payments/yookassa";

export const runtime = "nodejs";

type CreatePaymentRequest = {
  jobId?: string;
  email?: string;
  phone?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s().-]{7,20}$/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: CreatePaymentRequest;

  try {
    body = (await request.json()) as CreatePaymentRequest;
  } catch {
    return jsonError("Не удалось прочитать данные для оплаты.", 400);
  }

  const jobId = normalize(body.jobId);
  const email = normalize(body.email);
  const phone = normalize(body.phone);

  if (!jobId) {
    return jsonError("Не найдена заявка для оплаты.", 400);
  }

  if (!email && !phone) {
    return jsonError("Укажите email или телефон для чека.", 400);
  }

  if (email && !emailPattern.test(email)) {
    return jsonError("Проверьте email для чека.", 400);
  }

  if (phone && !phonePattern.test(phone)) {
    return jsonError("Проверьте телефон для чека.", 400);
  }

  try {
    assertYooKassaConfigured();

    const payment = await createYooKassaPayment(jobId, {
      email: email || undefined,
      phone: phone || undefined
    });

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof YooKassaConfigError) {
      return jsonError("Оплата временно недоступна. Напишите в поддержку.", 500);
    }

    if (error instanceof YooKassaPaymentError) {
      return jsonError("Не удалось открыть оплату. Попробуйте еще раз или напишите в поддержку.", 400);
    }

    return jsonError("Не удалось открыть оплату. Попробуйте еще раз или напишите в поддержку.", 500);
  }
}
