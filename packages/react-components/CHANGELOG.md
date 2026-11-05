# Changelog

All notable changes to `@coreai-ds/react-components` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Historical release scope

Versions 0.2.0 through 0.11.2 below preserve earlier privately distributed package changes. Historical
issue numbers refer to the issue tracker used at the time. Version links point to
headings in this changelog.

<!--
  Keep entries concise and factual — one line per change, no marketing prose.
  This changelog is also written to help AGENTS automate upgrades in consumer
  codebases, so for anything breaking, give the before → after and the migration
  action (e.g. "`Button` default `shape` `circular`→`square`; pass
  `shape='circular'` to keep prior look"). Call breaking changes out explicitly
  under a `### Breaking` group so an agent can rewrite consumer code from the
  entry alone.
-->

## [Unreleased]

## [0.12.0] - 2026-10-16

### Breaking

- The package is renamed from `@coreai/fluentui-react` to `@coreai-ds/react-components`; update package dependencies, imports, and the npm registry scope. The workspace directory is now `packages/react-components`.
- Aptos/Aptos Mono binaries are no longer redistributed. The existing `@coreai-ds/react-components/fonts/fonts.css` import now registers locally installed fonts only; remove deep `.ttf` imports and supply separately licensed assets/CSS if self-hosted fonts are required. Otherwise proportional text falls back to Inter and then system fonts.

### Changed

- Version 0.12.0 is the first public npm release as `@coreai-ds/react-components`; earlier versions were distributed privately as `@coreai/fluentui-react`.
- Consumer agent guidance uses the public CoreAI documentation MCP, delegates setup to the docsite guide, and keeps repository-specific exceptions in local proxy skills.
- CSS Modules guidance uses an opt-in, app-owned layered Griffel renderer instead of patching shared dependencies.
- `Accordion` removes the default `AccordionHeader` button padding and `AccordionPanel` margin so content aligns with its surroundings, and keeps the expand icon vertically centered without stretching alongside tall header content.
- Added Inter as the proportional and numeric fallback after Aptos; the hosted apps load normal and italic Inter faces at weights 400, 600, and 700 from Google Fonts.
- Package tarball verification checks compiled exports and excludes source files and locally installed font assets.

### Fixed

- Elevated `TabList` uses interactive hover and pressed colors, preserves selected colors across interaction states, and excludes `aria-disabled` router tabs from enabled hover and pressed styles.

## [0.11.2] - 2026-10-05

### Fixed

- `CoreAIFluentProvider` is exported directly from the package entry point, removing its circular dependency with the CoreAI theme module.

## [0.11.1] - 2026-09-15

### Fixed

- `Text` resets browser default margins for semantic elements such as headings and paragraphs, and unset typography properties inherit from the CSS parent. Fixes historical issue 246.
- CoreAI typography uses responsive letter spacing based on each element's computed font size to improve perceived word spacing. Fixes historical issue 264.

## [0.11.0] - 2026-09-08

### Changed

- Lowered the minimum supported `@fluentui/react-components` version from `9.74.0` to `9.70.0`, the first release supporting React 19 and containing every Fluent API currently used or re-exported by this package.
- Fluent development dependencies now track the latest exact releases while CI separately validates the peer minimums (`react-components` `9.70.0`, `react-icons` `2.0.316`).
- Added Vite SSR and Vitest guidance for working around Fluent Icons' invalid Node ESM output.
- Source code, pull requests, and CI/CD moved from GitHub to Azure DevOps. The former GitHub repository remained the issue tracker.
- Agent and MCP setup guidance now requires user confirmation before writing skill files, changing client configuration, or filing GitHub issues.
- MCP setup guidance no longer requires corp-network access (VPN or Devbox/SAW); documented hosted access uses a Microsoft sign-in in the browser, with no VPN, headers, or secrets.
- The hosted `coreai-ds-docs` MCP server renews its session without a repeat sign-in, so agent sessions are no longer interrupted when the previous token expires. Fixes historical issue 468.
- `Select` now defaults to `appearance="filled-darker"` when CoreAI component defaults are enabled; pass `appearance="outline"` to retain Fluent's default appearance.
- `LinkButton` accepts an anchor-compatible component through `as`, enabling framework router links while retaining its Button API and anchor semantics.
- Anchor-backed `Card` and `Tab` components no longer inherit native link underlines.

### Fixed

- Inline-label `Dropdown` forwards its trigger ref so popup positioning and keyboard focus work correctly.
- Component prop documentation reports CoreAI's runtime `shape` and `appearance` defaults instead of the overridden Fluent defaults.

## [0.10.0] - 2026-08-21

### Breaking

- Removed the deprecated `*Complex` Nav component and type aliases. Replace imports such as `NavComplex`/`NavComplexProps` with their original Fluent names (`Nav`/`NavProps`), or adopt the CoreAI `Nav` template.
- Removed `useButtonAlignContent`, `useTabListAlignContent`, and their related types. Replace them with a local `makeStyles` class whose negative `marginInline` matches the component's horizontal padding.

### Added

- `CodeBlock` supports fixed-height scrolling, optional footer content, and `fallbackContent` for loading or empty states when `code` is empty or omitted.

### Changed

- `LinkButton` now renders CoreAI `Button` with a native anchor root, supports the complete Button content and visual API plus native anchor attributes, and adds Link's `external` behavior. Fixes historical issue 299.

### Fixed

- Interactive `Card` no longer overrides custom colors on nested `Text` components.
- `TabList` no longer emits invalid `:not[disabled]` CSS that Chromium rejects during stylesheet insertion. Fixes historical issue 381.

## [0.9.0] - 2026-08-17

### Added

- `FileUpload` — thin, styled `react-dropzone` wrapper with selected dropzone options and render state. Validation messages, upload state, and presentation remain application-owned.
- `CopyButton` supports `onCopySuccess` and `onCopyError` callbacks for outcome-dependent behavior.

### Fixed

- Wrapped component exports are independently tree-shakeable, so importing one component no longer makes unrelated Fluent component packages reachable. Fixes historical issue 334.

## [0.8.1] - 2026-08-07

### Fixed

- Declared `@fluentui/react-icons` as a peer dependency so consumers install the icons used by shipped components.

## [0.8.0] - 2026-08-07

### Breaking

- `CodeBlock` copy visibility prop `showCopyButton` was renamed to `hideCopybutton` and its polarity was inverted. Replace `showCopyButton={false}` with `hideCopybutton`; remove `showCopyButton` when the copy button should remain visible.
- Removed the `@fluentui/react-datepicker-compat` / `react-timepicker-compat` / `react-calendar-compat` barrel re-exports, and the wrapped `DatePicker`/`TimePicker` components built on them. Use the native `DateTimePicker` instead, or install the compat packages directly and import from them if you still need the popup calendar / dropdown-list UI.
- Fully removed `@fluentui/react-menu-grid-preview` support (previously an optional peer, per the `[0.4.0]` entry below). It's no longer declared anywhere in this package; install it directly and import from it if you need grid menus.

### Added

- Vitest Browser Mode component testing for CoreAI-owned functionality, with `CopyButton` clipboard behavior as the first covered interaction.
- `CodeBlock` supports arbitrary header content with divided and subtle appearances, optional header styling, and an optional hidden copy button.
- `DateTimePicker` — new native component wrapping `Input`, restricting `type` to HTML's temporal input types (`date` [default], `time`, `datetime-local`, `month`, `week`), as a lighter-weight alternative to the compat `DatePicker`/`TimePicker`'s popup calendar / dropdown list. `value`/`defaultValue`/`min`/`max` are plain `Date` objects; `onChange` reports `(event, { value: Date | null })`. `onValidationResult(event, { error })` mirrors the compat `DatePicker`'s callback, derived from the native input's `ValidityState`. `clearable` adds an "x" button that clears to empty, or resets to `defaultValue` if one was provided.

### Changed

- `Link external` now defaults `target="_blank"` and `rel="noopener noreferrer"`; explicit `target` and `rel` values still override the defaults. `Markdown` external links use this behavior.

### Fixed

- `CopyButton` now shows its "Copied" confirmation only when the clipboard write succeeds.
- Package entry points now load the compiled `dist` output instead of raw TypeScript source; emitted relative ESM imports include `.js` extensions for native Node.js resolution.

## [0.7.2] - 2026-07-31

### Fixed

- `DataGrid` `resizableColumns` works again. The wrapped `DataGridHeaderCell`/`DataGridCell` always passed a `style` prop (`undefined` when there was no `columnFlexOptions` override), and Fluent spreads caller props _after_ its column-sizing props — so the `width`/`minWidth`/`maxWidth` from `columnSizingOptions` and from dragging were overwritten and columns never changed width. `style` is now only forwarded when there is one. No consumer action needed. Fixes historical issue 273.
- `Card` `appearance="subtle"` hover background now uses `colorNeutralBackground3Hover` instead of Fluent's default `colorSubtleBackgroundHover`, matching the side nav hover weight in light mode. Fixes historical issue 271.

## [0.7.1] - 2026-07-29

### Fixed

- Azure dark theme — link color upgraded from brand-90 (`#2886de`) to brand-100 (`#479ef5`) to pass WCAG AA contrast (4.36:1 → 5.8:1 against `#1f1f1f`). Hover shifted from brand-110 to brand-120 to preserve visual step. Added missing `colorBrandForegroundLinkSelected` override to light theme.

## [0.7.0] - 2026-07-28

### Added

- `agent/SKILL.md` — canonical, distributable agent-usage guide ships inside the package (MCP server precedence, component-ID quirks, template-vs-component distinction, offline/no-MCP fallback). Also mirrored into the hosted Storybook so it's reachable through the MCP tools.

### Changed

- `DataGrid` now defaults `selectionAppearance` to `"neutral"` instead of Fluent's `"brand"`; pass `selectionAppearance="brand"` to retain the Fluent default.

## [0.6.0] - 2026-07-27

### Added

- Azure theme — new `azureLightTheme` / `azureDarkTheme` exports built on the Azure/Coherence brand ramp (`#0f6cbd` at brand-80), sourced from the Coherence CDN theme CSS and live dark-mode token extraction. Shares CoreAI's neutral palette, Aptos fonts, and interactive background tokens; only brand-derived colors differ. File: `src/theme/azureTheme.ts`. Also exports `azureBrandVariants` and `AzureTheme` type.

### Changed

- `createCoreAIDarkTheme` factory now includes the neutral background dark-theme overrides (previously only applied in the final `coreaiDarkTheme` constant). This ensures any theme built with the factory inherits CoreAI's high-contrast neutral backgrounds automatically.

## [0.5.0] - 2026-07-24

### Added

- `DataGrid` — new wrapped component (with `DataGridHeaderCell`/`DataGridCell` wrappers) adding an opt-in `columnFlexOptions` feature: a CSS-only, non-interactive alternative to `resizableColumns` for static layouts — per-column `flexGrow`/`flexShrink`/`flexBasis`/`minWidth`/`maxWidth` overrides keyed by `columnId`, picked up automatically by the cell wrappers via `useColumnIdContext()`. For text truncation, pass `truncate` to `TableCellLayout` directly rather than via `columnFlexOptions`.

### Fixed

- Fixed `mergeClasses` override-priority bug in `customStyleHooks_unstable`-driven style hooks (`Table`, `Button`, `Card`, `Dialog`, `Overlay`, `Accordion`, `Tag`) where a consumer's instance `className` was silently dropped for any CSS property also set by the CoreAI theme, because the theme classes were merged in after Fluent's own default+instance fusion. Style hooks now append `getSlotClassNameProp_unstable(slot)` as the final `mergeClasses` argument so priority is correctly `stock Fluent default < CoreAI theme < consumer instance className`. See `code-conventions.md` for the required pattern going forward.
- `Table`/`DataGrid` — fixed a horizontal scrollbar appearing when `resizableColumns` is enabled, caused by the header/cell border adding 2px outside the box; header/body/row/cell elements now use `box-sizing: border-box`.

## [0.4.0] - 2026-07-22

### Breaking

- Removed eager `export * from '@fluentui/react-menu-grid-preview'` from the barrel. The package is now an optional peer — consumers who need grid menus should `npm install @fluentui/react-menu-grid-preview` and import from it directly instead of through `@coreai-ds/react-components`. This fixes CI failures in environments whose npm feed does not mirror preview-channel Fluent packages.

### Added

- `Text` — new `preset` prop (`TextPreset`: `heading1`–`heading4`, `heading5`/`bodyStrong`, `body`, `heading6`/`bodySStrong`, `bodyS`, `bodyXSStrong`, `bodyXS`) that supplies `size`/`weight` defaults in place of Fluent's fixed typography-ramp preset components. Explicit `size`/`weight` props still override `preset`.

### Deprecated

- Fluent's low-level `Nav` component family is now re-exported from the barrel under its original names, with the components flagged `@deprecated` in favor of the CoreAI `Nav` template. Their types remain available under their original names and are not deprecated. Migration: adopt the CoreAI `Nav` template. File: `src/components/Nav.deprecated.ts`.
- Fluent's fixed typography-ramp `Text` presets are now re-exported from the barrel flagged `@deprecated`, in favor of the CoreAI `Text` component's `size`/`weight` props (or the new `preset` prop above). Deprecated components (names unchanged): `Body1`, `Body1Strong`, `Body1Stronger`, `Body2`, `Caption1`, `Caption1Strong`, `Caption1Stronger`, `Caption2`, `Caption2Strong`, `Display`, `LargeTitle`, `Subtitle1`, `Subtitle2`, `Subtitle2Stronger`, `Title1`, `Title2`, `Title3`. The shared `TextPresetProps` type is re-exported but NOT deprecated. Migration: replace `<Body1>` with `<Text preset="body">` (or explicit `size`/`weight`), etc. File: `src/components/Text.deprecated.ts`.

### Breaking

- `Markdown` no longer renders math (`$…$` / `$$…$$`) out of the box. Removed the built-in `remark-math` / `rehype-katex` plugins and the top-level `katex/dist/katex.min.css` import, which forced bundlers to emit ~1.1MB of KaTeX fonts on every consumer of the barrel. To restore math: `import remarkMath from 'remark-math'; import rehypeKatex from 'rehype-katex'; import 'katex/dist/katex.min.css';` then pass `remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}` to `<Markdown>`.

### Fixed

- `Card` — outline appearance no longer shows hover/active background on non-interactive cards.

## [0.3.0] - 2026-07-09

### Added

- `Text` — wraps Fluent's `Text` with a `foreground` prop (`1 | 2 | 3 | 4 | 'disabled'`) that maps to the `colorNeutralForeground1`–`colorNeutralForeground4` / `colorNeutralForegroundDisabled` tokens, and an `uppercase` boolean that applies `text-transform: uppercase` with tracking. Also adds size-aware letter-spacing for sizes `100`/`200`/`300`. Without these props, behaves identically to Fluent's `Text`.
- `Avatar` — wraps Fluent's `Avatar` with an additional `"neutral-alt"` `color` value (maps to `colorNeutralBackground1`, vs. plain `"neutral"`'s `colorNeutralBackground4`), for a neutral avatar that needs contrast on a higher-elevation surface. Exports `AvatarProps` and `AvatarColor` types.
- `Link` — wraps Fluent's `Link` with an `external` prop. When `true`, renders an inline external-link icon (`bundleIcon(OpenFilled, OpenRegular)`) after the link text that fills on hover/focus; the icon is decorative (`aria-hidden`). Default behavior is unchanged from Fluent's `Link`.
- `Card` wrapper — adds a `floatingActionPosition` prop (`'right' | 'left'`, default `'right'`) that repositions the `.fui-Card__floatingAction` slot (stock Fluent only pins it right), and defaults `appearance` to `'filled-alternative'` when component defaults are enabled. Exports `CardProps` and `CardFloatingActionPosition` types.
- `createCoreAILightTheme` / `createCoreAIDarkTheme` theme factories — build a `CoreAITheme` from arbitrary `BrandVariants`, enabling custom-brand themes. `coreaiLightTheme` / `coreaiDarkTheme` are now built via these factories.
- `LinkButton` — a native `<a>` anchor styled with the native Fluent `Button` chrome (`appearance`, `shape`, `size`, `disabled`), for cases that need a real, navigable link rather than a `<button>`. Uses the same `useButtonStyles_unstable` technique as `DropdownButton`. Since `<a>` has no native `disabled`, it's emulated: `href` is stripped, `aria-disabled` is set, the element is removed from tab order, and click/keyboard activation is suppressed.
- `InfoButton` — a button that reveals supplemental info in a `Popover`. Wraps Fluent's `InfoButton`, requires an accessible name (`aria-label` or `aria-labelledby`), and mirrors primitive `info` content into the Popover surface's `aria-label` so it is announced on focus.
- `MessageBar` — wraps Fluent's `MessageBar` with an additional `intent="brand"` value styled with the brand token ramp (`colorBrandBackground2` surface, `colorBrandStroke2` border, `colorBrandForeground1` icon). `brand` maps internally to Fluent's `info` intent so the default icon and polite aria-live announcement are preserved; the other intents are unchanged from Fluent.
- `useButtonAlignContent` CSS class utility (with `ButtonAlignContent`, `ButtonAlignContentOptions`, and `ButtonAlignContentSize` types) — returns a size-aware class that optically aligns a subtle/transparent button's content to its inline edge without shrinking the hit zone. Composes onto any Fluent button slot via `className`.
- `useTabListAlignContent` CSS class utility (with `TabListAlignContent`, `TabListAlignContentOptions`, and `TabListAlignContentSize` types) — the `TabList` counterpart to `useButtonAlignContent`; same size-aware cancelling margin, minus the `iconOnly` option since a `Tab`'s padding doesn't change for icon-only content.
- `TagPicker` wrapped with a `appearance: 'filled-darker'` default, matching the other input-family components.
- Button-family `min-width` override (40px, replacing Fluent's stock 96px) applied via `customStyleHooks_unstable` to `Button`, `MenuButton`, `ToggleButton`, `CompoundButton`, and `SplitButton` (icon-only buttons excluded). Gated on component defaults.
- `AccordionHeader` style override via `customStyleHooks_unstable` — grid layout, hover, and pressed treatment on the header button. Gated on component defaults.
- Tag-family style override via `customStyleHooks_unstable` — resets the `primaryText` slot's bottom padding to 0 (`Tag`, `InteractionTagPrimary`) and trims the `InteractionTagSecondary` border. Gated on component defaults.

### Changed

- `Input`, `Combobox`, and `Dropdown` now dim the inline label to the disabled foreground when the control is `disabled`, and expose stable `fui-Input__label` / `fui-Combobox__label` / `fui-Dropdown__label` class names on the inline label.
- Dark theme: bumped `colorInteractiveBackgroundHover` (10%→15%) and `colorInteractiveBackgroundSelected` (15%→27%) opacities for stronger interactive feedback.
- `useCoreAIGlobalStyles` now sets a default root text color (`colorNeutralForeground2`) instead of leaving it unset, so unstyled text under a `CoreAIFluentProvider` matches the neutral body-text token by default.

### Breaking

- `DropdownButton` reworked to render the native Fluent `Button` chrome, and now accepts the full `Button` API (`appearance`, `shape`, `size`, `disabled`). The `appearance` prop changed from `'default' | 'subtle'` (default `'default'`) to the Button set `'secondary' | 'primary' | 'outline' | 'subtle' | 'transparent'` (default `'secondary'`). Migration: replace `appearance="default"` → `appearance="secondary"` (or drop it, since `'secondary'` is the default); `appearance="subtle"` is unchanged.

## [0.2.1] - 2026-06-23

### Changed

- Renamed the project from its original codename **Manifold** to **CoreAI** throughout: package folder (`packages/manifold-fluentui-react` → the CoreAI package folder), brand text, theme keys, and docs. The published package basename was unchanged at that time.

## [0.2.0] - 2026-06-23

Initial release to the Azure DevOps **coreai** Artifacts feed (org `coreaidesign`, scope `@coreai-ds`).

### Added

- `<CoreAIFluentProvider>` drop-in replacement for `FluentProvider` — applies the CoreAI brand ramp, light/dark token overrides, Aptos typography, per-component default props, and per-component style hooks.
- `coreaiLightTheme` / `coreaiDarkTheme` themes built on the CoreAI brand variants.
- Barrel export (`@coreai-ds/react-components`) that re-exports the full Fluent UI v9 surface and shadows stock components with CoreAI-wrapped versions.
- `withComponentDefaults` HoC and `componentDefaults` registry for per-component default props.
- `customStyleHooks_unstable` style-hook registry (Card, Overlay, Dialog, Table, …).
- Aptos / Aptos Mono `@font-face` declarations shipped via `@coreai-ds/react-components/fonts/fonts.css`.

[Unreleased]: #unreleased
[0.12.0]: #0120---2026-10-16
[0.11.2]: #0112---2026-10-05
[0.11.1]: #0111---2026-09-15
[0.11.0]: #0110---2026-09-08
[0.10.0]: #0100---2026-08-21
[0.9.0]: #090---2026-08-17
[0.8.1]: #081---2026-08-07
[0.8.0]: #080---2026-08-07
[0.7.2]: #072---2026-07-31
[0.7.1]: #071---2026-07-29
[0.7.0]: #070---2026-07-28
[0.6.0]: #060---2026-07-27
[0.5.0]: #050---2026-07-24
[0.4.0]: #040---2026-07-22
[0.3.0]: #030---2026-07-09
[0.2.1]: #021---2026-06-23
[0.2.0]: #020---2026-06-23
