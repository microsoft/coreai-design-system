// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Checkbox,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from '@coreai-ds/react-components';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { TabbedPageLayout } from './TabbedPageLayout';
import { PageBody } from './PageBody';
import { GridContent } from './GridContent';
import { GridDetailsContent } from './GridDetailsContent';
import { SidebarLayout } from './SidebarLayout';
import { Link } from '../react-router/Link';
const meta = {
  title: 'Templates/Pages/Tabbed Page Layout',
  component: TabbedPageLayout,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof TabbedPageLayout>;
/**
 * Copy-paste template — not an importable component. Copy `templates-pages-tabbed-page-layout--source-code` and required templates,
 * including the React Router Tab Link List. Configure child routes in your app; examples use MemoryRouter
 * only to isolate Storybook. Tab children must own scrolling and must not add a second page header.
 * @summary Real nested routes for overview, list, details, filters, and settings content.
 */
export default meta;
/** Five child routes demonstrate the layout-lab combinations with route-relative links and shared outlet context. */
export const Default: StoryObj = {
  render: () => {
    function Overview() {
      const { collectionName } = useOutletContext<{ collectionName: string }>();
      return (
        <PageBody scrollable>
          <Text as="h2" preset="heading4">
            {collectionName}
          </Text>
          <Text as="p">All changes are up to date.</Text>
          <Link to="../details">Review items</Link>
        </PageBody>
      );
    }
    function Filters() {
      const [activeOnly, setActiveOnly] = React.useState(false);
      return (
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
          <GridContent
            dataGridProps={{
              'aria-label': 'Filtered items',
              items: activeOnly ? ['First item'] : ['First item', 'Second item'],
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
        </SidebarLayout>
      );
    }
    const dataGridProps = {
      'aria-label': 'Items',
      items: ['First item', 'Second item'],
      getRowId: (item: string) => item,
      columns: [
        {
          columnId: 'name',
          compare: (first: string, second: string) => first.localeCompare(second),
          renderHeaderCell: () => 'Name',
          renderCell: (item: string) => item,
          onSearch: (query: string, item: string) =>
            item.toLowerCase().includes(query.toLowerCase()),
        },
      ],
    };
    function Settings() {
      const { collectionName } = useOutletContext<{ collectionName: string }>();
      return (
        <>
          <section className="tabbed-page-example__context" aria-label="Settings overview">
            <Text>Review item settings in {collectionName}.</Text>
          </section>
          <GridDetailsContent
            dataGridProps={dataGridProps}
            renderDetails={(id) => ({
              title: String(id),
              content: (
                <div className="tabbed-page-example__stack">
                  <Text preset="bodyS" foreground={3}>
                    Last modified: September 18, 2026
                  </Text>
                  <Text preset="body" foreground={2}>
                    Review the settings applied to this item before sharing changes.
                  </Text>
                  <Link to="../overview">Open overview</Link>
                  <section className="tabbed-page-example__section">
                    <Text as="h3" preset="heading4">
                      Applied to
                    </Text>
                    <dl className="tabbed-page-example__metadata">
                      <dt>Category</dt>
                      <dd>Shared</dd>
                      <dt>Collection</dt>
                      <dd>{collectionName}</dd>
                      <dt>Status</dt>
                      <dd>Active</dd>
                    </dl>
                  </section>
                  <Accordion key={id} collapsible multiple defaultOpenItems={['Sharing', 'Review']}>
                    {[
                      {
                        title: 'Sharing',
                        rules: ['Workspace access', 'External access', 'Link expiry'],
                      },
                      {
                        title: 'Review',
                        rules: [
                          'Required approval',
                          'Change history',
                          'Content review',
                          'Ownership',
                        ],
                      },
                      { title: 'Monitoring', rules: ['Activity log', 'Notifications'] },
                    ].map((group) => (
                      <AccordionItem key={group.title} value={group.title}>
                        <AccordionHeader>
                          {group.title} ({group.rules.length})
                        </AccordionHeader>
                        <AccordionPanel>
                          <Table
                            size="small"
                            aria-label={group.title}
                            className="tabbed-page-example__table"
                          >
                            <TableHeader>
                              <TableRow>
                                <TableHeaderCell>Rule</TableHeaderCell>
                                <TableHeaderCell>Scope</TableHeaderCell>
                                <TableHeaderCell>Action</TableHeaderCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.rules.map((rule) => (
                                <TableRow key={rule}>
                                  <TableCell>{rule}</TableCell>
                                  <TableCell>Workspace</TableCell>
                                  <TableCell>
                                    {group.title === 'Monitoring' ? 'Log' : 'Check'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ),
            })}
          />
        </>
      );
    }
    const styles = /* css */ `.tabbed-page-example { height: 100dvh; } .tabbed-page-example__context { flex-shrink: 0; min-width: 0; padding: var(--spacingVerticalL) var(--template-page-padding); border-bottom: var(--strokeWidthThin) solid var(--colorNeutralBackground4); } .tabbed-page-example__stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--spacingVerticalL); min-width: 0; overflow-wrap: anywhere; } .tabbed-page-example__section { display: flex; flex-direction: column; gap: var(--spacingVerticalL); width: 100%; padding-block: var(--spacingVerticalXL); border-top: var(--strokeWidthThin) solid var(--colorNeutralBackground4); } .tabbed-page-example__metadata { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--spacingVerticalM) var(--spacingHorizontalXXL); } .tabbed-page-example__metadata dd, .tabbed-page-example__stack h3 { margin: 0; } .tabbed-page-example__table { width: 100%; table-layout: fixed; overflow-wrap: anywhere; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="tabbed-page-example">
          <MemoryRouter initialEntries={['/collection/overview']}>
            <Routes>
              <Route
                path="collection"
                element={
                  <TabbedPageLayout
                    headerProps={{
                      title: 'Main collection',
                      titleBadge: (
                        <Badge shape="rounded" appearance="tint" color="success" size="small">
                          Active
                        </Badge>
                      ),
                    }}
                    outletContext={{ collectionName: 'Collection overview' }}
                    tabLinkListProps={{
                      'aria-label': 'Collection sections',
                      links: ['overview', 'list', 'details', 'filters', 'settings'].map(
                        (section) => ({
                          label: section.charAt(0).toUpperCase() + section.slice(1),
                          to: section,
                        }),
                      ),
                    }}
                  />
                }
              >
                <Route path="overview" element={<Overview />} />
                <Route path="list" element={<GridContent dataGridProps={dataGridProps} />} />
                <Route
                  path="details"
                  element={
                    <GridDetailsContent
                      dataGridProps={dataGridProps}
                      renderDetails={(id) => ({ title: String(id), content: 'Ready for review' })}
                    />
                  }
                />
                <Route path="filters" element={<Filters />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </div>
      </>
    );
  },
};
