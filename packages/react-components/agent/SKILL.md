---
name: coreai-ds-fluentui-react
description: >-
  Docs/skill v0.1.0; package v0.12.0. Use when building, styling, reviewing, or
  debugging React UI with @coreai-ds/react-components. Fetch CoreAI Markdown
  documentation over HTTPS for components, APIs, defaults, templates, tokens,
  and accessibility guidance.
metadata:
  version: 0.1.0
  package-version: 0.12.0
---

# CoreAI React UI

## Documentation entry points

Base URL: https://microsoft.github.io/coreai-design-system/

- Start here: https://microsoft.github.io/coreai-design-system/llms.txt
- Agent workflow: https://microsoft.github.io/coreai-design-system/guides/AgentWorkflow.md
- Package setup: https://microsoft.github.io/coreai-design-system/guides/Package.md
- Exact routes, examples, source downloads, API membership, and versions:
  https://microsoft.github.io/coreai-design-system/llms/index.json
- Current docs/skill and documented package versions:
  https://microsoft.github.io/coreai-design-system/version.json

Use ordinary HTTPS GET requests with your available web-fetch or HTTP tool.
These are static files; no account, server connection, or special protocol is
needed. Do not upload repository content or credentials to read documentation.

## Install or refresh before UI work

Before each CoreAI task, fetch `version.json` once using an uncached HTTPS GET.
Its `version` and `skill.version` share the docs/skill release; `packageVersion`
identifies the documented component package. These are separate version tracks.
Only the current documentation is hosted.

Use the existing `coreai-ds-fluentui-react` skill in this repository's supported
skill directory. If none exists, install the published skill at
`.github/skills/coreai-ds-fluentui-react/SKILL.md`, or the client's supported
equivalent. If its `metadata.version` is missing or older, fetch and review
`source/package/SKILL.md` and update it before implementing. Compare semantic
versions, not strings. Do not downgrade a newer local skill.

Check that the downloaded skill's `metadata.version`, `metadata.package-version`,
and description agree with `version.json`. Retry an uncached fetch if they
disagree; report a persistent mismatch instead of installing mixed releases.
Refresh the published CoreAI guidance while preserving repository-specific
instructions, adapters, and conventions. Ask before resolving conflicting local
rules. Do not change unrelated instruction files or execute downloaded code.

The starter prompt authorizes installing or updating this skill only. Get the
user's approval before writing instructions when that action is not already
authorized, or when the client requires it. If retrieval, approval, or writing
is blocked, report the problem and ask how to proceed; do not silently skip
installation or claim that an update succeeded. Follow the updated skill in
the current task and reload it for future tasks if the client requires that.

## Retrieve only what the task needs

1. Inspect the consuming app's package manifest and lockfile for installed CoreAI
   and Fluent versions. The site documents the current release, not archived APIs.
   If versions differ, check the installed declarations and disclose the mismatch.
2. Fetch `llms.txt` once per task to find the relevant page. Reuse pages already
   fetched during that task; do not download the entire catalog.
3. Read the selected page's Markdown before choosing components or props.
   It includes a basic Default example, API summaries, UX guidance, and other examples.
4. For a known human URL, replace its trailing slash with `.md`, preserving the
   `/coreai-design-system/` prefix. The homepage maps to `index.md`.
   Example: `components/Button/` becomes `components/Button.md`.
5. Use `llms/index.json` only when you need exact routes, subcomponent membership,
   story IDs, dependencies, or direct source links. Follow published paths instead
   of guessing names from component exports or old story IDs.
6. Fetch only the source files needed for the chosen example or template. Inspect
   them before adapting. Validate the result with the consuming app's checks.

CoreAI UX guidance takes precedence over upstream demonstration examples.
API blocks are summaries; exported package types are authoritative. Never invent
props, defaults, or package exports. If guidance is missing, report the gap and
identify any fallback. Do not claim a failed request succeeded.

## Imports and application setup

Import components, tokens, and styling APIs from `@coreai-ds/react-components`.
Do not bypass CoreAI wrappers by importing the Fluent component barrel directly.
Icons can come from `@fluentui/react-icons`.

Use one `CoreAIFluentProvider` at the app root unless the product intentionally
needs a nested theme. Read setup and theming guidance before changing providers.
Inspect existing local adapters and repository import rules before adding UI.

Useful direct references:

- Theming: https://microsoft.github.io/coreai-design-system/foundations/Theming.md
- Colors: https://microsoft.github.io/coreai-design-system/foundations/Colors.md
- Typography: https://microsoft.github.io/coreai-design-system/foundations/Typography.md
- CoreAI differences: https://microsoft.github.io/coreai-design-system/guides/VariationsFromFluent.md
- CSS Modules: https://microsoft.github.io/coreai-design-system/guides/StylingWithCssModules.md

## Templates and design quality

Templates are copy-and-adapt files, not npm exports. Read their page and copy every
required source file it lists into the consuming repository. Do not invent a
template import from the package.

Prefer documented components and semantic design tokens. Preserve keyboard
behavior, focus visibility, accessible names, responsive layouts, and both themes.
Check the implemented behavior, not only whether the code compiles.

## Unavailable documentation

If fetching fails, report the URL and error. Use installed package declarations,
README, and changelog as explicit offline fallbacks. Do not substitute unverified
stock Fluent behavior for CoreAI behavior. Ask before filing a public issue or
sharing project details.
