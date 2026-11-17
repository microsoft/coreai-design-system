// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Combobox,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  SearchBox,
  Spinner,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  useComboboxFilter,
  type DataGridProps,
  type DataGridCellFocusMode,
  type TableColumnDefinition as FluentColumn,
  type TableColumnId,
  type TableRowId,
} from '@coreai-ds/react-components';
import { ChevronLeft24Regular, ChevronRight24Regular } from '@fluentui/react-icons';
import { EmptyState, type EmptyStateProps } from '../EmptyState';

const useDataGridWithFiltersStyles = makeStyles({
  root: {
    display: 'grid',
    alignContent: 'start',
    minWidth: 0,
    flex: '1 1 auto',
    containerType: 'inline-size',
    containerName: 'template-grid',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    '@container template-grid (max-width: 500px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalMNudge,
      alignItems: 'flex-start',
    },
  },
  controlsEnd: {
    alignItems: 'flex-end',
    '@container template-grid (max-width: 500px)': { alignItems: 'flex-start' },
  },
  search: {
    flex: 1,
    maxWidth: '320px',
    minWidth: 0,
    '@container template-grid (max-width: 500px)': { width: '100%', maxWidth: '100%' },
  },
  endActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    '@container template-grid (max-width: 500px)': { width: '100%' },
  },
  spacer: { flex: 1, '@container template-grid (max-width: 500px)': { display: 'none' } },
  scroll: { overflowX: 'auto', minWidth: 0, paddingBottom: tokens.spacingVerticalS },
  grid: { marginTop: tokens.spacingVerticalM },
  cell: {
    overflow: 'hidden',
    minWidth: 'var(--template-cell-min-width)',
    '&:has(> .template-grid-menu-button), &:has(.template-grid-menu-header)': {
      minWidth: '48px',
      maxWidth: '48px',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} 0 ${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  pagination: { display: 'flex', gap: tokens.spacingHorizontalXS },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'max(400px, 50vh)',
    padding: tokens.spacingVerticalXL,
    boxSizing: 'border-box',
    '@container template-grid (max-width: 500px)': { minHeight: 'auto' },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
});

type InteractiveChildren = 'none' | 'single' | 'multiple';
export interface ColumnFilterOptions<T> {
  showFilter: boolean;
  label: string;
  options?: string[] | { children: string; value: string }[];
  onFilter?: (item: T, option: string) => boolean;
  onFilterChange?: (selectedOption: string) => void;
  selectedOption?: string;
}

export type TableColumnDefinition<T> = FluentColumn<T> & {
  onSearch?: (searchTerm: string, item: T) => boolean;
  interactiveChildren?: InteractiveChildren | ((item: T) => InteractiveChildren);
  interactiveHeaderChildren?: InteractiveChildren;
  headerTooltip?: string;
  filterOptions?: ColumnFilterOptions<T>;
};

export type SortOrder = 'ascending' | 'descending';
export interface BasePaginationOptions {
  currentPage?: number;
  maxItemsPerPage?: number;
}
export interface ControlledPaginationOptions extends BasePaginationOptions {
  onNextClicked: () => void;
  onPrevClicked: () => void;
  isNextEnabled: () => boolean;
  isPrevEnabled: () => boolean;
  onSort?: (columnId: TableColumnId, direction: SortOrder) => void;
  totalItems?: number;
}
export type PaginationOptions = BasePaginationOptions | ControlledPaginationOptions;

/** Copy this template and its linked EmptyState dependency. Supply stable getRowId values for selectable or sortable data. */
export type DataGridWithFiltersProps<T> = Omit<DataGridProps, 'columns' | 'items' | 'getRowId'> & {
  columns: TableColumnDefinition<T>[];
  items: T[];
  getRowId?: (item: T) => TableRowId;
  enableSearch?: boolean;
  searchLabel?: string;
  onSearch?: (searchTerm: string) => void;
  searchValue?: string;
  selectRowIndicatorLabel?: string;
  selectAllIndicatorLabel?: string;
  paginationOptions?: PaginationOptions;
  showPaginationControls?: boolean;
  showPaginationInfo?: boolean;
  emptyState?: Partial<EmptyStateProps>;
  noResultsState?: Partial<EmptyStateProps>;
  isLoading?: boolean;
  loadingMessage?: string;
  actions?: React.ReactNode;
  actionsPosition?: 'before-search' | 'after-search';
  actionsVerticalAlign?: 'center' | 'end';
  endActions?: React.ReactNode;
  belowControls?: React.ReactNode;
  getRowClassName?: (item: T) => string | undefined;
};

