import Link from "next/link";

const benefits = [
  "Убираем шум и повреждения",
  "Повышаем четкость",
  "Результат можно скачать сразу"
];

const steps = ["Загрузите фото", "Подождите обработку", "Скачайте результат"];

export function HeroSection() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10">
        <div className="py-10">
          <p className="mb-5 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm">
            AI-реставрация фото
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-ink sm:text-6xl lg:text-7xl">
            Реставрация старых фото онлайн
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72 sm:text-xl">
            Загрузите фото и получите улучшенную версию за пару минут
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/restore"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-coral px-6 py-3 text-base font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#d94d66] focus:outline-none focus:ring-4 focus:ring-coral/25"
            >
              Реставрировать фото
            </Link>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-lg border border-white/70 bg-white/70 px-4 py-4 text-sm font-semibold text-ink/75 shadow-sm"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-white bg-white shadow-soft">
            <img
              src="/demo-result.svg"
              alt="Демо отреставрированной фотографии"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg bg-white/78 p-4 shadow-sm">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-mint text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold leading-5 text-ink/78">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
        <div className="border-t border-ink/10 pt-8">
          <h2 className="text-2xl font-bold">Как это работает</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-lg bg-white/70 p-5 shadow-sm">
                <span className="text-lg font-bold text-coral">{index + 1}</span>
                <span className="font-semibold text-ink/76">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
