// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Templates / Filterable List
 *
 * Browse page with a toolbar (search + filter dropdowns) above a sortable,
 * single-select DataGrid. Mirrors the "All Resources" pattern in Azure AI
 * Foundry.
 *
 * Copy-paste starting point. Import `FilterableList` directly or use
 * `?raw` to get the source for a "Show code" panel. Replace ITEMS and
 * COLUMNS with your own data shape and column definitions.
 */

import * as React from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Dropdown,
  Option,
  Link,
  Text,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  TableRowId,
  createTableColumn,
  useTableFeatures,
  useTableSelection,
  useTableSort,
  TableCellLayout,
} from '@coreai-ds/react-components';
import { ChevronLeftRegular, ChevronRightRegular, SearchRegular } from '@fluentui/react-icons';

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // ── Page root ─────────────────────────────────────────────────────────────
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalXL,
    gap: tokens.spacingVerticalM,
    boxSizing: 'border-box',
  },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  searchInput: {
    minWidth: '240px',
    flexShrink: 0,
  },
  // ── Grid container ────────────────────────────────────────────────────────
  gridContainer: {
    flex: '1 1 0%',
    overflow: 'auto',
  },

  // ── Pagination footer ─────────────────────────────────────────────────────
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalXS,
  },
  paginationNav: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
});

// ─── Data ─────────────────────────────────────────────────────────────────────

type ResourceType = 'Foundry' | 'Project';

interface ResourceItem {
  id: string;
  name: string;
  type: ResourceType;
  parentResource: string | null;
  subscription: string;
  region: string;
  createdBy: string;
}

const ITEMS: ResourceItem[] = [
  {
    id: '1',
    name: 'my-foundry-resource',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription A',
    region: 'East US',
    createdBy: 'user.a@contoso.com',
  },
  {
    id: '2',
    name: 'team-project-alpha',
    type: 'Project',
    parentResource: 'my-foundry-resource',
    subscription: 'Subscription A',
    region: 'East US',
    createdBy: 'user.a@contoso.com',
  },
  {
    id: '3',
    name: 'research-hub',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription A',
    region: 'West US',
    createdBy: 'user.b@contoso.com',
  },
  {
    id: '4',
    name: 'nlp-project',
    type: 'Project',
    parentResource: 'research-hub',
    subscription: 'Subscription A',
    region: 'West US',
    createdBy: 'user.b@contoso.com',
  },
  {
    id: '5',
    name: 'vision-project',
    type: 'Project',
    parentResource: 'research-hub',
    subscription: 'Subscription A',
    region: 'West US',
    createdBy: 'user.c@contoso.com',
  },
  {
    id: '6',
    name: 'prod-foundry-eastus2',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription B',
    region: 'East US 2',
    createdBy: 'user.c@contoso.com',
  },
  {
    id: '7',
    name: 'inference-project',
    type: 'Project',
    parentResource: 'prod-foundry-eastus2',
    subscription: 'Subscription B',
    region: 'East US 2',
    createdBy: 'user.d@contoso.com',
  },
  {
    id: '8',
    name: 'fine-tuning-project',
    type: 'Project',
    parentResource: 'prod-foundry-eastus2',
    subscription: 'Subscription B',
    region: 'East US 2',
    createdBy: 'user.d@contoso.com',
  },
  {
    id: '9',
    name: 'eu-foundry-resource',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription B',
    region: 'West Europe',
    createdBy: 'user.e@contoso.com',
  },
  {
    id: '10',
    name: 'translation-project',
    type: 'Project',
    parentResource: 'eu-foundry-resource',
    subscription: 'Subscription B',
    region: 'West Europe',
    createdBy: 'user.e@contoso.com',
  },
  {
    id: '11',
    name: 'embeddings-project',
    type: 'Project',
    parentResource: 'eu-foundry-resource',
    subscription: 'Subscription B',
    region: 'West Europe',
    createdBy: 'user.a@contoso.com',
  },
  {
    id: '12',
    name: 'apac-foundry-resource',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription A',
    region: 'Southeast Asia',
    createdBy: 'user.b@contoso.com',
  },
  {
    id: '13',
    name: 'speech-project',
    type: 'Project',
    parentResource: 'apac-foundry-resource',
    subscription: 'Subscription A',
    region: 'Southeast Asia',
    createdBy: 'user.c@contoso.com',
  },
  {
    id: '14',
    name: 'summarization-project',
    type: 'Project',
    parentResource: 'apac-foundry-resource',
    subscription: 'Subscription A',
    region: 'Southeast Asia',
    createdBy: 'user.d@contoso.com',
  },
  {
    id: '15',
    name: 'dev-foundry-westus3',
    type: 'Foundry',
    parentResource: null,
    subscription: 'Subscription A',
    region: 'West US 3',
    createdBy: 'user.e@contoso.com',
  },
  {
    id: '16',
    name: 'chatbot-project',
    type: 'Project',
    parentResource: 'dev-foundry-westus3',
    subscription: 'Subscription A',
    region: 'West US 3',
    createdBy: 'user.a@contoso.com',
  },
];

