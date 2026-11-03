// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/tab-list';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import { TabListFormFlow } from '../../../apps/storybook/src/stories/experiments/TabListFlows.js';
import { requireTabListHTML } from '../../../apps/storybook/src/stories/experiments/compareTabListStyles.js';
import {
  TabList,
  type SelectTabData,
  type SelectTabEvent,
  type TabListProps,
  type TabListSlots,
} from './TabList.js';
import {
  Tab,
  tabClassNames,
  tabReservedSpaceClassNames,
  type TabProps,
  type TabSlots,
} from './Tab.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(locator: { element(): Element }): HTMLElement {
  return requireTabListHTML(locator.element());
}

async function renderTabs(children: React.ReactNode) {
  return render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <FocusgroupConsumer>{children}</FocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
}

test('callback values retain object identity and currentTarget is the native tab, not the list', async () => {
  const first = { id: 'first', revision: 1 };
  const second = { id: 'second', revision: 2 };
  const secondRef = React.createRef<HTMLButtonElement>();
  const observations: {
    value: unknown;
    target: EventTarget;
    nativeTarget: EventTarget | null;
    currentTarget: HTMLElement;
    containedAtCaptureTime: boolean;
    connectedAtCaptureTime: boolean;
    type: string;
  }[] = [];
  const onSelect = (event: SelectTabEvent, data: SelectTabData) => {
    observations.push({
      value: data.value,
      target: event.target,
      nativeTarget: event.nativeEvent.target,
      currentTarget: event.currentTarget,
      containedAtCaptureTime:
        event.target instanceof Node && event.currentTarget.contains(event.target),
      connectedAtCaptureTime: event.currentTarget.isConnected,
      type: event.type,
    });
  };
  const screen = await renderTabs(
    <TabList defaultSelectedValue={first} onTabSelect={onSelect}>
      <Tab value={first}>First object</Tab>
      <Tab value={second} ref={secondRef}>
        Second object
      </Tab>
    </TabList>,
  );
  const secondTab = screen.getByRole('tab', { name: 'Second object' });
  const beforeSelectionRoot = html(secondTab);
  const beforeSelectionContent = beforeSelectionRoot.querySelector('.fui-Tab__content');
  expect(secondRef.current).toBe(beforeSelectionRoot);
  await userEvent.click(secondTab);
  expect(observations.length).toBe(1);
  expect(observations[0].value).toBe(second);
  expect(observations[0].currentTarget).toBe(html(secondTab));
  expect(observations[0].currentTarget).toBe(beforeSelectionRoot);
  expect(observations[0].containedAtCaptureTime).toBe(true);
  expect(observations[0].connectedAtCaptureTime).toBe(true);
  expect(observations[0].nativeTarget).toBe(observations[0].target);
  expect(secondRef.current).toBe(beforeSelectionRoot);
  expect(beforeSelectionRoot.querySelector('.fui-Tab__content')).toBe(beforeSelectionContent);
  const target = observations[0].target;
  if (!(target instanceof Node)) throw new Error('Expected native event target');
  expect(html(secondTab).contains(target)).toBe(true);
  expect(observations[0].type).toBe('click');
  await expect.element(secondTab).toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('tab', { name: 'First object' }))
    .toHaveAttribute('aria-selected', 'false');
});

for (const value of [0, false, '', ['array-default']] as const) {
  test(`current default selection retains ${JSON.stringify(value)} without wrapper normalization`, async () => {
    const wrapped = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
    const raw = vi.fn<NonNullable<primitive.TabListProps['onTabSelect']>>();
    const screen = await renderTabs(
      <>
        <TabList defaultSelectedValue={value} onTabSelect={wrapped}>
          <Tab value={value}>Wrapped default</Tab>
          <Tab value="other">Wrapped other</Tab>
        </TabList>
        <primitive.TabList defaultSelectedValue={value} onTabSelect={raw}>
          <primitive.Tab value={value}>Primitive default</primitive.Tab>
          <primitive.Tab value="other">Primitive other</primitive.Tab>
        </primitive.TabList>
      </>,
    );
    expect(
      html(screen.getByRole('tab', { name: 'Wrapped default' })).getAttribute('aria-selected'),
    ).toBe(
      html(screen.getByRole('tab', { name: 'Primitive default' })).getAttribute('aria-selected'),
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Wrapped default' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Primitive default' }));
    expect(wrapped.mock.calls.length).toBe(raw.mock.calls.length);
    expect(wrapped.mock.calls[0][1].value).toBe(value);
    expect(raw.mock.calls[0][1].value).toBe(value);
  });
}

