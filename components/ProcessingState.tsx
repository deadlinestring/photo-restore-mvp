type ProcessingStateProps = {
  fileName: string;
  mode?: "uploading" | "processing";
};

const processingStatuses = [
  "Фото принято",
  "Улучшаем четкость",
  "Убираем шум",
  "Готовим файл для скачивания"
];

export function ProcessingState({ fileName, mode = "processing" }: ProcessingStateProps) {
  const isUploading = mode === "uploading";

  return (
    <div
      className="rounded-lg border border-white bg-white p-6 shadow-soft sm:p-8"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-6 h-20 w-20 animate-spin rounded-full border-4 border-mint/25 border-t-mint" />
      <div className="text-center">
        <p className="text-base font-bold text-mint">
          {isUploading ? "Загружаем фото..." : "Восстанавливаем фото"}
        </p>
        <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
          Восстанавливаем ваше фото
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-ink/82">
          {fileName ? `Файл «${fileName}» загружен. ` : ""}
          Пожалуйста, не закрывайте страницу. Обычно это занимает около минуты.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        <div className={`h-3 rounded-full bg-coral ${isUploading ? "w-1/2" : "w-5/6"}`} />
      </div>

      {!isUploading ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {processingStatuses.map((status) => (
            <li key={status} className="rounded-lg bg-linen px-4 py-3 text-base font-bold text-ink">
              {status}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
