---
name: webview-app-builder
description: Prepare and build MBANK React WebView projects from a brief, design and API contract. Use for new-project setup, screen or flow implementation, knowledge questions and routing to UI, forms, navigation, Bridge or debugging workflows.
---

# WebView App Builder

Use this skill as the main entrypoint for the installed MBANK WebView plugin. Resolve links below relative to this `SKILL.md`; runtime paths refer to the target workspace, not the installed plugin.

## Start from the actual workspace

1. Read the target project's applicable `AGENTS.md` and `AGENT_FEEDBACK.md` when present, and follow current user authorization and project rules. An empty folder is a supported starting state.
2. Read the bundled [knowledge map](../../docs/README.md). Load only the documents needed for this request.
3. Identify the user's intended result and inspect the workspace. A request to create a project in an empty folder uses [webview-project-bootstrap](../webview-project-bootstrap/SKILL.md). In an existing project, inspect its package manager, dependencies, routes, UI and relevant feature before proposing code.
4. Give a brief implementation plan and proceed within the authorized task. Follow any actual project requirement for separate approval; the plugin itself does not assume template-authoring restrictions apply to every project.
5. Ask only for missing inputs that block the requested result: template source for bootstrap, design, API, authentication or native behavior. An unset template source does not block UI implementation in an existing project. State reasonable UI assumptions; do not invent backend endpoints, capabilities or native contracts.

## Choose the workflow

| User goal                        | Load when needed                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New project in an empty folder   | [Project bootstrap](../webview-project-bootstrap/SKILL.md), [setup procedure](../../docs/bootstrap.md)                                                                                            |
| Page or UI implementation        | [UI builder](../webview-ui-builder/SKILL.md), [UI rules](../../docs/references/ui-best-practices.md), [page architecture](../../docs/references/ui-page-building.md)                              |
| Form                             | [Form builder](../webview-form-builder/SKILL.md), [form guidance](../../docs/references/forms-best-practices.md)                                                                                  |
| Routes, header, back or close    | [Navigation builder](../webview-navigation-builder/SKILL.md), [navigation guidance](../../docs/references/navigation-best-practices.md)                                                           |
| Native actions or authentication | [Bridge builder](../webview-bridge-builder/SKILL.md), [Bridge contract](../../docs/references/mbank-webview-bridge.md), [typed helper](../../docs/references/mbank-bridge-helper.md)              |
| API loading and errors           | [API error guidance](../../docs/references/api-error-handling.md)                                                                                                                                 |
| Bug or diagnosis                 | [Debugger](../webview-debugger/SKILL.md), [debugging playbook](../../docs/references/debugging-playbook.md)                                                                                       |
| Knowledge or requirements        | [WebView context](../../docs/references/webview-context.md), [project questionnaire](../../docs/references/project-questionnaire.md), [screen patterns](../../docs/references/screen-patterns.md) |

Skills are cooperating workflows, not mandatory independent agents. Use available delegation only when independent work benefits the current task and the target environment permits it.

## Implementation decisions

Inspect the nearest page/module and available shared UI before creating new code. Follow [component creation](../../docs/component-creation.md): reuse, compose, retrieve appropriate template code with its dependencies, then implement missing UI from the confirmed rules. A missing `src/shared/ui` folder or named template helper does not by itself block UI creation.

Use [template access](../../docs/template-access.md) when reference code is needed. Read its configured repository and revision instead of guessing a remote from this project's Git settings. Inspect actual dependencies and exports; documentation examples are not proof that a component is installed.

Keep meaningful visual blocks in component files, behavior in focused hooks, and route wiring in pages when this fits the MBANK project structure. RHF forms use the semantic form and hook conventions of the form skill. Typed helpers own the native invocation boundary. Prefer the project's available Base UI/shared primitives and confirmed iconpack. Missing primitives can be implemented on the existing React/TypeScript stack; do not install or migrate the whole UI system to render a simple screen. Do not introduce `antd` or `antd-mobile`.

## Deliver the result

Complete implementation when requested, including required checks. Bootstrap readiness and feature readiness are separate: do not report the application ready after a failed install or check. Do not start the dev server unless asked.

For knowledge questions, give a direct answer supported by bundled docs and mark unresolved facts. For changes, summarize what was created or adapted, which components were reused, verification results and any concrete missing contract. Put newly confirmed project facts in the target project's documentation, keeping them distinct from bundled plugin knowledge. Update the plugin's source docs only when maintaining the plugin is in scope.
