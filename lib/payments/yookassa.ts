import "server-only";
import { submitPhotoRestoration } from "@/lib/ai/fal";
import { getRestorePriceRub } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";
const PAYMENT_PROVIDER = "yookassa";
const PAYMENT_DESCRIPTION = "Восстановление фото KARMA";
const PAYMENT_SERVICE = "karma_photo_restore";

type CustomerContact = {
  email?: string;
  phone?: string;
};

type YooKassaAmount = {
  value?: string;
  currency?: string;
};

type YooKassaPaymentObject = {
  id?: string;
  status?: string;
  paid?: boolean;
  amount?: YooKassaAmount;
  confirmation?: {
    confirmation_url?: string;
  };
  metadata?: {
    jobId?: string;
    service?: string;
  };
};

type PhotoJob = {
  id: string;
  status: string;
  payment_status?: string | null;
  payment_id?: string | null;
  payment_confirmation_url?: string | null;
};

export class YooKassaConfigError extends Error {}
export class YooKassaPaymentError extends Error {}

function getYooKassaConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  const returnUrl =
    process.env.YOOKASSA_RETURN_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout`;
  const vatCode = process.env.YOOKASSA_VAT_CODE?.trim();

  if (!shopId || !secretKey) {
    throw new YooKassaConfigError("YooKassa payment settings are not configured.");
  }

  if (vatCode) {
    const numericVatCode = Number(vatCode);

    if (!Number.isInteger(numericVatCode) || numericVatCode < 1 || numericVatCode > 12) {
      throw new YooKassaConfigError("YOOKASSA_VAT_CODE must be a number from 1 to 12.");
    }
  }

  return {
    shopId,
    secretKey,
    returnUrl: returnUrl.replace(/\/$/, ""),
    vatCode: vatCode ? Number(vatCode) : null
  };
}

export function assertYooKassaConfigured() {
  getYooKassaConfig();
}

function getAuthHeader(shopId: string, secretKey: string) {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

function formatRubAmount(priceRub: number) {
  return priceRub.toFixed(2);
}

function normalizeContact(customer: CustomerContact) {
  const email = customer.email?.trim() || undefined;
  const phone = customer.phone?.trim() || undefined;

  return { email, phone };
}

function buildReceipt(customer: CustomerContact, priceValue: string, vatCode: number | null) {
  if (!vatCode || (!customer.email && !customer.phone)) {
    return undefined;
  }

  return {
    customer: {
      ...(customer.email ? { email: customer.email } : {}),
      ...(customer.phone ? { phone: customer.phone } : {})
    },
    items: [
      {
        description: "Восстановление фото",
        quantity: "1.00",
        amount: {
          value: priceValue,
          currency: "RUB"
        },
        vat_code: vatCode,
        payment_subject: "service",
        payment_mode: "full_payment"
      }
    ]
  };
}

async function requestYooKassa<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { shopId, secretKey } = getYooKassaConfig();
  const response = await fetch(`${YOOKASSA_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(shopId, secretKey),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !data) {
    throw new YooKassaPaymentError(`YooKassa request failed with status ${response.status}.`);
  }

  return data;
}

async function findJob(jobId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: job, error } = await supabase
    .from("photo_jobs")
    .select("id,status,payment_status,payment_id,payment_confirmation_url")
    .eq("id", jobId)
    .single<PhotoJob>();

  if (error || !job) {
    throw new YooKassaPaymentError("Photo job was not found.");
  }

  return { supabase, job };
}

