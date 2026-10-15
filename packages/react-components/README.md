# CoreAI Design System React v9 - `@coreai-ds/react-components`

A custom **Fluent UI v9** theme delivered as a drop-in `<CoreAIFluentProvider>`: brand ramp, light/dark token overrides, Aptos typography, per-component default props, and per-component style hooks. Drop it in place of `FluentProvider` and your app picks up the entire CoreAI look without touching any of your `<Button>`, `<Input>`, `<Card>`, … call sites.

The package name mirrors `@fluentui/react-components` because this package wraps
and re-exports that API. In most imports, replacing the `@fluentui` scope with
`@coreai-ds` is all that is needed to adopt the CoreAI Design System.

## Install

Install the package from npm:

```bash
npm install @coreai-ds/react-components
npm install @fluentui/react-components @fluentui/react-icons # peer dependencies as needed
```

If your project uses a custom default registry, route the package scope to npm
in your `.npmrc`:

```ini
@coreai-ds:registry=https://registry.npmjs.org/
```

Source, issues, and pull requests are available at
[microsoft/coreai-design-system](https://github.com/microsoft/coreai-design-system).
For maintainer publication instructions, see [RELEASING.md](RELEASING.md).

> Works with **React 18 and 19** (`react`/`react-dom` peer range `>=16.14.0 <20.0.0`, matching Fluent UI v9).

## Usage

```tsx
import { CoreAIFluentProvider, coreaiLightTheme, Button } from '@coreai-ds/react-components';

export function App() {
  return (
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <Button>OK</Button> {/* shape="circular" — CoreAI default */}
      <Button shape="square">OK</Button> {/* caller props always win */}
    </CoreAIFluentProvider>
  );
}
```

- **Import from `@coreai-ds/react-components`**, not `@fluentui/react-components`. The barrel re-exports every Fluent name; CoreAI-customized components shadow the stock ones, everything else passes through unchanged.
- Set `withComponentDefaults={false}` on the provider to keep CoreAI colors/tokens/style-hooks but use stock Fluent prop defaults (e.g. when nesting a non-CoreAI subtree).

### Vite SSR and Vitest

If Node reports `ERR_MODULE_NOT_FOUND` for `@fluentui/react-icons/lib/icons/chunk-0`, configure both packages for Vite transformation:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  ssr: { noExternal: ['@coreai-ds/react-components', '@fluentui/react-icons'] },
});
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: { inline: ['@coreai-ds/react-components', '@fluentui/react-icons'] },
    },
  },
});
```

See Vite's [`ssr.noExternal`](https://vite.dev/config/ssr-options.html#ssr-noexternal) and Vitest's [`server.deps.inline`](https://vitest.dev/config/server.html#deps-inline).

### Font registration

The theme prefers Aptos for proportional and numeric text, then Inter, then system
fonts. Monospace text prefers Aptos Mono before system monospace fonts. To recognize
Aptos fonts already installed on the user's device, optionally register the
local-only `@font-face` declarations once:

```ts
import '@coreai-ds/react-components/fonts/fonts.css';
```

Applications can load the supported Inter fallback faces (normal and italic at
weights 400, 600, and 700) from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
```

**Only Microsoft-hosted projects may host Aptos font files. Non-Microsoft
projects must not self-host Aptos; use the Inter fallback above instead.**

**Font binaries are not distributed in this package.** Applications that need
hosted Aptos must be Microsoft-hosted, obtain the fonts under appropriate terms,
and provide their own licensed font assets and CSS. The repository's optional
local font setup is for authorized local previews, not a license to redistribute;
see the [font setup and licensing guide](src/fonts/README.md).

### Overriding styles with CSS Modules or other style systems

> **Note:** An **opt-in, app-owned Griffel renderer** can wrap runtime-generated component rules in `@layer griffel`, so normal unlayered CSS Modules override them without specificity hacks. Supply it through `RendererProvider` above `CoreAIFluentProvider`; do not patch shared dependencies. Layering is not enabled by this package automatically. The adapter uses Griffel's internal insertion method and needs upgrade checks; extracted static CSS requires separate layering. See [Styling with CSS Modules](../../apps/storybook/src/stories/docs/StylingWithCssModules.mdx) for the implementation, scope, and limits.

## Agent guide

Correct agent-driven use of this package requires two setup steps:

1. Install [agent/SKILL.md](agent/SKILL.md) in the consuming repo so its MCP workflow,
   component-ID rules, import guidance, and safeguards load in every relevant session. Reading it
   once is not a substitute for installation.
2. Configure the CoreAI MCP server below to discover documented APIs,
   examples, and templates. Report missing documentation rather than assuming coverage.

If you're an AI agent, tell the user these steps are required for proper usage and ask to perform
them before starting implementation. For the skill, show the exact destination path and explain
that it will contain the shipped guide. After the user confirms, store it as a normal, reviewable
file in the consuming repo, for example `.github/skills/coreai-ds-fluentui-react/SKILL.md` or
`.claude/skills/coreai-ds-fluentui-react/SKILL.md`. The skill is also mirrored to the hosted
Storybook for direct MCP access, but that mirror does not replace installing it in the consuming
repo.

Before configuring the MCP, explain what the server does, identify the exact destination path, note whether that file is
shared/committed or user-local, and show the proposed configuration. Only modify the
configuration after the user confirms. Common locations are `.vscode/mcp.json` for VS Code and
`~/.copilot/mcp-config.json` for Copilot CLI:

