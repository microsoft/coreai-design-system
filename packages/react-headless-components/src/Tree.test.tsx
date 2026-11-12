// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  DocumentTree,
  getComparisonTree,
  type DocumentTreeProps,
} from '../../../apps/storybook/src/stories/experiments/TreeComparison.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import { Tree, treeClassNames, type TreeOpenChangeData } from './Tree.js';
import { TreeItem, treeItemClassNames } from './TreeItem.js';
import { TreeItemLayout, treeItemLayoutClassNames } from './TreeItemLayout.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

const html = (element: Element | null | undefined) => {
  if (!(element instanceof HTMLElement)) throw new Error('Missing element');
  return element;
};

function item(container: HTMLElement, text: string) {
  return html(
    Array.from(container.querySelectorAll<HTMLElement>('[role="treeitem"]')).find(
      (element) =>
        element.querySelector(':scope > .fui-TreeItemLayout .fui-TreeItemLayout__main')
          ?.textContent === text,
    ),
  );
}

function layout(treeItem: HTMLElement) {
  return html(treeItem.querySelector(':scope > .fui-TreeItemLayout'));
}

async function renderTree(
  props: DocumentTreeProps & { decorated?: boolean } = {},
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <button type="button">Before</button>
      <DocumentTree implementation="headless" label="Documents tree" {...props} />
      <button type="button">After</button>
    </FocusgroupConsumer>,
    { providerProps: { theme: coreaiLightTheme, dir } },
  );
  await expect.element(screen.getByRole('tree')).toBeInTheDocument();
  return { screen, tree: html(screen.container.querySelector('[role="tree"]')) };
}

test('renders roles, class names, and headless data attributes', async () => {
  const { tree } = await renderTree({ defaultOpenItems: ['documents'] });
  expect(tree.classList.contains(treeClassNames.root)).toBe(true);
  expect(tree.getAttribute('data-navigation-mode')).toBe('tree');
  expect(tree.hasAttribute('data-selection-mode')).toBe(false);
  expect(tree.getAttribute('data-size')).toBe('medium');
  expect(tree.getAttribute('data-appearance')).toBe('subtle');

  const subtree = html(tree.querySelector('[role="group"]'));
  expect(subtree.classList.contains(treeClassNames.root)).toBe(true);
  expect(subtree.hasAttribute('data-navigation-mode')).toBe(false);

  const documents = item(tree, 'Documents');
  expect(documents.classList.contains(treeItemClassNames.root)).toBe(true);
  expect(documents.getAttribute('data-item-type')).toBe('branch');
  expect(documents.getAttribute('data-open')).toBe('');
  expect(documents.getAttribute('aria-expanded')).toBe('true');
  expect(documents.style.getPropertyValue('--fluent-TreeItem--level')).toBe('1');

  const reports = item(tree, 'Reports');
  expect(reports.hasAttribute('data-open')).toBe(false);
  expect(reports.style.getPropertyValue('--fluent-TreeItem--level')).toBe('2');
  const readme = item(tree, 'Readme');
  expect(readme.getAttribute('data-item-type')).toBe('leaf');
  expect(readme.hasAttribute('data-open')).toBe(false);

  const documentsLayout = layout(documents);
  expect(documentsLayout.classList.contains(treeItemLayoutClassNames.root)).toBe(true);
  expect(documentsLayout.getAttribute('data-size')).toBe('medium');
  const expandIcon = html(documentsLayout.querySelector(`.${treeItemLayoutClassNames.expandIcon}`));
  expect(expandIcon.getAttribute('aria-hidden')).toBe('true');
  expect(expandIcon.querySelector('svg')).not.toBeNull();
  expect(layout(readme).querySelector(`.${treeItemLayoutClassNames.expandIcon}`)).toBeNull();
  expect(documentsLayout.querySelector(`.${treeItemLayoutClassNames.main}`)?.textContent).toBe(
    'Documents',
  );
});

