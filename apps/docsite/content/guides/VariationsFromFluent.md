---
id: variations-from-fluent
title: Variations from Fluent
summary: >-
  Full inventory of how @coreai-ds/react-components differs from stock Fluent UI
  v9, by component.
resources: []
reference:
  legacyIds: [docs-variations-from-fluent--docs]
  route: guides/VariationsFromFluent
  aliases:
    - /variations-from-fluent/
  migratedFrom:
    - apps/storybook/src/stories/docs/VariationsFromFluent.mdx
---

This document inventories how `@coreai-ds/react-components` differs from using Fluent UI v9 directly, organized by component or component family.

For more details, see the storybook for each component

## Global platform behavior

**Files:** `src/theme.ts`, `src/CoreAIFluentProvider.tsx`, `src/styleHooks.ts`, `src/index.ts`, `src/globalStyles.ts`, `src/FluentThemeModeContext.tsx`

- CoreAI theme tokens differ from stock Fluent (brand ramp, light/dark token overrides, Aptos fonts, plus CoreAI interactive background tokens).
- Azure theme (`azureLightTheme` / `azureDarkTheme`) uses the Azure/Coherence brand ramp with CoreAI's shared neutral palette, fonts, and interactive tokens.
- Dark theme custom interactive tokens were increased for stronger feedback (`colorInteractiveBackgroundHover`, `colorInteractiveBackgroundSelected`).
- `CoreAIFluentProvider` wraps `FluentProvider`, defaults `theme` to `coreaiLightTheme`, and pre-wires `customStyleHooks_unstable`.
- Component defaults are runtime-gated via `withComponentDefaults` (default `true`).
- Provider descendants receive responsive letter spacing based on their computed font size, with a `0.01em` minimum at `18px` and above.
- Global scrollbar styling is applied by default through provider root classes.
- Barrel exports re-export Fluent, then shadow selected exports with CoreAI wrappers/extensions.

## Button family (`Button`, `CompoundButton`, `MenuButton`, `SplitButton`, `ToggleButton`)

**Files:** `src/componentDefaults.ts`, `src/components/Button.styles.ts`, `src/styleHooks.ts`

- Default `shape="circular"` for all listed Button-family wrappers.
- Style-hook override sets default min-width to `40px` (instead of Fluent `96px`) for non-icon-only variants.

## `SwatchPicker`

**Files:** `src/componentDefaults.ts`

- Default `shape="rounded"`.

## `Card`

**Files:** `src/componentDefaults.ts`, `src/components/Card.styles.ts`

- Default `appearance="filled-alternative"`.
- Adds a `floatingActionPosition` prop (`right` default, plus `left`) that repositions the `.fui-Card__floatingAction` slot.
- Style-hook overrides card surface behavior (shadow/pseudo-border reset, size-based radii, interactive/selected/disabled styling, CoreAI appearance treatment).
- Cards rendered with an anchor root suppress the native link underline.
- Interactive cards preserve custom colors on nested `Text` components instead of forcing `currentColor`.
- `appearance="subtle"` interactive/selectable hover uses `colorNeutralBackground3Hover` instead of Fluent's default `colorSubtleBackgroundHover`, to match side nav hover weight.

## Input-family default appearance wrappers

**Files:** `src/components/Select.ts`, `src/components/Textarea.ts`, `src/components/SearchBox.ts`, `src/components/SpinButton.ts`, `src/components/TagPicker.ts`

- Default `appearance="filled-darker"` for: `Select`, `Textarea`, `SearchBox`, `SpinButton`, `TagPicker`.

## `Input`, `Combobox`, `Dropdown` (inline-label extensions)

**Files:** `src/components/Input.tsx`, `src/components/Combobox.tsx`, `src/components/Dropdown.tsx`, `src/components/inlineLabelProps.ts`, `src/styleHooks.ts`

- Add inline-label model (`label` rendered inside control surface).
- Add `dynamicWidth` (type-limited to cases where `label` is provided).
- Add `truncateTextOverflow`.
- Add value-aware inline label colon behavior (`Label:`) via style hooks.
- Add disabled-state inline-label color dimming to match Fluent disabled foreground.
- Expose stable inline-label class names: `fui-Input__label`, `fui-Combobox__label`, `fui-Dropdown__label`.
- Wrapper-level default `appearance="filled-darker"` for these three controls.

### `Input` specifics

**Files:** `src/components/Input.tsx`

- In `readOnly` mode, auto-injects `CopyButton` into `contentAfter` when caller does not provide `contentAfter`.

## `DropdownButton`

**Files:** `src/components/DropdownButton.tsx`

- Specialized wrapper around CoreAI `Dropdown` with button-style trigger behavior.
- Requires inline `label`.
- Uses Fluent Button styling pipeline (`useButtonStyles_unstable`) and supports Button-style trigger props (`appearance`, `shape`, `size`, `disabled`).
- Current appearance set aligns to Button appearances (`secondary`, `primary`, `outline`, `subtle`, `transparent`) with default behavior matching `secondary`.

## `LinkButton`

**Files:** `src/components/LinkButton.tsx`

