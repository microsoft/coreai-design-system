// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/list';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  ListComparison,
  listConsumerExample,
  listExamples,
  type ListExample,
} from '../../../apps/storybook/src/stories/experiments/ListComparison.js';
import { ListComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/ListComparisonReport.js';
import {
  ListBoundariesFlow,
  ListCompositeFlow,
  ListSelectionFlow,
  listArchiveValue,
  listDesignValue,
  listLockedValue,
  listReviewValue,
} from '../../../apps/storybook/src/stories/experiments/ListFlows.js';
import {
  captureListNativeContract,
  captureListStyles,
  compareListStyles,
  getComparisonList,
  getListRow,
  requireListHTML,
  settleListStyles,
} from '../../../apps/storybook/src/stories/experiments/compareListStyles.js';
import {
  List,
  listClassNames,
  useListContext,
  useListContextValues,
  type ListProps,
  type ListSlots,
} from './List.js';
import {
  ListItem,
  listItemClassNames,
  type ListItemProps,
  type ListItemSlots,
} from './ListItem.js';
import { Checkbox } from './Checkbox.js';

const initialURL = window.location.href;

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
  if (window.location.href !== initialURL) window.history.replaceState(null, '', initialURL);
});

function html(locator: { element(): Element }): HTMLElement {
  return requireListHTML(locator.element());
}

function exampleNamed(name: string): ListExample {
  const example = listExamples.find((candidate) => candidate.name === name);
  if (!example) throw new Error(`Missing List fixture ${name}`);
  return example;
}

function renderFlow(children: React.ReactNode, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <CoreAIFluentProvider theme={coreaiLightTheme} dir={dir}>
      {children}
    </CoreAIFluentProvider>,
  );
}

async function renderPair(
  example: ListExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <FocusgroupConsumer>
        <ListComparison example={example} />
      </FocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonList(screen.container, 'legacy');
  const headless = getComparisonList(screen.container, 'headless');
  await settleListStyles(legacy, headless);
  return {
    screen,
    legacy,
    headless,
    differences: () =>
      compareListStyles(captureListStyles(legacy), captureListStyles(headless), example.consumer),
  };
}

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of listExamples) {
    test(`${themeName}: ${example.name} preserves List, row, checkmark and content style/geometry`, async () => {
      const pair = await renderPair(example, theme);
      expect(pair.differences()).toEqual([]);
    });
  }
}

for (const name of ['Noninteractive', 'Composite selection', 'Wrapped content']) {
  test(`RTL: ${name} retains logical content/action/checkmark geometry`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, true, 'rtl');
    expect(pair.differences()).toEqual([]);
    expect(getComputedStyle(pair.headless).direction).toBe('rtl');
  });
}

for (const name of ['Noninteractive', 'Composite selection']) {
  test(`disabling CoreAI defaults does not invent List visual defaults: ${name}`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, false);
    expect(pair.differences()).toEqual([]);
    for (const prop of ['data-size', 'data-layout', 'data-inset', 'data-spacing']) {
      expect(pair.headless).not.toHaveAttribute(prop);
    }
  });
}

