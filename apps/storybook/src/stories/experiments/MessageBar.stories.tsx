// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
} from '@coreai-ds/react-headless-components';
import {
  MessageBarComparison,
  MessageBarNotificationsFlow,
  MessageBarReflowFormFlow,
  messageBarConsumerExample,
  messageBarExamples,
  messageBarIntents,
  messageBarLayouts,
  messageBarShapes,
  type MessageBarExample,
} from './MessageBarComparison.js';
import {
  captureMessageBarStyles,
  compareMessageBarStyles,
  getComparisonMessageBar,
  settleMessageBarStyles,
  type MessageBarStyleDifference,
} from './compareMessageBarStyles.js';
import styles from './MessageBarComparison.module.css';

function ComparisonWithReport({
  examples = messageBarExamples,
}: {
  examples?: readonly MessageBarExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<{
    fixtures: number;
    differences: (MessageBarStyleDifference & { example: string })[];
  } | null>(null);
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('MessageBar fixtures have not mounted');
    setComparing(true);
    setReport(null);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-messagebar-case]')];
      if (rows.length !== examples.length) throw new Error('MessageBar fixture count changed');
      const differences = [];
      for (const row of rows) {
        const legacy = getComparisonMessageBar(row, 'legacy');
        const headless = getComparisonMessageBar(row, 'headless');
        await Promise.all([settleMessageBarStyles(legacy), settleMessageBarStyles(headless)]);
        differences.push(
          ...compareMessageBarStyles(
            captureMessageBarStyles(legacy),
            captureMessageBarStyles(headless),
          ).map((difference) => ({ example: row.dataset.messagebarCase ?? '', ...difference })),
        );
      }
      setReport({ fixtures: rows.length, differences });
    } finally {
      setComparing(false);
    }
  };
  return (
    <div>
      <p>Bounded MessageBar comparison</p>
      <p>
        Shared fixtures compare root/grid, body/title/link, intent glyph, actions, container action,
        reflow spacer, and slot geometry after owned animations and ResizeObserver reflow settle.
        Values are exact; every difference remains in the report. The consumer example intentionally
        changes CSS priority, rather than asking ordinary CSS to match legacy Griffel precedence.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output
        className={styles.report}
        aria-label="MessageBar style report"
        aria-live="polite"
        data-ready={report ? 'true' : 'false'}
        data-fixture-count={report?.fixtures ?? 0}
        data-compared-roots={report ? report.fixtures * 2 : 0}
        data-difference-count={report?.differences.length ?? 0}
      >
        {report === null
          ? 'Comparison not run.'
          : report.differences.length
            ? `${report.differences.length} differences across ${report.fixtures} fixtures:\n${JSON.stringify(
                report.differences,
                null,
                2,
              )}`
            : `No differences in the selected properties. ${report.fixtures} fixtures ready.`}
      </output>
      <div ref={containerRef}>
        <MessageBarComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless MessageBar',
  component: MessageBar,
  subcomponents: { MessageBarActions, MessageBarBody, MessageBarTitle },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Current headless 0.3.2 MessageBar family: MessageBar, MessageBarActions, MessageBarBody, and MessageBarTitle. MessageBarGroup is not published by this facade. Public hooks, current context helpers, and public renderers preserve native div/span slots, refs, and caller renderers. Only the missing current visual shape and CoreAI brand intent are restored; no removed animation or focus API is added. CSS is ported from installed react-message-bar 9.7.9, also the resolved behavior package. Brand delegates to info, including its default glyph and announcement preset, with or without CoreAI defaults. Native ResizeObserver owns reflow; no overlay or focusgroup polyfill is needed. Announcements require an application announcer. The pinned hook maps any explicit politeness string to polite and does not announce same-intent text updates; these are inherited, nonblocking boundaries. Use default intent presets and a new keyed message for an update. The installed family resolves a separate react-button 9.11.3 copy from the headless Button facade, so consumer actions pass size explicitly rather than adding a context bridge.',
      },
    },
  },
  argTypes: {
    intent: { control: 'select', options: messageBarIntents },
    shape: { control: 'select', options: messageBarShapes },
    layout: { control: 'select', options: messageBarLayouts },
  },
} satisfies Meta<typeof MessageBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByText('Bounded MessageBar comparison', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    const report = canvas.getByRole('status', { name: 'MessageBar style report' });
    await waitFor(
      async () => {
        await expect(report).toHaveAttribute('data-ready', 'true');
        await expect(report).toHaveAttribute(
          'data-fixture-count',
          String(messageBarExamples.length),
        );
        await expect(report).toHaveAttribute(
          'data-compared-roots',
          String(messageBarExamples.length * 2),
        );
        await expect(report).toHaveAttribute('data-difference-count', '0');
        await expect(report).toHaveTextContent('No differences in the selected properties.');
      },
      { timeout: 15000 },
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[messageBarConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByText('Bounded MessageBar comparison', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    const report = canvas.getByRole('status', { name: 'MessageBar style report' });
    await waitFor(async () => {
      await expect(report).toHaveAttribute('data-ready', 'true');
      await expect(report).toHaveAttribute('data-fixture-count', '1');
      await expect(report).toHaveAttribute('data-compared-roots', '2');
    });
    const root = getComparisonMessageBar(canvasElement, 'headless');
    await expect(getComputedStyle(root).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    await expect(getComputedStyle(root).backgroundColor).toBe('rgb(237, 232, 247)');
    const icon = root.querySelector('.fui-MessageBar__icon');
    if (!icon) throw new Error('Consumer MessageBar icon is missing');
    await expect(getComputedStyle(icon).fontSize).toBe('18px');
    await expect(getComputedStyle(icon).color).toBe('rgb(80, 40, 120)');
    await expect(Number(report.getAttribute('data-difference-count'))).toBeGreaterThan(0);
  },
};

export const DismissAndUpdate: Story = {
  render: () => <MessageBarNotificationsFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Publish warning' }));
    await expect(canvas.getByRole('group', { name: 'Workspace warning' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Review access' }));
    await expect(canvas.getByRole('status', { name: 'Reviewed updates' })).toHaveTextContent(
      'Reviewed: 1',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss workspace update' }));
    await expect(
      canvas.queryByRole('group', { name: 'Workspace warning' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Publish warning' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Publish success' }));
    await expect(canvas.getByRole('group', { name: 'Workspace ready' })).toHaveAttribute(
      'data-intent',
      'success',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Publish brand update' }));
    await expect(canvas.getByRole('group', { name: 'Workspace ready' })).toHaveAttribute(
      'data-intent',
      'brand',
    );
  },
};

export const ReflowAndForms: Story = {
  render: () => <MessageBarReflowFormFlow />,
  play: async ({ canvas, canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-messagebar-reflow]');
    if (!root) throw new Error('Reflow MessageBar is missing');
    await userEvent.hover(canvas.getByRole('combobox', { name: 'Message layout' }));
    await settleMessageBarStyles(root);
    await expect(root).toHaveAttribute('data-layout', 'singleline');
    await userEvent.click(canvas.getByRole('button', { name: 'Use narrow surface' }));
    await waitFor(async () => {
      await expect(root).toHaveAttribute('data-layout', 'multiline');
    });
    await settleMessageBarStyles(root);
    await userEvent.click(canvas.getByRole('button', { name: 'Use wide surface' }));
    await waitFor(async () => {
      await expect(root).toHaveAttribute('data-layout', 'singleline');
    });
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Message layout' }),
      'multiline',
    );
    await expect(root).toHaveAttribute('data-layout', 'multiline');
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Workspace code' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Workspace code' }), 'orion');
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(canvas.getByRole('status', { name: 'Message form result' })).toHaveTextContent(
      'orion:retry',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reset form' }));
    await expect(canvas.getByRole('textbox', { name: 'Workspace code' })).toHaveValue('atlas');
    await expect(canvas.getByRole('status', { name: 'Message form result' })).toHaveTextContent(
      'Form reset',
    );
    await userEvent.hover(canvas.getByRole('combobox', { name: 'Message layout' }));
    await settleMessageBarStyles(root);
  },
};
