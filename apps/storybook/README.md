# @coreai-ds/storybook

Storybook playground that previews [`@coreai-ds/react-components`](../../packages/react-components) against the canonical Fluent UI v9 stories.

Storybook is local-only. Public human and agent documentation is published by the
[static docsite](../docsite/README.md) on GitHub Pages; no public Storybook or MCP
host is deployed.

Theming, Variations from Fluent, CSS Modules, and agent workflow prose is
now authored in [`apps/docsite/content/`](../docsite/content/).
`docs:standalone` generates ignored MDX snapshots under
`.storybook/.cache/standalone-docs/` during preparation and on source saves.
These embed the canonical text so manifest-only MCP readers do not need source
files on the host. Their historical document IDs are preserved. Edit Markdown,
not the generated MDX. The static Markdown exporter reads the same snapshots.

## Quickstart

From the repo root:

```bash
npm install               # bootstrap all workspaces (one root install)
npm run storybook         # http://localhost:6006
```

Or from this workspace directly:

```bash
npm -w apps/storybook run dev
```

Toolbar dropdowns toggle theme (CoreAI / Web / Teams / Teams v2.1) and Light / Dark mode.

## Illicon catalog

**Components / Illicon** groups component usage examples and a searchable
artwork gallery with Copy SVG actions. The gallery preserves original SVGs for
Figma and further editing; saved-data catalog integration remains separate.
The gallery is excluded from the component MCP manifest.
See the [asset contribution guide](../../packages/react-components/illicons/README.md)
for SVG conventions and the title, file, tags, and author fields.

## Scripts

| Script                   | What it does                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run dev`            | Prepare content, then start the Storybook dev server on port `6006`.                        |
| `npm run build`          | Prepare content, then build the static Storybook site to `storybook-static/`.               |
| `npm run type-check`     | `tsc --noEmit` over the app sources.                                                        |
| `npm run verify:build`   | Assert that a static build contains Fluent stories and generated documentation.             |
| `npm run stories:init`   | (Re)provision `fluent-stories/` from scratch at the pinned upstream commit.                 |
| `npm run stories:update` | Re-sync `fluent-stories/` to the pinned commit (same as `stories:init`).                    |
| `npm run stories:ensure` | Provision `fluent-stories/` only if it is missing. Runs automatically before `dev`/`build`. |

The dev/build scripts are exposed at the repo root as `npm run storybook` and `npm run build:storybook`. The `stories:*` scripts are local to this workspace — run them from `apps/storybook/` (or via `npm -w apps/storybook run stories:init`).

You normally never need to run these by hand: `dev` and `build` explicitly invoke `storybook:prepare`, which runs `stories:ensure` and generates the template and Agent Skill documentation. Preparation is part of the requested scripts rather than an npm `pre*` lifecycle hook, so it still runs when the repository uses `ignore-scripts=true` to suppress dependency lifecycle scripts.

## `fluent-stories/` — sparse-checkout sibling repo

`apps/storybook/fluent-stories/` is a separately-provisioned, sparse, shallow checkout of [`microsoft/fluentui`](https://github.com/microsoft/fluentui) that contains only the canonical story sources. It is gitignored from this repo, and the Storybook app's webpack config rewrites Fluent imports inside those stories to route through the CoreAI barrel — so the canonical Fluent stories render with CoreAI defaults applied, without us editing any of Fluent's code.

It is provisioned by the docsite-owned [`setup-fluent-stories.mjs`](../docsite/scripts/sources/SetupFluentStories.mjs), a cross-platform
script driven by `{ repo, version, ref, sparsePaths }`. The checkout is pinned to
`ee856ea115d3a1c7b7a81cfd5b42613ff4bf9a06`, the peeled
`@fluentui/react-components_v9.74.9` release tag. Its upstream package version matches the installed
`@fluentui/react-components` **9.74.9** exactly. Preparation checks both the installed package and
the package metadata at the pinned source commit; a mismatch fails with update instructions.

When upgrading the npm package, resolve its exact upstream release tag, verify the package
version at that commit, update both `version` and `ref` in the setup script, and run
`npm --workspace apps/storybook run stories:update`. Version resolution is deliberate, not an
automatic selection of the newest or nearest commit.

The selected catalog includes local CoreAI examples and upstream variants, with local
definitions winning matching IDs. CounterBadge uses the
canonical `Components/Badge/Counter Badge` title so its local Default replaces the upstream
Default in one catalog instead of publishing a second component.

Setup is automatic because `dev` and `build` run `storybook:prepare` before Storybook starts.
Documentation CI checks extracted consumer examples without deploying Storybook.
To force a fresh local re-provision, run `npm run stories:init`.

### Replacing a canonical story with a CoreAI fork

Most canonical stories already render with CoreAI defaults via the import rewrite, so you rarely need to fork. When you _do_ want to override a specific story's content (e.g. to add CoreAI-specific copy), add a fork under `src/stories/` that reuses the canonical story's `title` + export name. The canonical re-export would otherwise collide with the fork on story id ("Duplicate stories with id").

Preparation generates one component index from the shared inventory. Local definitions win matching
story IDs; other Fluent variants and local-only variants remain. Storybook indexes these generated
owners rather than indexing the input files separately. The old collision indexer is removed.
The same inventory drives the source-backed MCP provider, so UI and MCP use the same ownership.

## Figma integrations

Component stories link to their CoreAI Figma frames through `@storybook/addon-designs`.
The meta spreads `figmaDesign("<name>")` from
[`src/utils/figma.ts`](src/utils/figma.ts) into `parameters`, adding a **Design**
tab with the corresponding frame. Add new mappings to the `figmaNodes` registry
and apply the helper to the component's story meta.

The introduction also links to the Figma library through
[`shared/site-links.ts`](../../shared/site-links.ts). Links and embeds retain the
design file's existing permissions; users may need to sign in or request access.

## Local MCP authoring tools

The local [`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp)
is registered in [`.storybook/main.ts`](.storybook/main.ts). While Storybook is
running, an HTTP MCP client can connect to `http://localhost:6006/mcp` without
credentials. This is optional local authoring support, not the public consumer
documentation contract.