- New component, no stock Fluent equivalent — CoreAI `Button` rendered with a native `<a>` root.
- Supports the complete Button content and visual API, including `icon`, `iconPosition`, `appearance`, `shape`, `size`, `disabled`, and `disabledFocusable`, plus native anchor attributes and an `HTMLAnchorElement` ref.
- Accepts an anchor-compatible component through `as` for framework router integration.
- Adds Link's `external` behavior: appends an external-link icon and defaults `target="_blank"` and `rel="noopener noreferrer"`, while preserving explicit overrides.
- Fluent's supported anchor-root Button behavior strips `href`, sets `aria-disabled`, and suppresses click/keyboard activation for `disabled` and `disabledFocusable`; `disabledFocusable` remains in the tab order.
- Does not provide a loading state: links navigate to resources rather than representing pending actions. Use a button for operations that need loading feedback.

## `DateTimePicker`

**Files:** `src/components/DateTimePicker.tsx`, `src/components/dateTimePickerValue.ts`, `src/index.ts`

- New component, no direct stock Fluent equivalent — a thin wrapper around `Input` that restricts `type` to HTML's native temporal input types (`date` [default], `time`, `datetime-local`, `month`, `week`), rendering the browser's own picker UI instead of a custom popup calendar/dropdown list.
- Replaces the compat `DatePicker`/`TimePicker`/`Calendar` (see below) as the supported date/time-picking component; `@fluentui/react-datepicker-compat` / `react-timepicker-compat` / `react-calendar-compat` are no longer barrel-exported.
- `value`/`defaultValue`/`min`/`max` are `Date` objects (not strings); `onChange` reports `(event, { value: Date | null })`.
- `onValidationResult(event, { error })` mirrors the compat `DatePicker`'s callback of the same name, derived from the native input's `ValidityState`.
- `clearable` adds an "x" button: clears to empty if no `defaultValue`, otherwise resets to `defaultValue`.

## `Avatar`

**Files:** `src/components/Avatar.tsx`, `src/index.ts`

- Adds CoreAI-only `color="neutral-alt"` option.
- Applies the background override to the `fui-Avatar__initials` / `fui-Avatar__icon` slot: `color="neutral"` uses `colorNeutralBackground4`, `color="neutral-alt"` uses `colorNeutralBackground1`.
- `neutral-alt` maps internally to Fluent `neutral`; defaults `color` to `neutral`.

## `TabList`

**Files:** `src/components/TabList.tsx`

- Adds CoreAI-only `appearance="elevated"` option.
- Maps internally to Fluent `filled-circular` plus elevated container styling.
- Tabs rendered with an anchor root suppress the native link underline.

## `MessageBar`

**Files:** `src/components/MessageBar.tsx`, `src/index.ts`

- Adds CoreAI-only `intent="brand"` option styled with the brand token ramp: `colorBrandBackground2` surface, `colorBrandStroke2` border, and `colorBrandForeground1` icon.
- `brand` maps internally to Fluent `info` (preserving the default icon and polite aria-live announcement) with the brand styling layered on via `className`.
- Other intents (`info`, `warning`, `error`, `success`) behave identically to Fluent.

## `Divider`

**Files:** `src/components/Divider.tsx`, `src/index.ts`

- `Divider` export is replaced with a simplified styled `<hr>` implementation.
- New implementation removes the `children` and `alignContent` props. It has no content or label - It's just a line.
- Stock Fluent divider remains available as `DividerLabeled`.

## Nav family (deprecated primitives)

**Files:** `src/components/Nav.deprecated.ts`, `src/index.ts`

- Fluent's low-level `Nav` primitives are re-exported under their original names and flagged `@deprecated`; the CoreAI `Nav` template is the supported navigation surface.
- Deprecated components: `Nav`, `NavCategory`, `NavCategoryItem`, `NavDivider`, `NavDrawer`, `NavDrawerBody`, `NavDrawerFooter`, `NavDrawerHeader`, `NavItem`, `NavSectionHeader`, `NavSubItem`, `NavSubItemGroup`, `AppItem`, `AppItemStatic`, `Hamburger`, `SplitNavItem`.
- Related Nav types remain available under their original names (`NavProps`, `NavItemValue`, `NavDensity`, `OnNavItemSelectData`, and exported context-value types) and are not marked deprecated.
- These names are also explicitly root-exported from `src/index.ts` so deprecation metadata is preserved at the package surface.

## `Link`

**Files:** `src/components/Link.tsx`, `src/index.ts`

- Adds an `external` prop. When `true`, renders an inline open-in-new icon (`bundleIcon(OpenFilled, OpenRegular)`) immediately after the link text, defaults `target` to `_blank` and `rel` to `noopener noreferrer`, and allows either default to be overridden explicitly. The icon fills on `:hover`/`:focus-visible` and is decorative (`aria-hidden`).
- Without `external` (default), behaves identically to Fluent's `Link`.

## `Text`

**Files:** `src/components/Text.tsx`, `src/index.ts`

