# Photo Restore MVP

MVP сайта для AI-реставрации старых фото. Проект показывает полный базовый флоу: главная страница, загрузка изображения, сохранение оригинала в Supabase Storage, создание задачи в `photo_jobs`, запуск fal.ai photo restoration, сохранение результата в Supabase Storage и страница результата.

## Стек

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Storage и Database
- fal.ai
- Готовность к деплою на Vercel

## Установка

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

После запуска сайт будет доступен по адресу:

```text
http://localhost:3000
```

## Проверка

```bash
npm run typecheck
npm run build
```

## Supabase

1. Создайте проект в Supabase.
2. Создайте приватные Storage buckets:
   - `photo-originals`
   - `photo-results`
3. Создайте таблицу `public.photo_jobs` с полями:
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

Если таблица уже создана без `fal_request_id`, выполните:

```sql
alter table public.photo_jobs add column if not exists fal_request_id text;
```

Buckets не должны быть публичными. Оригиналы и результаты открываются только через временные signed URL.

## fal.ai

Используется модель:

```text
fal-ai/image-apps-v2/photo-restoration
```

`FAL_KEY` можно получить в fal.ai dashboard в разделе API keys. Ключ должен храниться только в `.env.local` при локальной разработке и в Vercel Environment Variables на деплое. Не добавляйте `FAL_KEY` в клиентский код и не коммитьте реальные значения.

## Env-переменные

Файл `.env.example` содержит только имена переменных и безопасные примеры. `.env.local` нельзя коммитить.

- `NEXT_PUBLIC_APP_URL` - публичный URL приложения.
- `NEXT_PUBLIC_REVIEWS_URL` - ссылка на страницу или форму отзывов.
- `NEXT_PUBLIC_SUPPORT_URL` - ссылка на техническую поддержку.
- `NEXT_PUBLIC_SUPABASE_URL` - URL проекта Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon key Supabase для будущего browser-клиента.
- `SUPABASE_SERVICE_ROLE_KEY` - service role key Supabase, только для server-side кода.
- `FAL_KEY` - API key fal.ai, только для server-side кода.
- `RESTORE_FLOW_MODE` - режим запуска восстановления: `free` или `payment_required`.
- `RESTORE_PRICE_RUB` - цена восстановления одного фото в рублях. По умолчанию `99`.

Секретные ключи нельзя хранить в коде. Любые сервисные ключи должны использоваться только на сервере.

## Режим запуска восстановления

`RESTORE_FLOW_MODE=free` включает прежний тестовый сценарий: после загрузки фото приложение сразу отправляет задачу на восстановление. Используйте этот режим только для локальной проверки, когда вы понимаете, что каждая обработка может расходовать баланс fal.ai.

`RESTORE_FLOW_MODE=payment_required` готовит публичный сценарий: после загрузки фото пользователь попадает на `/checkout/{jobId}`. В этом режиме fal.ai не запускается до оплаты. Backend дополнительно блокирует `POST /api/jobs/{id}/restore` и возвращает:

```json
{
  "error": "Payment is required before restoration"
}
```

Не деплойте публичную версию в `free`-режиме, если не готовы платить за все запущенные пользователями восстановления.

## Цена и будущая оплата

Базовая цена восстановления одного фото задается через env:

```env
RESTORE_PRICE_RUB=99
```

Реальная оплата пока не подключена: нет платежного SDK, webhook и реальных списаний. Кнопка на checkout-странице сейчас показывает только сообщение о том, что оплата будет подключена на следующем этапе.

Когда появится платежный провайдер, `payment_status=paid` должен выставляться только после server-side подтверждения оплаты, например через webhook платежного сервиса. Нельзя считать оплату успешной по нажатию кнопки на frontend.

Если используется существующий платежный аккаунт KARMA, убедитесь, что юридически и по правилам платежного провайдера можно принимать оплату за услугу восстановления фото.

## API

### `POST /api/jobs/create`

Принимает `multipart/form-data` с полем `file`.

Ограничения:

- MIME type: `image/jpeg`, `image/png`, `image/webp`
- Максимальный размер: 10 МБ

Что делает route:

1. Проверяет тип и размер файла.
2. Генерирует безопасный путь вида `originals/{uuid}.{ext}`.
3. Загружает файл в bucket `photo-originals`.
4. Создает запись в `public.photo_jobs` со статусом `uploaded`.
5. Возвращает `jobId`.

### `POST /api/jobs/{id}/restore`

Запускает реставрацию только если `RESTORE_FLOW_MODE=free`.

1. Находит задачу.
2. Проверяет, что статус `uploaded` или `failed`.
3. Создает signed URL оригинала.
4. Отправляет фото в fal.ai queue.
5. Сохраняет `fal_request_id`.
6. Обновляет статус на `processing`.

Если `RESTORE_FLOW_MODE=payment_required`, route не запускает fal.ai и не переводит задачу в `processing`.

### `GET /api/jobs/{id}`

Возвращает текущий статус задачи. Если fal.ai уже завершил обработку:

1. Получает URL результата.
2. Скачивает готовое изображение.
3. Сохраняет его в bucket `photo-results` по пути `results/{jobId}.{ext}`.
4. Обновляет `result_path` и статус `done`.
5. Возвращает signed URL результата.

## Текущий MVP-флоу

1. Пользователь открывает главную страницу.
2. Нажимает кнопку "Реставрировать фото".
3. Переходит на `/restore` и выбирает изображение.
4. Фото загружается в Supabase Storage.
5. В `photo_jobs` создается задача.
6. В `free`-режиме запускается fal.ai реставрация.
7. В `payment_required`-режиме пользователь переходит на `/checkout/{jobId}`.
8. В `free`-режиме frontend опрашивает `GET /api/jobs/{jobId}` каждые 3 секунды.
9. После `status = done` пользователь переходит на `/result/{jobId}`.
10. Страница результата показывает реальное фото через signed URL.

## Как проверить полный flow

1. Заполните `.env.local`.
2. Запустите `npm run dev`.
3. Откройте `/restore`.
4. Загрузите JPG, PNG или WEBP до 10 МБ.
5. Дождитесь завершения обработки.
6. Проверьте, что оригинал появился в `photo-originals`.
7. Проверьте, что результат появился в `photo-results`.
8. Проверьте, что в `photo_jobs` заполнены `fal_request_id`, `result_path`, а `status = done`.
9. Откройте `/result/{jobId}` и проверьте изображение, скачивание и открытие в полном размере.

## Что не подключено в MVP

- Оплата
- Регистрация
- Личный кабинет
- Админка
- Тарифы
- Prisma
- Дополнительные AI-провайдеры
