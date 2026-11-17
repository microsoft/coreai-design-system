// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Text,
  Textarea,
} from '@coreai-ds/react-components';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { SettingsRegular } from '@fluentui/react-icons';
import { SidebarLayout } from './SidebarLayout';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';
import { GridDetailsContent } from './GridDetailsContent';
import { DetailsLayout } from './DetailsLayout';
import { TabLinkList } from '../react-router/TabLinkList';
const meta = {
  title: 'Templates/Pages/Sidebar Layout',
  component: SidebarLayout,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof SidebarLayout>;
/**
 * Copy-paste template — not an importable component. Copy `templates-pages-sidebar-layout--source-code` and dependencies.
 * Keep filter and form state above responsive drawers. At 1024px the sidebar becomes a modal.
 * Set contentPadding="none" and scrollable={false} around nested pane/grid layouts.
 * @summary Filters, combined grid/details, and route-driven workspace compositions.
 */
export default meta;
/** Filtered non-grid results with caller-owned details and focus return. */
export const Default: StoryObj = {
  render: () => {
    const [query, setQuery] = React.useState('');
    const [activeOnly, setActiveOnly] = React.useState(false);
    const [selected, setSelected] = React.useState<string>();
    const trigger = React.useRef<HTMLElement | null>(null);
    const items = [
      { name: 'First item', active: true },
      { name: 'Second item', active: false },
    ].filter(
      (item) =>
        (!activeOnly || item.active) && item.name.toLowerCase().includes(query.toLowerCase()),
    );
    const styles = /* css */ `.sidebar-filter-example { height: 100dvh; } .sidebar-filter-example__stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--spacingVerticalL); min-width: 0; } .sidebar-filter-example__stack > div:has(input) { align-self: stretch; } .sidebar-filter-example__results { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: var(--spacingVerticalL); width: 100%; padding: 0; margin: 0; list-style: none; } .sidebar-filter-example__card { align-items: flex-start; width: 100%; min-width: 0; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="sidebar-filter-example">
          <PageLayout header={<PageHeader title="Items" />} scrollMode="panes">
            <SidebarLayout
              sidebarTitle="Filters"
              contentPadding="none"
              scrollable={false}
              sidebar={
                <div className="sidebar-filter-example__stack">
                  <Field label="Item name">
                    <Input value={query} onChange={(_, data) => setQuery(data.value)} />
                  </Field>
                  <Checkbox
                    label="Active only"
                    checked={activeOnly}
                    onChange={(_, data) => setActiveOnly(data.checked === true)}
                  />
                  <Button
                    onClick={() => {
                      setQuery('');
                      setActiveOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              }
            >
              <DetailsLayout
                returnFocusRef={trigger}
                onClose={() => setSelected(undefined)}
                details={
                  items.some((item) => item.name === selected)
                    ? { title: selected!, content: 'Ready for review' }
                    : undefined
                }
              >
                <div className="sidebar-filter-example__stack">
                  <Text as="h2" preset="heading4">
                    Items ({items.length})
                  </Text>
                  {items.length === 0 && <Text role="status">No items match these filters.</Text>}
                  <ul className="sidebar-filter-example__results">
                    {items.map((item) => (
                      <li key={item.name}>
                        <Card
                          role="button"
                          className="sidebar-filter-example__card"
                          aria-label={`View details for ${item.name}`}
                          key={item.name}
                          onClick={(event) => {
                            trigger.current = event.currentTarget;
                            setSelected(item.name);
                          }}
                        >
                          <Text preset="heading4" foreground={1}>
                            {item.name}
                          </Text>
                          <Text preset="bodyS" foreground={2}>
                            {item.active ? 'Active' : 'Draft'}
                          </Text>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </div>
              </DetailsLayout>
            </SidebarLayout>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** Left filters, center grid, and right details each keep explicit scroll and padding ownership. */
export const CombinedDetails: StoryObj = {
  render: () => {
    const [activeOnly, setActiveOnly] = React.useState(false);
    const allItems = Array.from({ length: 32 }, (_, index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
      active: index % 2 === 0,
    }));
    const items = allItems.filter((item) => !activeOnly || item.active);
    const styles = /* css */ `.sidebar-combined-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="sidebar-combined-example">
          <PageLayout header={<PageHeader title="Items" count={items.length} />} scrollMode="panes">
            <SidebarLayout
              sidebarTitle="Filters"
              sidebar={
                <Checkbox
                  label="Active only"
                  checked={activeOnly}
                  onChange={(_, data) => setActiveOnly(data.checked === true)}
                />
              }
              contentPadding="none"
              scrollable={false}
            >
              <GridDetailsContent
                dataGridProps={{
                  'aria-label': 'Items',
                  items,
                  getRowId: (item) => item.id,
                  columns: [
                    {
                      columnId: 'name',
                      compare: (first, second) => first.name.localeCompare(second.name),
                      renderHeaderCell: () => 'Name',
                      renderCell: (item) => item.name,
                      onSearch: (query, item) =>
                        item.name.toLowerCase().includes(query.toLowerCase()),
                    },
                  ],
                }}
                renderDetails={(id) => ({
                  title: allItems.find((item) => item.id === id)?.name ?? 'Details',
                  content: 'Ready for review',
                  width: 320,
                })}
              />
            </SidebarLayout>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** Persistent configuration above the drawer; real router tabs and a separately scrolling body. */
export const Workspace: StoryObj = {
  render: () => {
    const [name, setName] = React.useState('Untitled item');
    const [notes, setNotes] = React.useState('Ready for review');
    const [entry, setEntry] = React.useState('');
    const [entries, setEntries] = React.useState<string[]>([]);
    const [includeHistory, setIncludeHistory] = React.useState(true);
    const styles = /* css */ `.workspace-example { height: 100dvh; } .workspace-example__stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--spacingVerticalL); min-width: 0; overflow-wrap: anywhere; } .workspace-example__stack > div:has(input, textarea) { align-self: stretch; } .workspace-example__content { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; } .workspace-example__toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacingHorizontalM); padding: var(--spacingVerticalM) var(--template-page-padding); border-bottom: var(--strokeWidthThin) solid var(--colorNeutralBackground4); } .workspace-example__tabs { display: flex; align-items: center; } .workspace-example__body { flex: 1; overflow: auto; min-height: 0; padding: var(--spacingVerticalL) var(--template-page-padding); } .workspace-example__form { display: flex; flex-direction: column; flex-shrink: 0; align-items: flex-end; gap: var(--spacingVerticalM); padding: var(--spacingVerticalL) var(--template-page-padding); border-top: var(--strokeWidthThin) solid var(--colorNeutralBackground4); } .workspace-example__form > div { align-self: stretch; } .workspace-example__stack h2, .workspace-example__stack p { margin: 0; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="workspace-example">
          <MemoryRouter initialEntries={['/workspace/preview']}>
            <Routes>
              <Route
                path="workspace"
                element={
                  <PageLayout
                    header={
                      <PageHeader
                        title="Workspace"
                        titleBadge={
                          <Badge shape="rounded" appearance="tint" color="informative" size="small">
                            Draft
                          </Badge>
                        }
                      />
                    }
                    scrollMode="panes"
                  >
                    <SidebarLayout
                      sidebarTitle="Configuration"
                      triggerIcon={<SettingsRegular />}
                      sidebar={
                        <div className="workspace-example__stack">
                          <Field label="Name" required>
                            <Input value={name} onChange={(_, data) => setName(data.value)} />
                          </Field>
                          <Field label="Notes">
                            <Textarea
                              rows={7}
                              value={notes}
                              onChange={(_, data) => setNotes(data.value)}
                            />
                          </Field>
                          <Checkbox
                            label="Include history"
                            checked={includeHistory}
                            onChange={(_, data) => setIncludeHistory(data.checked === true)}
                          />
                        </div>
                      }
                      contentPadding="none"
                      scrollable={false}
                    >
                      {(trigger) => (
                        <div className="workspace-example__content">
                          <div className="workspace-example__toolbar">
                            <div className="workspace-example__tabs">
                              {trigger}
                              <TabLinkList
                                appearance="elevated"
                                aria-label="Workspace view"
                                links={[
                                  { label: 'Preview', to: 'preview' },
                                  { label: 'Activity', to: 'activity' },
                                ]}
                              />
                            </div>
                            <Button onClick={() => setEntries([])}>Clear activity</Button>
                          </div>
                          <div className="workspace-example__body">
                            <Outlet />
                          </div>
                          <form
                            className="workspace-example__form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (entry.trim()) {
                                setEntries([...entries, entry.trim()]);
                                setEntry('');
                              }
                            }}
                          >
                            <Field label="Comment">
                              <Textarea
                                rows={2}
                                value={entry}
                                onChange={(_, data) => setEntry(data.value)}
                              />
                            </Field>
                            <Button type="submit" appearance="primary" disabled={!entry.trim()}>
                              Add
                            </Button>
                          </form>
                        </div>
                      )}
                    </SidebarLayout>
                  </PageLayout>
                }
              >
                <Route
                  path="preview"
                  element={
                    <div className="workspace-example__stack">
                      <Text as="h2" preset="heading4">
                        {name || 'Untitled item'}
                      </Text>
                      <Text as="p">{notes}</Text>
                      <Badge appearance="tint" color={includeHistory ? 'success' : 'subtle'}>
                        {includeHistory ? 'History enabled' : 'History disabled'}
                      </Badge>
                      {entries.map((text, index) => (
                        <Text key={index} as="p">
                          {text}
                        </Text>
                      ))}
                    </div>
                  }
                />
                <Route path="activity" element={<Text>{entries.length} comments added</Text>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </div>
      </>
    );
  },
};