test('controlled identity is not replaced by serialized equality or a second local selection state', async () => {
  const selected = { id: 'same' };
  const distinct = { id: 'same' };
  const onSelect = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
  const screen = await renderTabs(
    <TabList selectedValue={selected} onTabSelect={onSelect}>
      <Tab value={selected}>Selected identity</Tab>
      <Tab value={distinct}>Distinct identity</Tab>
    </TabList>,
  );
  await expect
    .element(screen.getByRole('tab', { name: 'Selected identity' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('tab', { name: 'Distinct identity' }))
    .toHaveAttribute('aria-selected', 'false');
  await userEvent.click(screen.getByRole('tab', { name: 'Distinct identity' }));
  expect(onSelect.mock.calls[0][1].value).toBe(distinct);
  await expect
    .element(screen.getByRole('tab', { name: 'Selected identity' }))
    .toHaveAttribute('aria-selected', 'true');
});

test('caller preventDefault retains current selection callback ordering while cancelling native form submission', async () => {
  const order: string[] = [];
  const observations: { value: unknown; prevented: boolean; currentTarget: HTMLElement }[] = [];
  const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
  const screen = await renderTabs(
    <form onSubmit={submit}>
      <TabList
        defaultSelectedValue="first"
        onTabSelect={(event, data) => {
          order.push('select');
          observations.push({
            value: data.value,
            prevented: event.defaultPrevented,
            currentTarget: event.currentTarget,
          });
        }}
      >
        <Tab value="first">Initial form view</Tab>
        <Tab
          value="cancelled"
          type="submit"
          onClick={(event) => {
            order.push('click');
            event.preventDefault();
          }}
        >
          Cancel native submit
        </Tab>
      </TabList>
    </form>,
  );
  const cancelled = screen.getByRole('tab', { name: 'Cancel native submit' });
  await userEvent.click(cancelled);
  expect(order).toEqual(['click', 'select']);
  expect(observations.length).toBe(1);
  expect(observations[0].value).toBe('cancelled');
  expect(observations[0].prevented).toBe(true);
  expect(observations[0].currentTarget).toBe(html(cancelled));
  expect(submit).not.toHaveBeenCalled();
  await expect.element(cancelled).toHaveAttribute('aria-selected', 'true');
});

test('automatic activation preserves caller focus ordering, exact values and focus events', async () => {
  const value = { view: 'activity' };
  const order: string[] = [];
  const change = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
  let observedTarget: HTMLElement | null = null;
  let observedType = '';
  const screen = await renderTabs(
    <TabList
      selectTabOnFocus
      onTabSelect={(event, data) => {
        order.push('select');
        observedTarget = event.currentTarget;
        observedType = event.type;
        change(event, data);
      }}
    >
      <Tab
        value={value}
        onFocus={(event) => {
          order.push('focus');
          event.preventDefault();
        }}
      >
        Focus selection
      </Tab>
    </TabList>,
  );
  const tab = screen.getByRole('tab', { name: 'Focus selection' });
  html(tab).focus();
  await expect.element(tab).toHaveAttribute('aria-selected', 'true');
  expect(order).toEqual(['focus', 'select']);
  expect(change.mock.calls[0][1].value).toBe(value);
  expect(observedTarget).toBe(html(tab));
  expect(observedType).toBe('focus');
});

test('caller cancellation of native Enter does not add keyboard-selection fallback behavior', async () => {
  const select = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
  const screen = await renderTabs(
    <TabList defaultSelectedValue="one" onTabSelect={select}>
      <Tab value="one">First keyboard view</Tab>
      <Tab
        value="two"
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault();
        }}
      >
        Prevented Enter
      </Tab>
    </TabList>,
  );
  const prevented = screen.getByRole('tab', { name: 'Prevented Enter' });
  html(prevented).focus();
  await userEvent.keyboard('{Enter}');
  expect(select).not.toHaveBeenCalled();
  await expect.element(prevented).toHaveAttribute('aria-selected', 'false');
  await userEvent.keyboard(' ');
  expect(select).toHaveBeenCalledTimes(1);
  expect(select.mock.calls[0][1].value).toBe('two');
  await expect.element(prevented).toHaveAttribute('aria-selected', 'true');
});

