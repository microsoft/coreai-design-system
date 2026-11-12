// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  Toast,
  ToastBody,
  ToastContainer,
  ToastFooter,
  ToastTitle,
  Toaster,
} from '@coreai-ds/react-headless-components';
import {
  ToastComparison,
  ToastControllerFlow,
  ToastNativeFormFlow,
  ToastPositionFlow,
  toastAppearances,
  toastConsumerExample,
  toastExamples,
  toastPositions,
  type ToastExample,
} from './ToastComparison.js';
import {
  captureToastStyles,
  compareToastStyles,
  getComparisonToast,
  getPositionToaster,
  settleToastStyles,
  type ToastStyleDifference,
} from './compareToastStyles.js';
import styles from './ToastComparison.module.css';

function ComparisonWithReport({
  examples = toastExamples,
}: {
  examples?: readonly ToastExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<{
    fixtures: number;
    differences: (ToastStyleDifference & { example: string })[];
  } | null>(null);
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Toast fixtures have not mounted');
    setComparing(true);
    setReport(null);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-toast-case]')];
      if (rows.length !== examples.length) throw new Error('Toast fixture count changed');
      const differences = [];
      for (const row of rows) {
        const legacy = getComparisonToast(row, 'legacy');
        const headless = getComparisonToast(row, 'headless');
        await Promise.all([settleToastStyles(legacy), settleToastStyles(headless)]);
        differences.push(
          ...compareToastStyles(captureToastStyles(legacy), captureToastStyles(headless)).map(
            (difference) => ({ example: row.dataset.toastCase ?? '', ...difference }),
          ),
        );
      }
      setReport({ fixtures: rows.length, differences });
    } finally {
      setComparing(false);
    }
  };
  return (
    <div>
      <p>Bounded Toast comparison</p>
      <p>
        Shared fixtures compare grid, typography, intent media, title, action, body, subtitle,
        footer, and their geometry. Static visual pairs share the current public ToastContainer for
        intent and ARIA context. The separate position report compares each original Toaster,
        including its automatically created notification containers and viewport geometry.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output
        aria-label="Toast style report"
        className={styles.report}
        data-ready={String(Boolean(report))}
        data-fixture-count={report?.fixtures ?? 0}
        data-compared-roots={report ? report.fixtures * 2 : 0}
        data-difference-count={report?.differences.length ?? 0}
      >
        {report === null
          ? 'Comparison not run.'
          : report.differences.length
            ? `${report.differences.length} differences across ${report.fixtures} fixtures:\n${JSON.stringify(report.differences, null, 2)}`
            : `No differences in the selected properties. ${report.fixtures} fixtures ready.`}
      </output>
      <div ref={containerRef}>
        <ToastComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Toast',
  component: Toast,
  subcomponents: { ToastTitle, ToastBody, ToastFooter, ToastContainer, Toaster },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Installed headless 0.3.2 publishes six visual members: Toast, ToastTitle, ToastBody, ToastFooter, ToastContainer, and Toaster. It does not publish ToastTrigger or a timer slot. All six use only their public hooks and renderers, with the current controller and container context re-exported unchanged. Only the missing appearance visual prop is restored. Fluent styles come from react-toast 9.8.5; CoreAI has no Toast defaults or style overrides. The native Toaster always uses manual popovers and has no inline or mountNode prop. Its public hook creates its own unstyled ToastContainer children, so one scoped native-container CSS foundation styles both those children and the standalone styled container without replacing the state machine, timers, or child components. The selector follows the public native div root rather than its ARIA role, preserving caller role overrides. The caller supplies a focusgroup polyfill when necessary; only these experimental consumers import it. Native focus-visible replaces Tabster focus styling. The current built-in native announcer maps assertive and polite Toast narration to normal ariaNotify priority; applications requiring urgency differentiation can supply the supported Toaster announce callback and use the public useAnnounce composition with explicit alert options. No second announcer is added. Current Toaster state-machine defaults are initialized once; dispatch/update options remain the supported way to change a notification. The pinned container removes initially invisible queued notifications: avoid queue overflow by dispatching sequentially or use the default unlimited stack. No legacy queue/motion manager or normalization shim is added.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: toastAppearances },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByText('Bounded Toast comparison', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    const report = canvas.getByRole('status', { name: 'Toast style report' });
    await waitFor(
      async () => {
        await expect(report).toHaveAttribute('data-ready', 'true');
        await expect(report).toHaveAttribute('data-fixture-count', String(toastExamples.length));
        await expect(report).toHaveAttribute(
          'data-compared-roots',
          String(toastExamples.length * 2),
        );
        await expect(report).toHaveAttribute('data-difference-count', '0');
        await expect(report).toHaveTextContent('No differences in the selected properties.');
      },
      { timeout: 15000 },
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[toastConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByText('Bounded Toast comparison', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    const report = canvas.getByRole('status', { name: 'Toast style report' });
    await waitFor(async () => {
      await expect(report).toHaveAttribute('data-ready', 'true');
      await expect(report).toHaveAttribute('data-fixture-count', '1');
      await expect(report).toHaveAttribute('data-compared-roots', '2');
    });
    const root = getComparisonToast(canvasElement, 'headless');
    await expect(getComputedStyle(root).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    await expect(getComputedStyle(root).paddingTop).toBe('17px');
    await expect(getComputedStyle(root).backgroundColor).toBe('rgb(237, 232, 247)');
    await expect(Number(report.getAttribute('data-difference-count'))).toBeGreaterThan(0);
  },
};

export const ControllerLifecycle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The pinned facade removes initially invisible queued containers, so overflow beyond limit is not legacy queue parity. Use the default unlimited stack, or bound dispatch to the configured limit and publish another notification after an unmounted callback. Raw/current tests cover limit={2}, two active notifications, and a third after one unmounts. Current native Chromium does not move between the opt-out Toast roots with arrow keys; the actual consumer polyfill does. F6 plus native Tab/Shift+Tab retains keyboard access, dismissal, and restoration without a wrapper normalization.',
      },
    },
  },
  render: () => <ToastControllerFlow />,
  play: async ({ canvas, canvasElement }) => {
    const result = canvas.getByRole('status', { name: 'Toast controller result' });
    const notifications = () =>
      canvasElement.querySelectorAll<HTMLElement>('[data-toast-controller-root]');
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch persistent' }));
    await waitFor(async () => {
      await expect(result).toHaveAttribute('data-visible-count', '1');
      await expect(notifications()).toHaveLength(1);
    });
    const id = notifications()[0].id;
    await userEvent.click(canvas.getByRole('button', { name: 'Update active' }));
    await waitFor(async () => {
      await expect(notifications()[0]).toHaveTextContent('Project notification 1 updated');
      await expect(notifications()[0]).toHaveAttribute('id', id);
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss active' }));
    await waitFor(async () => expect(notifications()).toHaveLength(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch timed' }));
    await waitFor(async () => expect(notifications()).toHaveLength(1));
    await userEvent.click(canvas.getByRole('button', { name: 'Pause active' }));
    await new Promise<void>((resolve) => setTimeout(resolve, 1350));
    await expect(notifications()).toHaveLength(1);
    await expect(result).toHaveAttribute('data-paused', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Resume active' }));
    await waitFor(async () => expect(notifications()).toHaveLength(0), { timeout: 3000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch persistent' }));
    await waitFor(async () => expect(notifications()).toHaveLength(1));
    await userEvent.keyboard('{F6}');
    await expect(notifications()[0]).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await waitFor(async () => expect(notifications()).toHaveLength(0));
    await expect(canvas.getByRole('button', { name: 'Dispatch persistent' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch persistent' }));
    await waitFor(async () => {
      await expect(result).toHaveAttribute('data-visible-count', '1');
      await expect(result).toHaveTextContent('"eventIsNull":true');
      await expect(notifications()).toHaveLength(1);
    });
    const toaster = canvasElement.querySelector<HTMLElement>('[data-toast-controller-toaster]');
    if (!toaster) throw new Error('Final native Toaster is missing');
    await settleToastStyles(toaster);
    await expect(toaster.matches(':popover-open')).toBe(true);
    await expect(toaster.getBoundingClientRect().width).toBe(292);
    await expect(notifications()[0].getBoundingClientRect().height).toBeGreaterThan(80);
  },
};

export const NativeFormsAndNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The current public ToastContainer handles a bubbled Delete key even when it originates in an editor. This application-owned input stops Delete propagation, not its native editing default. Raw/current regressions preserve unprotected dismissal and verify this supported native event composition. The components do not intercept editing keys or add a compatibility behavior.',
      },
    },
  },
  render: () => <ToastNativeFormFlow />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open rename notification' }));
    const root = () => canvasElement.querySelector<HTMLElement>('[data-toast-form-root]');
    await waitFor(async () => expect(root()).not.toBeNull());
    await userEvent.keyboard('{F6}');
    await expect(root()).toHaveFocus();
    await userEvent.click(canvas.getByRole('link', { name: 'Project history' }));
    await expect(window.location.hash).toBe('#toast-project-history');
    const input = canvas.getByRole('textbox', { name: 'Project name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Native project');
    await userEvent.click(canvas.getByRole('button', { name: 'Save name' }));
    const result = canvas.getByRole('status', { name: 'Toast form result' });
    await expect(result).toHaveTextContent('Native project:save');
    await waitFor(async () => {
      await expect(result).toHaveAttribute('data-status', 'unmounted');
      await expect(root()).toBeNull();
    });
    await expect(canvas.getByRole('button', { name: 'Open rename notification' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Open rename notification' }));
    await waitFor(async () => expect(root()).not.toBeNull());
    await waitFor(async () => expect(result).toHaveAttribute('data-status', 'visible'));
    const toaster = canvasElement.querySelector<HTMLElement>('[data-toast-form-toaster]');
    if (!toaster) throw new Error('Final native form Toaster is missing');
    await settleToastStyles(toaster);
    await expect(toaster.matches(':popover-open')).toBe(true);
    await expect(root()).toHaveAccessibleName('Rename project');
    await expect(toaster.getBoundingClientRect().width).toBe(292);
  },
};

export const PositionsAndOffsets: Story = {
  render: () => <ToastPositionFlow />,
  play: async ({ canvas }) => {
    const report = canvas.getByRole('status', { name: 'Toaster position report' });
    for (const [index, position] of toastPositions.entries()) {
      await userEvent.selectOptions(
        canvas.getByRole('combobox', { name: 'Toast position' }),
        position,
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Show position pair' }));
      await waitFor(async () =>
        expect(getPositionToaster(document, 'headless').matches(':popover-open')).toBe(true),
      );
      await waitFor(async () =>
        expect(getPositionToaster(document, 'headless').dataset.toasterPosition).toBe(position),
      );
      await waitFor(async () => {
        const legacy = getPositionToaster(document, 'legacy', position);
        await expect(legacy.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(1);
        await expect(legacy).toHaveTextContent(`Position ${position}`);
      });
      await userEvent.hover(canvas.getByText('Toast native positions', { exact: true }));
      await userEvent.click(canvas.getByRole('button', { name: 'Compare current position' }));
      await waitFor(
        async () => {
          await expect(report).toHaveAttribute('data-ready', 'true');
          await expect(report).toHaveAttribute('data-position', position);
          await expect(report).toHaveAttribute('data-comparison-count', String(index + 1));
          await expect(report).toHaveAttribute('data-compared-roots', String((index + 1) * 2));
          await expect(report).toHaveAttribute('data-difference-count', '0');
        },
        { timeout: 8000 },
      );
    }
    const nativeToaster = getPositionToaster(document, 'headless');
    await settleToastStyles(nativeToaster);
    await expect(nativeToaster.getAttribute('data-toaster-position')).toBe('bottom-end');
    await expect(nativeToaster.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(1);
    await expect(nativeToaster.getBoundingClientRect().width).toBe(292);
  },
};
