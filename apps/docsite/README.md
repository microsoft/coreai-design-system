# @coreai-ds/docsite

React SPA docsite for CoreAI. Built with Vite + React 18 and themed entirely with the repo's own [`@coreai-ds/react-components`](../../packages/react-components) package (wrapped Fluent UI v9), the same way `apps/storybook` consumes it (workspace symlink, no ADO feed auth needed for in-repo builds). `vite build` emits a static bundle to `dist/`, then `server.js` serves it locally or on Azure App Service.

## Source of truth

- Base page inventory / nav / IA: [`site-registry.json`](site-registry.json)
- Canonical component guidance and metadata: plain Markdown in [`content/components/`](content/components)
- Offline Storybook input: [`content/storybook-index.snapshot.json`](content/storybook-index.snapshot.json)
- Changelog data: [`changelog.json`](changelog.json)
- Typed data layer and content validation: [`src/data/`](src/data)
- App shell + routing: [`src/App.tsx`](src/App.tsx), [`src/components/`](src/components)
- Theme provider (system/light/dark using `CoreAIFluentProvider`): [`src/theme/ThemeProvider.tsx`](src/theme/ThemeProvider.tsx)
- Pages: [`src/pages/`](src/pages)
- Build config (barrel alias + optimizeDeps to consume the package from source, mirrors storybook): [`vite.config.ts`](vite.config.ts)

## Scripts

Run from repo root:

```bash
npm run docsite        # vite dev server on http://localhost:8080
npm run build:storybook # generate the local API/example Markdown input first
npm run build:docsite  # vite build → dist/
```

Run from workspace:

```bash
npm -w apps/docsite run dev      # vite dev server
npm -w apps/docsite run build    # vite build
npm -w apps/docsite run preview  # serve the built dist/ via vite preview
npm -w apps/docsite test         # build + route/cache/bundle regression tests
npm -w apps/docsite run generate:content # regenerate from Markdown + cached/local Storybook data
npm -w apps/docsite run generate:content:refresh # refresh from deployed Storybook
```

To exercise the exact production runtime (Node static server + SPA fallback) instead of vite's preview server, run `npm -w apps/docsite run build` then `npm -w apps/docsite start`.

### Static Storybook Markdown

The Storybook build exports complete component references and standalone docs at
`apps/storybook/storybook-static/llms/`. The docsite build copies those files into
its own static output. No Storybook server, MCP connection, browser, or network
request is needed to read the published documents.

| Endpoint                       | Content                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/llms.txt`                    | Canonical guidance links plus every exported Storybook reference.                                                                               |
| `/llms/index.json`             | Reference IDs, titles, paths, and complete story-ID coverage.                                                                                   |
| `/llms/{storybook-id}.md`      | Component description, API tables, subcomponents, all selected examples, or standalone docs.                                                    |
| `/components/{guidance-id}.md` | Existing canonical guidance and resources, followed by matching component APIs and examples.                                                    |
| `/llms-full.txt`               | Combined canonical component downloads, including their matching references. Standalone Storybook docs remain discoverable through `/llms.txt`. |

For example, `/llms/components-accordion.md` contains the Accordion family API
and all selected variants. `/llms/components-combobox.md` includes both upstream
examples and local CoreAI overrides. The existing **Copy for LLM** and **View as
Markdown** actions use the enriched `/components/{id}.md` download. The human
guidance rendering, navigation search data, and interactive previews are unchanged.

Production builds require the export from the same Storybook build as their
index. Missing documents, stale story IDs, and incomplete exports fail the build.
`STORYBOOK_INDEX_PATH` selects another local build; its sibling `llms/` is used.
Plain `generate:content`, dev, and type-check can still use the committed offline
snapshot without a Storybook build. They explicitly warn when APIs and examples
are unavailable. A hosted-index refresh updates story associations, not API data.

These references preserve the selected public Storybook scope, not every Fluent
component or upstream variant. Known extraction limitations are stated inside
the affected references. Interactive MDX content that cannot be expanded
statically is identified rather than executed. See the [Storybook exporter documentation](../storybook/README.md#static-markdown-export)
for generation and validation details.

## Static reference catalog (staged)

The static reference app now covers **75 component groups and 11 template
groups**, with **710 working examples**, plus **21 standalone Markdown pages**
(107 pages total). It uses the existing CoreAI site layout
styles, grouped sidebar navigation, logo, mobile navigation header, and shared
theme provider. It does **not** require a Storybook build or server. The source
checkout and extraction tools are build-time inputs only.

Foundations, patterns, setup, and standalone guidance now use the same pipeline.
The app remains staged until the normal build and hosting cutover. Azure
deployment is unchanged.

From the repository root:

```powershell
npm --workspace apps/docsite run build:reference-proof -- --base=/coreai-design-system/
npm --workspace apps/docsite run verify:reference-proof
npm --workspace apps/docsite run preview:reference-proof
```

Open `http://127.0.0.1:8081/coreai-design-system/`. Omit `--base` when building
to use root URLs instead. Preview reads the base path from the generated index.
Rebuild after changing guidance or examples; this path has no development watcher.

