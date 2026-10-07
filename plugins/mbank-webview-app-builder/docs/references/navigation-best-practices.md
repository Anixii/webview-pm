# Navigation Best Practices

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: частично заполнено.

## Back

Back работает похоже на браузерную навигацию внутри WebView: через navigation `-1` или native back, в зависимости от сценария.

Иногда нужно использовать replace-навигацию, чтобы пользователь не возвращался на технические или промежуточные экраны.

На первом экране back может автоматически закрывать WebView.

Android system back, по текущему пониманию, обрабатывает frontend.

## Close

Close полностью закрывает WebView независимо от текущего внутреннего экрана.

В новой bridge-реализации целевой способ закрытия:

```ts
import { closeMobileWebView } from '@shared/mobile-bridge'

await closeMobileWebView(payload)
```

Legacy-способ через axios-запрос на заранее согласованный URL хранится в `legacy-webview-integration.md`.

## Deeplinks

В новой bridge-реализации целевой способ:

```ts
import { openDeepLink } from '@shared/mobile-bridge'

await openDeepLink('mbank://...')
```

Capability: `deepLinks`.

Для close и auth return использовать соответственно `closeMobileWebView()` и `requestMobileAuth()` из того же helper. Прямой вызов `window.MBankBridge.invoke(...)` в feature-коде не использовать.

Для deeplink нужно заранее согласовать поддержку с MBANK. Если нужно открыть внутри WebView другой WebView через deeplink, нужно запросить разрешение и передать deeplink, куда планируется перенаправление.

Если `deepLink.open` открывает новый flow или другую WebView, новая WebView открывается поверх текущей. Если новую WebView закрыть, пользователь возвращается в исходную WebView.

## Routes

Nested routes допустимы, если нужны сценарию.

Stepper используется часто, особенно для многошаговых сценариев.

Полного reload страницы не должно быть. Не проектировать экраны вокруг восстановления после reload.

Для `auth.required.redirectUrl` по умолчанию возвращаться на главную route. Если проекту нужно другое поведение, это нужно уточнять и фиксировать отдельно.

## Route config и header в template

В текущем React template настройки экранов находятся в `src/pages/model.tsx`.

Роуты создаются через `createRouteObject([...])`, а поведение общего header задается через поле `handle` у route.

Поддерживаемые настройки header:

- `title` - i18n key текста header.
- `subtitle` - признак, что subtitle берется из `location.state`.
- `dynamicTitle` - признак, что title может браться из `location.state`.
- `backUrl` - поведение кнопки назад. Может быть строкой или функцией, которая получает текущий match и список matches.
- `isExit` - кнопка назад в header закрывает WebView вместо перехода назад по внутренней навигации.

Текущий порядок обработки back в `src/modules/Common/hooks/useHeader.ts`:

1. Если найден `isExit`, вызывается закрытие приложения/WebView.
2. Если найден `backUrl`, выполняется `navigate(backUrl, { replace: true })`.
3. Если `backUrl` нет, выполняется `navigate(-1)`.

При добавлении нового экрана нужно отдельно продумать:

- какой `title` должен быть в header;
- нужна ли кнопка back и куда она должна вести;
- должен ли back закрывать WebView через `isExit`;
- нужно ли использовать динамический `backUrl` на основе route params;
- нужно ли использовать `subtitle` или `dynamicTitle`;
- нужно ли делать replace-навигацию после технических, success или payment-result экранов.

## Dirty state

Confirm при выходе из формы зависит от дизайна и критичности данных.
