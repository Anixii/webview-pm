# UI Page Building

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Подтверждённые правила для WebView-страниц. Файловая структура ниже — паттерн canonical шаблона; при интеграции учитывать структуру рабочего проекта.

## Базовый layout

Подтверждено:

- почти все WebView-страницы используют контейнер с горизонтальными отступами `16px`;
- нижние fixed/sticky actions должны учитывать safe area;
- внутри базового контейнера уже собираются конкретные экраны, секции, формы, списки и result states;
- common header используется по умолчанию;
- кастомный header внутри страницы возможен, но это редкий сценарий и требует отдельной причины.

## Bottom actions

Подтверждено:

- экраны часто могут иметь нижнюю кнопку или нижнюю action-панель;
- нижняя панель должна сохранять горизонтальный отступ `16px`;
- нижняя панель должна учитывать safe-area padding снизу;
- во время submit/loading action должен блокировать повторное нажатие.

## iOS Keyboard-Aware Forms

Подтвержденный баг: при фокусе на первом native input в iOS WebView экран может резко сместиться; при быстром переходе на второе поле оно может оказаться за клавиатурой.

Для экранов с таким риском использовать shared `KeyboardAwarePage` из `src/shared/ui/KeyboardAwarePage`:

```tsx
<KeyboardAwarePage header={<Header />}>
  <Form />
</KeyboardAwarePage>
```

Компонент создаёт единственный scroll-container для контента, использует `visualViewport` только на iOS и корректирует положение актуального focused control внутри этого container. Header остаётся вне области скролла.

Не добавлять iOS-логику в `TextFiled`, `InputNumber` или `Textarea`; не скроллить или трансформировать `body`; не использовать фиксированные смещения клавиатуры.

Проверять на реальном iOS WebView: первый focus, быстрый переход между двумя полями при открытой клавиатуре и закрытие клавиатуры.

## Типы экранов

`webview-ui-builder` должен уметь проектировать и создавать:

- simple info screen;
- form screen;
- multi-step form;
- list/select screen;
- details/review screen;
- success/error/result screen;
- loading/empty/error API state screen.

## Формы

Подтверждено:

- новые формы делать через `react-hook-form`;
- `antd Form` не использовать для новых экранов;
- поля собирать из shared UI компонентов;
- submit behavior должен учитывать validation, loading и duplicate submit protection.
- интерактивная форма всегда имеет один семантический `<form noValidate onSubmit={...}>`; не заменять его `div`-обёрткой и не вкладывать form в form;
- RHF/API/autosave logic живёт в feature hook из sibling `hooks/`, а form component только собирает blocks и передаёт им prepared props;
- для глубоких blocks `FormProvider` допустим по необходимости, но generic `FormWrapper` не создавать без отдельно согласованного API.

## Shared UI

Подтверждено:

- для новых страниц использовать `src/shared/ui`;
- новые UI-компоненты не хранить в `src/shared/antd`;
- `antd` и `antd-mobile` не использовать для новых экранов;
- Storybook не является обязательным этапом;
- ручная проверка компонентов и состояний может идти через `src/pages/UIKit`.

## Code scope

`webview-ui-builder` может создавать и редактировать:

- `src/pages` для route/page-level composition;
- `src/modules` для domain-specific blocks and flow logic;
- `src/shared` только для reusable domain-neutral UI/utilities;
- route config and metadata when page navigation requires it.

Перед созданием новой структуры нужно сначала посмотреть существующий паттерн в `src/pages`, `src/modules`, `src/shared`.

## Component Composition and Files

Для нового page/module кода применять следующую иерархию reuse-first:

1. Использовать готовый component или primitive из `src/shared/ui`.
2. Проверить близкий page/module pattern и переиспользовать существующий domain block, если его API подходит.
3. Скомпоновать screen из shared primitives и feature-local blocks в `src/modules/<Feature>/components`.
4. Создавать новый `src/shared/ui` component только когда API domain-neutral и реально нужен нескольким независимым сценариям; не переносить туда бизнес-логику одного экрана.

Feature-local blocks хранить по отдельным папкам с `index.tsx`, а hooks — в соседнем `hooks/`:

```text
src/modules/<Feature>/
  components/
    <Feature>Screen/
      index.tsx
    <MeaningfulBlock>/
      index.tsx
  hooks/
    use<Feature>Screen.ts
```

- В одном implementation file — один React component. Основной component block хранится в `index.tsx`; если в папке нужны дополнительные components, каждому дать отдельный осмысленно названный файл. Если JSX block получил самостоятельную ответственность, props или state, вынести его в отдельную папку/component, а не объявлять локальный мини-component рядом с parent.
- Не дробить каждый `div`, label или spacing wrapper: отдельным component становится только смысловой блок с понятным названием.
- Page-level routing и wiring остаются в `src/pages`; domain composition и feature hooks — в `src/modules`; shared layer остаётся только для domain-neutral building blocks.

## Open questions

- стандартный vertical gap между блоками: `Нужно уточнить`;
- стандартный wrapper/component для page container: `Нужно уточнить`;
- финальный API fixed bottom action wrapper: `Нужно уточнить`.
