---
name: webview-form-builder
description: Design, implement, review, and debug MBANK WebView forms, including React Hook Form architecture, validation, API errors, editable drafts, autosave, file uploads, and dirty exits.
---

# WebView Form Builder

## Workspace And References

Read applicable target-project instructions and active feedback when present. Current user instructions and authorization govern the work. Check actual dependencies, API hooks, controls, form examples, and scripts; the paths and APIs documented for the MBANK template may differ in the target project.

All documentation links resolve from this installed `SKILL.md`:

- Read [forms-best-practices.md](../../docs/references/forms-best-practices.md).
- For API mapping, read [api-error-handling.md](../../docs/references/api-error-handling.md).
- For exits or multiple steps, read [navigation-best-practices.md](../../docs/references/navigation-best-practices.md).
- For control composition, read [ui-best-practices.md](../../docs/references/ui-best-practices.md) and consult [ui-component-inventory.md](../../docs/references/ui-component-inventory.md).
- For missing controls, read [component-creation.md](../../docs/component-creation.md); for retrieving examples, read [template-access.md](../../docs/template-access.md).

## Form Behavior

Classify the requested form as simple submit or editable/multi-step with a draft and optional autosave. Do not assume that multiple steps require backend autosave. Infer from stated requirements; ask when persistence, wizard structure, dirty exit, or upload contracts remain material unknowns.

Define fields, validation, masks, disabled states, state strategy, submit behavior, and relevant upload behavior. Confirm exact phone/plate/currency formats with the project contract. Keep local state for simple forms unless shared persistence is needed; key Redux drafts by the form/domain entity and select the smallest needed state.

## Reuse And Architecture

Preserve F-001: inspect the target shared UI and nearest form pattern before creating controls. Reuse a suitable input/layout/action or compose existing primitives. If absent, retrieve a pinned template example with its dependencies or create the scoped control following [component-creation.md](../../docs/component-creation.md). Keep domain blocks in the feature and shared APIs domain-neutral.

For new or materially changed forms, preserve F-002 and F-003. Adapt the enclosing feature path to the target project:

```text
<Feature>/
  components/
    <Feature>Form/
      index.tsx
    <MeaningfulFieldsBlock>/
      index.tsx
    <SubmitActions>/
      index.tsx
  hooks/
    use<Feature>Form.ts
```

- The form root renders exactly one semantic `<form noValidate onSubmit={...}>`; never nest forms or replace the root with a `div`.
- `hooks/use<Feature>Form.ts` owns RHF setup, API calls, submit, server-error mapping, draft hydration, dirty state, autosave, and side effects. It returns typed form state/handlers, not JSX.
- Visual blocks receive typed props or appropriate context and render UI; they do not own business API/Redux/navigation side effects.
- Keep one React component per implementation file and meaningful blocks in `components/<Block>/index.tsx`. Additional components need their own named files. Do not add local JSX mini-components to the form file or extract trivial wrappers.
- Extract focused supporting hooks for independently complex concerns. Use `FormProvider` only when real nested blocks benefit from context.
- Do not add a speculative generic shared `FormWrapper` / `FormField`; begin with the feature's actual requirements and reuse scope.

## RHF, Validation, And API Errors

- New MBANK forms use `react-hook-form`, with explicit `defaultValues` and `handleSubmit` created in the feature hook.
- Use `Controller` for controlled or non-register-compatible shared inputs; use `register` for compatible native-like controls.
- Inputs need labels, disabled state, and errors associated with the corresponding field. Show validation below the field and scroll/focus the first invalid field on submit.
- Map contracted field API errors through `setError`. Show friendly general errors above submit or in a form status block; never expose raw backend details.
- For endpoint-specific handling, use the target's existing skip-global-notification mechanism to avoid duplicate messages. Preserve its central error logger and notification behavior.
- Disable submit while RHF or API submission is in progress, show the available loader, and prevent duplicate requests.
- Keep `FormQuery`-style URL filter controls separate from business submit/draft forms. A visual floating label does not register or validate an RHF field.

## Drafts, Autosave, And Uploads

Hydrate RHF from the minimal draft. Use a controlled `reset` only when source data changes; do not overwrite edits on each render. Watch needed fields with `useWatch`/`watch` in the feature hook. Use the existing debounce helper when present (the template example is `src/shared/libs/debounce`) with a default 500ms delay.

Only trigger backend autosave when the confirmed contract requires it. Skip hydration/reset saves unless required, cancel pending debounce on unmount/draft changes, and prevent stale values from overwriting newer state. Define dirty back/close behavior from the flow's requirements rather than choosing an arbitrary exit confirmation.

For uploads, reuse or create a scoped `FileUploader` with browser `File` data, no Ant Design/domain types in its public API. MBANK WebView file handling uses base64 in the documented scenarios; confirm whether the backend expects presigned upload or direct base64 submission, size/type limits, and request shape.

## Delivery

Give a short plan with form type, reuse decisions, component/hook ownership, validation/state/API/exit behavior, and files. Implement or diagnose within the authorized request; keep existing form-library migration a separate task unless requested. Run relevant target runtime checks and report observable behavior and remaining integration questions. Do not launch a dev server without the user's request.
