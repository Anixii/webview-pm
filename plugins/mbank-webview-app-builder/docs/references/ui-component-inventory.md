# UI Component Inventory

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Снимок shared UI canonical шаблона. Документ фиксирует подтверждённые API, states и legacy-совместимость; наличие этих компонентов в другом проекте нужно проверить.

## Что описывает inventory

В canonical шаблоне базовые компоненты WebView UI реализованы или перенесены в shared UI слой без `antd`. Storybook не является обязательным этапом template; для быстрой ручной проверки используется `src/pages/UIKit`.

## Как выбирать component для нового кода

Перед созданием нового UI сначала проверить этот inventory и `src/shared/ui`, затем близкий page/module pattern. Предпочтительный порядок:

1. использовать готовый shared primitive/component;
2. переиспользовать подходящий domain block из модуля;
3. собрать feature-local block из существующих primitives;
4. создавать новый shared component только для domain-neutral API, который нужен нескольким независимым сценариям.

`src/shared/ui` не должен становиться местом для business rules одного экрана. Новый feature-local block хранится отдельно в `src/modules/<Feature>/components/<Block>/index.tsx`; один implementation file содержит один React component. Не создавать отдельный component только для layout `div` без самостоятельной роли.

## Часто используемые компоненты

- Button.
- Switch.
- Segmented controls.
- Accordion / Collapse.
- RangePicker.
- HorizontalStepper.
- OTP input.
- Bottom sheets.
- Inputs with slider.
- Inputs with floating label.
- Calendars inside bottom sheets.
- Shared success screens.
- Shared error screens.
- Shared empty states.
- ResultView for status screens.
- Preloader for full-screen and inline loading states.
- File upload.
- Lists.
- ListDescription for label/value rows.
- Scrollable tabs for horizontal lists.
- Modals.
- Checkboxes.
- Radio buttons.

## Компоненты и состояния для ручной проверки

- Button: primary, secondary, white, text, danger, disabled, 56px and 48px sizes.
- Switch: off/on, disabled, sm/md/lg sizes.
- Segmented control: two options, many options, disabled, 36px, 48px and 56px sizes.
- Accordion / Collapse: closed, opened, multiple opened, custom content, disabled.
- RangePicker: single value by default, optional range, min/max/step, disabled.
- HorizontalStepper: finish, process and wait steps; short and long labels; custom statuses.
- OTP input: default, filled, error, disabled, loading/submit-related state.
- Bottom sheet: default, long content, keyboard interaction, nested actions.
- Input with slider: min/max, invalid value, disabled, API-driven value.
- Floating label input: empty, focused, filled, error, disabled.
- Segmented control: overflow.
- Calendar bottom sheet: single date, range if needed, disabled dates, min/max.
- Result screens: success, error, empty, retry action.
- ResultView: success state, error/rejected state, bottom action, no close action.
- Preloader: default centered spinner, full-height screen, custom spinner size.
- File upload: empty, uploading, uploaded, error, remove file.
- Lists: loading, empty, error, long list, item actions.
- ListDescription: default rows, right icon, clickable row, disabled clickable row.
- ScrollableTabs: default, many items, long labels, active item, empty tabs.
- Modal: confirmation, destructive action, loading action.
- Checkbox/radio: selected, unselected, disabled, error.

## Button

Компонент: `src/shared/ui/Button`.

Назначение: основная кнопка дизайн-системы для WebView-сценариев. Компонент строится отдельно от `antd`, на основе shadcn/Base `Button`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/button.tsx`;
- публичный entrypoint находится в `src/shared/ui/Button`;
- основной размер кнопки: `56px`;
- дополнительный, более редкий размер: `48px`;
- стандартный radius: `20px`;
- typography: `17px`, bold/700; font-family брать из глобальных CSS variables, без зависимости от `AntProvider`;
- primary: `bg-color-brand`, белый текст;
- secondary: background `#F4F5F6`, текст `color-brand`;
- white: белый background, текст `color-brand`;
- text: без background, текст может быть любого цвета через `className`;
- danger: красный background, белый текст;
- disabled: background `#A0A7B1`, белый текст;
- `block` растягивает кнопку на всю ширину и делает ее блочной;
- `fullWidth` сохранен только как совместимый alias для старых мест, для нового кода использовать `block`.

## Switch

Компонент: `src/shared/ui/Switch`.

