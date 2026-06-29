import "server-only";
import { fal } from "@fal-ai/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PHOTO_RESTORATION_ENDPOINT = "fal-ai/image-apps-v2/photo-restoration";
const ORIGINALS_BUCKET = "photo-originals";

type FalImage = {
  url?: unknown;
  content_type?: unknown;
};

export type PhotoRestorationResult =
  | {
      status: "processing";
    }
  | {
      status: "done";
      imageUrl: string;
      contentType?: string;
    };

function getFalKey() {
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    throw new Error("FAL_KEY is not configured.");
  }

  return falKey;
}

function configureFal() {
  fal.config({
    credentials: getFalKey()
  });
}

function findImageUrl(value: unknown): { imageUrl: string; contentType?: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const record = value as Record<string, unknown>;
  const maybeImage = record as FalImage;

  if (typeof maybeImage.url === "string") {
    return {
      imageUrl: maybeImage.url,
      contentType: typeof maybeImage.content_type === "string" ? maybeImage.content_type : undefined
    };
  }

  for (const item of Object.values(record)) {
    const found = findImageUrl(item);

    if (found) {
      return found;
    }
  }

  return null;
}

export async function submitPhotoRestoration(jobId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: job, error: jobError } = await supabase
    .from("photo_jobs")
    .select("original_path")
    .eq("id", jobId)
    .single();

  if (jobError || !job?.original_path) {
    throw new Error("Photo job original file was not found.");
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(ORIGINALS_BUCKET)
    .createSignedUrl(job.original_path, 60 * 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error("Could not create signed URL for original photo.");
  }

  configureFal();

  const queueStatus = await fal.queue.submit(PHOTO_RESTORATION_ENDPOINT, {
    input: {
      image_url: signedUrlData.signedUrl,
      enhance_resolution: true,
      fix_colors: true,
      remove_scratches: true
    }
  });

  return queueStatus.request_id;
}

export async function getPhotoRestorationResult(jobId: string): Promise<PhotoRestorationResult> {
  const supabase = createSupabaseAdminClient();
  const { data: job, error: jobError } = await supabase
    .from("photo_jobs")
    .select("fal_request_id")
    .eq("id", jobId)
    .single();

  if (jobError || !job?.fal_request_id) {
    throw new Error("Photo job fal.ai request was not found.");
  }

  configureFal();

  const queueStatus = await fal.queue.status(PHOTO_RESTORATION_ENDPOINT, {
    requestId: job.fal_request_id,
    logs: false
  });

  if (queueStatus.status !== "COMPLETED") {
    return { status: "processing" };
  }

  const result = await fal.queue.result(PHOTO_RESTORATION_ENDPOINT, {
    requestId: job.fal_request_id
  });

  const parsed = findImageUrl(result.data);

  if (!parsed) {
    throw new Error("fal.ai returned result without an image URL.");
  }

  return {
    status: "done",
    imageUrl: parsed.imageUrl,
    contentType: parsed.contentType
  };
}
