# Project Questionnaire

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Вопросы уточняются для конкретного проекта. Задавать только те, которые ещё не покрыты кодом, дизайном и ответами пользователя.

Перед созданием проекта или экрана определить:

- тип экрана или приложения;
- пользователь;
- главная задача;
- данные;
- действия пользователя;
- формы и поля;
- возможные ошибки;
- loading/empty/error/success states;
- навигация;
- back/close;
- API;
- API error handling: global notification, inline error, separate screen, skip notification;
- роли/permissions;
- ограничения WebView;
- способ ручной проверки UI (существующий playground; Storybook только по задаче);
- acceptance criteria.

## Bridge checklist для нового проекта

- Проект будет работать через `MBANK WebView Bridge`; нужен ли экран "обновите приложение" для старых версий без bridge?
- Какие `allowedOrigins` нужны?
- Какие capabilities нужны?
- Какие event type будет вызывать фронт?
- Поддерживается ли `token=GUEST` без auth bootstrap?
- Нужен ли явный `requestMobileAuth()` при входе или только перед защищенным действием; кто владеет startup gate?
- Нужен ли opt-in `AuthProvider` для backend auth bootstrap по обычному token?
- Нужен ли `payment.start` и какие поля известны фронту?
- Нужен ли `pdf.previewUrl` или `pdf.previewBase64`?
- Нужны ли `external.open`, `deepLink.open`, analytics, adjust, biometry, device report?
- Как фронт логирует bridge-ошибки?
- Что пользователь видит, если bridge недоступен?