Назначение: базовый переключатель для boolean-настроек и включения/выключения опций внутри WebView-сценариев. Компонент строится отдельно от `antd`, на основе shadcn/Base `Switch`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/switch.tsx`;
- публичный entrypoint находится в `src/shared/ui/Switch`;
- компонент должен поддерживать разные размеры;
- текущие размеры: `sm`, `md`, `lg`;
- когда switch включен, background становится зеленым `color-brand`;
- выключенное состояние использует нейтральный серый background;
- disabled состояние должно быть визуально приглушенным;
- `Switch.stories.tsx` не создавать без отдельной задачи.

## Checkbox

Компонент: `src/shared/ui/Checkbox`.

Назначение: выбор одного независимого boolean-значения в WebView-формах. Компонент строится отдельно от `antd`, на shadcn/Base UI `Checkbox`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/checkbox.tsx`;
- публичный entrypoint находится в `src/shared/ui/Checkbox`;
- unchecked: прозрачный background и secondary border `#A0A7B1`;
- checked: background и border `Accent / AccentBright` (`#129958`), белая check-иконка;
- radius: около `8px` для стандартного и large размеров;
- размеры: `sm` 16px, `md` 24px, `lg` 32px;
- компонент поддерживает `checked` / `onCheckedChange`; для совместимости с `Form.Item` также поддерживается boolean `onChange`.

## Radio

Компонент: `src/shared/ui/Radio`.

Назначение: выбор одного значения из группы в WebView-формах. Компонент строится отдельно от `antd`, на shadcn/Base UI `Radio` и `RadioGroup`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitives находятся в `src/shared/ui/base/radio.tsx`;
- публичный entrypoint находится в `src/shared/ui/Radio`;
- inactive: прозрачный background и secondary border `#A0A7B1`;
- active: зелёный border `Accent / AccentBright` (`#129958`) и круглый зелёный indicator внутри;
- `RadioGroup` объединяет radio в один выбор и поддерживает `value` / `onValueChange`;
- `Radio` поддерживает `labelPosition="left" | "right"`; по умолчанию текст располагается справа.

## TextFiled

Компонент: `src/shared/ui/TextFiled`.

Назначение: базовое однострочное текстовое поле для WebView-форм без зависимости от `antd`.

Подтвержденное поведение:

- default height: `58px`; compact height: `48px`;
- radius: `20px`;
- background: белый;
- в обычном и disabled состояниях border отсутствует; focus state показывает зелёный border;
- error state показывает border `Text / Warning` (`#E02D3C`);
- поддерживает `withPlaceholder`, `suffix`, native `onChange`, `disabled`, `readOnly` и ref;
- `TextField` доступен как alias, но текущий public API сохраняет имя `TextFiled`.

## InputNumber

Компонент: `src/shared/ui/InputNumber`.

Назначение: числовое поле в стиле shadcn без зависимости от `antd`.

Подтвержденное поведение:

- default height: `58px`; compact height: `48px`;
- radius: `20px`, белый background; focus state показывает зелёный border, error state - красный;
- форматирование чисел использует locale `ru-RU`;
- для currency `сом` значение форматируется внутри поля, например `121 123 123 сом`;
- поддерживает controlled/uncontrolled value, `min`, `max`, `step`, `onChange` и `onValueChange`.

## NumberSlider

Компонент: `src/shared/ui/NumberSlider`.

Назначение: часто используемое поле числа со связанным Base UI slider. Компонент строится отдельно от `antd`.

Подтвержденное поведение:

- `InputNumber` и slider используют единую value-модель: изменение любого control обновляет другой;
- поддерживаются `value`, `defaultValue`, `onChange`, `min`, `max`, `step`, `addSymbol`, `disabled` и `onValueCommitted`;
- значения, введённые в input или полученные от slider, ограничиваются диапазоном `min`/`max`;
- `view="card"` показывает label, компактное числовое значение и slider в белой карточке;
- card slider использует серый rail, зелёный active track и белый круглый thumb с зелёной обводкой;
- публичный entrypoint: `src/shared/ui/NumberSlider`.

## FileUploader

Компонент: `src/shared/ui/FileUploader`.

Назначение: загрузка и отображение файлов без зависимости от `antd` и доменных API-типов.

Подтвержденное поведение:

