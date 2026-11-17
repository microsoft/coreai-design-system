// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShimmerCell } from './ShimmerCell';
import { DataGridWithFilters } from './DataGridWithFilters';
const meta = {
  title: 'Templates/Data Grid With Filters/Shimmer Cell',
  component: ShimmerCell,
  parameters: { layout: 'fullscreen', centered: false },
} satisfies Meta<typeof ShimmerCell>;
/** Copy-paste template — not an importable component. Copy `templates-data-grid-with-filters-shimmer-cell--source-code`. Use while individual cell data is pending. @summary Cell-level loading placeholder. */
export default meta;
/** Keep available row data visible while one field loads. The grid supplies the loading label. */
export const Default: StoryObj = {
  render: () => {
    const items = [
      { id: 1, name: 'Website refresh', owner: 'Alex Morgan' },
      { id: 2, name: 'Customer portal', owner: 'Sam Rivera' },
      { id: 3, name: 'Usage analytics', owner: 'Jordan Lee' },
      { id: 4, name: 'Help center', owner: 'Alex Morgan' },
      { id: 5, name: 'Mobile onboarding', owner: 'Sam Rivera' },
      { id: 6, name: 'Release dashboard', owner: 'Jordan Lee' },
    ];
    return (
      <DataGridWithFilters
        aria-label="Items, details loading"
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
            compare: () => 0,
            renderHeaderCell: () => 'Owner',
            renderCell: (item) => item.owner,
          },
          {
            columnId: 'detail',
            compare: () => 0,
            renderHeaderCell: () => 'Details',
            renderCell: () => <ShimmerCell />,
            interactiveChildren: 'none',
          },
        ]}
      />
    );
  },
};
