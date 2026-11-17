---
id: migration
title: Migrate from Azure Artifacts
summary: Move from the retired private package to the public CoreAI npm package.
resources: []
reference:
  renderer: guide-accordions
---

The CoreAI Design System now lives at
[microsoft/coreai-design-system](https://github.com/microsoft/coreai-design-system).
Install [`@coreai-ds/react-components`](https://www.npmjs.com/package/@coreai-ds/react-components)
from the public npm registry. The former GitHub and Azure DevOps repositories are
retired; they are not sources for new releases or new issues.

The old `@coreai/fluentui-react` package in Azure Artifacts receives no further
updates. Deprecation adds a warning, not a redirect: existing versions remain
installable with feed access, and consumers must migrate explicitly. No empty
replacement or tombstone version is published.

## 1. Update registry configuration

Remove the `@coreai:registry` mapping to the former Azure Artifacts feed from
your project's `.npmrc` if no other `@coreai` packages need it.

If your default registry is not public npm, add:

```ini
@coreai-ds:registry=https://registry.npmjs.org/
```

The public package needs no Azure Artifacts access, credential provider, or npm
login. Remove feed-specific `always-auth`, credential-provider scripts, and CI
authentication steps only if no other dependency uses them. Remove obsolete feed
credentials from user or CI configuration without copying them into source control.
Do not delete credentials or registry settings needed by unrelated packages.

## 2. Replace the dependency

In the consuming application, run:

```bash
npm uninstall @coreai/fluentui-react
npm install @coreai-ds/react-components --registry=https://registry.npmjs.org/
```

For an npm workspace, add `--workspace <your-workspace>` to both commands.
Commit the updated manifest and lockfile. Do not edit the lockfile by hand.
Keep the Fluent and React peer dependencies listed in the [package guide](./Package.md).

## 3. Update imports and tooling

Replace `@coreai/fluentui-react` with `@coreai-ds/react-components` in source
imports, font CSS imports, test mocks, bundler settings, lint rules, and local
agent instructions.

```tsx
import { Button, CoreAIFluentProvider, coreaiLightTheme } from '@coreai-ds/react-components';
import '@coreai-ds/react-components/fonts/fonts.css';
```

Keep your provider configuration. The rename alone does not require replacing
`CoreAIFluentProvider` or changing component props.

## 4. Review breaking changes

Version 0.12.0 is the first public release. Review its
[changelog](https://github.com/microsoft/coreai-design-system/blob/main/packages/react-components/CHANGELOG.md#0120---2026-10-16)
and every intervening release if you upgrade from an older private version.

- Aptos and Aptos Mono font binaries are no longer distributed. Remove deep
  `.ttf` imports. The renamed `fonts/fonts.css` entry registers locally installed
  fonts only; it does not download them.
- Use Inter as the proportional fallback, or provide separately licensed Aptos
  assets only for Microsoft-hosted projects. Non-Microsoft projects must not host
  Aptos files. See [font setup](../foundations/Theming.md#set-up-aptos).
- For custom CSS integration, use the app-owned renderer in
  [Styling with CSS Modules](./StylingWithCssModules.md), rather than applying the
  old shared Griffel patch.

## 5. Verify and update documentation

Run your application's build, type-check, tests, and CI install. Check both themes,
fonts, and any custom component styles. Confirm the old package is absent:

```bash
npm ls @coreai/fluentui-react --all
npm ls @coreai-ds/react-components
```

The first command should report an empty tree; npm may return a nonzero exit code
when no match is installed. If the old package remains transitively, update the
dependency that brings it in before removing its feed authentication.

Replace old repository, hosted Storybook, and authenticated MCP links with the
[public documentation](https://microsoft.github.io/coreai-design-system/).
Update agent setup using [Build with your agent](./UseWithAgents.md).
File new issues in the
[current issue tracker](https://github.com/microsoft/coreai-design-system/issues).
Historical issues remain in the former tracker; they are not transferred by this
package migration.
