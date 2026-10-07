# UI Best Practices

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Статус: частично заполнено. Это первый слой UI foundation для WebView-проектов.

## Базовый принцип

WebView должен ощущаться как часть мобильного приложения, а не как внешний сайт.

Пользователь не должен понимать, что он находится внутри WebView.

UI нужно проектировать как mobile app experience: компактно, понятно, без desktop-паттернов и без ощущения "сайта на компьютере".

## Composition and Reuse

Новый UI строится reuse-first, а не заново для каждого экрана:

1. Сначала проверить `src/shared/ui` и существующие blocks в близком module/page.
2. Если готовый API подходит, использовать его без локальной копии или стилизации поверх другого control.
3. Если нужен доменный block только этому flow, разместить его в `src/modules/<Feature>/components/<Block>/index.tsx`.
4. Поднимать block в `src/shared/ui` только после подтверждённой domain-neutral потребности и понятного API для нескольких сценариев.

В новом коде один implementation file содержит один React component. Самостоятельные UI-блоки выносить в отдельные folders с главным component в `index.tsx`; если папке нужны дополнительные components, каждому дать отдельный осмысленно названный файл. Не объявлять мини-components внутри parent file. При этом не создавать component ради каждого `div`, label или spacing wrapper: граница нужна у смыслового блока с собственной ролью, props или state.

## Layout

- Делать mobile-first.
- Использовать ограничение ширины, чтобы интерфейс ощущался как экран мобильного приложения или маленького планшета.
- Рекомендуемая максимальная ширина контейнера: примерно `528-628px`.
- Всегда учитывать нижнюю safe area.
- Fixed bottom actions допустимы, если это нужно сценарию.
- При fixed bottom actions нужно оставлять место под safe area и не перекрывать контент.

## Допустимые паттерны

- Экраны, похожие на native mobile flow.
- Stepper для многошаговых сценариев.
- Bottom sheets.
- Select-like сценарии через bottom sheet, если так лучше для mobile UX.
- Skeleton/shimmer для загрузки контентных блоков.
- Spinner/loader для простых загрузок.
- Full-page spinner, если грузится вся страница.

## Нежелательные паттерны

- Делать WebView как desktop-сайт.
- Использовать широкие desktop-layouts.
- Делать интерфейс, который визуально выбивается из мобильного приложения.
- Использовать много анимаций.
- Использовать тяжелые эффекты без необходимости.

## Actions

- Primary action размещать выше secondary action.
- Secondary action располагать ниже primary.
- Fixed bottom actions можно использовать, если это нужно сценарию.

## Loading, Error, Empty, Success

Loading:

- skeleton/shimmer для контента;
- spinner/loader для простых ожиданий;
- full-page spinner для загрузки всей страницы.

Error:

- отдельный экран ошибки, если сценарий не может продолжаться;
- inline/display error, если ошибка локальная и пользователь может продолжить работу.

Для empty и success states проверить готовые компоненты по [inventory](ui-component-inventory.md), затем адаптировать состояние под сценарий.

## Touch Targets

Отдельных числовых требований пока нет. Проектировать так, чтобы элементы удобно нажимались в мобильном WebView.

## Animation

Анимаций почти нет. Использовать только легкие и функциональные переходы, если они помогают сценарию.

## Typography

Основной шрифт для UI tokens: `"Nunito mbank"`.

### Headline / Display

| Token                    | Font         | Size | Weight | Line height | Letter spacing |
| ------------------------ | ------------ | ---: | -----: | ----------: | -------------: |
| `displayXLarge_32Exbold` | Nunito mbank | 32px |    800 |        38px |         -0.3px |
| `displayLarge_28Exbold`  | Nunito mbank | 28px |    800 |        34px |         -0.3px |
| `displayMedium_24Exbold` | Nunito mbank | 24px |    800 |        30px |         -0.3px |
| `displayMedium_24Medium` | Nunito mbank | 24px |    500 |        30px |         -0.3px |
| `displaySmall_20Exbold`  | Nunito mbank | 20px |    800 |        24px |         -0.3px |
| `displaySmall_20Medium`  | Nunito mbank | 20px |    500 |        24px |         -0.3px |

### Label / Title / Headline

| Token                    | Font         | Size | Weight | Line height | Letter spacing |
| ------------------------ | ------------ | ---: | -----: | ----------: | -------------: |
| `labelLarge_ExBold_17`   | Nunito mbank | 17px |    800 |        22px |         -0.2px |
| `titleLarge_Medium_17`   | Nunito mbank | 17px |    500 |        22px |         -0.2px |
| `headlineMedium_Bold_17` | Nunito mbank | 17px |    700 |        22px |         -0.2px |

### Body

| Token                 | Font         | Size | Weight | Line height | Letter spacing |
| --------------------- | ------------ | ---: | -----: | ----------: | -------------: |
| `bodyLarge_16Medium`  | Nunito mbank | 16px |    500 |        21px |         -0.2px |
| `bodyMedium_13Medium` | Nunito mbank | 13px |    500 |        18px |         -0.2px |
| `bodyMedium_13Bold`   | Nunito mbank | 13px |    700 |        18px |         -0.2px |