test('ordinary consumer CSS outranks component resets and the reused native checkmark foundation', async () => {
  const pair = await renderPair(listConsumerExample);
  expect(pair.differences().filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  const row = getListRow(pair.headless, 'alpha');
  const checkmark = row.querySelector('input[type="checkbox"]');
  if (!(checkmark instanceof HTMLInputElement)) throw new Error('Missing native List checkmark');
  expect(getComputedStyle(pair.headless).paddingTop).toBe('7px');
  expect(getComputedStyle(row).paddingInlineStart).toBe('9px');
  expect(getComputedStyle(row).borderRadius).toBe('3px');
  expect(getComputedStyle(checkmark).borderRadius).toBe('3px');
  expect(getComputedStyle(checkmark).borderTopWidth).toBe('2px');
});

test('the strict shared report exposes final fixture-specific readiness, counts and actual geometry', async () => {
  const screen = await renderFlow(<ListComparisonWithReport />);
  await userEvent.hover(screen.getByTestId('list-report-pointer-rest'));
  const report = screen.getByRole('status', { name: 'List style report' });
  await expect.element(report).toHaveAttribute('data-list-report-state', 'ready');
  await settleListStyles();
  screen
    .getByLabelText('List visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleListStyles();
  await expect.element(report).toHaveAttribute('data-list-report-state', 'ready');
  for (const name of ['Noninteractive', 'Composite selection', 'Wrapped content']) {
    await screen.getByLabelText('List visual fixture').selectOptions(name);
    await expect.element(report).toHaveAttribute('data-list-report-state', 'ready');
    await expect.element(report).toHaveAttribute('data-list-report-example', name);
    await expect.element(report).toHaveAttribute('data-list-unexpected-count', '0');
    await expect.element(report).toHaveAttribute('data-list-row-count', '3');
    await expect
      .element(report)
      .toHaveAttribute('data-list-checkmark-count', name === 'Composite selection' ? '3' : '0');
    const list = getComparisonList(screen.container, 'headless');
    const rect = list.getBoundingClientRect();
    expect(rect.width).toBe(Number(html(report).getAttribute('data-list-width')));
    expect(rect.height).toBe(Number(html(report).getAttribute('data-list-height')));
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  }
});

test('public props remain the exact current facade and both components retain ForwardRefComponent contracts', () => {
  expectTypeOf<ListProps>().toEqualTypeOf<primitive.ListProps>();
  expectTypeOf<ListItemProps>().toEqualTypeOf<primitive.ListItemProps>();
  expectTypeOf(List).toMatchTypeOf<ForwardRefComponent<ListProps>>();
  expectTypeOf(ListItem).toMatchTypeOf<ForwardRefComponent<ListItemProps>>();
  expectTypeOf(useListContext).toEqualTypeOf<typeof primitive.useListContext>();
  expectTypeOf(useListContextValues).toEqualTypeOf<typeof primitive.useListContextValues>();
  expectTypeOf<ExtractSlotProps<ListItemSlots['checkmark']>>().toMatchTypeOf<
    React.InputHTMLAttributes<HTMLInputElement>
  >();
});

test('noninteractive lists keep native ordered/div branches, list semantics, refs and no focus/selection machinery', async () => {
  const orderedRef = React.createRef<HTMLOListElement>();
  const itemRef = React.createRef<HTMLLIElement>();
  const divRef = React.createRef<HTMLDivElement>();
  const screen = await renderFlow(
    <>
      <List as="ol" ref={orderedRef} aria-label="Ordered ingredients" className="caller-list">
        <ListItem value="flour" ref={itemRef} className="caller-item" aria-label="Flour">
          Flour
        </ListItem>
      </List>
      <List as="div" ref={divRef} aria-label="Div ingredients">
        <ListItem as="div">Water</ListItem>
      </List>
    </>,
  );
  expect(orderedRef.current).toBe(
    screen.getByRole('list', { name: 'Ordered ingredients' }).element(),
  );
  expect(orderedRef.current?.tagName).toBe('OL');
  expect(orderedRef.current).toHaveClass(listClassNames.root, 'caller-list');
  expect(itemRef.current).toBe(screen.getByRole('listitem', { name: 'Flour' }).element());
  expect(itemRef.current).toHaveClass(listItemClassNames.root, 'caller-item');
  expect(itemRef.current).not.toHaveAttribute('tabindex');
  expect(itemRef.current).not.toHaveAttribute('aria-selected');
  expect(itemRef.current).not.toHaveAttribute('data-selectable');
  expect(orderedRef.current).not.toHaveAttribute('focusgroup');
  expect(divRef.current?.tagName).toBe('DIV');
  expect(
    screen.getByRole('list', { name: 'Div ingredients' }).getByRole('listitem').element().tagName,
  ).toBe('DIV');
  expect(screen.container.querySelector('[data-tabster]')).toBeNull();
});

for (const [mode, expected] of [
  ['multiselect', [listDesignValue, listReviewValue]],
  ['single', [listReviewValue]],
] as const) {
  test(`${mode}: native item arrows focus without selecting, Space retains numeric values and exact selection payloads`, async () => {
    const screen = await renderFlow(<ListSelectionFlow selectionMode={mode} />);
    await userEvent.hover(screen.getByTestId('list-flow-pointer-rest'));
    const design = screen.getByRole('option', { name: 'Design review', exact: true });
    const review = screen.getByRole('option', { name: 'Accessibility audit', exact: true });
    html(design).focus();
    await expect.element(design).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(review).toHaveFocus();
    const events = screen.getByLabelText('List selection events');
    await expect.element(events).toHaveAttribute('data-list-change-count', '0');
    await expect.element(design).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard(' ');
    await expect.element(events).toHaveAttribute('data-list-change-count', '1');
    await expect
      .element(events)
      .toHaveAttribute('data-list-change-values', JSON.stringify(expected));
    await expect.element(events).toHaveAttribute('data-list-event-type', 'keydown');
    await expect.element(events).toHaveAttribute('data-list-data-type', 'change');
    await expect.element(events).toHaveAttribute('data-list-same-event', 'true');
    await expect.element(events).toHaveAttribute('data-list-event-target', String(listReviewValue));
    await expect
      .element(events)
      .toHaveAttribute('data-list-event-current-target', String(listReviewValue));
    await expect.element(review).toHaveAttribute('aria-selected', 'true');
  });
}

test('controlled rejection preserves selected DOM identity and disabled selection makes no request', async () => {
  const screen = await renderFlow(<ListSelectionFlow />);
  const design = screen.getByRole('option', { name: 'Design review', exact: true });
  const original = design.element();
  const events = screen.getByLabelText('List selection events');
  await screen.getByRole('checkbox', { name: 'Reject selection requests', exact: true }).click();
  await design.click();
  await expect.element(events).toHaveAttribute('data-list-change-count', '1');
  await expect.element(events).toHaveAttribute('data-list-change-values', '[]');
  await expect
    .element(events)
    .toHaveAttribute('data-list-selected-values', JSON.stringify([listDesignValue]));
  await expect.element(design).toHaveAttribute('aria-selected', 'true');
  expect(design.element()).toBe(original);
  const locked = screen.getByRole('option', { name: 'Locked project', exact: true });
  // Bypass runner actionability to exercise the aria-disabled row's actual native click guard.
  await userEvent.click(locked, { force: true });
  await expect.element(locked).toHaveAttribute('aria-disabled', 'true');
  await expect.element(locked).toHaveAttribute('data-disabled', '');
  expect(getComputedStyle(html(locked)).cursor).toBe('default');
  html(locked).focus();
  await userEvent.keyboard(' ');
  await expect.element(events).toHaveAttribute('data-list-change-count', '1');
  await expect.element(events).not.toHaveAttribute('data-list-event-target', listLockedValue);
  await screen.getByRole('checkbox', { name: 'Reject selection requests', exact: true }).click();
  await design.click();
  await expect.element(design).toHaveAttribute('aria-selected', 'false');
  expect(design.element()).toBe(original);
});

test('custom primary actions preserve the public CustomEvent and original native/React event without selecting', async () => {
  const screen = await renderFlow(<ListSelectionFlow />);
  const archive = screen.getByRole('option', { name: 'Open archive', exact: true });
  const action = screen.getByLabelText('List primary actions');
  const selection = screen.getByLabelText('List selection events');
  await archive.click();
  await expect.element(action).toHaveAttribute('data-list-action-count', '1');
  await expect.element(action).toHaveAttribute('data-list-action-value', listArchiveValue);
  await expect.element(action).toHaveAttribute('data-list-action-event-type', 'ListItemAction');
  await expect.element(action).toHaveAttribute('data-list-action-data-type', 'ListItemAction');
  await expect.element(action).toHaveAttribute('data-list-action-same-event', 'true');
  await expect.element(action).toHaveAttribute('data-list-action-original-type', 'click');
  await expect
    .element(action)
    .toHaveAttribute('data-list-action-original-target', listArchiveValue);
  await expect
    .element(action)
    .toHaveAttribute('data-list-action-original-current-target', listArchiveValue);
  html(archive).focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(action).toHaveAttribute('data-list-action-count', '2');
  await expect.element(action).toHaveAttribute('data-list-action-original-type', 'keydown');
  await expect.element(selection).toHaveAttribute('data-list-change-count', '0');
  await userEvent.keyboard(' ');
  await expect.element(action).toHaveAttribute('data-list-action-count', '2');
  await expect.element(selection).toHaveAttribute('data-list-change-count', '1');
  await expect
    .element(selection)
    .toHaveAttribute(
      'data-list-change-values',
      JSON.stringify([listDesignValue, listArchiveValue]),
    );
});

test('uncontrolled action-only rows activate with Space/Enter, and consumer event cancellation remains authoritative', async () => {
  const onAction = vi.fn<NonNullable<ListItemProps['onAction']>>();
  const screen = await renderFlow(
    <List navigationMode="items" aria-label="Action list">
      <ListItem value="run" onAction={onAction} aria-label="Run checks">
        Run checks
      </ListItem>
      <ListItem
        value="cancel"
        onAction={onAction}
        aria-label="Cancelled action"
        onKeyDown={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
      >
        Cancelled action
      </ListItem>
    </List>,
  );
  const run = screen.getByRole('listitem', { name: 'Run checks', exact: true });
  const listener = vi.fn<(event: Event) => void>();
  html(run).addEventListener('ListItemAction', listener);
  html(run).focus();
  await userEvent.keyboard(' {Enter}');
  expect(onAction).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenCalledTimes(2);
  for (const [index, [event, data]] of onAction.mock.calls.entries()) {
    expect(event).toBeInstanceOf(CustomEvent);
    expect(data.event).toBe(event);
    expect(data.type).toBe('ListItemAction');
    expect(data.value).toBe('run');
    if (data.type !== 'ListItemAction') {
      throw new Error('Expected the current typed ListItemAction payload');
    }
    expect(data.event.detail.originalEvent.type).toBe('keydown');
    expect(listener.mock.calls[index][0]).toBe(event);
  }
  const cancelled = screen.getByRole('listitem', { name: 'Cancelled action', exact: true });
  await cancelled.click();
  html(cancelled).focus();
  await userEvent.keyboard(' {Enter}');
  expect(onAction).toHaveBeenCalledTimes(2);
});

test('caller List/row renderers preserve intrinsic roots, classes, refs, native slots and exact checkbox callback identity', async () => {
  const listRef = React.createRef<HTMLOListElement>();
  const rowRef = React.createRef<HTMLLIElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const renderedRowRef = React.createRef<HTMLDivElement>();
  const checkboxEvents: React.ChangeEvent<HTMLInputElement>[] = [];
  const selectionEvents: Parameters<NonNullable<ListProps['onSelectionChange']>>[] = [];
  const renderRowRoot: SlotRenderFunction<
    Extract<ExtractSlotProps<ListItemSlots['root']>, { as: 'div' }>
  > = (_Component, props) => (
    <div {...props} data-list-caller-rendered="">
      Caller row content
    </div>
  );
  const checkmark = {
    as: 'input',
    ref: inputRef,
    className: 'caller-checkmark',
    'aria-label': 'Caller native checkmark',
    'data-caller-checkmark': 'preserved',
    name: 'selection',
    value: 'submitted-native-value',
    tabIndex: 0,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => checkboxEvents.push(event),
  } satisfies ExtractSlotProps<ListItemSlots['checkmark']> & {
    'data-caller-checkmark': string;
  };
  const renderListRoot: SlotRenderFunction<
    Extract<ExtractSlotProps<ListSlots['root']>, { as: 'ol' }>
  > = (_Component, props) => (
    <ol {...props} data-list-caller-rendered="">
      <ListItem
        as="li"
        value={73}
        ref={rowRef}
        className="caller-row"
        aria-label="Caller native row"
        checkmark={checkmark}
      >
        <span role="gridcell">Original native input</span>
      </ListItem>
    </ol>
  );
  const screen = await renderFlow(
    <>
      <List
        as="ol"
        ref={listRef}
        aria-label="Caller ordered collection"
        className="caller-list"
        navigationMode="composite"
        selectionMode="multiselect"
        onSelectionChange={(...args) => selectionEvents.push(args)}
      >
        {renderListRoot}
      </List>
      <List as="div" aria-label="Caller div collection">
        <ListItem
          as="div"
          value="rendered"
          ref={renderedRowRef}
          aria-label="Caller rendered row"
          className="caller-rendered-row"
          checkmark={null}
        >
          {renderRowRoot}
        </ListItem>
      </List>
    </>,
  );
  expect(listRef.current).toBe(
    screen.getByRole('grid', { name: 'Caller ordered collection', exact: true }).element(),
  );
  expect(listRef.current?.tagName).toBe('OL');
  expect(listRef.current).toHaveClass(listClassNames.root, 'caller-list');
  expect(listRef.current).toHaveAttribute('data-list-caller-rendered', '');
  expect(rowRef.current).toBe(
    screen.getByRole('row', { name: 'Caller native row', exact: true }).element(),
  );
  expect(rowRef.current?.tagName).toBe('LI');
  expect(rowRef.current).toHaveClass(listItemClassNames.root, 'caller-row');
  expect(inputRef.current).toBe(
    screen.getByRole('checkbox', { name: 'Caller native checkmark', exact: true }).element(),
  );
  expect(inputRef.current).toHaveClass(listItemClassNames.checkmark, 'caller-checkmark');
  expect(inputRef.current).toHaveAttribute('data-caller-checkmark', 'preserved');
  expect(inputRef.current?.name).toBe('selection');
  expect(inputRef.current?.value).toBe('submitted-native-value');
  expect(inputRef.current?.parentElement).toHaveAttribute('role', 'gridcell');
  expect(renderedRowRef.current).toHaveAttribute('data-list-caller-rendered', '');
  expect(renderedRowRef.current).toHaveClass('caller-rendered-row', listItemClassNames.root);
  await screen.getByRole('checkbox', { name: 'Caller native checkmark', exact: true }).click();
  expect(checkboxEvents).toHaveLength(1);
  expect(selectionEvents).toHaveLength(1);
  expect(selectionEvents[0][0]).toBe(checkboxEvents[0]);
  expect(selectionEvents[0][1].event).toBe(checkboxEvents[0]);
  expect(selectionEvents[0][1].selectedItems).toEqual([73]);
  expect(inputRef.current?.checked).toBe(true);
});

test('a public checkmark onChange can cancel selection without a wrapper event or value normalization', async () => {
  const onSelection = vi.fn<NonNullable<ListProps['onSelectionChange']>>();
  const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => event.preventDefault());
  const screen = await renderFlow(
    <List navigationMode="composite" selectionMode="single" onSelectionChange={onSelection}>
      <ListItem
        value={44}
        aria-label="Veto native checkmark"
        checkmark={{ 'aria-label': 'Veto checkmark selection', onChange }}
      >
        <span role="gridcell">Consumer-owned cancellation</span>
      </ListItem>
    </List>,
  );
  await screen.getByRole('checkbox', { name: 'Veto checkmark selection', exact: true }).click();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onSelection).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole('row', { name: 'Veto native checkmark', exact: true }))
    .toHaveAttribute('aria-selected', 'false');
});

