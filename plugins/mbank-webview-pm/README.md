# MBANK WebView PM

Автономный skills-only плагин для координации MBANK WebView-проектов со стороны PM. README служит картой пакета: показывает точку входа, встроенные справки и порядок их использования. Документы или навыки из другого проекта для работы не требуются.

## Карта пакета

- `plugin.json` — portable-манифест плагина: имя, версия и описание для каталога плагинов.
- `skills/webview-pm/SKILL.md` — единственная точка входа и PM-оркестратор. Он классифицирует задачу, выбирает нужную встроенную справку и формирует следующий шаг, чеклист или черновик.
- `skills/webview-pm/agents/openai.yaml` — отображаемые метаданные skill. Это не отдельный автономный агент.
- `skills/webview-pm/references/` — полная база знаний, которую читает PM skill.

### Встроенные справки

- `skills/webview-pm/references/README.md` — основной процесс проекта: банковская Jira, ДЦРМС, инфраструктурные заявки, тестовая и production-среды, оплата и push. Для общего вопроса начинай отсюда.
- `skills/webview-pm/references/technical-reference.md` — WebView, Bridge, origin, capabilities, callback/result URL и deeplink. Используется для вопросов по настройке интеграции и запросу ссылок.
- `skills/webview-pm/references/templates/webview-setup-email.md` — готовая структура письма с данными для настройки WebView.
- `skills/webview-pm/references/intake-questions.md` — вопросы для сбора и уточнения PM-процесса у других PM.

## Как оркестратор выбирает материалы

Основной skill сначала определяет тип PM-задачи, затем читает соответствующие файлы из `skills/webview-pm/references/`:

- новый проект, Jira, серверный доступ, порты, тестовый или production-запуск — `references/README.md`;
- origin, capabilities, Bridge, callback/result URL или deeplink — `references/technical-reference.md`;
- подготовка письма для настройки WebView — `references/templates/webview-setup-email.md` вместе с процессом из `references/README.md`;
- сбор недостающих ответов от PM-команды — `references/intake-questions.md`.

Для тестовой настройки Jira-заявка и письмо с origin/capabilities отправляются в ДЦРМС вместе; порядок отправки не важен. Для каждого окружения данные origin/capabilities подготавливаются отдельно. Полученные хэш и метод авторизации PM передаёт backend-разработчику. Подробный процесс и остальные подтверждённые правила находятся во встроенных справках.

## Границы поведения

Skill подготавливает объяснения, планы, чеклисты и черновики. Он не подключается к Jira, Confluence или Telegram и не создаёт заявки и сообщения. Неизвестные домены, IP, capabilities, deeplinks, согласующих и другие значения нужно уточнить или оставить заполнителями. Техническую документацию backend по push нужно запрашивать у backend-команды.

Плагин предназначен для PM. QA-процессы и QA-навыки должны поставляться отдельно.

## Поддержка и обновление знаний

Все файлы, необходимые для работы, находятся внутри `skills/webview-pm/`; именно эту папку нужно включать в распространяемый пакет. В авторском репозитории исходные копии поддерживаются в `docs/webview-pm/` и `.codex/skills/webview-pm/`. При изменении подтверждённого процесса синхронизируй справки в этих местах с `skills/webview-pm/references/` и обнови версию плагина при выпуске новой версии.

Формат переносимого плагина описан в [документации OpenAI](https://developers.openai.com/plugins/build/plugins).