const PAGE_SIZE = 5;

const ALL_TYPES = Array.from(new Set(ITEMS.map((i) => i.type)));
const ALL_REGIONS = Array.from(new Set(ITEMS.map((i) => i.region))).sort();
const ALL_SUBS = Array.from(new Set(ITEMS.map((i) => i.subscription))).sort();

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: TableColumnDefinition<ResourceItem>[] = [
  createTableColumn<ResourceItem>({
    columnId: 'name',
    compare: (a, b) => a.name.localeCompare(b.name),
    renderHeaderCell: () => 'Name',
    renderCell: (item) => item.name,
  }),
  createTableColumn<ResourceItem>({
    columnId: 'type',
    compare: (a, b) => a.type.localeCompare(b.type),
    renderHeaderCell: () => 'Type',
    renderCell: (item) => item.type,
  }),
  createTableColumn<ResourceItem>({
    columnId: 'parentResource',
    compare: (a, b) => (a.parentResource ?? '').localeCompare(b.parentResource ?? ''),
    renderHeaderCell: () => 'Parent resource',
    renderCell: (_item) => null, // overridden inline in DataGridBody
  }),
  createTableColumn<ResourceItem>({
    columnId: 'subscription',
    compare: (a, b) => a.subscription.localeCompare(b.subscription),
    renderHeaderCell: () => 'Subscription',
    renderCell: (item) => item.subscription,
  }),
  createTableColumn<ResourceItem>({
    columnId: 'region',
    compare: (a, b) => a.region.localeCompare(b.region),
    renderHeaderCell: () => 'Region',
    renderCell: (item) => item.region,
  }),
  createTableColumn<ResourceItem>({
    columnId: 'createdBy',
    compare: (a, b) => a.createdBy.localeCompare(b.createdBy),
    renderHeaderCell: () => 'Created by',
    renderCell: (item) => item.createdBy,
  }),
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterableList() {
  const styles = useStyles();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<Set<string>>(new Set());
  const [subFilter, setSubFilter] = React.useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);

  // ── Derived filtered rows ─────────────────────────────────────────────────
  const filteredItems = React.useMemo(() => {
    const q = search.toLowerCase();
    return ITEMS.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q) && !item.createdBy.toLowerCase().includes(q))
        return false;
      if (typeFilter.size && !typeFilter.has(item.type)) return false;
      if (subFilter.size && !subFilter.has(item.subscription)) return false;
      if (regionFilter.size && !regionFilter.has(item.region)) return false;
      return true;
    });
  }, [search, typeFilter, subFilter, regionFilter]);

  // ── DataGrid features ─────────────────────────────────────────────────────
  const {
    getRows,
    selection: { toggleRow, isRowSelected },
    sort: { getSortDirection, toggleColumnSort },
  } = useTableFeatures({ columns: COLUMNS, items: filteredItems }, [
    useTableSort({ defaultSortState: { sortColumn: 'name', sortDirection: 'ascending' } }),
    useTableSelection({ selectionMode: 'single' }),
  ]);

  // Reset to page 1 whenever filters or search change
  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, subFilter, regionFilter]);

  // getRows() applies sort order; slice for current page
  const sortedItems = getRows().map((r) => r.item);
  const totalCount = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startRow = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(safePage * PAGE_SIZE, totalCount);
  const pageItems = sortedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Dropdown change helpers ───────────────────────────────────────────────
  const makeDropdownHandler =
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    (_: unknown, data: { selectedOptions: string[] }) =>
      setter(data.selectedOptions.length > 0 ? new Set(data.selectedOptions) : new Set());

  return (
    <div className={styles.root}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <Input
          className={styles.searchInput}
          contentBefore={<SearchRegular />}
          placeholder="Search"
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          aria-label="Search resources"
        />

        <Dropdown
          label="Type"
          multiselect
          dynamicWidth
          clearable
          selectedOptions={Array.from(typeFilter)}
          onOptionSelect={makeDropdownHandler(setTypeFilter)}
        >
          {ALL_TYPES.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Dropdown>

        <Dropdown
          label="Subscription"
          multiselect
          dynamicWidth
          clearable
          selectedOptions={Array.from(subFilter)}
          onOptionSelect={makeDropdownHandler(setSubFilter)}
        >
          {ALL_SUBS.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Dropdown>

        <Dropdown
          label="Region"
          multiselect
          dynamicWidth
          clearable
          selectedOptions={Array.from(regionFilter)}
          onOptionSelect={makeDropdownHandler(setRegionFilter)}
        >
          {ALL_REGIONS.map((r) => (
            <Option key={r} value={r}>
              {r}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* ── DataGrid ── */}
      <div className={styles.gridContainer}>
        <DataGrid
          items={pageItems}
          columns={COLUMNS}
          sortable
          selectionMode="single"
          getRowId={(item) => item.id as TableRowId}
          focusMode="composite"
          aria-label="Resources"
        >
          <DataGridHeader>
            <DataGridRow selectionCell={{ 'aria-label': 'Select all rows' }}>
              {({ renderHeaderCell, columnId }) => (
                <DataGridHeaderCell
                  sortDirection={getSortDirection(columnId)}
                  onClick={(e: React.MouseEvent) => toggleColumnSort(e, columnId)}
                >
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>

          <DataGridBody<ResourceItem>>
            {({ item, rowId }) => {
              const selected = isRowSelected(rowId);
              return (
                <DataGridRow<ResourceItem>
                  key={rowId as string}
                  appearance={selected ? 'brand' : 'none'}
                  onClick={(e: React.MouseEvent) => toggleRow(e, rowId)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                      toggleRow(e, rowId);
                    }
                  }}
                  selectionCell={{
                    'aria-label': `Select ${item.name}`,
                    radioIndicator: { 'aria-label': `Select ${item.name}` },
                  }}
                >
                  {({ renderCell, columnId }) => (
                    <DataGridCell>
                      {columnId === 'name' ? (
                        <TableCellLayout>
                          <Link href="#" onClick={(e) => e.preventDefault()}>
                            {item.name}
                          </Link>
                        </TableCellLayout>
                      ) : columnId === 'parentResource' ? (
                        <TableCellLayout>
                          {item.parentResource ? (
                            <Link href="#" onClick={(e) => e.preventDefault()}>
                              {item.parentResource}
                            </Link>
                          ) : (
                            <Text style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                          )}
                        </TableCellLayout>
                      ) : (
                        <TableCellLayout>{renderCell(item)}</TableCellLayout>
                      )}
                    </DataGridCell>
                  )}
                </DataGridRow>
              );
            }}
          </DataGridBody>
        </DataGrid>
      </div>

      {/* ── Pagination ── */}
      <div className={styles.pagination}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          {totalCount === 0 ? 'No results' : `${startRow}–${endRow} of ${totalCount}`}
        </Text>
        <div className={styles.paginationNav}>
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            iconPosition="before"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            Prev
          </Button>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            iconPosition="after"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
