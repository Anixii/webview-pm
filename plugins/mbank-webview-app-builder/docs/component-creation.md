# Переиспользование и создание компонентов

Отсутствие готового UI-компонента не блокирует реализацию согласованного экрана.
Агент должен найти подходящие primitives, получить совместимый код canonical
шаблона или реализовать минимальный нужный component. Неизвестные API и
native-контракты требуют отдельного подтверждения.

## Порядок выбора

1. Изучить инструкции и stack рабочего проекта, затем его `src/shared/ui` или
   аналог, близкие pages/modules, tokens и существующий playground. Сверить
   найденное с [inventory](references/ui-component-inventory.md): inventory
   описывает шаблон, а реальное наличие подтверждают файлы проекта.
2. Если готовый API подходит, использовать component без локальной копии.
   Проверить exports, controlled value, handlers, disabled/loading и error state.
3. Если нужен доменный block, собрать его из готовых primitives внутри feature.
   Один block отвечает за конкретную роль: поля, summary, result, actions.
4. Если primitive или helper отсутствует, проверить canonical источник по
   [template-access.md](template-access.md). Переносить минимальный набор файлов,
   необходимый для его работы; адаптировать aliases и окружение проекта.
5. Если совместимого решения нет, реализовать его на доступном React/TypeScript
   stack. Для интерактивных сложных controls сначала использовать уже имеющиеся
   Base UI или другие согласованные primitives. Новый shared API нужен только
   для domain-neutral повторного использования; блок одного flow остаётся
   feature-local.

В полностью пустой папке сначала выполнить
[bootstrap](bootstrap.md), затем создавать feature. Не писать импорты к
компонентам, существование которых ещё не подтверждено.

## Границы переноса

До копирования проследить локальные imports компонента: base primitives,
utilities, hooks, CSS, theme variables, fonts и icons. Проверить внешние
packages и их версии в package manifest/lockfile. Barrel export может тянуть
дополнительные files — прочитать его, а не считать одну папку замкнутой.

Не заменять весь `package.json`, lockfile, theme или alias config ради одного
component. Внести необходимые совместимые additions средствами менеджера
пакетов проекта; проверить, что старые screens не теряют свои tokens и стили.
Если перенос требует миграции React, другой UI-системы или широкого provider
refactor, выбрать более узкую реализацию и согласовать расширение scope при
необходимости.

## Правила реализации

- Mobile-first layout: обычно горизонтальные отступы `16px`, нижняя safe area,
  место под fixed actions, читаемый контент на небольшом экране.
- Использовать фактические theme tokens и CSS variables. Проверить light/dark;
  не зашивать белые surfaces как универсальное состояние.
- Использовать `md-glyphs` или существующий iconpack проекта. Если iconpack
  отсутствует, получить нужную canonical реализацию и её зависимости; не
  вводить произвольную вторую библиотеку иконок.
- Сохранять семантику controls, label, focus и keyboard interaction; для
  `disabled`, loading, empty и error задать поведение, а не только цвет.
- Один implementation-файл содержит один React component. Смысловые blocks
  размещать в `components/<Block>/index.tsx`; дополнительные components — в
  отдельных осмысленно названных files. Не дробить каждый layout `div`.
- Новая domain form содержит ровно один `<form noValidate onSubmit={...}>`.
  RHF, API, error mapping, autosave и dirty state находятся в
  `hooks/use<Feature>Form.ts`; blocks получают typed props.
- `antd` и `antd-mobile` не добавлять в новые screens. `FloatingLabel` отвечает
  только за визуальный label; query-controls предназначены для фильтров, а
  не для регистрации RHF-полей.
- Для iOS keyboard проблемы использовать паттерн `KeyboardAwarePage` из
  [UI page building](references/ui-page-building.md), с одним scroll-container;
  проверять на реальном iOS WebView.
- API schemas, auth, payment, deeplinks и Bridge capabilities не придумывать.
  Feature UI принимает данные и callbacks по подтверждённому контракту.

## Пример границ feature

```text
src/modules/Application/
  components/
    ApplicationForm/
      index.tsx
    ApplicantFields/
      index.tsx
    SubmitActions/
      index.tsx
  hooks/
    useApplicationForm.ts
```

`ApplicationForm` собирает семантическую форму. `ApplicantFields` рендерит поля
из готовых controls. `SubmitActions` получает loading и disabled.
`useApplicationForm` владеет RHF и согласованным submit. В проекте с иной
архитектурой сохранить эти границы ответственности в его структуре.

## Проверка результата

Прочитать scripts рабочего проекта и выполнить подходящие type/build проверки.
Для нового interactive control проверить реальные риски: изменение value,
disabled/loading, ошибки, keyboard/focus; для bottom actions — safe area и
перекрытие контента. Использовать существующий playground, если он есть.
Не запускать dev server без прямой просьбы пользователя. Mock Bridge проверяет
frontend composition; работоспособность native handler проверяется отдельно.

В отчёте указать, что переиспользовано, получено из шаблона или создано, какой
commit использовался, и какие проверки выполнены. Не называть непроверенный
native/API flow готовой интеграцией.
