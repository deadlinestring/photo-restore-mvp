"use client";

import { useState } from "react";

export function CheckoutPaymentStub() {
  const [message, setMessage] = useState("");

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setMessage("Оплата будет подключена на следующем этапе.")}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-coral px-6 py-4 text-lg font-bold text-white transition hover:bg-[#9f4c4c] focus:outline-none focus:ring-4 focus:ring-coral/30"
      >
        Оплатить восстановление
      </button>
      {message ? (
        <p
          className="mt-4 rounded-lg border-2 border-mint bg-linen px-4 py-3 text-base font-bold leading-7 text-ink"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
