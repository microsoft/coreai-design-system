// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GridDetailsContent } from './GridDetailsContent';
import { PageLayout } from './PageLayout';
const meta = {
  title: 'Templates/Pages/Grid Details Content',
  component: GridDetailsContent,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof GridDetailsContent>;
/** Copy-paste template — not an importable component. Copy `templates-pages-grid-details-content--source-code` and dependencies. Requires a stable, unique getRowId; callers render details. Use in Tabbed Page Layout or Sidebar Layout without extra body padding. @summary Single-selection grid with responsive details, stable IDs, and focus return. */
export default meta;
/** Grid and details without a page header, ready for nested tab content. */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `.grid-details-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="grid-details-example">
          <PageLayout scrollMode="panes">
            <GridDetailsContent
              dataGridProps={{
                'aria-label': 'Items',
                items: ['First item', 'Second item'],
                getRowId: (item) => item,
                columns: [
                  {
                    columnId: 'name',
                    compare: () => 0,
                    renderHeaderCell: () => 'Name',
                    renderCell: (item) => item,
                    onSearch: (query, item) => item.toLowerCase().includes(query.toLowerCase()),
                  },
                ],
              }}
              renderDetails={(id) => ({ title: String(id), content: 'Ready for review' })}
            />
          </PageLayout>
        </div>
      </>
    );
  },
};
