// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Tab, TabList } from '@coreai-ds/react-headless-components';
import { tabListConsumerExample, tabListExamples } from './TabListComparison.js';
import { TabListComparisonWithReport } from './TabListComparisonReport.js';
import { TabListContentFlow, TabListDynamicFlow, TabListFormFlow } from './TabListFlows.js';
import {
  assertTabListFocus,
  assertTabListReport,
  focusTabListStoryItem,
  leaveTabListStory,
} from './TabListStoryPlay.js';

const meta = {
  title: 'Experiments/Headless TabList',
  component: TabList,
  subcomponents: { Tab },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'TabList and Tab use the public headless-preview 0.3.2 /tab-list hook/render/context facade and react-tabs 9.12.6 raw CSS sources. Size, appearance, and reserved selected-text space use the existing typed public context; only CoreAI elevated styling needs a visual-only boolean. The actual CoreAI wrapper maps elevated to filled-circular, not subtle, and adds no shadow/default factory. Elevated remains available with defaults disabled. Public root/icon/content slot render functions and native button metadata are retained. Reserved text uses the public root render contract, not an internal slot or deprecated registry. Selection, exact callback values/events, disabled state, refs, ARIA and automatic/manual activation remain in current hooks. Native focusgroup owns Arrow/Home/End/Tab/RTL/vertical navigation. The shared test/Storybook-only FocusgroupConsumer initializes the documented focusgroup-polyfill 1.6.0 API before children and on new groups; no library polyfill or custom navigation handler is imported. Visibility-only polyfill limitations stay consumer-owned. Dynamic examples unmount/remount groups. Storybook synthetic keys prepare focus explicitly on native engines; trusted Browser Mode/acceptance checks exercise actual navigation with native support enabled and disabled. Panels are author-owned native role=tabpanel markup; no absent TabPanel or TabListProvider is fabricated. Tab is a native button by the current public type, with button type/form semantics and caller preventDefault ordering unchanged; native links in panels belong to the author. Selection does not reset with a native form. Bounded shared reports compare selected content/icon/indicator/reserved-text CSS, dimensions and offsets exactly. The old JavaScript sliding indicator is intentionally omitted: only its stable local CSS is ported. Legacy arbitrary custom-style hooks are not invoked; ordinary consumer CSS wins.',
      },
    },
  },
} satisfies Meta<typeof TabList>;

export default meta;
type Story = StoryObj<typeof meta>;
type PlayContext = Parameters<NonNullable<Story['play']>>[0];

export const Comparison: Story = {
  render: () => <TabListComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tablist-report-pointer-rest'));
    await assertTabListReport(canvasElement, tabListExamples[0].name);
    for (const example of tabListExamples.slice(1)) {
      await userEvent.selectOptions(canvas.getByLabelText('TabList visual fixture'), example.name);
      await assertTabListReport(canvasElement, example.name);
    }
  },
};

export const RTLComparison: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TabListComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <TabListComparisonWithReport examples={[tabListConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tablist-report-pointer-rest'));
    await assertTabListReport(canvasElement, tabListConsumerExample.name);
    const root = canvasElement.querySelector('[data-tablist-implementation="headless"]');
    const tab = root?.querySelector('[data-tablist-fixture-tab="account"]');
    const icon = tab?.querySelector('.fui-Tab__icon');
    const content = tab?.querySelector('.fui-Tab__content');
    if (!(root instanceof HTMLElement) || !(tab instanceof HTMLElement) || !icon || !content) {
      throw new Error('Missing consumer TabList slots');
    }
    await expect(getComputedStyle(root).paddingTop).toBe('7px');
    await expect(getComputedStyle(root).columnGap).toBe('3px');
    await expect(getComputedStyle(tab).minWidth).toBe('120px');
    await expect(getComputedStyle(tab).borderRadius).toBe('3px');
    await expect(getComputedStyle(icon).fontSize).toBe('16px');
    await expect(getComputedStyle(content).fontSize).toBe('18px');
  },
};