- компонент принимает `title`, `description`, `files`, `accept`, `maxFiles`, `multiple`, `loading` и `disabled`;
- file input нативный: выбранные `File[]` передаются в `onFilesSelected`;
- пустое состояние показывает широкую secondary-кнопку `Загрузить документы`;
- после появления файлов кнопка становится компактной и располагается слева от превью;
- файл описывается общим типом `FileUploaderFile` с `id`, `name`, optional `previewUrl`, `url` и `disabled`;
- image-файлы показывают превью, остальные - иконку файла;
- `onRemove` позволяет удалить файл, `url` или `onDownload` дают действие скачивания;
- публичный компонент не использует `UploadFile`, `RcFile`, `BidFile` или другие типы `antd`/конкретного домена.

## FloatingLabel

Компонент: `src/shared/ui/FloatingLabel`.

Назначение: mobile floating label для TextFiled, InputNumber, Select и Textarea. Это локальная shadcn-style композиция: в официальном shadcn/ui отдельного Floating Label нет, вместо него предлагаются `Field` и `FieldLabel`.

Подтвержденное поведение:

- не хранить компонент в `src/shared/antd`;
- label поднимается при focus или непустом значении;
- работает с controlled и uncontrolled controls, в том числе без `Form.Item`;
- поддерживает TextFiled, InputNumber, Select и Textarea через единый `floatingLabel` contract;
- `onClick`, `onChange`, `onFocus` и `onBlur` остаются на самом control; wrapper только композиционно передаёт form-props;
- это только visual wrapper: он не регистрирует поле, не читает RHF errors и не заменяет `Controller`/`register`;
- поддерживается legacy alias `FloatLabel`;
- для инпутов с floating label внутренние padding адаптируются, чтобы label и значение не пересекались.

## FormQuery

Компоненты: `src/shared/ui/FormQuery/TextFiledQuery` и `src/shared/ui/FormQuery/SelectQuery`.

Назначение: синхронизировать filter/search controls с URL query parameters через `useAppSearchParams`.

Подтвержденное использование:

- использовать для filter/search screen, когда состояние должно попасть в URL;
- не использовать как canonical field pattern в новой submit-form или editable/autosave-form на React Hook Form;
- в новой RHF-форме подключать базовые `TextFiled`, `Select` и другие shared controls через `register` или `Controller`;
- если form всё же должна синхронизировать отдельное значение с URL, orchestration остаётся в feature hook, а не внутри visual form block.

## Textarea

Компонент: `src/shared/ui/Textarea`.

Назначение: shared textarea без зависимости от `antd`, совместимая с FloatingLabel.

Подтвержденное поведение:

- белый background, radius `20px`, min-height `120px`;
- focus state показывает зелёный border, error state - красный;
- textarea допускает resize по вертикали;
- поддерживает native value/event/ref API и `floatingLabel` mode.

## Select

Компонент: `src/shared/ui/Select`.

Назначение: выбор одного значения на Base UI `Select`, включая обычный popup и внешние bottom-sheet сценарии.

Подтвержденное поведение:

- default height: `58px`; compact height: `48px`;
- radius: `20px`, белый background; focus state показывает зелёный border, error state - красный;
- поддерживает `options`, `value`, `onChange`, `placeholder`, `disabled`, `loading`, `allowClear` и `open`;
- `PopupSelect` продолжает использовать Select как trigger для external drawer, без внутреннего popup.

## PopupSelect

Компонент: `src/shared/ui/PopupSelect`.

Назначение: select-trigger, который открывает список options в global bottom drawer вместо встроенного popup.

Подтвержденное поведение:

- компонент перенесён из `src/shared/antd` в shared UI;
- использует shared `Select` как trigger и сохраняет `value`, `onChange`, `disabled`, `loading`, `placeholder` и `suffixIcon`;
- выбор option закрывает drawer;
- без options показывается default empty state «Нет доступных вариантов»;
- empty state можно заменить через `emptyState`.

## PopupText

Компонент: `src/shared/ui/PopupText`.

Назначение: text button, который открывает список options в global bottom drawer.

Подтвержденное поведение:

- компонент перенесён из `src/shared/antd` в shared UI;
- выбор option вызывает `onChange` и закрывает drawer;
- выбранный option отмечается иконкой `completed`;
- без options показывается default empty state «Пока ничего нет»;
- empty state можно заменить через `emptyState`.

## OTP Input

Компонент: `src/shared/ui/OtpInput`.

Назначение: ввод одноразового кода на библиотеке `input-otp`, отдельно от `antd`.

Подтвержденное поведение:

- default length: `6`; длина переопределяется через `length`;
- принимаются только цифры, включая очищенный от нецифровых символов paste;
- default input mode: `tel`;
- каждый slot: `55px` x `58px`, gap `8px`, radius `8px`;
- активный slot получает зелёный focus outline; disabled становится визуально приглушенным.

