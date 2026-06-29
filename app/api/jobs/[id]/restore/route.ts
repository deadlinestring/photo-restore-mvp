import { NextResponse } from "next/server";
import { submitPhotoRestoration } from "@/lib/ai/fal";
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
  const supabase = createSupabaseAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("photo_jobs")
    .select("id,status,original_path")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return jsonError("Задача не найдена.", 404);
  }

  if (job.status === "processing") {
    return NextResponse.json({ status: "processing" });
  }

  if (job.status === "done") {
    return NextResponse.json({ status: "done" });
  }

  if (job.status !== "uploaded" && job.status !== "failed") {
    return jsonError("Задачу нельзя отправить на обработку.", 409);
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
      return jsonError("Не удалось запустить реставрацию. Попробуйте еще раз.", 500);
    }

    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("fal.ai photo restoration submit failed", error);

    await supabase
      .from("photo_jobs")
      .update({
        status: "failed",
        error_message: "Не удалось запустить реставрацию.",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    return jsonError("Не удалось запустить реставрацию. Попробуйте еще раз.", 500);
  }
}
