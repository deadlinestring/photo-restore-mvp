"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const POLL_INTERVAL_MS = 3000;

type CheckoutPaymentFormProps = {
  jobId: string;
};

type PaymentCreateResponse = {
  confirmationUrl?: string;
  paymentId?: string;
  payment_status?: "pending" | "paid";
  error?: string;
};

type JobStatusResponse = {
  id?: string;
  status?: "uploaded" | "processing" | "done" | "failed";
  payment_status?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  resultUrl?: string;
  error?: string;
};

export function CheckoutPaymentForm({ jobId }: CheckoutPaymentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(searchParams.get("from") === "yookassa");
  const [shouldPollJob, setShouldPollJob] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isCheckingPayment) {
      return;
    }

    let isCancelled = false;

    async function checkPayment() {
      setMessage("Проверяем оплату...");
      setErrorMessage("");

      try {
        const response = await fetch("/api/payments/yookassa/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ jobId })
        });
        const data = (await response.json().catch(() => null)) as JobStatusResponse | null;

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          setMessage("Оплата еще проверяется. Обычно это занимает несколько секунд.");
          return;
        }

        if (data?.payment_status === "paid") {
          setMessage("Оплата получена. Восстанавливаем фото...");
          setShouldPollJob(true);
          setIsCheckingPayment(false);
          return;
        }

        if (data?.payment_status === "failed") {
          setErrorMessage("Оплата не завершилась. Попробуйте еще раз или напишите в поддержку.");
          setIsCheckingPayment(false);
          return;
        }

        setMessage("Оплата еще проверяется. Обычно это занимает несколько секунд.");
      } catch {
        if (!isCancelled) {
          setMessage("Оплата еще проверяется. Обычно это занимает несколько секунд.");
        }
      }
    }

    void checkPayment();
  }, [isCheckingPayment, jobId]);

  useEffect(() => {
    if (!shouldPollJob) {
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

        if (data?.status === "done") {
          router.push(`/result/${jobId}`);
          return;
        }

        if (data?.status === "failed") {
          setErrorMessage("Не удалось восстановить фото. Попробуйте другое изображение или напишите в поддержку.");
          setShouldPollJob(false);
          return;
        }

        if (data?.payment_status === "paid" || data?.status === "processing") {
          setMessage("Оплата получена. Восстанавливаем фото...");
        }
      } catch {
        if (!isCancelled) {
          setMessage("Оплата получена. Восстанавливаем фото...");
        }
      }
    }

    void checkJob();
    const interval = window.setInterval(checkJob, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [jobId, router, shouldPollJob]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!email.trim() && !phone.trim()) {
      setErrorMessage("Укажите email или телефон для чека.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Готовим платежную форму...");

    try {
      const response = await fetch("/api/payments/yookassa/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobId,
          email: email.trim(),
          phone: phone.trim()
        })
      });
      const data = (await response.json().catch(() => null)) as PaymentCreateResponse | null;

      if (!response.ok) {
        setErrorMessage(data?.error || "Не удалось открыть оплату. Попробуйте еще раз или напишите в поддержку.");
        setMessage("");
        setIsSubmitting(false);
        return;
      }

      if (data?.payment_status === "paid") {
        setMessage("Оплата получена. Восстанавливаем фото...");
        setShouldPollJob(true);
        setIsSubmitting(false);
        return;
      }

      if (data?.confirmationUrl) {
        window.location.href = data.confirmationUrl;
        return;
      }

      setErrorMessage("Не удалось открыть оплату. Попробуйте еще раз или напишите в поддержку.");
      setMessage("");
      setIsSubmitting(false);
    } catch {
      setErrorMessage("Не удалось открыть оплату. Попробуйте еще раз или напишите в поддержку.");
      setMessage("");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 rounded-lg border border-ink/10 bg-linen p-5" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-ink">Куда отправить чек?</h2>
      <p className="mt-3 text-lg leading-8 text-ink/82">
        Укажите email или телефон. Это нужно для оплаты и чека.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-base font-bold text-ink">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-lg border-2 border-ink/15 bg-white px-4 text-lg text-ink outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/20"
            placeholder="name@example.ru"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-base font-bold text-ink">Телефон</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-lg border-2 border-ink/15 bg-white px-4 text-lg text-ink outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/20"
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isCheckingPayment || shouldPollJob}
        className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-coral px-6 py-4 text-lg font-bold text-white transition hover:bg-[#9f4c4c] focus:outline-none focus:ring-4 focus:ring-coral/30 disabled:cursor-not-allowed disabled:bg-coral/60"
      >
        {isSubmitting ? "Готовим платежную форму..." : "Оплатить восстановление"}
      </button>

      {message ? (
        <p
          className="mt-4 rounded-lg border-2 border-mint bg-white px-4 py-3 text-base font-bold leading-7 text-ink"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          className="mt-4 rounded-lg border-2 border-coral bg-white px-4 py-3 text-base font-bold leading-7 text-ink"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
