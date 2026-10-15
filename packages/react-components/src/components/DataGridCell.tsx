// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `DataGridCell` that automatically applies the current column's
 * `columnFlexOptions` override (set via the `DataGrid` wrapper's `columnFlexOptions`
 * prop) as an inline style.
 *
 * Reads the column id from `useColumnIdContext()` — populated by `DataGridRow`'s
 * internal `ColumnIdContextProvider` — so callers don't need to read `columnId` off
 * the render prop and pass it down manually.
 */
import * as React from 'react';
import {
  DataGridCell as FluentDataGridCell,
  type DataGridCellProps as FluentDataGridCellProps,
  type ForwardRefComponent,
  useColumnIdContext,
} from '@fluentui/react-components';
import { useDataGridColumnFlexStyle } from './DataGrid.js';

export type DataGridCellProps = FluentDataGridCellProps;

export const DataGridCell: ForwardRefComponent<DataGridCellProps> = React.forwardRef<
  HTMLDivElement,
  DataGridCellProps
>((props, ref) => {
  const columnId = useColumnIdContext();
  const flexStyle = useDataGridColumnFlexStyle(columnId);

  // When there is no flex override, omit `style` entirely. Passing `style={undefined}`
  // would replace the width styles that Fluent generates for resizable columns.
  if (!flexStyle) {
    return <FluentDataGridCell {...props} ref={ref} />;
  }

  return <FluentDataGridCell {...props} ref={ref} style={{ ...flexStyle, ...props.style }} />;
}) as ForwardRefComponent<DataGridCellProps>;

DataGridCell.displayName = 'DataGridCell';
