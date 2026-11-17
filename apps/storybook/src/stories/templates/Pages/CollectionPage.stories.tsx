// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from '@coreai-ds/react-components';
import { CollectionPage } from './CollectionPage';
const meta = {
  title: 'Templates/Pages/Collection Page',
  component: CollectionPage,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof CollectionPage>;
/** Copy-paste template — not an importable component. Copy `templates-pages-collection-page--source-code` and required templates, including Data Grid With Filters. Use Grid Content inside tabs. @summary Standalone collection with populated, empty, and loading examples. */
export default meta;
/** A collection header with count and locally working create action. */
export const Default: StoryObj = {
  render: () => {
    const [items, setItems] = React.useState(
      Array.from({ length: 36 }, (_, index) => ({
        id: index + 1,
        name: `Item ${String(index + 1).padStart(2, '0')}`,
        status: index % 3 ? 'Active' : 'Draft',
        category: index % 2 ? 'Shared' : 'Personal',
      })),
    );
    const styles = /* css */ `.collection-page-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="collection-page-example">
          <CollectionPage
            headerProps={{
              title: 'Items',
              count: items.length,
              headerActions: (
                <Button
                  appearance="primary"
                  onClick={() =>
                    setItems([
                      ...items,
                      {
                        id: items.length + 1,
                        name: `Item ${items.length + 1}`,
                        status: 'Draft',
                        category: 'Personal',
                      },
                    ])
                  }
                >
                  Create item
                </Button>
              ),
            }}
            dataGridProps={{
              'aria-label': 'Items',
              items,
              getRowId: (item) => item.id,
              sortable: true,
              searchLabel: 'Search items',
              paginationOptions: { maxItemsPerPage: 12 },
              columns: [
                {
                  columnId: 'name',
                  compare: (first, second) => first.name.localeCompare(second.name),
                  renderHeaderCell: () => 'Name',
                  renderCell: (item) => item.name,
                  onSearch: (query, item) => item.name.toLowerCase().includes(query.toLowerCase()),
                },
                {
                  columnId: 'status',
                  compare: (first, second) => first.status.localeCompare(second.status),
                  renderHeaderCell: () => 'Status',
                  renderCell: (item) => item.status,
                },
                {
                  columnId: 'category',
                  compare: (first, second) => first.category.localeCompare(second.category),
                  renderHeaderCell: () => 'Category',
                  renderCell: (item) => item.category,
                },
              ],
            }}
          />
        </div>
      </>
    );
  },
};
/** The count remains visible when there are no rows. */
export const Empty: StoryObj = {
  render: () => {
    const styles = /* css */ `.collection-empty-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="collection-empty-example">
          <CollectionPage
            headerProps={{ title: 'Items', count: 0 }}
            dataGridProps={{
              'aria-label': 'Items',
              items: [] as string[],
              columns: [
                {
                  columnId: 'name',
                  compare: () => 0,
                  renderHeaderCell: () => 'Name',
                  renderCell: (item) => item,
                },
              ],
            }}
          />
        </div>
      </>
    );
  },
};
/** Grid loading is passed through dataGridProps rather than an ambiguous page-level flag. */
export const Loading: StoryObj = {
  render: () => {
    const [loading, setLoading] = React.useState(true);
    const styles = /* css */ `.collection-loading-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="collection-loading-example">
          <CollectionPage
            headerProps={{
              title: 'Items',
              headerActions: (
                <Button onClick={() => setLoading(!loading)}>
                  {loading ? 'Finish loading' : 'Reload'}
                </Button>
              ),
            }}
            dataGridProps={{
              'aria-label': 'Items',
              items: ['First item'],
              isLoading: loading,
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
          />
        </div>
      </>
    );
  },
};
