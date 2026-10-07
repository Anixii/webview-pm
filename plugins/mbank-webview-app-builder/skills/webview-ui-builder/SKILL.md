---
name: webview-ui-builder
description: Design, implement, and review MBANK WebView pages and UI flows, including shared component reuse, missing component creation, layout, safe areas, screen states, and modular feature structure.
---

# WebView UI Builder

## Workspace And References

Operate in the user's target project. Read its applicable `AGENTS.md` and active `AGENT_FEEDBACK.md` when present, respecting current user instructions and existing authorization. Neither file is required for this plugin to work. Check package scripts, installed dependencies, aliases, styles, and the nearest page/module before implementation.

Documentation links below resolve relative to this `SKILL.md` inside the installed plugin. Runtime paths such as `src/shared/ui` refer to the target project; they describe the MBANK template pattern and are not guaranteed to exist in another project.

- For page composition, read [ui-page-building.md](../../docs/references/ui-page-building.md) and [ui-best-practices.md](../../docs/references/ui-best-practices.md).
- Read [ui-component-inventory.md](../../docs/references/ui-component-inventory.md) as a template catalog; confirm selected components and their APIs against actual code.
- For missing UI, read [component-creation.md](../../docs/component-creation.md); for template code retrieval, read [template-access.md](../../docs/template-access.md).
- For forms, read [forms-best-practices.md](../../docs/references/forms-best-practices.md) and use the sibling `webview-form-builder` skill when applicable.
- For route/header/back changes, read [navigation-best-practices.md](../../docs/references/navigation-best-practices.md) and use `webview-navigation-builder`.
- For native actions, use `webview-bridge-builder`; for API states/errors, read [api-error-handling.md](../../docs/references/api-error-handling.md).

Read conditional references only when the requested screen needs them. Inspect runtime code for code-aware planning or implementation.

## Reuse And Missing Components

Apply the plugin's F-001 defaults: inspect the actual shared UI, nearest module/page, available UI inventory, and `/ui-kit` implementation when present. Reuse suitable controls, layouts, styling, and focused hooks first. Compose existing primitives when no single component fits.

If a needed component is absent, retrieve it from the configured template at its pinned revision only when a concrete example helps. Bring required styles, tokens, helpers, exports, assets, types, and dependencies with it, adapting the result to the target project. If neither project nor template has a suitable solution, create the smallest component needed by the requested feature. Missing UI alone is not a blocker and does not require a new approval when its creation is within the user's authorized task.

Shared components must have domain-neutral, reusable APIs. Keep domain blocks in the feature. Use the target's supported icon system; the MBANK template default is `md-glyphs` / `src/shared/iconpack`. Do not assume an export exists or introduce another icon library merely to fill a gap.

## MBANK Screen Defaults

- Use a 16px horizontal content container and the common header when available.
- Account for safe area in bottom actions and reserve content space for fixed actions.
- Build with the project's existing React/TypeScript shared UI and styles; no new `antd` or `antd-mobile` usage.
- New MBANK forms use `react-hook-form`; inspect its installed version and target patterns before implementation.
- Identify the screen type: info, form, multi-step form, list/select, details/review, result, or API state screen.
- Cover relevant loading, empty, error, success, disabled, and submitting states.
- Add Storybook only when the user asks. Use available target UI inspection instead.

## Modular UI Ownership

Preserve F-002 for new or materially changed feature UI. In an MBANK template project, keep route wiring in `src/pages` and feature code in `src/modules`. Adapt the containing path to an existing project while retaining clear ownership:

```text
<Feature>/
  components/
    <MeaningfulBlock>/
      index.tsx
  hooks/
    use<Feature>.ts
```

- Give meaningful visual/domain blocks their own `components/<Block>/index.tsx`; do not split every `div` or primitive control into a folder.
- Each implementation file contains one React component. Additional components in a block get separate, meaningfully named files. Do not define local JSX components such as `Section`, `Field`, or `Actions` in a page/form file.
- Put feature side effects and orchestration in a focused sibling hook. Split independently complex concerns when needed.
- For business forms, preserve F-003 through `webview-form-builder`: one semantic form root and `hooks/use<Feature>Form.ts` owning behavior.

## Delivery

Before editing, give a short plan covering reuse or missing-component decisions, files, layout, route/header behavior, states, and form/API/bridge needs. Proceed within the user's authorization and target rules; do not import template workbench phase restrictions into another project.

Implement the requested page/flow with focused changes. Do not invent API contracts, native capabilities, route requirements, or business data. Resolve ordinary UI implementation choices from project evidence and MBANK defaults; ask about unknown business or integration requirements that affect correctness.

Use the target's actual typecheck/lint/build scripts as appropriate to the changed runtime. Do not launch a dev server without the user's request. Report changed files, reused or created components, checks, and any unverified native behavior.
