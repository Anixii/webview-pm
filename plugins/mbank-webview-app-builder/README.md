# MBANK WebView App Builder

Installable plugin for preparing and developing React WebView projects. This folder contains its own maintained knowledge base and seven skills. The React template is a separate Git repository, retrieved only when project creation or component reuse needs its code.

## Current readiness

Version `0.1.0` includes packaged knowledge, project bootstrap, UI creation, forms, navigation, MBANK Bridge and debugging. The template GitHub repository has not been created yet: `repository` and `ref` in [template-source.json](template-source.json) are intentionally `null`. Configure both before bootstrapping a real project. Existing-project work and creation of missing UI from confirmed rules remain available.

The repository URL does not grant access. A private template requires Git credentials or an available authenticated GitHub connection. Bootstrap also needs Git, Node.js and the selected package manager in its execution environment.

## Skills

| Skill                        | Goal                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `webview-app-builder`        | Main entrypoint: understand the request, select relevant knowledge, route preparation and implementation. |
| `webview-project-bootstrap`  | Populate an empty folder from a specific template revision, install dependencies and verify readiness.    |
| `webview-ui-builder`         | Build pages, meaningful UI blocks and missing components.                                                 |
| `webview-form-builder`       | Implement RHF forms, validation, submit, autosave and dirty state.                                        |
| `webview-navigation-builder` | Configure routes, header, back/close and deep links.                                                      |
| `webview-bridge-builder`     | Use the confirmed MBANK Bridge contract and typed helpers.                                                |
| `webview-debugger`           | Investigate bugs and produce evidence-backed reports or requested fixes.                                  |

`agents/openai.yaml` in each skill provides UI metadata. These files are not separate autonomous agents. The workflow works with one coding agent; supported delegation is optional for independent tasks.

## Knowledge and template code

Read [docs/README.md](docs/README.md) for the knowledge map, [docs/bootstrap.md](docs/bootstrap.md) for setup, and [docs/component-creation.md](docs/component-creation.md) for missing-component behavior.

Plugin docs are the maintained source for this package's rules. Target project instructions and the user's current request determine the scope of changes. Code paths in reference documents describe the canonical template; check their existence and exports in the actual project or configured revision before using them.

Use a full template commit or release tag, then record the resolved commit in each generated project. When updating the template revision, review the corresponding component, theme, navigation and Bridge guidance before releasing a new plugin version. Do not invent API contracts or native capabilities to fill gaps.

## Configure and use

In the plugin source folder, set `repository` to the template Git URL and `ref` to its full commit or release tag in `template-source.json`, then refresh the installed package. Keep `packageManager: "yarn"` for the current MBANK template. Use `verificationScripts` to select its non-mutating checks. For a single task, supply the source as bootstrap arguments instead of editing an installed cache.

Then open an empty project folder and request:

> Use $webview-app-builder to create a WebView project here and implement this brief.

The agent invokes the bundled bootstrap script, installs dependencies using the lockfile and runs the checks. It reports the local development command for manual launch. In an existing project, it inspects and reuses available components, retrieves template code when useful, and creates an appropriately scoped component when the needed UI does not exist.

## Local installation

The authoring repository exposes this package through `.agents/plugins/marketplace.json` under the source **MBANK WebView Local**. Open the Plugins Directory in a supported local Codex client, select that source and install **MBANK WebView App Builder**. Restart the app if the local source is not visible, and use a new chat after installation. The repository's original project-local skills may also be visible while developing here; use a separate test project to evaluate the installed plugin without those duplicates.

To distribute the plugin elsewhere, copy the whole plugin folder or package it as a ZIP. The ZIP contains a single `mbank-webview-app-builder/` root folder. Register the folder in the recipient's local marketplace or follow the host's supported plugin distribution flow. The included `plugin.json` uses the portable Agent Plugins format described in [OpenAI's packaging documentation](https://developers.openai.com/plugins/build/plugins).

## Validate and package

Run from this plugin folder:

```sh
node scripts/validate-plugin.mjs
node --test scripts/bootstrap-project.test.mjs
python3 scripts/package-plugin.py --output /tmp/mbank-webview-app-builder-0.1.0.zip
```

Validation checks this package's manifest, seven skill entrypoints, supporting resources and source configuration. Bootstrap tests use isolated local Git fixtures and offline dependency installation. Real GitHub access and the final React template installation still require the configured repository and its release.