## Segmented

Компонент: `src/shared/ui/Segmented`.

Назначение: segmented control для переключения между несколькими взаимоисключающими режимами, визуально близкий к mobile tabs. Компонент строится отдельно от `antd`, на основе shadcn/Base `Tabs`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/tabs.tsx`;
- публичный entrypoint находится в `src/shared/ui/Segmented`;
- API должен поддерживать `options`, `value`, `onChange`, `block`, `disabled`;
- размеры: `sm = 36px`, `md = 48px`, `lg = 56px`;
- default size: `md`;
- внешний background: `#E3E5E8`;
- внешний radius: `9px`;
- внешний padding: `2px`;
- активный tab имеет белый background;
- активный tab radius: `8px`;
- текст: `16px`;
- цвет текста: `#0E0F11`;
- `Segmented.stories.tsx` не создавать без отдельной задачи.

## Accordion / Collapse

Компонент: `src/shared/ui/Accordion`.

Назначение: replacement для Collapse/accordion-сценариев с отдельными карточками и кастомным раскрывающимся контентом. Компонент строится отдельно от `antd`, на основе shadcn/Base `Accordion`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/accordion.tsx`;
- публичный entrypoint находится в `src/shared/ui/Accordion`;
- каждый item должен быть отдельной карточкой, визуально отделенной от соседних элементов;
- item radius: `20px`;
- стрелка раскрытия должна быть цвета `color-brand`;
- стрелка должна менять направление при открытии;
- раскрывающийся content должен быть отдельным блоком внутри item;
- content background: secondary / `#F4F5F6`;
- content может быть любым `ReactNode`, включая кастомный JSX, кнопки, списки, формы и другие компоненты;
- компонент должен поддерживать `single` и `multiple` режимы;
- API должен поддерживать `items`, `value`, `defaultValue`, `onValueChange`, `disabled`, `className`, `itemClassName`, `triggerClassName`, `contentClassName`;
- `Accordion.stories.tsx` не создавать без отдельной задачи.

## RangePicker

Компонент: `src/shared/ui/RangePicker`.

Назначение: выбор числового значения или, при необходимости, диапазона. Компонент строится отдельно от `antd`, на основе shadcn/Base `Slider`.

Подтвержденное поведение:

- не хранить новый компонент в `src/shared/antd`;
- base primitive находится в `src/shared/ui/base/slider.tsx`;
- публичный entrypoint находится в `src/shared/ui/RangePicker`;
- API поддерживает controlled и uncontrolled значения: `value`, `defaultValue`, `onValueChange`, `onValueCommitted`;
- основное значение - одно число, один бегунок используется чаще всего;
- диапазон передается tuple из двух чисел `[from, to]` и выводит два бегунка;
- поддерживаются стандартные свойства Slider: `min`, `max`, `step`, `disabled`;
- rail использует нейтральный `#E3E5E8` и высоту `4px`, выбранный диапазон - `color-brand`;
- бегунок имеет размер `24px`: белый центр и зеленая обводка `color-brand`, как на подтвержденном референсе;
- `RangePicker.stories.tsx` не создавать без отдельной задачи.

## HorizontalStepper

Компонент: `src/shared/ui/HorizontalStepper`.

Назначение: горизонтальный индикатор линейного flow, например шагов заявки или формы. Компонент визуально разделяет завершенные, текущий и ожидающие этапы.

Подтвержденное поведение:

- `items` обязателен и принимает шаги с `id`, `title` и опциональным `status`;
- если `status` не задан, он вычисляется из `current`: до текущего шага - `finish`, текущий - `process`, после него - `wait`;
- поддерживаемые статусы: `finish`, `process`, `wait`;
- completed marker показывает иконку `completed`, process marker - номер шага;
- finish/process marker и пройденная линия используют `color-brand`;
- wait marker белый с нейтральным текстом, ожидающая линия - `background-onsurface`;
- default `current`: `0`, default `markerSize`: `28px`;
- доступны className-слоты: `className`, `itemClassName`, `markerClassName`, `lineClassName`, `labelClassName`, а также аналогичные поля на отдельном item;
- labels обрезаются по ширине, чтобы длинный текст не ломал сетку;
- `HorizontalStepper.stories.tsx` не создавать без отдельной задачи.

## ScrollableTabs

Компонент: `src/shared/ui/ScrollableTabs`.

