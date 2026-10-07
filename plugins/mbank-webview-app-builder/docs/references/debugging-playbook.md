# Debugging Playbook

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: базовый стандарт для bug reporter/debugger агента.

Цель: агент должен структурированно разобрать баг, объяснить причину простыми словами, показать где искать в коде/документации и предложить вариант решения с проверкой.

## Принцип работы

Агент не должен сразу гадать фикс. Сначала он собирает минимальный контекст, классифицирует проблему, проверяет релевантные docs/code и только потом предлагает решение.

Ответ должен быть формальным, но понятным: без лишней воды, без драматизации, с конкретными ссылками на файлы, компоненты, endpoint-ы или reference docs.

## Что спросить, если данных мало

Задавать не все вопросы сразу, а только те, без которых нельзя нормально понять баг.

Минимальный набор:

1. Где баг: экран, route, компонент, flow?
2. Что сделал пользователь: шаги воспроизведения?
3. Что ожидали увидеть?
4. Что произошло фактически?
5. Повторяется всегда или иногда?
6. Платформа: iOS, Android, браузер, версия приложения MBANK, если известно?
7. Есть ли скрин, видео, network response, Sentry issue, console log?
8. Это случилось после изменения frontend, backend, MBANK config/capabilities или дизайна?

Если баг связан с WebView/bridge, дополнительно спросить:

- есть ли `window.MBankBridge`;
- какой event type вызвали;
- какой payload;
- какой `response.ok`, `error.code`, `error.details`;
- подключена ли нужная capability;
- какой origin у страницы.

Если баг связан с формой:

- какие поля заполнены;
- какие validation/API errors пришли;
- это простая submit-form или editable/autosave-form;
- есть ли Redux initialState и `onValuesChange`.

## Как классифицировать баг

### UI bug

Признаки:

- визуально не так выглядит;
- элементы перекрываются;
- safe area/keyboard ломают layout;
- loading/empty/error state выглядит неправильно;
- текст не помещается;
- fixed bottom action перекрывает контент.

Смотреть:

- `ui-best-practices.md`
- `ui-component-inventory.md`
- конкретный component/page в `src/pages`, `src/modules`, `src/shared/ui`.

### API / RTK Query bug

Признаки:

- запрос падает;
- notification появилась не там;
- ошибка должна быть inline, но стала global;
- 401/403/500 обработался неправильно;
- нужно skip notification.

Смотреть:

- `api-error-handling.md`
- `src/shared/api/rtk-query/lib/queryErrorLogger.ts`
- `src/shared/api/rtk-query/lib/errorUtils.ts`
- `src/shared/api/rtk-query/lib/transformErrorWithSkip.ts`
- `src/shared/api/rtk-query/lib/baseQueryWithRefresh.ts`

### Auth / Token bug

Признаки:

- нет token;
- `token=GUEST` обработан неправильно;
- для `GUEST` неожиданно вызвался auth endpoint или `auth.required`;
- для обычного token не вызвался ожидаемый auth endpoint;
- не сработал явный startup gate или protected-action вызов `requestMobileAuth()`;
- 401 при первичной авторизации;
- refresh не сработал;
- пользователь не попал в нужный auth/error state.

Смотреть:

- `legacy-webview-integration.md`
- `mbank-webview-bridge.md`
- `src/app/providers/TokenProvider/`
- `src/modules/Auth/components/AuthProvider.tsx`
- storage слой `src/shared/libs/storage/`

### Bridge bug

Признаки:

- не закрывается WebView;
- не открывается payment/deeplink/pdf/external link;
- `window.MBankBridge` отсутствует;
- `response.ok === false`;
- ошибки `bridgeUnavailable`, `missingCapability`, `forbiddenOrigin`, `invalidPayload`, `handlerFailed`.

Смотреть:

- `mbank-webview-bridge.md`
- Sentry logs;
- место вызова bridge helper;
- payload и event type;
- MBANK capabilities/allowedOrigins.

### Form bug

Признаки:

- validation не показывается;
- ошибка не скроллит к input;
- API error не мапится на поле;
- submit можно нажать несколько раз;
- editable/autosave-form теряет state;
- Redux initialState вызывает лишние рендеры;
- `onValuesChange` слишком часто дергает запрос.

Смотреть:

- `forms-best-practices.md`
- form component;
- Redux slice/state;
- submit handler;
- API endpoint и error mapping.

### Navigation bug

Признаки:

- back ведет не туда;
- close не закрывает WebView;
- route stack сломан;
- после deeplink пользователь не возвращается куда ожидалось;
- stepper не сохраняет шаг/данные.

Смотреть:

- `navigation-best-practices.md`
- route config;
- `navigate(-1)`, `replace`, stepper state;
- bridge event `app.close` или `deepLink.open`.

## Как объяснять причину простыми словами

Формула:

