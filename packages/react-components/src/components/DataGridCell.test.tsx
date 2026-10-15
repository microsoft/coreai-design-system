// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DataGridBody,
  DataGridRow,
  TableCellLayout,
  createTableColumn,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DataGrid } from './DataGrid.js';
import { DataGridCell } from './DataGridCell.js';

type Item = { primary: string; secondary: string };

const items: Item[] = [
  {
    primary: 'A long primary value that needs truncation',
    secondary: 'Secondary value',
  },
];
const columns = [
  createTableColumn<Item>({
    columnId: 'primary',
    renderHeaderCell: () => 'Primary',
    renderCell: (item) => item.primary,
  }),
  createTableColumn<Item>({
    columnId: 'secondary',
    renderHeaderCell: () => 'Secondary',
    renderCell: (item) => item.secondary,
  }),
];

afterEach(cleanup);

function TestDataGridCell({ truncate = false }: { truncate?: boolean }) {
  return (
    <DataGrid
      aria-label="Flexible cells"
      items={items}
      columns={columns}
      columnFlexOptions={{
        primary: {
          flexGrow: 2,
          flexShrink: 0,
          flexBasis: '40%',
          minWidth: '120px',
          maxWidth: '300px',
        },
        secondary: { flexGrow: 1, flexShrink: 1, flexBasis: '80px', minWidth: '80px' },
      }}
    >
      <DataGridBody<Item>>
        {({ item, rowId }) => (
          <DataGridRow key={rowId}>
            {({ columnId, renderCell }) => (
              <DataGridCell
                data-testid={`cell-${String(columnId)}`}
                style={columnId === 'primary' ? { flexGrow: 7, minWidth: '140px' } : undefined}
              >
                {columnId === 'primary' && truncate ? (
                  <TableCellLayout truncate>{renderCell(item)}</TableCellLayout>
                ) : (
                  renderCell(item)
                )}
              </DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}

test('applies each column flex option and gives consumer cell styles precedence', async () => {
  const screen = await renderCoreAIComponent(<TestDataGridCell />);
  const primary = screen.getByTestId('cell-primary').element();
  const secondary = screen.getByTestId('cell-secondary').element();

  expect(primary.style.flexGrow).toBe('7');
  expect(primary.style.flexShrink).toBe('0');
  expect(primary.style.flexBasis).toBe('40%');
  expect(primary.style.minWidth).toBe('140px');
  expect(primary.style.maxWidth).toBe('300px');

  expect(secondary.style.flexGrow).toBe('1');
  expect(secondary.style.flexShrink).toBe('1');
  expect(secondary.style.flexBasis).toBe('80px');
  expect(secondary.style.minWidth).toBe('80px');
});

test('preserves TableCellLayout truncation inside a flex-sized cell', async () => {
  const screen = await renderCoreAIComponent(<TestDataGridCell truncate />);
  const primary = screen.getByTestId('cell-primary').element();
  const main = primary.querySelector<HTMLElement>('.fui-TableCellLayout__main')!;
  const styles = getComputedStyle(main);

  expect(styles.overflowX).toBe('hidden');
  expect(styles.textOverflow).toBe('ellipsis');
  expect(styles.whiteSpace).toBe('nowrap');
});