async function playContent(
  { canvas }: PlayContext,
  { automatic = false, controlled = true, arrow = '{ArrowRight}' } = {},
) {
  await userEvent.hover(canvas.getByTestId('tablist-flow-pointer-rest'));
  const overview = canvas.getByRole('tab', { name: 'Overview' });
  const activity = canvas.getByRole('tab', { name: 'Activity' });
  const unavailable = canvas.getByRole('tab', { name: 'Unavailable' });
  const events = canvas.getByLabelText('Tab selection events');
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(unavailable).toBeDisabled();
  await expect(unavailable).not.toHaveAttribute('aria-selected');
  overview.focus();
  await assertTabListFocus(overview);
  await focusTabListStoryItem(activity, arrow);
  if (!automatic) {
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(activity).toHaveAttribute('aria-selected', 'false');
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
    await expect(events).toHaveAttribute('data-tablist-selection-count', '0');
    await userEvent.keyboard('{Enter}');
  }
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  const panel = canvas.getByRole('tabpanel', { name: 'Activity' });
  await expect(panel).toBeVisible();
  await expect(canvas.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
  await expect(panel).toHaveAttribute('aria-labelledby', activity.id);
  await expect(activity).toHaveAttribute('aria-controls', panel.id);
  await expect(events).toHaveAttribute('data-tablist-selection-value', 'activity');
  await expect(events).toHaveAttribute('data-tablist-event-current-target', activity.id);
  await expect(events).toHaveAttribute('data-tablist-selection-count', automatic ? '2' : '1');
  await leaveTabListStory(panel);
  await userEvent.click(unavailable);
  await expect(events).toHaveAttribute('data-tablist-selection-count', automatic ? '2' : '1');
  if (!automatic) {
    await userEvent.click(overview);
    await expect(events).toHaveAttribute('data-tablist-selection-count', '2');
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
    if (controlled) {
      await userEvent.click(canvas.getByRole('button', { name: 'Select activity externally' }));
      await expect(events).toHaveAttribute('data-tablist-selection-count', '2');
      await expect(activity).toHaveAttribute('aria-selected', 'true');
      await expect(canvas.getByRole('tabpanel', { name: 'Activity' })).toBeVisible();
    }
  }
  await expect(canvas.getByLabelText('Public TabList context')).toHaveAttribute(
    'data-context-automatic',
    String(automatic),
  );
}

export const ContentSwitching: Story = {
  render: () => <TabListContentFlow />,
  play: (context) => playContent(context),
};

export const UncontrolledSelection: Story = {
  render: () => <TabListContentFlow controlled={false} />,
  play: (context) => playContent(context, { controlled: false }),
};

export const AutomaticActivation: Story = {
  render: () => <TabListContentFlow selectTabOnFocus />,
  play: (context) => playContent(context, { automatic: true }),
};

export const VerticalKeyboard: Story = {
  render: () => <TabListContentFlow vertical />,
  play: (context) => playContent(context, { arrow: '{ArrowDown}' }),
};

export const RTLKeyboard: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TabListContentFlow />
    </CoreAIFluentProvider>
  ),
  play: (context) => playContent(context, { arrow: '{ArrowLeft}' }),
};

export const ControlledRejection: Story = {
  render: () => <TabListContentFlow rejectSelection />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Activity' }));
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await expect(canvas.getByLabelText('Tab selection events')).toHaveAttribute(
      'data-tablist-selection-value',
      'activity',
    );
    await expect(canvas.getByLabelText('Tab selection events')).toHaveAttribute(
      'data-tablist-selection-count',
      '1',
    );
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
  },
};

export const DynamicTabs: Story = {
  render: () => <TabListDynamicFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open tabs' }));
    await userEvent.hover(canvas.getByTestId('tablist-dynamic-pointer-rest'));
    const summary = canvas.getByRole('tab', { name: 'Summary' });
    summary.focus();
    await assertTabListFocus(summary);
    await focusTabListStoryItem(canvas.getByRole('tab', { name: 'Details' }), '{ArrowRight}');
    await userEvent.click(canvas.getByRole('button', { name: 'Add review tab' }));
    summary.focus();
    await focusTabListStoryItem(canvas.getByRole('tab', { name: 'Review' }), '{End}');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('tabpanel', { name: 'Review' })).toHaveTextContent(
      'Dynamic review content',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Disable details' }));
    await expect(canvas.getByRole('tab', { name: 'Details' })).toBeDisabled();
    summary.focus();
    await focusTabListStoryItem(canvas.getByRole('tab', { name: 'Review' }), '{ArrowRight}');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove review tab' }));
    await assertTabListFocus(summary);
    await expect(canvas.queryByRole('tab', { name: 'Review' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('tabpanel', { name: 'Summary' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Close tabs' }));
    await expect(canvas.queryByRole('tablist')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Open tabs' }));
    const reopened = canvas.getByRole('tab', { name: 'Summary' });
    reopened.focus();
    await focusTabListStoryItem(canvas.getByRole('tab', { name: 'Details' }), '{ArrowRight}');
    await focusTabListStoryItem(reopened, '{Home}');
    await expect(canvas.getByLabelText('Dynamic tab state')).toHaveAttribute(
      'data-tablist-dynamic-generation',
      '2',
    );
    await expect(canvas.getByLabelText('Dynamic tab state')).toHaveAttribute(
      'data-tablist-dynamic-count',
      '2',
    );
  },
};

export const NativeForms: Story = {
  render: () => <TabListFormFlow />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Project title' });
    const results = canvas.getByLabelText('Tab form results');
    await userEvent.clear(input);
    await userEvent.type(input, 'Published draft');
    await userEvent.click(canvas.getByRole('tab', { name: 'Inspect only' }));
    await expect(results).toHaveAttribute('data-tablist-form-submits', '0');
    await userEvent.click(canvas.getByRole('tab', { name: 'Submit current view' }));
    await expect(results).toHaveAttribute('data-tablist-form-submits', '1');
    await expect(results).toHaveAttribute('data-tablist-form-submitter', 'submit');
    await expect(results).toHaveAttribute('data-tablist-form-title', 'Published draft');
    await userEvent.click(canvas.getByRole('tab', { name: 'Reset form fields' }));
    await expect(input).toHaveValue('Draft');
    await expect(results).toHaveAttribute('data-tablist-form-selected', 'reset');
    await expect(results).toHaveAttribute('data-tablist-form-selections', '3');
    await userEvent.click(canvas.getByRole('tab', { name: 'Disabled submit view' }));
    await expect(results).toHaveAttribute('data-tablist-form-submits', '1');
    await expect(results).toHaveAttribute('data-tablist-form-selections', '3');
    await userEvent.click(canvas.getByRole('link', { name: 'Author-owned panel resource' }));
    await expect(results).toHaveAttribute('data-tablist-form-links', '1');
  },
};