1. Что сломалось: одно короткое предложение.
2. Почему это могло случиться: связь между симптомом и механизмом.
3. Где это находится: файл, компонент, endpoint, bridge event или config.
4. Что сделать: конкретный вариант решения.
5. Как проверить: ручной сценарий или команда.

Пример тона:

> Проблема не в кнопке как UI-элементе. Кнопка отправляет действие повторно, потому что во время submit состояние loading не блокирует повторный клик. Нужно disabled-состояние на время запроса и проверка, что повторный submit не уходит в API.

Не писать:

- "все сломано";
- "ошибка непонятная";
- "надо просто переписать";
- технический код без объяснения.

## Формальный формат bug report

Использовать такой формат, когда пользователь просит оформить баг или когда нужно передать задачу разработчику.

```md
## Summary

Коротко, что сломалось и где.

## Environment

- Platform:
- App/WebView version:
- Route/screen:
- User state: guest/authenticated/unknown

## Steps to Reproduce

1. ...
2. ...
3. ...

## Expected Result

Что должно было произойти.

## Actual Result

Что произошло фактически.

## Impact

На что влияет: блокирует flow, ломает оплату, мешает форме, визуальный дефект и т.д.

## Likely Area

UI / API / Auth / Bridge / Form / Navigation.

## Evidence

- Logs:
- Network:
- Sentry:
- Screenshot/video:
- Related files:

## Suspected Cause

Короткое объяснение причины простыми словами.

## Proposed Fix

Конкретный вариант решения.

## Verification

Как проверить фикс вручную или тестами.

## References

- docs/...
- src/...
```

## Как писать "что сделать"

Вариант решения должен быть конкретным:

- какой файл/компонент смотреть;
- какую ветку логики поменять;
- какой status/code обработать;
- где добавить skip notification;
- где показать inline error;
- где вызвать bridge helper;
- где добавить disabled/loading state.

Не писать только "пофиксить обработку ошибки". Нужно описать, что именно поменять.

## Как писать "как проверить"

Проверка должна быть воспроизводимой:

- шаги руками в WebView;
- проверка iOS/Android, если баг платформенный;
- network/API сценарий;
- проверка Sentry/logs;
- проверка bridge response;
- проверка form validation/scroll/submit;
- команда проекта, если менялся код.

Для документационных задач команды не нужны. Для runtime-кода выбирать минимальную проверку: чаще `yarn lint:type`, для UI/build-risk - `yarn build`.

## Bridge-first диагностика

Для новых WebView после rollout `MBANK WebView Bridge` сначала проверять:

1. Есть ли `window.MBankBridge`.
2. Какая `window.MBankBridge.version`.
3. Какой event type вызывается.
4. Какая capability нужна.
5. Разрешен ли origin страницы.
6. Является ли payload object и соответствует ли контракту event.
7. Что вернул bridge: `response.ok`, `error.code`, `error.details`.
8. Ушел ли технический error в Sentry.

## Частые bridge-ошибки

- `bridgeUnavailable` - handler не готов, WebView не bridge-режима или обычный браузер.
- `invalidPayload` - нет обязательных полей, неверный тип, неверный URL, слишком большой payload.
- `forbiddenOrigin` - origin страницы или payload URL не разрешен.
- `missingCapability` - capability не подключена для WebView.
- `unsupportedAction` - event type неизвестен или не зарегистрирован.
- `handlerFailed` - native handler упал.

Пользователю нельзя показывать технические bridge-коды. Для пользователя нужны дружелюбные сообщения без слов `capability`, `origin`, `handler`, `nonce`.

Для `bridgeUnavailable` делать 3 retry-попытки с задержкой 1 секунда перед показом fallback.

Если `window.MBankBridge` отсутствует в новой WebView, показывать просьбу обновить приложение.

## API / RTK Query диагностика

Для API errors сначала смотреть текущую централизованную обработку:

- `src/shared/api/rtk-query/lib/queryErrorLogger.ts`
- `src/shared/api/rtk-query/lib/errorUtils.ts`
- `src/shared/api/rtk-query/lib/transformErrorWithSkip.ts`
- `src/shared/api/rtk-query/lib/baseQueryWithRefresh.ts`

Базовый вопрос: ошибка должна быть глобальной notification, inline/component-level состоянием или отдельным error screen.

Если endpoint сам должен обработать ошибку, проверить skip notification через `transformErrorWithSkipStatus` / `createErrorSkipper`.

Пользовательские тексты не должны содержать слово "Ошибка". Использовать info icon и friendly-тональность.

Подробнее: `api-error-handling.md`.

## Legacy-диагностика

Если проект работает по старой схеме, проверять:

- query params на входе;
- сохранение token/lang/theme в `sessionStorage`;
- axios вместо fetch для запросов, которые должна перехватить мобилка;
- совпадение URL для перехвата символ в символ;
- поддержку нужного deeplink/action со стороны MBANK.