test('the public List context exposes the same selection state to consumer content', async () => {
  function CurrentSelection() {
    const values = useListContext((context) => context.selection?.selectedItems ?? []);
    return <output aria-label="Public List context">{JSON.stringify(values)}</output>;
  }
  const screen = await renderFlow(
    <List selectionMode="multiselect" defaultSelectedItems={[17]} navigationMode="composite">
      <ListItem value={17} aria-label="Context row" checkmark={null}>
        <span role="gridcell">
          <CurrentSelection />
        </span>
      </ListItem>
    </List>,
  );
  await expect.element(screen.getByLabelText('Public List context')).toHaveTextContent('[17]');
  await screen.getByRole('row', { name: 'Context row', exact: true }).click();
  await expect.element(screen.getByLabelText('Public List context')).toHaveTextContent('[]');
});

test('raw-current and styled selection without navigation do not invent item focusgroup or legacy default navigation', async () => {
  for (const raw of [true, false]) {
    const Collection = raw ? primitive.List : List;
    const Item = raw ? primitive.ListItem : ListItem;
    const onSelection = vi.fn<NonNullable<ListProps['onSelectionChange']>>();
    const screen = await renderFlow(
      <Collection
        aria-label="No navigation collection"
        selectionMode="single"
        onSelectionChange={onSelection}
      >
        <Item value="first" aria-label="First current row" checkmark={null}>
          First
        </Item>
        <Item value="second" aria-label="Second current row" checkmark={null}>
          Second
        </Item>
      </Collection>,
    );
    const collection = html(
      screen.getByRole('listbox', { name: 'No navigation collection', exact: true }),
    );
    expect(collection).not.toHaveAttribute('focusgroup');
    expect(collection).not.toHaveAttribute('data-navigation-mode');
    const first = screen.getByRole('option', { name: 'First current row', exact: true });
    const second = screen.getByRole('option', { name: 'Second current row', exact: true });
    expect(first.element()).toHaveAttribute('tabindex', '0');
    expect(second.element()).toHaveAttribute('tabindex', '0');
    html(first).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(first).toHaveFocus();
    await second.click();
    await expect.element(second).toHaveAttribute('aria-selected', 'true');
    expect(onSelection).toHaveBeenCalledTimes(1);
    await cleanup();
  }
});

