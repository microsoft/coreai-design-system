// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Per-component CSS overrides for the CoreAI theme.
 *
 * Wired into `CoreAIFluentProvider` via FluentProvider's `customStyleHooks_unstable`
 * prop. Each hook is called AFTER the component's default styles and may only
 * mutate `className` (per Fluent's contract — never touch other state props).
 *
 * Use this for CSS-only tweaks that can't be expressed as a prop default
 * (focus rings, drop shadows, etc.). For default PROP values like
 * `shape="circular"`, prefer the wrapped components in `../components/`
 * instead — those keep per-instance prop overrides working
 * (`<Button shape="square">` still becomes square).
 *
 * See: docs/Advanced-styling-techniques.md
 */
import type { FluentProviderCustomStyleHooks } from '@fluentui/react-provider';
import {
  useAccordionHeaderStyles,
  useAccordionPanelStyles,
} from '../components/Accordion.styles.js';
import { useButtonStyles } from '../components/Button.styles.js';
import { useCardStyles } from '../components/Card.styles.js';
import { useComboboxStyleHook } from '../components/Combobox.js';
import { useDropdownStyleHook } from '../components/Dropdown.js';
import { useInputStyleHook } from '../components/Input.js';
import { useTagStyles, useInteractionTagSecondaryStyles } from '../components/Tag.styles.js';
import {
  useDialogBodyStyles,
  useDialogContentStyles,
  useDialogStyles,
} from '../components/Dialog.styles.js';
import { useOverlayStyles } from '../components/Overlay.styles.js';
import {
  useTableBodyStyles,
  useTableCellLayoutStyles,
  useTableCellStyles,
  useTableHeaderCellStyles,
  useTableHeaderStyles,
  useTableRowStyles,
  useTableSelectionCellStyles,
  useTableStyles,
} from '../components/Table.styles.js';

/**
 * The full set of per-component style hooks applied by `CoreAIFluentProvider`.
 * Add new component overrides by importing their hook and registering the
 * matching `useXxxStyles_unstable` key here.
 */
export const styleHooks: FluentProviderCustomStyleHooks = {
  useCardStyles_unstable: useCardStyles,

  // Accordion — only the header button is restyled.
  useAccordionHeaderStyles_unstable: useAccordionHeaderStyles,
  useAccordionPanelStyles_unstable: useAccordionPanelStyles,

  // Button family — smaller default min-width (40px instead of Fluent's 96px).
  useButtonStyles_unstable: useButtonStyles,
  useMenuButtonStyles_unstable: useButtonStyles,
  useToggleButtonStyles_unstable: useButtonStyles,
  useCompoundButtonStyles_unstable: useButtonStyles,
  useSplitButtonStyles_unstable: useButtonStyles,

  // Inline-label Dropdown: appends a trailing colon to the label when a value
  // is selected. Driven by `state.value`, which is only available here.
  useDropdownStyles_unstable: useDropdownStyleHook,

  // Inline-label Combobox: same colon-on-value treatment as the Dropdown.
  useComboboxStyles_unstable: useComboboxStyleHook,

  // Inline-label Input: same colon-on-value treatment, driven by the live
  // input value which is only available here.
  useInputStyles_unstable: useInputStyleHook,

  // Tag family — reset the `primaryText` slot's bottom padding to 0.
  useTagStyles_unstable: useTagStyles,
  useInteractionTagPrimaryStyles_unstable: useTagStyles,
  useInteractionTagSecondaryStyles_unstable: useInteractionTagSecondaryStyles,

  // Floating surfaces — all share the Overlay treatment. Dialog layers
  // its own rules on top via `useDialogStyles` (which composes Overlay).
  useDialogSurfaceStyles_unstable: useDialogStyles,
  useDialogBodyStyles_unstable: useDialogBodyStyles,
  useDialogContentStyles_unstable: useDialogContentStyles,
  usePopoverSurfaceStyles_unstable: useOverlayStyles,
  useTooltipStyles_unstable: useOverlayStyles,
  useMenuPopoverStyles_unstable: useOverlayStyles,

  // Table family — DataGrid keys reuse the Table hooks since DataGrid
  // renders the same DOM. (No `useDataGridCellLayoutStyles_unstable` —
  // DataGrid uses Fluent's TableCellLayout directly.)
  useTableStyles_unstable: useTableStyles,
  useTableHeaderStyles_unstable: useTableHeaderStyles,
  useTableHeaderCellStyles_unstable: useTableHeaderCellStyles,
  useTableBodyStyles_unstable: useTableBodyStyles,
  useTableRowStyles_unstable: useTableRowStyles,
  useTableCellStyles_unstable: useTableCellStyles,
  useTableSelectionCellStyles_unstable: useTableSelectionCellStyles,
  useTableCellLayoutStyles_unstable: useTableCellLayoutStyles,
  useDataGridStyles_unstable: useTableStyles,
  useDataGridHeaderStyles_unstable: useTableHeaderStyles,
  useDataGridHeaderCellStyles_unstable: useTableHeaderCellStyles,
  useDataGridBodyStyles_unstable: useTableBodyStyles,
  useDataGridRowStyles_unstable: useTableRowStyles,
  useDataGridCellStyles_unstable: useTableCellStyles,
  useDataGridSelectionCellStyles_unstable: useTableSelectionCellStyles,
};
