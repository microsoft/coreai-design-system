---
id: home
title: CoreAI Design System
summary: The guide for building CoreAI experiences on the web
resources:
  - label: Figma
    url: https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-DS?node-id=0-1
  - label: npm
    url: https://www.npmjs.com/package/@coreai-ds/react-components
reference:
  renderer: home
  route: index
  label: Home
  legacyIds: [introduction--docs]
  migratedFrom:
    - apps/docsite/src/pages/Introduction.tsx
    - apps/storybook/src/stories/docs/Introduction.mdx
---

Help designers code and help engineers design.

CoreAI builds on Fluent UI v9 with shared themes, component defaults, extensions,
copy-and-adapt templates, and UX guidance.

## Get started

- [Set up the package](./guides/Package.md).
- [Working with agents](./overview/Introduction.md#working-with-agents): use a starter prompt to install or update the repository skill.

## Give your agent CoreAI guidance

Share the [starter prompt](/agent-prompt.txt) with your coding agent. It checks
[current versions](/version.json) and installs or updates the
[repository skill](/source/package/SKILL.md) before UI work. Agents then read
relevant guidance, APIs, and examples through [llms.txt](/llms.txt) over ordinary
HTTPS.

- [Open the Figma library](https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-DS?node-id=0-1).

## Foundations and patterns

- [Colors](./foundations/Colors.md)
- [Typography](./foundations/Typography.md)
- [Content](./foundations/Content.md)
- [Surfaces](./foundations/Surfaces.md)
- [Spacing](./foundations/Spacing.md)
- [Layout](./foundations/Layout.md)
- [Theming](./foundations/Theming.md)
- [Forms and validation](./components/Field.md#forms)

## Component and template catalog

<!-- generated: catalog -->

## Help and feedback

- [Resources](./overview/Introduction.md#resources)
- [FAQ](./overview/Faq.md)
- [Release history](./overview/Changelog.md)
- [GitHub issues](https://github.com/microsoft/coreai-design-system/issues)
