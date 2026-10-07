---
name: webview-navigation-builder
description: Design, implement, review, and debug MBANK WebView routes, header metadata, back and close behavior, steps, deeplinks, auth redirects, and dirty-form exits.
---

# WebView Navigation Builder

## Workspace And References

Read applicable target `AGENTS.md` and active `AGENT_FEEDBACK.md` when present. Follow the target's routing and authorization rules; do not assume template workbench phase constraints apply to another project. Inspect actual React Router version, route/header code, aliases, and existing flows for code-aware planning or implementation.

Documentation links resolve from this installed `SKILL.md`; runtime paths below refer to the user's target project or template examples, never the plugin directory.

- Read [navigation-best-practices.md](../../docs/references/navigation-best-practices.md).
- For native close, deeplink, payment, preview, or auth, read [mbank-webview-bridge.md](../../docs/references/mbank-webview-bridge.md) and [mbank-bridge-helper.md](../../docs/references/mbank-bridge-helper.md); use `webview-bridge-builder` for integration work.
- For startup/auth redirects, read [webview-context.md](../../docs/references/webview-context.md).
- For dirty form exits, read [forms-best-practices.md](../../docs/references/forms-best-practices.md).
- For missing header/stepper UI or layout, use [component-creation.md](../../docs/component-creation.md); for absent template runtime code, use [template-access.md](../../docs/template-access.md).

## Template Route Pattern

When the target contains the MBANK template pattern, start with `src/pages/model.tsx`, `src/modules/Common/model/types.ts`, `src/modules/Common/lib/headerHelpers.ts`, and `src/modules/Common/hooks/useHeader.ts`. Otherwise locate equivalent files and preserve their actual routing architecture.

The documented template uses `createRouteObject([...])` and route `handle` metadata:

- `title`: i18n key for header text.
- `subtitle` / `dynamicTitle`: resolve subtitle/title from location state.
- `backUrl`: string or function of the active/all matches.
- `isExit`: header back closes the WebView.

The documented `useHeader` resolves `isExit` to `closeMobileWebView()`, otherwise a resolved `backUrl` to replace navigation, otherwise `navigate(-1)`. Verify this order and the metadata types against the target code before editing.

For a template route, specify `path`, `element`, `handle.title`, and necessary `backUrl` / `isExit` / dynamic metadata. In a different target use its corresponding typed metadata rather than adding a second route system.

## Flow Decisions

Identify the first screen, linear/optional steps, technical transitions, and success/result screens. Define header back and explicit close separately on each route. Specify replace navigation where stale transition/success/payment screens must not remain in history. Check back from the entry route with no previous internal history.

Account for dirty data before back/close and auth return requirements. The MBANK documented default for auth return is the main route; confirm any alternate restoration behavior. Android system-back ownership is an open point in the knowledge base; inspect/confirm the target integration instead of assuming every app uses the same handler.

Prefer route metadata and shared header/layout primitives. Preserve F-001 reuse-first for new UI and F-002 modular meaningful blocks. If a header/stepper/control is missing, reuse target components, compose existing primitives, retrieve pinned template code with dependencies, then create the scoped UI needed by the task. Do not start a broad routing migration to add one screen.

Use verified typed helpers such as `closeMobileWebView()`, `openDeepLink()`, and `requestMobileAuth()` through the target's shared bridge import. If missing, use `webview-bridge-builder` to retrieve or implement the documented helper. Do not call `window.MBankBridge.invoke` directly in feature code.

Deeplink schemes, capabilities, allowed origins, and support must come from confirmed contracts. A new WebView opened by deeplink is documented to sit over the current WebView; verify applicable native behavior when it matters. Mark unknown native behavior as `Нужно уточнить`. Do not invent a bridge event for back or design normal flows around full page reloads.

## Delivery And Debugging

Give a concise flow summary, route map, header/back/close behavior, relevant bridge capabilities, dirty/auth rules, open integration questions, and implementation files. Proceed within existing task authorization; ask only about material unknown behavior.

For bugs, use `webview-debugger` and investigate metadata, `backUrl`, stale history/replace, absent bridge, unapproved deeplink, dirty interception, and auth redirect mismatch from concrete target evidence. Run relevant target runtime checks after implementation. Native back/close/deeplink verification needs the supported MBANK environment; distinguish that from local routing checks. Do not launch a dev server without the user's request.
