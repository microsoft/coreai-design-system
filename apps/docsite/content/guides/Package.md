---
id: package
title: NPM package
summary: Install the package, configure the provider, and find implementation guidance.
resources: []
reference:
  renderer: package
  aliases: [/package/, /guidance/]
  migratedFrom:
    - apps/docsite/src/pages/Package.tsx
    - packages/react-components/README.md
---

## Let your agent handle setup

Give your agent the [package README](https://github.com/microsoft/coreai-design-system/blob/main/packages/react-components/README.md)
and ask it to install the package, configure `CoreAIFluentProvider`, and verify the result.

The provider belongs once at the app root. Import components from
`@coreai-ds/react-components`, not directly from Fluent's component barrel.
Icons can still come from `@fluentui/react-icons`.

## Fonts

Aptos is preferred, but font binaries are not included in this repository or the
npm package. The optional package font stylesheet registers locally installed
fonts; it does not download them. Review the [font setup and licensing guidance](../foundations/Theming.md#set-up-aptos).
Do not commit downloaded fonts. Non-Microsoft-hosted projects must use Inter
rather than publishing Aptos files.

## Full package reference

The following content is included from the package README during the build,
not copied into a second maintained guide. Start with the
[agent workflow](./AgentWorkflow.md) for targeted Markdown documentation lookup.

<!-- include: package-readme -->
