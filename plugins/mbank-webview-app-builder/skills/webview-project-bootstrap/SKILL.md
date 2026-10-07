---
name: webview-project-bootstrap
description: Create an MBANK React WebView project in an empty folder from the configured template revision, install dependencies and verify setup. Use for project initialization; existing-project feature work belongs to the WebView implementation skills.
---

# WebView Project Bootstrap

Resolve bundled paths relative to this file. Bootstrap copies application code into the user's target folder; installed plugin skills remain in the plugin.

## Prepare the project

1. Read applicable target workspace instructions when present. Confirm the requested target path and inspect its contents. Existing files require an explicit migration or merge task; this bootstrap handles an empty folder.
2. Read [bootstrap procedure](../../docs/bootstrap.md) and [template source](../../template-source.json). If `repository` or `ref` is unset, request the intended Git repository and release tag or full commit. A supplied source override is task-local unless maintaining plugin configuration is explicitly in scope. Never infer the template from an unrelated working-tree remote.
3. Check Git, Node.js and the selected package manager. Use the actual template's supported runtime and registry access; if an executable or private registry credential is missing, report exactly what is needed. Follow the environment's permissions for installation and network access.
4. For an authorized request to prepare the project, run the bundled script by its resolved absolute path:

   ```sh
   node <plugin-root>/scripts/bootstrap-project.mjs --target <target-folder>
   ```

   When the user supplies the source, pass `--repository <git-url>` and `--ref <full-commit-or-tag>`. Pass arguments safely as separate values, not through an interpolated shell expression. Tags resolve to an exact commit recorded in the project; prefer a full reviewed commit for distributed releases.

5. The default flow copies tracked source, installs locked dependencies and runs configured verification scripts. Inspect `.webview-template.json` and the exit status. After a failure, preserve the copied project, diagnose the failed step and retry that step in place under the existing authorization; do not rerun bootstrap into its populated folder.
6. Report the repository/revision, dependency and verification results, and the actual development command from `package.json`. Start a server only when requested. Continue the originally requested feature through [webview-app-builder](../webview-app-builder/SKILL.md) after setup succeeds.

`--copy-only` is for inspecting template code in an isolated temporary folder or an explicitly requested download without installation. A copy-only result is not a ready project. If the user asks only for planning or explanation, describe the procedure without initializing files.
