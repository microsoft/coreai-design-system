// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  Input,
  Menu,
  MenuButton,
  MenuGroupHeader,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Option,
  Text,
  Textarea,
} from '@coreai-ds/react-components';
import {
  ChevronUpDownRegular,
  HomeRegular,
  HomeFilled,
  ListRegular,
  ListFilled,
  SettingsRegular,
  SettingsFilled,
  FolderRegular,
  FolderFilled,
  bundleIcon,
} from '@fluentui/react-icons';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProfileButton } from './ProfileButton';
import { SearchButton } from '../Search/SearchButton';
import { SearchDialog } from '../Search/SearchDialog';
import { PageLayout } from '../Pages/PageLayout';
import { PageHeader } from '../Pages/PageHeader';
import { PageBody } from '../Pages/PageBody';
import { CollectionDetailsPage } from '../Pages/CollectionDetailsPage';
import { TabbedPageLayout } from '../Pages/TabbedPageLayout';
import { GridContent } from '../Pages/GridContent';
import { Link } from '../react-router/Link';
import { LinkButton } from '../react-router/LinkButton';
import { DetailsList } from '../DetailsList';
const meta = {
  title: 'Templates/App Shell',
  component: AppShell,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof AppShell>;
/**
 * Copy-paste template — not an importable component. Copy `templates-app-shell--source-code` and the Required Templates linked there.
 * Compose inside your app's router; MemoryRouter is only the Storybook host. The shell provides bounded
 * content height, skip navigation, desktop collapse, and mobile navigation. Page templates own their
 * headers, spacing, and scrolling. Search and profile are optional slots, not service integrations.
 * @summary Complete neutral app shell with linked page templates, profile, search, and responsive navigation.
 */
export default meta;
/** Connected overview, collection/details, nested tabs, and settings routes. All sample state stays local. */
export const Default: StoryObj = {
  render: () => {
    const HomeIcon = bundleIcon(HomeFilled, HomeRegular);
    const ListIcon = bundleIcon(ListFilled, ListRegular);
    const FolderIcon = bundleIcon(FolderFilled, FolderRegular);
    const SettingsIcon = bundleIcon(SettingsFilled, SettingsRegular);
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [notifications, setNotifications] = React.useState(true);
    const [workspace, setWorkspace] = React.useState('Main workspace');
    const [newName, setNewName] = React.useState('');
    const [created, setCreated] = React.useState(false);
    const searchTrigger = React.useRef<HTMLButtonElement>(null);
    const [items, setItems] = React.useState(
      Array.from({ length: 36 }, (_, index) => ({
        id: `item-${index + 1}`,
        name: `Item ${String(index + 1).padStart(2, '0')}`,
        status: index % 3 ? 'Active' : 'Draft',
        category: index % 2 ? 'Shared' : 'Personal',
      })),
    );
    const navigation = [
      {
        to: '/overview',
        label: 'Overview',
        icon: <HomeIcon />,
        sectionTitle: 'Workspace',
      },
      { to: '/items', label: 'Items', icon: <ListIcon /> },
      {
        to: '/collection',
        label: 'Collection',
        icon: <FolderIcon />,
      },
      {
        to: '/settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        placement: 'bottom' as const,
      },
    ];
    const dataGridProps = {
      'aria-label': 'Items',
      items,
      getRowId: (item: (typeof items)[number]) => item.id,
      sortable: true,
      searchLabel: 'Search items',
      paginationOptions: { maxItemsPerPage: 12 },
      columns: [
        {
          columnId: 'name',
          compare: (first: (typeof items)[number], second: (typeof items)[number]) =>
            first.name.localeCompare(second.name),
          renderHeaderCell: () => 'Name',
          renderCell: (item: (typeof items)[number]) => item.name,
          onSearch: (query: string, item: (typeof items)[number]) =>
            item.name.toLowerCase().includes(query.toLowerCase()),
        },
        {
          columnId: 'status',
          compare: (first: (typeof items)[number], second: (typeof items)[number]) =>
            first.status.localeCompare(second.status),
          renderHeaderCell: () => 'Status',
          renderCell: (item: (typeof items)[number]) => item.status,
        },
        {
          columnId: 'category',
          compare: (first: (typeof items)[number], second: (typeof items)[number]) =>
            first.category.localeCompare(second.category),
          renderHeaderCell: () => 'Category',
          renderCell: (item: (typeof items)[number]) => item.category,
        },
      ],
    };
    const results = navigation.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    );
    const styles = /* css */ `
      .app-shell-example__switcher { min-width: 0; padding: 0; background: transparent; }
      .app-shell-example__switcher:hover, .app-shell-example__switcher:active { background: transparent; }
      .app-shell-example__workspace { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .app-shell-example__search { width: 200px; justify-content: flex-start; text-align: left; }
      .app-shell-example__search-label { display: flex; justify-content: space-between; width: 100%; gap: var(--spacingHorizontalS); }
      .app-shell-example__setting { display: flex; flex-direction: column; }
      .app-shell-example__form { display: flex; flex-direction: column; gap: var(--spacingVerticalL); width: 100%; max-width: 640px; }
    `;
    return (
      <>
        <style>{styles}</style>
        <MemoryRouter initialEntries={['/overview']}>
          <Routes>
            <Route
              element={
                <AppShell
                  brand="Example App"
                  brandBadge={
                    <Badge appearance="filled" color="severe" shape="rounded" size="small">
                      Preview
                    </Badge>
                  }
                  contextSwitcher={
                    <Menu
                      checkedValues={{ workspace: [workspace] }}
                      onCheckedValueChange={(_, data) =>
                        setWorkspace(data.checkedItems[0] ?? workspace)
                      }
                    >
                      <MenuTrigger disableButtonEnhancement>
                        <MenuButton
                          appearance="subtle"
                          className="app-shell-example__switcher"
                          menuIcon={<ChevronUpDownRegular />}
                        >
                          <span className="app-shell-example__workspace">{workspace}</span>
                        </MenuButton>
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuGroupHeader>Recent workspaces</MenuGroupHeader>
                          {['Main workspace', 'Shared workspace'].map((name) => (
                            <MenuItemRadio key={name} name="workspace" value={name}>
                              {name}
                            </MenuItemRadio>
                          ))}
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  }
                  homeTo="/overview"
                  navigation={navigation}
                  topItems={[
                    { to: '/overview', label: 'Overview' },
                    { to: '/items', label: 'Manage' },
                    { to: '/collection', label: 'Browse' },
                  ]}
                  search={<SearchButton ref={searchTrigger} onClick={() => setSearchOpen(true)} />}
                  wideSearch={
                    <SearchButton
                      ref={searchTrigger}
                      appearance="secondary"
                      className="app-shell-example__search"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Text
                        preset="body"
                        foreground={3}
                        className="app-shell-example__search-label"
                      >
                        Search
                      </Text>
                    </SearchButton>
                  }
                  profile={
                    <ProfileButton name="Alex Morgan" secondaryText="alex@example.com">
                      <Field label="Workspace" className="app-shell-example__setting">
                        <Dropdown
                          value={workspace}
                          selectedOptions={[workspace]}
                          onOptionSelect={(_, data) => setWorkspace(data.optionValue ?? workspace)}
                        >
                          {['Main workspace', 'Shared workspace'].map((value) => (
                            <Option key={value}>{value}</Option>
                          ))}
                        </Dropdown>
                      </Field>
                      <Checkbox
                        label="Notifications"
                        checked={notifications}
                        onChange={(_, data) => setNotifications(data.checked === true)}
                      />
                    </ProfileButton>
                  }
                />
              }
            >
              <Route index element={<Navigate to="/overview" replace />} />
              <Route
                path="overview"
                element={
                  <PageLayout
                    header={
                      <PageHeader
                        title="Overview"
                        description={workspace}
                        headerActions={
                          <LinkButton to="/items" appearance="primary">
                            View items
                          </LinkButton>
                        }
                      />
                    }
                  >
                    <PageBody>
                      <DetailsList
                        items={[
                          {
                            key: 'collection',
                            label: 'Collection',
                            value: <Link to="/collection">Main collection</Link>,
                          },
                          { key: 'items', label: 'Items', value: items.length },
                          { key: 'owner', label: 'Owner', value: 'Alex Morgan' },
                        ]}
                      />
                    </PageBody>
                  </PageLayout>
                }
              />
              <Route
                path="items"
                element={
                  <CollectionDetailsPage
                    headerProps={{
                      title: 'Items',
                      count: items.length,
                      headerActions: (
                        <LinkButton to="/create" appearance="primary">
                          Create item
                        </LinkButton>
                      ),
                    }}
                    dataGridProps={dataGridProps}
                    renderDetails={(id) => {
                      const item = items.find((candidate) => candidate.id === id);
                      return item
                        ? {
                            title: item.name,
                            content: (
                              <DetailsList
                                items={[
                                  { key: 'status', label: 'Status', value: item.status },
                                  {
                                    key: 'collection',
                                    label: 'Collection',
                                    value: <Link to="/collection">Main collection</Link>,
                                  },
                                ]}
                              />
                            ),
                          }
                        : undefined;
                    }}
                  />
                }
              />
              <Route
                path="collection"
                element={
                  <TabbedPageLayout
                    headerProps={{
                      title: 'Main collection',
                      backTo: '/overview',
                      backLabel: 'Back to overview',
                    }}
                    tabLinkListProps={{
                      'aria-label': 'Collection sections',
                      links: [
                        { label: 'Overview', to: 'overview' },
                        { label: 'Items', to: 'items' },
                      ],
                    }}
                  />
                }
              >
                <Route index element={<Navigate to="overview" replace />} />
                <Route
                  path="overview"
                  element={
                    <PageBody scrollable>
                      <Text as="h2" preset="heading4">
                        Collection overview
                      </Text>
                      <Text as="p">All items are available for review.</Text>
                      <Link to="../items">Review items</Link>
                    </PageBody>
                  }
                />
                <Route path="items" element={<GridContent dataGridProps={dataGridProps} />} />
              </Route>
              <Route
                path="create"
                element={
                  <PageLayout
                    header={
                      <PageHeader
                        title="Create item"
                        backTo="/items"
                        backLabel="Back to items"
                        titleBadge={
                          <Badge shape="rounded" appearance="tint" color="informative" size="small">
                            Draft
                          </Badge>
                        }
                      />
                    }
                    scrollMode="panes"
                    footer={
                      <Button
                        appearance="primary"
                        disabled={!newName.trim() || created}
                        onClick={() => {
                          setItems([
                            ...items,
                            {
                              id: `item-${items.length + 1}`,
                              name: newName.trim(),
                              status: 'Draft',
                              category: 'Personal',
                            },
                          ]);
                          setCreated(true);
                        }}
                      >
                        Create item
                      </Button>
                    }
                  >
                    <PageBody scrollable>
                      <div className="app-shell-example__form">
                        <Field label="Name" required>
                          <Input
                            value={newName}
                            onChange={(_, data) => {
                              setNewName(data.value);
                              setCreated(false);
                            }}
                          />
                        </Field>
                        <Field label="Notes">
                          <Textarea rows={7} />
                        </Field>
                        <Checkbox label="Include history" defaultChecked />
                        {created && (
                          <Text role="status">
                            Item created. <Link to="/items">View items</Link>
                          </Text>
                        )}
                      </div>
                    </PageBody>
                  </PageLayout>
                }
              />
              <Route
                path="settings"
                element={
                  <PageLayout header={<PageHeader title="Settings" />}>
                    <PageBody>
                      <Checkbox
                        label="Notifications"
                        checked={notifications}
                        onChange={(_, data) => setNotifications(data.checked === true)}
                      />
                    </PageBody>
                  </PageLayout>
                }
              />
            </Route>
          </Routes>
          <SearchDialog
            open={searchOpen}
            onOpenChange={setSearchOpen}
            query={query}
            onQueryChange={setQuery}
            returnFocusRef={searchTrigger}
          >
            {results.length ? (
              results.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setSearchOpen(false)}>
                  {item.label}
                </Link>
              ))
            ) : (
              <Text role="status">No results found.</Text>
            )}
          </SearchDialog>
        </MemoryRouter>
      </>
    );
  },
};
