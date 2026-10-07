# MBANK WebView Bridge

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Источник: `web_view_bridge_partner_guide.docx`, переданный пользователем 3 июля 2026.

Статус: новая целевая реализация для native-действий. Bridge должен быть доступен на всех WebView с 3 августа 2026.

После rollout legacy URL/AJAX-перехваты перестают работать для новых WebView. Новые WebView должны выполнять native-действия через bridge.

## Ключевая идея

`MBANK WebView Bridge` - контролируемый контракт между web-страницей внутри мобильного WebView и приложением MBANK.

Основная точка входа для фронта:

```ts
window.MBankBridge.invoke(type, payload)
```

Feature-код должен использовать reusable helper (в canonical шаблоне —
`src/shared/mobile-bridge`), а не обращаться к `window.MBankBridge` напрямую.
Практические правила helper описаны в `mbank-bridge-helper.md`.

В bridge-режиме:

- фронт не переписывает URL для запуска native-действий;
- мобильное приложение не слушает произвольные AJAX/URL-сценарии;
- web-страница вызывает только заранее разрешенные event type;
- приложение проверяет `origin`, `nonce`, версию протокола и capabilities;
- каждая WebView-сессия получает отдельный `nonce` и список разрешенных capabilities;
- старые версии приложения без bridge не поддерживают новые native-действия.

## Что bridge не меняет

По ответу техподдержки:

- query parameters, включая `token`, `theme`, `lang`, продолжают приходить в том же месте;
- первичная авторизация остается такой же, как в старой схеме: WebView получает `token` в query, frontend вызывает свой backend auth endpoint, backend авторизует пользователя и ставит свои cookies;
- вызовы роутов остаются такими же;
- bridge добавляет новый способ native-действий: закрытие WebView, deeplinks, payment, PDF preview, external links и другие events;
- guest-режим остается решением конкретного сервиса: frontend/backend сами определяют, доступен ли сценарий без авторизации.

`auth.required` не заменяет базовый вход по query token. Его нужно рассматривать как дополнительный bridge-event для сценариев, где WebView хочет явно попросить приложение запустить авторизацию и вернуться в WebView.

`token=GUEST` сам по себе не должен автоматически запускать `auth.required` или backend auth. Если guest-пользователь выполняет защищенное действие, экран может явно вызвать `requestMobileAuth()` из `@shared/mobile-bridge`. Проект, которому native-авторизация нужна сразу при входе, добавляет собственный явный startup gate.

## Доступность

Проверки:

- `window.MBankBridge` существует - WebView получила новый bridge-скрипт.
- `window.MBankBridge.version === 1` - текущая версия JS-контракта.
- Объекта нет - старая версия приложения, обычный браузер или legacy-сценарий.
- Ошибка `bridgeUnavailable` - Flutter handler еще не готов или WebView не bridge-режима.

Фронт должен проверять наличие bridge перед критичными native-действиями и иметь fallback или понятное сообщение.

Если у пользователя старая версия приложения без `window.MBankBridge`, нужно показать экран/сообщение с просьбой обновить приложение. Legacy fallback для новых WebView не используется.

Для `bridgeUnavailable` допустим retry, например несколько повторных попыток после загрузки страницы, прежде чем показывать fallback.

Стандарт retry для `bridgeUnavailable`: 3 попытки с задержкой 1 секунда между попытками.

## Формат ответа

Успех:

```json
{
  "ok": true,
  "id": "message-id",
  "result": {
    "status": "ok"
  }
}
```

Ошибка:

```json
{
  "ok": false,
  "id": "message-id",
  "error": {
    "code": "missingCapability",
    "message": "Runtime config does not allow this bridge capability.",
    "details": {
      "required": ["payments"]
    }
  }
}
```

## Security rules

