import { NextResponse } from "next/server";
import { submitPhotoRestoration } from "@/lib/ai/fal";
import { getRestoreFlowMode } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RestoreRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_request: Request, { params }: RestoreRouteContext) {
  const { id } = await params;
  const restoreFlowMode = getRestoreFlowMode();
  const supabase = createSupabaseAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("photo_jobs")
    .select("id,status,original_path,payment_status")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return jsonError("Заявка не найдена.", 404);
  }

  if (restoreFlowMode === "payment_required" && job.payment_status !== "paid") {
    return NextResponse.json(
      {
        error: "Payment is required before restoration"
      },
      { status: 402 }
    );
  }

  if (job.status === "processing") {
    return NextResponse.json({ status: "processing" });
  }

  if (job.status === "done") {
    return NextResponse.json({ status: "done" });
  }

  if (job.status !== "uploaded" && job.status !== "failed") {
    return jsonError("Заявку нельзя отправить на обработку.", 409);
  }

  try {
    const falRequestId = await submitPhotoRestoration(id);

    const { error: updateError } = await supabase
      .from("photo_jobs")
      .update({
        status: "processing",
        fal_request_id: falRequestId,
        result_path: null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update photo job after fal submit", updateError);
      return jsonError("Не удалось запустить восстановление. Попробуйте еще раз.", 500);
    }

    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("fal.ai photo restoration submit failed", error);

    await supabase
      .from("photo_jobs")
      .update({
        status: "failed",
        error_message: "Не удалось запустить восстановление.",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    return jsonError("Не удалось запустить восстановление. Попробуйте еще раз.", 500);
  }
}
