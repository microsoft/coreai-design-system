---
name: coreai-ds-fluentui-react
description: 'MANDATORY for @coreai-ds/react-components work. Use the CoreAI documentation MCP to discover components, props, stories, templates, and implementation patterns. If the MCP is unavailable, stop and ask the user to enable or troubleshoot it with you.'
---

# CoreAI Design System - Using `@coreai-ds/react-components` as an agent

Use the CoreAI documentation MCP before CoreAI-dependent implementation. This skill provides
lookup and implementation rules for consuming repositories; component APIs, defaults, states,
and examples belong in the MCP.

## Skill boundary

This skill owns the authoritative workflow for the external `@coreai-ds/react-components` package:
CoreAI documentation lookup, included Fluent story lookup, and CoreAI import rules. It does
not decide whether the consuming repository already owns a product-specific adapter or composition.

Follow the consuming repository's component guidance to identify existing local adapters and
compositions, and inspect their source before using them. Local guidance owns repository-specific
import boundaries and behavior; this skill owns CoreAI API questions. Keep local component
catalogs and repository-specific exceptions in the repository's own guidance.

## Import components from `@coreai-ds/react-components`, not `@fluentui/react-components`

**Never** import a component from `@fluentui/react-components` directly — the barrel re-exports
Fluent's full surface and shadows some components with CoreAI-themed wrappers (`Button`, `Card`,
`Input`, …); importing straight from `@fluentui/react-components` renders stock Fluent instead of
the CoreAI version. This does **not** apply to every `@fluentui/*` package — icons
(`@fluentui/react-icons`) and other packages the barrel doesn't wrap are fine to import directly.
See the package's
[README.md](https://github.com/microsoft/coreai-design-system/blob/main/packages/react-components/README.md)
(or `node_modules/@coreai-ds/react-components/README.md#eslint` once installed) for the enforced
eslint rule.

Import components, styling APIs, and tokens from the CoreAI package:

```tsx
import { Button, Card, Input, makeStyles, tokens } from '@coreai-ds/react-components';
```

Import icons directly from Fluent:

```tsx
import { AddRegular } from '@fluentui/react-icons';
```

## MCP servers

- **`coreai-ds-docs`** — public documentation at `https://coreai-ds-storybook.azurewebsites.net/mcp`,
  combining CoreAI components, extensions, templates, and selected Fluent stories.
  CoreAI overrides take precedence for matching story IDs.
- **`fluent-agent`** — optional supplementary source at `https://chat.fluentui.dev/mcp/server/`
  for icon/token search or general Fluent guidance.
  CoreAI's combined catalog remains the source for component decisions.

For connection instructions, point the user to
[Docs/MCP Setup](https://coreai-ds-storybook.azurewebsites.net/?path=/docs/docs-mcp-setup--docs).
Keep client configuration and setup details in that guide. Ask for approval before editing
the user's MCP configuration.

### Required MCP workflow

1. Confirm the CoreAI documentation server is connected.
2. Call `docs-list` before assuming a component ID.
3. Call `docs-show` before using a component or prop.
4. Call `docs-show-story` when a specific state or pattern is needed.
5. Implement only documented props, combinations, and patterns.
6. If a component or prop is missing, report the gap. Do not invent it.

**Never hallucinate a prop.** Even a common-sounding one (`shadow`, `variant`, `color`) — verify
it's real via `docs-show` or an example story before using it. If it isn't documented or
shown in an example, ask the user instead of assuming.

### Report documentation and component gaps

When CoreAI documentation is missing, incorrect, or does not cover a needed component or prop:

1. Tell the user exactly what is missing and what fallback, if any, you used.
2. Ask whether they want you to file an issue in the
   [CoreAI GitHub issue tracker](https://github.com/microsoft/coreai-design-system/issues/new).
3. Only after the user confirms, use
   `gh issue create --repo microsoft/coreai-design-system` to file an issue that
   includes the component or documentation page, the expected behavior or
   information, the observed gap, and a minimal example when available. Source,
   pull requests, and issues share this GitHub repository.
4. If you cannot create the issue, give the user a ready-to-submit title and body instead.

## Component IDs have no predictable scheme

IDs are inconsistent — `components-button-button` (Storybook groups `Button` inside a `Button`
folder alongside `CopyButton`/`DropdownButton`/etc., doubling category+name), but
`components-avatar` (not doubled), `components-datetime-calendar` (category `datetime`, name
`calendar`). You cannot guess an id from a component name.

- Call `docs-list` first, every session, before assuming an id.
- Pass `withStoryIds: false` when you don't need story ids yet — it meaningfully cuts response
  size.

## Templates vs. components

- **Components** are real, importable components, ids like `components-button-button`,
  `components-avatar` — import from the barrel as usual.
- **Templates** (`templates-empty-state`, `templates-filterable-list`,
  `templates-shell-and-navigation`) are higher-level, copy-paste starting points, **not exported
  from the package** — there's no import path for them. Call `docs-show` with the
  template's id and copy its "Source Code" entry (story id `templates-empty-state--source-code`)
  verbatim into the consuming repo, then edit it freely to fit the app; it's meant to be
  modified as needed.
- Prefer an existing CoreAI component or template over recreating the same pattern with custom
  markup.

## Design implementation rules

- Preserve existing component structure, props, behavior, and accessibility when translating a
  design. Retheme before rewriting.
- Use CoreAI or Fluent semantic tokens instead of hardcoded colors, spacing, radii, typography,
  shadows, or motion values.
- Support both light and dark themes unless the product explicitly supports only one.
- Keep keyboard behavior, focus visibility, labels, names, roles, and contrast intact.
- Reuse documented component states instead of approximating them with custom CSS.
- Keep responsive behavior intentional. Check narrow and wide layouts.
- Use CoreAI typography primitives and presets for hierarchy.
- Use `CodeBlock` for source code and `Markdown` for Markdown content rather than maintaining
  custom renderers.
- Import exact product assets. Do not approximate supplied icons, SVGs, or illustrations.

## Higher-value docs for specific questions

Prefer these over guessing from a prop table alone — confirm the entry in `docs-list`, then pass its id to `docs-show`:

- **What CoreAI changes vs. stock Fluent** → `docs-variations-from-fluent--docs`
- **Theming / token overrides** → `docs-theming--docs`
- **Overriding styles with plain CSS/CSS Modules** → `docs-styling-with-css-modules--docs`

## If the CoreAI MCP is unavailable

Pause CoreAI-dependent work, report the connection error or missing server, and point the user
to [Docs/MCP Setup](https://coreai-ds-storybook.azurewebsites.net/?path=/docs/docs-mcp-setup--docs).
Help them connect, then retry the catalog index call to verify the connection.

Proceed offline only if the user explicitly authorizes it after being told that CoreAI APIs
and defaults cannot be verified. Disclose that limitation in the final result.

## Translating a Storybook URL into an MCP call

A link a human pastes in, e.g.
`https://coreai-ds-storybook.azurewebsites.net/?path=/docs/components-button-button--docs` or
`.../?path=/story/components-button-button--subtle-content-alignment`:

- The segment before `--` (`components-button-button`) is the `id` for `docs-show`.
- The segment after `--` (kebab-case) maps to a story export name for `docs-show-story`
  (e.g. `subtle-content-alignment` → `SubtleContentAlignment`). If the guess doesn't hit, confirm
  the exact name via `docs-show`, which includes the component's story index.
- For a story URL, use the full story ID to locate its exact entry in the component's story
  index or `docs-list` with story IDs. Pass the identifier or name required by the discovered
  `docs-show-story` schema rather than guessing an export name from kebab-case.
- The catalog includes selected canonical Fluent stories alongside local CoreAI
  examples, including upstream variants that are not overridden locally. Retrieve these through
  the same server. If a UI story is absent or its returned example is incomplete, report that
  specific gap instead of assuming re-exported stories are always unavailable.

## Completion checklist

- CoreAI MCP documentation checked for each component used.
- Relevant included Fluent stories checked through the CoreAI catalog when additional states or
  inherited APIs are needed.
- CoreAI differences applied and given precedence over upstream examples in conflicts.
- Imports come from `@coreai-ds/react-components`, except icons and packages the barrel does not wrap.
- No undocumented props or invented component APIs.
- Existing behavior and accessibility preserved.
- Semantic tokens used for visual styling.
- Light, dark, narrow, and wide layouts considered.
