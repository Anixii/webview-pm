# Legacy WebView Integration

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: auth/query flow остается актуальным. Старая схема native-действий через URL/AJAX-перехваты будет отключена для новых WebView после rollout `MBANK WebView Bridge`.

Важно: bridge не отменяет query params и первичную авторизацию. Меняется способ вызова native-действий: вместо согласованных URL-перехватов новые проекты должны использовать bridge events. Если bridge недоступен из-за старой версии приложения, показывать просьбу обновить приложение.

## Query params при входе

MBANK открывает WebView с query-параметрами. Некоторые параметры могут быть забыты или не переданы, поэтому фронт должен обрабатывать отсутствие необязательных значений.

Основные параметры:

- `token` - уникальный токен MBANK, живет около 5 минут.
- `lang` - язык интерфейса: `ky`, `ru`, `en`.
- `theme` - тема: `light`, `dark`.
- `device-id` - уникальный идентификатор устройства, важен для связывания guest-сессии с authorized-сессией.
- `device-name` - название устройства, опционально.
- `user-authority` - роль клиента, например `BANK_CLIENT`, `MISLAMIC_CLIENT`.
- `chanel` - канал авторизации. Название параметра фиксируется как в документации MBANK.

## Auth flow

При входе в WebView фронт должен быстро обработать `token`.

Планируемый слой в template:

- `TokenProvider` поверх приложения;
- opt-in `AuthProvider` для проектов, которым нужен backend auth bootstrap и хранение результата.

Фронт вызывает свой backend auth endpoint. Конкретный endpoint зависит от реализации backend.

Стандартного backend auth endpoint для всех проектов нет. При создании проекта или экрана нужно уточнять endpoint у backend-команды.

Backend использует MBANK token, вызывает свой серверный метод получения данных клиента и после успешного запроса ставит собственные cookies. После этого фронт больше не использует MBANK token.

Точный `token=GUEST` означает guest-режим: фронт не делает backend auth-запрос. Если `AuthProvider` подключен в проекте, он также не вызывает `/auth/me` и не инициирует native-авторизацию для guest.

В некоторых legacy-интеграциях `401` guest-endpoint мог запускать native-авторизацию. Не использовать это как default для новых bridge-проектов: если действию явно нужна авторизация, вызвать `requestMobileAuth()` из `@shared/mobile-bridge`.

По ответу техподдержки, после появления bridge этот flow остается прежним. `auth.required` не является заменой базовой авторизации через query token, а может использоваться как дополнительный bridge-event для явного запроса авторизации из WebView.

Если авторизация обязательна при входе, проект явно вызывает `requestMobileAuth()` из собственного startup gate. `AuthProvider` подключается только там, где после обычного token нужен backend auth bootstrap.

Если token отсутствует, `TokenProvider` должен показывать not found/error screen по текущему проектному паттерну и просить пользователя перезайти в сервис.

## Storage

- Query params сохранять в `sessionStorage`.
- Для template использовать слой `src/shared/libs/storage/`.
- В `localStorage` лучше ничего не хранить.
- В рамках сессии можно кешировать данные.
- При новой WebView-сессии пользователь проходит flow заново.
- `device-id`, `user-authority`, `chanel` сохранять в `sessionStorage`, если они нужны проекту.
- Если `lang` не пришел, default: `ru`.
- Если `theme` не пришла, default: `light`.
- Данные авторизованного пользователя в Redux хранить по потребностям конкретного проекта.
- При logout/close достаточно новой WebView-сессии; явная очистка `sessionStorage` не является обязательным базовым правилом.

## Legacy native actions

Раньше действия выполнялись через согласованные URL/AJAX-перехваты. Для запросов, которые должен прослушать MBANK, нужно было использовать `axios`, потому что внутри WebView native-перехват работал через `XMLHttpRequest`.

Примеры legacy-действий:

- закрытие WebView через согласованный URL;
- payment через axios-запрос на backend endpoint;
- preview PDF через согласованный URL;
- redirect/tel/WhatsApp/deeplinks через согласованные URL.

Важно: эта схема остается исторической справкой. Для новых WebView после rollout использовать `MBANK WebView Bridge`.

## Ограничения legacy WebView

- Нативный header есть по умолчанию; убрать его можно только через запрос техподдержке/MBANK.
- FormData file upload на текущей старой схеме не работает; доступный способ - Base64, по одному файлу в запросе.
- Для PDF preview нужно согласовать разрешение; preview принимает ссылку на PDF.
- Для `tel`, WhatsApp и других внешних ссылок нужно отдельно согласование.
- YouTube video player не работает только на iOS.
- Ориентация телефона внутри WebView не работает только на iOS.

## Viewport и base CSS

Рекомендуемый `meta viewport`:

```html
<meta
  name="viewport"
  content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

Базовые правила:

- запрещать zoom страницы;
- учитывать `safe-area-inset-bottom`;
- отключать нежелательное выделение текста кроме `input` и `textarea`;
- убирать tap highlight;
- использовать `overscroll-behavior: none`;
- задавать переменные для navbar/header/safe-area.

## Нужно уточнить

- Подтвердить, нужно ли хранить эту legacy-документацию только как историческую справку или еще есть проекты, которые будут жить на старой схеме.