test('native button/default submit/reset semantics and author-owned panel links stay observable', async () => {
  const screen = await renderTabs(<TabListFormFlow />);
  const input = screen.getByRole('textbox', { name: 'Project title' });
  const results = screen.getByLabelText('Tab form results');
  await input.fill('Published draft');
  const inspect = screen.getByRole('tab', { name: 'Inspect only' });
  expect(html(inspect).getAttribute('type')).toBe('button');
  await userEvent.click(inspect);
  await expect.element(results).toHaveAttribute('data-tablist-form-submits', '0');
  await userEvent.click(screen.getByRole('tab', { name: 'Submit current view' }));
  await expect.element(results).toHaveAttribute('data-tablist-form-submits', '1');
  await expect.element(results).toHaveAttribute('data-tablist-form-submitter', 'submit');
  await expect.element(results).toHaveAttribute('data-tablist-form-title', 'Published draft');
  await userEvent.click(screen.getByRole('tab', { name: 'Reset form fields' }));
  await expect.element(input).toHaveValue('Draft');
  await expect.element(results).toHaveAttribute('data-tablist-form-selected', 'reset');
  await expect.element(results).toHaveAttribute('data-tablist-form-selections', '3');
  await userEvent.click(screen.getByRole('tab', { name: 'Disabled submit view' }), { force: true });
  await expect.element(results).toHaveAttribute('data-tablist-form-submits', '1');
  await expect.element(results).toHaveAttribute('data-tablist-form-selections', '3');
  const resource = screen.getByRole('link', { name: 'Author-owned panel resource' });
  expect(html(resource).tagName).toBe('A');
  expect(html(resource).getAttribute('href')).toBe('#tablist-authored-resource');
  await userEvent.click(resource);
  await expect.element(results).toHaveAttribute('data-tablist-form-links', '1');
});

