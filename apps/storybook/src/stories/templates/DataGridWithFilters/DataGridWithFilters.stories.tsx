// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button, MenuItem } from '@coreai-ds/react-components';
import { DataGridWithFilters, type TableColumnDefinition } from './DataGridWithFilters';
import { createColumn } from './createColumn';
import { createMenuColumn } from './createMenuColumn';

const meta = {
  title: 'Templates/Data Grid With Filters',
  component: DataGridWithFilters,
  parameters: { layout: 'fullscreen', centered: false },
} satisfies Meta<typeof DataGridWithFilters>;
/**
 * Copy-paste template — not an importable component. Not a package export. Copy the full source and required templates from
 * `templates-data-grid-with-filters--source-code`.
 * Client mode searches, filters, sorts, then paginates. Remote mode receives an already processed page
 * and delegates search/filter/sort/pagination to the caller. Supply getRowId for stable selection.
 * Used by Templates/Pages/Grid Content and Grid Details Content. Custom JSX cells must declare
 * interactiveChildren and provide explicit filter options and matching logic when filterable.
 * @summary Searchable, filterable, sortable grid with selection, paging, loading, and empty states.
 */
export default meta;
type Story = StoryObj;

/** Client-side search and status filters reset pagination; sorting runs before paging. */
export const Default: Story = {
  render: () => {
    const items = Array.from({ length: 36 }, (_, index) => ({
      id: `item-${index + 1}`,
      name: `Item ${String(index + 1).padStart(2, '0')}`,
      status: index % 3 ? 'Active' : 'Draft',
      owner: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee'][index % 3],
      category: index % 2 ? 'Shared' : 'Personal',
    }));
    const columns: TableColumnDefinition<(typeof items)[number]>[] = [
      {
        columnId: 'name',
        renderHeaderCell: () => 'Name',
        renderCell: (item) => item.name,
        compare: (first, second) => first.name.localeCompare(second.name),
        onSearch: (query, item) => item.name.toLowerCase().includes(query.toLowerCase()),
      },
      {
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => item.status,
        compare: (first, second) => first.status.localeCompare(second.status),
        filterOptions: { showFilter: true, label: 'Status' },
      },
      {
        columnId: 'owner',
        renderHeaderCell: () => 'Owner',
        renderCell: (item) => item.owner,
        compare: (first, second) => first.owner.localeCompare(second.owner),
      },
      {
        columnId: 'category',
        renderHeaderCell: () => 'Category',
        renderCell: (item) => item.category,
        compare: (first, second) => first.category.localeCompare(second.category),
      },
    ];
    return (
      <DataGridWithFilters
        aria-label="Items"
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        sortable
        paginationOptions={{ maxItemsPerPage: 12 }}
      />
    );
  },
};

/** Selection and row actions are independent. Helpers add informative headers and per-row menus. */
export const SelectionAndActions: Story = {
  render: () => {
    const [items, setItems] = React.useState([
      { id: 'first', name: 'Website refresh', owner: 'Alex Morgan', status: 'Active' },
      { id: 'second', name: 'Customer portal', owner: 'Sam Rivera', status: 'Draft' },
      { id: 'third', name: 'Usage analytics', owner: 'Jordan Lee', status: 'Active' },
      { id: 'fourth', name: 'Help center', owner: 'Alex Morgan', status: 'In review' },
      { id: 'fifth', name: 'Mobile onboarding', owner: 'Sam Rivera', status: 'Draft' },
      { id: 'sixth', name: 'Release dashboard', owner: 'Jordan Lee', status: 'Active' },
    ]);
    const [selected, setSelected] = React.useState<Set<string | number>>(new Set());
    const columns: TableColumnDefinition<(typeof items)[number]>[] = [
      createColumn<(typeof items)[number]>(
        {
          columnId: 'name',
          renderHeaderCell: () => 'Name',
          renderCell: (item) => item.name,
          compare: (first, second) => first.name.localeCompare(second.name),
          onSearch: (query, item) => item.name.toLowerCase().includes(query.toLowerCase()),
        },
        { infoTooltip: { content: 'The display name of this item.' } },
      ),
      {
        columnId: 'owner',
        renderHeaderCell: () => 'Owner',
        renderCell: (item) => item.owner,
        compare: (first, second) => first.owner.localeCompare(second.owner),
      },
      {
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => item.status,
        compare: (first, second) => first.status.localeCompare(second.status),
      },
      createMenuColumn<(typeof items)[number]>({
        getLabel: (item) => `Actions for ${item.name}`,
        renderMenuItems: (item) => (
          <MenuItem
            onClick={() => {
              setItems((previous) => previous.filter((candidate) => candidate.id !== item.id));
              setSelected((previous) => new Set([...previous].filter((id) => id !== item.id)));
            }}
          >
            Delete
          </MenuItem>
        ),
      }),
    ];
    return (
      <DataGridWithFilters
        aria-label="Selectable items"
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        selectionMode="multiselect"
        selectedItems={selected}
        onSelectionChange={(_, data) => setSelected(new Set(data.selectedItems))}
        belowControls={<span>{selected.size} selected</span>}
      />
    );
  },
};

