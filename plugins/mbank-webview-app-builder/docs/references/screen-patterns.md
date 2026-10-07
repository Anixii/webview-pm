# Screen Patterns

> Документация плагина; исходный снимок знаний — 30 сентября 2026. Пути `src/*`, aliases и имена helpers описывают canonical React-шаблон. В рабочем проекте сначала найти соответствующую реализацию и проверить её API; отсутствующий код получить или создать по [правилам компонентов](../component-creation.md). [Происхождение и границы](../provenance.md).

Подтверждены правила result/status screens. Остальные типы экранов перечислены как варианты; отдельные контракты для них пока не зафиксированы.

Возможные типы экранов для уточнения сценария:

- list/detail/create/edit;
- CRUD;
- dashboard;
- settings;
- onboarding;
- wizard;
- approval flow;
- profile;
- search/filter screen;
- empty state screen;
- error recovery screen.

## Result/status screens

Для экранов результата использовать `src/shared/ui/ResultView`.

Подтвержденные правила:

- контент результата находится по центру экрана;
- основное действие находится снизу и учитывает safe area;
- нижнее действие может быть кнопкой, ссылкой или другим ReactNode, который играет роль кнопки;
- close action выводится через внешний header;
- close action по умолчанию ведет на `/`, если не передан отдельный handler;
- close action можно отключить;
- высота экрана по умолчанию `min-h-dvh`, но может быть переопределена через `className`.

Стандарт иконок:

- успешный кейс: `applicationAccepted` из `@shared/iconpack`, обычно `size={56}`, цвет `var(--color-brand)`;
- ошибка, отказ или неуспешный кейс: `face` из `@shared/iconpack`, обычно `size={56}`, цвет `var(--color-secondary)`.

При проектировании нового WebView result/status screen нужно уточнять:

- какой статус показываем: success, error, rejected, pending или другой;
- какой текст title/subtitle нужен пользователю;
- нужно ли показывать close action;
- куда ведет close action, если не `/`;
- какое нижнее действие нужно и должно ли оно быть fixed-bottom behavior.
