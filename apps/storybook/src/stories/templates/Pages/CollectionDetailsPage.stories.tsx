// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Badge, Button, Field, Text, Textarea } from '@coreai-ds/react-components';
import { CollectionDetailsPage } from './CollectionDetailsPage';
const meta = {
  title: 'Templates/Pages/Collection Details Page',
  component: CollectionDetailsPage,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof CollectionDetailsPage>;
/** Copy-paste template — not an importable component. Copy `templates-pages-collection-details-page--source-code` and dependencies. Combines Page Layout, Page Header, and Grid Details Content; requires a stable, unique getRowId. @summary Standalone collection with row-driven responsive details and focus restoration. */
export default meta;
/** Select a row to inspect it; deleting the selected item closes its details. */
export const Default: StoryObj = {
  render: () => {
    const [items, setItems] = React.useState(
      Array.from({ length: 36 }, (_, index) => ({
        id: `item-${index + 1}`,
        name: `Item ${index + 1}`,
        status: index % 3 ? 'Active' : 'Draft',
        category: index % 2 ? 'Shared' : 'Personal',
      })),
    );
    const [notes, setNotes] = React.useState<Record<string, string>>({});
    const styles = /* css */ `.collection-details-example { height: 100dvh; } .collection-details-example__stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--spacingVerticalL); min-width: 0; } .collection-details-example__stack > div:has(textarea) { align-self: stretch; } .collection-details-example__stack h3 { margin: 0; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="collection-details-example">
          <CollectionDetailsPage
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
                        id: `new-${items.length}`,
                        name: `New item ${items.length + 1}`,
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
            renderDetails={(id) => {
              const item = items.find((candidate) => candidate.id === id);
              return item
                ? {
                    title: item.name,
                    content: (
                      <div className="collection-details-example__stack">
                        <Badge
                          appearance="tint"
                          color={item.status === 'Active' ? 'success' : 'informative'}
                        >
                          {item.status}
                        </Badge>
                        <Text as="h3" preset="heading4">
                          Category
                        </Text>
                        <Text preset="body">{item.category}</Text>
                        <Text preset="body" foreground={2}>
                          Workspace: Main workspace
                        </Text>
                        <Field label="Review notes">
                          <Textarea
                            rows={5}
                            value={notes[id] ?? ''}
                            onChange={(_, data) =>
                              setNotes((previous) => ({ ...previous, [id]: data.value }))
                            }
                          />
                        </Field>
                      </div>
                    ),
                    headerActions: (
                      <Button
                        onClick={() => setItems(items.filter((candidate) => candidate.id !== id))}
                      >
                        Delete
                      </Button>
                    ),
                  }
                : undefined;
            }}
          />
        </div>
      </>
    );
  },
};
