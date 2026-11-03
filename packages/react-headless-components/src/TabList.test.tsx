// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/tab-list';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  TabListComparison,
  tabListConsumerExample,
  tabListExamples,
  type TabListExample,
} from '../../../apps/storybook/src/stories/experiments/TabListComparison.js';
import { TabListComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/TabListComparisonReport.js';
import {
  TabListContentFlow,
  TabListContextProbe,
  TabListDynamicFlow,
} from '../../../apps/storybook/src/stories/experiments/TabListFlows.js';
import {
  captureTabListNativeContract,
  captureTabListStyles,
  compareTabListStyles,
  getComparisonTabList,
  getFixtureTab,
  requireTabListHTML,
  settleTabListStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTabListStyles.js';
import {
  TabList,
  tabListClassNames,
  useTabListContext,
  useTabListContextValues,
  type TabListProps,
} from './TabList.js';
import { Tab } from './Tab.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(locator: { element(): Element }): HTMLElement {
  return requireTabListHTML(locator.element());
}

function exampleNamed(name: string): TabListExample {
  const example = tabListExamples.find((candidate) => candidate.name === name);
  if (!example) throw new Error(`Missing TabList fixture ${name}`);
  return example;
}

async function renderPair(
  example: TabListExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <FocusgroupConsumer>
        <TabListComparison example={example} />
      </FocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonTabList(screen.container, 'legacy');
  const headless = getComparisonTabList(screen.container, 'headless');
  await settleTabListStyles(legacy, headless);
  return {
    screen,
    legacy,
    headless,
    differences: () =>
      compareTabListStyles(
        captureTabListStyles(legacy),
        captureTabListStyles(headless),
        example.consumer,
      ),
  };
}

async function renderFlow(children: React.ReactNode, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <CoreAIFluentProvider theme={coreaiLightTheme} dir={dir}>
      {children}
    </CoreAIFluentProvider>,
  );
}

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of tabListExamples) {
    test(`${themeName}: ${example.name} preserves list/tab/content/icon/indicator/reserved-text styles and geometry`, async () => {
      const pair = await renderPair(example, theme);
      expect(pair.differences()).toEqual([]);
    });
  }
}

for (const name of [
  'Default',
  'Icon and text',
  'Vertical large',
  'Subtle circular',
  'Vertical elevated',
]) {
  test(`RTL: ${name} retains logical spacing, indicator edges and exact geometry`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, true, 'rtl');
    expect(pair.differences()).toEqual([]);
  });
}

for (const name of ['Default', 'Elevated', 'Selected disabled elevated']) {
  test(`${name}: disabling CoreAI defaults does not remove opted-in visual behavior`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, false);
    expect(pair.differences()).toEqual([]);
    expect(pair.headless.classList.contains(tabListClassNames.root)).toBe(true);
    expect(pair.headless.dataset.appearance).toBe(exampleNamed(name).appearance ?? 'transparent');
  });
}

for (const name of [
  'Default',
  'Subtle',
  'Subtle circular',
  'Filled circular',
  'Elevated',
  'Selected disabled',
  'Selected disabled elevated',
]) {
  test(`${name}: enabled/disabled hover preserves selected and pending-indicator priority`, async () => {
    const pair = await renderPair({ ...exampleNamed(name), icons: true });
    for (const value of ['account', 'activity', 'unavailable']) {
      const capture = async (list: HTMLElement) => {
        const tab = getFixtureTab(list, value);
        await userEvent.hover(tab);
        expect(tab.matches(':hover')).toBe(true);
        await settleTabListStyles(list);
        return captureTabListStyles(list);
      };
      expect(
        compareTabListStyles(await capture(pair.legacy), await capture(pair.headless)),
      ).toEqual([]);
    }
  });
}

for (const name of ['Default', 'Subtle circular', 'Filled circular', 'Elevated']) {
  test(`${name}: native keyboard focus and combined hover/focus retain indicator and border priority`, async () => {
    const pair = await renderPair({ ...exampleNamed(name), icons: true });
    await userEvent.keyboard('{Tab}');
    for (const hovered of [false, true]) {
      const capture = async (list: HTMLElement) => {
        await userEvent.hover(pair.screen.getByText('Current CoreAI / Griffel', { exact: true }));
        const tab = getFixtureTab(list, 'account');
        tab.focus();
        if (hovered) await userEvent.hover(tab);
        expect(tab.matches(':hover')).toBe(hovered);
        expect(tab.matches(':focus-visible')).toBe(true);
        await settleTabListStyles(list);
        return captureTabListStyles(list);
      };
      expect(
        compareTabListStyles(await capture(pair.legacy), await capture(pair.headless)),
      ).toEqual([]);
    }
  });
}

