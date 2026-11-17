// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DataGridWithFilters,
  type DataGridWithFiltersProps,
} from '../DataGridWithFilters/DataGridWithFilters';
import { PageBody } from './PageBody';
export interface GridContentProps<T> {
  dataGridProps: DataGridWithFiltersProps<T>;
}
/** Grid-only content for a tab or pane. Do not wrap it in another padded PageBody. */
export function GridContent<T>({ dataGridProps }: GridContentProps<T>) {
  return (
    <PageBody scrollable>
      <DataGridWithFilters {...dataGridProps} />
    </PageBody>
  );
}
