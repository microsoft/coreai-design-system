// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DataGridBody,
  DataGridHeader,
  DataGridRow,
  createTableColumn,
  type DataGridProps as FluentDataGridProps,
} from '@fluentui/react-components';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DataGrid, type DataGridProps } from './DataGrid.js';
import { DataGridCell } from './DataGridCell.js';
import { DataGridHeaderCell } from './DataGridHeaderCell.js';

type Item = { name: string };

const items: Item[] = [{ name: 'Ada' }];
const columns = [
  createTableColumn<Item>({
    columnId: 'name',
    renderHeaderCell: () => 'Name',
    renderCell: (item) => item.name,
  }),
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function TestDataGrid({
  label,
  checkboxLabel,
  ...props
}: Pick<DataGridProps, 'columnFlexOptions' | 'resizableColumns' | 'selectionAppearance'> & {
  label: string;
  checkboxLabel?: string;
}) {
  const selectionProps: Pick<FluentDataGridProps, 'selectionMode'> = checkboxLabel
    ? { selectionMode: 'multiselect' }
    : {};

  return (
    <DataGrid aria-label={label} items={items} columns={columns} {...selectionProps} {...props}>
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<Item>>
        {({ item, rowId }) => (
          <DataGridRow
            key={rowId}
            selectionCell={
              checkboxLabel ? { checkboxIndicator: { 'aria-label': checkboxLabel } } : undefined
            }
          >
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}

test('defaults selection appearance to neutral and allows explicit brand selection', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <TestDataGrid label="Default selection" checkboxLabel="Select default row" />
      <TestDataGrid
        label="Neutral selection"
        checkboxLabel="Select neutral row"
        selectionAppearance="neutral"
      />
      <TestDataGrid
        label="Brand selection"
        checkboxLabel="Select brand row"
        selectionAppearance="brand"
      />
    </>,
  );

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select default row' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select neutral row' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select brand row' }));

  const selectedRowBackground = (label: string) => {
    const grid = screen.getByRole('grid', { name: label }).element();
    const bodyRow = grid.querySelector<HTMLElement>('.fui-DataGridBody .fui-DataGridRow')!;
    return getComputedStyle(bodyRow).backgroundColor;
  };
  const defaultBackground = selectedRowBackground('Default selection');
  const neutralBackground = selectedRowBackground('Neutral selection');
  const brandBackground = selectedRowBackground('Brand selection');

  expect(defaultBackground).toBe(neutralBackground);
  expect(defaultBackground).not.toBe(brandBackground);
});

test('applies column flex sizing only when columns are not resizable', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = await renderCoreAIComponent(
    <>
      <TestDataGrid
        label="Static sizing"
        columnFlexOptions={{ name: { flexBasis: '777px', minWidth: '777px' } }}
      />
      <TestDataGrid
        label="Resizable sizing"
        columnFlexOptions={{ name: { flexBasis: '777px', minWidth: '777px' } }}
        resizableColumns
      />
    </>,
  );

  const staticGrid = screen.getByRole('grid', { name: 'Static sizing' }).element();
  const resizableGrid = screen.getByRole('grid', { name: 'Resizable sizing' }).element();
  const staticCell = staticGrid.querySelector<HTMLElement>('.fui-DataGridCell')!;
  const resizableCell = resizableGrid.querySelector<HTMLElement>('.fui-DataGridCell')!;

  expect(getComputedStyle(staticGrid).minWidth).toBe('fit-content');
  expect(staticCell.style.flexBasis).toBe('777px');
  expect(staticCell.style.minWidth).toBe('777px');
  expect(resizableCell.style.flexBasis).not.toBe('777px');
  expect(resizableCell.style.minWidth).not.toBe('777px');
  expect(resizableCell.style.width).not.toBe('');
  expect(resizableCell.style.minWidth).toBe(resizableCell.style.width);
  expect(resizableCell.style.maxWidth).toBe(resizableCell.style.width);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('columnFlexOptions'));
});
