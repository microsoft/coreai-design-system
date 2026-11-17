// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { MenuItem } from '@coreai-ds/react-components';
import { createMenuColumn } from './createMenuColumn';
import { DataGridWithFilters } from './DataGridWithFilters';
const meta = {
  title: 'Templates/Data Grid With Filters/Create Menu Column',
  parameters: { layout: 'fullscreen', centered: false },
} satisfies Meta;
/** Copy-paste template — not an importable component. Copy `templates-data-grid-with-filters-create-menu-column--source-code` and its required templates. @summary Accessible per-row action menus for DataGridWithFilters. */
export default meta;
/** Row menus use unique labels and do not select the row when opened. */
export const Default: StoryObj = {
  render: () => {
    const [items, setItems] = React.useState([
      { id: 1, name: 'Website refresh', owner: 'Alex Morgan', status: 'Active' },
      { id: 2, name: 'Customer portal', owner: 'Sam Rivera', status: 'Draft' },
      { id: 3, name: 'Usage analytics', owner: 'Jordan Lee', status: 'Active' },
      { id: 4, name: 'Help center', owner: 'Alex Morgan', status: 'In review' },
      { id: 5, name: 'Mobile onboarding', owner: 'Sam Rivera', status: 'Draft' },
      { id: 6, name: 'Release dashboard', owner: 'Jordan Lee', status: 'Active' },
    ]);
    return (
      <DataGridWithFilters
        aria-label="Item actions"
        enableSearch={false}
        items={items}
        getRowId={(item) => item.id}
        columns={[
          {
            columnId: 'name',
            compare: () => 0,
            renderHeaderCell: () => 'Name',
            renderCell: (item) => item.name,
          },
          {
            columnId: 'owner',
            compare: (first, second) => first.owner.localeCompare(second.owner),
            renderHeaderCell: () => 'Owner',
            renderCell: (item) => item.owner,
          },
          {
            columnId: 'status',
            compare: (first, second) => first.status.localeCompare(second.status),
            renderHeaderCell: () => 'Status',
            renderCell: (item) => item.status,
          },
          createMenuColumn<(typeof items)[number]>({
            getLabel: (item) => `Actions for ${item.name}`,
            renderMenuItems: (item) => (
              <MenuItem
                onClick={() => setItems(items.filter((candidate) => candidate.id !== item.id))}
              >
                Delete
              </MenuItem>
            ),
          }),
        ]}
      />
    );
  },
};