function controlledPagination(options?: PaginationOptions): options is ControlledPaginationOptions {
  return !!options && 'onNextClicked' in options;
}

function focusMode(mode?: InteractiveChildren): DataGridCellFocusMode | undefined {
  return mode === 'single' ? 'none' : mode === 'multiple' ? 'group' : 'cell';
}

function preventInteractiveSelection(event: React.MouseEvent | React.KeyboardEvent) {
  if (
    (event.target as HTMLElement).closest(
      'button, a, input, textarea, select, [role="button"], [role="menu"]',
    )
  ) {
    event.stopPropagation();
  }
}

export function DataGridWithFilters<T>({
  columns,
  items,
  enableSearch = true,
  searchLabel = 'Search',
  onSearch,
  searchValue,
  paginationOptions,
  showPaginationControls = true,
  showPaginationInfo = true,
  emptyState,
  noResultsState,
  isLoading = false,
  loadingMessage = 'Loading items',
  actions,
  actionsPosition = 'after-search',
  actionsVerticalAlign = 'center',
  endActions,
  belowControls,
  getRowClassName,
  selectRowIndicatorLabel = 'Select row',
  selectAllIndicatorLabel = 'Select all rows',
  selectionMode,
  columnSizingOptions,
  resizableColumns,
  sortState,
  defaultSortState,
  onSortChange,
  style,
  className,
  ...props
}: DataGridWithFiltersProps<T>) {
  const styles = useDataGridWithFiltersStyles();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(paginationOptions?.currentPage ?? 1);
  const [filters, setFilters] = React.useState<Record<TableColumnId, string>>({});
  const [internalSort, setInternalSort] = React.useState(defaultSortState);
  const sort = sortState ?? internalSort;
  const query = searchValue ?? search;
  const remote = controlledPagination(paginationOptions);
  React.useEffect(() => {
    if (!remote && paginationOptions?.currentPage !== undefined) {
      setPage(paginationOptions.currentPage);
    }
  }, [remote, paginationOptions?.currentPage]);
  const pageSize = Math.max(1, Math.floor(paginationOptions?.maxItemsPerPage ?? 25));
  const activeFilters = columns.filter(
    (column) => (column.filterOptions?.selectedOption ?? filters[column.columnId] ?? '') !== '',
  );
  const filtered = remote
    ? items
    : items.filter((item) => {
        if (
          !onSearch &&
          query.trim() &&
          !columns.some((column) => column.onSearch?.(query.trim(), item))
        )
          return false;
        return activeFilters.every((column) => {
          const option = column.filterOptions?.selectedOption ?? filters[column.columnId];
          if (column.filterOptions?.onFilter) return column.filterOptions.onFilter(item, option);
          const value = column.renderCell(item);
          return typeof value === 'string' || typeof value === 'number'
            ? String(value).trim() === option
            : !!column.onSearch?.(option, item);
        });
      });
  const comparator = columns.find((column) => column.columnId === sort?.sortColumn)?.compare;
  const sorted =
    !remote && comparator && sort
      ? [...filtered].sort(
          (first, second) =>
            comparator(first, second) * (sort.sortDirection === 'descending' ? -1 : 1),
        )
      : filtered;
  const total = remote ? paginationOptions.totalItems : sorted.length;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = remote
    ? Math.max(1, paginationOptions.currentPage ?? page)
    : Math.min(Math.max(1, page), totalPages);
  const visible = remote
    ? items
    : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilter = !!query.trim() || activeFilters.length > 0;
  const range =
    total === undefined
      ? ''
      : total === 0
        ? '0 of 0'
        : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)} of ${total}`;
  const state = hasFilter ? noResultsState : emptyState;
  const minWidth = columns.reduce(
    (width, column) => width + (columnSizingOptions?.[column.columnId]?.minWidth ?? 100),
    selectionMode ? 44 : 0,
  );
  const selectCell =
    selectionMode === 'single'
      ? { radioIndicator: { 'aria-label': selectRowIndicatorLabel } }
      : selectionMode === 'multiselect'
        ? { checkboxIndicator: { 'aria-label': selectRowIndicatorLabel } }
        : undefined;
  const headerSelectCell =
    selectionMode === 'single'
      ? {
          invisible: true,
          radioIndicator: { disabled: true, 'aria-label': selectAllIndicatorLabel },
        }
      : selectionMode === 'multiselect'
        ? { checkboxIndicator: { 'aria-label': selectAllIndicatorLabel } }
        : undefined;
  const changePage = (direction: number) => {
    if (remote) {
      if (direction > 0) paginationOptions.onNextClicked();
      else paginationOptions.onPrevClicked();
    } else setPage(currentPage + direction);
    searchRef.current?.focus();
  };

  return (
    <div className={styles.root} aria-busy={isLoading}>
      <div
        className={mergeClasses(
          styles.controls,
          actionsVerticalAlign === 'end' && styles.controlsEnd,
        )}
      >
        {actionsPosition === 'before-search' && actions}
        {enableSearch && (
          <SearchBox
            ref={searchRef}
            className={styles.search}
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={query}
            onChange={(_, data) => {
              setSearch(data.value);
              setPage(1);
              onSearch?.(data.value);
            }}
          />
        )}
        {columns
          .filter((column) => column.filterOptions?.showFilter)
          .map((column) => (
            <ColumnFilter
              key={column.columnId}
              column={column}
              items={items}
              value={column.filterOptions?.selectedOption ?? filters[column.columnId] ?? ''}
              onChange={(value) => {
                setFilters((previous) => ({ ...previous, [column.columnId]: value }));
                setPage(1);
                column.filterOptions?.onFilterChange?.(value);
              }}
            />
          ))}
        {actionsPosition === 'after-search' && actions}
        {endActions && (
          <>
            <div className={styles.spacer} />
            <div className={styles.endActions}>{endActions}</div>
          </>
        )}
      </div>
      {belowControls}
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner label={loadingMessage} />
        </div>
      ) : visible.length === 0 ? (
        <div role="status" className={styles.loading}>
          <EmptyState
            {...state}
            header={state?.header ?? (hasFilter ? 'No results found' : 'No data available')}
            description={
              state?.description ??
              (hasFilter ? 'Try adjusting your search or filters.' : undefined)
            }
          />
        </div>
      ) : (
        <>
          <div className={styles.scroll}>
            <DataGrid
              {...props}
              className={mergeClasses(styles.grid, className)}
              style={{ minWidth, ...style }}
              items={visible}
              columns={columns}
              selectionMode={selectionMode}
              columnSizingOptions={columnSizingOptions}
              resizableColumns={resizableColumns}
              sortable={props.sortable || (remote && !!paginationOptions.onSort)}
              sortState={sort}
              onSortChange={(event, next) => {
                setInternalSort(next);
                setPage(1);
                onSortChange?.(event, next);
                if (remote && next.sortColumn !== undefined)
                  paginationOptions.onSort?.(next.sortColumn, next.sortDirection);
              }}
            >
              <DataGridHeader>
                <DataGridRow selectionCell={headerSelectCell}>
                  {({ renderHeaderCell, columnId }) => {
                    const column = columns.find((candidate) => candidate.columnId === columnId);
                    const cell = (
                      <DataGridHeaderCell
                        className={styles.cell}
                        focusMode={focusMode(column?.interactiveHeaderChildren)}
                        style={
                          !resizableColumns
                            ? ({
                                '--template-cell-min-width': `${columnSizingOptions?.[columnId]?.minWidth ?? 100}px`,
                              } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {renderHeaderCell()}
                      </DataGridHeaderCell>
                    );
                    return column?.headerTooltip ? (
                      <Tooltip content={column.headerTooltip} relationship="description">
                        {cell}
                      </Tooltip>
                    ) : (
                      cell
                    );
                  }}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<T>>
                {({ item, rowId }) => (
                  <DataGridRow<T>
                    key={rowId}
                    selectionCell={selectCell}
                    className={getRowClassName?.(item)}
                  >
                    {({ renderCell, columnId }) => {
                      const interactive = columns.find(
                        (column) => column.columnId === columnId,
                      )?.interactiveChildren;
                      return (
                        <DataGridCell
                          className={styles.cell}
                          focusMode={focusMode(
                            typeof interactive === 'function' ? interactive(item) : interactive,
                          )}
                          onClick={selectionMode ? preventInteractiveSelection : undefined}
                          onKeyDown={
                            selectionMode
                              ? (event) => {
                                  if (event.key === 'Enter' || event.key === ' ')
                                    preventInteractiveSelection(event);
                                }
                              : undefined
                          }
                          style={
                            !resizableColumns
                              ? ({
                                  '--template-cell-min-width': `${columnSizingOptions?.[columnId]?.minWidth ?? 100}px`,
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {renderCell(item)}
                        </DataGridCell>
                      );
                    }}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </div>
          {(showPaginationControls || showPaginationInfo) && (
            <div className={styles.footer}>
              {showPaginationInfo && (
                <Text preset="bodyS" foreground={2}>
                  {range}
                </Text>
              )}
              {showPaginationControls && (
                <div className={styles.pagination}>
                  <Tooltip content="Previous page" relationship="label">
                    <Button
                      aria-label="Previous page"
                      appearance="subtle"
                      icon={<ChevronLeft24Regular />}
                      size="small"
                      disabled={remote ? !paginationOptions.isPrevEnabled() : currentPage <= 1}
                      onClick={() => changePage(-1)}
                    >
                      Prev
                    </Button>
                  </Tooltip>
                  <Tooltip content="Next page" relationship="label">
                    <Button
                      aria-label="Next page"
                      appearance="subtle"
                      icon={<ChevronRight24Regular />}
                      iconPosition="after"
                      size="small"
                      disabled={
                        remote ? !paginationOptions.isNextEnabled() : currentPage >= totalPages
                      }
                      onClick={() => changePage(1)}
                    >
                      Next
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <span className={styles.hidden} role="status" aria-live="polite">
        {!isLoading && visible.length > 0
          ? `${range || visible.length} items${hasFilter ? ' matching your filters' : ''}`
          : ''}
      </span>
    </div>
  );
}

function ColumnFilter<T>({
  column,
  items,
  value,
  onChange,
}: {
  column: TableColumnDefinition<T>;
  items: T[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const options =
    column.filterOptions?.options ??
    [
      ...new Set(
        items.flatMap((item) => {
          const cell = column.renderCell(item);
          return typeof cell === 'string' || typeof cell === 'number' ? [String(cell).trim()] : [];
        }),
      ),
    ]
      .filter(Boolean)
      .sort();
  const filteredOptions = useComboboxFilter<(typeof options)[number]>(query, options, {
    optionToText: (option) => (typeof option === 'string' ? option : option.children),
    noOptionsMessage: 'No results found',
  });
  const selectedLabel = options.find(
    (option) => (typeof option === 'string' ? option : option.value) === value,
  );
  return (
    <Combobox
      aria-label={`Filter by ${column.filterOptions?.label}`}
      label={column.filterOptions?.label ?? 'Filter'}
      clearable
      dynamicWidth
      placeholder="Type to filter..."
      value={query || (typeof selectedLabel === 'object' ? selectedLabel.children : value)}
      selectedOptions={value ? [value] : []}
      onChange={(event) => setQuery(event.target.value)}
      onOptionSelect={(_, data) => {
        setQuery('');
        onChange(data.optionValue ?? '');
      }}
    >
      {filteredOptions}
    </Combobox>
  );
}
