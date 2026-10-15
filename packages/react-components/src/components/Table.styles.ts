// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Table-family CSS overrides, applied via FluentProvider's
 * `customStyleHooks_unstable`. Each Fluent Table subcomponent gets its own
 * slot hook so the rules sit on the slot they're styling instead of being
 * chained off descendant selectors.
 *
 * Each hook is registered against both the Table and DataGrid key in
 * `styleHooks.ts` (DataGrid renders the same DOM), except for
 * `useTableCellLayoutStyles` — DataGrid reuses Fluent's `TableCellLayout`
 * so there is no separate `useDataGridCellLayoutStyles_unstable` key.
 *
 * - `useTableStyles`              → `useTableStyles_unstable`, `useDataGridStyles_unstable`
 * - `useTableHeaderStyles`        → `useTableHeaderStyles_unstable`, `useDataGridHeaderStyles_unstable`
 * - `useTableHeaderCellStyles`    → `useTableHeaderCellStyles_unstable`, `useDataGridHeaderCellStyles_unstable`
 * - `useTableBodyStyles`          → `useTableBodyStyles_unstable`, `useDataGridBodyStyles_unstable`
 * - `useTableRowStyles`           → `useTableRowStyles_unstable`, `useDataGridRowStyles_unstable`
 * - `useTableCellStyles`          → `useTableCellStyles_unstable`, `useDataGridCellStyles_unstable`
 * - `useTableSelectionCellStyles` → `useTableSelectionCellStyles_unstable`, `useDataGridSelectionCellStyles_unstable`
 * - `useTableCellLayoutStyles`    → `useTableCellLayoutStyles_unstable`
 *
 * Gated on `useComponentDefaults()` so Web / Teams / Teams v2.1 (or any
 * consumer that sets `withComponentDefaults={false}` on `CoreAIFluentProvider`)
 * gets stock Fluent behavior.
 */
import {
  getSlotClassNameProp_unstable,
  makeStyles,
  mergeClasses,
  type DataGridState,
} from '@fluentui/react-components';
import { useComponentDefaults } from '../contexts/ComponentDefaultsContext.js';

const useStyles = makeStyles({
  table: {
    '--fui-Table--borderRadius': 'var(--borderRadiusXLarge)',
    border: 'var(--strokeWidthThin) solid var(--colorNeutralStroke2)',
    borderRadius: 'var(--fui-Table--borderRadius)',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: 'var(--colorNeutralForeground2)',
    overflow: 'hidden',
    '& .fui-TableHeaderCell, & .fui-TableSelectionCell, & .fui-TableCell': {
      // this prevents the focus outline from being clipped by overflow:hidden;
      outlineOffset: '-2px',
    },

    '&, & .fui-TableHeader, & .fui-TableBody, & .fui-TableRow, & .fui-TableHeaderCell, & .fui-TableSelectionCell, & .fui-TableCell':
      {
        // This fixes an issue caused by adding the border above,
        // which causes Tables/DataGrids with resizableColumns
        // to have a horizontal scrollbar because the border adds 2px
        boxSizing: 'border-box',
      },
  },
  header: {
    color: 'var(--colorNeutralForeground1)',

    // if native table elements, put border on cells, else put border on rows
    '& tr.fui-TableRow': {
      backgroundColor: 'var(--colorNeutralBackground3)',
      '& .fui-TableHeaderCell, & .fui-TableSelectionCell, & .fui-TableCell': {
        borderBottom: 'var(--strokeWidthThin) solid var(--colorNeutralStroke2)',
      },
    },
    '& div.fui-TableRow': {
      backgroundColor: 'var(--colorNeutralBackground3)',
      borderBottom: 'var(--strokeWidthThin) solid var(--colorNeutralStroke2)',
    },
  },
  body: {
    // if native table elements, put border on cells, else put border on rows
    // skip the final body row
    '& tr.fui-TableRow:not(:last-child)': {
      '& .fui-TableHeaderCell, & .fui-TableSelectionCell, &  .fui-TableCell': {
        borderBottom: 'var(--strokeWidthThin) solid var(--colorNeutralStroke2)',
      },
    },
    '& div.fui-TableRow:not(:last-child)': {
      borderBottom: 'var(--strokeWidthThin) solid var(--colorNeutralStroke2)',
    },
  },
  row: {
    border: 'unset',
    color: 'inherit',
  },
  cell: {},
  selectionCell: {
    opacity: 'unset',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  headerCell: {
    '& .fui-TableHeaderCell__button': {
      backgroundColor: 'unset', // was set to inherit?
    },
  },
  cellLayout: {},
});

const applyToRoot = (stateUnknown: unknown, classNames: (string | undefined | false)[]): void => {
  const state = stateUnknown as DataGridState; // or other Table sub components, all with 'root' slots
  if (!state.root) {
    return;
  }
  state.root.className = mergeClasses(
    state.root.className,
    ...classNames,
    getSlotClassNameProp_unstable(state.root),
  );
};

/**
 * Builds a slot hook that merges the given style class(es) onto `state.root`
 * when `useComponentDefaults()` is enabled. Both `useStyles` and
 * `useComponentDefaults` are called unconditionally so the Rules of Hooks
 * hold; the enabled-flag check is the only branching.
 */
const makeSlotHook =
  (pick: (styles: ReturnType<typeof useStyles>) => (string | undefined | false)[]) =>
  (stateUnknown: unknown): void => {
    const enabled = useComponentDefaults();
    const styles = useStyles();
    if (!enabled) {
      return;
    }
    applyToRoot(stateUnknown, pick(styles));
  };

// One hook per slot. The factory above absorbs the boilerplate so each
// export is a single line that just picks which class(es) to merge.

export const useTableStyles = makeSlotHook((s) => [s.table]);
export const useTableHeaderStyles = makeSlotHook((s) => [s.header]);
export const useTableBodyStyles = makeSlotHook((s) => [s.body]);

export const useTableRowStyles = makeSlotHook((s) => [s.row]);

export const useTableHeaderCellStyles = makeSlotHook((s) => [s.headerCell]);
export const useTableCellStyles = makeSlotHook((s) => [s.cell]);
export const useTableSelectionCellStyles = makeSlotHook((s) => [s.selectionCell]);

export const useTableCellLayoutStyles = makeSlotHook((s) => [s.cellLayout]);
