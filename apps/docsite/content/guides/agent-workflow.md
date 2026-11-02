---
id: agent-workflow
title: Agent workflow
summary: Find the right CoreAI Markdown page, retrieve only what you need, and verify the result.
resources: []
reference:
  renderer: agent-workflow
---

## Start here

Base URL: https://microsoft.github.io/coreai-design-system/

1. **Find the index.** Read [llms.txt](/llms.txt) once per task. It lists page purposes and package
   versions. Reuse it rather than fetching the entire catalog.
2. **Check installed versions.** Check the consuming app's manifest and lockfile. This site documents the
   current release. If versions differ, inspect installed TypeScript declarations
   and state the mismatch before relying on newer APIs.
3. **Read only what you need.** Choose only the pages needed for the user's task. Read their UX guidance as
   well as the Default example, API summaries, and relevant additional examples.
4. **Fetch over HTTPS.** Use ordinary HTTPS GET with a web-fetch or HTTP tool. Check HTTP status and
   reject HTML returned where Markdown was expected.
5. **Verify the result.** Validate the implementation with the app's type checks, tests, and browser
   checks. Report what you verified and any unavailable guidance.

## Direct URL mapping

- Human: `/coreai-design-system/components/button/`
- Markdown: `/coreai-design-system/components/button.md`
- Homepage Markdown: `/coreai-design-system/index.md`
- Discovery index: `/coreai-design-system/llms.txt`
- Exact routes and metadata: `/coreai-design-system/llms/index.json`
- Reusable skill: `/coreai-design-system/source/package/SKILL.md`

Keep the deployment prefix. Do not guess routes from export names: groups such
as Accordion contain several component APIs on one page. Follow the published
index. To retrieve an individual example, use its published source download.
The JSON index is useful for exact example paths, dependencies, and API members;
it is not necessary to read every record before starting.

## Prefer the right reference

- [Package setup](./package.md): dependencies and the app-root provider.
- [Theming](../foundations/theming.md), [Colors](../foundations/colors.md), and
  [Typography](../foundations/typography.md): shared visual decisions.
- [Variations from Fluent](./variations-from-fluent.md): CoreAI-specific changes.
- [CSS Modules](./styling-with-css-modules.md): style override boundaries.

CoreAI guidance takes precedence over upstream API demonstrations. Never invent
props, defaults, or exports. API blocks are readable summaries; the installed
exported types are authoritative.

## Components and templates

Import components, styling APIs, and tokens from `@coreai-ds/react-components`.
Icons can come from `@fluentui/react-icons`. Inspect repository adapters and
import rules before adding a new composition.

Templates are not npm exports. Download every source file listed on the chosen
template page, review it, and copy it into the consuming repository before adapting
it. Install the listed dependencies. Keep keyboard behavior, accessible names,
focus visibility, responsive layouts, and both themes.

## Optional skill

The [reusable skill](./package-skill.md) stores this retrieval workflow in a
consuming repository. It is optional, not a prerequisite for HTTP reading.
Never install or overwrite instructions without the user's approval.

## When a page is unavailable

State the URL and error. Use the installed package README, TypeScript
declarations, and changelog as explicit fallbacks. Do not claim a failed request
succeeded or silently substitute stock Fluent behavior.