- Adds a `foreground` prop (`1 | 2 | 3 | 4 | 'disabled'`) mapping to the `colorNeutralForeground1`–`colorNeutralForeground4` and `colorNeutralForegroundDisabled` tokens; `1` is highest-emphasis, `4` is lowest.
- Adds an `uppercase` boolean that applies `text-transform: uppercase` with letter-spacing tracking.
- Adds a `preset` prop (`TextPreset`: `heading1`–`heading4`, `heading5`/`bodyStrong`, `body`, `heading6`/`bodySStrong`, `bodyS`, `bodyXSStrong`, `bodyXS`) that supplies `size`/`weight` defaults in place of Fluent's fixed typography-ramp presets; explicit `size`/`weight` props still override `preset`.
- Resets browser default margins to `0` when rendered as semantic elements such as headings and paragraphs.
- Unset color, font family, font size, line height, and font weight inherit from the CSS parent, so nested `Text` changes only the properties explicitly supplied.

## Text presets (deprecated)

**Files:** `src/components/Text.deprecated.ts`, `src/index.ts`

- Fluent's fixed typography-ramp `Text` presets are re-exported as-is and flagged `@deprecated`; the CoreAI `Text` component's `size`/`weight` props (or the new `preset` prop above) are the supported alternative.
- Deprecated components: `Body1`, `Body1Strong`, `Body1Stronger`, `Body2`, `Caption1`, `Caption1Strong`, `Caption1Stronger`, `Caption2`, `Caption2Strong`, `Display`, `LargeTitle`, `Subtitle1`, `Subtitle2`, `Subtitle2Stronger`, `Title1`, `Title2`, `Title3`.
- The shared `TextPresetProps` type is re-exported but NOT deprecated.

## `InfoButton`

**Files:** `src/components/InfoButton.tsx`, `src/index.ts`

- Adds wrapped `InfoButton` to the barrel.
- Requires accessible name via `aria-label` or `aria-labelledby`.
- When `info` is primitive text/number, mirrors that content into the popover surface `aria-label` for better screen-reader announcement.

## Accordion

**Files:** `src/components/Accordion.styles.ts`, `src/contexts/styleHooks.ts`

- Style-hook override for header button layout and interaction styling (grid layouts for icon/expand-icon arrangements, a vertically centered non-stretching expand icon, and hover/pressed visuals).
- `AccordionHeader` button padding and `AccordionPanel` margin are reset to `0` so accordion content aligns with surrounding content.

## Tag family (`Tag`, `InteractionTagPrimary`, `InteractionTagSecondary`)

**Files:** `src/components/Tag.styles.ts`, `src/styleHooks.ts`

- Style-hook override trims `primaryText` bottom padding to `0`.
- `InteractionTagSecondary` gets border/spacing adjustments (except outline appearance).

## Overlay family (`Dialog`, `Popover`, `Tooltip`, `Menu`)

**Files:** `src/components/Overlay.styles.ts`, `src/components/Dialog.styles.ts`, `src/styleHooks.ts`

- Shared overlay border/beak styling across floating surfaces.
- Dialog-specific spacing/body/content slot styling layered on top.

## Table/DataGrid family

**Files:** `src/components/Table.styles.ts`, `src/components/DataGrid.tsx`, `src/components/DataGridHeaderCell.tsx`, `src/components/DataGridCell.tsx`, `src/styleHooks.ts`

- Slot-level style-hook overrides for border model, header/body separators, row/cell styling, selection-cell behavior, and DataGrid parity.
- `DataGrid` defaults `selectionAppearance` to `"neutral"` instead of Fluent's `"brand"`; pass `selectionAppearance="brand"` to opt into the Fluent default.
- `DataGrid` is a non-stock wrapper adding an opt-in `columnFlexOptions` feature: CSS-only per-column flexbox/truncation overrides, keyed by `columnId`, applied automatically by the accompanying `DataGridHeaderCell`/`DataGridCell` wrappers.

## Non-stock components: `CopyButton`, `CodeBlock`, `Markdown`

**Files:** `src/components/CopyButton.tsx`, `src/components/CodeBlock.tsx`, `src/components/Markdown.tsx`

- `CopyButton`: copy action preset with copied-state icon/tooltip feedback.
- `CodeBlock`: syntax highlighting + copy button + theme-mode-aware VS palettes; supports fixed-height scrolling, arbitrary header and footer content with `divided` and `subtle` appearances, header/footer class overrides, and `fallbackContent` for loading or empty states when `code` is empty or omitted.
- `Markdown`: Markdown + GFM + math rendering with Fluent-themed output and `CodeBlock` integration; external links use CoreAI `Link` and open in a new tab by default.

## Storybook/runtime integration

**Files:** `apps/storybook/.storybook/main.ts`, `apps/storybook/scripts/patch-fluent-stories.mjs`

- Canonical Fluent story imports are rewritten to `@coreai-ds/react-components`, so stories render with CoreAI wrappers by default.
- Selected canonical story re-exports are patched out to prevent duplicate story IDs where CoreAI forks exist.

## What remains stock Fluent

- Any export not explicitly shadowed/added in `src/index.ts` stays stock Fluent.
- `withComponentDefaults={false}` disables wrapped default-prop behavior globally.
