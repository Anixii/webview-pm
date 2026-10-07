# Доступ к canonical React-шаблону

Код шаблона хранится отдельно от skills. Его canonical источник настраивается
в [template-source.json](../template-source.json) в корне плагина:

```json
{
  "schemaVersion": 1,
  "repository": null,
  "ref": null,
  "packageManager": "yarn",
  "verificationScripts": ["lint:type", "build"]
}
```

`repository` — настроенный GitHub URL или разрешённый локальный Git checkout.
`ref` — согласованный tag релиза или полный commit SHA. Если одно из них
не задано, запросить источник у пользователя; не выводить его из случайной
ссылки в документации и не подставлять `main`/`latest`. Инструкция для загрузки
целого проекта находится в [bootstrap.md](bootstrap.md).

## Доступ и версия

Для чтения использовать доступный Git или подключённый GitHub-инструмент.
Приватный репозиторий требует существующей авторизации. Ссылка в skill не даёт
доступа сама по себе. Не включать credentials в конфигурацию или copied files;
использовать штатный механизм авторизации среды.

Проверить, что tag или SHA доступен в выбранном репозитории. Tag разрешить в
точный commit до чтения кода. Не использовать плавающую ветку для canonical
копирования. Зафиксировать URL, выбранный ref и разрешённый commit в результате
работы; при подготовке проекта bootstrap сохраняет их в
`.webview-template.json`.

Совместимый ref выбирается вместе с релизом плагина. Если плагин обновлён, это
не означает автоматическую миграцию уже созданных проектов. Их локальный код,
manifest и recorded commit остаются исходным контекстом до отдельной задачи
на обновление.

## Чтение отдельных компонентов

1. Найти component по [inventory](references/ui-component-inventory.md) и
   выбранному commit, затем проверить его фактические файлы и exports.
2. Читать исходники как справочник: изменения для пользовательской задачи
   делать в рабочем проекте. Для Git использовать отдельный временный checkout
   выбранного ref; удалённый canonical репозиторий не изменяется при retrieval.
3. Проследить dependency closure: relative/alias imports, base primitives,
   utilities, hooks, styles, theme tokens, assets и package dependencies.
   Проверить обращения к providers, store, router, i18n, notifications и Bridge.
4. Сопоставить React/TypeScript, UI primitive API, Tailwind, CSS variables,
   aliases и package versions с рабочим проектом. Документация inventory не
   заменяет это сравнение.
5. Перенести минимальный совместимый набор, адаптировать imports/exports и
   интеграцию. Не копировать `node_modules`; dependencies устанавливаются
   менеджером пакетов из manifest/lockfile.
6. Сохранить сведения об источнике переноса в отчёте задачи или существующем
   журнале проекта: component, repository, ref, exact commit и сделанные
   adaptations. Проверить type/build и существенные UI states.

Если доступ к canonical source временно недоступен, использовать готовый код
рабочего проекта и [правила создания](component-creation.md). Если существующего
контракта нет, можно создать нужный UI с явными typed props; запросить недостающие
API/native данные перед зависимой интеграцией.

## Что нельзя вывести из исходников другого сервиса

Auth endpoints, error codes, permissions, payment service IDs, allowed origins,
capabilities и deeplink destinations относятся к конкретному сервису. Код
шаблона показывает паттерн работы, но не предоставляет эти значения новому
проекту. Проверять подтверждённые контракты по
[Bridge](references/mbank-webview-bridge.md),
[API errors](references/api-error-handling.md) и требованиям пользователя.