/** Caller-owned paging and search, demonstrated without a network dependency. @summary Remote-data contract with locally simulated responses. */
export const ControlledPagination: Story = {
  render: () => {
    const [page, setPage] = React.useState(1);
    const [query, setQuery] = React.useState('');
    const items = Array.from({ length: 24 }, (_, index) => ({
      id: index + 1,
      name: `Record ${index + 1}`,
      owner: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee'][index % 3],
      status: index % 3 ? 'Active' : 'Draft',
    })).filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
    const columns: TableColumnDefinition<(typeof items)[number]>[] = [
      {
        columnId: 'name',
        renderHeaderCell: () => 'Name',
        renderCell: (item) => item.name,
        compare: () => 0,
      },
      {
        columnId: 'owner',
        renderHeaderCell: () => 'Owner',
        renderCell: (item) => item.owner,
        compare: () => 0,
      },
      {
        columnId: 'status',
        renderHeaderCell: () => 'Status',
        renderCell: (item) => item.status,
        compare: () => 0,
      },
    ];
    return (
      <DataGridWithFilters
        aria-label="Remote records"
        items={items.slice((page - 1) * 8, page * 8)}
        columns={columns}
        getRowId={(item) => item.id}
        searchValue={query}
        onSearch={(value) => {
          setQuery(value);
          setPage(1);
        }}
        paginationOptions={{
          currentPage: page,
          maxItemsPerPage: 8,
          totalItems: items.length,
          onPrevClicked: () => setPage(page - 1),
          onNextClicked: () => setPage(page + 1),
          isPrevEnabled: () => page > 1,
          isNextEnabled: () => page * 8 < items.length,
        }}
      />
    );
  },
};

/** Loading is explicit and independent of empty results. @summary Switch between pending and loaded data. */
export const Loading: Story = {
  render: () => {
    const [loading, setLoading] = React.useState(true);
    const items = Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      name: `Item ${String(index + 1).padStart(2, '0')}`,
      owner: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee'][index % 3],
      status: index % 3 ? 'Active' : 'Draft',
    }));
    return (
      <DataGridWithFilters
        aria-label="Items"
        items={items}
        getRowId={(item) => item.id}
        columns={[
          {
            columnId: 'name',
            renderHeaderCell: () => 'Name',
            renderCell: (item) => item.name,
            compare: () => 0,
          },
          {
            columnId: 'owner',
            renderHeaderCell: () => 'Owner',
            renderCell: (item) => item.owner,
            compare: () => 0,
          },
          {
            columnId: 'status',
            renderHeaderCell: () => 'Status',
            renderCell: (item) => item.status,
            compare: () => 0,
          },
        ]}
        isLoading={loading}
        enableSearch={false}
        actions={
          <Button onClick={() => setLoading(!loading)}>
            {loading ? 'Finish loading' : 'Reload'}
          </Button>
        }
      />
    );
  },
};

/** A custom empty state reuses Templates/Empty State. @summary Empty data with an action to load sample items. */
export const Empty: Story = {
  render: () => {
    const sampleItems = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      name: `Item ${String(index + 1).padStart(2, '0')}`,
      owner: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee'][index % 3],
      status: index % 3 ? 'Active' : 'Draft',
    }));
    const [items, setItems] = React.useState<typeof sampleItems>([]);
    return (
      <DataGridWithFilters
        aria-label="Items"
        items={items}
        getRowId={(item) => item.id}
        columns={[
          {
            columnId: 'name',
            renderHeaderCell: () => 'Name',
            renderCell: (item) => item.name,
            compare: () => 0,
            onSearch: (query, item) => item.name.toLowerCase().includes(query.toLowerCase()),
          },
          {
            columnId: 'owner',
            renderHeaderCell: () => 'Owner',
            renderCell: (item) => item.owner,
            compare: () => 0,
          },
          {
            columnId: 'status',
            renderHeaderCell: () => 'Status',
            renderCell: (item) => item.status,
            compare: () => 0,
          },
        ]}
        emptyState={{
          actions: (
            <Button appearance="primary" onClick={() => setItems(sampleItems)}>
              Load sample items
            </Button>
          ),
        }}
      />
    );
  },
};
