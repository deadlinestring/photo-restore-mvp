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
        <Link href="/" className="text-sm font-semibold text-ink/62 transition hover:text-ink">
          На главную
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-mint">
          Результат {resultId}
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
          {isDone
            ? "Реставрация готова"
            : isFailed
              ? "Реставрация не завершилась"
              : isMissing
                ? "Результат не найден"
                : "Фото еще обрабатывается"}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink/68">
          {isDone
            ? "Готовое фото сохранено в приватном bucket и доступно по временной signed-ссылке."
            : isFailed
              ? errorMessage || "Во время обработки произошла ошибка. Можно обратиться в поддержку."
              : isMissing
                ? "Для этого id пока нет готовой задачи. Мы не показываем демо-картинку вместо реального результата."
                : "AI-реставрация еще идет. Вернитесь на эту страницу через несколько секунд."}
        </p>

        {isDone ? <SupportLinks imageUrl={resultUrl} /> : null}

        {!isDone ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/restore"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 font-bold text-white transition hover:bg-ink/90"
            >
              Загрузить другое фото
            </Link>
            <a
              href={appConfig.supportUrl || "#"}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink/14 bg-white px-5 py-3 font-bold text-ink transition hover:border-mint hover:text-mint"
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
            alt="Отреставрированное фото"
            className="aspect-[4/3] w-full rounded-md object-contain"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-md bg-linen px-6 text-center">
            <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-mint/25 border-t-mint" />
            <p className="text-lg font-bold text-ink">
              {isFailed || isMissing ? "Результат недоступен" : "Ожидаем результат"}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink/62">
              {isFailed || isMissing
                ? "Мы не показываем демо-картинку вместо неготового результата."
                : "Когда обработка завершится, здесь появится реальное фото."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