test('refs, classes, data/ARIA props and valid current root/icon/content render functions survive reserved-space rendering', async () => {
  const listRef = React.createRef<HTMLDivElement>();
  const tabRef = React.createRef<HTMLButtonElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const contentRef = React.createRef<HTMLSpanElement>();
  const renderedRootRef = React.createRef<HTMLButtonElement>();
  const renderIcon: SlotRenderFunction<ExtractSlotProps<TabSlots['icon']>> = (Component, props) => (
    <Component {...props} data-tab-icon-rendered="">
      <svg
        aria-hidden="true"
        className="caller-glyph"
        data-custom-tab-glyph=""
        width="17"
        height="19"
        viewBox="0 0 17 19"
      >
        <path d="M1 1h15v17H1z" />
      </svg>
    </Component>
  );
  const renderContent: SlotRenderFunction<ExtractSlotProps<TabSlots['content']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-tab-content-rendered="">
      <strong>{props.children}</strong>
    </Component>
  );
  const renderRoot: SlotRenderFunction<ExtractSlotProps<TabSlots['root']>> = (Component, props) => (
    <Component {...props} as="button" data-tab-root-rendered="">
      Rendered native tab
    </Component>
  );
  const renderList: SlotRenderFunction<ExtractSlotProps<TabListSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-tablist-root-rendered="">
      <Tab as="button" value="rendered" ref={renderedRootRef}>
        {renderRoot}
      </Tab>
    </Component>
  );
  const screen = await renderTabs(
    <>
      <div data-testid="tab-custom-pointer-rest">Pointer rest</div>
      <TabList ref={listRef} className="caller-list" aria-label="Custom tab slots">
        <Tab
          value="custom"
          ref={tabRef}
          id="custom-tab"
          aria-controls="custom-authored-panel"
          className="caller-tab"
          data-caller-tab=""
          icon={{ ref: iconRef, className: 'caller-icon', children: renderIcon }}
          content={{ ref: contentRef, className: 'caller-content', children: renderContent }}
        >
          Custom content
        </Tab>
      </TabList>
      <TabList aria-label="Rendered tab list">{renderList}</TabList>
      <section id="custom-authored-panel" role="tabpanel" aria-labelledby="custom-tab">
        Author-owned content
      </section>
    </>,
  );
  await userEvent.hover(screen.getByTestId('tab-custom-pointer-rest'));
  expect(listRef.current).toBe(html(screen.getByRole('tablist', { name: 'Custom tab slots' })));
  expect(tabRef.current).toBe(html(screen.getByRole('tab', { name: 'Custom content' })));
  expect(tabRef.current?.tagName).toBe('BUTTON');
  expect(tabRef.current?.getAttribute('aria-controls')).toBe('custom-authored-panel');
  expect(tabRef.current?.hasAttribute('data-caller-tab')).toBe(true);
  for (const [element, callerClass, marker] of [
    [listRef.current, 'caller-list', 'fui-TabList'],
    [tabRef.current, 'caller-tab', tabClassNames.root],
    [iconRef.current, 'caller-icon', tabClassNames.icon],
    [contentRef.current, 'caller-content', tabClassNames.content],
  ] as const) {
    expect(element).not.toBe(null);
    expect(element?.classList.contains(callerClass)).toBe(true);
    expect(element?.classList.contains(marker)).toBe(true);
  }
  expect(iconRef.current?.hasAttribute('data-tab-icon-rendered')).toBe(true);
  expect(contentRef.current?.hasAttribute('data-tab-content-rendered')).toBe(true);
  expect(contentRef.current?.textContent).toBe('Custom content');
  const content = contentRef.current;
  if (!(content instanceof HTMLElement)) throw new Error('Missing native content slot');
  expect(getComputedStyle(content).visibility).toBe('visible');
  const reserved = tabRef.current?.querySelector(`.${tabReservedSpaceClassNames.content}`);
  if (!(reserved instanceof HTMLElement)) throw new Error('Missing reserved text');
  expect(getComputedStyle(reserved).visibility).toBe('hidden');
  expect(reserved.textContent).toBe('Custom content');
  expect(reserved.getAttribute('aria-hidden')).toBe('true');
  expect(reserved.hasAttribute('data-tab-content-rendered')).toBe(true);
  const glyph = iconRef.current?.querySelector('[data-custom-tab-glyph]');
  if (!(glyph instanceof SVGElement)) throw new Error('Missing caller SVG glyph');
  expect(glyph.classList.contains('caller-glyph')).toBe(true);
  expect(glyph.classList.contains('fui-Icon-regular')).toBe(false);
  expect(glyph.classList.contains('fui-Icon-filled')).toBe(false);
  expect(glyph.getBoundingClientRect().width).toBe(17);
  expect(glyph.getBoundingClientRect().height).toBe(19);
  expect(renderedRootRef.current).toBe(
    html(screen.getByRole('tab', { name: 'Rendered native tab' })),
  );
  expect(renderedRootRef.current?.hasAttribute('data-tab-root-rendered')).toBe(true);
  expect(
    html(screen.getByRole('tablist', { name: 'Rendered tab list' })).hasAttribute(
      'data-tablist-root-rendered',
    ),
  ).toBe(true);
});

test('ordinary content-slot children preserve native span metadata and explicit visual space, while omitted content respects the opt-out', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await renderTabs(
    <TabList reserveSelectedTabSpace={false}>
      <Tab value="content" content={{ ref, children: <em>Slot-owned text</em> }}>
        Ignored default text
      </Tab>
      <Tab value="omitted">Ordinary tab children</Tab>
    </TabList>,
  );
  const tab = html(screen.getByRole('tab', { name: 'Slot-owned text' }));
  expect(ref.current?.tagName).toBe('SPAN');
  expect(ref.current?.parentElement).toBe(tab);
  expect(ref.current?.querySelector('em')?.textContent).toBe('Slot-owned text');
  const reserved = tab.querySelector(`.${tabReservedSpaceClassNames.content}`);
  if (!(reserved instanceof HTMLElement)) throw new Error('Missing explicit visual space');
  expect(getComputedStyle(reserved).visibility).toBe('hidden');
  expect(getComputedStyle(reserved).fontWeight).toBe('600');
  expect(reserved.textContent).toBe('Slot-owned text');
  expect(
    html(screen.getByRole('tab', { name: 'Ordinary tab children' })).querySelectorAll(
      `.${tabReservedSpaceClassNames.content}`,
    ).length,
  ).toBe(0);
});