Назначение: вывод списка табов или похожих элементов, которые скроллятся по горизонтали в mobile WebView.

Подтвержденное поведение:

- используется для горизонтально скроллящегося списка;
- принимает список `tabs`;
- хранит выбранный элемент через `activeTab`;
- сообщает о выборе через `onTabChange`;
- должен оставаться mobile-first и не превращаться в desktop tabs layout.

Нужно уточнить:

- обязательные визуальные состояния для UI Kit Playground;
- нужны ли disabled/loading states;
- должен ли компонент поддерживать auto-scroll к активному элементу;
- должен ли использоваться только для табов или также для chips/category filters.

## ResultView

Компонент: `src/shared/ui/ResultView`.

Назначение: общий экран результата или статуса, например успешно отправлено, ошибка, отказ или другое финальное состояние сценария.

Подтвержденное поведение:

- контент результата находится по центру экрана;
- action-slot находится снизу и учитывает safe area;
- action-slot может быть кнопкой, ссылкой или другим ReactNode, который играет роль кнопки;
- высота по умолчанию `min-h-dvh`;
- высоту и внешний layout можно переопределить через `className`;
- close action выводится через внешний header;
- close action по умолчанию ведет на `/`;
- close action можно переопределить через handler;
- close action можно выключить.

Стандартные иконки:

- success: `applicationAccepted` из `@shared/iconpack`, обычно `size={56}`, цвет `var(--color-brand)`;
- error/rejected/failure: `face` из `@shared/iconpack`, обычно `size={56}`, цвет `var(--color-secondary)`.

## ListDescription

Компонент: `src/shared/ui/ListDescription`.

Назначение: список строк с верхним label и основным значением, например для краткого описания данных.

Подтвержденное поведение:

- компонент строится без `antd List`, в стиле shadcn/design-system composition;
- разделители строк строятся через shadcn/Base `Separator`;
- компонент сам не задает background, border или radius;
- верхний label использует `foreground-secondary`, `font/Label/medium`;
- основной текст использует `foreground-primary`, `font/Body/xlarge`;
- справа можно опционально вывести иконку или другой ReactNode;
- строку можно сделать кликабельной через `onClick`;
- кликабельность и правая иконка опциональны.

Нужно уточнить:

- нужны ли разделители между строками во всех сценариях;
- должен ли right icon быть только chevron/action icon или любым ReactNode;
- нужны ли compact/large размеры.

## Preloader

Компонент: `src/shared/ui/Preloader`.

Назначение: общий loading-state для Suspense, auth/bootstrap и других ожиданий внутри WebView.

Подтвержденное поведение:

- компонент строится на shadcn/Base `Spinner`, без `antd Spin`;
- `Preloader` отвечает за центрирование спиннера внутри доступной области;
- размер спиннера по умолчанию `size-8`;
- размер и внешний вид спиннера переопределяются через `spinnerClassName`;
- высота/контейнер переопределяются через `className`, например `h-dvh`.

## Storybook

Подтвержденное решение:

- Storybook не нужен как обязательный этап template;
- новые stories не создавать без отдельной задачи;
- существующие или будущие визуальные состояния проверять через UI Kit Playground, если пользователь не попросил Storybook отдельно.

## UI Kit Playground

Страница: `src/pages/UIKit`.

Назначение: отдельная внутренняя страница для просмотра и ручной проверки shared UI компонентов, которые переносятся на shadcn/Base и будущую дизайн-систему.

Подтвержденное поведение:

- route: `/ui-kit`;
- страница должна показывать разные варианты и размеры компонентов;
- компоненты на странице должны быть интерактивными, если у компонента есть controlled state;
- текущие секции включают Button, Segmented, Switch, Checkbox, Radio, TextFiled, InputNumber, NumberSlider, Select, PopupSelect, PopupText, Accordion, RangePicker, HorizontalStepper, Toasts, WarningInfo, ResultView, EmptyArchieve, ErrorPage, AppLoader, Preloader, ScrollableTabs и ListDescription;
- stories для новых компонентов не обязательны, если пользователь явно сказал пока их не делать;
- playground служит быстрой проверкой внутри WebView template вместо обязательного Storybook-этапа.

## Нужно уточнить позже

- Какие компоненты входят в MVP UI kit.
- Какие компоненты берем из `shadcn/ui`, а какие пишем своими.
- Какие states обязательны для каждого компонента.
- Какие компоненты должны иметь mobile-specific behavior.
- Какие компоненты требуют bridge/WebView-specific handling.