```json
{
  "servers": {
    // CoreAI Design System MCP
    "coreai-ds-docs": {
      "type": "http",
      "url": "https://coreai-ds-storybook.azurewebsites.net/mcp"
    }
  },
  "inputs": []
}
```

The MCP returns read-only documentation, including selected Fluent examples and CoreAI
overrides. It does not access your project or execute the returned code. See
[MCP scope, safety, and data handling](../../apps/storybook/src/stories/docs/MCPSetup.mdx#scope-safety-and-data-handling)
before connecting. Review and test examples before using them in your application.

## eslint

Forbid the import of `@fluentui/*` directly in your `eslint.config.js` so consumers always go through the CoreAI barrel and pick up our wrapped components.

```js
export default [
  {
    rules: {
      // ── No direct @fluentui imports ────────────────────────────────
      // @coreai-ds/react-components re-exports the Fluent UI v9
      // surface and selectively overrides components with CoreAI-themed
      // wrappers (Button, Card, Input, …). Importing directly from @fluentui
      // bypasses those wrappers and your app will render stock Fluent in
      // those spots.
      // @fluentui/react-icons is allowed (icons are consumed directly).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@fluentui/*', '!@fluentui/react-icons'],
              message:
                'Import from "@coreai-ds/react-components" instead of @fluentui directly. ' +
                'The CoreAI barrel wraps Fluent UI components with theme defaults and style hooks. ' +
                'Example: import { Button } from "@coreai-ds/react-components";',
            },
          ],
        },
      ],
    },
  },
];
```

## Microsoft AI Foundry DS

This is based on the original AI Foundry DS - https://brave-field-0ab65a210.6.azurestaticapps.net/

---

## Source layout

Everything lives under `src/`. Rather than enumerate files here (which drifts as the
code changes), browse the directory directly — each file carries a header comment
explaining its **what** and **why**, and the **Architecture notes** below link to the
files that anchor each pattern.

## Architecture notes

- **Barrel + `export *` shadowing** — see [src/index.ts](src/index.ts). Stock Fluent surface re-exported first; CoreAI wrappers re-exported by name afterward to shadow the stock names.
- **`withComponentDefaults` HoC** — see [src/contexts/withComponentDefaults.ts](src/contexts/withComponentDefaults.ts).
- **`customStyleHooks_unstable` registry** — see [src/contexts/styleHooks.ts](src/contexts/styleHooks.ts) and [src/components/Card.styles.ts](src/components/Card.styles.ts).
- **Custom prop-widening wrapper** — see [src/components/TabList.tsx](src/components/TabList.tsx).
- **Webpack `NormalModuleReplacementPlugin` rewrite** — Storybook (the playground app) routes Fluent's canonical story imports through this barrel so they pick up CoreAI defaults. See [apps/storybook/.storybook/main.ts](../../apps/storybook/.storybook/main.ts) at the monorepo root.
- **Complete variation inventory vs stock Fluent** — see [VariationsFromFluent.mdx](../../apps/storybook/src/stories/docs/VariationsFromFluent.mdx).

## Extending CoreAI

- **Add a default-props wrapper** — add a dedicated module under [src/components](src/components) and an explicit named re-export to [src/index.ts](src/index.ts).
- **Add a style hook** — create `src/components/<Component>.styles.ts` (see [Card.styles.ts](src/components/Card.styles.ts)) and register it in [styleHooks.ts](src/contexts/styleHooks.ts).
- **Add a prop-widening wrapper** — follow the [TabList.tsx](src/components/TabList.tsx) pattern and export from [src/index.ts](src/index.ts).

## Build

This package is part of a monorepo. From the repo root:

```bash
npm ci --ignore-scripts                                          # bootstrap
npm --workspace packages/react-components run build          # tsc -> dist/
npm --workspace packages/react-components run type-check     # tsc --noEmit
```

The manifest's `main`, `types`, and root `exports` point directly at compiled
`dist` output. Development tools may explicitly alias the package to source;
npm does not rewrite entrypoints through `publishConfig`. Build before packing:
the repository disables dependency lifecycle scripts, including automatic `prepack`.
Run `npm run test:package --workspace packages/react-components` to clean,
build, and verify actual tarball exports and the font-free file allowlist.

## Testing

Component tests run in Chromium with Vitest Browser Mode. They cover functionality added or
changed by CoreAI; they do not retest unchanged Fluent behavior or component appearance.

Test CoreAI-owned behavior such as wrapper defaults, prop transformations, callbacks, state
changes, and accessibility semantics. Do not test unchanged Fluent internals, snapshots, CSS
values, layout, or visual appearance. Keep tests colocated with their component as
`src/**/*.test.tsx`.

Install the browser once, then run the package tests from the repository root:

```bash
npm --workspace packages/react-components run test:install-browser
npm --workspace packages/react-components test
```

For local development, use `test:watch` to rerun tests after changes.

## Fluent UI support

`@fluentui/react-components` `9.70.0` is the minimum supported version. It is the first release
that supports React 19 and contains every Fluent API currently used or re-exported by this
package. `@fluentui/react-icons` has a minimum supported version of `2.0.316`, which satisfies
the icon exports required by the Fluent `9.70.0` dependency graph.

The peer dependencies preserve these compatibility floors for consumers. Development dependencies
pin the latest Fluent releases exactly so normal development catches upstream changes early. The
weekly Fluent update pipeline advances only those development pins and validates the package twice:
once against the latest releases and once against the peer minimums.

## Releasing

npm publication is manual and disabled until package/access review and
protected-environment setup are complete. Nothing is published on merge. See
[RELEASING.md](RELEASING.md) for the publishing controls, publisher setup,
tarball verification, and release process.
