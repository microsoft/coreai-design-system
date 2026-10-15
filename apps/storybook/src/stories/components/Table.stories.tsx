// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell,
  type JSXElement,
  type PresenceBadgeStatus,
} from '@coreai-ds/react-components';

import * as React from 'react';
import {
  FolderRegular,
  EditRegular,
  OpenRegular,
  DocumentRegular,
  PeopleRegular,
  DocumentPdfRegular,
  VideoRegular,
} from '@fluentui/react-icons';

const items = [
  {
    file: { label: 'Meeting notes', icon: <DocumentRegular /> },
    author: { label: 'Max Mustermann', status: 'available' },
    lastUpdated: { label: '7h ago', timestamp: 1 },
    lastUpdate: {
      label: 'You edited this',
      icon: <EditRegular />,
    },
  },
  {
    file: { label: 'Thursday presentation', icon: <FolderRegular /> },
    author: { label: 'Erika Mustermann', status: 'busy' },
    lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
    lastUpdate: {
      label: 'You recently opened this',
      icon: <OpenRegular />,
    },
  },
  {
    file: { label: 'Training recording', icon: <VideoRegular /> },
    author: { label: 'John Doe', status: 'away' },
    lastUpdated: { label: 'Yesterday at 1:45 PM', timestamp: 2 },
    lastUpdate: {
      label: 'You recently opened this',
      icon: <OpenRegular />,
    },
  },
  {
    file: { label: 'Purchase order', icon: <DocumentPdfRegular /> },
    author: { label: 'Jane Doe', status: 'offline' },
    lastUpdated: { label: 'Tue at 9:30 AM', timestamp: 3 },
    lastUpdate: {
      label: 'You shared this in a Teams chat',
      icon: <PeopleRegular />,
    },
  },
];

const columns = [
  { columnKey: 'file', label: 'File' },
  { columnKey: 'author', label: 'Author' },
  { columnKey: 'lastUpdated', label: 'Last updated' },
  { columnKey: 'lastUpdate', label: 'Last update' },
];

export const Default = (): JSXElement => {
  return (
    <Table arial-label="Default table" style={{ minWidth: '510px' }}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.columnKey}>{column.label}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.file.label}>
            <TableCell>
              <TableCellLayout media={item.file.icon}>{item.file.label}</TableCellLayout>
            </TableCell>
            <TableCell>
              <TableCellLayout
                media={
                  <Avatar
                    aria-label={item.author.label}
                    name={item.author.label}
                    badge={{
                      status: item.author.status as PresenceBadgeStatus,
                    }}
                  />
                }
              >
                {item.author.label}
              </TableCellLayout>
            </TableCell>
            <TableCell>{item.lastUpdated.label}</TableCell>
            <TableCell>
              <TableCellLayout media={item.lastUpdate.icon}>
                {item.lastUpdate.label}
              </TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

/**
 *
 * A Table displays sets of two-dimensional data. The primitive components can be fully customized to support different
 * feature sets. The library provides a default `useTableFeatures` hook that handles the business logic and state management of common
 * features. There is no obligation to use our hook with these components, we've created it for convenience.
 *
 * The `useTableFeatures` hook was designed with feature composition in mind. This means that they are composed using
 * plugins hooks such as `useTableSort` and `useTableSelection` as a part of `useTableFeatures`. This means
 * that as the feature set expands, users will not need to pay the bundle size price for features that they do not intend
 * to use. Please consult the usage examples below for more details.
 *
 * > 💡 This component is considered **low-level** and should be used when there is a need for more **customization** and
 * > support for **non-standard features**. Please check out the **DataGrid component**
 * > if you don't need lots of customization and rely on common features. There is less work involved and you will benefit
 * > from first class Microsoft design and accessibility support.
 *
 * > ⚠️ Once there is any kind of keyboard navigation on the component it must follow the
 * > [aria role="grid" pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/)
 *
 * @summary Low-level primitives for building customizable data tables. Subcomponents: TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, TableSelectionCell, TableCellLayout.
 */
export default {
  title: 'Components/Table',
  component: Table,
  subcomponents: {
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableSelectionCell,
    TableCellLayout,
  },
};
