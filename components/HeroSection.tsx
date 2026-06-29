import Link from "next/link";

const benefits = [
  "Простая загрузка без лишних настроек",
  "Улучшаем четкость и убираем шум",
  "Готовое фото можно скачать",
  "Если результат получился неудачным - поможем в поддержке"
];

const steps = ["Выберите фото", "Подождите обработку", "Скачайте готовый результат"];

type HeroSectionProps = {
  priceRub: number;
};

export function HeroSection({ priceRub }: HeroSectionProps) {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-[92vh] w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
        <div className="py-8">
          <p className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-base font-bold text-ink shadow-sm">
            Сервис восстановления фото от KARMA
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-ink sm:text-6xl lg:text-7xl">
            Восстановим старое семейное фото
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink sm:text-xl">
            Загрузите фотографию, а мы улучшим качество, сделаем снимок четче
            и подготовим результат для скачивания.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/80 sm:text-lg">
            Подходит для старых фото родителей, бабушек и дедушек, свадебных,
            детских и семейных снимков.
          </p>
          <div className="mt-6 rounded-lg border border-white bg-white/90 p-5 shadow-sm">
            <p className="text-xl font-bold text-ink">
              Восстановление одного фото - {priceRub} ₽
            </p>
            <p className="mt-2 text-base leading-7 text-ink/82">
              Сначала загрузите фото, затем оплатите восстановление.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/restore"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-coral px-7 py-4 text-lg font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#9f4c4c] focus:outline-none focus:ring-4 focus:ring-coral/30 sm:w-auto"
            >
              Восстановить фото
            </Link>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-lg border border-white bg-white/88 px-5 py-5 text-base font-bold leading-6 text-ink shadow-sm"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-white bg-white p-3 shadow-soft">
            <img
              src="/demo-result.svg"
              alt="Пример восстановленного семейного фото"
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-mint text-base font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-base font-bold leading-6 text-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Как это работает</h2>
            <ol className="mt-6 grid gap-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-lg bg-linen p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-base font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-lg font-bold text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg bg-white p-6 shadow-soft sm:p-8">
              <h2 className="text-2xl font-bold text-ink">Не нужно разбираться в программах</h2>
              <p className="mt-4 text-lg leading-8 text-ink/82">
                Сервис сделан так, чтобы все было понятно: выберите фото,
                дождитесь обработки и скачайте готовый результат.
              </p>
            </div>
            <div className="rounded-lg border border-coral/20 bg-white p-6 shadow-soft sm:p-8">
              <h2 className="text-2xl font-bold text-ink">
                Сильно поврежденные фото могут восстановиться не идеально
              </h2>
              <p className="mt-4 text-lg leading-8 text-ink/82">
                Если снимок очень размытый или часть лица сильно повреждена,
                результат может быть неидеальным. В таком случае напишите в
                поддержку - мы подскажем, что можно сделать.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
