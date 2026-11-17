// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Outlet } from 'react-router-dom';
import { TabLinkList, type TabLinkListProps } from '../react-router/TabLinkList';
import { PageLayout } from './PageLayout';
import { PageHeader, type PageHeaderProps } from './PageHeader';
export interface TabbedPageLayoutProps {
  headerProps: Omit<PageHeaderProps, 'navigation'>;
  tabLinkListProps: TabLinkListProps;
  outletContext?: unknown;
}
/** Route-driven tabs. Child routes supply GridContent, a pane composition, or a scrollable PageBody. */
export function TabbedPageLayout({
  headerProps,
  tabLinkListProps,
  outletContext,
}: TabbedPageLayoutProps) {
  return (
    <PageLayout
      header={<PageHeader {...headerProps} navigation={<TabLinkList {...tabLinkListProps} />} />}
      scrollMode="panes"
    >
      <Outlet context={outletContext} />
    </PageLayout>
  );
}
