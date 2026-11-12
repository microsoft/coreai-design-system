// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FluentProvider } from '@coreai-ds/react-components';
import { Tree } from '../../../../../packages/react-headless-components/src/Tree.js';
import {
  DocumentTree,
  TreeComparison,
  getComparisonTree,
  treeAppearances,
  treeSizes,
} from './TreeComparison.js';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';

function getRow(canvasElement: HTMLElement, name: string) {
  const row = canvasElement.querySelector<HTMLElement>(`[data-tree-case="${name}"]`);
  if (!row) throw new Error(`Missing tree fixture ${name}`);
  return { legacy: getComparisonTree(row, 'legacy'), headless: getComparisonTree(row, 'headless') };
}

function layoutFor(tree: HTMLElement, text: string) {
  const item = within(tree).getByRole('treeitem', { name: new RegExp(text) });
  const layout = item.querySelector<HTMLElement>(':scope > .fui-TreeItemLayout');
  if (!layout) throw new Error(`Missing layout for ${text}`);
  return layout;
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Tree',
  component: Tree,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useTree/useTreeItem/useTreeItemLayout and their render functions from headless preview 0.4.1, with CSS Modules ported from react-tree 9.17.1. Each row compares the legacy Fluent Tree with the headless CoreAI Tree. The wrapper restores the size and appearance props, a default ChevronRight12Regular expand icon (rotated in CSS from data-open), and native checkbox/radio selector styling that matches CoreAI Checkbox and Radio. Navigation, open state, selection, data-navigation-mode/data-selection-mode/data-item-type/data-open/data-checked, and the focusgroup on actions remain headless-owned. Subtree collapse has no motion.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: treeSizes },
    appearance: { control: 'select', options: treeAppearances },
    selectionMode: { control: 'select', options: ['none', 'single', 'multiselect'] },
    navigationMode: { control: 'select', options: ['tree', 'treegrid'] },
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TreeComparison />,
  play: async ({ canvasElement }) => {
    await waitFor(() => getRow(canvasElement, 'Default'));
    for (const name of ['Default', 'Size: small', 'Size: medium']) {
      const { legacy, headless } = getRow(canvasElement, name);
      for (const text of ['Documents', 'Reports', 'Q1 summary', 'Readme']) {
        const before = layoutFor(legacy, text);
        const after = layoutFor(headless, text);
        await expect(after.getBoundingClientRect().height).toBe(
          before.getBoundingClientRect().height,
        );
        await expect(getComputedStyle(after).paddingInlineStart).toBe(
          getComputedStyle(before).paddingInlineStart,
        );
        await expect(getComputedStyle(after).fontSize).toBe(getComputedStyle(before).fontSize);
        await expect(getComputedStyle(after).backgroundColor).toBe(
          getComputedStyle(before).backgroundColor,
        );
      }
    }
    const { headless } = getRow(canvasElement, 'Default');
    const documents = within(headless).getByRole('treeitem', { name: /Documents/ });
    await expect(documents).toHaveAttribute('data-open');
    await expect(documents).toHaveAttribute('data-item-type', 'branch');
  },
};

export const RightToLeft: Story = {
  render: () => (
    <FluentProvider dir="rtl">
      <TreeComparison examples={[{ name: 'RTL', props: { defaultOpenItems: ['documents'] } }]} />
    </FluentProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => getRow(canvasElement, 'RTL'));
    const { legacy, headless } = getRow(canvasElement, 'RTL');
    for (const text of ['Documents', 'Reports', 'Meeting notes']) {
      await expect(getComputedStyle(layoutFor(headless, text)).paddingRight).toBe(
        getComputedStyle(layoutFor(legacy, text)).paddingRight,
      );
    }
  },
};

export const FileExplorer: Story = {
  args: { selectionMode: 'multiselect' },
  render: (args) => (
    <FocusgroupConsumer>
      <DocumentTree
        implementation="headless"
        label="File explorer"
        decorated
        defaultOpenItems={['documents']}
        {...args}
      />
    </FocusgroupConsumer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documents = await canvas.findByRole('treeitem', { name: /Documents/ });
    documents.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('treeitem', { name: /Reports/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('treeitem', { name: /Reports/ })).toHaveAttribute('data-open');
    await userEvent.keyboard('{ArrowDown}');
    const q1 = canvas.getByRole('treeitem', { name: /Q1 summary/ });
    await expect(q1).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(q1).toHaveAttribute('aria-checked', 'true');
    await expect(q1).toHaveAttribute('data-checked', '');
  },
};
