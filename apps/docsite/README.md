# @coreai-ds/docsite

Static CoreAI documentation for people and agents. GitHub Pages serves the same
Markdown-owned guidance as physical HTML pages, Markdown downloads, and live React
examples. Public delivery does not require Storybook, MCP, Azure, or a Node server.
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
Documentation has no `complete` or `under-construction` status metadata.

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
| `llms.txt`                                       | Targeted discovery, docs/skill and package versions               |
| `version.json`                                   | Small current-release manifest for skill update checks            |
| `llms/index.json`                                | Exact routes, APIs, source hashes, coverage, and build provenance |
| `source/examples/*.tsx`                          | Complete generated example modules                                |
| `source/templates/`                              | Complete copy-and-adapt template files                            |
| `source/setup/App.tsx`                           | Provider setup                                                    |
| `source/package/SKILL.md` and `agent-prompt.txt` | Versioned repository skill and install/update starter prompt      |
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

## Documentation and skill versions

The docsite manifest owns one semantic version shared by the documentation and
consumer skill. The component package has its own independent version. A
documentation-only change advances docs/skill without republishing the package.
A package release advances both tracks. Only the current release is hosted.

The skill description includes both versions so clients can see them before
loading the body. `metadata.version` is the docs/skill version;
`metadata.package-version` identifies the package documented by that skill.
These labels describe the site, not a consuming app's installed package.

For a docs/skill change, run from the repository root:

```powershell
npm version patch --workspace apps/docsite --no-git-tag-version
```

Use the approved semantic increment or explicit version. npm updates the
workspace manifest and root lockfile, then the `version` lifecycle synchronizes
the skill's description/metadata. If lifecycle scripts were disabled, run:

```powershell
npm --workspace apps/docsite run sync:versions
```

For a package release, change the package version first, then advance docs/skill.
Synchronization refuses a package-version change without a newer docs/skill
version. Commit the two manifests, root lockfile, and skill together.
See the [package release procedure](../../packages/react-components/RELEASING.md).

Build and type-check reject version-label drift; they do not silently rewrite
authored files. `version.json` contains the docs version, documented package
version, skill version/path/SHA-256, and source revision. The same release
metadata appears in `llms/index.json`, `llms.txt`, and human page footers.
Agents check the small manifest once per task, then review and update only older
CoreAI skill guidance while preserving local instructions. Failed retrieval or
conflicting edits require an explicit report rather than a silent skip.

## Runtime and validation

Physical HTML contains readable guidance and source without JavaScript. React
enhances it with a shared provider, native-link sidebar/search, page tabs, and
examples. Ordinary links navigate without resetting the shell; modified clicks
retain native browser behavior. Storage or fragment failures do not blank the
page, and unexpected enhancement errors restore static content explicitly.

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
deploy. Manual deployment also requires `main`. No Azure
credentials or public Storybook/MCP host are used.

See [hosting setup](../../docs/CI-CD-SETUP.md) and
[workflow operations](../../docs/GITHUB-ACTIONS.md). Existing Azure hosts may
redirect to the Pages root after cutover; precise old-page redirects are not a
documentation contract.
