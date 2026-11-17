// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { PageLayout } from './PageLayout';
import { PageHeader, type PageHeaderProps } from './PageHeader';
import { GridDetailsContent, type GridDetailsContentProps } from './GridDetailsContent';
export interface CollectionDetailsPageProps<T> extends GridDetailsContentProps<T> {
  headerProps: PageHeaderProps;
}
/** Standalone collection with row-driven details. Supply a stable, unique getRowId. */
export function CollectionDetailsPage<T>({ headerProps, ...props }: CollectionDetailsPageProps<T>) {
  return (
    <PageLayout header={<PageHeader {...headerProps} />} scrollMode="panes">
      <GridDetailsContent {...props} />
    </PageLayout>
  );
}
