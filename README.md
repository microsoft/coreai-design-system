# CoreAI

> Our agentic collaborators live on a curved surface of possibilities. This design system gives that surface its shape for both humans and agents to navigate.

This is the monorepo for **CoreAI**, a Fluent UI v9 design system.

Code, issues, pull requests, and GitHub Actions are available at
[microsoft/coreai-design-system](https://github.com/microsoft/coreai-design-system).

Documentation is available under the
[Creative Commons Attribution 4.0 International license](LICENSE), and source code is available
under the [MIT license](LICENSE-CODE).
Use the links below to explore the documentation, Storybook, and read-only MCP endpoint.

## Live links

| Resource             | URL                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------ |
| 🏠 Docsite (landing) | https://coreai-ds.azurewebsites.net                                                        |
| 📚 Storybook         | https://coreai-ds-storybook.azurewebsites.net                                              |
| 🤖 MCP endpoint      | https://coreai-ds-storybook.azurewebsites.net/mcp                                          |
| 📦 Package (npm)     | [`@coreai-ds/react-components`](https://www.npmjs.com/package/@coreai-ds/react-components) |

## Workspaces

| Path                                                   | Package                                       | Purpose                                                                                         |
| ------------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [apps/docsite](apps/docsite)                           | `@coreai-ds/docsite` (not published to npm)   | Infrastructure scaffold for static docsite build/serve and Azure App Service deployment wiring. |
| [packages/react-components](packages/react-components) | `@coreai-ds/react-components`                 | The publishable theme package. Drop-in `<CoreAIFluentProvider>` + CoreAI-wrapped components.    |
| [apps/storybook](apps/storybook)                       | `@coreai-ds/storybook` (not published to npm) | Storybook playground that previews the theme against Fluent UI's canonical stories.             |
| [apps/prototype](apps/prototype)                       | `@coreai-ds/prototype` (private)              | CoreAI prototype app. See its README for the current migration scope and local setup.           |

- Consumer + extension guide: [packages/react-components/README.md](packages/react-components/README.md)
- Storybook, `fluent-stories/`, and the MCP for AI agents (authoring): [apps/storybook/README.md](apps/storybook/README.md)
- GitHub Actions workflows and operations: [docs/GITHUB-ACTIONS.md](docs/GITHUB-ACTIONS.md)
- Azure app + MCP hosting/auth: [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md)

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md) to set up the repository and submit changes. By
participating in this project, you agree to follow the
[Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct).

Use [GitHub Issues](https://github.com/microsoft/coreai-design-system/issues) for bugs, feature
requests, and usage questions. See [SUPPORT.md](SUPPORT.md) for the support policy and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## Documentation organization

To keep a single source of truth and avoid drift/duplication, every doc in this repo belongs to
exactly one of these categories. Before adding new documentation, place it per this table and
**cross-link** to the owning doc instead of restating its content:

| Category             | Covers                                                                                                                                                                              | Home                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Operational docs** | Build, release process, CI/CD auth, contribution process/governance, deploy                                                                                                         | Each package/app's own `README.md`, plus additional scoped docs alongside it when a topic needs more depth (e.g. `RELEASING.md`, `CONTRIBUTING.md`) — always specific to the package/app they describe, never a generic repo-wide doc for one workspace's process. Concerns that genuinely span multiple workspaces (e.g. shared CI/CD auth, app hosting) live in the repo-root [`docs/`](docs) folder instead. |
| **Usage docs**       | Component/theme usage, API behavior, MCP consumption, template-authoring conventions                                                                                                | Storybook docs ([`apps/storybook/src/stories/docs/*.mdx`](apps/storybook/src/stories/docs) "Docs" pages + JSDoc-driven autodocs) — single source, live at the hosted Storybook, and addressable by the MCP tools                                                                                                                                                                                                |
| **Changelog**        | Version history                                                                                                                                                                     | Each publishable package's own `CHANGELOG.md`                                                                                                                                                                                                                                                                                                                                                                   |
| **Workflow skills**  | Procedural steps for an agent to execute a task **in this monorepo** (PR/commit conventions, release steps)                                                                         | [`.github/skills/*/SKILL.md`](.github/skills) — numbered steps, checklists only; no conceptual/reference content — link out to whichever doc above owns it                                                                                                                                                                                                                                                      |
| **Agent skill**      | Distributable, concise operating rules for an agent _consuming_ `@coreai-ds/react-components` (MCP server precedence, component-ID quirks, template-vs-component, offline fallback) | [`packages/react-components/agent/SKILL.md`](packages/react-components/agent/SKILL.md) — ships inside the published npm package (works for consumers outside this monorepo, with no MCP access needed) and is mirrored into a generated Storybook doc page so it's also addressable by the MCP tools; see [apps/storybook/README.md](apps/storybook/README.md#agent-skill-mirror)                               |

This is distinct from the **Workflow skills** row above: those describe how an agent should
_contribute to this repo_; the **Agent skill** describes how an agent should _use the package_,
and travels with it wherever it's installed.

## Quickstart

```bash
npm install               # bootstrap all workspaces (one root install)
npm run docsite           # http://localhost:8080
npm run storybook         # http://localhost:6006
```

Aptos is the preferred typeface but is **not redistributed** in this repository or
the npm package. Inter is the proportional fallback, followed by system fonts. To
use Aptos, follow the opt-in
[font setup guide](packages/react-components/src/fonts/README.md) and review
Microsoft's license for your intended use. **Only Microsoft-hosted projects may
host Aptos font files. Non-Microsoft projects must not host Aptos and should load
Inter instead.**

## Common scripts

Run these from the repo root.

| Script                    | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `npm run docsite`         | Build and serve the static docsite (`apps/docsite`) locally.   |
| `npm run build:docsite`   | Build the static docsite into `apps/docsite/dist`.             |
| `npm run storybook`       | Start the Storybook dev server (`apps/storybook`).             |
| `npm run build:storybook` | Build the static Storybook site.                               |
| `npm run build`           | Build the theme package's TypeScript declarations + JS bundle. |
| `npm run type-check`      | Run `tsc --noEmit` across every workspace.                     |
| `npm run clean`           | Remove each workspace's build output.                          |

To run a script in just one workspace, use `npm -w <workspace> run <script>` — for example `npm -w packages/react-components run build`. The Storybook app also exposes `stories:init` and `stories:update` for managing the sparse-checked [apps/storybook/fluent-stories/](apps/storybook/fluent-stories/) sibling repo (see [apps/storybook/README.md](apps/storybook/README.md)). The docsite and Storybook (with its self-hosted MCP endpoint) deploy through [GitHub Actions](.github/workflows) to their existing Azure App Services. Deployment is gated and does not change the services' authentication settings. See the [CI/CD guide](docs/CI-CD-SETUP.md) for setup.

## Consuming the react package

Install from npm. See the
[package README](packages/react-components/README.md#install) for installation,
optional Aptos setup, and provider configuration.

> Inside this monorepo you don't need any of the above — `@coreai-ds/react-components` resolves via the workspace symlink, so a plain `npm install` at the root works.

## Publishing

Maintainers publish through a separate manual workflow. See the
[release guide](packages/react-components/RELEASING.md) for the publishing controls
and the [CI/CD guide](docs/CI-CD-SETUP.md) for repository configuration.

## Legal

### License and hosted-service terms

Documentation is licensed under the
[Creative Commons Attribution 4.0 International license](LICENSE). Source code is licensed under
the [MIT license](LICENSE-CODE).

Use of the hosted MCP endpoint is subject to the
[Microsoft APIs Terms of Use](https://learn.microsoft.com/en-us/legal/microsoft-apis/terms-of-use).

For Microsoft's privacy practices, see the
[Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement).

The application code does not collect or transmit product-usage telemetry. Optional services that
users configure, such as Azure OpenAI, may process data that users choose to send and are subject to
the terms and privacy policies of those services.

### Third-party materials

This project builds on Fluent UI and other open-source packages declared in its package manifests
and lockfile. The docsite uses Paper Shaders under the Apache License 2.0; its license and upstream
notice are included in [apps/docsite/public/third-party](apps/docsite/public/third-party) and
summarized in [NOTICE](NOTICE). Storybook development can provision a pinned, sparse checkout of
upstream Fluent UI stories; that checkout is not tracked in this repository. See the
[Storybook authoring guide](apps/storybook/README.md) for details.

### Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use
of Microsoft trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or logos is subject to those
third-party policies.
