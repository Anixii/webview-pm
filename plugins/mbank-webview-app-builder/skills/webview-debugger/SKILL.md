---
name: webview-debugger
description: Investigate, explain, fix, and report MBANK WebView bugs involving UI, API and RTK Query, auth and tokens, Bridge, forms, navigation, loading, and mobile runtime behavior.
---

# WebView Debugger

## Workspace And References

Read applicable target instructions and active feedback when present. Work within the user's diagnosis/fix request and current authorization. Documentation links are relative to this installed `SKILL.md`; runtime paths are target/template examples whose existence and behavior must be verified.

Read [debugging-playbook.md](../../docs/references/debugging-playbook.md), classify the affected area, then read only the relevant references:

- UI: [ui-best-practices.md](../../docs/references/ui-best-practices.md).
- API/RTK Query: [api-error-handling.md](../../docs/references/api-error-handling.md).
- Auth/token: [webview-context.md](../../docs/references/webview-context.md) and [mbank-bridge-helper.md](../../docs/references/mbank-bridge-helper.md). Consult [legacy-webview-integration.md](../../docs/references/legacy-webview-integration.md) only when evidence identifies a legacy flow.
- Bridge: [mbank-webview-bridge.md](../../docs/references/mbank-webview-bridge.md) and [mbank-bridge-helper.md](../../docs/references/mbank-bridge-helper.md).
- Form: [forms-best-practices.md](../../docs/references/forms-best-practices.md).
- Navigation: [navigation-best-practices.md](../../docs/references/navigation-best-practices.md).
- Missing UI/runtime examples: [component-creation.md](../../docs/component-creation.md) and [template-access.md](../../docs/template-access.md).

Use the sibling specialized skill for a fix that materially touches its area. Preserve UI reuse and modular blocks (F-001/F-002) and form ownership (F-003) when changing feature code.

## Evidence And Diagnosis

Ask only for missing information that is needed to reproduce or classify the issue. Prefer a reproducible route/action, actual component code, sanitized payload/status, bridge response, Sentry issue, screenshot/video, or network evidence. Distinguish confirmed observations from hypotheses and point to verified code paths.

For implementation, inspect package scripts, installed versions, imports, aliases, and the target's corresponding central error/auth/provider code. In the MBANK template, useful starting paths are:

- RTK Query logger: `src/shared/api/rtk-query/lib/queryErrorLogger.ts`.
- Error helpers: `src/shared/api/rtk-query/lib/errorUtils.ts`.
- Endpoint skip notification: `src/shared/api/rtk-query/lib/transformErrorWithSkip.ts`.
- Refresh flow: `src/shared/api/rtk-query/lib/baseQueryWithRefresh.ts`.
- Auth: `src/modules/Auth/components/AuthProvider.tsx`.
- Token provider: `src/app/providers/TokenProvider/`.
- Storage: `src/shared/libs/storage/`.
- Typed bridge: `src/shared/mobile-bridge/`.

If these paths are missing, find target equivalents. Do not treat a template file as evidence for target behavior. Retrieve pinned template code only when comparison or a missing implementation is useful, including its dependency closure.

For bridge/auth issues, distinguish new MBANK Bridge integration from legacy query/URL interception. Check guest token handling, explicit auth requirements, actual bridge mock mode, capability/origin config, and error propagation. A successful local mock does not reproduce native behavior.

## Fixes And Reports

Explain the suspected cause plainly and make a focused fix when authorized. Reuse target components first; compose primitives, retrieve a suitable pinned template implementation, or create scoped missing UI when the fix requires it. Missing components alone do not justify fabricated API/native behavior or unrelated refactoring.

Preserve centralized API notification/logging. Use its skip mechanism for a form's endpoint-specific error handling to avoid duplicate messages. Keep technical bridge codes, raw backend details, and the word `Ошибка` out of recommended MBANK user copy; use friendly scenario text from confirmed rules.

For analysis, report summary, affected area, evidence found or needed, suspected cause, fix, and verification. For a formal bug report or authorized developer handoff, use the full bundled playbook template. Writing a report does not itself authorize sending it to others.

Run minimal meaningful target runtime checks after a code fix. Reproduce the relevant interaction using available permitted tools; do not launch a dev server without the user's request. Distinguish completed local checks from MBANK device checks and unresolved evidence. Never invent API contracts, native capabilities, deeplinks, allowed origins, or MBANK configuration.