async function startRestorationAfterPaid(jobId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: job, error } = await supabase
    .from("photo_jobs")
    .select("id,status,payment_status")
    .eq("id", jobId)
    .single<Pick<PhotoJob, "id" | "status" | "payment_status">>();

  if (error || !job || job.payment_status !== "paid") {
    return;
  }

  if (job.status === "processing" || job.status === "done") {
    return;
  }

  if (job.status !== "uploaded" && job.status !== "failed") {
    return;
  }

  try {
    const falRequestId = await submitPhotoRestoration(jobId);

    await supabase
      .from("photo_jobs")
      .update({
        status: "processing",
        fal_request_id: falRequestId,
        result_path: null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);
  } catch {
    await supabase
      .from("photo_jobs")
      .update({
        status: job.status,
        error_message: "Не удалось запустить восстановление после оплаты.",
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);
  }
}

function assertConfirmedPayment(payment: YooKassaPaymentObject) {
  const jobId = payment.metadata?.jobId;
  const expectedAmount = formatRubAmount(getRestorePriceRub());

  if (!payment.id || payment.status !== "succeeded" || payment.paid !== true) {
    throw new YooKassaPaymentError("Payment is not confirmed.");
  }

  if (!jobId || payment.metadata?.service !== PAYMENT_SERVICE) {
    throw new YooKassaPaymentError("Payment metadata is invalid.");
  }

  if (payment.amount?.currency !== "RUB" || payment.amount.value !== expectedAmount) {
    throw new YooKassaPaymentError("Payment amount is invalid.");
  }

  return jobId;
}

export async function createYooKassaPayment(jobId: string, customer: CustomerContact) {
  const contact = normalizeContact(customer);

  if (!contact.email && !contact.phone) {
    throw new YooKassaPaymentError("Customer email or phone is required.");
  }

  const { supabase, job } = await findJob(jobId);

  if (job.payment_status === "paid") {
    return {
      confirmationUrl: job.payment_confirmation_url || "",
      paymentId: job.payment_id || "",
      payment_status: "paid" as const
    };
  }

  if (job.payment_status === "pending" && job.payment_id && job.payment_confirmation_url) {
    return {
      confirmationUrl: job.payment_confirmation_url,
      paymentId: job.payment_id,
      payment_status: "pending" as const
    };
  }

  const config = getYooKassaConfig();
  const priceRub = getRestorePriceRub();
  const priceValue = formatRubAmount(priceRub);
  const body = {
    amount: {
      value: priceValue,
      currency: "RUB"
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: `${config.returnUrl}/${jobId}?from=yookassa`
    },
    description: PAYMENT_DESCRIPTION,
    metadata: {
      jobId,
      service: PAYMENT_SERVICE
    },
    receipt: buildReceipt(contact, priceValue, config.vatCode)
  };

  const payment = await requestYooKassa<YooKassaPaymentObject>("/payments", {
    method: "POST",
    headers: {
      "Idempotence-Key": `photo-restore-${jobId}`
    },
    body: JSON.stringify(body)
  });

  const confirmationUrl = payment.confirmation?.confirmation_url;

  if (!payment.id || !confirmationUrl) {
    throw new YooKassaPaymentError("YooKassa did not return a payment confirmation URL.");
  }

  const { error: updateError } = await supabase
    .from("photo_jobs")
    .update({
      payment_status: "pending",
      price_rub: priceRub,
      payment_provider: PAYMENT_PROVIDER,
      payment_id: payment.id,
      payment_confirmation_url: confirmationUrl,
      customer_email: contact.email || null,
      customer_phone: contact.phone || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (updateError) {
    throw new YooKassaPaymentError("Could not save payment details.");
  }

  return {
    confirmationUrl,
    paymentId: payment.id,
    payment_status: "pending" as const
  };
}

export async function getYooKassaPayment(paymentId: string) {
  return requestYooKassa<YooKassaPaymentObject>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function handleYooKassaPaymentSucceeded(paymentObject: YooKassaPaymentObject) {
  const jobId = assertConfirmedPayment(paymentObject);
  const { supabase, job } = await findJob(jobId);

  if (job.payment_id && job.payment_id !== paymentObject.id) {
    throw new YooKassaPaymentError("Payment id does not match job payment id.");
  }

  const { error } = await supabase
    .from("photo_jobs")
    .update({
      payment_status: "paid",
      payment_provider: PAYMENT_PROVIDER,
      payment_id: paymentObject.id,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (error) {
    throw new YooKassaPaymentError("Could not mark payment as paid.");
  }

  await startRestorationAfterPaid(jobId);

  return {
    jobId,
    payment_status: "paid" as const
  };
}

export async function handleYooKassaPaymentCanceled(paymentObject: YooKassaPaymentObject) {
  const jobId = paymentObject.metadata?.jobId;

  if (!paymentObject.id || !jobId) {
    return {
      payment_status: "failed" as const
    };
  }

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("photo_jobs")
    .update({
      payment_status: "failed",
      payment_provider: PAYMENT_PROVIDER,
      payment_id: paymentObject.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  return {
    jobId,
    payment_status: "failed" as const
  };
}

export async function confirmYooKassaPayment(paymentId: string) {
  const payment = await getYooKassaPayment(paymentId);

  if (payment.status === "succeeded" && payment.paid === true) {
    return handleYooKassaPaymentSucceeded(payment);
  }

  if (payment.status === "canceled") {
    return handleYooKassaPaymentCanceled(payment);
  }

  return {
    jobId: payment.metadata?.jobId,
    payment_status: "pending" as const
  };
}
