// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Button, Input, MenuItem } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';
import {
  DataGridWithFilters,
  type TableColumnDefinition,
} from '../stories/templates/DataGridWithFilters/DataGridWithFilters';
import { createMenuColumn } from '../stories/templates/DataGridWithFilters/createMenuColumn';
import { LayoutContainer } from '../stories/templates/Pages/LayoutContainer';
import { SidebarLayout } from '../stories/templates/Pages/SidebarLayout';
import { CollectionDetailsPage } from '../stories/templates/Pages/CollectionDetailsPage';
import { GridDetailsContent } from '../stories/templates/Pages/GridDetailsContent';
import { TabbedPageLayout } from '../stories/templates/Pages/TabbedPageLayout';
import { PageBody } from '../stories/templates/Pages/PageBody';
import { PageLayout } from '../stories/templates/Pages/PageLayout';
import { PageHeader } from '../stories/templates/Pages/PageHeader';
import { AppShell } from '../stories/templates/Shell/AppShell';
import { MobileLeftNav } from '../stories/templates/Shell/MobileLeftNav';
import { SearchButton } from '../stories/templates/Search/SearchButton';
import { SearchDialog } from '../stories/templates/Search/SearchDialog';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const items = Array.from({ length: 12 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${String(index + 1).padStart(2, '0')}`,
  status: index < 2 ? 'Draft' : 'Active',
}));
const columns: TableColumnDefinition<(typeof items)[number]>[] = [
  {
    columnId: 'name',
    compare: (first, second) => first.name.localeCompare(second.name),
    renderHeaderCell: () => 'Name',
    renderCell: (item) => item.name,
    onSearch: (query, item) => item.name.toLowerCase().includes(query.toLowerCase()),
  },
  {
    columnId: 'status',
    compare: () => 0,
    renderHeaderCell: () => 'Status',
    renderCell: (item) => item.status,
    filterOptions: { showFilter: true, label: 'Status' },
  },
];

test('matches the original 48px shell bar, 218px rail, 2px gap, and 12px content corner', async () => {
  await page.viewport(1440, 900);
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <AppShell brand="Example App" navigation={[{ to: '/', label: 'Overview' }]}>
        <PageLayout
          header={<PageHeader title="Items" headerActions={<Button>Create item</Button>} />}
        >
          <PageBody>
            <DataGridWithFilters items={items} columns={columns} />
          </PageBody>
        </PageLayout>
      </AppShell>
    </MemoryRouter>,
  );
  const nav = screen.getByRole('navigation', { name: 'Primary navigation' }).element();
  await expect.poll(() => nav.getBoundingClientRect().width).toBe(218);
  const main = screen.getByRole('main').element();
  const mainBounds = main.getBoundingClientRect();
  const root = main.parentElement!.parentElement!;
  expect(mainBounds.top - root.getBoundingClientRect().top).toBe(48);
  expect(mainBounds.left - nav.getBoundingClientRect().right).toBe(2);
  expect(getComputedStyle(main).borderTopLeftRadius).toBe('12px');
  expect(getComputedStyle(main.querySelector('header')!).padding).toBe('20px 24px 12px');
  const search = screen
    .getByRole('searchbox', { name: 'Search', exact: true })
    .element().parentElement!;
  expect(search.getBoundingClientRect().width).toBe(320);
});

test('uses app width rather than remaining page width for sidebar presentation', async () => {
  await page.viewport(1100, 900);
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <AppShell brand="Example App" navigation={[{ to: '/', label: 'Overview' }]}>
        <PageLayout scrollMode="panes">
          <SidebarLayout sidebarTitle="Filters" sidebar="Filter content">
            Main content
          </SidebarLayout>
        </PageLayout>
      </AppShell>
    </MemoryRouter>,
  );
  await expect.element(screen.getByRole('complementary', { name: 'Filters' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Filters', exact: true }).elements()).toHaveLength(0);
});

test('nested page layouts do not remount their content after container measurement', async () => {
  const onMount = vi.fn();
  function Content() {
    React.useEffect(onMount, []);
    return <span>Page content</span>;
  }

  const screen = await renderCoreAIComponent(
    <LayoutContainer style={{ width: 800, height: 600 }}>
      <PageLayout>
        <Content />
      </PageLayout>
    </LayoutContainer>,
  );

  await expect.element(screen.getByText('Page content', { exact: true })).toBeVisible();
  await expect.poll(() => onMount.mock.calls.length).toBe(1);
});

test('keeps the compact desktop rail above 900px and switches to the original mobile drawer at 900px', async () => {
  await page.viewport(950, 900);
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <AppShell brand="Example App" navigation={[{ to: '/', label: 'Overview' }]}>
        <h1>Overview</h1>
      </AppShell>
    </MemoryRouter>,
  );
  await expect
    .poll(
      () =>
        screen
          .getByRole('navigation', { name: 'Primary navigation' })
          .element()
          .getBoundingClientRect().width,
    )
    .toBe(56);
  expect(screen.getByRole('button', { name: 'Open navigation' }).elements()).toHaveLength(0);
  await page.viewport(900, 900);
  await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const drawer = page.getByRole('dialog', { name: 'Navigation', exact: true });
  await expect.element(drawer).toBeVisible();
  expect(drawer.element().getBoundingClientRect().width).toBe(380);
});

test('client search and exact column filters reset pagination and respect custom no-results content', async () => {
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      aria-label="Items"
      items={items}
      columns={columns}
      getRowId={(item) => item.id}
      paginationOptions={{ maxItemsPerPage: 5 }}
      noResultsState={{ header: 'Nothing matched', description: 'Adjust the filters.' }}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Next page', exact: true }));
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 06', exact: true }))
    .toBeVisible();
  await userEvent.click(screen.getByText('Status', { exact: true }).first());
  await userEvent.click(page.getByRole('option', { name: 'Draft', exact: true }));
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 01', exact: true }))
    .toBeVisible();
  await expect
    .element(screen.getByRole('button', { name: 'Previous page', exact: true }))
    .toBeDisabled();
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search', exact: true }), 'missing');
  await expect.element(screen.getByText('Nothing matched', { exact: true })).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search', exact: true }), 'Item 02');
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 02', exact: true }))
    .toBeVisible();
  expect(screen.getByRole('row').elements()).toHaveLength(2);
});

test('renders custom empty state slots and actions', async () => {
  const onAction = vi.fn();
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={[]}
      columns={columns}
      emptyState={{
        illustration: <span>Illustration</span>,
        header: 'No items yet',
        description: 'Create an item to get started.',
        metrics: <span>Metric</span>,
        cards: <span>Card</span>,
        actions: <Button onClick={onAction}>Create item</Button>,
        links: <a href="#help">Help</a>,
      }}
    />,
  );

  await expect.element(screen.getByRole('heading', { name: 'No items yet' })).toBeVisible();
  for (const text of ['Illustration', 'Create an item to get started.', 'Metric', 'Card']) {
    await expect.element(screen.getByText(text, { exact: true })).toBeVisible();
  }
  await expect.element(screen.getByRole('link', { name: 'Help' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Create item' }));
  expect(onAction).toHaveBeenCalledOnce();
});

test('client column filters still apply when notifying the caller', async () => {
  const onFilterChange = vi.fn();
  const notifyingColumns: typeof columns = [
    columns[0],
    {
      ...columns[1],
      filterOptions: {
        ...columns[1].filterOptions!,
        onFilterChange,
      },
    },
  ];
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      aria-label="Items"
      items={items}
      columns={notifyingColumns}
      getRowId={(item) => item.id}
    />,
  );

  await userEvent.click(screen.getByText('Status', { exact: true }).first());
  await userEvent.click(page.getByRole('option', { name: 'Draft', exact: true }));

  expect(onFilterChange).toHaveBeenCalledWith('Draft');
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 01', exact: true }))
    .toBeVisible();
  expect(screen.getByRole('gridcell', { name: 'Item 03', exact: true }).elements()).toHaveLength(0);
  expect(screen.getByRole('row').elements()).toHaveLength(3);
});

test('sorts the full client collection before slicing the page', async () => {
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={items}
      columns={columns}
      getRowId={(item) => item.id}
      sortable
      paginationOptions={{ maxItemsPerPage: 5 }}
    />,
  );
  const heading = screen.getByRole('columnheader', { name: 'Name', exact: true });
  await userEvent.click(heading);
  await userEvent.click(heading);
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 12', exact: true }))
    .toBeVisible();
  expect(screen.getByRole('gridcell', { name: 'Item 01', exact: true }).elements()).toHaveLength(0);
});

test('clamps client pagination when the supplied collection shrinks', async () => {
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={items}
      columns={columns}
      paginationOptions={{ maxItemsPerPage: 5 }}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Next page', exact: true }));
  await screen.rerender(
    <DataGridWithFilters
      items={items.slice(0, 1)}
      columns={columns}
      paginationOptions={{ maxItemsPerPage: 5 }}
    />,
  );
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 01', exact: true }))
    .toBeVisible();
  await expect.element(screen.getByText('1-1 of 1', { exact: true })).toBeVisible();
});

test('client pagination follows currentPage prop updates', async () => {
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={items}
      columns={columns}
      paginationOptions={{ currentPage: 1, maxItemsPerPage: 5 }}
    />,
  );
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 01', exact: true }))
    .toBeVisible();

  await screen.rerender(
    <DataGridWithFilters
      items={items}
      columns={columns}
      paginationOptions={{ currentPage: 2, maxItemsPerPage: 5 }}
    />,
  );

  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 06', exact: true }))
    .toBeVisible();
  expect(screen.getByRole('gridcell', { name: 'Item 01', exact: true }).elements()).toHaveLength(0);
});

test('controlled mode delegates paging and honors externally cleared search text', async () => {
  const onSearch = vi.fn();
  const onNext = vi.fn();
  const paginationOptions = {
    currentPage: 2,
    maxItemsPerPage: 5,
    totalItems: 12,
    onNextClicked: onNext,
    onPrevClicked: vi.fn(),
    isNextEnabled: () => true,
    isPrevEnabled: () => true,
  };
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={items.slice(5, 10)}
      columns={columns}
      searchValue="remote"
      onSearch={onSearch}
      paginationOptions={paginationOptions}
    />,
  );
  await expect
    .element(screen.getByRole('gridcell', { name: 'Item 06', exact: true }))
    .toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next page', exact: true }));
  expect(onNext).toHaveBeenCalledOnce();
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search', exact: true }), 'changed');
  expect(onSearch).toHaveBeenCalledWith('changed');
  await screen.rerender(
    <DataGridWithFilters
      items={items.slice(5, 10)}
      columns={columns}
      searchValue=""
      onSearch={onSearch}
      paginationOptions={paginationOptions}
    />,
  );
  await expect
    .element(screen.getByRole('searchbox', { name: 'Search', exact: true }))
    .toHaveValue('');
});

test('row menus do not trigger row selection', async () => {
  const onSelection = vi.fn();
  const onAction = vi.fn();
  const actionColumn = createMenuColumn<(typeof items)[number]>({
    getLabel: (item) => `Actions for ${item.name}`,
    renderMenuItems: () => <MenuItem onClick={onAction}>Inspect</MenuItem>,
  });
  const screen = await renderCoreAIComponent(
    <DataGridWithFilters
      items={items.slice(0, 1)}
      columns={[columns[0], actionColumn]}
      getRowId={(item) => item.id}
      selectionMode="single"
      onSelectionChange={onSelection}
    />,
  );
  await userEvent.hover(screen.getByRole('gridcell', { name: 'Item 01', exact: true }));
  await userEvent.click(screen.getByRole('button', { name: 'Actions for Item 01' }));
  await userEvent.click(page.getByRole('menuitem', { name: 'Inspect' }));
  expect(onAction).toHaveBeenCalledOnce();
  expect(onSelection).not.toHaveBeenCalled();
});

test('row-driven details require a stable row ID', () => {
  expect(() =>
    renderToStaticMarkup(
      // @ts-expect-error A stable getRowId is required for selectable details.
      <GridDetailsContent dataGridProps={{ items, columns }} renderDetails={() => undefined} />,
    ),
  ).toThrow('GridDetailsContent requires a getRowId function for stable selection.');
});

test('inline details close returns focus to the selected row and clears selection', async () => {
  await page.viewport(1440, 900);
  const screen = await renderCoreAIComponent(
    <div style={{ height: 600 }}>
      <CollectionDetailsPage
        headerProps={{ title: 'Items' }}
        dataGridProps={{
          items,
          columns,
          getRowId: (item) => item.id,
          paginationOptions: { maxItemsPerPage: 5 },
        }}
        renderDetails={(id) => ({ title: `Details ${id}`, content: 'Selected item content' })}
      />
    </div>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Next page', exact: true }));
  const radio = screen.getByRole('radio', { name: 'Select row', exact: true }).first();
  await userEvent.click(radio);
  await expect.element(screen.getByRole('complementary', { name: 'Details item-6' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Close Details item-6' }));
  await expect.element(radio).toHaveFocus();
  await expect.element(radio).not.toBeChecked();
});

test('responsive sidebar uses container width, retains field state, and restores trigger focus', async () => {
  function Example() {
    const [value, setValue] = React.useState('Draft');
    return (
      <LayoutContainer style={{ display: 'flex', width: 500, height: 500 }}>
        <SidebarLayout
          sidebarTitle="Filters"
          sidebar={
            <Input aria-label="Name" value={value} onChange={(_, data) => setValue(data.value)} />
          }
        >
          Items
        </SidebarLayout>
      </LayoutContainer>
    );
  }
  const screen = await renderCoreAIComponent(<Example />);
  const trigger = screen.getByRole('button', { name: 'Filters', exact: true });
  await userEvent.click(trigger);
  await expect.element(page.getByRole('dialog', { name: 'Filters', exact: true })).toBeVisible();
  await userEvent.fill(page.getByRole('textbox', { name: 'Name', exact: true }), 'Changed');
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveFocus();
  await userEvent.click(trigger);
  await expect
    .element(page.getByRole('textbox', { name: 'Name', exact: true }))
    .toHaveValue('Changed');
});

test('tabbed pages follow nested routes without duplicating the page heading', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={['/collection/overview']}>
      <Routes>
        <Route
          path="collection"
          element={
            <TabbedPageLayout
              headerProps={{ title: 'Collection' }}
              tabLinkListProps={{
                links: [
                  { label: 'Overview', to: 'overview' },
                  { label: 'Items', to: 'items' },
                ],
              }}
            />
          }
        >
          <Route path="overview" element={<PageBody>Overview content</PageBody>} />
          <Route path="items" element={<PageBody>Items content</PageBody>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Items', exact: true }));
  await expect.element(screen.getByText('Items content', { exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('tab', { name: 'Items', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { level: 1 }).elements()).toHaveLength(1);
});

test('mobile shell navigation closes after choosing a route', async () => {
  await page.viewport(390, 844);
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <Routes>
        <Route
          element={
            <AppShell
              brand="Example App"
              navigation={[
                { to: '/', label: 'Overview' },
                { to: '/items', label: 'Items' },
              ]}
            />
          }
        >
          <Route index element={<h1>Overview</h1>} />
          <Route path="items" element={<h1>Items</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  await userEvent.click(page.getByRole('link', { name: 'Items', exact: true }));
  await expect.element(screen.getByRole('heading', { name: 'Items', exact: true })).toBeVisible();
  await expect
    .element(page.getByRole('dialog', { name: 'Navigation', exact: true }))
    .not.toBeInTheDocument();
});

test('mobile top navigation preserves exact route matching', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={['/settings/profile']}>
      <LayoutContainer style={{ width: 390 }}>
        <MobileLeftNav items={[]} topItems={[{ to: '/settings', label: 'Settings', end: true }]} />
      </LayoutContainer>
    </MemoryRouter>,
  );

  await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  await expect
    .element(page.getByRole('tab', { name: 'Settings', exact: true }))
    .toHaveAttribute('aria-selected', 'false');
});

test('search query is controlled and dismissal restores its opener', async () => {
  function Example() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const trigger = React.useRef<HTMLButtonElement>(null);
    return (
      <>
        <SearchButton ref={trigger} onClick={() => setOpen(true)} />
        <SearchDialog
          open={open}
          onOpenChange={setOpen}
          query={query}
          onQueryChange={setQuery}
          returnFocusRef={trigger}
        >
          <span>{query ? `Results for ${query}` : 'Recent items'}</span>
        </SearchDialog>
      </>
    );
  }
  const screen = await renderCoreAIComponent(<Example />);
  const trigger = screen.getByRole('button', { name: 'Search', exact: true });
  await userEvent.click(trigger);
  await userEvent.fill(page.getByRole('searchbox', { name: 'Search all items' }), 'example');
  await expect.element(page.getByText('Results for example', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('button', { name: 'Close search' }));
  await expect.element(trigger).toHaveFocus();
});
