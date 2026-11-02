# Experimental headless components

Private component migration pilot. Converted components are listed in the
[public exports](./src/index.ts). The production `@coreai-ds/react-components` package is unchanged.

Each implementation calls Fluent's public component hook, styles the resolved slots, and calls
the public render function. It does not call Fluent's Griffel styling hook.

## Run

From the repository root:

```sh
npm install
npm --workspace packages/react-headless-components test
npm --workspace packages/react-headless-components run build
npm run storybook
```

Open **Experiments / Headless &lt;Component&gt; / Comparison** for a converted component. The
toolbar's theme and light/dark settings apply to both columns. Both implementations receive the
same fixtures. Comparison stories report selected slot computed properties and dimensions at rest.
Consumer Overrides stories also show the intentional change to ordinary CSS override priority.

The experiments appear in local development only. Normal Storybook builds exclude them to
preserve the production catalog. To build an experimental static preview in PowerShell:

```powershell
$env:COREAI_HEADLESS_BUTTON = '1'
npm --workspace apps/storybook run build
Remove-Item Env:\COREAI_HEADLESS_BUTTON
```

Do not publish that experimental build or run the normal `verify:build` against it; the production
verifier deliberately rejects experiment entries. The original `COREAI_HEADLESS_BUTTON` flag
enables the whole experiments directory, not just Button.

Storybook and tests resolve the experimental package to source. Built-package consumers must
load the emitted CSS once:

