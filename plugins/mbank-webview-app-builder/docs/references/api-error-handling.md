# API Error Handling

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: частично заполнено на основе текущего template-кода.

Ключевые файлы в template:

- `src/shared/api/rtk-query/lib/queryErrorLogger.ts`
- `src/shared/api/rtk-query/lib/errorUtils.ts`
- `src/shared/api/rtk-query/lib/transformErrorWithSkip.ts`
- `src/shared/api/rtk-query/lib/baseQueryWithRefresh.ts`

## Общий принцип

Ошибки API приходят через RTK Query. Базовая централизованная обработка уже есть в `$rtkQueryErrorLogger`.

Эту логику можно оставить как основу:

- парсить ошибку из RTK Query payload;
- показывать notification через `GlobalNotificationSliceActions.openNotification`;
- пропускать notification для запросов, где ошибка должна обрабатываться на уровне компонента;
- для отдельных кодов показывать отдельный экран;
- не показывать пользователю технические детали.

## Важное UX-правило

Не использовать слово "Ошибка" в пользовательских текстах.

Интерфейс не должен выглядеть так, будто "в нашей WebView ошибка". Лучше использовать info-тональность, info icon и friendly-тексты:

- "Не удалось выполнить действие"
- "Проверьте данные и попробуйте снова"
- "Сервис временно недоступен"
- "Пожалуйста, попробуйте позже"
- "Не удалось провести оплату"

Тип notification для таких случаев может быть `info`.

## Текущий централизованный logger

`$rtkQueryErrorLogger`:

1. Ловит `isRejectedWithValue(action)`.
2. Берет `action.payload`.
3. Проверяет partner error через `logPartnerError(payload.data)`.
4. Проверяет skip notification через `getSkippedNotification(payload)`.
5. Если notification не skipped и это не partner error, извлекает message.
6. Собирает notification по status.
7. Диспатчит `GlobalNotificationSliceActions.openNotification`.

В исходном шаблоне есть доменный пример: partner error с кодом `pledge_module_service_error` ведёт на `/partner-error`. Он не является общим API-контрактом; переносить только при подтверждённой потребности целевого сервиса.

## Skip notification

Если конкретный endpoint должен сам обработать ошибку, использовать skip-механику:

- `transformErrorWithSkip`
- `transformErrorWithSkipStatus`
- `createErrorSkipper`

Такой запрос может:

- не показывать глобальную notification;
- вернуть ошибку компоненту;
- показать inline error;
- показать отдельный screen;
- выполнить кастомную логику.

## Inline vs Screen

Inline/component-level error:

- ошибка относится к конкретному input;
- ошибка ожидаемая и пользователь может исправить данные;
- endpoint имеет свой UX;
- нужно показать код/деталь рядом с конкретным блоком;
- глобальную notification нужно skipped.

Separate error screen:

- критическая ошибка блокирует весь сценарий;
- код ошибки подходит под отдельный экран;
- auth/token flow не может продолжаться;
- partner/service error требует отдельного состояния;
- компонент не может сам восстановить сценарий.

Notification:

- действие не удалось, но пользователь остается на экране;
- 500/server failure;
- временная недоступность;
- некритичная ошибка запроса;
- нет подходящего field-level места.

## Status handling

### 401

Если 401 происходит при первичной авторизации в проекте с подключенным `AuthProvider` и обычным startup token, показывать error/not found screen и просить пользователя перезайти в сервис. Для `GUEST` `AuthProvider` не запускает auth bootstrap.

Если 401 происходит в обычном API-запросе после авторизации, `baseQueryWithRefresh` пытается сделать refresh через backend/cookie flow.

Если refresh вернул 400/401:

- очистить token storage;
- dispatch `authSliceActions.destroyAuth()`;
- дальше сценарий должен уйти в auth/error state.

### 403

Обработка зависит от endpoint.

В некоторых запросах 403 может быть ожидаемым бизнес-состоянием. Тогда нужно skip global notification и обработать ошибку на уровне компонента или экрана.

### 500 / 5xx

Для server errors показывать friendly notification в стиле технических работ:

- title/message: "Технические работы"
- description: "Пожалуйста, попробуйте позже"
- type: `info`

Не писать пользователю "ошибка сервера".

### Network / timeout / parsing

Текущая логика:

- `TIMEOUT_ERROR`: проблема с интернет-соединением.
- `FETCH_ERROR`: нет доступа к интернету или проблема подключения.
- `PARSING_ERROR`: не удалось загрузить данные, сервис обновляется.
- `CUSTOM_ERROR`: не удалось выполнить действие.

Тексты должны оставаться friendly.

## Field validation errors

`getValidationErrors(payload, keys)` в исходном коде собирает ошибки для legacy Ant Form-like структуры. Для новых RHF-форм преобразовать подтверждённый payload backend в `setError` внутри feature hook; не возвращать Ant Design ради этого mapper.

Правило UI:

- field error показывать под input;
- если поле не найдено или ошибка общая, показывать сообщение выше submit button;
- при submit скроллить к первой ошибке.

## Что уточнять для нового endpoint

- Какие статусы endpoint может вернуть.
- Какие ошибки являются field-level.
- Какие ошибки являются business-state и должны обрабатываться компонентом.
- Нужно ли skip global notification.
- Может ли ошибка вести на отдельный screen.
- Какие тексты показывать пользователю.
- Нужно ли логировать ошибку в Sentry.
