// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CodeBlock } from '../../../../../packages/react-headless-components/src/CodeBlock.js';
import type { CoreAIFluentProviderProps } from '../../../../../packages/react-headless-components/src/CoreAIFluentProvider.js';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import {
  CodeBlockComparison,
  CodeBlockFlow,
  codeBlockConsumerExample,
  codeBlockSource,
  type CodeBlockExample,
} from './CodeBlockComparison.js';
import {
  captureCodeBlockStyles,
  compareCodeBlockStyles,
  getComparisonCodeBlock,
  settleCodeBlockStyles,
  type CodeBlockStyleDifference,
} from './CodeBlockComparisonStyles.js';
import { withHeadlessProvider } from './ComparisonProvider.js';
import styles from './CodeBlockComparison.module.css';

function ComparisonWithReport({
  examples,
  theme,
  dir,
}: {
  examples?: readonly CodeBlockExample[];
  theme?: CoreAIFluentProviderProps['theme'];
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (CodeBlockStyleDifference & { example: string })[] | null
  >(null);
  const [capturing, setCapturing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('CodeBlock comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-code-block-case]')];
    if (!rows.length) throw new Error('CodeBlock comparison has no examples');
    setCapturing(true);
    const results: (CodeBlockStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonCodeBlock(row, 'legacy');
      const headless = getComparisonCodeBlock(row, 'headless');
      await Promise.all([settleCodeBlockStyles(legacy), settleCodeBlockStyles(headless)]);
      if (!legacy.getBoundingClientRect().height || !headless.getBoundingClientRect().height) {
        throw new Error('CodeBlock comparison has no rendered geometry');
      }
      results.push(
        ...compareCodeBlockStyles(
          captureCodeBlockStyles(legacy),
          captureCodeBlockStyles(headless),
        ).map((difference) => ({ example: row.dataset.codeBlockCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
    setCapturing(false);
  };
  return (
    <div>
      <p>
        CoreAI owns this native content composition and its CSS, including the retained VS/VS2015
        syntax palettes. It is not a missing Fluent headless facade. Only the comparison publishes
        both old and new contexts; the new component uses its own theme-mode context and CopyButton.
      </p>
      <p>
        The report compares selected surface, header/footer, scrolling, copy-action geometry, and
        syntax-token properties. Native forms, refs, copying, and content updates have focused
        tests. Copy feedback uses the existing native Tooltip foundation.
      </p>
      <button type="button" onClick={compare}>
        Compare code styles
      </button>
      <output
        className={styles.report}
        aria-label="CodeBlock style comparison"
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
        <CodeBlockComparison examples={examples} theme={theme} dir={dir} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless CodeBlock',
  component: CodeBlock,
  decorators: [withHeadlessProvider],
  args: { code: codeBlockSource, language: 'javascript' },
  parameters: { layout: 'padded', throwPlayFunctionExceptions: true },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare code styles' }));
  await waitFor(async () => {
    const report = canvas.getByRole('status', { name: 'CodeBlock style comparison' });
    await expect(report).toHaveAttribute('data-report-state', 'ready');
    await expect(report).toHaveTextContent('No differences in the selected properties.');
  });
};

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: comparePlay,
};

export const LightComparison: Story = {
  render: () => <ComparisonWithReport theme={coreaiLightTheme} />,
  play: comparePlay,
};

export const DarkComparison: Story = {
  render: () => <ComparisonWithReport theme={coreaiDarkTheme} />,
  play: comparePlay,
};

export const RTLComparison: Story = {
  render: () => <ComparisonWithReport dir="rtl" />,
  play: comparePlay,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[codeBlockConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonCodeBlock(canvasElement, 'headless');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    const header = root.querySelector('.fui-CodeBlock__header');
    if (!(header instanceof HTMLElement)) throw new Error('Missing consumer header');
    await expect(getComputedStyle(header).paddingTop).toBe('3px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare code styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'CodeBlock style comparison' }),
      ).toHaveAttribute('data-report-state', 'ready');
    });
  },
};

export const NativeContentFlow: Story = {
  render: () => <CodeBlockFlow />,
  play: async ({ canvas }) => {
    const originalWriteText = navigator.clipboard.writeText;
    const writeText = fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    navigator.clipboard.writeText = writeText;
    try {
      await expect(canvas.getByRole('status', { name: 'Code root ref' })).toHaveTextContent('DIV');
      await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));
      await expect(writeText).toHaveBeenLastCalledWith(codeBlockSource);
      await expect(canvas.getByRole('status', { name: 'Code copy clicks' })).toHaveTextContent(
        '1 copy clicks',
      );
      await expect(canvas.getByRole('status', { name: 'Code form result' })).toHaveTextContent(
        'No submission',
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Load alternative' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));
      await expect(writeText).toHaveBeenLastCalledWith('const updated = "New content";');
      await userEvent.click(canvas.getByRole('button', { name: 'Save example' }));
      await expect(canvas.getByRole('status', { name: 'Code form result' })).toHaveTextContent(
        'example.js | const updated = "New content"; | save',
      );
      await userEvent.clear(canvas.getByRole('textbox', { name: 'Source code' }));
      await expect(canvas.getByText('Enter source code')).toBeVisible();
      await expect(canvas.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
    } finally {
      navigator.clipboard.writeText = originalWriteText;
    }
  },
};
