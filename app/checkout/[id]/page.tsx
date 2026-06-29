import Link from "next/link";
import { Suspense } from "react";
import { CheckoutPaymentForm } from "@/components/CheckoutPaymentForm";
import { getRestorePriceRub } from "@/lib/config";

type CheckoutPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  const priceRub = getRestorePriceRub();

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
          Заявка {id}
        </span>
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="rounded-lg bg-white p-6 shadow-soft sm:p-10">
          <p className="text-base font-bold text-mint">Фото загружено</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Остался последний шаг - оплатить восстановление
          </h1>
          <p className="mt-5 text-lg leading-8 text-ink/82">
            После оплаты мы улучшим фото и покажем готовый результат.
          </p>

          <div className="mt-8 rounded-lg bg-linen p-5">
            <p className="text-lg font-bold text-ink">Восстановление одного фото</p>
            <p className="mt-3 text-4xl font-bold text-ink">{priceRub} ₽</p>
            <p className="mt-4 text-lg leading-8 text-ink/82">
              После оплаты восстановление начнется автоматически. Обычно это занимает около минуты.
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-mint/30 bg-white p-5">
            <p className="text-lg font-bold leading-8 text-ink">
              Если результат получится неудачным, напишите в поддержку - мы попробуем помочь.
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-ink/10 bg-white p-5">
            <p className="text-base leading-7 text-ink/82">
              Оплата проходит через платежную форму ЮKassa. Если в оплате будет указано название
              KARMA, это нормально - сервис работает через платежный аккаунт KARMA.
            </p>
          </div>

          <Suspense fallback={<p className="mt-8 text-lg font-bold text-ink">Готовим оплату...</p>}>
            <CheckoutPaymentForm jobId={id} />
          </Suspense>

          <Link
            href="/restore"
            className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-lg border-2 border-ink/20 bg-white px-6 py-4 text-lg font-bold text-ink transition hover:border-mint hover:text-mint focus:outline-none focus:ring-4 focus:ring-mint/25"
          >
            Загрузить другое фото
          </Link>
        </div>
      </section>
    </main>
  );
}