test('raw-current and styled nested-action/disabledSelection boundaries have the same safe public composition', async () => {
  const screen = await renderFlow(<ListBoundariesFlow />);
  for (const name of ['Raw current', 'Styled current']) {
    const events = screen.getByLabelText(`${name} boundary events`);
    await screen.getByRole('button', { name: `${name} bubbling action`, exact: true }).click();
    await expect.element(events).toHaveAttribute('data-list-boundary-requests', '1');
    await expect.element(events).toHaveAttribute('data-list-boundary-selected', '["bubbled"]');
    await screen.getByRole('button', { name: `${name} safe action`, exact: true }).click();
    await expect.element(events).toHaveAttribute('data-list-boundary-requests', '1');
    const row = screen.getByRole('row', { name: `${name} action-only row`, exact: true });
    expect(row.element()).not.toHaveAttribute('aria-disabled');
    expect(row.element()).not.toHaveAttribute('data-disabled');
    await expect
      .element(screen.getByRole('checkbox', { name: `${name} disabled selection`, exact: true }))
      .toBeDisabled();
    await row.click();
    await expect.element(events).toHaveAttribute('data-list-boundary-actions', '1');
    await expect.element(events).toHaveAttribute('data-list-boundary-requests', '1');
  }
});

for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir}: current composite navigation preserves editable keys, row/control arrows, Escape and one returning Tab stop`, async () => {
    const screen = await renderFlow(<ListCompositeFlow />, dir);
    await userEvent.hover(screen.getByTestId('list-flow-pointer-rest'));
    const design = screen.getByRole('row', { name: 'Design review', exact: true });
    const review = screen.getByRole('row', { name: 'Accessibility audit', exact: true });
    const release = screen.getByRole('row', { name: 'Release notes', exact: true });
    const note = screen.getByRole('textbox', { name: 'Note for Design review', exact: true });
    const inspect = screen.getByRole('button', { name: 'Inspect Design review', exact: true });
    html(design).focus();
    await expect.element(design).toHaveFocus();
    await userEvent.keyboard(dir === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}');
    await expect.element(note).toHaveFocus();
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowDown}');
    await expect.element(note).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect.element(design).toHaveFocus();
    html(inspect).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(review).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(release).toHaveFocus();
    await userEvent.keyboard('{PageUp}');
    await expect.element(design).toHaveFocus();
    await userEvent.keyboard('{PageDown}');
    await expect.element(release).toHaveFocus();
    await userEvent.tab();
    await expect
      .element(screen.getByRole('button', { name: 'After project grid', exact: true }))
      .toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(release).toHaveFocus();
    expect(
      html(screen.getByRole('grid', { name: 'Editable projects', exact: true })),
    ).not.toHaveAttribute('focusgroup');
  });
}

test('composite controls keep exact native checkmarks, editor FormData, submitter identity, links and consumer reset', async () => {
  const screen = await renderFlow(<ListCompositeFlow includeCheckmarksInNavigation />);
  await userEvent.hover(screen.getByTestId('list-flow-pointer-rest'));
  const design = screen.getByRole('row', { name: 'Design review', exact: true });
  const designCheck = screen.getByRole('checkbox', { name: 'Select Design review', exact: true });
  const reviewCheck = screen.getByRole('checkbox', {
    name: 'Select Accessibility audit',
    exact: true,
  });
  html(design).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(designCheck).toHaveFocus();
  await reviewCheck.click();
  await expect.element(reviewCheck).toBeChecked();
  const note = screen.getByRole('textbox', { name: 'Note for Accessibility audit', exact: true });
  await note.fill('Audit approved');
  await screen.getByRole('button', { name: 'Submit projects', exact: true }).click();
  await expect.element(screen.getByLabelText('Submitted projects')).toHaveTextContent(
    JSON.stringify([
      ['projects', listDesignValue],
      ['note-design', 'Design draft'],
      ['projects', String(listReviewValue)],
      ['note-review', 'Audit approved'],
      ['note-release', 'Release draft'],
      ['action', 'save-projects'],
    ]),
  );
  await screen.getByRole('button', { name: 'Reset projects', exact: true }).click();
  await expect.element(note).toHaveValue('Audit draft');
  await expect.element(designCheck).toBeChecked();
  await expect.element(reviewCheck).not.toBeChecked();
  const link = screen.getByRole('link', { name: 'Open Design review details', exact: true });
  await link.click();
  await expect
    .element(screen.getByLabelText('List project links'))
    .toHaveAttribute('data-list-link-count', '1');
  await expect.poll(() => window.location.hash).toBe('#list-project-preview');
  await expect
    .element(screen.getByLabelText('Composite list state'))
    .toHaveAttribute('data-list-selected-values', JSON.stringify([listDesignValue]));
});

test('current composite navigation handles added rows and consumer-owned focus restoration after removal', async () => {
  const screen = await renderFlow(<ListCompositeFlow />);
  await screen.getByRole('button', { name: 'Add project', exact: true }).click();
  const added = screen.getByRole('row', { name: 'Release gate', exact: true });
  const design = screen.getByRole('row', { name: 'Design review', exact: true });
  html(design).focus();
  await userEvent.keyboard('{End}');
  await expect.element(added).toHaveFocus();
  await userEvent.keyboard('{Home}');
  await expect.element(design).toHaveFocus();
  await screen.getByRole('button', { name: 'Remove Accessibility audit', exact: true }).click();
  await expect
    .element(screen.getByRole('row', { name: 'Release notes', exact: true }))
    .toHaveFocus();
  await expect
    .element(screen.getByLabelText('Composite list state'))
    .toHaveAttribute('data-list-project-count', '3');
  expect(screen.getByRole('row', { name: 'Accessibility audit', exact: true }).query()).toBeNull();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(added).toHaveFocus();
});

test('native :focus-visible survives combined row hover without relying on provider focus attributes', async () => {
  const screen = await renderFlow(
    <FocusgroupConsumer>
      <div>
        <span data-testid="focus-pointer-rest">Pointer rest</span>
        <button type="button">Before visible List focus</button>
        <List navigationMode="items" aria-label="Visible focus list">
          <ListItem aria-label="Visible focus row">Focusable content</ListItem>
        </List>
      </div>
    </FocusgroupConsumer>,
  );
  await userEvent.hover(screen.getByTestId('focus-pointer-rest'));
  await screen.getByRole('button', { name: 'Before visible List focus', exact: true }).click();
  await userEvent.tab();
  const row = screen.getByRole('listitem', { name: 'Visible focus row', exact: true });
  await expect.element(row).toHaveFocus();
  expect(html(row).matches(':focus-visible')).toBe(true);
  expect(html(row).matches(':hover')).toBe(false);
  expect(getComputedStyle(html(row)).outlineStyle).toBe('solid');
  expect(getComputedStyle(html(row)).outlineWidth).toBe('2px');
  await userEvent.hover(row);
  expect(html(row).matches(':hover')).toBe(true);
  expect(html(row).matches(':focus-visible')).toBe(true);
  expect(getComputedStyle(html(row)).outlineStyle).toBe('solid');
  // The legacy provider bridge can annotate focused descendants; the List CSS must not depend on it.
  html(row).removeAttribute('data-fui-focus-visible');
  expect(html(row)).not.toHaveAttribute('data-fui-focus-visible');
  expect(html(row).matches(':focus-visible')).toBe(true);
  expect(getComputedStyle(html(row)).outlineStyle).toBe('solid');
  expect(getComputedStyle(html(row)).outlineWidth).toBe('2px');
});

test('combined Checkbox/List CSS keeps the native bridge state-specific after shared-foundation re-emission', async () => {
  const screen = await renderFlow(
    <>
      <Checkbox checked aria-label="Reference selected checkbox" />
      <List
        navigationMode="composite"
        selectionMode="multiselect"
        defaultSelectedItems={['checked', 'disabled']}
      >
        <ListItem
          value="checked"
          aria-label="Checked native row"
          checkmark={{ 'aria-label': 'Checked native input' }}
        >
          <span role="gridcell">Checked</span>
        </ListItem>
        <ListItem
          value="unchecked"
          aria-label="Unchecked native row"
          checkmark={{ 'aria-label': 'Unchecked native input' }}
        >
          <span role="gridcell">Unchecked</span>
        </ListItem>
        <ListItem
          value="disabled"
          disabledSelection
          aria-label="Disabled native row"
          checkmark={{ 'aria-label': 'Disabled native input' }}
        >
          <span role="gridcell">Disabled</span>
        </ListItem>
      </List>
    </>,
  );
  const checked = html(screen.getByRole('checkbox', { name: 'Checked native input', exact: true }));
  const unchecked = html(
    screen.getByRole('checkbox', { name: 'Unchecked native input', exact: true }),
  );
  const disabled = html(
    screen.getByRole('checkbox', { name: 'Disabled native input', exact: true }),
  );
  const reference = screen.container.querySelector('.fui-Checkbox__indicator');
  if (!reference) throw new Error('Missing completed Checkbox foundation');
  for (const input of [checked, unchecked, disabled]) {
    expect(input.tagName).toBe('INPUT');
    expect(getComputedStyle(input).width).toBe('16px');
    expect(getComputedStyle(input).height).toBe('16px');
    expect(getComputedStyle(input).marginTop).toBe('4px');
    expect(getComputedStyle(input).alignSelf).toBe('center');
    expect(getComputedStyle(input).pointerEvents).toBe('auto');
  }
  expect(getComputedStyle(checked).backgroundColor).toBe(
    getComputedStyle(reference).backgroundColor,
  );
  expect(getComputedStyle(checked).borderTopColor).toBe(getComputedStyle(reference).borderTopColor);
  expect(getComputedStyle(checked, '::before').visibility).toBe('visible');
  expect(getComputedStyle(checked, '::before').width).toBe('12px');
  expect(getComputedStyle(checked, '::before').maskImage).not.toBe('none');
  expect(getComputedStyle(unchecked, '::before').visibility).toBe('hidden');
  expect(disabled).toBeDisabled();
  expect(getComputedStyle(disabled).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('comparison native-contract evidence reports only actual published browser and API boundaries', async () => {
  const pair = await renderPair(exampleNamed('Composite selection'));
  const contract = captureListNativeContract(pair.headless);
  expect(contract.role).toBe('grid');
  expect(contract.navigation).toBe('composite');
  expect(contract.focusgroup).toBe('');
  expect(contract['native-checkmarks']).toBe('3');
  expect(contract['checkmark-cells']).toBe('3');
  expect(contract['visual-props']).toContain('No size, layout, inset, or spacing props');
  expect(pair.headless.querySelector('[data-tabster]')).toBeNull();
});
