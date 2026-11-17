// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { PageLayout } from './PageLayout';
import { PageHeader, type PageHeaderProps } from './PageHeader';
import { GridContent, type GridContentProps } from './GridContent';
export interface CollectionPageProps<T> extends GridContentProps<T> {
  headerProps: PageHeaderProps;
}
/** Standalone collection. For a collection within tabs, use GridContent instead. */
export function CollectionPage<T>({ headerProps, dataGridProps }: CollectionPageProps<T>) {
  return (
    <PageLayout header={<PageHeader {...headerProps} />} scrollMode="panes">
      <GridContent dataGridProps={dataGridProps} />
    </PageLayout>
  );
}
