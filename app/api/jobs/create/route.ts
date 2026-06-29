import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ORIGINALS_BUCKET = "photo-originals";

const allowedMimeTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

type AllowedMimeType = keyof typeof allowedMimeTypes;

function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return mimeType in allowedMimeTypes;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Не удалось прочитать файл. Попробуйте еще раз.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Не удалось прочитать файл. Попробуйте еще раз.", 400);
  }

  if (!isAllowedMimeType(file.type)) {
    return jsonError("Поддерживаются только JPG, PNG или WEBP.", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError("Файл слишком большой. Максимум 10 МБ.", 400);
  }

  try {
    const extension = allowedMimeTypes[file.type];
    const originalPath = `originals/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(ORIGINALS_BUCKET)
      .upload(originalPath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase storage upload failed", uploadError);
      return jsonError("Не удалось загрузить фото. Попробуйте еще раз.", 500);
    }

    const { data: job, error: insertError } = await supabase
      .from("photo_jobs")
      .insert({
        status: "uploaded",
        original_path: originalPath,
        result_path: null,
        original_filename: file.name,
        original_mime_type: file.type,
        original_size_bytes: file.size,
        error_message: null
      })
      .select("id,status")
      .single();

    if (insertError || !job) {
      console.error("Supabase photo_jobs insert failed", insertError);
      await supabase.storage.from(ORIGINALS_BUCKET).remove([originalPath]);
      return jsonError("Не удалось загрузить фото. Попробуйте еще раз.", 500);
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status
    });
  } catch (error) {
    console.error("Photo job create failed", error);
    return jsonError("Не удалось загрузить фото. Попробуйте еще раз.", 500);
  }
}