Output is isolated in `dist-reference-proof/`. The existing `dist/`, running
docsite, Storybook, MCP, and Azure deployment configuration are untouched.
No static-site framework was added. The docsite explicitly declares the support
packages already used by the example catalog, including React Router, react-window
and its types, Fluent's JSX runtime, and drag-and-drop utilities.

| Catalog                  | Groups |                   Executable examples |
| ------------------------ | -----: | ------------------------------------: |
| Core components          |     75 |                                   690 |
| Copy-and-adapt templates |     11 |                                    20 |
| Standalone content       |     21 | Shared examples embedded where useful |

Standalone content includes Colors, Typography, Content, Materials, Theming,
Web UI guidelines, Forms, package/setup/agent guidance, React Grab, CSS Modules,
Variations from Fluent, resources, FAQs, release history, and the Markdown-owned
homepage. Prototyping remains explicitly under construction because the old site
reserved that page without authoring a guide.

CoreAI replacements win 70 matching upstream story IDs. The published catalog
includes every selected story in the existing supported scope. Fluent packages
excluded by the source inventory, such as Nav, remain excluded. The separately
authored Shell and Navigation template is not a Fluent Nav reference.

Each page has a physical HTML file and a Markdown counterpart, for example
`components/button/index.html` and `components/button.md`. HTML includes
expanded source and live React previews. Markdown includes the same guidance
and source without requiring JavaScript. Other outputs include:

- `guides/package/` and `guides/package.md`: provider, packages, and copy instructions.
- `source/examples/{story-id}.tsx`: complete, default-exported example modules.
- `source/templates/empty-state/EmptyState.tsx`: the template source, not an npm export.
- `llms.txt`: discovery links and exact package versions.
- `llms/index.json`: page/source URLs, hashes, included/replaced/excluded examples,
  member API metadata, the Default example ID, pinned Fluent revision, and verified runtime peer versions.
- `.nojekyll` and `THIRD-PARTY-NOTICES.txt`: static publishing and source attribution.
- Previous standalone directory URLs have static HTML redirects and raw Markdown
  aliases. All 19 standalone Storybook `llms/{id}.md` endpoints remain readable.