- В feature-коде использовать только `@shared/mobile-bridge` и typed helpers; прямой `window.MBankBridge.invoke(...)` допустим только внутри shared helper.
- Не вызывать `window.flutter_inappwebview.callHandler(...)` напрямую.
- Не собирать envelope вручную.
- Каждый вызов проверяется по `nonce`.
- Origin страницы должен быть разрешен в `allowedOrigins`.
- Каждый метод требует capability.
- URL payload для `auth.required`, `payment.start.resultUrl`, `pdf.previewUrl`, `external.open` должен быть `http/https` и принадлежать разрешенному origin.
- `deepLink.open` принимает URI со схемой, например `mbank://...`, но origin самой страницы все равно валидируется.
- Лимит text payload: `100000` символов.
- Лимит base64 PDF payload: `5242880` символов.

## Capabilities и events

Базовых capabilities "по умолчанию" нет. Для каждого сервиса нужно заранее запросить у MBANK только те capabilities, которые реально нужны проекту.

Capabilities и `allowedOrigins` заводит техподдержка MBANK. Для dev/test/prod origins нужно заводить отдельные значения.

Фронт не обязан хранить список выданных capabilities. Нужно вызывать нужный bridge event и обрабатывать `missingCapability`.

| Capability      | Events                                                            | Назначение                                               |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `close`         | `app.close`                                                       | Закрыть WebView и вернуть result в мобильное приложение. |
| `authResume`    | `auth.required`                                                   | Запустить авторизацию и вернуться в WebView.             |
| `payments`      | `payment.start`                                                   | Открыть мобильный платежный flow.                        |
| `share`         | `share.text`                                                      | Открыть системный share sheet.                           |
| `pdfPreview`    | `pdf.previewUrl`, `pdf.previewBase64`                             | Показать PDF во встроенном просмотрщике.                 |
| `analytics`     | `firebaseAnalytics.logEvent`, `firebaseAnalytics.setUserProperty` | Отправить Firebase Analytics event/property.             |
| `adjust`        | `adjust.logEvent`                                                 | Отправить событие Adjust.                                |
| `biometry`      | `biometry.isAvailable`, `biometry.save`, `biometry.read`          | Работа с biometric storage.                              |
| `deviceReport`  | `device.report`                                                   | Получить antifraud device report.                        |
| `externalLinks` | `external.open`                                                   | Открыть внешний `http/https` URL.                        |
| `deepLinks`     | `deepLink.open`                                                   | Открыть deeplink внутри app-links flow.                  |

В базовом typed bridge helper template нужно поддержать все события из таблицы, включая `share`, analytics, adjust, biometry и `device.report`. Но capabilities все равно запрашиваются у MBANK под конкретный сервис.

## Event payloads

### `app.close`

Capability: `close`.

Закрывает WebView и возвращает payload как result в мобильную навигацию.

Payload может быть любым JSON-объектом.

Стандарт payload/result - как в документации event. Конкретные поля (`status`, `orderId`, `reason`) задаются сценарием проекта.

### `auth.required`

Capability: `authResume`.

Сообщает приложению, что пользователю нужна авторизация, затем приложение возвращает пользователя в WebView.

Вызывать event только как явное решение сценария: из project startup gate или по защищенному пользовательскому действию. Не вызывать его автоматически только потому, что startup token равен `GUEST`.

Payload:

- `redirectUrl?: string` - URL возврата после авторизации. Если передан, должен быть `http/https` и принадлежать `allowedOrigins`.

### `payment.start`

Capability: `payments`.

Открывает мобильный платежный flow MBANK.

Практический flow: frontend сначала вызывает backend endpoint подготовки/подтверждения платежа. После успешного ответа backend frontend вызывает `payment.start` с реквизитами для мобильного платежного flow.

Payload:

- `serviceId: string` - идентификатор сервиса/операции.
- `code: string` - основной реквизит/код, передается в `PARAM1` и блокируется для редактирования.
- `amount?: string` - сумма. Если не передана или не парсится как число, сумма остается доступной для ввода.
- `resultUrl?: string` - callback URL после платежа. Должен быть `http/https` и принадлежать `allowedOrigins`.
- `parameters?: object` - дополнительные prefill-параметры платежной формы.

### `share.text`

Capability: `share`.

Payload:

- `text: string` - текст для системного share sheet, максимум `100000` символов.

### `pdf.previewUrl`

Capability: `pdfPreview`.

Payload:

