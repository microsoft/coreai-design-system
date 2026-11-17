// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { TableRowId } from '@coreai-ds/react-components';
import {
  DataGridWithFilters,
  type DataGridWithFiltersProps,
} from '../DataGridWithFilters/DataGridWithFilters';
import { DetailsLayout, type PanelDetails } from './DetailsLayout';
export interface GridDetailsContentProps<T> {
  dataGridProps: Omit<
    DataGridWithFiltersProps<T>,
    'selectionMode' | 'selectedItems' | 'onSelectionChange' | 'getRowId'
  > & {
    getRowId: (item: T) => TableRowId;
  };
  renderDetails: (itemId: TableRowId) => PanelDetails | undefined;
}
/** Owns single selection, removal handling, and focus return. Supply a stable, unique getRowId. */
export function GridDetailsContent<T>({
  dataGridProps,
  renderDetails,
}: GridDetailsContentProps<T>) {
  const [selectedId, setSelectedId] = React.useState<TableRowId | null>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const getRowId = dataGridProps.getRowId;
  if (typeof getRowId !== 'function') {
    throw new Error('GridDetailsContent requires a getRowId function for stable selection.');
  }
  const exists =
    selectedId !== null && dataGridProps.items.some((item) => getRowId(item) === selectedId);
  if (selectedId !== null && !exists) setSelectedId(null);
  return (
    <DetailsLayout
      details={exists ? renderDetails(selectedId) : undefined}
      onClose={() => setSelectedId(null)}
      returnFocusRef={returnFocusRef}
    >
      <div ref={gridRef} tabIndex={-1}>
        <DataGridWithFilters
          {...dataGridProps}
          selectionMode="single"
          selectedItems={selectedId === null ? [] : [selectedId]}
          onSelectionChange={(event, data) => {
            const target = event.target instanceof HTMLElement ? event.target : null;
            returnFocusRef.current =
              target
                ?.closest('[role="row"]')
                ?.querySelector<HTMLInputElement>('input[type="radio"]') ??
              target ??
              gridRef.current;
            setSelectedId(data.selectedItems.values().next().value ?? null);
          }}
        />
      </div>
    </DetailsLayout>
  );
}
