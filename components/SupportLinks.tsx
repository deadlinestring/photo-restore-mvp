import { appConfig } from "@/lib/config";

type SupportLinksProps = {
  imageUrl: string;
};

export function SupportLinks({ imageUrl }: SupportLinksProps) {
  const reviewsUrl = appConfig.reviewsUrl || "#";
  const supportUrl = appConfig.supportUrl || "#";

  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={imageUrl}
          download
          className="inline-flex min-h-14 items-center justify-center rounded-lg bg-coral px-6 py-4 text-lg font-bold text-white transition hover:bg-[#9f4c4c] focus:outline-none focus:ring-4 focus:ring-coral/30"
          aria-label="Скачать восстановленное фото"
        >
          Скачать фото
        </a>
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-14 items-center justify-center rounded-lg bg-ink px-6 py-4 text-lg font-bold text-white transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-ink/25"
          aria-label="Открыть восстановленное фото в полном размере"
        >
          Открыть крупно
        </a>
      </div>

      <div className="mt-6 rounded-lg bg-linen p-5">
        <p className="text-lg font-bold leading-8 text-ink">
          Если результат получился неудачным, напишите нам - мы попробуем помочь.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={reviewsUrl}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-ink/20 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-mint hover:text-mint focus:outline-none focus:ring-4 focus:ring-mint/25"
          >
            Отзывы
          </a>
          <a
            href={supportUrl}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-ink/20 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-mint hover:text-mint focus:outline-none focus:ring-4 focus:ring-mint/25"
          >
            Техническая поддержка
          </a>
        </div>
      </div>
    </div>
  );
}