for (const name of ['Default', 'Elevated']) {
  test(`${name}: keyboard press keeps active selected foreground/background and indicator styles`, async () => {
    const pair = await renderPair({ ...exampleNamed(name), icons: true });
    await userEvent.keyboard('{Tab}');
    const capture = async (list: HTMLElement) => {
      const tab = getFixtureTab(list, 'account');
      tab.focus();
      expect(tab.matches(':hover')).toBe(false);
      await userEvent.keyboard('[Space>]');
      expect(tab.matches(':active')).toBe(true);
      await settleTabListStyles(list);
      const result = captureTabListStyles(list);
      await userEvent.keyboard('[/Space]');
      return result;
    };
    expect(compareTabListStyles(await capture(pair.legacy), await capture(pair.headless))).toEqual(
      [],
    );
  });
}

test('ordinary consumer classes override layered container/tab/content/icon visuals', async () => {
  const pair = await renderPair(tabListConsumerExample);
  expect(pair.differences().filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  const tab = getFixtureTab(pair.headless, 'account');
  const icon = tab.querySelector('.fui-Tab__icon');
  const content = tab.querySelector('.fui-Tab__content');
  if (!icon || !content) throw new Error('Missing consumer slots');
  expect(getComputedStyle(pair.headless).columnGap).toBe('3px');
  expect(getComputedStyle(pair.headless).paddingTop).toBe('7px');
  expect(getComputedStyle(tab).minWidth).toBe('120px');
  expect(getComputedStyle(tab).borderRadius).toBe('3px');
  expect(getComputedStyle(icon).fontSize).toBe('16px');
  expect(getComputedStyle(content).fontSize).toBe('18px');
});

test('visual choices use the existing typed public context, with elevated delegated to filled-circular', async () => {
  const screen = await renderFlow(
    <TabList
      appearance="elevated"
      size="large"
      reserveSelectedTabSpace={false}
      defaultSelectedValue="activity"
    >
      <Tab value="activity">Context activity</Tab>
      <TabListContextProbe />
    </TabList>,
  );
  const probe = screen.getByLabelText('Public TabList context');
  await expect.element(probe).toHaveAttribute('data-context-selected', '"activity"');
  await expect.element(probe).toHaveAttribute('data-context-appearance', 'filled-circular');
  await expect.element(probe).toHaveAttribute('data-context-size', 'large');
  await expect.element(probe).toHaveAttribute('data-context-reserved', 'false');
  const tab = html(screen.getByRole('tab', { name: 'Context activity' }));
  expect(tab.dataset.size).toBe('large');
  expect(tab.dataset.appearance).toBe('filled-circular');
  expect(tab.hasAttribute('data-coreai-elevated')).toBe(true);
  expect(screen.container.querySelector('[appearance], [size], [reserveSelectedTabSpace]')).toBe(
    null,
  );
});

for (const controlled of [true, false]) {
  test(`${controlled ? 'controlled' : 'default'} selection switches author-owned associated content with exact click events`, async () => {
    const screen = await renderFlow(<TabListContentFlow controlled={controlled} />);
    const overview = screen.getByRole('tab', { name: 'Overview' });
    const activity = screen.getByRole('tab', { name: 'Activity' });
    const unavailable = screen.getByRole('tab', { name: 'Unavailable' });
    const events = screen.getByLabelText('Tab selection events');
    await expect.element(overview).toHaveAttribute('aria-selected', 'true');
    await expect.element(unavailable).toBeDisabled();
    await expect.element(unavailable).not.toHaveAttribute('aria-selected');
    await userEvent.click(activity);
    await expect.element(activity).toHaveAttribute('aria-selected', 'true');
    await expect.element(overview).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Activity' });
    await expect.element(panel).toBeVisible();
    expect(html(panel).getAttribute('aria-labelledby')).toBe(html(activity).id);
    expect(html(activity).getAttribute('aria-controls')).toBe(html(panel).id);
    expect(screen.getByRole('tabpanel').all().length).toBe(1);
    await expect.element(events).toHaveAttribute('data-tablist-selection-count', '1');
    await expect.element(events).toHaveAttribute('data-tablist-selection-value', 'activity');
    await expect.element(events).toHaveAttribute('data-tablist-event-type', 'click');
    await expect
      .element(events)
      .toHaveAttribute('data-tablist-event-current-target', html(activity).id);
    await userEvent.click(unavailable, { force: true });
    await expect.element(events).toHaveAttribute('data-tablist-selection-count', '1');
    if (controlled) {
      await userEvent.click(overview);
      await expect.element(events).toHaveAttribute('data-tablist-selection-count', '2');
      await userEvent.click(screen.getByRole('button', { name: 'Select activity externally' }));
      await expect.element(activity).toHaveAttribute('aria-selected', 'true');
      await expect.element(events).toHaveAttribute('data-tablist-selection-count', '2');
    }
  });
}

for (const [name, dir, vertical, forward, backward] of [
  ['horizontal LTR', 'ltr', false, '{ArrowRight}', '{ArrowLeft}'],
  ['horizontal RTL', 'rtl', false, '{ArrowLeft}', '{ArrowRight}'],
  ['vertical LTR', 'ltr', true, '{ArrowDown}', '{ArrowUp}'],
  ['vertical RTL', 'rtl', true, '{ArrowDown}', '{ArrowUp}'],
] as const) {
  for (const automatic of [false, true]) {
    test(`${name}, ${automatic ? 'automatic' : 'manual'} activation: cold native/polyfill navigation skips disabled tabs, wraps, supports Home/End and Tab re-entry`, async () => {
      const screen = await renderFlow(
        <TabListContentFlow vertical={vertical} selectTabOnFocus={automatic} />,
        dir,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Before tabs' }));
      await userEvent.hover(screen.getByTestId('tablist-flow-pointer-rest'));
      await userEvent.tab();
      const overview = screen.getByRole('tab', { name: 'Overview' });
      const activity = screen.getByRole('tab', { name: 'Activity' });
      await expect.element(overview).toHaveFocus();
      await userEvent.keyboard(forward);
      await expect.element(activity).toHaveFocus();
      await expect.element(activity).toHaveAttribute('aria-selected', automatic ? 'true' : 'false');
      await expect.element(overview).toHaveAttribute('aria-selected', automatic ? 'false' : 'true');
      await userEvent.keyboard(forward);
      await expect.element(overview).toHaveFocus();
      await userEvent.keyboard(backward);
      await expect.element(activity).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect.element(overview).toHaveFocus();
      await userEvent.keyboard('{End}');
      await expect.element(activity).toHaveFocus();
      const selectedName = automatic ? 'Activity' : 'Overview';
      await expect.element(screen.getByRole('tabpanel', { name: selectedName })).toBeVisible();
      await userEvent.tab();
      await expect.element(screen.getByRole('tabpanel', { name: selectedName })).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect.element(automatic ? activity : overview).toHaveFocus();
      if (!automatic) {
        await expect
          .element(screen.getByLabelText('Tab selection events'))
          .toHaveAttribute('data-tablist-selection-count', '0');
        html(activity).focus();
        await userEvent.keyboard(' ');
        await expect.element(activity).toHaveAttribute('aria-selected', 'true');
        await expect
          .element(screen.getByLabelText('Tab selection events'))
          .toHaveAttribute('data-tablist-selection-count', '1');
      } else {
        await expect
          .element(screen.getByLabelText('Tab selection events'))
          .toHaveAttribute('data-tablist-event-type', 'focus');
      }
      const list = html(screen.getByRole('tablist', { name: 'Project views' }));
      expect(list.getAttribute('focusgroup')).toBe(
        `tablist ${vertical ? 'block' : 'inline'} wrap nomemory`,
      );
      const native = captureTabListNativeContract(list);
      expect(native['focusgroup-mode']).toBe(
        'focusGroup' in HTMLElement.prototype ? 'native' : 'consumer-polyfill',
      );
    });
  }
}

test('a disabled parent disables every native tab and removes the entire group from sequential focus', async () => {
  const change = vi.fn<NonNullable<TabListProps['onTabSelect']>>();
  const screen = await renderFlow(
    <FocusgroupConsumer>
      <button type="button">Before disabled tabs</button>
      <TabList disabled defaultSelectedValue="one" onTabSelect={change}>
        <Tab value="one">Disabled first</Tab>
        <Tab value="two">Disabled second</Tab>
      </TabList>
      <button type="button">After disabled tabs</button>
    </FocusgroupConsumer>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Before disabled tabs' }));
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After disabled tabs' })).toHaveFocus();
  for (const name of ['Disabled first', 'Disabled second']) {
    const tab = screen.getByRole('tab', { name });
    await expect.element(tab).toBeDisabled();
    await expect.element(tab).not.toHaveAttribute('aria-selected');
    expect(html(tab).hasAttribute('data-disabled')).toBe(true);
    await userEvent.click(tab, { force: true });
  }
  expect(change).not.toHaveBeenCalled();
});

test('controlled selection can reject a request without a wrapper-owned selection model', async () => {
  const screen = await renderFlow(<TabListContentFlow rejectSelection />);
  await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
  await expect
    .element(screen.getByRole('tab', { name: 'Overview' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('tab', { name: 'Activity' }))
    .toHaveAttribute('aria-selected', 'false');
  await expect
    .element(screen.getByLabelText('Tab selection events'))
    .toHaveAttribute('data-tablist-selection-count', '1');
  await expect
    .element(screen.getByLabelText('Tab selection events'))
    .toHaveAttribute('data-tablist-selection-value', 'activity');
  await expect.element(screen.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
});

test('new tabs, disabled mutations, author-owned removal, and reopened groups retain real directional navigation', async () => {
  const screen = await renderFlow(<TabListDynamicFlow />);
  await userEvent.click(screen.getByRole('button', { name: 'Open tabs' }));
  await userEvent.hover(screen.getByTestId('tablist-dynamic-pointer-rest'));
  html(screen.getByRole('tab', { name: 'Summary' })).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Add review tab' }));
  html(screen.getByRole('tab', { name: 'Summary' })).focus();
  await userEvent.keyboard('{End}');
  await expect.element(screen.getByRole('tab', { name: 'Review' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('tabpanel', { name: 'Review' }))
    .toHaveTextContent('Dynamic review content');
  await userEvent.click(screen.getByRole('button', { name: 'Disable details' }));
  html(screen.getByRole('tab', { name: 'Summary' })).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('tab', { name: 'Review' })).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Remove review tab' }));
  await expect.element(screen.getByRole('tab', { name: 'Summary' })).toHaveFocus();
  await expect.element(screen.getByRole('tabpanel', { name: 'Summary' })).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Review' }).all().length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Close tabs' }));
  expect(screen.getByRole('tablist').all().length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Open tabs' }));
  html(screen.getByRole('tab', { name: 'Summary' })).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
  await userEvent.keyboard('{Home}');
  await expect.element(screen.getByRole('tab', { name: 'Summary' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('tabpanel', { name: 'Summary' })).toHaveFocus();
  const state = screen.getByLabelText('Dynamic tab state');
  await expect.element(state).toHaveAttribute('data-tablist-dynamic-generation', '2');
  await expect.element(state).toHaveAttribute('data-tablist-dynamic-count', '2');
  expect(html(screen.getByRole('tablist')).getBoundingClientRect().width).toBeGreaterThan(0);
});

test('the actual report reaches ready with matching final dimensions, selected content and three tabs', async () => {
  const screen = await renderFlow(<TabListComparisonWithReport />);
  await userEvent.hover(screen.getByTestId('tablist-report-pointer-rest'));
  const report = screen.getByRole('status', { name: 'TabList style report' });
  await expect.element(report).toHaveAttribute('data-tablist-report-state', 'ready');
  await settleTabListStyles();
  screen
    .getByLabelText('TabList visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleTabListStyles();
  await expect.element(report).toHaveAttribute('data-tablist-report-state', 'ready');
  await expect.element(report).toHaveAttribute('data-tablist-unexpected-count', '0');
  await expect.element(report).toHaveAttribute('data-tablist-tab-count', '3');
  const list = getComparisonTabList(screen.container, 'headless');
  const rect = list.getBoundingClientRect();
  expect(rect.width).toBe(Number(html(report).dataset.tablistWidth));
  expect(rect.height).toBe(Number(html(report).dataset.tablistHeight));
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  expect(list.querySelectorAll('[data-tablist-fixture-tab]').length).toBe(3);
  expect(getFixtureTab(list, 'account').getAttribute('aria-selected')).toBe('true');
});

test('the bounded report keeps dimensions, offsets and CSS values exact instead of hiding small regressions', () => {
  expect(
    compareTabListStyles(
      { 'tab.0.rect.width': '100', 'tab.0.offset.left': '2', 'tab.0.padding-left': '10px' },
      {
        'tab.0.rect.width': '100.01',
        'tab.0.offset.left': '2.01',
        'tab.0.padding-left': '10.01px',
      },
    ).map((difference) => difference.property),
  ).toEqual(['tab.0.rect.width', 'tab.0.offset.left', 'tab.0.padding-left']);
});

test('the supported component and context helpers keep the exact current public facade contracts', () => {
  expectTypeOf(TabList).toExtend<ForwardRefComponent<TabListProps>>();
  expectTypeOf<TabListProps['as']>().toEqualTypeOf<'div' | undefined>();
  expect(useTabListContext).toBe(primitive.useTabListContext);
  expect(useTabListContextValues).toBe(primitive.useTabListContextValues);
});
