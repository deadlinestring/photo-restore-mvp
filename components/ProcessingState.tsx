type ProcessingStateProps = {
  fileName: string;
  mode?: "uploading" | "processing";
};

const processingStatuses = [
  "Файл сохранен",
  "Задача создана",
  "Готовим демо-результат",
  "Открываем страницу результата"
];

export function ProcessingState({ fileName, mode = "processing" }: ProcessingStateProps) {
  const isUploading = mode === "uploading";

  return (
    <div className="rounded-lg border border-white bg-white/86 p-6 shadow-soft sm:p-8">
      <div className="mx-auto mb-6 h-20 w-20 animate-spin rounded-full border-4 border-mint/25 border-t-mint" />
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">
          {isUploading ? "Загрузка фото" : "Обработка фото"}
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
          {isUploading ? "Сохраняем оригинал" : "Фото принято в обработку"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink/64">
          Файл {fileName ? `«${fileName}»` : "загружен"}.{" "}
          {isUploading
            ? "Загружаем фото в приватный bucket Supabase и создаем задачу."
            : "Запустили AI-реставрацию и проверяем готовность результата."}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-full bg-ink/8">
        <div className={`h-3 rounded-full bg-coral ${isUploading ? "w-1/2" : "w-5/6"}`} />
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {processingStatuses.map((status) => (
          <li key={status} className="rounded-lg bg-linen px-4 py-3 text-sm font-semibold text-ink/72">
            {status}
          </li>
        ))}
      </ul>
    </div>
  );
}