The local tools include `docs-list`, `docs-show`, and `docs-show-story`. They return
selected documentation and source examples; they do not read project files,
execute returned examples, or host an AI model. Review the client destination and
permissions, do not send secrets or confidential project details, and validate
returned code before use.

Consumers use ordinary HTTPS Markdown retrieval through the
[package skill](../../packages/react-components/agent/SKILL.md).
The local Storybook mirror remains generated from that canonical source.

### How accurate props are produced (React Component Meta)

Prop APIs come from Storybook's **React Component Meta (RCM)**, enabled in
[`.storybook/main.ts`](.storybook/main.ts) (`features.componentsManifest` plus
`features.experimentalDocgenServer`, with `typescript.reactDocgen: false`). RCM resolves component
types through TypeScript. Generated owners belong to a dedicated configured TypeScript project.
The build verifier rejects unexpected extraction errors; the two known exceptions are
`components-portal-tomountnodeprops` and `templates-shell-and-navigation` (`No component found`).

### How the manifest works

The manifest is a machine-readable index, not a rendered page. Storybook reads CSF story files,
component types, and MDX docs. The MCP tools use that data:

- `docs-list` reads the index. With `withStoryIds: true`, it also loads story snapshots.
- `docs-show` loads a component's prop API and initial examples.
- `docs-show-story` loads the selected story's static snippet.

With `experimentalDocgenServer`, the built `manifests/components.json` contains `$ref` links
instead of embedding every API and snippet. Those links point to JSON snapshots under
`services/core/docgen/` and `services/core/story-docs/`. Deploy the **whole** Storybook build,
not just the manifest index files. The existing hosted `manifestProvider` reads these snapshots
from the same build directory.

