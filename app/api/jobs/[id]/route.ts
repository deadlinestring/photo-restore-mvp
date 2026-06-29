import { NextResponse } from "next/server";
import { getPhotoRestorationResult } from "@/lib/ai/fal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const RESULTS_BUCKET = "photo-results";

type JobRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getImageExtension(contentType: string | null) {
  if (contentType?.includes("image/jpeg")) {
    return "jpg";
  }

  if (contentType?.includes("image/webp")) {
    return "webp";
  }

  return "png";
}

async function createResultSignedUrl(resultPath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(RESULTS_BUCKET)
    .createSignedUrl(resultPath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw new Error("Could not create signed URL for result photo.");
  }

  return data.signedUrl;
}

export async function GET(_request: Request, { params }: JobRouteContext) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("photo_jobs")
    .select("id,status,result_path,error_message,fal_request_id")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return jsonError("Задача не найдена.", 404);
  }

  if (job.status === "done" && job.result_path) {
    try {
      const resultUrl = await createResultSignedUrl(job.result_path);
      return NextResponse.json({ id, status: "done", resultUrl });
    } catch (error) {
      console.error("Failed to sign existing result photo", error);
      return jsonError("Не удалось открыть результат. Попробуйте еще раз.", 500);
    }
  }

  if (job.status === "failed") {
    return NextResponse.json({
      id,
      status: "failed",
      error: job.error_message || "Реставрация завершилась с ошибкой."
    });
  }

  if (job.status !== "processing" || !job.fal_request_id) {
    return NextResponse.json({ id, status: job.status });
  }

  try {
    const restorationResult = await getPhotoRestorationResult(id);

    if (restorationResult.status === "processing") {
      return NextResponse.json({ id, status: "processing" });
    }

    const resultResponse = await fetch(restorationResult.imageUrl);

    if (!resultResponse.ok) {
      throw new Error(`Could not download fal.ai result: ${resultResponse.status}`);
    }

    const responseContentType = resultResponse.headers.get("content-type");
    const contentType = restorationResult.contentType || responseContentType || "image/png";

    if (!contentType.startsWith("image/")) {
      throw new Error("fal.ai result URL did not return an image.");
    }

    const extension = getImageExtension(contentType);
    const resultPath = `results/${id}.${extension}`;
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(RESULTS_BUCKET)
      .upload(resultPath, resultBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await supabase
      .from("photo_jobs")
      .update({
        status: "done",
        result_path: resultPath,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    const resultUrl = await createResultSignedUrl(resultPath);
    return NextResponse.json({ id, status: "done", resultUrl });
  } catch (error) {
    console.error("Failed to complete photo restoration job", error);

    await supabase
      .from("photo_jobs")
      .update({
        status: "failed",
        error_message: "Не удалось завершить реставрацию.",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    return NextResponse.json({
      id,
      status: "failed",
      error: "Не удалось завершить реставрацию."
    });
  }
}
