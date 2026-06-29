import { UploadBox } from "@/components/UploadBox";

export default function RestorePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-10 flex items-center justify-between gap-4">
        <a href="/" className="text-sm font-semibold text-ink/70 transition hover:text-ink">
          На главную
        </a>
        <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/55 shadow-sm">
          Шаг 1 из 3
        </span>
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">Загрузите фото для реставрации</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
            Выберите старую фотографию. В MVP мы покажем демо-обработку и подготовим
            путь для будущего AI API.
          </p>
        </div>
        <UploadBox />
      </section>
    </main>
  );
}
