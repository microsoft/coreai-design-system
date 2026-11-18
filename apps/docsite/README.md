# @coreai-ds/docsite

Static CoreAI documentation for people and agents. GitHub Pages serves the same
Markdown-owned guidance as physical HTML pages, Markdown downloads, and live React
examples. Public delivery does not require Storybook, MCP, or a Node server.
Storybook remains available for local component development.

Public site: <https://microsoft.github.io/coreai-design-system/>.

## Local commands

Run from the repository root after installing the locked dependencies:

```powershell
npm run build:docsite
npm --workspace apps/docsite run preview
```

Preview opens on `http://127.0.0.1:8081/`. To reproduce the Pages repository prefix:

```powershell
npm --workspace apps/docsite run build -- --base=/coreai-design-system/
npm --workspace apps/docsite run preview
```

Preview reads the base path from the generated index. `npm run docsite` builds and
starts that preview. Rebuild after content or example changes; this pipeline does
not yet provide a development watcher.

The normal build provisions the pinned Fluent story checkout if needed, builds
the CoreAI package, and generates `dist/`. It does not build hosted Storybook or
fetch a deployed Storybook index. The first source checkout needs network access;
subsequent builds use the pinned local checkout.

## Ownership and naming

- Canonical guidance and page metadata: [`content/`](content).
- Shared tables and starter prompt: [`content/data/`](content/data).
- Dated documentation notes: [`CHANGELOG.md`](CHANGELOG.md), included by the
  `content/overview/Changelog.md` page wrapper.
- Package setup, changelog, and consumer skill: the package's canonical files,
  included at build time rather than copied by authors.
- Build and source tooling: [`scripts/`](scripts).
- React presentation: [`src/reference-proof/`](src/reference-proof).
- Shared theme and UI components: [`src/theme/`](src/theme) and
  [`src/components/`](src/components).

Custom docsite source, script, style, test, and Markdown filenames use PascalCase.
Required tooling names, public protocol endpoints, generated example IDs, and
vendor/static assets retain their established names. Components use their public
export spelling, including acronyms: `DataGrid`, `CoreAIFluentProvider`, and
`DateTimePicker`.

A component file such as `content/components/DataGrid.md` publishes:

- `components/DataGrid/index.html`
- `components/DataGrid.md`

Guides follow the same casing convention, for example `guides/Package/` and
`guides/Package.md`. Links are case-sensitive on Pages. The homepage retains the
standard `index.html` / `index.md` output names.

Frontmatter `id` is an internal content identifier, not a public URL. The file
location determines the route unless `reference.route` explicitly sets one.
Pages with no body reuse the animated under-construction view. Set
`reference.layout: work-in-progress` to show that view while keeping draft
guidance in the source until it is ready to publish.

The Changelog page includes site updates and package releases from their
separate canonical sources. There is no separate documentation changelog page.

## Authoring pages

All pages declare `id`, `title`, `summary`, `resources`, and `reference`:

```yaml
---
id: data-grid
title: DataGrid
summary: Present and interact with structured data.
resources: []
reference:
  component: components-datagrid
---
```

The source component ID remains the Storybook inventory ID. It is independent of
the case-sensitive public route. Omitting `examples` includes all selected
examples. Explicit selections and exclusions are validated rather than guessed.
Every executable component/template group has one selected Default example.

Templates declare complete copy-and-adapt `sources` under
`apps/storybook/src/stories/templates/`; they are not npm exports. Standalone pages
can opt into the bounded renderer registry for custom foundation and overview
layouts.

Supported directives include:

```markdown
<!-- generated: colors -->
<!-- include: package-readme -->
<!-- example: components-text--presets -->
```

Only standalone comment nodes are expanded. Fenced examples are not executed.
Includes have a fixed repository-source allowlist; malformed or unknown directives
fail the build. Guidance links are rewritten for HTML, Markdown, and the selected
deployment base.

Use `npm --workspace apps/docsite run catalog:init` only to seed newly supported
groups, then review the resulting Markdown. Ordinary builds do not author content.

## Generated output

The static output includes:

| Output                                           | Purpose                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Physical directory HTML and paired `.md` files   | Human and agent documentation                                     |
| `llms.txt`                                       | Targeted discovery, build timestamp and package versions          |
| `version.json`                                   | Build timestamp, package version and skill provenance             |
| `llms/index.json`                                | Exact routes, APIs, source hashes, coverage, and build provenance |
| `source/examples/*.tsx`                          | Complete generated example modules                                |
| `source/templates/`                              | Complete copy-and-adapt template files                            |
| `source/setup/App.tsx`                           | Provider setup                                                    |
| `source/package/SKILL.md` and `agent-prompt.txt` | Build-stamped repository skill and install/update starter prompt  |
| `THIRD-PARTY-NOTICES.txt` and `third-party/`     | Dependency attribution and license material                       |
| `.nojekyll`                                      | Direct static publishing                                          |

