// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  DataGridSelectionCell,
  Text,
  TableCellLayout,
  createTableColumn,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  type DataGridProps,
  type PresenceBadgeStatus,
  type TableColumnDefinition,
  type TableColumnSizingOptions,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

import { figmaDesign } from '../../utils/figma';

import * as React from 'react';
import {
  FolderRegular,
  EditRegular,
  OpenRegular,
  DocumentRegular,
  PeopleRegular,
  DocumentPdfRegular,
  VideoRegular,
  ArrowDownloadRegular,
} from '@fluentui/react-icons';

export const Default: StoryObj = {
  render: () => {
    type Item = {
      file: { label: string; icon: React.JSX.Element };
      author: { label: string; status: PresenceBadgeStatus };
      lastUpdated: { label: string; timestamp: number };
      lastUpdate: { label: string; icon: React.JSX.Element };
    };

    const items: Item[] = [
      {
        file: { label: 'Meeting notes', icon: <DocumentRegular /> },
        author: { label: 'Max Mustermann', status: 'available' },
        lastUpdated: { label: '7h ago', timestamp: 1 },
        lastUpdate: { label: 'You edited this', icon: <EditRegular /> },
      },
      {
        file: { label: 'Thursday presentation', icon: <FolderRegular /> },
        author: { label: 'Erika Mustermann', status: 'busy' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Training recording', icon: <VideoRegular /> },
        author: { label: 'John Doe', status: 'away' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
        author: { label: 'Jane Doe', status: 'offline' },
        lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
        lastUpdate: { label: 'You shared this in a Teams chat', icon: <PeopleRegular /> },
      },
    ];
    const columns: TableColumnDefinition<Item>[] = [
      createTableColumn<Item>({
        columnId: 'file',
        compare: (first, second) => first.file.label.localeCompare(second.file.label),
        renderHeaderCell: () => 'File',
        renderCell: (item) => (
          <TableCellLayout media={item.file.icon}>{item.file.label}</TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'author',
        compare: (first, second) => first.author.label.localeCompare(second.author.label),
        renderHeaderCell: () => 'Author',
        renderCell: (item) => (
          <TableCellLayout
            media={
              <Avatar
                aria-label={item.author.label}
                name={item.author.label}
                badge={{ status: item.author.status }}
              />
            }
          >
            {item.author.label}
          </TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdated',
        compare: (first, second) => first.lastUpdated.timestamp - second.lastUpdated.timestamp,
        renderHeaderCell: () => 'Last updated',
        renderCell: (item) => item.lastUpdated.label,
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdate',
        compare: (first, second) => first.lastUpdate.label.localeCompare(second.lastUpdate.label),
        renderHeaderCell: () => 'Last update',
        renderCell: (item) => (
          <TableCellLayout media={item.lastUpdate.icon}>{item.lastUpdate.label}</TableCellLayout>
        ),
      }),
    ];

    const styles = /* css */ `
      .data-grid-default-example {
        min-width: 550px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <DataGrid
          className="data-grid-default-example"
          items={items}
          columns={columns}
          sortable
          selectionMode="multiselect"
          getRowId={(item) => item.file.label}
          focusMode="composite"
        >
          <DataGridHeader>
            <DataGridRow
              selectionCell={{
                checkboxIndicator: { 'aria-label': 'Select all rows' },
              }}
            >
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<Item>>
            {({ item, rowId }) => (
              <DataGridRow<Item>
                key={rowId}
                selectionCell={{
                  checkboxIndicator: { 'aria-label': 'Select row' },
                }}
              >
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </>
    );
  },
};

// ---------- DataGridCard ----------
// A `DataGrid` framed by a bordered container with its own header and footer.
// The outer `div` owns the visible outline (border + border radius); the
// `DataGrid` itself has its left/right border and border radius removed so
// only its top/bottom edges (row separators) show through, keeping a single
// continuous outline around the whole card.

export const DataGridCard: StoryObj = {
  render: () => {
    type Item = {
      file: { label: string; icon: React.JSX.Element };
      author: { label: string; status: PresenceBadgeStatus };
      lastUpdated: { label: string; timestamp: number };
      lastUpdate: { label: string; icon: React.JSX.Element };
    };
    const items: Item[] = [
      {
        file: { label: 'Meeting notes', icon: <DocumentRegular /> },
        author: { label: 'Max Mustermann', status: 'available' },
        lastUpdated: { label: '7h ago', timestamp: 1 },
        lastUpdate: { label: 'You edited this', icon: <EditRegular /> },
      },
      {
        file: { label: 'Thursday presentation', icon: <FolderRegular /> },
        author: { label: 'Erika Mustermann', status: 'busy' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Training recording', icon: <VideoRegular /> },
        author: { label: 'John Doe', status: 'away' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
        author: { label: 'Jane Doe', status: 'offline' },
        lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
        lastUpdate: { label: 'You shared this in a Teams chat', icon: <PeopleRegular /> },
      },
    ];
    const columns: TableColumnDefinition<Item>[] = [
      createTableColumn<Item>({
        columnId: 'file',
        compare: (first, second) => first.file.label.localeCompare(second.file.label),
        renderHeaderCell: () => 'File',
        renderCell: (item) => (
          <TableCellLayout media={item.file.icon}>{item.file.label}</TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'author',
        compare: (first, second) => first.author.label.localeCompare(second.author.label),
        renderHeaderCell: () => 'Author',
        renderCell: (item) => (
          <TableCellLayout
            media={
              <Avatar
                aria-label={item.author.label}
                name={item.author.label}
                badge={{ status: item.author.status }}
              />
            }
          >
            {item.author.label}
          </TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdated',
        compare: (first, second) => first.lastUpdated.timestamp - second.lastUpdated.timestamp,
        renderHeaderCell: () => 'Last updated',
        renderCell: (item) => item.lastUpdated.label,
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdate',
        compare: (first, second) => first.lastUpdate.label.localeCompare(second.lastUpdate.label),
        renderHeaderCell: () => 'Last update',
        renderCell: (item) => (
          <TableCellLayout media={item.lastUpdate.icon}>{item.lastUpdate.label}</TableCellLayout>
        ),
      }),
    ];
    const styles = /* css */ `
      .data-grid-card-example {
        background-color: var(--colorNeutralBackground1);
        border: var(--strokeWidthThin) solid var(--colorNeutralStroke2);
        border-radius: var(--borderRadiusXLarge);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .data-grid-card-example__header {
        display: flex;
        flex-direction: column;
        padding: var(--spacingVerticalM) var(--spacingHorizontalM);
        row-gap: var(--spacingVerticalXXS);
      }
      .data-grid-card-example__grid {
        border-left-width: 0;
        border-radius: 0;
        border-right-width: 0;
      }
      .data-grid-card-example__footer {
        align-items: center;
        column-gap: var(--spacingHorizontalM);
        display: flex;
        justify-content: space-between;
        padding: var(--spacingVerticalS) var(--spacingHorizontalM);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="data-grid-card-example">
          <div className="data-grid-card-example__header">
            <Text preset="heading4">Shared documents</Text>
            <Text preset="bodyS">4 files · Updated 7h ago</Text>
          </div>

          <DataGrid
            className="data-grid-card-example__grid"
            items={items}
            columns={columns}
            sortable
            selectionMode="multiselect"
            getRowId={(item) => item.file.label}
            focusMode="composite"
          >
            <DataGridHeader>
              <DataGridRow
                selectionCell={{
                  checkboxIndicator: { 'aria-label': 'Select all rows' },
                }}
              >
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Item>>
              {({ item, rowId }) => (
                <DataGridRow<Item>
                  key={rowId}
                  selectionCell={{
                    checkboxIndicator: { 'aria-label': 'Select row' },
                  }}
                >
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>

          <div className="data-grid-card-example__footer">
            <Text preset="bodyStrong">Showing 4 of 128 items</Text>
            <Button appearance="transparent" icon={<ArrowDownloadRegular />}>
              Export all
            </Button>
          </div>
        </div>
      </>
    );
  },
};

// ---------- DataGridAccordion ----------
// Same bordered-card outline as `DataGridCard`, but the header is a collapsible
// `Accordion` — its `AccordionPanel` holds the same left/right-borderless,
// radius-less `DataGrid` as its content.

export const DataGridAccordion: StoryObj = {
  render: () => {
    type Item = {
      file: { label: string; icon: React.JSX.Element };
      author: { label: string; status: PresenceBadgeStatus };
      lastUpdated: { label: string; timestamp: number };
      lastUpdate: { label: string; icon: React.JSX.Element };
    };
    const items: Item[] = [
      {
        file: { label: 'Meeting notes', icon: <DocumentRegular /> },
        author: { label: 'Max Mustermann', status: 'available' },
        lastUpdated: { label: '7h ago', timestamp: 1 },
        lastUpdate: { label: 'You edited this', icon: <EditRegular /> },
      },
      {
        file: { label: 'Thursday presentation', icon: <FolderRegular /> },
        author: { label: 'Erika Mustermann', status: 'busy' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Training recording', icon: <VideoRegular /> },
        author: { label: 'John Doe', status: 'away' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
        author: { label: 'Jane Doe', status: 'offline' },
        lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
        lastUpdate: { label: 'You shared this in a Teams chat', icon: <PeopleRegular /> },
      },
    ];
    const columns: TableColumnDefinition<Item>[] = [
      createTableColumn<Item>({
        columnId: 'file',
        compare: (first, second) => first.file.label.localeCompare(second.file.label),
        renderHeaderCell: () => 'File',
        renderCell: (item) => (
          <TableCellLayout media={item.file.icon}>{item.file.label}</TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'author',
        compare: (first, second) => first.author.label.localeCompare(second.author.label),
        renderHeaderCell: () => 'Author',
        renderCell: (item) => (
          <TableCellLayout
            media={
              <Avatar
                aria-label={item.author.label}
                name={item.author.label}
                badge={{ status: item.author.status }}
              />
            }
          >
            {item.author.label}
          </TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdated',
        compare: (first, second) => first.lastUpdated.timestamp - second.lastUpdated.timestamp,
        renderHeaderCell: () => 'Last updated',
        renderCell: (item) => item.lastUpdated.label,
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdate',
        compare: (first, second) => first.lastUpdate.label.localeCompare(second.lastUpdate.label),
        renderHeaderCell: () => 'Last update',
        renderCell: (item) => (
          <TableCellLayout media={item.lastUpdate.icon}>{item.lastUpdate.label}</TableCellLayout>
        ),
      }),
    ];
    const styles = /* css */ `
      .data-grid-accordion-example {
        background-color: var(--colorNeutralBackground1);
        border: var(--strokeWidthThin) solid var(--colorNeutralStroke2);
        border-radius: var(--borderRadiusXLarge);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .data-grid-accordion-example__header-button.fui-AccordionHeader__button {
        padding-left: var(--spacingHorizontalM);
        padding-right: var(--spacingHorizontalM);
      }
      .data-grid-accordion-example__panel {
        margin: 0;
      }
      .data-grid-accordion-example__grid {
        border-left-width: 0;
        border-radius: 0;
        border-right-width: 0;
      }
      .data-grid-accordion-example__footer {
        align-items: center;
        column-gap: var(--spacingHorizontalM);
        display: flex;
        justify-content: space-between;
        padding: var(--spacingVerticalS) var(--spacingHorizontalM);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Accordion className="data-grid-accordion-example" collapsible defaultOpenItems="files">
          <AccordionItem value="files">
            <AccordionHeader button={{ className: 'data-grid-accordion-example__header-button' }}>
              Shared documents
            </AccordionHeader>
            <AccordionPanel className="data-grid-accordion-example__panel">
              <DataGrid
                className="data-grid-accordion-example__grid"
                items={items}
                columns={columns}
                sortable
                selectionMode="multiselect"
                getRowId={(item) => item.file.label}
                focusMode="composite"
              >
                <DataGridHeader>
                  <DataGridRow
                    selectionCell={{
                      checkboxIndicator: { 'aria-label': 'Select all rows' },
                    }}
                  >
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<Item>>
                  {({ item, rowId }) => (
                    <DataGridRow<Item>
                      key={rowId}
                      selectionCell={{
                        checkboxIndicator: { 'aria-label': 'Select row' },
                      }}
                    >
                      {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>

              <div className="data-grid-accordion-example__footer">
                <Text preset="bodyStrong">Showing 4 of 128 items</Text>
                <Button appearance="transparent" icon={<ArrowDownloadRegular />}>
                  Export all
                </Button>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </>
    );
  },
};

/**
 * `resizableColumns` turns each column boundary into a drag handle. This story shows the
 * *controlled* pattern: widths live in your own state and `onColumnResize` writes them
 * back, so they survive re-renders. See **Resizable Columns** for the uncontrolled
 * default, where the grid auto-fits columns to the container.
 *
 * Combine `columnSizingOptions` (per-column `minWidth`/`defaultWidth`/`idealWidth`) with
 * `onColumnResize`, and with `resizableColumnsOptions={{ autoFitColumns: false }}` to let
 * the grid overflow its container instead of squeezing columns — that also keeps a handle
 * on the last column.
 *
 * Wrap the grid in a horizontally scrollable container so the overflow is reachable.
 * Resizing also works from the keyboard: open the header cell's context menu, choose
 * **Keyboard Column Resizing**, then use <kbd>←</kbd>/<kbd>→</kbd> (hold <kbd>Shift</kbd>
 * for finer steps) and <kbd>Enter</kbd>/<kbd>Esc</kbd> to exit.
 *
 * `resizableColumns` and `columnFlexOptions` are mutually exclusive — see the Flex Options story.
 */
export const ResizableColumnsControlled: StoryObj = {
  render: () => {
    type Item = {
      file: { label: string; icon: React.JSX.Element };
      author: { label: string; status: PresenceBadgeStatus };
      lastUpdated: { label: string; timestamp: number };
      lastUpdate: { label: string; icon: React.JSX.Element };
    };
    const items: Item[] = [
      {
        file: { label: 'Meeting notes', icon: <DocumentRegular /> },
        author: { label: 'Max Mustermann', status: 'available' },
        lastUpdated: { label: '7h ago', timestamp: 1 },
        lastUpdate: { label: 'You edited this', icon: <EditRegular /> },
      },
      {
        file: { label: 'Thursday presentation', icon: <FolderRegular /> },
        author: { label: 'Erika Mustermann', status: 'busy' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Training recording', icon: <VideoRegular /> },
        author: { label: 'John Doe', status: 'away' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
        author: { label: 'Jane Doe', status: 'offline' },
        lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
        lastUpdate: { label: 'You shared this in a Teams chat', icon: <PeopleRegular /> },
      },
    ];
    const columns: TableColumnDefinition<Item>[] = [
      createTableColumn<Item>({
        columnId: 'file',
        compare: (first, second) => first.file.label.localeCompare(second.file.label),
        renderHeaderCell: () => 'File',
        renderCell: (item) => (
          <TableCellLayout media={item.file.icon}>{item.file.label}</TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'author',
        compare: (first, second) => first.author.label.localeCompare(second.author.label),
        renderHeaderCell: () => 'Author',
        renderCell: (item) => (
          <TableCellLayout
            media={
              <Avatar
                aria-label={item.author.label}
                name={item.author.label}
                badge={{ status: item.author.status }}
              />
            }
          >
            {item.author.label}
          </TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdated',
        compare: (first, second) => first.lastUpdated.timestamp - second.lastUpdated.timestamp,
        renderHeaderCell: () => 'Last updated',
        renderCell: (item) => item.lastUpdated.label,
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdate',
        compare: (first, second) => first.lastUpdate.label.localeCompare(second.lastUpdate.label),
        renderHeaderCell: () => 'Last update',
        renderCell: (item) => (
          <TableCellLayout media={item.lastUpdate.icon}>{item.lastUpdate.label}</TableCellLayout>
        ),
      }),
    ];
    const [columnSizing, setColumnSizing] = React.useState<TableColumnSizingOptions>({
      file: { minWidth: 120, defaultWidth: 240, idealWidth: 240 },
      author: { minWidth: 120, defaultWidth: 200, idealWidth: 200 },
      lastUpdated: { minWidth: 120, defaultWidth: 180, idealWidth: 180 },
      lastUpdate: { minWidth: 140, defaultWidth: 220, idealWidth: 220 },
    });
    const onColumnResize: DataGridProps['onColumnResize'] = (_event, { columnId, width }) => {
      setColumnSizing((current) => ({
        ...current,
        [columnId]: { ...current[columnId], idealWidth: width, defaultWidth: width },
      }));
    };
    const styles = /* css */ `
      .data-grid-resizable-example {
        overflow-x: auto;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <DataGrid
          className="data-grid-resizable-example"
          items={items}
          columns={columns}
          sortable
          getRowId={(item) => item.file.label}
          selectionMode="multiselect"
          resizableColumns
          resizableColumnsOptions={{ autoFitColumns: false }}
          columnSizingOptions={columnSizing}
          onColumnResize={onColumnResize}
        >
          <DataGridHeader>
            <DataGridRow selectionCell={{ checkboxIndicator: { 'aria-label': 'Select all rows' } }}>
              {({ renderHeaderCell, columnId }, dataGrid) => (
                <Menu openOnContext>
                  <MenuTrigger>
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        onClick={dataGrid.columnSizing_unstable.enableKeyboardMode(columnId)}
                      >
                        Keyboard Column Resizing
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<Item>>
            {({ item, rowId }) => (
              <DataGridRow<Item>
                key={rowId}
                selectionCell={{ checkboxIndicator: { 'aria-label': 'Select row' } }}
              >
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </>
    );
  },
};

/**
 * CoreAI-only: `columnFlexOptions` is a CSS-only, non-interactive alternative to
 * `resizableColumns` for static layouts. Give each column a `flexGrow`/`flexShrink`/
 * `flexBasis`/`minWidth`/`maxWidth` override (keyed by `columnId`, same convention as
 * `columnSizingOptions`) and the `DataGridHeaderCell`/`DataGridCell` wrappers apply it
 * automatically - no need to read `columnId` off the render prop yourself.
 */
export const FlexOptions: StoryObj = {
  render: () => {
    type Item = {
      file: { label: string; icon: React.JSX.Element };
      author: { label: string; status: PresenceBadgeStatus };
      lastUpdated: { label: string; timestamp: number };
      lastUpdate: { label: string; icon: React.JSX.Element };
    };
    const items: Item[] = [
      {
        file: { label: 'Meeting notes', icon: <DocumentRegular /> },
        author: { label: 'Max Mustermann', status: 'available' },
        lastUpdated: { label: '7h ago', timestamp: 1 },
        lastUpdate: { label: 'You edited this', icon: <EditRegular /> },
      },
      {
        file: { label: 'Thursday presentation', icon: <FolderRegular /> },
        author: { label: 'Erika Mustermann', status: 'busy' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Training recording', icon: <VideoRegular /> },
        author: { label: 'John Doe', status: 'away' },
        lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
        lastUpdate: { label: 'You recently opened this', icon: <OpenRegular /> },
      },
      {
        file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
        author: { label: 'Jane Doe', status: 'offline' },
        lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
        lastUpdate: { label: 'You shared this in a Teams chat', icon: <PeopleRegular /> },
      },
    ];
    const columns: TableColumnDefinition<Item>[] = [
      createTableColumn<Item>({
        columnId: 'file',
        compare: (first, second) => first.file.label.localeCompare(second.file.label),
        renderHeaderCell: () => 'File',
        renderCell: (item) => (
          <TableCellLayout truncate media={item.file.icon}>
            {item.file.label}
          </TableCellLayout>
        ),
      }),
      createTableColumn<Item>({
        columnId: 'author',
        compare: (first, second) => first.author.label.localeCompare(second.author.label),
        renderHeaderCell: () => 'Author',
        renderCell: (item) => (
          <Avatar
            aria-label={item.author.label}
            name={item.author.label}
            badge={{ status: item.author.status }}
          />
        ),
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdated',
        compare: (first, second) => first.lastUpdated.timestamp - second.lastUpdated.timestamp,
        renderHeaderCell: () => 'Last updated',
        renderCell: (item) => <TableCellLayout truncate>{item.lastUpdated.label}</TableCellLayout>,
      }),
      createTableColumn<Item>({
        columnId: 'lastUpdate',
        compare: (first, second) => first.lastUpdate.label.localeCompare(second.lastUpdate.label),
        renderHeaderCell: () => 'Last update',
        renderCell: (item) => (
          <TableCellLayout truncate media={item.lastUpdate.icon}>
            {item.lastUpdate.label}
          </TableCellLayout>
        ),
      }),
    ];
    const styles = /* css */ `
      .data-grid-flex-options-example {
        overflow-x: auto;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <DataGrid
          className="data-grid-flex-options-example"
          items={items}
          columns={columns}
          sortable
          getRowId={(item) => item.file.label}
          selectionMode="multiselect"
          columnFlexOptions={{
            file: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
            author: { flexGrow: 0.1, flexShrink: 0, flexBasis: 60 },
            lastUpdated: { flexGrow: 0.6, flexShrink: 1, flexBasis: 0, minWidth: '20ch' },
            lastUpdate: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 180 },
          }}
        >
          <DataGridHeader>
            <DataGridRow selectionCell={{ checkboxIndicator: { 'aria-label': 'Select all rows' } }}>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<Item>>
            {({ item, rowId }) => (
              <DataGridRow<Item>
                key={rowId}
                selectionCell={{ checkboxIndicator: { 'aria-label': 'Select row' } }}
              >
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </>
    );
  },
};

/**
 * > 💡 This component is a higher level extension of the `Table` primitive components and the `useTableFeatures` hook.
 * > `DataGrid` is a feature-rich component that uses `useTableFeatures` internally,
 * > so there should always be full feature parity with what can be
 * > achieved with primitives. This component is **opinionated** and this is intentional. If the desired scenario can
 * > be achieved easily and does not vary too much from documented examples, it can be very convenient. If the desired
 * > scenario varies a lot from the documented examples please use the `Table` components with `useTableFeatures` (or
 * > another state management solution of choice).
 *
 * > ⚠️ Feature requests will be accepted, but the team will prioritize overall API scalability and extensibility over
 * > uncommon features and scenarios.
 *
 * @summary Feature-rich data table with selection, sorting, and keyboard navigation. Subcomponents: DataGridHeader, DataGridHeaderCell, DataGridBody, DataGridRow, DataGridCell, DataGridSelectionCell.
 */
export default {
  title: 'Components/DataGrid',
  component: DataGrid,
  subcomponents: {
    DataGridHeader,
    DataGridHeaderCell,
    DataGridBody,
    DataGridRow,
    DataGridCell,
    DataGridSelectionCell,
  },
  parameters: {
    ...figmaDesign('DataGrid'),
  },
};
