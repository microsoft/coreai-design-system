// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { DataGridHeader, DataGridRow, createTableColumn } from '@fluentui/react-components';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { DataGrid } from './DataGrid.js';
import { DataGridHeaderCell } from './DataGridHeaderCell.js';

type Item = { primary: string; secondary: string };

const items: Item[] = [{ primary: 'Primary value', secondary: 'Secondary value' }];
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function TestDataGridHeaderCell({ resizableColumns = false }: { resizableColumns?: boolean }) {
  return (
    <DataGrid
      aria-label="Flexible headers"
      items={items}
      columns={columns}
      resizableColumns={resizableColumns}
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
      <DataGridHeader>
        <DataGridRow>
          {({ columnId, renderHeaderCell }) => (
            <DataGridHeaderCell
              data-testid={`header-${String(columnId)}`}
              {...(columnId === 'primary' ? { style: { flexGrow: 7, minWidth: '140px' } } : {})}
            >
              {renderHeaderCell()}
            </DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
    </DataGrid>
  );
}

test('applies each column flex option and gives consumer header styles precedence', async () => {
  const screen = await renderCoreAIComponent(<TestDataGridHeaderCell />);
  const primary = screen.getByTestId('header-primary').element();
  const secondary = screen.getByTestId('header-secondary').element();

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

test('preserves resizable column sizing instead of applying header flex options', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = await renderCoreAIComponent(<TestDataGridHeaderCell resizableColumns />);
  const secondary = screen.getByTestId('header-secondary').element();

  expect(secondary.style.flexBasis).not.toBe('80px');
  expect(secondary.style.minWidth).not.toBe('80px');
  expect(secondary.style.width).not.toBe('');
  expect(secondary.style.minWidth).toBe(secondary.style.width);
  expect(secondary.style.maxWidth).toBe(secondary.style.width);
});
