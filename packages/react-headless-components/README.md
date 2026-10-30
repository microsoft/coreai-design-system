# Experimental headless Button

Private Button-only pilot. The production `@coreai-ds/react-components` package is unchanged.

The implementation calls Fluent's public `useButton` hook, styles the resolved root and icon
slots, and calls `renderButton`. It does not call Fluent's Griffel styling hook.

## Run

From the repository root:

```sh
npm install
npm --workspace packages/react-headless-components test
npm --workspace packages/react-headless-components run build
npm run storybook
```

Open **Experiments / Headless Button / Comparison**. The toolbar's theme and light/dark settings
apply to both columns. Both implementations receive the same fixtures. **Compare resting styles**
reports selected root/icon computed properties and dimensions, including bundled-icon visibility.
The Consumer Overrides story also shows the intentional change to ordinary CSS override priority.

The experiments appear in local development only. Normal Storybook builds exclude them to
preserve the production catalog. To build an experimental static preview in PowerShell:

```powershell
$env:COREAI_HEADLESS_BUTTON = '1'
npm --workspace apps/storybook run build
Remove-Item Env:\COREAI_HEADLESS_BUTTON
```

Do not publish that experimental build or run the normal `verify:build` against it; the production
verifier deliberately rejects experiment entries.

Storybook and tests resolve the experimental package to source. Built-package consumers must
load the emitted CSS once:

```tsx
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Button } from '@coreai-ds/react-headless-components';
import '@coreai-ds/react-headless-components/styles.css';

<CoreAIFluentProvider>
  <Button appearance="primary">Save</Button>
</CoreAIFluentProvider>;
```

The existing provider supplies theme variables, inherited typography, and the component-default
context. This temporary bridge still depends on the old package and its provider; this pilot is
not a claim that the whole application bundle is Griffel-free.

## Style source and ownership

- Baseline: CoreAI main commit `9e7876c`, with `@fluentui/react-button@9.11.1`.
  The exact dev dependency preserves the legacy Button reference during this experiment.
- Fluent source: [`useButtonStyles.styles.ts` in react-button 9.11.1](https://unpkg.com/@fluentui/react-button@9.11.1/lib/components/Button/useButtonStyles.styles.raw.js).
  The port is in `src/Button.module.css`; Microsoft copyright and MIT license notices are retained.
  The repository's [MIT code license](../../LICENSE-CODE) applies.
- CoreAI source: [Button defaults](../react-components/src/components/Button.ts) and
  [minimum-width override](../react-components/src/components/Button.styles.ts).
  Visual overrides live in `src/Button.overrides.module.css`; prop defaults remain in the component.
- Normal cascade order: `coreai-fluent` layer, then `coreai-overrides`, then unlayered consumer CSS.
  Class-name concatenation does not establish priority.
- CSS Modules use `.Button` and `.Button__icon`, with native nesting and ordinary state selectors.
  Enabled interaction styles exclude disabled and disabled-focusable buttons rather than relying
  on `:where()` to flatten specificity.
- Every component-owned slot also receives a stable, unstyled global marker: `fui-Button` on
  the root and `fui-Button__icon` on the icon slot. Exported `buttonClassNames` exposes these names
  for consumers; internal styling uses the scoped module classes instead.
- Visual props extend the headless data-attribute pattern with `data-appearance`, `data-size`,
  and `data-shape`. Resolved content/icon presence uses `data-has-content` and `data-has-icon`;
  headless still supplies its disabled, icon-only, and icon-position attributes.
- Existing Fluent bundled icons ship unlayered visibility rules. A narrow, unlayered descendant
  adapter preserves their regular/filled hover behavior without adding a Griffel runtime import.
  Other Button styles stay layered.

The recreated visual props are `appearance` (including `transparent`), `size`, and `shape`.
Defaults are secondary/medium/circular with CoreAI defaults enabled. Disabling component defaults
restores rounded shape and Fluent's size-dependent minimum widths. Icon-only widths are unchanged.
Size inherits the headless Button context; mixed old/new component-family contexts are not bridged.
Arbitrary `customStyleHooks_unstable` overrides from the legacy provider are not invoked by this
new styling pipeline; use CSS classes, slots, or inline styles for the experimental Button.

## Modern browser behavior

Focus styles use native `:focus-visible`, not the legacy focus-visible attribute/polyfill.
Icon spacing uses logical properties for RTL. Forced-colors, reduced-motion, and the original
Firefox focus-stroke adjustment are included in the CSS port.

Button needs no overlay or focusgroup polyfill. Future components must follow the headless
[browser-support](https://storybooks.fluentui.dev/headless/llms/overview-browser-support.txt) and
[polyfill](https://storybooks.fluentui.dev/headless/llms/overview-polyfills-fallbacks.txt) contracts.
In particular, native dialog/popover/anchor positioning replace parts of the old overlay pipeline,
but arrow-key `focusgroup` navigation still requires a consumer-supplied polyfill today.

## Practical parity coverage

The focused Vitest Browser Mode suite uses Playwright Chromium and the same fixtures as Storybook.
It compares a bounded list of computed properties, dimensions, and icon visibility across light
and dark modes, appearances, sizes, shapes, icons, disabled states, anchors, hover, keyboard focus,
and keyboard press. It also checks defaults opt-out, RTL spacing, consumer CSS priority, context
sizing, refs, slot preservation, stable global slot markers, data-state attributes, and disabled
activation. Disabled hover and combined keyboard-focus/hover cases protect interaction priority
without zero-specificity selectors.

The Consumer Overrides fixture deliberately differs: ordinary CSS sets the headless minimum width
to `120px`, radius to `3px`, and icon size to `16px`. Legacy Griffel rules can retain `40px`,
circular radius, and `20px` icons. The test asserts the new consumer-override contract rather than
requiring those differences to disappear.

This is not exhaustive. Gaps include automated screenshot/pixel comparison, Firefox/Safari,
forced-colors and reduced-motion emulation, transition frames, pointer-down combinations,
every theme/custom-token combination, and mixed legacy/headless compound components.
The interactive Storybook report compares resting styles only, and the icon checks target the
shared fixtures' `parity-icon` slot rather than trying to inspect arbitrary children.
The tests do not load the hosted Aptos fonts. The local static-preview check also encountered font
CORS errors and used fallback fonts in both columns, so Aptos-specific geometry is not verified.

## License

The Fluent-derived styling and this package are available under the MIT license:

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
