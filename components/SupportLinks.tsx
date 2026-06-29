import { appConfig } from "@/lib/config";

type SupportLinksProps = {
  imageUrl: string;
};

export function SupportLinks({ imageUrl }: SupportLinksProps) {
  const reviewsUrl = appConfig.reviewsUrl || "#";
  const supportUrl = appConfig.supportUrl || "#";

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <a
        href={imageUrl}
        download
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-coral px-5 py-3 font-bold text-white transition hover:bg-[#d94d66] focus:outline-none focus:ring-4 focus:ring-coral/25"
      >
        Скачать
      </a>
      <a
        href={imageUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 font-bold text-white transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-ink/20"
      >
        Открыть в полном размере
      </a>
      <a
        href={reviewsUrl}
        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink/14 bg-white px-5 py-3 font-bold text-ink transition hover:border-mint hover:text-mint"
      >
        Отзывы
      </a>
      <a
        href={supportUrl}
        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink/14 bg-white px-5 py-3 font-bold text-ink transition hover:border-mint hover:text-mint"
      >
        Техническая поддержка
      </a>
    </div>
  );
}
