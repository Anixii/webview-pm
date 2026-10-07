---
name: webview-bridge-builder
description: Design, implement, review, and debug typed MBANK WebView Bridge integrations, including native actions, capabilities, origins, auth, payments, errors, logging, and runtime helper setup.
---

# WebView Bridge Builder

## Workspace And References

Read applicable target instructions and active feedback when present, honoring current user instructions and authorization. All references below resolve relative to this installed `SKILL.md`; paths like `src/shared/mobile-bridge` refer to target/template runtime, not bundled plugin code.

- Read [mbank-webview-bridge.md](../../docs/references/mbank-webview-bridge.md) for the native contract and [mbank-bridge-helper.md](../../docs/references/mbank-bridge-helper.md) for the template frontend helper.
- For missing helper code or examples, read [template-access.md](../../docs/template-access.md).
- For back/close/deeplinks, read [navigation-best-practices.md](../../docs/references/navigation-best-practices.md) and use `webview-navigation-builder`.
- For payment, inspect the actual backend preparation contract before calling `payment.start`.

For implementation, locate the target's helper, event types, environment declarations, aliases, Sentry integration, and relevant auth setup. Template examples are `src/shared/mobile-bridge/{index.ts,types.ts,mobileBridge.ts}`, `src/@types/global.d.ts`, and `src/modules/Auth/components/AuthProvider.tsx`. Verify they exist and match the selected template revision.

If a helper is absent, retrieve the configured pinned template helper with its imports, types, logging/error helpers, aliases, and required dependencies. If no usable source is available, implement the smallest typed shared adapter from the bundled confirmed native contract within the authorized feature. Do not fabricate capabilities, payload fields, auth/payment endpoints, or native success results to fill a gap. The feature should call the shared adapter rather than `window.MBankBridge.invoke` directly.

## Verified Template Behavior

The documented helper exports `callMobile(type, payload, options)` and typed helpers including `closeMobileWebView`, `requestMobileAuth`, `startMobilePayment`, share/PDF/external/deeplink, analytics/adjust/biometry/device actions. Confirm export signatures against actual target code before use.

Template startup has no global provider that invokes native actions at mount. Availability and `bridgeUnavailable` retries occur for the concrete action. Preserve this behavior when bringing the helper into a new project; do not add an automatic startup gate just to check availability.

Exact `token=GUEST` is guest mode: do not call backend auth, `/auth/me`, or `auth.required` automatically. Absent startup token also does not trigger template `AuthProvider` bootstrap. Mount backend auth bootstrap only for a confirmed project requirement; call `requestMobileAuth()` explicitly for an authorized startup gate or protected guest action. Confirm `authResume` capability and any `redirectUrl` for that action.

The documented runtime enables successful local mocks on localhost. Both `?mbankBridge=mock` and `?mbankBridge=disabled` return successful mock results in that implementation; `disabled` does not simulate `bridgeUnavailable`. Verify the behavior for the pinned/target revision. Local mock success does not verify a real native handler; native checks must run without the mock parameter.

## Action Implementation

Identify event type, required capability, documented payload/result, allowed origins for URLs, missing/old-app fallback, friendly error state, and diagnostics. Confirm unknown integration fields with the user or authoritative project contracts.

- Extend `MobileBridgeEventMap` first for a confirmed new event. Add a typed helper when common or meaningfully clearer.
- Prefer typed helpers / `callMobile`; handle thrown `MobileBridgeInvokeError` through `isMobileBridgeInvokeError` when those exports exist.
- Use `callMobileResponse` only when the feature needs raw `ok: false` handling. Preserve central shared-helper diagnostics.
- Rely on the helper's action-scoped retry for `bridgeUnavailable`; implement additional retry UX only for a concrete requirement.
- Treat `missingCapability`, `forbiddenOrigin`, `unsupportedAction`, and `handlerFailed` as integration/config/diagnostic issues. Keep technical codes/details out of user copy.
- Keep capabilities and allowed origins in backend/native configuration; do not hardcode a frontend capability whitelist.
- Prepare payment from the confirmed backend response, then call `payment.start`. Do not infer real payment completion from invocation or local mock success.

New MBANK native integrations use `window.MBankBridge.invoke` through the shared typed layer. Legacy URL/AJAX interception and `window.flutter_inappwebview.callHandler` are not defaults for new code; consult legacy documentation only for an explicitly identified legacy flow.

## Verification And Delivery

Give a short implementation plan and make scoped changes within authorization. Verify typing/error handling with target scripts, and describe the used events/capabilities/origins. For native release checks verify old-app fallback, retry behavior, Sentry diagnostics, and relevant payment result/callback in the MBANK environment. Report which native checks remain unverified; do not claim local mocks establish native compatibility. Do not launch a dev server without the user's request.

Record newly confirmed project behavior in the target's maintained documentation when part of the task; do not edit installed plugin cache or assume this target has `docs/webview-app-builder`.
