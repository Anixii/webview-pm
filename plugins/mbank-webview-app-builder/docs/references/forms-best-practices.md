# Forms Best Practices

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: частично заполнено. Формы - один из ключевых сценариев WebView-проектов.

## Основные типы форм

В проектах чаще всего встречаются два типа форм.

### 1. Простая submit-form

Пользователь заполняет форму, нажимает submit, форма отправляется, сценарий завершается или переходит дальше.

Использовать, когда:

- форма короткая или средняя;
- данные не нужно постоянно редактировать по шагам;
- нет требования автосохранять каждое изменение;
- сценарий не требует сложного восстановления состояния.

### 2. Многоэтапная editable/autosave-form

Форма состоит из нескольких этапов или экранов. Данные можно редактировать повторно, а изменения должны жить в общем state.

Паттерн:

1. Feature hook получает минимально нужный draft из Redux и создаёт RHF form с явными `defaultValues`.
2. Если initial data приходит асинхронно, hook делает контролируемый `reset` только при смене исходного draft, а не на каждом render.
3. `useWatch` (предпочтительно для нужных полей) или `watch` отслеживает изменения RHF state.
4. Hook через debounce обновляет Redux draft и, только если это требуется контрактом, запускает autosave mutation.
5. UI-блоки получают уже подготовленные props и не знают о Redux, API или debounce.

Использовать, когда:

- форма многоэтапная;
- пользователь может возвращаться к предыдущим шагам;
- поля редактируются после первичного заполнения;
- изменения нужно сохранять в процессе;
- состояние формы должно быть доступно между экранами/шагами.

## Target Form Library

`react-hook-form` установлен в template и является стандартом для новых форм.

`antd Form` не использовать для новых экранов. Если старый экран еще живет на другом паттерне, мигрировать его только отдельной задачей.

## Архитектура новой формы

Для нового form feature использовать модульную структуру: `components/` и `hooks/` — соседние директории внутри одного feature/module.

```text
src/modules/<Feature>/
  components/
    <Feature>Form/
      index.tsx
    <Feature>FieldsBlock/
      index.tsx
    <Feature>SubmitActions/
      index.tsx
  hooks/
    use<Feature>Form.ts
```

- `<Feature>Form` обязательно рендерит единственный семантический `<form noValidate onSubmit={...}>` для пользовательского ввода. Вложенные `<form>` недопустимы.
- `hooks/use<Feature>Form.ts` владеет `useForm`, API mutations, селекторами, `reset`, mapping API errors через `setError`, autosave, debounce, dirty/exit side effects и submit handler. Hook не возвращает JSX.
- Form component и его blocks отвечают только за композицию UI. Они получают из hook `control`/`register`, submit handler, loading/error flags и event callbacks; не вызывают самостоятельно API, Redux или навигационные side effects.
- Каждый implementation file содержит ровно один React component. Основной component block хранится в `index.tsx`; если в одной папке нужны дополнительные components, каждому дать отдельный осмысленно названный файл. Не объявлять локальные мини-компоненты в том же файле.
- Отдельная папка нужна для самостоятельного смыслового блока (например, group полей, summary, actions), а не для каждого `div` или одного label. Мелкие layout elements остаются рядом с component, которому служат.
- Для новых form features сначала искать подходящие primitives в `src/shared/ui`, затем существующий module/page pattern. Создавать новый shared component можно только для действительно domain-neutral и повторно используемого API; иначе block остаётся внутри feature.

`FormProvider` — опциональный инструмент. Использовать его, только если несколько вложенных form blocks действительно должны читать RHF context и передача узких props становится хуже. Он не заменяет семантический `<form>` и не переносит бизнес-логику из feature hook. Generic shared `FormWrapper` или `FormField` не создавать, пока пользователь отдельно не подтвердил их API и область переиспользования.

## React Hook Form Pattern

Подтвержденный default для новых форм:

- размещать `useForm` в feature hook, а не в JSX component;
- shared inputs подключать через `Controller`, если компонент не полностью совместим с native `register`;
- native-like controls можно подключать через `register`, если это не ломает controlled state и маски;
- `defaultValues` задавать явно, даже если значения пустые;
- submit handler создавать через `handleSubmit` в hook и передавать в `<form>`;
- во время submit использовать `formState.isSubmitting` или внешний API loading state;
- кнопку submit disabled, если идет submit/loading или форма в состоянии, где отправка запрещена;
- не отправлять форму повторно во время submit/loading.

Пример: `use<Feature>Form.ts` возвращает form model, а component содержит только разметку.

```tsx
export function FeatureForm() {
  const { control, onSubmit, isSubmitting } = useFeatureForm()

  return (
    <form noValidate onSubmit={onSubmit}>
      <FeatureFieldsBlock control={control} disabled={isSubmitting} />
      <FeatureSubmitActions loading={isSubmitting} />
    </form>
  )
}
```

Для shared input через `Controller`:

```tsx
<Controller
  control={form.control}
  name="comment"
  rules={{ required: 'Введите комментарий' }}
  render={({ field, fieldState }) => (
    <FloatingLabel label="Комментарий">
      <Textarea {...field} status={fieldState.error ? 'error' : undefined} />
    </FloatingLabel>
  )}
/>
```

`FloatingLabel` отвечает только за визуальное состояние label: он не регистрирует RHF field, не валидирует и не заменяет `Controller`/`register`.