In development, the MCP tools read the running docgen service. The raw
`/manifests/components.json` and `/manifests/docs.json` routes return 404 in this mode.
Use [`/manifests/components.html`](http://localhost:6006/manifests/components.html) to inspect
the data and extraction problems. In a production build, the JSON files are available on disk.

Before generated-owner integration, component-only validation found the same coverage before and after enabling the server:
16 locally owned component entries with 52 snippets, and 60 vendored Fluent component entries
with 608 stories but no extracted snippets. The UI index contains 142 local component stories;
90 were absent from locally owned manifest entries. These are historical baseline counts.
The enabled generated pipeline now publishes all 689 selected component stories through 75 owners.
Template-specific validation remains deferred.

Upstream references: [Manifests](https://storybook.js.org/docs/ai/manifests),
[docgen server configuration](https://storybook.js.org/docs/api/main-config/main-config-features#experimentaldocgenserver),
and [MCP docs tools](https://storybook.js.org/docs/ai/mcp/overview#docs).

### Static Markdown export

`npm run build:storybook` also runs `docs:markdown` after Storybook finishes.
To regenerate from an existing build, run:

```bash
npm --workspace apps/storybook run docs:markdown
```

The [exporter](scripts/generate-markdown.mjs) resolves the built component/docs
manifests and their `$ref` snapshots from disk. It does not scrape the preview DOM,
launch Chromium, contact a hosted MCP, or truncate examples to the first three.
It writes `storybook-static/llms/{id}.md` and `storybook-static/llms/index.json`.
Output is deterministic; unchanged files keep their modification times and stale
generated documents are removed.

Component references contain descriptions and JSDoc, prop tables (including
required/default values and `children`), subcomponent APIs, attached docs, and
every selected story's description and complete source. Source-backed examples
keep the CoreAI imports, local/upstream provenance, and dependency notes supplied
by the existing story-docs provider. Where Storybook omits property JSDoc, the
exporter reads the declared local TypeScript source and matches the exact
owner/property to recover descriptions and tags, including deprecation warnings.
An unmatched declaration keeps the available metadata and states the limitation.

Standalone MDX docs, including generated templates and the agent skill, are
parsed without executing JavaScript. Imports, metadata, and comments are removed;
prose, tables, and fenced/static source are preserved. Interactive Canvas and
custom components that cannot be expanded statically receive explicit notices
instead of disappearing or being presented as fully rendered documentation.

This follows Fluent's build-time static-export model, but uses our pinned
Storybook manifest APIs rather than Fluent's browser story-store internals.
The existing two allowed `No component found` extraction errors remain visible
as limitations, not invented API tables. Unexpected extraction errors, broken
references, empty docs, and missing example source fail generation.

The normal build verifier checks that every manifest document and complete
example was exported. Focused fixtures run with:

```bash
node --test apps/storybook/scripts/generate-markdown.test.mjs
```

The [docsite](../docsite/README.md#static-storybook-markdown) publishes these
references and joins matching API/example sections to its canonical guidance
downloads. Storybook remains a build-time source; public Storybook and MCP
hosting are unchanged by this prototype.

### Validating story extraction

Generated component metadata now uses public import names such as `Accordion`, not internal
`__CoreAI_` aliases. When a story export has the same name as a component import, only the
story's private binding is renamed; its public export and ID stay unchanged.

Component fields are resolved independently: the latest local definition wins, while omitted
subcomponents fall back to another local source or upstream Fluent. Explicit empty subcomponents
are preserved. Descriptions and summaries each use the latest nonempty local text, then upstream
text, so a minimal `*Dev.stories.tsx` file cannot erase authored documentation. The selected text
is copied into the generated CSF default export. The source provider preserves local story JSDoc and upstream story
description parameters, including literal strings, concatenated strings, and imported Markdown
joined by the index. JSDoc takes precedence over parameter descriptions. These are checked
through the built `docs-list`, `docs-show`, and `docs-show-story` responses.

Story names use Storybook's display-name rules, preserve explicit labels, and are written into
both generated CSF and the MCP inventory. Story IDs remain based on canonical exports. For example,
Button's `WithLongText` export is listed and accepted as `With Long Text` by `docs-show-story`.
A generated-entry-only indexer applies these names to the UI index, including privately aliased
exports whose explicit names Storybook's parser otherwise ignores. Other entries are unchanged.
Imported Fluent Markdown uses the same internal work-item link cleanup in Vite, generated
descriptions, and consumer snippets; local Markdown is unchanged.

Use the current docs tools to check extraction rather than imposing authoring restrictions from
older MCP versions. CounterBadge currently returns its configured `count={5}` and CoreAI import.
Generated component owners use the source-backed provider so examples retain their implementations
and module-level dependencies. Production regressions compare selected source stories with the UI
index and MCP output.

To check a running MCP server in PowerShell:

```powershell
$env:MCP_TEST_URL = 'http://localhost:6006/mcp'
try {
  node --test apps\storybook\scripts\ingestion-mcp.test.mjs
} finally {
  Remove-Item Env:MCP_TEST_URL
}
```

### Fluent ingestion pipeline

The source-backed provider is implemented in `scripts/component-story-docs.mjs`, with AST
dependency extraction in [`story-source.mjs`](../docsite/scripts/sources/StorySource.mjs). It publishes selected implementations,
required declarations and imports, relative helper source, provenance, and required package
names. It is now enabled in the main configuration for generated component owners. Non-generated
entries delegate to Storybook's provider. Templates and MDX discovery are unchanged.

`npm --workspace apps/storybook run test:source` checks source extraction and provider ownership.
`npm --workspace apps/storybook run stories:verify-source` checks all consumer examples against
the CoreAI types and writes `.storybook/.cache/story-source-validation.json`.
Explicitly type CSF object stories' `render` parameters: extracted examples are standalone
functions and do not retain contextual typing from `StoryObj`.
All 689 selected examples now type-check with zero diagnostics.

For upstream examples only, the source extractor adapts `Partial<ComboboxProps>` and
`Partial<DropdownProps>` imported from the Fluent barrel to
`Partial<Omit<...Props, 'label' | 'dynamicWidth'>>`. Import aliases are supported. This removes
inline-label settings from those optional example prop bags without weakening CoreAI's linked
label/sizing rules. It resolved 36 diagnostics across 24 variants. Local examples, other prop
types, upstream files, and component APIs remain unchanged. Tests verify that emitted JavaScript
is identical before and after this type-only adaptation. Generated indexes and the source provider
are enabled locally. Nothing has been pushed or deployed.

`npm --workspace apps/storybook run stories:generate` produces one CSF index per component
under `.storybook/.cache/component-stories/`, plus its shared inventory. Generated indexes
import the selected original stories and preserve each source's args, decorators, loaders,
globals, tags, and nested parameters through `scripts/story-metadata.mjs`. Component imports
are explicitly routed through the CoreAI barrel and aliased to avoid conflicts with story names.
`npm --workspace apps/storybook run test:generated` validates canonical IDs, metadata behavior,
deterministic regeneration, and stale-index removal. Normal development and build preparation
now run generation, and Storybook discovers the generated component indexes.

The shared story inventory is implemented in the docsite-owned
[`story-inventory.mjs`](../docsite/scripts/sources/StoryInventory.mjs).
Storybook uses these same source tools rather than maintaining a second importer.
Run `npm --workspace apps/storybook run stories:inventory` to write
`.storybook/.cache/story-inventory.json` (gitignored). The module also exports
`createStoryInventory()` for the future generated indexes and provider to share.

The inventory reads the included Fluent CSF indexes and local component CSF files, using
Storybook's parser for canonical story IDs and export filtering. It records component metadata
expressions and their source files, story export names, direct implementation paths, imports,
local declarations/JSDoc, and assignment-style annotations such as args and parameters.
Metadata is recorded per source, not merged or evaluated in this step. Dependency imports
are recorded, not bundled or checked for snippet completeness.

Local definitions win matching story IDs; the replaced upstream definition is retained in
`overridden`. Conflicting same-origin story IDs, component ID/title collisions, missing source
modules, and missing explicit titles fail with errors. The current inventory selects 75
components and 689 stories: 144 local, 545 Fluent, and 70 overridden upstream stories.
Templates are excluded.

The existing package exclusion list is shared with Storybook through
[`scripts/fluent-story-scope.mjs`](scripts/fluent-story-scope.mjs).
The generator and provider now consume this inventory for production component IDs.
Run the focused inventory tests with
`npm --workspace apps/storybook run test:inventory`; they also run in `verify:build`.

The tested direction is **generated CSF indexes plus a source-backed story-docs provider**,
not moving upstream code into render functions or hand-authoring manifests.

1. Resolve and pin the Fluent commit matching the exact installed component package version.
   Record both versions and fail on a mismatch rather than selecting a nearby release.
2. Inventory expected component titles and story IDs from upstream and local sources before
   generation. Preserve existing exclusions until their scope is explicitly reviewed; the
   current included catalog is not the whole upstream Storybook.
3. Generate one gitignored CSF index per component title inside the app's TypeScript project.
   Re-export upstream variants and local overrides from their original files. Index the
   generated owners instead of also indexing their input files. Local definitions win matching
   story IDs; local-only variants remain. Diagnose conflicting local definitions.
4. Supply explicit CoreAI `component` and `subcomponents` metadata in those indexes. Preserve
   local metadata, args, decorators, design links, and story behavior. Test metadata precedence
   in the pilot rather than assuming object spreads preserve all intended settings.
5. Generalize the provider to use the same ownership map. Publish full example source with its
   dependencies and correct CoreAI/icon imports, without restructuring module-level Griffel
   hooks or example data. Use an AST to select code and rewrite imports, not regex source merging.
   Keep Storybook-only configuration out of consumer examples and carry descriptions separately.
6. Handle relative dependencies explicitly. Of the 608 current upstream leaf files, 388 have
   module-level declarations and 18 import relative files: 17 import Markdown and one imports
   Tree helper modules. Extract Markdown into descriptions; include or package the helper source.
   Preserve non-barrel package imports and identify required consumer dependencies. Unsupported
   sources must produce actionable errors, not partial examples presented as complete.
7. Expand the working Accordion/Button/DataGrid provider pilot into a generated ownership pilot.
   Verify local override precedence, additional variants, metadata, rendered behavior, and
   identical live/built docs-tool content before generating the full catalog.
8. Gate completion on the expected source inventory: every intended story ID is discoverable,
   its snippet is present and usable, component APIs resolve, and source-only relative imports
   do not leak into examples. Test upstream version updates and removals. Templates remain out of scope.

If original upstream stories replaced by local overrides must also be published, give those
originals a separate namespace; they cannot share the local story's ID. This policy remains
an implementation decision, not something the pilot has resolved.

> **Adding, removing, or renaming a story or changing component metadata requires restarting
> through `npm run storybook`**, which regenerates the inventory and owners. Running
> `storybook dev` directly does not run preparation. A cold live `docs-list` request initializes
> documentation services; focused live tests allow up to three minutes. Use
> `withStoryIds: false` when the full story index is unnecessary.

Generated owners have a dedicated `tsconfig.json` beside them, extending the app configuration
and explicitly including `*.stories.js`. TypeScript's default glob traversal excludes hidden
directories, so the app's `.storybook/**/*` glob does not include `.storybook/.cache` owners.
Without this configuration, Storybook uses an inferred project, adds owners one at a time,
and repeatedly updates its TypeScript program. This caused the docgen-worker queue timeout.
The dedicated configuration includes all owners up front and preserves CoreAI source mappings.
No timeout change or custom docgen worker is needed; normal production builds pass.
A full isolated worker probe fell from about 117 seconds to 11.5 seconds for the same
86 component/template groups. These measurements depend on the machine and are not a timing SLA.

Local integration validation covers the real Accordion, Button, DataGrid, Combobox, and Dropdown
IDs through built and live MCP. Browser checks verify local and upstream examples, Accordion
state changes, five Button appearances, DataGrid rows, preserved Figma metadata, and CounterBadge
args. The generated `toMountNodeProps` entry remains a utility story without component metadata,
so it has source examples but no component prop API. Remote deployment remains out of scope.

Build verification rejects unexpected component extraction errors and all production story
errors or warnings. Only the existing `No component found` errors for
`components-portal-tomountnodeprops` and `templates-shell-and-navigation` are allowed; a different
error for either entry still fails.

### Agent Skill mirror

[`packages/react-components/agent/SKILL.md`](../../packages/react-components/agent/SKILL.md)
is the single authored source for agent-behavioral guidance (MCP workflow, component-ID
quirks, template-vs-component, offline fallback) — it ships inside the npm package for consumers
outside this monorepo. [`scripts/generate-skill-doc.mjs`](scripts/generate-skill-doc.mjs) mirrors
it, byte-for-byte, into a generated `src/stories/docs/AgentSkill.mdx` (gitignored — same pattern
as the [template docs](#creating-a-template)) so it's also addressable through the MCP tools.
Never hand-edit `AgentSkill.mdx`; edit `agent/SKILL.md` and it regenerates on the next
`predev`/`prebuild`/save (`npm run docs:skill` to force it).

### Shared Component Guidance

Design and content guidance is authored in
[`apps/docsite/content/components`](../docsite/content/components) and published
only on the docsite, not as separate Storybook or MCP entries. See the
[docsite authoring contract](../docsite/README.md#updating-component-guidance).
Component props, examples, template docs, and the Agent Skill remain in Storybook/MCP.

Separate guidance entries previously cluttered MCP discovery. Revisit how
guidance is grouped with component docs before adding MCP publication.

### Curating descriptions & summaries (JSDoc → tool output)

Existing stories use JSDoc descriptions and `@summary`, and standalone MDX pages use a
`summary` on their `<Meta>` tag. Verify the resulting text through `docs-list`, `docs-show`,
and `docs-show-story`. The precedence and support for `parameters.docs.description` and
code-source parameters must be revalidated against the current docgen server.

### Component story layout

Story files under `src/stories/` are grouped into three folders:

- `components/` — local CoreAI component stories and overrides, including development variants.
- `templates/` — copy-paste template patterns (EmptyState, FilterableList, ShellAndNavigation).
  See [Creating a template](#creating-a-template) below for the full convention.
- `docs/` — standalone MDX docs (Introduction, Theming, Variations from Fluent, Styling with CSS
  Modules, MCP Setup).

### MCP curation

Storybook supports `manifest` and `!manifest` tags to control manifest inclusion.
A `Dev` filename or export suffix does not itself hide a story from MCP. Check the manifest
debugger and docs tools when changing inclusion or grouping stories under the same title.
Mark verification-only stories with per-story `tags: ['!manifest']`; the inventory-backed
source documentation provider also excludes these stories from MCP examples.
Build verification still requires their generated owners in the story index and checks that
they are absent from component manifest examples.

### Creating a template

Templates live under `src/stories/templates/` and are **copy-paste starting points**, not
importable components. Every template ships as exactly **two** hand-authored files, plus one
build artifact:

| File                 | Authored by   | Purpose                                                                                                                                           |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{Name}.tsx`         | you           | **Single source of truth** — the actual component + styles users copy-paste. No Storybook imports.                                                |
| `{Name}.stories.tsx` | you           | Storybook meta + story objects + JSDoc docs for MCP. Minimal — usually just a `Default` story.                                                    |
| `{Name}.mdx`         | **generated** | A "Source Code" docs page showing the full, real file content of `{Name}.tsx` verbatim. Gitignored. **Never hand-author or hand-edit this file.** |

> **Never create a separate `{Name}.knowledge.md`, `{Name}.template.tsx`,
> `{Name}Variants.stories.tsx`, or `{Name}.templateSource.ts`.** Those patterns previously
> duplicated a template's code and docs across up to 5 files. Variants live as additional story
> exports in `{Name}.stories.tsx` (keep them minimal); the full source is surfaced exclusively
> through the generated `.mdx` Source Code entry, never re-embedded via a `?raw` import or a
> `parameters.docs.source.code` string.

#### `{Name}.tsx`

Self-contained — a consumer should be able to drop it into a project with only
`@coreai-ds/react-components` and `@fluentui/react-icons` installed. **No Storybook imports** (no
`Meta`, `StoryObj`, or `@storybook/*` references). Use only `tokens.*` values in `makeStyles` —
no hardcoded colours/sizes/spacing (exception: a `minHeight` with no matching token, commented
as to why). Declare all styles in a single `useStyles` call at the top of the file.

#### `{Name}.stories.tsx`

Keep it minimal: a `meta` (title `Templates/{Name}`, `layout: "fullscreen"`) plus a `Default`
`StoryObj` (never a raw function-component export — see CSF3 rule below). Add extra story
exports only for genuinely distinct, useful variants (see `EmptyState.stories.tsx` for an
example with 4) — don't add one just to show off a prop, since the full source is one click
away in the Source Code docs entry. All Fluent/CoreAI imports come from `@coreai-ds/react-components`
(never `@fluentui/react-components`); icons from `@fluentui/react-icons`; never import
`JSXElement` from `@fluentui/react-components` (use `React.JSX.Element` or inference). A
full-page/edge-to-edge template opts out of the padded canvas via `parameters.fullBleed: true`
on the story (see `.storybook/preview.tsx`'s decorator).

**CSF3 story format** — every story export must be a `StoryObj` object:

```ts
// ✅ Correct
export const Default: StoryObj = { name: "My Template", render: () => <MyTemplate /> };
// ❌ Wrong — raw function export
export const WithSidebar = () => <MyTemplateWithSidebar />;
```

**Export names** must never shadow JS globals — use `ErrorState` not `Error`, `MapView` not
`Map`, `SetView` not `Set`.

The sidebar `title` is set once, in `{Name}.stories.tsx`'s `meta.title` — the generated `.mdx`
reads it back from there (`titleFor()` in the generator script), so it can never drift.

**Docs — JSDoc only**, following the same convention as `src/stories/components/*.stories.tsx`
(see [Curating descriptions & summaries](#curating-descriptions--summaries-jsdoc--tool-output)
above). Templates do not use `tags: ["autodocs"]` or `parameters.docs.description` — there's no
separate human-facing Docs UI page beyond the generated Source Code entry.

| JSDoc part                              | Where it appears                                        |
| --------------------------------------- | ------------------------------------------------------- |
| body text above `export default meta`   | `docs-show` description                                 |
| `@summary` above `export default meta`  | `docs-list` line                                        |
| body text above `export const <Story>`  | that story's block inside `docs-show`                   |
| `@summary` above `export const <Story>` | "Other Stories" compact list (stories past the first 3) |

The meta JSDoc body **must lead with** a copy-paste warning and a pointer to the Source Code
docs entry (that ordering matters — it's the first thing an agent or human sees), then the real
description, then `@summary`:

```ts
/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-{kebab-name}--source-code` docs entry.
 *
 * <then the actual description of what the template is/does>
 *
 * @summary <one line, mention variant count if > 1 story>
 */
```

#### `{Name}.mdx` — generated Source Code docs page (do not hand-author)

[`scripts/generate-template-docs.mjs`](scripts/generate-template-docs.mjs) generates one `.mdx`
per `{Name}.tsx`. It's gitignored and regenerated: once via `predev`/`prebuild`; live, on every
save to a file under `src/stories/templates/`, by a Vite dev-server watcher (`.storybook/main.ts`);
or on demand via `npm --workspace apps/storybook run docs:templates`. The generated page is
intentionally bare — just a `<Meta name="Source Code" summary="...">` tag and a fenced code
block of the real `{Name}.tsx` file content.

Why a separate generated docs page instead of embedding the source in `{Name}.stories.tsx` (via
`?raw` + `parameters.docs.source.code`, the old convention)? MCP's `docs-show` returns
**standalone MDX docs pages as raw file text**, but reconstructs a story's `render()` into
synthesized "usage code" rather than the literal file — so an MDX page is the only way to give
an agent the _exact_, complete, copy-pasteable file contents instead of a fabricated
approximation. `<Meta name="Source Code">` renames the Docs tab and its id suffix (e.g.
`templates-empty-state--source-code` instead of `--docs`); `<Meta summary="...">` gives
`docs-list` a clean one-liner instead of a truncated raw-MDX dump.

**Never hand-edit a `.mdx` file under `templates/`** — any edits are silently overwritten on the
next regeneration. If the content is wrong, fix `{Name}.tsx` or the generator script.

#### Quality checklist

- [ ] `npm --workspace apps/storybook run type-check` and `run build` both pass
- [ ] All story exports are `StoryObj` objects; no export name shadows a JS global
- [ ] All component imports come from `@coreai-ds/react-components`
- [ ] `{Name}.tsx` has no Storybook imports
- [ ] `{Name}.stories.tsx` has no `?raw` import, no `parameters.docs.source.code`, no
      `tags: ["autodocs"]`, no `parameters.docs.description`
- [ ] Meta JSDoc leads with the copy-paste warning + `--source-code` pointer, then the real
      description, then `@summary`
- [ ] Every story export has JSDoc (with `@summary` if likely to appear past the first 3)
- [ ] No `{Name}.knowledge.md` / `.template.tsx` / `Variants.stories.tsx` / `.templateSource.ts`
      file exists for this template, and you haven't hand-edited the generated `{Name}.mdx`

## Public documentation

This app is not deployed publicly. The docsite owns the GitHub Pages artifact and
all public documentation. See [hosting setup](../../docs/CI-CD-SETUP.md).