for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir}: indents by level and rotates the chevron from data-open`, async () => {
    const { tree } = await renderTree({ defaultOpenItems: ['documents'] }, dir);
    const documents = item(tree, 'Documents');
    const reports = item(tree, 'Reports');
    const notes = item(tree, 'Meeting notes');
    const readme = item(tree, 'Readme');
    const start = dir === 'ltr' ? 'paddingLeft' : 'paddingRight';
    expect(getComputedStyle(layout(documents))[start]).toBe('0px');
    expect(getComputedStyle(layout(reports))[start]).toBe('24px');
    expect(getComputedStyle(layout(notes))[start]).toBe('48px');
    expect(getComputedStyle(layout(readme))[start]).toBe('24px');

    const chevron = (treeItem: HTMLElement) => {
      const svg = layout(treeItem).querySelector(`.${treeItemLayoutClassNames.expandIcon} svg`);
      if (!svg) throw new Error(layout(treeItem).outerHTML);
      return svg;
    };
    const rotation = (element: Element) => {
      const { a, b } = new DOMMatrix(getComputedStyle(element).transform);
      return Math.round((Math.atan2(b, a) * 180) / Math.PI);
    };
    await vi.waitFor(() => expect(rotation(chevron(documents))).toBe(90));
    await vi.waitFor(() =>
      expect(Math.abs(rotation(chevron(reports)))).toBe(dir === 'ltr' ? 0 : 180),
    );
  });
}

test('keyboard navigation opens, closes, and moves between items', async () => {
  const onOpenChange = vi.fn<(event: unknown, data: TreeOpenChangeData) => void>();
  const { screen, tree } = await renderTree({ onOpenChange });
  const documents = item(tree, 'Documents');
  html(screen.getByRole('button', { name: 'Before' }).element()).focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(documents);
  expect(documents.matches(':focus-visible')).toBe(true);
  expect(getComputedStyle(layout(documents)).outlineStyle).toBe('solid');

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(documents).toHaveAttribute('data-open', '');
  expect(onOpenChange).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ open: true, value: 'documents', type: 'ArrowRight' }),
  );
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(item(tree, 'Reports'));
  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(item(tree, 'Meeting notes'));
  await userEvent.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(item(tree, 'Readme'));
  await userEvent.keyboard('{Home}');
  expect(document.activeElement).toBe(documents);
  await userEvent.keyboard('{End}');
  expect(document.activeElement).toBe(item(tree, 'Readme'));
  await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
  expect(document.activeElement).toBe(documents);
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(documents).not.toHaveAttribute('data-open');
  await userEvent.keyboard('{Enter}');
  await expect.element(documents).toHaveAttribute('data-open', '');
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('pointer click toggles a branch and does not show the keyboard focus ring', async () => {
  const { tree } = await renderTree();
  const documents = item(tree, 'Documents');
  await userEvent.click(layout(documents));
  await expect.element(documents).toHaveAttribute('data-open', '');
  expect(item(tree, 'Reports')).toBeTruthy();
  expect(document.activeElement).toBe(documents);
  expect(getComputedStyle(layout(documents)).outlineStyle).toBe('none');
  await userEvent.click(layout(documents));
  await expect.element(documents).not.toHaveAttribute('data-open');
});

test('multiselect renders a CoreAI-styled native checkbox selector with mixed state', async () => {
  const { tree } = await renderTree({
    selectionMode: 'multiselect',
    defaultOpenItems: ['documents', 'reports'],
    defaultCheckedItems: [
      ['q1', true],
      ['reports', 'mixed'],
    ],
  });
  expect(tree.getAttribute('data-selection-mode')).toBe('multiselect');
  const q1 = item(tree, 'Q1 summary');
  const reports = item(tree, 'Reports');
  expect(q1.getAttribute('data-checked')).toBe('');
  expect(q1.getAttribute('aria-checked')).toBe('true');
  expect(reports.getAttribute('data-checked')).toBe('mixed');

  const selector = (treeItem: HTMLElement) =>
    html(
      layout(treeItem).querySelector(`.${treeItemLayoutClassNames.selector}`),
    ) as HTMLInputElement;
  expect(selector(q1).type).toBe('checkbox');
  expect(selector(q1).checked).toBe(true);
  expect(selector(reports).indeterminate).toBe(true);
  const checked = getComputedStyle(selector(q1));
  expect(checked.width).toBe('16px');
  expect(checked.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(checked.borderTopColor).toBe(checked.backgroundColor);
  expect(getComputedStyle(selector(q1), '::after').maskImage).toContain('data:image/svg+xml');
  expect(getComputedStyle(selector(reports)).backgroundColor).toBe('rgba(0, 0, 0, 0)');

  const q2 = item(tree, 'Q2 summary');
  await userEvent.click(selector(q2));
  await expect.element(q2).toHaveAttribute('data-checked', '');
  expect(document.activeElement).toBe(q2);
  await userEvent.keyboard(' ');
  await expect.element(q2).not.toHaveAttribute('data-checked');
});

test('single selection renders a radio selector and selects with Space', async () => {
  const { tree } = await renderTree({ selectionMode: 'single', defaultOpenItems: ['documents'] });
  expect(tree.getAttribute('data-selection-mode')).toBe('single');
  const readme = item(tree, 'Readme');
  const radio = html(layout(readme).querySelector(`.${treeItemLayoutClassNames.selector}`));
  expect((radio as HTMLInputElement).type).toBe('radio');
  readme.focus();
  await userEvent.keyboard(' ');
  await expect.element(readme).toHaveAttribute('aria-selected', 'true');
  expect(readme.getAttribute('data-checked')).toBe('');
  expect(getComputedStyle(radio).borderRadius).not.toBe('4px');
  expect(getComputedStyle(radio, '::after').transform).toContain('0.625');
});

test('actions appear on focus and use the headless focusgroup', async () => {
  const { screen, tree } = await renderTree({ defaultOpenItems: ['documents'], decorated: true });
  const notes = item(tree, 'Meeting notes');
  expect(layout(notes).querySelector(`.${treeItemLayoutClassNames.actions}`)).toBeNull();
  notes.focus();
  const actions = await vi.waitFor(() =>
    html(layout(notes).querySelector(`.${treeItemLayoutClassNames.actions}`)),
  );
  expect(actions.getAttribute('focusgroup')).toBe('toolbar inline wrap');
  const share = html(screen.getByRole('button', { name: 'Share Meeting notes' }).element());
  const more = html(
    screen.getByRole('button', { name: 'More options for Meeting notes' }).element(),
  );
  share.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(more);
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(share);
  expect(getComputedStyle(actions).marginLeft).not.toBe('0px');
});

test('size and appearance flow from the root tree to every layout', async () => {
  const { tree } = await renderTree({
    size: 'small',
    appearance: 'transparent',
    defaultOpenItems: ['documents'],
  });
  const reports = layout(item(tree, 'Reports'));
  expect(reports.getAttribute('data-size')).toBe('small');
  expect(reports.getAttribute('data-appearance')).toBe('transparent');
  expect(reports.getBoundingClientRect().height).toBe(24);
});

for (const [themeName, theme] of themes) {
  for (const props of [
    {},
    { size: 'small' },
    { appearance: 'subtle-alpha' },
    { appearance: 'transparent' },
    { decorated: true },
  ] as const) {
    test(`${themeName} ${JSON.stringify(props)}: computed styles match legacy Tree`, async () => {
      const screen = await renderCoreAIComponent(
        <>
          <div data-testid="pointer-rest" style={{ height: 24 }} />
          {(['legacy', 'headless'] as const).map((implementation) => (
            <div key={implementation} data-implementation={implementation} style={{ width: 320 }}>
              <DocumentTree
                implementation={implementation}
                label={implementation}
                defaultOpenItems={['documents', 'reports']}
                {...props}
              />
            </div>
          ))}
        </>,
        { providerProps: { theme } },
      );
      await expect.element(screen.getByRole('tree', { name: 'headless' })).toBeInTheDocument();
      await userEvent.hover(screen.getByTestId('pointer-rest'));
      const legacy = getComparisonTree(screen.container, 'legacy');
      const headless = getComparisonTree(screen.container, 'headless');
      const properties = [
        'minHeight',
        'paddingLeft',
        'paddingRight',
        'color',
        'backgroundColor',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'display',
        'alignItems',
      ] as const;
      for (const text of ['Documents', 'Reports', 'Q1 summary', 'Meeting notes', 'Readme']) {
        const before = layout(item(legacy, text));
        const after = layout(item(headless, text));
        for (const property of properties) {
          expect(getComputedStyle(after)[property], `${text} ${property}`).toBe(
            getComputedStyle(before)[property],
          );
        }
        expect(after.getBoundingClientRect().height, `${text} height`).toBe(
          before.getBoundingClientRect().height,
        );
        for (const slot of ['main', 'expandIcon', 'iconBefore', 'aside'] as const) {
          const selector = `.${treeItemLayoutClassNames[slot]}`;
          const legacySlot = before.querySelector<HTMLElement>(selector);
          const headlessSlot = after.querySelector<HTMLElement>(selector);
          expect(!!headlessSlot, `${text} ${slot} presence`).toBe(!!legacySlot);
          if (!legacySlot || !headlessSlot) continue;
          for (const property of [
            'color',
            'paddingLeft',
            'paddingRight',
            'paddingTop',
            'minWidth',
          ] as const) {
            expect(getComputedStyle(headlessSlot)[property], `${text} ${slot} ${property}`).toBe(
              getComputedStyle(legacySlot)[property],
            );
          }
          const box = (element: HTMLElement) => element.getBoundingClientRect();
          expect(box(headlessSlot).width, `${text} ${slot} width`).toBeCloseTo(
            box(legacySlot).width,
            0,
          );
        }
      }
      expect(getComputedStyle(headless).rowGap).toBe(getComputedStyle(legacy).rowGap);
    });
  }
}

test('hover background matches legacy Tree', async () => {
  const screen = await renderCoreAIComponent(
    <>
      {(['legacy', 'headless'] as const).map((implementation) => (
        <div key={implementation} data-implementation={implementation}>
          <DocumentTree implementation={implementation} label={implementation} />
        </div>
      ))}
    </>,
    { providerProps: { theme: coreaiLightTheme } },
  );
  await expect.element(screen.getByRole('tree', { name: 'headless' })).toBeInTheDocument();
  const colors = [];
  for (const implementation of ['legacy', 'headless'] as const) {
    const target = layout(item(getComparisonTree(screen.container, implementation), 'Readme'));
    await userEvent.hover(target);
    colors.push([getComputedStyle(target).backgroundColor, getComputedStyle(target).color]);
  }
  expect(colors[1]).toEqual(colors[0]);
  expect(colors[0][0]).not.toBe('rgba(0, 0, 0, 0)');
});

test('wrapper components render standalone with explicit slots', async () => {
  const screen = await renderCoreAIComponent(
    <Tree aria-label="Standalone" defaultOpenItems={['a']}>
      <TreeItem itemType="branch" value="a">
        <TreeItemLayout expandIcon={<span data-testid="custom-expand">+</span>}>A</TreeItemLayout>
        <Tree>
          <TreeItem itemType="leaf" value="b">
            <TreeItemLayout iconAfter={<span>i</span>}>B</TreeItemLayout>
          </TreeItem>
        </Tree>
      </TreeItem>
    </Tree>,
    { providerProps: { theme: coreaiLightTheme } },
  );
  await expect.element(screen.getByTestId('custom-expand')).toBeInTheDocument();
  const b = item(screen.container, 'B');
  expect(layout(b).querySelector(`.${treeItemLayoutClassNames.iconAfter}`)?.textContent).toBe('i');
});