`TextFiledQuery` и `SelectQuery` из `src/shared/ui/FormQuery` управляют URL query parameters для filter/search screens. Это не canonical control pattern для submit-form или editable/autosave-form: в новой RHF-форме использовать базовый shared control через `register` или `Controller`.

## Field Errors

Подтвержденный default:

- field-level validation errors показывать под соответствующим полем;
- API validation errors, которые относятся к конкретному полю, маппить в `setError`;
- общую API error показывать над submit action или в отдельном status/error block внутри формы;
- технические backend details пользователю не показывать;
- после submit с ошибками скроллить к первой ошибке.

Если у shared input есть `status="error"`, использовать его для визуального error state. Текст ошибки выводить рядом с form composition, а не зашивать в сам primitive input.

## Submit Button

Подтвержденный default:

- submit action находится внизу формы или в fixed bottom action, если сценарий требует;
- fixed bottom action должен учитывать safe area;
- при submit/loading кнопка disabled;
- если есть loading icon/spinner в кнопке, использовать его;
- если форма invalid после submit, пользователь должен увидеть первую ошибку.

## API Error Mapping

Паттерн:

1. Если backend вернул field errors, преобразовать их в `setError`.
2. Если ошибка общая, показать friendly message над submit.
3. Если endpoint обрабатывает ошибку внутри формы, использовать skip global notification для этого запроса.
4. Если ошибка не относится к форме, можно оставить глобальную notification через `queryErrorLogger`.

Global notification остается частью template и не удаляется.

## Redux State

Form state в Redux хранить по ключам.

Ключи должны соответствовать структуре формы или бизнес-сущности, чтобы можно было точечно обновлять поля и не пересобирать весь state.

Для `initialState` выбирать минимальный нужный slice/state, чтобы не провоцировать лишние рендеры.

## Autosave Debounce

`onValuesChange` — legacy terminology из Ant Design и не является паттерном новых RHF-форм. Для autosave использовать `useWatch` (предпочтительно) или `watch` внутри feature hook и запускать debounced save из effect/callback.

- наблюдать только те поля, которые нужны для draft/autosave; не подписывать весь form state без причины;
- debounce по умолчанию — `500ms`;
- не запускать autosave для initial hydration/reset, если это не требуется контрактом;
- отменять pending debounce при unmount или смене draft, чтобы не отправить устаревшее значение;
- UI components не должны содержать `watch`, debounce или autosave mutation.

Использовать существующие shared helpers:

- `src/shared/libs/debounce/useDebounceCallback`
- `src/shared/libs/debounce/debounce`

Выбор hook/function зависит от конкретной реализации формы, но orchestration остаётся в `use<Feature>Form.ts`.

## Wizard / Stepper

Обычная форма или wizard/stepper выбираются по типу проекта. Это нужно уточнять при разработке конкретного сценария.

Stepper обычно подходит для длинных или многоэтапных процессов.

## Validation UX

- Ошибки валидации показывать под соответствующими input.
- Тексты ошибок должны быть максимально friendly и понятными.
- При нажатии на submit/continue нужно скроллить пользователя к первой ошибке.
- Если пользователь нажал submit и есть ошибки, кнопка должна приводить пользователя к ошибке, а не просто ничего не делать.

## API Errors

- Если API error относится к конкретному полю, показывать красным текстом под этим input.
- Если поле для API error не найдено или ошибка общая, показывать ошибку выше кнопки submit.
- Текст API error должен быть понятным для пользователя, без технических деталей.

## Dirty State / Autosave

Для autosave-форм поведение зависит от требований проекта:

- можно сохранять изменения автоматически;
- можно не сохранять изменения без явного действия;
- при попытке сохранить нужно показать все ошибки, чтобы пользователь видел, что именно нужно исправить.

Confirm при выходе из dirty form зависит от требований конкретного проекта.

Если confirm нужен, поведение нужно уточнять. Возможные варианты:

- не дать выйти, пока пользователь не сохранит или не исправит ошибки;
- сохранить изменения;
- показать modal с выбором действия.

## Submit Loading

Во время submit:

- disable submit button;
- показывать loader icon внутри кнопки или рядом с действием;
- не давать отправлять форму повторно.

## Disabled State

У компонентов формы должна быть возможность disabled state.

Disabled state нужен для:

- submit/loading;
- недоступных по условиям полей;
- зависимых полей;
- сценариев, где данные доступны только для просмотра.

## File Upload

Для загрузки файлов нужен кастомный input.

Для новых форм использовать shared `FileUploader`, без `antd Upload`, `UploadFile`, `RcFile` и доменных типов внутри public API компонента.

С учетом WebView-ограничений файлы передаются в `base64`.

Частые backend-сценарии:

- получить `presigned url` и загрузить файл туда;
- отправить `base64` напрямую на PATCH/другой endpoint.

Конкретный способ нужно уточнять для проекта и backend-контракта.

## Masks and Formats

Частые маски:

- номер телефона;
- государственный номер авто;
- валютные значения.

Точный формат маски уточнять под проект и backend-контракт.

## Нужно уточнить

- Какие конкретные regex/format правила использовать для телефона, госномера и валюты.
- Какой стандартный UI для confirm при выходе из dirty form.
- Какой backend file upload сценарий используется в конкретном проекте: presigned url или direct base64 PATCH.
