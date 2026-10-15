// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `DataGrid` adding `columnFlexOptions`: a CSS-only, non-interactive alternative to
 * `resizableColumns` for static layouts. Provide a `flexGrow`/`flexShrink`/`flexBasis`/`minWidth`/
 * `maxWidth` override per column, keyed by `columnId` (same shape/keying convention as
 * `columnSizingOptions`). The `DataGridHeaderCell`/`DataGridCell` wrappers in this package pick
 * the right column's override up automatically via context + `useColumnIdContext()` — no need to
 * thread `columnId` from the render prop at the call site. For text truncation, pass `truncate`
 * to `TableCellLayout` directly (or use its `truncate` prop on a plain text child), rather than
 * `columnFlexOptions`.
 *
 * `DataGrid` already renders every cell as a flex item (`flex: 1 1 0px` by default, since
 * `noNativeElements` is always on for `DataGrid`) — `columnFlexOptions` only overrides that
 * per-column default via inline styles. It's independent of `resizableColumns`/
 * `columnSizingOptions` (which are a no-op on the DOM unless `resizableColumns` is set) — combining
 * `columnFlexOptions` with `resizableColumns` isn't supported, and the latter takes precedence
 * when both are set.
 *
 * Not a `withComponentDefaults` factory case: that factory only fills default prop values and
 * cannot widen the prop union.
 */
import * as React from 'react';
import {
  DataGrid as FluentDataGrid,
  type DataGridProps as FluentDataGridProps,
  type ForwardRefComponent,
  type TableColumnId,
  makeStyles,
  mergeClasses,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  columnFlexOptions: {
    // Without this, flex rows/cells shrink to fit their container (squeezing columns
    // below their `minWidth`) instead of the grid overflowing so a scroll container can
    // pick up the slack. `resizableColumns` applies this same style internally via
    // `columnSizing_unstable.getTableProps()`.
    minWidth: 'fit-content',
  },
});

/**
 * A single column's flexbox overrides for `columnFlexOptions`.
 */
export type DataGridColumnFlexOption = {
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: React.CSSProperties['flexBasis'];
  minWidth?: React.CSSProperties['minWidth'];
  maxWidth?: React.CSSProperties['maxWidth'];
};

/**
 * Per-column flexbox overrides, keyed by `columnId`. Same keying convention as
 * `TableColumnSizingOptions`, but carries flexbox properties instead of pixel widths.
 */
export type DataGridColumnFlexOptions = Record<TableColumnId, DataGridColumnFlexOption>;

const DataGridColumnFlexOptionsContext = React.createContext<DataGridColumnFlexOptions | undefined>(
  undefined,
);

/**
 * @internal Consumed by this package's `DataGridHeaderCell`/`DataGridCell` wrappers to resolve
 * the current column's `columnFlexOptions` override (via `useColumnIdContext()`) into an inline
 * style.
 */
export function useDataGridColumnFlexStyle(
  columnId: TableColumnId,
): React.CSSProperties | undefined {
  const columnFlexOptions = React.useContext(DataGridColumnFlexOptionsContext);
  const options = columnFlexOptions?.[columnId];
  if (!options) {
    return undefined;
  }
  return {
    flexGrow: options.flexGrow,
    flexShrink: options.flexShrink,
    flexBasis: options.flexBasis,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
  };
}

export type DataGridProps = FluentDataGridProps & {
  /**
   * CSS-only per-column flexbox overrides, keyed by `columnId` (same convention as
   * `columnSizingOptions`). Automatically picked up by this package's `DataGridHeaderCell`
   * and `DataGridCell` wrappers — no need to read `columnId` off the render prop yourself.
   *
   * Intended for static/non-resizable layouts. Not supported in combination with
   * `resizableColumns` — that takes precedence when both are set.
   */
  columnFlexOptions?: DataGridColumnFlexOptions;
};

export const DataGrid: ForwardRefComponent<DataGridProps> = React.forwardRef<
  HTMLDivElement,
  DataGridProps
>((props, ref) => {
  const {
    columnFlexOptions,
    resizableColumns,
    selectionAppearance = 'neutral',
    className,
    ...rest
  } = props;
  const styles = useStyles();

  if (columnFlexOptions && resizableColumns) {
    console.warn(
      'DataGrid: `columnFlexOptions` is ignored when `resizableColumns` is set — ' +
        "the two column-sizing mechanisms aren't designed to be combined.",
    );
  }

  const useColumnFlexOptions = Boolean(columnFlexOptions) && !resizableColumns;

  const grid = (
    <FluentDataGrid
      {...rest}
      ref={ref}
      resizableColumns={resizableColumns}
      selectionAppearance={selectionAppearance}
      className={mergeClasses(useColumnFlexOptions && styles.columnFlexOptions, className)}
    />
  );

  if (!useColumnFlexOptions) {
    return grid;
  }

  return (
    <DataGridColumnFlexOptionsContext.Provider value={columnFlexOptions}>
      {grid}
    </DataGridColumnFlexOptionsContext.Provider>
  );
}) as ForwardRefComponent<DataGridProps>;

DataGrid.displayName = 'DataGrid';
