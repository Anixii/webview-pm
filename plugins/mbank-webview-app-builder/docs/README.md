# MBANK WebView App Builder: документация плагина

Эта база знаний поставляется вместе с плагином. Она описывает создание и проверку
WebView-приложений MBANK, включая UI, формы, навигацию, авторизацию, API errors
и native Bridge. Документы читаются из установленного пакета; рабочий проект
может находиться в любой папке и иметь другую файловую структуру.

## Как начать

- Пустая папка: [подготовка проекта](bootstrap.md) через skill
  [webview-project-bootstrap](../skills/webview-project-bootstrap/SKILL.md).
- Существующий проект: сначала изучить его инструкции, зависимости, tokens,
  routes и готовые компоненты; затем применять соответствующий skill.
- Не хватает компонента: [порядок переиспользования и создания](component-creation.md).
- Нужен код canonical шаблона: [доступ и перенос кода](template-access.md).
- Нужны требования: [вопросы перед проектом или экраном](references/project-questionnaire.md).

Установка плагина даёт агенту знания и сценарии работы. Код шаблона загружается
отдельно через настроенный источник; доступ зависит от инструментов и
авторизации среды. Сетевые адреса и версии берутся из
[template-source.json](../template-source.json).

## Карта знаний

| Задача                     | Документы                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Окружение и вход в WebView | [WebView context](references/webview-context.md), [query/auth flow и legacy](references/legacy-webview-integration.md) |
| Native-действия            | [MBANK WebView Bridge](references/mbank-webview-bridge.md), [typed helper](references/mbank-bridge-helper.md)          |
| UI и тема                  | [UI best practices](references/ui-best-practices.md), [UI component inventory](references/ui-component-inventory.md)   |
| Страница и layout          | [UI page building](references/ui-page-building.md), [screen patterns](references/screen-patterns.md)                   |
| Формы                      | [Forms best practices](references/forms-best-practices.md)                                                             |
| Back, close и routes       | [Navigation best practices](references/navigation-best-practices.md)                                                   |
| API errors                 | [API error handling](references/api-error-handling.md)                                                                 |
| Баги и диагностика         | [Debugging playbook](references/debugging-playbook.md)                                                                 |

Главный entrypoint — [webview-app-builder](../skills/webview-app-builder/SKILL.md).
Специализированные skills покрывают UI, формы, навигацию, Bridge и debugging.
Skill подготовки проекта используется для пустой папки. Файлы
`agents/openai.yaml` внутри skills описывают их интерфейс в Codex; сами по себе
они не запускают отдельные автономные агенты.

## Как применять правила

1. Учесть текущую задачу пользователя и инструкции рабочего проекта. Если есть
   `AGENT_FEEDBACK.md`, прочитать применимые active-записи.
2. Читать только документы, относящиеся к задаче. Примеры `src/*` и `@shared/*`
   относятся к canonical шаблону: проверить реальные пути и exports перед
   написанием импортов.
3. Переиспользовать доступный UI; недостающий UI получить из pinned шаблона или
   создать по подтверждённым правилам. Новые формы используют RHF, один
   семантический `<form>` и feature hook для поведения.
4. Использовать Bridge для новых native-действий. Query params и backend auth
   сохраняют собственные контракты; `GUEST` не запускает авторизацию автоматически.
5. Не выводить API, capability, origin, deeplink, платёжные параметры и продуктовые
   решения из догадок. Запрашивать отсутствующий контракт; продолжать независимую
   часть работы по имеющимся данным.
6. Проверять результат доступными scripts рабочего проекта. Dev server и
   deployment запускаются по прямой просьбе пользователя.

Происхождение, границы подтверждённых знаний и правила обновления описаны в
[provenance.md](provenance.md). Поля `Нужно уточнить` обозначают незакрытые вопросы,
а не разрешение выбрать контракт произвольно.
