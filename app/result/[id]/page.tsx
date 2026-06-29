import { ResultView } from "@/components/ResultView";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RESULTS_BUCKET = "photo-results";

type ResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  let job:
    | {
        status: string;
        result_path: string | null;
        error_message: string | null;
      }
    | null = null;

  let resultUrl: string | undefined;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("photo_jobs")
      .select("status,result_path,error_message")
      .eq("id", id)
      .single();

    job = data;

    if (job?.status === "done" && job.result_path) {
      const { data: signedUrlData } = await supabase.storage
        .from(RESULTS_BUCKET)
        .createSignedUrl(job.result_path, 60 * 60);

      resultUrl = signedUrlData?.signedUrl;
    }
  } catch (error) {
    console.error("Could not load photo restoration result page", error);
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <ResultView
        resultId={id}
        status={job?.status || "missing"}
        resultUrl={resultUrl}
        errorMessage={job?.error_message || undefined}
      />
    </main>
  );
}