The output is published by the separate
[feature-branch Pages workflow](../../.github/workflows/docs-preview.yml).
See [preview setup and isolation](../../docs/GITHUB-ACTIONS.md#feature-branch-documentation-preview).
Local build commands do not deploy anything.

Reusable acquisition, inventory, source extraction, descriptions, and Markdown
sanitization now live in [`scripts/sources/`](scripts/sources/). Local Storybook
imports those implementations directly. Its existing `stories:*` commands remain
available, with provisioning delegated to the docsite's `sources:*` commands.
The upstream checkout and authored story files retain their existing locations
under Storybook for now; moving them is not required to change tool ownership.

### Implementation and concrete source findings

#### Standalone authoring

Add a Markdown file under `content/foundations/`, `content/patterns/`,
`content/guides/`, or `content/overview/`, with `id`, `title`, `summary`,
`resources: []`, and `reference: {}` frontmatter. Its path determines its URL.
`content/index.md` owns the homepage through `reference.route: index`.
`reference.label` can shorten a navigation label. `aliases` preserves old
directory URLs, `legacyIds` preserves exported Markdown IDs, and `migratedFrom`
records source provenance.

The supported build-time directives are deliberately small:

```markdown
<!-- generated: colors -->
<!-- generated: typography -->
<!-- generated: data-visualization -->
<!-- generated: catalog -->
<!-- generated: install -->
<!-- generated: provider -->
<!-- generated: font-families -->
<!-- generated: release-summaries -->
<!-- include: package-readme -->
<!-- include: package-changelog -->
<!-- include: package-skill -->
<!-- include: router-link-slots -->
<!-- example: components-text--presets -->
```

Only standalone comment nodes are expanded. Fenced examples are never evaluated.
Includes use a fixed repository-source allowlist. Unknown or malformed directives
fail the build. Relative documentation links, old Storybook documentation links,
base paths, and cross-page heading anchors are resolved for each presentation.

Color-role, typography, font-family, and visualization data are authored in Markdown tables
under `content/data/`. Color values come from the built CoreAI/Azure theme exports,
not a second hand-maintained palette. Human tables add swatches; raw Markdown
contains every value for both themes. The Typography, Theming, and Forms guides
embed the same compiled examples and source as the component catalog.

### Human presentation and custom views

All pages share a CoreAI title/summary, independent resource cards, and a
**Copy for LLM** menu with copy and raw-Markdown actions. These use the same
Markdown and resource metadata as the static files, not another authored copy.
The sidebar keeps React Router and the CoreAI Tree, with the compact logo,
search, Settings, collapse control, and keyboard shortcuts from the original site.

Standalone pages can opt into a bounded `reference.renderer`: `home`, `colors`,
`typography`, or `materials`. These restore the homepage graphic/resource pills,
interactive color ramps/token stacks, font cards/actual Text presets, and
theme-specific materials diagram. The registry is in
[`FoundationViews.tsx`](src/reference-proof/FoundationViews.tsx) and
[`HomeView.tsx`](src/reference-proof/HomeView.tsx).

Custom views enhance reserved static fallback slots; they do not replace the
Markdown pipeline. Foundations read the same authored tables used to generate
Markdown. The generated data is type-checked against CoreAI tokens and presets.
Raw Markdown retains all themes and both materials images. Without JavaScript,
HTML retains readable tables, images, resources, and the static homepage logo.
Presentation markers are stripped from published Markdown, not from fenced
code examples. Add specialized layouts only to this bounded registry; do not
restore hosted Storybook iframes or per-example providers.

### Default examples and APIs

Component and template pages put the selected `Default` story immediately below
the page header. Its source is available in a native **View example source**
disclosure. Each selected group must have exactly one `Default`; the build fails
instead of guessing another example. Component pages then show APIs, resources,
authored guidance, and the remaining examples. Markdown uses the same ordering
with the complete Default source expanded.

[`component-api.mjs`](scripts/sources/component-api.mjs) uses the standalone
`react-docgen-typescript` library for descriptions, prop types, documented
defaults, required flags, and deprecations. A thin TypeScript adapter resolves
exports through the public CoreAI barrel first, so wrapped defaults are not
replaced by Fluent defaults. The type program uses the docsite's installed
Fluent barrel. It does not read a Storybook build, require MCP, or ship docgen
in the browser bundle.

API membership comes from the same primary component/subcomponent metadata used
by Storybook. An Accordion page therefore lists Accordion, AccordionHeader,
AccordionItem, and AccordionPanel separately, after one shared Default example.
`reference.api` can explicitly name public exports for utility pages without
component metadata; toMountNodeProps publishes its function signature.
Complete template source remains copy-and-adapt code, not an npm API.

APIs render as TypeScript interface-style code blocks in HTML and Markdown,
with descriptions, defaults, conditional requirements, and deprecations in
JSDoc comments. Required properties omit `?`; optional properties include it.
These are generated prop summaries, not replacement type declarations.
Standard native DOM/event and ARIA props are omitted except common element/slot
hooks. A missing default is not inferred. Type displays are not truncated, and
the exported Props type remains authoritative. Docgen instances are
component-local so cached generic props cannot leak between contexts.

The package README, changelog, skill, and router helper remain their canonical
sources and are included at build time. The five authored Storybook MDX guides
are replaced by ignored snapshots generated from canonical Markdown during
Storybook preparation. This embeds the text for manifest-only MCP readers rather
than leaving imports that require source files on the host. The old
React page renderers remain until the app cutover, but staged content edits
belong in Markdown, not those legacy views.

### Agent discovery

The homepage promotes **Build with your agent**, with a **Copy starter prompt**
button, prompt preview, onboarding guide, optional reusable skill, and index link.
The prompt is authored once in
[`agent-prompt.md`](content/data/agent-prompt.md), published as `agent-prompt.txt`,
and included in the human/Markdown onboarding guide. The homepage copies the
same text; no separate prompt is maintained in React.

`llms.txt` begins with targeted-retrieval instructions and direct links to the
workflow, starter prompt, skill, and exact-route JSON index. The skill remains
canonical in the package's [`agent/SKILL.md`](../../packages/react-components/agent/SKILL.md)
and is published unchanged at `source/package/SKILL.md`. Installing it in a
consuming repository is optional and requires review/approval before writing.
Old npm versions are not republished by this documentation change.

The staged site no longer publishes server-connection setup instructions.
Old setup URLs redirect to the HTTP onboarding guide; their legacy document ID
returns the replacement guide. Historical package changelog bullets about the
retired integration are omitted from the site through the explicit
`package-release-notes` include. The source changelog remains unchanged and
linked for historical reference. Legacy server hosting and production main are
not changed by this content cleanup.

[`build-reference-proof.mjs`](scripts/build-reference-proof.mjs) uses the shared
story inventory to select examples and apply local-over-Fluent ownership.
It generates plain React TSX using the existing source extractor. Those **same
generated modules** are bundled for previews, displayed as code, and published
as downloads and Markdown. One generated file per example avoids export/helper
name collisions; authors can still group many examples in their original files.

This was simpler than importing raw Storybook modules and building a separate
runtime adapter:

- Fluent Button entry points reexport normal React functions. Their index and
  documentation imports do not need to enter the browser bundle.
- Local Button, Dropdown, and CodeBlock stories use explicit `render` functions.
  Extracting those functions removes Storybook metadata while preserving React
  state, hooks, CSS, and native component interactions.
- Tree lazy loading imports real local helper modules. The existing extractor
  already includes their source closure; no new dependency flattener was needed.
- Upstream Dropdown's optional Fluent props need the existing type-only
  adaptation for CoreAI's inline-label prop union. Runtime behavior is unchanged.
- Empty State's source is independent of Storybook and can be offered directly
  as a copyable component.
- Tree virtualization needs its original `@jsxImportSource` pragma. Extraction
  preserves that compiler instruction and lists the required Fluent JSX runtime.
- Static DOM IDs are prefixed per generated example, including matching label,
  fragment, and ARIA references. This lets Breadcrumb and Carousel examples share
  a document. The code users copy includes the same IDs as the preview.
- List derives DOM IDs from selection values. Its page explicitly runs one live
  example at a time instead of altering its selection model or adding iframes.
- CounterBadge uses a fixed count rather than controls-only Storybook args.
  Popover's example does not require callers to supply children it already owns.
  React Router template types use distinct names so flattened source remains valid.

The initial contract accepts function examples and explicit render functions
with no Storybook context. Controls and interaction-test scripts are not run.
Args, loaders, inherited render functions, globals, or setup hooks that this
path would otherwise discard fail with adaptation/exclusion instructions.
Layout-only decorators are omitted only where the Markdown metadata explicitly
documents that simplification. Simplify unsupported examples instead of adding
a general Storybook compatibility layer.

Existing CoreAI guidance is preserved. New pages start from source descriptions
and are marked under construction until their CoreAI UX guidance is reviewed.
Generated files live outside the authoring tree. Builds never overwrite guidance
or merge Fluent and CoreAI paragraphs.

Page selection is owned by Markdown frontmatter, not a list in the build script:

```yaml
reference:
  component: components-dropdown
```

The route follows the content filename: `content/components/Dropdown.md` becomes
`components/dropdown/` and `components/dropdown.md`. An optional `route` overrides
that location while existing template guidance is migrated. An optional `examples`
list narrows a page; omitting it includes all selected examples. Alternatively,
`exclude` maps export names to explicit reasons. Unknown selections fail the build.
`omitDecorators` explains a deliberate layout simplification. `singlePreview`
explains why a page must run examples one at a time.
Template pages must declare `sources`, listing complete component files under
`src/stories/templates/`. Empty State also provides DetailsList for its detail-card
variant. Invalid metadata, duplicate ownership, and duplicate routes fail the build.
Pages without `reference` metadata remain outside the staged reference site.

To seed newly supported source groups, run `npm --workspace apps/docsite run
catalog:init`, review the Markdown changes, and commit them. This initializer is
not part of ordinary builds. Existing page text stays intact. Template sources
include the local files their examples need, including React Router slot helpers.

The reference application now uses the existing docsite `ThemeProvider` once
at its React root. The layout and all examples inherit that one provider.
React portals mount examples into the static page's preview slots without
creating another React root or provider. A theme switch updates all examples
and preserves their current state. The chosen theme persists across page
navigation. Static HTML and grouped navigation remain readable without JavaScript.
The sidebar uses CoreAI `Tree`, `TreeItem`, and `TreeItemLayout`, with Components,
Templates, and a nested React Router group. It includes a title filter, active-page
state, arrow-key expansion/navigation, Enter activation, and mobile navigation.
The static link list remains as a no-JavaScript fallback.

React Router handles normal documentation links without reloading the document.
The app-level provider, sidebar, theme controls, and expanded Tree groups stay
mounted; only the page content and its examples change. The router fetches the
existing static HTML for the destination, so no separate page-data service or
SPA server fallback is needed. Direct visits and refreshes still use the physical
HTML files. Markdown, source downloads, external links, and modified/new-tab
clicks retain normal browser behavior.

Page changes update the title, focus, fragments, and history scroll positions.
Pending requests are canceled when another navigation wins. Failed requests show
an explicit error with a Retry control rather than stale content or a silent
full reload. The example subtree shares the theme but sits outside the site router,
so React Router templates can supply their own isolated demo routers.
Example bundles load per component page, not for the full catalog on every
navigation.

External font loading belongs to the legacy application's entry point, not the
shared provider. The reference site uses the package's font stacks and does not
request the old Azure font service.

The proof explicitly deduplicates React, React DOM, and Fluent's component
barrel. The build checks their actual module roots and versions and rejects a
Storybook runtime dependency. This matters because the current workspace's
CoreAI development dependency resolves Fluent 9.74.7 while the docsite and
pinned examples resolve 9.74.9. The proof bundles the latter and separately
checks the packed CoreAI artifact against that consumer version.

### Verification and limits

`test:reference-proof` runs focused Node tests. `verify:reference-proof`:

- Packs CoreAI locally and type-checks every downloaded example, the template,
  and provider setup in an isolated consumer directory without workspace aliases.
  It does not install from or verify availability on the public npm registry.
- Uses a static preview server with no SPA fallback to check paired URLs, raw
  downloads, missing-page 404s, licenses, versions, coverage, and source hashes.
- Checks exact guidance/source parity across HTML, Markdown, and downloads.
- Checks Default-first ordering, separate member APIs, CoreAI defaults, and
  copy/download parity for the collapsed basic-example source.
- Runs Chromium checks for every preview, duplicate DOM IDs, clipboard copying,
  Dropdown inline-label selection, Dialog opening/closing, asynchronous Tree
  expansion, CodeBlock format selection, and template rendering.
- Activates every List preview individually and checks navigation filtering,
  active links, mobile opening/closing, Escape focus restoration, and base paths.
- Confirms that sidebar clicks, static article links, Tree Enter activation, and
  Back/Forward keep the same document, sidebar, and provider. Checks Tree
  expansion state, independent demo routers, fragment navigation, modified clicks,
  raw Markdown navigation, failed-request retry, and late-response cancellation.
- Asserts exactly one provider per document and checks live theme inheritance,
  selection-state preservation, and theme persistence after navigation.
- Confirms that human guidance and source remain readable without JavaScript.
- Resolves every authored standalone include from its canonical source and checks
  all local article links, fragments, images, legacy aliases, and Markdown IDs.
- Cleans up its temporary packed consumer, browser, and test server.

This staged app still omits an editable playground, full-text search, and archived
releases. Some inherited guidance and new reference pages need UX review.
Examples demonstrate APIs and are explicitly subordinate to CoreAI design
guidance. Task-based evaluation of designer/agent decision quality is still
needed before replacing the public site.

Colors has interactive brand tabs and token stacks, with complete tables in
Markdown and no-JavaScript HTML. The Content page's former hidden panels are
visible text. Principles, examples, workflow steps, and support details remain
readable in both outputs. Live component demonstrations remain interactive.

The build splits examples by page and shares common dependencies. Some common
chunks still trigger Vite's large-chunk warning. GitHub Pages response headers and
actual public deployment have not been tested; raw Markdown retrieval is checked
over local static HTTP and does not depend on `text/markdown` negotiation.

## What ships

- Landing page with Storybook, Figma, and npm links.
  Audience cards are reserved for future content.
  Resource icons and labels use the link color
  at rest. The left-aligned content is centered horizontally and vertically
  within the main area's left half.
  An oversized, full-opacity, draggable logo extends off the page on the
  right. The desktop illustration is viewport-anchored and sized from viewport
  height, so toggling the sidebar does not resize or reposition it. Only the
  viewport clips it, not the inset page container. Narrow or short screens can
  still scroll when needed to reach the actual content.
  The illustration is 25% larger on desktop and mobile. It drifts at 0.080802
  radians/second (two successive 33% reductions from 0.18) under
  stationary lights, with Paper's animated Heatmap followed by
  Image Dithering (8x8 Bayer, 2px cells, original colors, colorSteps 4).
  Dither spacing uses CSS pixels for consistent
  texture across display densities. The cubes slightly overlap at their rounded
  corners to close the gaps. A theme-matched radial fade sits above the desktop
  illustration and below the hero content, without blocking pointer interaction.
  Reduced-motion preference stops both automatic drift and heatmap animation
  but keeps dragging available. The temporary tuning controls are removed.
  On narrow screens the logo moves below the content. Shared resource URLs come from
  [`shared/site-links.ts`](../../shared/site-links.ts); package and MCP guidance stay on the local site.
- App shell with header, sidebar nav, content column, footer, and prev/next page nav, composed from CoreAI `Button`, `Card`, `Input`, `Link`, and `Text` components
- Client-routed pages for resources, changelog, colors, typography, materials, Web UI Guidelines, component package, and agent skill
- Theme preference (system/light/dark, persisted in `localStorage` as `coreai-docsite-theme`), mobile nav toggle, token copy actions
- Exposed `site-registry.json` and `changelog.json` in built output for human and agent consumption (copied into `dist/` at build time)
- Component pages rendered from canonical Markdown, with matching downloads at `/components/{id}.md`
- Story IDs, preview options, and iframe targets generated from the live Storybook index
- Component routes and built registry entries generated from the canonical component records
- LLM discovery files at `/llms.txt` and `/llms-full.txt`, generated from the same component content
- Route-level JavaScript chunks, WOFF2 fonts, Brotli/gzip responses, and enforced delivery budgets

Because it is a client-rendered SPA, `server.js` includes an SPA fallback (serves `index.html` for unknown extension-less routes) so client-side deep links resolve.

### Navigation

The sidebar follows this order:

- **Overview:** Home, Resources, FAQs.
- **For humans:** Prototyping, NPM package.
- **For agents:** MCP server, Package skill.
- **Foundations:** Colors, Typography, Content.
- **Components**, then **Templates:** existing guidance pages.
- **Samples:** an empty section after Templates.

Each group has its own section with a bottom divider, including Overview,
For humans, and For agents. On initial load or reload, Overview starts open and all
other sections start collapsed unless the current page belongs to that group.
Empty sections remain visible outside search.
Search replaces the groups with ranked page results and highlighted excerpts.

**Home** keeps the existing landing page at `/`.
Resources (`/resources/`) groups nine link cards into Assets, Code, and Connect.
Each card is one native link, composed with the existing CoreAI Card and Text controls.
Cards use the `filled-alternative` appearance. Content uses the standard page max-width.
Icons are 24px with no separate background. Destination
labels and external-link icons use `colorBrandForegroundLink`.
Titles, descriptions, destination labels, and icons live in
[`src/data/resources.ts`](src/data/resources.ts); URLs reuse `siteLinks`.
Cards open in a new tab, announce that behavior, and support keyboard focus.
The grid adapts to the available width in both themes.
FAQs (`/faqs/`) contains 12 answers in five topic groups, using the
existing CoreAI Accordion, Text, and Link controls. Questions, answers, links,
and research sources live in [`src/data/faqs.ts`](src/data/faqs.ts).
The page renders only optional `links` to resources mentioned in an answer,
such as setup guides and GitHub Issues. The `sources` stay in the data for
editorial traceability; they are not rendered as citation lists.
The research combines live Storybook documentation, the package README, and
selected CoreAI DS Community threads. Community history was only partially
available, so this is not a frequency-ranked or exhaustive list.
Mini Foundry background was checked against the existing
`proto/jabradford/mini-foundry-history-slides` source at `ca0ea4f7`
(`app/slides/ExampleSlideDeck.tsx`); the deployed deck required sign-in.
Additional rationale comes from the September 22 Apogee Loop recording transcript
retrieved through WorkIQ and speaker notes read directly from the Figma `History`
deck (`Lyb3shKi3jWCYjxajCRqmt`, slides 13, 15, 16, and 17). The transcript excerpts
had no timestamps, so retained recording references point to the whole recording.
Historical migration plans and unconfirmed component delivery dates are not current guidance.
Prototyping (`/prototyping/`) and Content (`/content/`) use the shared "Page under construction" state
in [`src/components/work-in-progress.tsx`](src/components/work-in-progress.tsx).
It is centered in the page with no separate page header or summary.
Empty state (`/empty-state/`), Page header (`/page-header/`), and Top nav
(`/top-nav/`) show only this state, centered in the page without a page header,
preview, resources, or guidance. Their source content remains intact for later use.
Other component pages marked `under-construction` show the state above their
existing previews, resources, and guidance.
The state uses a miniature monochrome version of the spinning home logo,
with neutral lighting, dithering, and no purple heatmap. Drag the logo to rotate it.
Reduced motion stops automatic rotation but keeps dragging available.
It has a static logo while the canvas loads.
On entry, the logo, heading, description, and button fade in over 320ms each,
staggered by 70ms. This repeats when switching template pages.
Reduced motion shows all elements immediately.
"Share a suggestion" opens the existing `siteLinks.feedback` intake in a new tab.
Its label and 16px external-link icon use the purple link colors, including hover
and pressed states. Supporting copy reads "We're still working on this page."
Content's authored guidance remains intact in `src/pages/Content.tsx`; removing
`content` from `blankPageIds` restores it. Existing page URLs stay unchanged.
Materials and Changelog remain available at their existing URLs without sidebar entries.

Storybook previews include a small "Preview not loading?" help row.
"Sign in to Storybook" opens the current story in a new tab. After signing in,
"Reload preview" reloads only that iframe, preserving the selected story and theme.
Figma previews do not show this help row.
This is recovery guidance, not an authentication check: the docsite does not read
the cross-origin iframe, infer sign-in status from its load event, or change
Storybook's server or Azure authentication configuration.

At viewport widths of 1440px and above, only FAQs shows a sticky "On this page"
rail using its rendered registry anchors. The FAQ content column is capped at 776px.
The TOC sits in the right margin rather than taking space from the content.
It grows to 200px wide as room allows; longer labels wrap at smaller desktop widths.
The rail aligns with the FAQ title, has an 80px gap from the content, and uses existing CoreAI `LinkButton`
controls with a filled active row, native fragment links, and standard hover/focus states.
It highlights the current section within the page scroll region and updates when
content expands or the viewport changes. Clicking a section keeps that section
selected even when the scroll position is limited by the bottom of the page;
scrolling away resumes automatic section tracking.
TOC clicks scroll smoothly and keep the chosen section highlighted during the transition.
Reduced-motion preferences disable smooth scrolling. Direct section URLs load at their target.
It does not expand FAQ answers. All other pages retain their layout without a rail.
Below 1440px, the rail is hidden and the existing single-column layout is unchanged.

On desktop, the logo button hides or shows the sidebar. The collapsed sidebar
shows only that button, overlaid on the page without reserving a sidebar gutter.
The contents fade without wrapping during the transition.
Reduced motion disables the transition. The toggle shortcut does not focus the
logo button; normal Tab navigation keeps its visible focus indicator.
Docsite-only styles set navigation item left padding to 16px and section heading
left padding to 8px.
The footer has a soft upward shadow in the shell background color, clipped inside
the sidebar, to separate its links from scrolling navigation items.
The outer outline and footer divider paint above the shadow so their strokes stay visible.
The desktop open/closed state persists across reloads in `localStorage` under
`coreai-docsite-sidebar-collapsed`. The mobile overlay still starts closed.
Cmd/Ctrl+K expands it and focuses search. On mobile,
the logo closes the existing navigation overlay.

| Action                           | Mac            | Windows         |
| -------------------------------- | -------------- | --------------- |
| Show/hide navigation             | Option+S       | Alt+S           |
| Previous page                    | Option+Up      | Alt+Up          |
| Next page                        | Option+Down    | Alt+Down        |
| Collapse all navigation sections | Cmd+Shift+Up   | Ctrl+Shift+Up   |
| Expand all navigation sections   | Cmd+Shift+Down | Ctrl+Shift+Down |
| Switch theme                     | Option+M       | Alt+M           |
| Search navigation                | Cmd+K          | Ctrl+K          |
| Close mobile navigation          | Esc            | Esc             |

Previous/next follows sidebar order, including collapsed groups, without wrapping
at the ends. After a page change, the navigation scrolls just enough to reveal the active page,
waiting for its group to open if needed. Opening or closing sections manually
does not scroll back to the active page. This does not move focus or scroll the page body.
Pages outside the sidebar do not participate. Collapse-all closes
the groups, not the whole sidebar. The next page change reopens only the destination
group, even when the previous page was in that same group.
Plain N and M no longer trigger actions.
Shortcuts ignore typing fields, held keys, text composition, and AltGr.
Search and Escape remain available while typing. Search also opens mobile navigation.
Option letter shortcuts use physical key codes so macOS-generated characters
do not prevent recognition. Shortcuts apply to the docsite, not embedded previews.

The settings gear in the sidebar opens a popover with an elevated **Dark / Light**
tablist sized to its content above the shortcut list. The popover opens below
the gear, aligned to its left edge. The complete menu, including padding and
borders, is 220px wide. Shortcut labels use type-ramp size 200 and foreground 2.
CoreAI Badges contain system-UI shortcut glyphs. Letters, modifiers, and arrows
use size 200, with a 2px gap between keys and no text spaces.
The edge-to-edge divider matches the popover border.
Shortcut badges use platform-specific symbols without plus signs;
full key names remain available to screen readers and on hover.
Escape is not listed in the popover, but still closes the popover first,
without closing an open mobile navigation overlay. The popover reuses CoreAI
controls and Fluent's settings icon; shared components are unchanged.

### Illustration shaders

The pipeline is **lit 3D X → Paper Heatmap → Paper Image Dithering → CSS radial fade**.

The home illustration stays hidden until its first complete rendered frame, then
fades in over 400ms. Reduced-motion preferences disable the fade.

[`src/components/paper-heatmap.tsx`](src/components/paper-heatmap.tsx) uses Paper's
published Heatmap fragment shader with a ten-stop palette: the first two stops
match the page background (black in dark mode, white in light mode), allowing
cooler parts of the shape to disappear. The next lavender stop
(`coreaiBrandVariants[140]`) has about 12% opacity over that background.
The illustration contains no Azure-blue stops.
Seven purple stops bridge the tail to the center:
`coreaiBrandVariants[140]`, `[130]`, `[110]`, `[100]`, then three `[80]` stops.
This adds lavender-to-purple transitions while keeping most of the heated
range saturated brand purple in both themes.
The app shell owns the page backdrop; the provider has no duplicate fill.
All surfaces switch theme colors together with the shader and radial fade.
Transitions are suppressed until the new theme paints, then normal hover and
sidebar transitions resume. Rapid theme switches cancel pending cleanup frames.
The colors come from the shared CoreAI theme. Contour is 1.0
to strengthen the heat around edges without adding a separate outline.
Paper's noise is set to 0.025 for subtle texture variation without changing the palette.
The heat animation runs at 67% of its original speed.
Paper expects a preprocessed image, not a live render target. The adapter supplies
its contour, broad-blur, and inner-blur channels using GPU grayscale preparation
and library Kawase blur passes. This is a live approximation of Paper's static
CPU image preprocessing; it does not rewrite the heatmap animation or color algorithm.
Those smooth fields are capped at 512px on the longest side. Scene lighting drives
the heat fields, but does not multiply and dim the finished colors a second time.
The final composite keeps the original surface alpha so the colors stay on the cubes
without changing their silhouette. Paper adds a small amount of output grain even
with noise disabled. The adapter snaps colors within 0.012 of the base back to the
exact base color, preventing dithering from amplifying that grain into stray specks.
The vertex adapter cancels Paper's static-image
padding crop. No image snapshots or CPU readbacks run per frame.

[`src/components/paper-dithering.tsx`](src/components/paper-dithering.tsx) adapts
the published `imageDitheringFragmentShader` from the pinned
`@paper-design/shaders` package. The dithering algorithm is not copied or rewritten.
The adapter supplies the live heatmap render target, resolution, and pixel ratio.
It removes Paper's image-upload Y flip for render-target input
and lets Three.js supply the GLSL version directive. At the input/output boundary,
it separates color from the scene's premultiplied alpha, dithers color at full
opacity, then restores the sampled surface coverage. This prevents dark outlines
on partially transparent white edges without changing opaque heatmap colors.
No custom shading blend or
output-level shader runs after it. Original-color mode preserves the heatmap
colors in both themes, with a transparent background.

Upstream: [Heatmap](https://shaders.paper.design/heatmap),
[Image Dithering](https://shaders.paper.design/image-dithering), and
[shader source](https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/image-dithering.ts).
The Apache 2.0 license and Paper notice ship in
[`public/third-party/`](public/third-party/). When updating the package, verify
orientation, transparency, resizing, display density, theme switching, and dragging.

## Updating component guidance

Story selectors on all component pages use CoreAI's popover-based `Dropdown`
and `Option` controls, not native browser selects. Selection updates both the
embedded preview and its Storybook resource link. Shared components and controls
inside embedded previews are unchanged.

Edit the `.md` files in [content/components](content/components); use
[Accordion.md](content/components/Accordion.md) as an example. Don't edit generated output.

Name sources `ComponentName.md`, matching component casing, or
`ComponentName-kebab-case-variant.md` for variants. Design-only patterns keep
descriptive PascalCase names. Frontmatter `id` remains the stable kebab-case route
and download name; renaming a source must not change it. Keep separate alias
documents distinct (for example, `EmptyState-alias.md`).

Nonstandard behavior in [shared/guidance.mjs](../../shared/guidance.mjs):

- **Do/Don't cards:** `## Best practices` with exactly two nonempty H3 sections,
  `### Do` and `### Don't`, becomes a green/red pair on the docsite only.
  Matching is case-sensitive; curly apostrophes work. Other shapes remain plain
  Markdown. See `bestPracticesCards` for boundaries and ordering.
- **Anchors:** docsite heading IDs and direct `#fragment` links receive a
  `guidance-` prefix automatically. See `renderGuidance`.
- **Exports:** status/resources come from frontmatter, not body headings.
  Previews prefer Storybook; design-only pages can use `figmaPreview` for an
  embedded Figma frame. Figma resources also appear as links alongside code and
  Fluent guidance. Pages may omit `storybookTitles` and use `resources: []`;
  exports omit an empty Resources section. See `guidanceMarkdown`.
- **Aliases:** `navigation.canonicalId` redirects a hidden page without merging
  its content. See `readGuidance`.

Generation runs on dev/build and Markdown saves. The
[docsite generator](scripts/generate-content.mjs) uses a local Storybook index or
the committed offline snapshot.
Guidance is published only on the docsite, not as separate Storybook or MCP entries.
The homepage links to the Figma library through
[`shared/site-links.ts`](../../shared/site-links.ts). Figma links and embeds keep
the design file's existing sharing permissions; readers may need to sign in or
request access.

### Build Inputs and Outputs

- Commit only the environment-free [offline snapshot](content/storybook-index.snapshot.json).
  `generate:content:refresh` updates it from hosted Storybook; set an absolute
  `STORYBOOK_INDEX_PATH` to refresh from a local build instead. Routine generation
  never updates it. Refresh deliberately when story associations change.
- All of `content/generated/` is ignored, including the runtime manifest and its
  `STORYBOOK_ROOT`. Storybook's generated MDX, build folders, and `.playwright*`
  artifacts are also ignored. The docsite `clean` script removes its generated output.
- CI/deploy build Storybook before testing/building the docsite against that exact
  index and its Markdown export. Missing explicit paths or production Markdown
  exports fail instead of falling back. Without a local build, guidance-only
  dev generation works offline after dependencies are installed;
  Storybook itself still requires its pinned Fluent checkout.
- Story options are ordered by authored family order, then Default first and
  story ID. Unchanged docsite output is not rewritten. Dev/build/type-check use
  explicit preparation commands, including when `ignore-scripts=true`.

## Privacy and runtime diagnostics

The docsite does not collect or transmit product usage data, load analytics
scripts, or expose remote reporting configuration. Navigation search stays in
the browser, and the saved theme preference is used only for local presentation.
Ordinary startup logs and actionable console errors remain on the host; the
application contains no code that forwards them to a remote analytics service.

The unauthenticated `/healthz` endpoint returns `{"status":"ok"}` for health
checks. The hosting template does not provision monitoring resources. Removing those
resources from the template does not delete existing Azure resources or
previously collected data; any cloud cleanup requires a separate, deliberate
administrator action.

## Deployment

The shared [GitHub deployment workflow](../../.github/workflows/deploy.yml)
deploys this workspace alongside Storybook and the MCP using ZIP deployments to
**existing** Azure App Services. It does not apply Bicep or change existing app
settings, startup commands, or authentication. The hosts retain Node 22 LTS on
Linux, with the docsite served by `npm start` / `node server.js`.

Deployment requires all of the following:

- The exact repository `microsoft/coreai-design-system` and branch `main`
- Repository variable `ENABLE_AZURE_DEPLOY=true`; site deployment does not
  enable npm publishing
- Passing CI and main-only access to the `azure-production` environment;
  the protected PR merge is approval, with no second human deployment gate
- Azure OIDC configuration and existing host identifiers supplied through that
  environment, as documented in [CI/CD setup](../../docs/CI-CD-SETUP.md)

The workflow responds to every main-branch push,
and supports manual dispatch subject to the same gates. It verifies existing
hosting authentication before deploying. No monitoring workflow is included.

## Hosting access policy

The docsite, Storybook, and read-only MCP are public and require no visitor
authentication or access tokens. Both App Services have Easy Auth disabled
(`platform.enabled=false`, `globalValidation.requireAuthentication=false`,
`unauthenticatedClientAction=AllowAnonymous`), as declared in
[`infra/main.bicep`](../../infra/main.bicep). The deployment workflow checks this
policy before and after uploading application files; it does not change Azure
authentication settings.

The workflow's Azure OIDC identity still authorizes deployments. It is separate
from visitor access and must remain.

Bicep remains available for separately approved operator-managed infrastructure
changes, not routine app deployment. Preserve anonymous access for both apps
and the MCP endpoint when making such changes. See the
[hosting contract and prerequisites](../../docs/CI-CD-SETUP.md#app--mcp-hosting-public-docsite-storybook-and-mcp)
before changing infrastructure.
