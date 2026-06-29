# Photo Restore MVP

MVP сайта для восстановления старых семейных фотографий от KARMA. Проект покрывает flow: главная страница, загрузка фото, создание задачи в Supabase, checkout через ЮKassa, подтверждение оплаты server-side, запуск восстановления через fal.ai только после оплаты и показ результата.

## Стек

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Storage и Database
- YooKassa redirect payments
- fal.ai photo restoration
- Vercel-ready

## Установка

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

Сайт будет доступен по адресу:

```text
http://localhost:3000
```

## Проверка

```bash
npm run typecheck
npm run build
```

## Env-переменные

`.env.example` содержит только имена переменных и безопасные примеры. Реальные ключи храните только в `.env.local` локально и в Vercel Environment Variables на деплое. `.env.local` нельзя коммитить.

- `NEXT_PUBLIC_APP_URL` - публичный URL приложения.
- `NEXT_PUBLIC_REVIEWS_URL` - ссылка на отзывы.
- `NEXT_PUBLIC_SUPPORT_URL` - ссылка на техническую поддержку.
- `NEXT_PUBLIC_SUPABASE_URL` - URL проекта Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon key Supabase для будущего browser-клиента.
- `SUPABASE_SERVICE_ROLE_KEY` - service role key Supabase, только server-side.
- `FAL_KEY` - API key fal.ai, только server-side.
- `RESTORE_FLOW_MODE` - `free` или `payment_required`.
- `RESTORE_PRICE_RUB` - цена восстановления одного фото в рублях, сейчас `99`.
- `YOOKASSA_SHOP_ID` - shopId из личного кабинета ЮKassa.
- `YOOKASSA_SECRET_KEY` - секретный ключ ЮKassa, только server-side.
- `YOOKASSA_RETURN_URL` - базовый URL возврата, например `http://localhost:3000/checkout`.
- `YOOKASSA_VAT_CODE` - код НДС для чека, если используется фискализация.
- `YOOKASSA_WEBHOOK_SECRET` - optional секрет для будущей дополнительной проверки webhook, если схема заголовка подтверждена.

```env
RESTORE_FLOW_MODE=payment_required
RESTORE_PRICE_RUB=99
YOOKASSA_RETURN_URL=http://localhost:3000/checkout
```

Не деплойте публичную версию в `RESTORE_FLOW_MODE=free`, если не готовы оплачивать все запущенные пользователями восстановления.

## Supabase

Создайте приватные Storage buckets:

- `photo-originals`
- `photo-results`

Buckets не должны быть публичными. Оригиналы и результаты открываются только через временные signed URL.

Таблица `public.photo_jobs` должна содержать базовые поля задачи:

- `id`
- `status`
- `original_path`
- `result_path`
- `original_filename`
- `original_mime_type`
- `original_size_bytes`
- `error_message`
- `fal_request_id`
- `created_at`
- `updated_at`

Для fal.ai и оплаты выполните SQL:

```sql
alter table public.photo_jobs add column if not exists fal_request_id text;

alter table public.photo_jobs
add column if not exists payment_status text not null default 'unpaid'
check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

alter table public.photo_jobs
add column if not exists price_rub integer;

alter table public.photo_jobs
add column if not exists payment_provider text;

alter table public.photo_jobs
add column if not exists payment_id text;

alter table public.photo_jobs
add column if not exists payment_confirmation_url text;

alter table public.photo_jobs
add column if not exists paid_at timestamptz;

alter table public.photo_jobs
add column if not exists customer_email text;

alter table public.photo_jobs
add column if not exists customer_phone text;
```

## YooKassa payment flow

Пользователь загружает фото и попадает на `/checkout/{jobId}`. На checkout он видит цену `99 ₽`, вводит email или телефон для чека и нажимает “Оплатить восстановление”.

`POST /api/payments/yookassa/create`:

1. Принимает `jobId`, `email` и/или `phone`.
2. Находит задачу в Supabase.
3. Не создает новый платеж, если задача уже `paid`.
4. Возвращает существующий pending payment, если он уже создан.
5. Создает redirect payment в ЮKassa через server-side API.
6. Использует Basic Auth и `Idempotence-Key`.
7. Сохраняет `payment_status=pending`, `payment_provider=yookassa`, `payment_id`, `payment_confirmation_url`, цену и контакт.
8. Возвращает `confirmationUrl`, на который frontend перенаправляет пользователя.

