import { NextResponse } from "next/server";
import { confirmYooKassaPayment } from "@/lib/payments/yookassa";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CheckPaymentRequest = {
  jobId?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: CheckPaymentRequest;

  try {
    body = (await request.json()) as CheckPaymentRequest;
  } catch {
    return jsonError("Не удалось проверить оплату.", 400);
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";

  if (!jobId) {
    return jsonError("Не найдена заявка для проверки оплаты.", 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data: job, error } = await supabase
    .from("photo_jobs")
    .select("id,status,payment_status,payment_id")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return jsonError("Заявка не найдена.", 404);
  }

  if (!job.payment_id) {
    return NextResponse.json({
      jobId,
      status: job.status,
      payment_status: job.payment_status || "unpaid"
    });
  }

  try {
    const result = await confirmYooKassaPayment(job.payment_id);

    return NextResponse.json({
      jobId,
      status: job.status,
      payment_status: result.payment_status
    });
  } catch {
    return jsonError("Оплата еще проверяется. Попробуйте обновить страницу через несколько секунд.", 500);
  }
}
