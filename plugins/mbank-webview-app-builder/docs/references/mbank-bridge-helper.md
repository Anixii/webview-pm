# MBANK Bridge Helper

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Снимок runtime helper canonical шаблона: `src/shared/mobile-bridge`. Этот helper не поставляется автоматически одной установкой skills.

Этот документ описывает reusable frontend-слой для `window.MBankBridge.invoke`.
Подробный native-контракт остается в `mbank-webview-bridge.md`.

## Цель helper

`src/shared/mobile-bridge` дает два уровня API:

- универсальный `callMobile(type, payload, options)`;
- typed helpers для частых native-действий.

Прямые вызовы `window.MBankBridge.invoke(...)` в feature-коде не использовать.
Feature-код должен импортировать helper из `@shared/mobile-bridge`.

## Основные exports

```ts
import {
  callMobile,
  callMobileResponse,
  closeMobileWebView,
  getMobileBridgeStatus,
  isMobileBridgeInvokeError,
  openDeepLink,
  requestMobileAuth,
  startMobilePayment,
} from '@shared/mobile-bridge'
```

## Startup, guest и auth

В template нет глобального bridge provider, который блокирует запуск приложения или вызывает native action при mount. Проверка bridge и retry происходят в `callMobile` / typed helpers в момент конкретного действия.

`AuthProvider` — opt-in слой для проектов, которым нужен backend auth bootstrap по обычному startup token:

- точный `token=GUEST` означает guest-режим: не вызывать backend auth endpoint, `/auth/me` или `auth.required` автоматически;
- отсутствие token также не должно запускать auth bootstrap из `AuthProvider`;
- если native-авторизация нужна на входе, проект явно вызывает `requestMobileAuth()` из собственного startup gate;
- если guest-пользователь нажимает защищенное действие, экран явно вызывает `requestMobileAuth()` по пользовательскому действию.

Для `auth.required` заранее согласовать capability `authResume` и `redirectUrl`, если он нужен. Этот event не является заменой backend auth по обычному query token.

## Local mock modes (current runtime)

Для локальной разработки bridge можно не поднимать.

По умолчанию на `localhost`, `127.0.0.1`, `0.0.0.0` и `::1` включается mock-режим:

- `callMobile` и typed helpers возвращают успешный mock result;
- `callMobileResponse` возвращает `{ ok: true, result: ... }`.

Режим можно включить query-параметром:

```txt
?mbankBridge=mock
```

Также можно выбрать режим `disabled`:

```txt
?mbankBridge=disabled
```

Поддерживаемые значения:

- mock: `mock`, `1`, `true`;
- disabled: `disabled`, `off`, `0`, `false`.

Сейчас оба query-режима дают helper одинаковый успешный mock result; различается только значение, которое вернет `getMobileBridgeDevMode()`. `disabled` не имитирует `bridgeUnavailable`.

Проверить текущий режим можно так:

```ts
import { getMobileBridgeDevMode } from '@shared/mobile-bridge'

const mode = getMobileBridgeDevMode()
```

Текущая реализация не ограничивает query-параметры окружением. Использовать эти режимы для локальной разработки и debug-сценариев, но не считать их проверкой реального native handler: для release-проверки нужен запуск без `mbankBridge` в MBANK WebView.

Проверка доступности:

```ts
const status = getMobileBridgeStatus()

if (!status.available) {
  // показать friendly fallback или экран "обновите приложение"
}
```

Универсальный вызов:

```ts
await callMobile('share.text', { text: 'Текст для отправки' })
```

`callMobile` возвращает только `result` успешного ответа. Если bridge вернул
`ok: false`, helper логирует ошибку в Sentry и бросает `MobileBridgeInvokeError`.
Ошибка доступна через `try/catch`:

```ts
try {
  await callMobile('share.text', { text: 'Текст для отправки' })
} catch (error) {
  if (isMobileBridgeInvokeError(error)) {
    console.log(error.code)
    console.log(error.details)
    console.log(error.message)
  }
}
```