Если `YOOKASSA_VAT_CODE` задан, он валидируется как число от 1 до 12. Тогда в платеж добавляется `receipt` с контактом клиента и услугой `Восстановление фото`. Если фискализация не используется, оставьте `YOOKASSA_VAT_CODE` пустым.

`YOOKASSA_SECRET_KEY` не попадает в клиентский код и не должен выводиться в логи.

## YooKassa webhook

Webhook URL:

```text
/api/payments/yookassa/webhook
```

Подключите события:

- `payment.succeeded`
- `payment.canceled`

Webhook не считается единственным источником правды. Route берет `object.id`, затем server-side запрашивает платеж через API ЮKassa и проверяет:

- статус платежа действительно `succeeded`;
- `paid === true`;
- в `metadata.jobId` есть id задачи;
- `metadata.service === karma_photo_restore`;
- сумма совпадает с `RESTORE_PRICE_RUB`;
- валюта `RUB`.

Только после этой проверки задача получает `payment_status=paid` и `paid_at`. Затем backend запускает восстановление через fal.ai, если задача еще `uploaded` или `failed`. Если задача уже `processing` или `done`, повторный запуск не выполняется.

`YOOKASSA_WEBHOOK_SECRET` сейчас не используется как обязательная защита, потому что в текущей схеме нет подтвержденного документированного заголовка подписи. Основная защита - server-side перепроверка платежа через API ЮKassa по `payment_id`.

## Проверка оплаты после возврата

Локально webhook может не дойти без публичного URL. После возврата пользователя с ЮKassa checkout вызывает:

```text
POST /api/payments/yookassa/check
```

Endpoint принимает `{ "jobId": "..." }`, находит `payment_id`, запрашивает платеж в ЮKassa и применяет ту же server-side логику подтверждения, что webhook. Frontend не может поставить `payment_status=paid`.

Для локальной проверки webhook используйте публичный URL через ngrok или аналогичный туннель. Не создавайте реальные платежи, если env указывают на боевую кассу.

## fal.ai

Используется модель:

```text
fal-ai/image-apps-v2/photo-restoration
```

`FAL_KEY` можно получить в fal.ai dashboard в разделе API keys. Ключ хранится только в `.env.local` и Vercel env.

В `RESTORE_FLOW_MODE=payment_required` fal.ai не запускается до `payment_status=paid`. В `RESTORE_FLOW_MODE=free` восстановление запускается сразу после загрузки фото, поэтому этот режим подходит только для локального тестирования.

## API

### `POST /api/jobs/create`

Принимает `multipart/form-data` с полем `file`.

Ограничения:

- MIME type: `image/jpeg`, `image/png`, `image/webp`
- максимальный размер: 10 МБ

Создает файл в `photo-originals` и запись в `photo_jobs` со статусом `uploaded`.

### `POST /api/jobs/{id}/restore`

Запускает восстановление:

- в `free`-режиме - как раньше;
- в `payment_required` - только если `payment_status=paid`.

Если оплаты нет, route возвращает `402`:

```json
{
  "error": "Payment is required before restoration"
}
```

### `GET /api/jobs/{id}`

Возвращает:

- `id`
- `status`
- `payment_status`
- `resultUrl`, если результат готов
- `error`, если есть ошибка

Если задача `processing`, route проверяет fal.ai status и при готовности сохраняет результат в `photo-results`.

## Полный flow

1. Пользователь открывает главную страницу.
2. Переходит на `/restore`.
3. Загружает JPG, PNG или WEBP до 10 МБ.
4. В `payment_required` попадает на `/checkout/{jobId}`.
5. Вводит email или телефон для чека.
6. Backend создает платеж ЮKassa.
7. Пользователь оплачивает на странице ЮKassa.
8. Webhook или `/api/payments/yookassa/check` подтверждает платеж через API ЮKassa.
9. Только после подтверждения backend запускает восстановление.
10. После `status=done` пользователь переходит на `/result/{jobId}`.

## Что не входит в MVP

- регистрация
- личный кабинет
- публичная админка
- тарифы и пакеты
- Prisma
- дополнительные AI-провайдеры
