---
id: theming
title: Theming
summary: 'Apply CoreAI themes, fonts, defaults, and custom brand colors.'
resources: []
reference:
  legacyIds: [docs-theming--docs]
  route: foundations/Theming
  aliases:
    - /theming/
  migratedFrom:
    - apps/storybook/src/stories/docs/Theming.mdx
---

`CoreAIFluentProvider` is the entry point to the CoreAI Design System. It wraps
Fluent UI's `FluentProvider`, applies the CoreAI theme (brand ramp, light/dark
token overrides, Aptos typography), and pre-wires the per-component style hooks
and default props. Drop it in place of `FluentProvider` and your whole app
picks up the CoreAI look — without touching any of your `<Button>`, `<Input>`,
`<Card>`, … call sites.

---

## Basic usage

Wrap your app once, near the root, and pass a CoreAI theme. Swap between
`coreaiLightTheme` and `coreaiDarkTheme` on whatever signal your app uses (a
toggle, the OS `prefers-color-scheme`, a route, …):

```tsx
import {
  CoreAIFluentProvider,
  coreaiLightTheme,
  coreaiDarkTheme,
  Button,
} from '@coreai-ds/react-components';
// Optional: register locally installed Aptos / Aptos Mono (no font downloads).
import '@coreai-ds/react-components/fonts/fonts.css';

export function App() {
  return (
    <CoreAIFluentProvider theme={isDark ? coreaiDarkTheme : coreaiLightTheme}>
      <Button>OK</Button> {/* shape="circular" — CoreAI default */}
    </CoreAIFluentProvider>
  );
}
```

<!-- example: components-coreaifluentprovider--default-theme -->

- **Import from `@coreai-ds/react-components`**, not `@fluentui/react-components`.
  The barrel re-exports every Fluent name; CoreAI-customized components shadow
  the stock ones, everything else passes through unchanged.
- `theme` defaults to `coreaiLightTheme`. Inside the tree,
  `useFluentThemeMode()` returns `'light' | 'dark'` so your own components can
  branch on the active mode.
- The theme prefers **Aptos** for proportional and numeric text, then **Inter**,
  then system fonts. Monospace text prefers **Aptos Mono** before system monospace
  fonts. The optional `@coreai-ds/react-components/fonts/fonts.css` import registers
  **installed Aptos fonts only**. No font binaries ship in the repository or npm
  package.

To load the supported Inter fallback faces from Google Fonts, request normal and
italic styles at weights 400, 600, and 700:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
```

**Only Microsoft-hosted projects may host Aptos font files. If your project is
not Microsoft-hosted, do not publish or serve Aptos; use the Inter fallback
above instead.**

### Set up Aptos

Download from the [official Microsoft Aptos page](https://www.microsoft.com/en-us/download/details.aspx?id=106087)
and read the license supplied with your download. Install the fonts on your device,
then restart your browser. Office cloud-font availability does not necessarily mean
the fonts are installed for other applications.

For repository development, extract the official download yourself (if it is an
archive), then stage the font files with this explicit command from the repo root:

```sh
node scripts/setup-fonts.mjs --source "<extracted-font-directory>" --accept-license
```

Install the staged `.local-fonts/aptos/*.ttf` files using your operating system's
font installer. This ignored directory is never served by Storybook or the docsite
and is never copied into builds.

**A free download is not a redistribution or web-hosting license.** The previously
supplied Microsoft terms explicitly withheld distribution rights. Review the terms
that accompany your own source and obtain appropriate rights before serving fonts
to other people; neither the package license nor the setup script grants them.

For a Microsoft-hosted project that independently holds appropriate web-hosting
rights, you can generate a project-owned asset directory and URL-based stylesheet:

```sh
node scripts/setup-fonts.mjs --source "<licensed-font-directory>" --accept-license --output "<consumer-project>/public/fonts/aptos" --allow-web-hosting
```

Load that directory's `fonts.css` in your application, adjusting its public URL to
your deployment base path. Keep those assets out of GitHub and npm and follow your
license's deployment restrictions. This explicit mode is not used by this
repository's builds.

---

## Props

`CoreAIFluentProvider` accepts everything `FluentProvider` does, plus:

| Prop                        | Type                                               | Default            | Description                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`                     | `Theme`                                            | `coreaiLightTheme` | The theme tokens to apply. Use a CoreAI theme or one built from the factories below.                                                                                                |
| `withComponentDefaults`     | `boolean`                                          | `true`             | When `true`, wrapped components apply CoreAI's default props. Set `false` to keep CoreAI colors/tokens but use stock Fluent prop defaults — e.g. when nesting a non-CoreAI subtree. |
| `customStyleHooks_unstable` | `FluentProviderProps["customStyleHooks_unstable"]` | CoreAI hooks       | Merged on top of CoreAI's hooks, so you can override or extend per call site.                                                                                                       |

All other `FluentProviderProps` (`className`, `style`, `dir`, `targetDocument`,
…) are forwarded to the underlying `FluentProvider`.

---

## Azure theme

`azureLightTheme` and `azureDarkTheme` are pre-built themes that apply the
Azure/Coherence brand ramp while sharing CoreAI's neutral palette, Aptos fonts,
and interactive background tokens. Use them to match the visual language of the
Azure portal and Coherence design system without authoring a custom ramp.

```tsx
import { CoreAIFluentProvider, azureLightTheme, azureDarkTheme } from '@coreai-ds/react-components';
import '@coreai-ds/react-components/fonts/fonts.css';

export function App() {
  return (
    <CoreAIFluentProvider theme={isDark ? azureDarkTheme : azureLightTheme}>
      {/* your app */}
    </CoreAIFluentProvider>
  );
}
```

<!-- example: components-coreaifluentprovider--azure-brand-theme -->

---

## Custom brand themes

To re-brand the design system, build a theme from a custom 16-stop brand ramp
with `createCoreAILightTheme` / `createCoreAIDarkTheme`. These factories layer
CoreAI's neutral-stroke, interactive-token, and font overrides on top of
Fluent's generated tokens, so only the brand color changes. Use **Show code**
below for the full, runnable source (including the dark-mode foreground
adjustment):

> **Tip:** Generate a 16-stop `BrandVariants` ramp from a single key color with
> Fluent's [Theme Designer](https://storybooks.fluentui.dev/react/?path=/docs/theme-theme-designer--docs).
> Paste the output straight into `createCoreAILightTheme` / `createCoreAIDarkTheme`.

<!-- example: components-coreaifluentprovider--custom-brand-theme -->