- `url: string` - абсолютный `http/https` URL PDF. Origin должен быть разрешен.

Предпочтительный способ PDF preview - `pdf.previewUrl`.

### `pdf.previewBase64`

Capability: `pdfPreview`.

Payload:

- `base64: string` - base64 содержимое PDF, максимум `5242880` символов.
- `fileName?: string` - имя файла принято контрактом, текущая реализация может его не использовать.

Можно реализовать как дополнительный вариант, но основной предпочтительный путь - preview по URL.

### `external.open`

Capability: `externalLinks`.

Payload:

- `url: string` - абсолютный `http/https` URL. Origin должен быть разрешен.

Внешние ссылки, включая сценарии вроде WhatsApp, решаются через capabilities/origin. Отдельная старая схема согласования URL-перехвата для новых WebView не используется.

### `deepLink.open`

Capability: `deepLinks`.

Payload:

- `url: string` - URI со схемой, например `mbank://some/path?source=partner`.

### Analytics, Adjust, Biometry, Device Report

- `firebaseAnalytics.logEvent`: `name: string`, `parameters?: object`.
- `firebaseAnalytics.setUserProperty`: `name: string`, `value: string`.
- `adjust.logEvent`: `token: string`, `key: string`, `value?: string`.
- `biometry.isAvailable`: без payload или пустой object, result `{ available: boolean }`.
- `biometry.save`: `value: any`, текущая реализация приводит value к строке.
- `biometry.read`: без payload или пустой object, result `{ value: string | null }`.
- `device.report`: без payload или пустой object, result `{ report: string | null }`.

## Ошибки bridge

| Code                 | Когда возникает                                                                  | Что делать фронту                                           |
| -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `bridgeUnavailable`  | Handler еще не готов или WebView не bridge-режима.                               | Повторить позже или использовать fallback.                  |
| `invalidEnvelope`    | Неверная структура сообщения.                                                    | При `invoke` обычно не возникает; проверить payload object. |
| `invalidPayload`     | Нет обязательного поля, неверный тип, URL некорректный, payload слишком большой. | Исправить payload.                                          |
| `unsupportedVersion` | Версия протокола не поддерживается.                                              | Проверить version и fallback.                               |
| `unsupportedAction`  | Event type неизвестен или native handler не зарегистрирован.                     | Проверить event type и поддержку приложения.                |
| `forbiddenOrigin`    | Origin страницы или URL payload не разрешен.                                     | Согласовать origin с MBANK.                                 |
| `invalidNonce`       | Некорректный nonce.                                                              | Использовать только `MBankBridge.invoke`.                   |
| `missingCapability`  | Capability не разрешена.                                                         | Запросить включение capability.                             |
| `duplicateMessage`   | Такой id уже обработан.                                                          | Не переиспользовать внутренние id.                          |
| `handlerFailed`      | Native handler упал.                                                             | Показать fallback и передать details в диагностику.         |

Пользовательские сообщения должны быть user-friendly, без технических слов вроде `missingCapability`, `forbiddenOrigin`, `handlerFailed`.

Bridge-ошибки логировать в Sentry. Технические `error.code` и `error.details` предназначены для диагностики, а не для показа пользователю.

## Перед релизом

- Согласовать с MBANK все используемые event type.
- Передать все domain origins для `allowedOrigins`.
- Согласовать capabilities.
- Проверять наличие `window.MBankBridge`.
- Логировать `response.ok === false` с `error.code` и `error.details`.
- Для `payment.start` проверить callback через `resultUrl`, если используется.
- Для PDF проверить доступность URL или лимит base64.
- Для analytics/adjust согласовать события с аналитиками.
- Для старых версий приложения проверить экран/сообщение с просьбой обновить приложение.
- Тестового стенда для проверки всех bridge events сейчас нет; проверку нужно планировать по доступным средам проекта и ручным сценариям.

## Что передать MBANK для подключения

- Origin страницы, например `https://partner.example.kg`.
- Список capabilities.
- Список event type.
- Callback/result URL, если используется.
- Fallback для старых приложений: для новых WebView показывать просьбу обновить приложение, если bridge недоступен из-за старой версии приложения.
