// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DataGridBody,
  DataGridHeader,
  DataGridRow,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  createTableColumn,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DataGrid } from './DataGrid.js';
import { DataGridCell } from './DataGridCell.js';
import { DataGridHeaderCell } from './DataGridHeaderCell.js';

afterEach(cleanup);

const items = [{ name: 'Ada' }, { name: 'Grace' }];
const columns = [
  createTableColumn<(typeof items)[number]>({
    columnId: 'name',
    renderHeaderCell: () => 'Name',
    renderCell: (item) => item.name,
  }),
];

function TestTable() {
  return (
    <Table aria-label="People table">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.name}>
            <TableCell>{item.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TestDataGrid() {
  return (
    <DataGrid aria-label="People grid" items={items} columns={columns}>
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<(typeof items)[number]>>
        {({ item, rowId }) => (
          <DataGridRow key={rowId}>
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}

test('applies the same CoreAI frame to Table and DataGrid', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <TestTable />
      <TestDataGrid />
    </>,
  );

  const tableStyles = getComputedStyle(
    screen.getByRole('table', { name: 'People table' }).element(),
  );
  const gridStyles = getComputedStyle(screen.getByRole('grid', { name: 'People grid' }).element());

  expect(tableStyles.borderTopWidth).not.toBe('0px');
  expect(tableStyles.borderTopStyle).toBe('solid');
  expect(tableStyles.borderTopColor).toBe(gridStyles.borderTopColor);
  expect(tableStyles.borderTopWidth).toBe(gridStyles.borderTopWidth);
  expect(tableStyles.borderTopStyle).toBe(gridStyles.borderTopStyle);
  expect(tableStyles.borderRadius).toBe(gridStyles.borderRadius);
  expect(tableStyles.overflow).toBe('hidden');
  expect(gridStyles.overflow).toBe('hidden');
  expect(tableStyles.boxSizing).toBe('border-box');
  expect(gridStyles.boxSizing).toBe('border-box');
});

test('places separators on native cells and non-native DataGrid rows', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <TestTable />
      <TestDataGrid />
    </>,
  );

  const table = screen.getByRole('table', { name: 'People table' }).element();
  const grid = screen.getByRole('grid', { name: 'People grid' }).element();
  const tableHeaderCell = table.querySelector<HTMLElement>('.fui-TableHeaderCell')!;
  const tableBodyCells = table.querySelectorAll<HTMLElement>('.fui-TableBody .fui-TableCell');
  const gridRows = grid.querySelectorAll<HTMLElement>('.fui-DataGridRow');

  expect(getComputedStyle(tableHeaderCell).borderBottomWidth).not.toBe('0px');
  expect(getComputedStyle(tableBodyCells[0]).borderBottomWidth).not.toBe('0px');
  expect(getComputedStyle(tableBodyCells[1]).borderBottomWidth).toBe('0px');
  expect(getComputedStyle(gridRows[0]).borderBottomWidth).not.toBe('0px');
  expect(getComputedStyle(gridRows[1]).borderBottomWidth).not.toBe('0px');
  expect(getComputedStyle(gridRows[2]).borderBottomWidth).toBe('0px');
});

test('preserves stock Fluent framing when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <TestTable />
      <TestDataGrid />
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  const tableStyles = getComputedStyle(
    screen.getByRole('table', { name: 'People table' }).element(),
  );
  const gridStyles = getComputedStyle(screen.getByRole('grid', { name: 'People grid' }).element());

  expect(tableStyles.borderTopWidth).toBe('0px');
  expect(tableStyles.overflow).not.toBe('hidden');
  expect(gridStyles.borderTopWidth).toBe('0px');
  expect(gridStyles.overflow).not.toBe('hidden');
});

test('allows consumer inline styles to override the CoreAI table frame', async () => {
  const screen = await renderCoreAIComponent(
    <Table
      aria-label="Custom table"
      style={{ border: '3px dashed rgb(255, 0, 0)', borderRadius: 0, overflow: 'visible' }}
    />,
  );

  const styles = getComputedStyle(screen.getByRole('table', { name: 'Custom table' }).element());

  expect(styles.borderTop).toBe('3px dashed rgb(255, 0, 0)');
  expect(styles.borderRadius).toBe('0px');
  expect(styles.overflow).toBe('visible');
});
