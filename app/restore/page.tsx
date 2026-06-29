import Link from "next/link";
import { UploadBox } from "@/components/UploadBox";

export default function RestorePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-base font-bold text-ink transition hover:text-coral focus:outline-none focus:ring-4 focus:ring-coral/25"
        >
          На главную
        </Link>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm">
          Шаг 1 из 3
        </span>
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Загрузите фото для восстановления
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-ink/82">
            Выберите старую фотографию с компьютера или телефона. Подойдут JPG,
            PNG или WEBP до 10 МБ.
          </p>
        </div>
        <UploadBox />
      </section>
    </main>
  );
}
