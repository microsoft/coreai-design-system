// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CopyButton } from '../../../../../packages/react-headless-components/src/CopyButton.js';
import {
  coreaiDarkTheme,
  type CoreAITheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import {
  CopyButtonComparison,
  CopyButtonFlow,
  copyButtonConsumerExample,
  type CopyButtonExample,
} from './CopyButtonComparison.js';
import {
  captureCopyButtonStyles,
  compareCopyButtonStyles,
  getComparisonCopyButton,
  settleCopyButtonStyles,
  type CopyButtonStyleDifference,
} from './CopyButtonComparisonStyles.js';
import { withHeadlessProvider } from './ComparisonProvider.js';
import styles from './CopyButtonComparison.module.css';

function ComparisonWithReport({
  examples,
  theme,
  withComponentDefaults = true,
  consumerOverrides = false,
}: {
  examples?: readonly CopyButtonExample[];
  theme?: Partial<CoreAITheme>;
  withComponentDefaults?: boolean;
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (CopyButtonStyleDifference & { example: string })[] | null
  >(null);
  const [capturing, setCapturing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('CopyButton comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-copy-button-case]')];
    if (!rows.length) throw new Error('CopyButton comparison has no examples');
    setCapturing(true);
    const results: (CopyButtonStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonCopyButton(row, 'legacy');
      const headless = getComparisonCopyButton(row, 'headless');
      await Promise.all([settleCopyButtonStyles(legacy), settleCopyButtonStyles(headless)]);
      if (!legacy.getBoundingClientRect().height || !headless.getBoundingClientRect().height)
        throw new Error('CopyButton comparison has no rendered geometry');
      results.push(
        ...compareCopyButtonStyles(
          captureCopyButtonStyles(legacy),
          captureCopyButtonStyles(headless),
        ).map((difference) => ({ example: row.dataset.copyButtonCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
    setCapturing(false);
  };
  return (
    <div>
      <p>
        The original package is the reference. Both columns receive the same fixtures, CoreAI theme,
        and defaults setting through separate providers. Light/dark follows the toolbar. This preset
        adds no CSS: it composes the new Button and native Tooltip foundations.
      </p>
      <p>
        The report compares selected resting Button/icon styles and dimensions. Clipboard callbacks,
        feedback timing, keyboard activation, and form results have focused browser coverage.
        Tooltip feedback uses the Popover API and CSS anchor positioning instead of a legacy portal.
      </p>
      {consumerOverrides && (
        <p>
          Ordinary consumer CSS deliberately outranks the Fluent/CoreAI layers. Any differences from
          Griffel remain visible in this report.
        </p>
      )}
      <button type="button" onClick={compare}>
        Compare resting styles
      </button>
      <output
        className={styles.report}
        aria-label="CopyButton style comparison"
        aria-live="polite"
        data-report-state={capturing ? 'capturing' : differences === null ? 'idle' : 'ready'}
      >
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <CopyButtonComparison
          examples={examples}
          theme={theme}
          withComponentDefaults={withComponentDefaults}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless CopyButton',
  component: CopyButton,
  decorators: [withHeadlessProvider],
  args: { 'aria-label': 'Copy project code', contentToCopy: 'CoreAI-42' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Current CopyButton preset on the new Button/Tooltip foundations and public headless icon entries. Clipboard success alone enables the 1.5-second feedback window. Empty content still calls the consumer click handler but does not copy. A second success during the window does not restart its timer, matching the original implementation. Consumer icon slots, including explicit null/undefined, retain precedence. Clipboard access requires a secure context and browser permission. The production package stays unchanged.',
      },
    },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
  await waitFor(async () => {
    const report = canvas.getByRole('status', { name: 'CopyButton style comparison' });
    await expect(report).toHaveAttribute('data-report-state', 'ready');
    await expect(report).toHaveTextContent('No differences in the selected properties.');
  });
};

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: comparePlay,
};

export const DarkComparison: Story = {
  render: () => <ComparisonWithReport theme={coreaiDarkTheme} />,
  play: comparePlay,
};

export const DefaultsDisabled: Story = {
  render: () => <ComparisonWithReport withComponentDefaults={false} />,
  play: comparePlay,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[copyButtonConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonCopyButton(canvasElement, 'headless');
    await settleCopyButtonStyles(root);
    const values = captureCopyButtonStyles(root);
    await expect(values['root.min-width']).toBe('144px');
    await expect(values['root.border-radius']).toBe('3px');
    await expect(values['root.color']).toBe('rgb(20, 90, 160)');
    await expect(values['presetIcon.width']).toBe('16px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'CopyButton style comparison' }),
      ).toHaveAttribute('data-report-state', 'ready');
    });
  },
};

export const InteractionFlow: Story = {
  render: () => <CopyButtonFlow />,
  play: async ({ canvas }) => {
    const originalWriteText = navigator.clipboard.writeText;
    const writeText = fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    navigator.clipboard.writeText = writeText;
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Copy code only' }));
      await expect(writeText).toHaveBeenLastCalledWith('CoreAI-42');
      await waitFor(async () => {
        await expect(canvas.getByRole('status', { name: 'Copy outcomes' })).toHaveTextContent(
          '1 clicks; 1 copied; 0 errors',
        );
      });
      await expect(canvas.getByRole('status', { name: 'Copy form result' })).toHaveTextContent(
        'No submission',
      );
      await userEvent.clear(canvas.getByRole('textbox', { name: 'Project code' }));
      await userEvent.type(canvas.getByRole('textbox', { name: 'Project code' }), 'CoreAI-84');
      await userEvent.click(canvas.getByRole('button', { name: 'Copy and submit code' }));
      await expect(writeText).toHaveBeenLastCalledWith('CoreAI-84');
      await waitFor(async () => {
        await expect(canvas.getByRole('status', { name: 'Copy outcomes' })).toHaveTextContent(
          '2 clicks; 2 copied; 0 errors',
        );
        await expect(canvas.getByRole('status', { name: 'Copy form result' })).toHaveTextContent(
          'Submitted CoreAI-84 (copy)',
        );
      });
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: 'Focusable unavailable copy' }),
      ).toHaveFocus();
      await userEvent.keyboard('{Enter} ');
      await expect(writeText).toHaveBeenCalledTimes(2);
    } finally {
      navigator.clipboard.writeText = originalWriteText;
    }
  },
};

export const Playground: Story = {};
