---
id: agent-workflow
title: Agent workflow
summary: Find the right CoreAI Markdown page, retrieve only what you need, and verify the result.
resources: []
navigation:
  showInSidebar: false
reference:
  renderer: agent-workflow
---

## Start here

Base URL: https://microsoft.github.io/coreai-design-system/

1. **Refresh the skill.** Read [version.json](/version.json) once per task. Install the
   [current skill](/source/package/SKILL.md) if missing, or update older
   `metadata.version` guidance before UI work. Preserve local rules, do not
   downgrade newer local guidance, and ask before resolving conflicts. Follow the
   updated skill in this task.
2. **Check installed versions.** Check the consuming app's manifest and lockfile. This site documents the
   `packageVersion` from the version manifest, independently of the docs/skill
   version. If versions differ, inspect installed TypeScript declarations
   and state the mismatch before relying on newer APIs.
3. **Read only what you need.** Fetch [llms.txt](/llms.txt) once, then choose only the
   pages needed for the user's task. Read their UX guidance as
   well as the Default example, API summaries, and relevant additional examples.
4. **Fetch over HTTPS.** Use ordinary HTTPS GET with a web-fetch or HTTP tool. Check HTTP status and
   reject HTML returned where Markdown was expected.
5. **Verify the result.** Validate the implementation with the app's type checks, tests, and browser
   checks. Report what you verified and any unavailable guidance.

## Direct URL mapping

- Human: `/coreai-design-system/components/Button/`
- Markdown: `/coreai-design-system/components/Button.md`
- Homepage Markdown: `/coreai-design-system/index.md`
- Discovery index: `/coreai-design-system/llms.txt`
- Current docs/skill and package versions: `/coreai-design-system/version.json`
- Exact routes and metadata: `/coreai-design-system/llms/index.json`
- Reusable skill: `/coreai-design-system/source/package/SKILL.md`

Keep the deployment prefix. Do not guess routes from export names: groups such
as Accordion contain several component APIs on one page. Follow the published
index. To retrieve an individual example, use its published source download.
The JSON index is useful for exact example paths, dependencies, and API members;
it is not necessary to read every record before starting.

## Prefer the right reference

- [Package setup](./Package.md): dependencies and the app-root provider.
- [Theming](../foundations/Theming.md), [Colors](../foundations/Colors.md), and
  [Typography](../foundations/Typography.md): shared visual decisions.
- [Variations from Fluent](./VariationsFromFluent.md): CoreAI-specific changes.
- [CSS Modules](./StylingWithCssModules.md): style override boundaries.

CoreAI guidance takes precedence over upstream API demonstrations. Never invent
props, defaults, or exports. API blocks are readable summaries; the installed
exported types are authoritative.

## Components and templates

Follow repository adapters, import restrictions, and lint rules first. Otherwise
import components, styling APIs, and tokens from `@coreai-ds/react-components`.
Icons can come from `@fluentui/react-icons`. If a local instruction still requires the legacy
documentation MCP, report the conflict and ask before changing it. Do not
silently bypass repository instructions.

Reading these docs does not replace normal app dependency setup. Follow the
repository's package manager, lockfile, and approval rules.

Templates are not npm exports. Download every source file listed on the chosen
template page, review it, and copy it into the consuming repository before adapting
it. Install the listed dependencies. Keep keyboard behavior, accessible names,
focus visibility, responsive layouts, and both themes.

## Skill installation and updates

The [reusable skill](./PackageSkill.md) stores this retrieval workflow in a
consuming repository. Install or refresh it before implementing, not on every
page fetch. Its docs/skill version can change without a new component package.
Only current documentation is hosted; existing package releases are not rewritten.

The starter prompt authorizes skill installation/update. Otherwise obtain approval
before writing instructions. Review downloaded changes and preserve
repository-specific guidance. Report retrieval, version, or write failures and
ask how to proceed rather than claiming successful setup.

## When a page is unavailable

State the URL and error. Use the installed package README, TypeScript
declarations, and changelog as explicit fallbacks. Do not claim a failed request
succeeded or silently substitute stock Fluent behavior.
