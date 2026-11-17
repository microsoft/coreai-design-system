// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { createColumn } from './createColumn';
import { DataGridWithFilters } from './DataGridWithFilters';
const meta = {
  title: 'Templates/Data Grid With Filters/Create Column',
  parameters: { layout: 'fullscreen', centered: false },
} satisfies Meta;
/** Copy-paste template — not an importable component. Copy `templates-data-grid-with-filters-create-column--source-code` and its required templates. Enhances DataGridWithFilters columns. @summary Informative and unavailable column headers. */
export default meta;
/** Click the Name info button for context; hover or focus the locked header for its access requirement. */
export const Default: StoryObj = {
  render: () => {
    const items = [
      { id: 1, name: 'Website refresh', owner: 'Alex Morgan', status: 'Active' },
      { id: 2, name: 'Customer portal', owner: 'Sam Rivera', status: 'Draft' },
      { id: 3, name: 'Usage analytics', owner: 'Jordan Lee', status: 'Active' },
      { id: 4, name: 'Help center', owner: 'Alex Morgan', status: 'In review' },
      { id: 5, name: 'Mobile onboarding', owner: 'Sam Rivera', status: 'Draft' },
      { id: 6, name: 'Release dashboard', owner: 'Jordan Lee', status: 'Active' },
    ];
    return (
      <DataGridWithFilters
        aria-label="Column headers"
        enableSearch={false}
        items={items}
        getRowId={(item) => item.id}
        columns={[
          createColumn<(typeof items)[number]>(
            {
              columnId: 'name',
              compare: () => 0,
              renderHeaderCell: () => 'Name',
              renderCell: (item) => item.name,
            },
            { infoTooltip: { content: 'Item display name' } },
          ),
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
          createColumn<(typeof items)[number]>(
            {
              columnId: 'restricted',
              compare: () => 0,
              renderHeaderCell: () => 'Private notes',
              renderCell: () => 'Unavailable',
            },
            { disabled: { isDisabled: true, tooltip: 'Additional access is required.' } },
          ),
        ]}
      />
    );
  },
};
