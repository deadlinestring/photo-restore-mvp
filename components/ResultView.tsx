import Link from "next/link";
import { SupportLinks } from "@/components/SupportLinks";
import { appConfig } from "@/lib/config";

type ResultViewProps = {
  resultId: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
};

export function ResultView({ resultId, status, resultUrl, errorMessage }: ResultViewProps) {
  const isDone = status === "done" && resultUrl;
  const isFailed = status === "failed";
  const isMissing = status === "missing";

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.82fr]">
      <div>
        <Link
          href="/"
          className="text-base font-bold text-ink transition hover:text-coral focus:outline-none focus:ring-4 focus:ring-coral/25"
        >
          На главную
        </Link>
        <p className="mt-8 text-base font-bold text-mint">Заявка {resultId}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
          {isDone
            ? "Фото готово"
            : isFailed
              ? "Не удалось восстановить фото"
              : isMissing
                ? "Результат не найден"
                : "Фото еще восстанавливается"}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink/82">
          {isDone
            ? "Вы можете скачать восстановленное фото или открыть его в полном размере."
            : isFailed
              ? "Попробуйте загрузить другое фото или напишите в поддержку."
              : isMissing
                ? "Для этого номера пока нет готового результата. Мы не показываем пример вместо настоящего фото."
                : "Пожалуйста, подождите немного. Обычно это занимает около минуты."}
        </p>

        {isDone ? <SupportLinks imageUrl={resultUrl} /> : null}

        {!isDone ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/restore"
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-ink px-6 py-4 text-lg font-bold text-white transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-ink/25"
            >
              Загрузить другое фото
            </Link>
            <a
              href={appConfig.supportUrl || "#"}
              className="inline-flex min-h-14 items-center justify-center rounded-lg border-2 border-ink/20 bg-white px-6 py-4 text-lg font-bold text-ink transition hover:border-mint hover:text-mint focus:outline-none focus:ring-4 focus:ring-mint/25"
            >
              Техническая поддержка
            </a>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-white bg-white p-4 shadow-soft">
        {isDone ? (
          <img
            src={resultUrl}
            alt="Восстановленное семейное фото"
            className="aspect-[4/3] w-full rounded-md object-contain"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-md bg-linen px-6 text-center">
            {!isFailed && !isMissing ? (
              <div
                className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-mint/25 border-t-mint"
                aria-hidden="true"
              />
            ) : null}
            <p className="text-xl font-bold text-ink">
              {isFailed || isMissing ? "Результат недоступен" : "Ожидаем результат"}
            </p>
            <p className="mt-3 max-w-sm text-base leading-7 text-ink/82">
              {isFailed || isMissing
                ? errorMessage || "Попробуйте загрузить другое фото или напишите в поддержку."
                : "Когда восстановление завершится, здесь появится ваше фото."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
