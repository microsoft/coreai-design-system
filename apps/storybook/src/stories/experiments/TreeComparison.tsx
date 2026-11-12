// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Tree as LegacyTree,
  TreeItem as LegacyTreeItem,
  TreeItemLayout as LegacyTreeItemLayout,
} from '@coreai-ds/react-components';
import { MoreHorizontal20Regular } from '@fluentui/react-icons/headless/svg/more-horizontal';
import { Star20Regular } from '@fluentui/react-icons/headless/svg/star';
import {
  Tree,
  type TreeCheckedChangeData,
  type TreeCheckedChangeEvent,
  type TreeProps,
} from '../../../../../packages/react-headless-components/src/Tree.js';
import { TreeItem } from '../../../../../packages/react-headless-components/src/TreeItem.js';
import { TreeItemLayout } from '../../../../../packages/react-headless-components/src/TreeItemLayout.js';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import styles from './TreeComparison.module.css';

export type TreeImplementation = 'legacy' | 'headless';

export const treeSizes = ['small', 'medium'] as const;
export const treeAppearances = ['subtle', 'subtle-alpha', 'transparent'] as const;

export type DocumentTreeProps = Omit<TreeProps, 'children' | 'checkedItems'> & {
  /** Nested trees only support controlled checked items, so the fixture owns that state. */
  defaultCheckedItems?: TreeProps['checkedItems'];
};

export interface TreeExample {
  name: string;
  props: DocumentTreeProps;
  /** Renders aside content and on-hover actions on the leaf items. */
  decorated?: boolean;
}

const openBoth = ['documents', 'reports'];

export const treeExamples: TreeExample[] = [
  { name: 'Default', props: { defaultOpenItems: openBoth } },
  ...treeSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultOpenItems: openBoth },
  })),
  ...treeAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultOpenItems: openBoth },
  })),
  { name: 'Collapsed', props: {} },
  { name: 'Icons, aside, and actions', props: { defaultOpenItems: openBoth }, decorated: true },
  {
    name: 'Multiselect',
    props: {
      selectionMode: 'multiselect',
      defaultOpenItems: openBoth,
      defaultCheckedItems: [
        ['q1', true],
        ['reports', 'mixed'],
      ],
    },
  },
  {
    name: 'Single select',
    props: { selectionMode: 'single', defaultOpenItems: openBoth, defaultCheckedItems: ['q1'] },
  },
];

const components = {
  legacy: { Tree: LegacyTree, TreeItem: LegacyTreeItem, TreeItemLayout: LegacyTreeItemLayout },
  headless: { Tree, TreeItem, TreeItemLayout },
} as const;

/** The same document tree rendered with either implementation. */
export function DocumentTree({
  implementation,
  label,
  decorated = false,
  defaultCheckedItems = [],
  onCheckedChange,
  ...props
}: DocumentTreeProps & {
  implementation: TreeImplementation;
  label: string;
  decorated?: boolean;
}) {
  const { Tree: T, TreeItem: Item, TreeItemLayout: Layout } = components[implementation];
  const [checkedItems, setCheckedItems] = React.useState(defaultCheckedItems);
  const leaf = (value: string, text: string) => (
    <Item itemType="leaf" value={value}>
      <Layout
        iconBefore={decorated ? <Star20Regular /> : undefined}
        aside={decorated ? <span>2 days ago</span> : undefined}
        actions={
          decorated ? (
            <>
              <button type="button" aria-label={`Share ${text}`}>
                Share
              </button>
              <button type="button" aria-label={`More options for ${text}`}>
                <MoreHorizontal20Regular />
              </button>
            </>
          ) : undefined
        }
      >
        {text}
      </Layout>
    </Item>
  );
  return (
    <T
      aria-label={label}
      {...(props as object)}
      checkedItems={checkedItems}
      onCheckedChange={(event: TreeCheckedChangeEvent, data: TreeCheckedChangeData) => {
        setCheckedItems(data.checkedItems);
        onCheckedChange?.(event, data);
      }}
    >
      <Item itemType="branch" value="documents">
        <Layout>Documents</Layout>
        <T>
          <Item itemType="branch" value="reports">
            <Layout>Reports</Layout>
            <T>
              {leaf('q1', 'Q1 summary')}
              {leaf('q2', 'Q2 summary')}
            </T>
          </Item>
          {leaf('notes', 'Meeting notes')}
        </T>
      </Item>
      {leaf('readme', 'Readme')}
    </T>
  );
}

export function TreeComparison({ examples = treeExamples }: { examples?: readonly TreeExample[] }) {
  return (
    <FocusgroupConsumer>
      <div className={styles.examples}>
        <button type="button" className={styles.neutral}>
          Before trees
        </button>
        <div className={styles.row}>
          <strong>Example</strong>
          <strong>Legacy Fluent Tree</strong>
          <strong>Headless CoreAI Tree</strong>
        </div>
        {examples.map(({ name, props, decorated }) => (
          <div key={name} className={styles.row} data-tree-case={name}>
            <span>{name}</span>
            {(['legacy', 'headless'] as const).map((implementation) => (
              <div
                key={implementation}
                className={styles.cell}
                data-implementation={implementation}
              >
                <DocumentTree
                  implementation={implementation}
                  label={`${name} ${implementation}`}
                  decorated={decorated}
                  {...props}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </FocusgroupConsumer>
  );
}

export function getComparisonTree(container: HTMLElement, implementation: TreeImplementation) {
  const cell = container.querySelector<HTMLElement>(`[data-implementation="${implementation}"]`);
  const root = cell?.querySelector<HTMLElement>('[role="tree"]');
  if (!root) throw new Error(`Missing ${implementation} tree`);
  return root;
}