```tsx
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Button, Input, Textarea } from '@coreai-ds/react-headless-components';
import '@coreai-ds/react-headless-components/styles.css';

<CoreAIFluentProvider>
  <Button appearance="primary">Save</Button>
  <Input aria-label="Name" placeholder="Name" />
  <Textarea aria-label="Description" placeholder="Description" />
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
- The first parallel batch uses the installed dependency snapshot at commit `51997c2`:
  [Input styles in react-input 9.8.8](https://unpkg.com/@fluentui/react-input@9.8.8/lib/components/Input/useInputStyles.styles.raw.js)
  and [Textarea styles in react-textarea 9.7.8](https://unpkg.com/@fluentui/react-textarea@9.7.8/lib/components/Textarea/useTextareaStyles.styles.raw.js).
  Their base styles live in the corresponding component CSS Modules, separately from CoreAI
  overrides and prop defaults. Headless remains pinned to `0.3.2`.
- The next batch uses
  [Label styles in react-label 9.4.6](https://unpkg.com/@fluentui/react-label@9.4.6/lib/components/Label/useLabelStyles.styles.raw.js)
  and [Image styles in react-image 9.4.6](https://unpkg.com/@fluentui/react-image@9.4.6/lib/components/Image/useImageStyles.styles.raw.js).
  Neither has additional CoreAI style overrides. Label's required and disabled props are visual;
  the associated control owns validation and disabled behavior. Image retains its supported shadow
  prop and native image semantics.
- The form-control batch uses
  [Checkbox styles in react-checkbox 9.6.6](https://unpkg.com/@fluentui/react-checkbox@9.6.6/lib/components/Checkbox/useCheckboxStyles.styles.raw.js)
  and [Switch styles in react-switch 9.7.7](https://unpkg.com/@fluentui/react-switch@9.7.7/lib/components/Switch/useSwitchStyles.styles.raw.js).
  Both reuse the completed Label component rather than duplicating its styling foundation.
- The navigation/loading batch uses the installed snapshot at commit `a89186d`:
  [Link styles in react-link 9.8.6](https://unpkg.com/@fluentui/react-link@9.8.6/lib/components/Link/useLinkStyles.styles.raw.js)
  and [Spinner styles in react-spinner 9.8.7](https://unpkg.com/@fluentui/react-spinner@9.8.7/lib/components/Spinner/useSpinnerStyles.styles.raw.js).
  Spinner reuses the completed Label styling through the current public slot-render contract.
- The progress/separator batch uses the installed snapshot at commit `d1f4f10`:
  [ProgressBar styles in react-progress 9.5.7](https://unpkg.com/@fluentui/react-progress@9.5.7/lib/components/ProgressBar/useProgressBarStyles.styles.raw.js)
  and [Divider styles in react-divider 9.7.6](https://unpkg.com/@fluentui/react-divider@9.7.6/lib/components/Divider/useDividerStyles.styles.raw.js).
  `Divider` retains CoreAI's contentless separator contract; `DividerLabeled` supplies Fluent's
  content-bearing variant through the same public headless hook/render pipeline.
- The native-control batch uses the installed snapshot at commit `8f22e99`:
  [Select styles in react-select 9.5.7](https://unpkg.com/@fluentui/react-select@9.5.7/lib/components/Select/useSelectStyles.styles.raw.js)
  and [Slider styles in react-slider 9.6.8](https://unpkg.com/@fluentui/react-slider@9.6.8/lib/components/Slider/useSliderStyles.styles.raw.js).
- The selection/status batch uses the installed snapshot at commit `5e4e918`:
  [Radio styles in react-radio 9.6.7](https://unpkg.com/@fluentui/react-radio@9.6.7/lib/components/Radio/useRadioStyles.styles.raw.js),
  [RadioGroup styles](https://unpkg.com/@fluentui/react-radio@9.6.7/lib/components/RadioGroup/useRadioGroupStyles.styles.raw.js),
  and the [Badge family baseline in react-badge 9.5.7](https://unpkg.com/@fluentui/react-badge@9.5.7/lib/components/Badge/useBadgeStyles.styles.raw.js).
  CounterBadge shares the Badge foundation; PresenceBadge has its own status-specific styling.
- CoreAI source: [Button defaults](../react-components/src/components/Button.ts) and
  [minimum-width override](../react-components/src/components/Button.styles.ts).
  Visual overrides live in `src/Button.overrides.module.css`; prop defaults remain in the component.
- Normal cascade order: `fluent-components` layer, then `coreai-overrides`, then unlayered consumer CSS.
  Class-name concatenation does not establish priority.
- Fluent-derived CSS uses `--fui-*` component custom properties. CoreAI-specific overrides keep
  CoreAI naming; shared theme tokens and the stable `fui-*` slot markers are unchanged.
- Every ported component CSS Module links from its header to the exact local `node_modules`
  `.styles.raw.js` file used as its Fluent source. Use repository-relative links, not a
  machine-specific absolute path. Override modules identify the Fluent baseline separately from
  the CoreAI source; handwritten comparison-layout CSS is not an upstream port.
- CSS Modules use `.Button` and `.Button__icon`, with native nesting and ordinary state selectors.
  Enabled interaction styles exclude disabled and disabled-focusable buttons rather than relying
  on `:where()` to flatten specificity. New components follow the same component/slot naming
  convention rather than using `.root`.
- Every component-owned slot also receives a stable, unstyled global marker: `fui-Button` on
  the root and `fui-Button__icon` on the icon slot. Exported `buttonClassNames` exposes these names
  for consumers; internal styling uses the scoped module classes instead.
- Visual props extend the headless data-attribute pattern with `data-appearance`, `data-size`,
  and `data-shape`. Resolved content/icon presence uses `data-has-content` and `data-has-icon`;
  headless still supplies its disabled, icon-only, and icon-position attributes.
- Existing Fluent bundled icons ship unlayered visibility rules. A narrow, unlayered descendant
  adapter preserves their regular/filled hover behavior without adding a Griffel runtime import.
  Other Button styles stay layered.
- Switch's default thumb uses the public `@fluentui/react-icons/headless/svg/circle` entry.
  The pinned icon dependency supplies the original CircleFilled glyph without Griffel styling;
  a standalone import check verifies that this entry loads no Griffel modules.
- Checkbox's default indicators use the same package's headless SVG checkmark, square, and circle
  entries. Its label binding uses public `slot.optional` from `@fluentui/react-utilities`.
  Standalone checks verify these glyph and utility imports also load no Griffel modules.
- Link's external-navigation glyph uses the public headless SVG open entry. Its inverted-background
  styling reads the current public `useBackgroundAppearance` hook from
  `@fluentui/react-shared-contexts`. The pinned helper and glyph imports load no Griffel or Tabster
  modules; the existing provider still supplies the background context.
- Select's default expand glyph uses the public headless SVG chevron-down entry. Its isolated
  import likewise loads no Griffel or Tabster modules; the browser owns the native select popup.
- PresenceBadge uses the public headless SVG presence entries for its default status glyphs.
  Each entry is independently verified to load no Griffel or Tabster modules.

For Button, the recreated visual props are `appearance` (including `transparent`), `size`, and `shape`.
Defaults are secondary/medium/circular with CoreAI defaults enabled. Disabling component defaults
restores rounded shape and Fluent's size-dependent minimum widths. Icon-only widths are unchanged.
Size inherits the headless Button context; mixed old/new component-family contexts are not bridged.
Arbitrary `customStyleHooks_unstable` overrides from the legacy provider are not invoked by this
new styling pipeline; use CSS classes, slots, or inline styles for the experimental Button.
Input and Textarea likewise do not invoke legacy custom style hooks or the internal provider
`inputDefaultAppearance` override. Input's automatic copy action still composes the existing
legacy `CopyButton`; converting that component is a separate job.
Input also preserves the legacy `filled-darker` fallback even when component defaults are disabled.
Its automatic copy action uses the supplied `value` or `defaultValue`, not subsequent uncontrolled
edits. These inherited limitations are not corrected as part of the styling migration.
Input and Textarea expose only current appearances. Deprecated shadow appearances, their CSS,
compatibility diagnostics, and comparison fixtures are intentionally excluded from this package.

Image inherits Fluent's native-property filter: `decoding`, `sizes`, and `referrerPolicy` are accepted
by its TypeScript props but are not forwarded to the native image in either implementation.
`loading`, `srcSet`, `crossOrigin`, and width/height are preserved. Tests explicitly compare this
omission with the legacy reference; adding native support is a separate dependency/behavior change,
not part of this styling migration.

Slider leaves range resolution to the current headless hook. Native step snapping can differ from
the hook's visual progress, and a native form reset does not reset hook state. Explicit input-slot
callbacks and refs retain their current precedence. Tests cover these inherited boundaries rather
than adding a second range state model or changing native events.

RadioGroup preserves the installed Field contract: Field supplies group `aria-required` and
`aria-invalid`, but native required radio inputs need an explicit group `required` prop.
CounterBadge preserves current headless content resolution: explicit numeric `children={0}`
remains visible instead of copying the legacy falsy-content hide check.

## Conversion workflow

### API policy

Use current, supported public APIs from the installed headless package. Fluent v9 style sources
are a visual reference, not a template for component behavior or compatibility plumbing.
Do not author new code against deprecated or legacy APIs, including `state.components`,
deprecated `getSlots` helpers, or internal base hooks. Use the public hook/render pipeline and
current slot APIs such as `slot.always`, `slot.optional`, and `assertSlots`.
Components used as custom slots expose the public `ForwardRefComponent` type, matching headless's
current ref contract. Slot element selection belongs in the slot resolver, not `state.components`.
Checkbox and Switch keep the primitive's native label slot contract. The shared `resolveLabelSlot`
helper uses a typed public slot render function to render the styled Label, preserving resolved
props, refs, caller render functions, and required content without changing compatibility registries.
The contentless Divider likewise retains native slot metadata and uses a public render function
for its `hr` root, preserving native refs without triggering the pinned renderer's slot rewrite.

Preserve the current headless slot, ref, and accessibility contracts. Reuse local styling
foundations only through type-safe current APIs; do not use casts to force an incompatible slot
replacement. Public, non-deprecated, style-free utility and glyph helpers are allowed when needed.
Current headless and native-browser behavior takes precedence over reproducing old implementation
quirks. Document intentional visual or behavioral differences instead of recreating obsolete
markup, focus machinery, or compatibility branches to make comparisons pass.

The existing theme/defaults provider bridge is an explicit temporary pilot boundary, not permission
to introduce deprecated APIs or new dependencies on old styled component implementations.

### Worker process

Start with two independent workers in one worktree. Assign one component or tightly coupled
family per worker, with explicit prerequisites and file ownership. Unsupported headless components
remain deferred; do not recreate their behavior as part of a styling conversion.

- The coordinating thread records the reference commit and installed Fluent/headless versions.
  Workers read the legacy CoreAI wrapper, defaults, overrides, and Fluent style-selection logic,
  not just the style objects. The legacy package stays read-only.
- Follow calls to other component style hooks and styled subcomponents. For example, SearchBox
  uses Input's styling foundation. Reuse an existing port where compatible rather than silently
  dropping inherited styles or copying a second divergent foundation. Assign unfinished shared
  dependencies before their consumers.
- Each worker owns its component wrapper, base/override CSS Modules, comparison stories/fixtures,
  and focused browser tests. The coordinator owns public exports, dependencies, lockfiles,
  providers, shared utilities/configuration, shared documentation, and Git operations.
- Workers read the [headless documentation index](https://storybooks.fluentui.dev/headless/llms.txt)
  and relevant component, browser-support, and polyfill pages. The
  [Fluent React documentation index](https://storybooks.fluentui.dev/react/llms.txt) describes the
  component being converted. Online documentation may be newer than the pinned package; installed
  public hooks, render functions, and types determine which APIs are available.
- Different DOM **and modern browser APIs** are expected. Check native focus, form, sizing,
  overlay, and navigation behavior relevant to the assignment before copying legacy selectors or
  supporting code. Do not retain obsolete focus attributes, Tabster assumptions, or overlay
  machinery merely to match the old implementation.
- Convert directly into the final CSS Modules using the Button conventions. Keep source/version
  attribution, license notices, and source comments alongside the translated rules. Adapt comments
  only when their syntax or behavior changes; omit comments belonging to removed deprecated branches.
  Use the `fluent-components` layer and `--fui-*` custom properties for Fluent-derived styles;
  keep CoreAI-specific overrides in `coreai-overrides` with CoreAI naming.
  Preserve refs, slots, consumer classes, defaults opt-out,
  controlled/uncontrolled state, and callbacks.
- Preserve current headless behavior and the intended CoreAI visual contract. Check omitted versus
  explicitly undefined visual props and supported composition rules. Do not port deprecated APIs
  or styles, or recreate old behavior in conflict with the API policy above. Report dependency
  limitations and intentional differences explicitly; do not change parity expectations merely
  to hide an unintended regression.
- Share representative fixtures between comparison stories and focused tests. Compare bounded
  computed-style properties, relevant slot dimensions, and meaningful interactions, not every CSS
  declaration or the full upstream behavior matrix. Investigate surfaced differences; report
  intentional differences and gaps rather than hiding them with broad exclusions.
- Settle relevant pseudo-element animations as well as element transitions. Neutralize the pointer
  before pure keyboard-focus checks and assert actual hover state; test combined hover/focus
  separately. Check callbacks and form results, not just a changed native value. Smoke-check the
  actual Storybook reports and interaction plays in addition to the browser-test fixtures.
- Workers may format/lint their own files. The coordinator integrates exports, then runs the
  combined focused tests, existing Button regressions, type checks, and builds. Serialize shared
  validation to avoid unfinished-file, cache, and build-output interference. Return failures to
  the owning worker.
- Wait until every batch fixture import and public export is wired before starting a browser run.
  Vite's dependency scanner scans all configured test entries, even when the command selects a
  single file. An unfinished sibling fixture can prevent the selected tests from loading.
- Register newly imported headless entry points in both
  [browser-test optimization](./vitest.config.ts) and
  [Storybook optimization](../../apps/storybook/.storybook/main.ts). Dependency discovery must
  not reload React modules in the middle of Browser Mode tests. Check a representative cold-cache
  case after changing these entries, then run the focused suites.

A worker's handoff includes changed files, source versions, modern browser API/polyfill findings,
checks actually run, integration requirements, remaining differences, and coverage gaps.
`Implementation-ready` is not verified completion. Complete a job only after integration checks
pass. Use separate worktrees if shared-file contention or independent full builds justify the
extra dependency and merge management.

## Modern browser behavior

Button focus styles use native `:focus-visible`, not the legacy focus-visible attribute/polyfill.
Icon spacing uses logical properties for RTL. Forced-colors, reduced-motion, and the original
Firefox focus-stroke adjustment are included in the CSS port.

Input and Textarea use native `:focus-within` for their wrapper focus treatment and retain native
form/editing behavior. Neither needs a component-specific overlay or focusgroup polyfill.
Input's `field-sizing: content` is progressive enhancement; unsupported browsers keep ordinary
input sizing. Textarea retains native rows and resize behavior rather than introducing autosizing.

Link keeps the public headless hook's native anchor/button semantics and uses `:focus-visible`
for its focus indicator. A keyboard-focused disabled-focusable Link keeps its double underline
during hover/press while `:focus-visible` remains true; the legacy disabled-hover rules remove it.
Unfocused disabled links remain undecorated, with disabled colors and activation blocking unchanged.
Spinner ports its masks, conic gradients, and CSS animations and uses native direction selectors
for RTL. Neither needs an overlay or focusgroup polyfill.
ProgressBar supplies CSS slide/pulse animations for indeterminate progress rather than restoring
the old motion slot. Divider uses logical alignment and native separator semantics. Neither needs
an overlay or focusgroup polyfill.
Select retains the browser-owned popup and native selection/form/reset behavior. Slider uses
native range inputs, focus-visible styling, and vertical writing mode. In vertical RTL mode, the
legacy Griffel input flips to `direction: ltr`, reversing pointer and keyboard value progression.
The port keeps the current native/headless direction and its thumb aligned with that progression;
RTL tests and reports explicitly distinguish this intentional correction.
RadioGroup uses its public headless context helper and native radio-input navigation; it needs no
focusgroup polyfill. Badge counts and presence accessibility likewise remain owned by their
headless hooks, without introducing live-region behavior.

Button needs no overlay or focusgroup polyfill. Every conversion must follow the headless
[browser-support](https://storybooks.fluentui.dev/headless/llms/overview-browser-support.txt) and
[polyfill](https://storybooks.fluentui.dev/headless/llms/overview-polyfills-fallbacks.txt) contracts.
In particular, native dialog/popover/anchor positioning replace parts of the old overlay pipeline,
but arrow-key `focusgroup` navigation still requires a consumer-supplied polyfill today.

## Practical parity coverage

The focused Vitest Browser Mode suites use Playwright Chromium and the same fixtures as Storybook.
The Button suite compares a bounded list of computed properties, dimensions, and icon visibility across light
and dark modes, appearances, sizes, shapes, icons, disabled states, anchors, hover, keyboard focus,
and keyboard press. It also checks defaults opt-out, RTL spacing, consumer CSS priority, context
sizing, refs, slot preservation, stable global slot markers, data-state attributes, and disabled
activation. Disabled hover and combined keyboard-focus/hover cases protect interaction priority
without zero-specificity selectors.

The Consumer Overrides fixture deliberately differs: ordinary CSS sets the headless minimum width
to `120px`, radius to `3px`, and icon size to `16px`. Legacy Griffel rules can retain `40px`,
circular radius, and `20px` icons. The test asserts the new consumer-override contract rather than
requiring those differences to disappear.

Input and Textarea add component-specific slot and pseudo-element comparisons, native text entry,
controlled/uncontrolled values, callbacks, form semantics, read-only/disabled/invalid states,
Field context, and consumer overrides. Input covers its inline labels, sizing/truncation, and
copy composition; Textarea covers native row sizing and resize modes. Relevant interactions and
combined focus/hover states are checked rather than comparing only resting fixtures.
Label covers typography, required-slot styling, native association, and consumer overrides.
Image uses deterministic inline fixtures to compare fitting, shape, border, shadow, and dimensions
while preserving alt text, intrinsic sizing, and native image events.
Link adds native navigation/activation, disabled and disabled-focusable behavior, external glyphs,
caller rendering, context/defaults, and consumer priority. Spinner compares sizes, label positions,
appearance, slot/pseudo-element styling, live-region semantics, caller slots/refs, and loading-state
changes. Its comparison fixture freezes time-varying animation frames rather than waiting for
infinite animations; animation configuration remains part of the checks.
ProgressBar covers determinate ranges, indeterminate styling/animation, status semantics, custom
slots, and progress updates. Divider compares both CoreAI's contentless separator and Fluent's
content-bearing variant, including orientation, alignment, insets, content slots, and consumer CSS.
Select adds native options/optgroups, controlled and uncontrolled values, Field sizing, callbacks,
FormData, and reset. Slider checks keyboard/pointer callbacks, range edges, rail/thumb geometry,
native form boundaries, valid slot rendering, and the intentional vertical-RTL direction difference.
Radio and RadioGroup add native selection/navigation, grouping, Field/required boundaries, label
composition, callbacks, and form/reset checks. Badge, CounterBadge, and PresenceBadge cover visual
categories, count/overflow/dot/hidden states, current status glyphs and accessible names, and supplied
content. Radio's report permits at most `0.5px` of captured rectangle width/height allocation noise;
threshold regressions keep larger geometry differences and all CSS property values observable.
RTL cases still emit an unsuppressed Griffel mixed-direction warning from the legacy provider;
the selected RTL style assertions pass.

Standalone Playwright Chromium replays also complete the Input Playground and Textarea Typing Flow
stories with their callback and form assertions unchanged. The VS Code integrated preview showed
a separate synthetic-input limitation: typed native values appeared without triggering callbacks,
and inspection found React's value setter instead of Testing Library's value interceptor.
Native typing in that preview works. No component workaround or weakened assertion was added for
this preview-tool difference.
ProgressBar's frame-zero comparison also stalled in the integrated preview, while the unchanged
report passed in standalone Chromium. Standalone checks additionally cover its upload flow and
DividerLabeled's orientation/content controls.

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
