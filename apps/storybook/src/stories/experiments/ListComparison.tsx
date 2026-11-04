// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { List as LegacyList, ListItem as LegacyListItem } from '@coreai-ds/react-components';
import {
  List,
  ListItem,
  type ListItemProps,
  type ListNavigationMode,
  type ListProps,
} from '@coreai-ds/react-headless-components';
import styles from './ListComparison.module.css';

export type ListImplementation = 'legacy' | 'headless';
export interface ListExample {
  name: string;
  as?: ListProps['as'];
  navigationMode?: ListNavigationMode;
  selectionMode?: ListProps['selectionMode'];
  actions?: boolean;
  checkmarks?: boolean;
  focusableCheckmarks?: boolean;
  selectedItems?: Array<string | number>;
  disabledSelection?: boolean;
  wrap?: boolean;
  consumer?: boolean;
}

export const listExamples: readonly ListExample[] = [
  { name: 'Noninteractive' },
  { name: 'Ordered', as: 'ol' },
  { name: 'Native div collection', as: 'div' },
  { name: 'Focusable actions', navigationMode: 'items', actions: true },
  { name: 'Single selection', navigationMode: 'items', selectionMode: 'single' },
  { name: 'Multiselection', navigationMode: 'items', selectionMode: 'multiselect' },
  {
    name: 'Disabled selection',
    navigationMode: 'items',
    selectionMode: 'multiselect',
    disabledSelection: true,
    selectedItems: ['alpha', 'charlie'],
  },
  { name: 'Composite actions', navigationMode: 'composite', actions: true },
  {
    name: 'Composite selection',
    navigationMode: 'composite',
    selectionMode: 'multiselect',
    checkmarks: true,
  },
  {
    name: 'Named native checkmarks',
    navigationMode: 'composite',
    selectionMode: 'single',
    checkmarks: true,
    focusableCheckmarks: true,
  },
  {
    name: 'Disabled native checkmark',
    navigationMode: 'composite',
    selectionMode: 'multiselect',
    checkmarks: true,
    disabledSelection: true,
    selectedItems: ['alpha', 'charlie'],
  },
  { name: 'Wrapped content', navigationMode: 'composite', actions: true, wrap: true },
];

export const listConsumerExample: ListExample = {
  name: 'Consumer classes',
  navigationMode: 'composite',
  selectionMode: 'multiselect',
  checkmarks: true,
  consumer: true,
};

const fixtureItems = [
  { value: 'alpha', label: 'Design review' },
  { value: 'bravo', label: 'Accessibility audit' },
  { value: 'charlie', label: 'Performance budget' },
] as const;

export function ListFixture({
  implementation,
  example,
}: {
  implementation: ListImplementation;
  example: ListExample;
}) {
  const composite = example.navigationMode === 'composite';
  const listProps = {
    ...(example.as ? { as: example.as } : {}),
    navigationMode: example.navigationMode,
    selectionMode: example.selectionMode,
    selectedItems: example.selectedItems ?? (example.selectionMode ? ['alpha'] : undefined),
    className: [styles.fixtureList, example.consumer ? styles.consumerList : undefined]
      .filter(Boolean)
      .join(' '),
    'aria-label': `${implementation} project list`,
    'data-list-implementation': implementation,
  };
  const contents = (label: string) => (
    <>
      <span
        role={composite ? 'gridcell' : undefined}
        data-list-slot="content"
        className={styles.content}
      >
        {label}
        {example.wrap && (
          <span className={styles.description}>
            Review the release checklist, resolve feedback and prepare the final handoff.
          </span>
        )}
      </span>
      {composite && (
        <span role="gridcell" data-list-slot="actions" className={styles.actions}>
          <button type="button" aria-label={`Inspect ${label}`}>
            Inspect
          </button>
        </span>
      )}
    </>
  );
  const preventPrimaryAction: NonNullable<ListItemProps['onAction']> = (event, _data) =>
    event.preventDefault();
  const rowProps = (item: (typeof fixtureItems)[number]) => ({
    value: item.value,
    'aria-label': item.label,
    'data-list-row': item.value,
    className: [styles.fixtureItem, example.consumer ? styles.consumerItem : undefined]
      .filter(Boolean)
      .join(' '),
    disabledSelection: example.disabledSelection && item.value === 'charlie',
    ...(example.actions ? { onAction: preventPrimaryAction } : {}),
  });
  const checkmarkProps = (label: string) =>
    example.checkmarks
      ? {
          'aria-label': `Select ${label}`,
          ...(example.focusableCheckmarks ? { tabIndex: 0 } : {}),
          className: example.consumer ? styles.consumerCheckmark : undefined,
        }
      : null;

  if (implementation === 'legacy') {
    return (
      <LegacyList {...listProps}>
        {fixtureItems.map((item) =>
          example.as === 'div' || composite ? (
            <LegacyListItem
              {...rowProps(item)}
              as="div"
              key={item.value}
              checkmark={checkmarkProps(item.label)}
            >
              {contents(item.label)}
            </LegacyListItem>
          ) : (
            <LegacyListItem
              {...rowProps(item)}
              as="li"
              key={item.value}
              checkmark={checkmarkProps(item.label)}
            >
              {contents(item.label)}
            </LegacyListItem>
          ),
        )}
      </LegacyList>
    );
  }
  return (
    <List {...listProps}>
      {fixtureItems.map((item) =>
        example.as === 'div' || composite ? (
          <ListItem
            {...rowProps(item)}
            as="div"
            key={item.value}
            checkmark={checkmarkProps(item.label)}
          >
            {contents(item.label)}
          </ListItem>
        ) : (
          <ListItem
            {...rowProps(item)}
            as="li"
            key={item.value}
            checkmark={checkmarkProps(item.label)}
          >
            {contents(item.label)}
          </ListItem>
        ),
      )}
    </List>
  );
}

export function ListComparison({ example }: { example: ListExample }) {
  return (
    <div className={styles.comparison}>
      <section>
        <h3>Current CoreAI / Griffel</h3>
        <ListFixture implementation="legacy" example={example} />
      </section>
      <section>
        <h3>Headless / CSS Modules</h3>
        <ListFixture implementation="headless" example={example} />
      </section>
    </div>
  );
}