test('a caller root renderer preserves resolved children, props, refs and native identity across selection', async () => {
  const ref = React.createRef<HTMLButtonElement>();
  const change = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<TabSlots['root']>> = (Component, props) => (
    <Component {...props} as="button" data-caller-root-rendered="">
      {props.children}
      <span aria-hidden="true" data-caller-root-tail="">
        Tail
      </span>
    </Component>
  );
  const screen = await renderTabs(
    <TabList defaultSelectedValue="other" onTabSelect={change}>
      <Tab
        value="rendered"
        ref={ref}
        className="caller-rendered-tab"
        title="Caller root title"
        data-caller-root=""
        content={{ children: 'Preserved slot content' }}
      >
        {renderRoot}
      </Tab>
      <Tab value="other">Other view</Tab>
    </TabList>,
  );
  const tab = screen.getByRole('tab', { name: 'Preserved slot content' });
  const before = html(tab);
  const content = before.querySelector('.fui-Tab__content');
  expect(ref.current).toBe(before);
  expect(before.getAttribute('title')).toBe('Caller root title');
  expect(before.hasAttribute('data-caller-root')).toBe(true);
  expect(before.hasAttribute('data-caller-root-rendered')).toBe(true);
  expect(before.classList.contains('caller-rendered-tab')).toBe(true);
  expect(content?.textContent).toBe('Preserved slot content');
  expect(before.querySelector('[data-caller-root-tail]')?.textContent).toBe('Tail');
  expect(before.querySelectorAll(`.${tabReservedSpaceClassNames.content}`).length).toBe(1);
  await userEvent.click(tab);
  expect(change).toHaveBeenCalledTimes(1);
  expect(change.mock.calls[0][1].value).toBe('rendered');
  expect(ref.current).toBe(before);
  expect(html(tab)).toBe(before);
  expect(before.querySelector('.fui-Tab__content')).toBe(content);
  await expect.element(tab).toHaveAttribute('aria-selected', 'true');
});

test('omitted and explicitly undefined visual defaults keep the same resolved parent and native data attributes', async () => {
  const refs = [React.createRef<HTMLButtonElement>(), React.createRef<HTMLButtonElement>()];
  await renderTabs(
    <>
      <TabList>
        <Tab value="one" ref={refs[0]}>
          Omitted
        </Tab>
      </TabList>
      <TabList appearance={undefined} size={undefined} reserveSelectedTabSpace={undefined}>
        <Tab value="two" ref={refs[1]}>
          Undefined
        </Tab>
      </TabList>
    </>,
  );
  for (const ref of refs) {
    expect(ref.current?.dataset.size).toBe('medium');
    expect(ref.current?.dataset.appearance).toBe('transparent');
    expect(ref.current?.dataset.orientation).toBe('horizontal');
    expect(ref.current?.hasAttribute('data-selected')).toBe(false);
    expect(ref.current?.hasAttribute('data-disabled')).toBe(false);
    expect(ref.current?.hasAttribute('data-icon-only')).toBe(false);
    expect(ref.current?.querySelectorAll(`.${tabReservedSpaceClassNames.content}`).length).toBe(1);
  }
});

test('current button-only type and ref contracts are not widened to unsupported native anchors', () => {
  expectTypeOf(Tab).toExtend<ForwardRefComponent<TabProps>>();
  expectTypeOf<TabProps['as']>().toEqualTypeOf<'button' | undefined>();
  expectTypeOf<Extract<TabProps['as'], 'a'>>().toBeNever();
  expectTypeOf<TabProps>().toEqualTypeOf<primitive.TabProps>();
});
