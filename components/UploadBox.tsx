"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingState } from "@/components/ProcessingState";
import { appConfig } from "@/lib/config";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

type UploadStatus = "idle" | "uploading" | "processing" | "failed";

type JobStatusResponse = {
  id?: string;
  status?: "uploaded" | "processing" | "done" | "failed";
  resultUrl?: string;
  error?: string;
};

export function UploadBox() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status !== "processing" || !jobId) {
      return;
    }

    let isCancelled = false;

    async function checkJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          cache: "no-store"
        });
        const data = (await response.json().catch(() => null)) as JobStatusResponse | null;

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          setErrorMessage(data?.error || "Не удалось проверить статус обработки.");
          setStatus("failed");
          return;
        }

        if (data?.status === "done") {
          router.push(`/result/${jobId}`);
          return;
        }

        if (data?.status === "failed") {
          setErrorMessage(data.error || "Реставрация завершилась с ошибкой.");
          setStatus("failed");
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Не удалось проверить статус обработки.");
          setStatus("failed");
        }
      }
    }

    void checkJob();
    const interval = window.setInterval(checkJob, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, router, status]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setErrorMessage("");
    setFileName(file.name);
    setJobId("");

    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage("Поддерживаются только JPG, PNG или WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Файл слишком большой. Максимум 10 МБ.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setStatus("uploading");

    try {
      const createResponse = await fetch("/api/jobs/create", {
        method: "POST",
        body: formData
      });

      const createData = (await createResponse.json().catch(() => null)) as
        | { jobId?: string; status?: string; error?: string }
        | null;

      if (!createResponse.ok || !createData?.jobId) {
        setErrorMessage(createData?.error || "Не удалось загрузить фото. Попробуйте еще раз.");
        setStatus("idle");
        return;
      }

      const restoreResponse = await fetch(`/api/jobs/${createData.jobId}/restore`, {
        method: "POST"
      });

      const restoreData = (await restoreResponse.json().catch(() => null)) as
        | { status?: string; error?: string }
        | null;

      if (!restoreResponse.ok || restoreData?.status === "failed") {
        setErrorMessage(
          restoreData?.error || "Не удалось запустить реставрацию. Попробуйте еще раз."
        );
        setStatus("failed");
        return;
      }

      setJobId(createData.jobId);
      setStatus("processing");
    } catch {
      setErrorMessage("Не удалось загрузить фото. Попробуйте еще раз.");
      setStatus("idle");
    }
  }

  if (status === "uploading") {
    return <ProcessingState fileName={fileName} mode="uploading" />;
  }

  if (status === "processing") {
    return <ProcessingState fileName={fileName} mode="processing" />;
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border border-coral/20 bg-white/86 p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
          Ошибка обработки
        </p>
        <h2 className="mt-3 text-2xl font-bold">Не удалось восстановить фото</h2>
        <p className="mt-3 text-sm leading-6 text-ink/66">
          {errorMessage || "Реставрация завершилась с ошибкой."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setErrorMessage("");
              setJobId("");
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 font-bold text-white transition hover:bg-ink/90"
          >
            Попробовать еще раз
          </button>
          <a
            href={appConfig.supportUrl || "#"}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink/14 bg-white px-5 py-3 font-bold text-ink transition hover:border-mint hover:text-mint"
          >
            Техническая поддержка
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white bg-white/82 p-5 shadow-soft sm:p-8">
      <label
        htmlFor="photo-upload"
        className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink/18 bg-linen/70 px-5 py-10 text-center transition hover:border-coral/75 hover:bg-white"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral text-3xl font-bold text-white">
          +
        </span>
        <span className="mt-5 text-xl font-bold">Выберите фото</span>
        <span className="mt-3 max-w-md text-sm leading-6 text-ink/62">
          Поддерживаются изображения JPG, PNG и WEBP до 10 МБ. Файл будет
          сохранен в Supabase Storage, а затем отправлен на AI-реставрацию.
        </span>
      </label>
      <input
        ref={inputRef}
        id="photo-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />
      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-ink px-5 py-3 font-bold text-white transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-ink/20"
      >
        Загрузить изображение
      </button>
    </div>
  );
}
