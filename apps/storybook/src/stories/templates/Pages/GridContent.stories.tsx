// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GridContent } from './GridContent';
const meta = {
  title: 'Templates/Pages/Grid Content',
  component: GridContent,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof GridContent>;
/** Copy-paste template — not an importable component. Copy `templates-pages-grid-content--source-code` and required templates. Use as a Tabbed Page Layout child; Collection Page adds a standalone header. @summary Padded, scrollable collection content without an extra page heading. */
export default meta;
/** Minimal grid content suitable for a tab outlet. */
export const Default: StoryObj = {
  render: () => (
    <GridContent
      dataGridProps={{
        'aria-label': 'Items',
        items: ['First item', 'Second item'],
        getRowId: (item) => item,
        columns: [
          {
            columnId: 'name',
            compare: (first, second) => first.localeCompare(second),
            renderHeaderCell: () => 'Name',
            renderCell: (item) => item,
            onSearch: (query, item) => item.toLowerCase().includes(query.toLowerCase()),
          },
        ],
      }}
    />
  ),
};