Если нужно получить raw response без exception, использовать `callMobileResponse`:

```ts
const response = await callMobileResponse('share.text', {
  text: 'Текст для отправки',
})

if (!response.ok) {
  console.log(response.error.code)
  console.log(response.error.details)
}
```

Typed helper:

```ts
await startMobilePayment({
  serviceId: 'license',
  code: applicationId,
  amount: '100',
  resultUrl: 'https://example.kg/payment/result',
})
```

Close WebView:

```ts
import { closeMobileWebView } from '@shared/mobile-bridge'

await closeMobileWebView()
```

В runtime-коде не использовать legacy endpoint `close-app`.
Для закрытия WebView использовать `closeMobileWebView`, который вызывает bridge event `app.close`.

## Покрытые events

В `MobileBridgeEventMap` покрыты базовые events из текущей WebView-базы:

- `app.close`
- `auth.required`
- `payment.start`
- `share.text`
- `pdf.previewUrl`
- `pdf.previewBase64`
- `external.open`
- `deepLink.open`
- `firebaseAnalytics.logEvent`
- `firebaseAnalytics.setUserProperty`
- `adjust.logEvent`
- `biometry.isAvailable`
- `biometry.save`
- `biometry.read`
- `device.report`

Если нужен новый event, сначала получить подтверждённый native-контракт и поддержку MBANK. Затем обновить `MobileBridgeEventMap` и добавить typed helper, если событие будет часто использоваться. Не придумывать event или payload по UI-сценарию.

## Ошибки и retry

`callMobile`:

- проверяет наличие `window.MBankBridge`;
- проверяет `version === 1`;
- для `bridgeUnavailable` делает retry;
- по умолчанию выполняет 3 retry-попытки с задержкой 1 секунда;
- логирует bridge-ошибки в Sentry;
- бросает `MobileBridgeInvokeError`.

Пользователю не показывать technical `error.code`. Для текста использовать friendly message через `getMobileBridgeErrorMessage(code)` или экран/notification уровня сценария.

`getMobileBridgeErrorMessage` возвращает разные friendly-тексты для каждого
bridge error code, чтобы в UI/notification можно было отличать:

- временную недоступность bridge;
- неподдержанную версию приложения;
- неподключенную capability;
- несогласованный origin;
- неверный payload;
- ошибку native handler.

`callMobileResponse` нужен для сценариев, где feature-код сам решает, как
обработать `ok: false`. По умолчанию feature-коду лучше использовать
`callMobile` или typed helper, чтобы ошибки централизованно логировались.

## Типы

Ключевые типы:

- `MobileBridgeEventMap` - карта event -> payload/result.
- `MobileBridgeEventType` - допустимые event type.
- `MobileBridgePayload<TType>` - payload для event.
- `MobileBridgeResult<TType>` - result для event.
- `MobileBridgeErrorCode` - коды bridge-ошибок.
- `MobileBridgeInvokeError` - ошибка, которую бросает helper.
- `isMobileBridgeInvokeError(error)` - type guard для `catch`.

## Правила использования

- Не импортировать и не вызывать `window.flutter_inappwebview.callHandler`.
- Не собирать envelope вручную.
- Не хранить frontend-список capabilities.
- Обрабатывать `missingCapability` как интеграционный/config issue.
- Для старой версии приложения без bridge показывать friendly fallback.
- Для `payment.start` сначала получить подтверждение/данные от backend, затем вызвать bridge.
- URL в payload согласовывать с `allowedOrigins` у MBANK.

## Проверка перед релизом

- Проверить, какие events реально используются экраном.
- Передать MBANK список event type, capabilities и origins.
- Проверить старую версию приложения без bridge.
- Проверить `bridgeUnavailable` retry/fallback.
- Проверить Sentry-события для `response.ok === false`.
- Проверить result/callback для payment, если используется `resultUrl`.