### Subtitle

| Token                   | Font         | Size | Weight | Line height | Letter spacing |
| ----------------------- | ------------ | ---: | -----: | ----------: | -------------: |
| `titleMedium_Exbold_15` | Nunito mbank | 15px |    800 |        20px |         -0.2px |
| `titleMedium_Medium_15` | Nunito mbank | 15px |    500 |        20px |         -0.2px |

### Caption

| Token                | Font         | Size | Weight | Line height | Letter spacing |
| -------------------- | ------------ | ---: | -----: | ----------: | -------------: |
| `bodySmall_12Medium` | Nunito mbank | 12px |    500 |        16px |         -0.1px |
| `bodySmall_12Bold`   | Nunito mbank | 12px |    700 |        16px |         -0.1px |

## Color Tokens

Notation:

- `◦` - light theme.
- `•` - dark theme.

Runtime theme:

- `useTheme` должен жить вне `antd`-слоя.
- Источник темы: query parameter `theme`, затем сохранённое значение в storage, затем default `light`.
- Тема применяется на `document.documentElement` через `data-theme`, классы `light`/`dark` и `color-scheme`.
- UI-компоненты должны использовать theme tokens/CSS variables, а не хардкодить light surfaces вроде `bg-white`.

### Text

| Token              | Light     | Dark      |
| ------------------ | --------- | --------- |
| `Text / Primary`   | `#111622` | `#FFFFFF` |
| `Text / Secondary` | `#626975` | `#939498` |
| `Text / Tertiary`  | `#A0A7B1` | `#6B6C70` |
| `Text / On color`  | `#FFFFFF` | `#FFFFFF` |
| `Text / Attention` | `#F97117` | `#FE7F2E` |
| `Text / Warning`   | `#E02D3C` | `#E84A4A` |
| `Text / Success`   | `#17AA5D` | `#0ACF83` |

### Body

| Token                 | Light            | Dark             |
| --------------------- | ---------------- | ---------------- |
| `Body / Primary`      | `#FFFFFF`        | `#1C1C1E`        |
| `Body / Secondary`    | `#F4F5F6`        | `#27272A`        |
| `Body / Tertiary`     | `#E3E5E8`        | `#2F2F32`        |
| `Body / Attention`    | `#E02D3C` at 10% | `#E84A4A` at 10% |
| `Body / ModalScreens` | `#EFF0F1`        | `#111112`        |

### Accent

| Token                   | Light     | Dark      |
| ----------------------- | --------- | --------- |
| `Accent / MainAccent`   | `#FFDD2D` | `#FFDD2D` |
| `Accent / AccentBright` | `#129958` | `#129958` |

### Background and Divider

| Token               | Light     | Dark      |
| ------------------- | --------- | --------- |
| `BG / Background`   | `#EFF0F1` | `#050506` |
| `Divider / Primary` | `#DCDFE4` | `#343437` |

## Checkbox

- Unchecked checkbox: transparent background, secondary border `#A0A7B1`.
- Checked checkbox: `Accent / AccentBright` (`#129958`) background and border, white checkmark.
- Radius: approximately `8px` for the standard and large sizes.

## Radio

- Inactive radio: transparent background and secondary border `#A0A7B1`.
- Active radio: `Accent / AccentBright` (`#129958`) border and a round green indicator inside.
- Radio options should be grouped when only one value may be selected.
- The label may be positioned to the left or right of the control.

## Form Fields

- TextFiled, InputNumber and Select use white background, `20px` radius and a default height of `58px`; compact height is `48px`.
- Default and disabled states do not show a border; focus state shows a green border without a ring or shadow.
- Only error state shows a border, using `Text / Warning` (`#E02D3C`).
- FloatingLabel is a visual composition for TextFiled, InputNumber, Select and Textarea; it floats on focus or when a value is present, including outside a form. It does not register, validate or submit a React Hook Form field.
- Interaction handlers belong on the control itself, not on the FloatingLabel wrapper.
- `TextFiledQuery` and `SelectQuery` from `src/shared/ui/FormQuery` synchronise URL query parameters for filters/search screens. They are not the canonical control pattern for a new RHF submit or autosave form. For such forms use the base shared control with `register` or `Controller`.

## Number Slider

- NumberSlider combines a numeric input and slider over one shared value; changing either control must immediately update the other.
- For compact option cards, use the card view with label, input and slider in one white surface.

## Popup Options

- Use PopupSelect or PopupText when an option list should open in the mobile global drawer instead of a desktop-style popup.
- Every options drawer needs an empty state; the default state may be replaced by scenario-specific `emptyState` content.

## Нужно уточнить

- Точный список базовых компонентов UI kit.
- Button sizes, variants, states.
- Input/select/mask states.
- Bottom sheet rules.
- Toast/notification/error screen texts.
- Empty/success illustrations or icon rules.
- Spacing/radius/elevation tokens.
- Как использовать Inter, если основной token-шрифт `Nunito mbank`.