The same generated TSX is compiled for previews, shown as source, and published in
Markdown/downloads. Component and template Markdown puts authored guidance before
the Default example and API summaries so agents read usage rules before code.
Literal story-default props are materialized in the downloadable example wrapper;
dynamic arguments and other unsupported Storybook runtime setup are rejected.
Source extraction rejects unsupported Storybook runtime setup
instead of shipping a partial compatibility runtime. Fixed DOM IDs are scoped;
already-unique hook-generated IDs retain their reference relationships.

APIs are summaries extracted through the public CoreAI barrel and the installed
Fluent declarations. They do not replace the package's exported types. Templates
remain copy-and-adapt source. The build records the actual bundled peer versions
and rejects Storybook runtime modules or duplicate React/Fluent installations.

The Illicon page includes canonical component and contribution guidance, usage
examples, and the reviewed artwork catalog. The package build validates and
generates the registry first. Original SVG downloads under `assets/illicons/`
retain the source bytes. Local gallery and verification stories marked
`!manifest` are explicitly excluded from component examples.

## Documentation build metadata and changelog

Documentation has no semantic release version. Each build creates one UTC
`lastUpdated` timestamp shared by `version.json`, `llms/index.json`, `llms.txt`,
the site footer, and the published consumer skill. A rebuild gets a new
timestamp, even when source content is unchanged. The component npm package
keeps its independent version; documentation changes do not bump it.

Follow [update-docs-changelog](../../.github/skills/update-docs-changelog/SKILL.md)
before opening or updating a PR to main. Add meaningful notes under a
`## Description - YYYY-MM-DD` heading in the
[documentation changelog](CHANGELOG.md), including
maintenance changes. No PR number or version is needed. Keep historical notes
and reuse the PR's section when updating it. Package release notes remain separate.

The canonical consumer skill has no documentation version or authored build
timestamp. The build stamps its published description and metadata with
`last-updated`, `package-version`, and a dated changelog link. It hashes the
actual published bytes into `skill.sha256`; authored source is not rewritten.
`version.json` also records `packageVersion`, `skill.path`, `skill.lastUpdated`,
the changelog link, and source revision.

Agents check the small manifest once per task, compare timestamps as instants,
then read the dated changelog when it changed. They review and refresh older or
unstamped skill guidance, verify the downloaded bytes, and preserve local rules.
Only current documentation is hosted. Failed retrieval or conflicting edits
require an explicit report rather than a silent skip.

## Runtime and validation

Physical HTML contains readable guidance and source without JavaScript. React
enhances it with a shared provider, native-link sidebar/search, page tabs, and
examples. Ordinary links navigate without resetting the shell; modified clicks
retain native browser behavior. Storage or fragment failures do not blank the
page, and unexpected enhancement errors restore static content explicitly.
Search uses the navigation tree to index titles, descriptions, and Markdown
guidance only for pages in the sidebar. Redirects are not separate results. Title matches
appear before description and body matches. Press Down
from the search field to focus results, use arrow keys to move between them,
and press Escape to clear search and return to the field.
After building and starting a preview, run
`node apps/docsite/scripts/verify-search.mjs http://127.0.0.1:8081/`
from the repository root to check search against the navigation tree, deleted
routes, React Router redirects, every published page, both themes, client
navigation, history, keyboard controls, and mobile navigation. Pass the deployment
prefix in the URL when previewing a prefixed build.

```powershell
npm --workspace apps/docsite test
npm --workspace apps/docsite run type-check
npm --workspace apps/docsite run verify
```

Build before `verify`. Node tests cover content contracts and focused regressions,
not fixed catalog totals or exact source formatting. Verification checks paired
static output, source hashes, license assets, downloaded example/template
compilation against a locally packed package, and representative browser behavior.
It does not prove registry availability, all-browser accessibility, or real agent
task quality.

Known heading-anchor and broader architecture options are tracked in
[the review record](https://github.com/microsoft/coreai-design-system/issues/50).

## Hosting

[The documentation workflow](../../.github/workflows/docs.yml) validates pull
requests and deploys verified `main` output to GitHub Pages. Pull requests never
deploy. Manual deployment also requires `main`. No separate documentation server
or public Storybook/MCP host is used.

See [hosting setup](../../docs/CI-CD-SETUP.md) and
[workflow operations](../../docs/GITHUB-ACTIONS.md).
