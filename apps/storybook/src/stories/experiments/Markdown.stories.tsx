// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Markdown } from '../../../../../packages/react-headless-components/src/Markdown.js';
import type { CoreAIFluentProviderProps } from '../../../../../packages/react-headless-components/src/CoreAIFluentProvider.js';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import {
  MarkdownComparison,
  MarkdownFlow,
  markdownConsumerExample,
  markdownExtendedExample,
  markdownFlowSource,
  markdownTypographySource,
  type MarkdownExample,
} from './MarkdownComparison.js';
import {
  captureMarkdownStyles,
  compareMarkdownStyles,
  getComparisonMarkdown,
  settleMarkdownStyles,
  type MarkdownStyleDifference,
} from './MarkdownComparisonStyles.js';
import { withHeadlessProvider } from './ComparisonProvider.js';
import styles from './MarkdownComparison.module.css';

function ComparisonWithReport({
  examples,
  theme,
  dir,
}: {
  examples?: readonly MarkdownExample[];
  theme?: CoreAIFluentProviderProps['theme'];
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (MarkdownStyleDifference & { example: string })[] | null
  >(null);
  const [capturing, setCapturing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Markdown comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-markdown-case]')];
    if (!rows.length) throw new Error('Markdown comparison has no examples');
    setCapturing(true);
    const results: (MarkdownStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonMarkdown(row, 'legacy');
      const headless = getComparisonMarkdown(row, 'headless');
      await Promise.all([settleMarkdownStyles(legacy), settleMarkdownStyles(headless)]);
      if (!legacy.getBoundingClientRect().height || !headless.getBoundingClientRect().height) {
        throw new Error('Markdown comparison has no rendered geometry');
      }
      results.push(
        ...compareMarkdownStyles(
          captureMarkdownStyles(legacy),
          captureMarkdownStyles(headless),
        ).map((difference) => ({ example: row.dataset.markdownCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
    setCapturing(false);
  };
  return (
    <div>
      <p>
        The same Markdown, plugins, and renderer overrides feed both implementations. Native
        headings, links, lists, and tables retain their semantics. CoreAI owns these content styles;
        the new composition reuses only its local Link and CodeBlock.
      </p>
      <p>
        Selected typography, table scrolling, block rhythm, code surfaces, and syntax palettes are
        compared below. React-markdown keeps its safe URL/HTML defaults. Math requires consumer
        plugins and styles; no raw HTML or math plugin is enabled by this component.
      </p>
      <button type="button" onClick={compare}>
        Compare Markdown styles
      </button>
      <output
        className={styles.report}
        aria-label="Markdown style comparison"
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
        <MarkdownComparison examples={examples} theme={theme} dir={dir} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Markdown',
  component: Markdown,
  decorators: [withHeadlessProvider],
  args: { content: markdownTypographySource },
  parameters: { layout: 'padded', throwPlayFunctionExceptions: true },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare Markdown styles' }));
  await waitFor(async () => {
    const report = canvas.getByRole('status', { name: 'Markdown style comparison' });
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
  render: () => <ComparisonWithReport examples={[markdownConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonMarkdown(canvasElement, 'headless');
    await expect(getComputedStyle(root).fontSize).toBe('17px');
    await expect(getComputedStyle(root).color).toBe('rgb(20, 90, 160)');
    const heading = root.querySelector('h2');
    const table = root.querySelector('table');
    if (!heading || !table) throw new Error('Missing consumer content');
    await expect(getComputedStyle(heading).fontSize).toBe('21px');
    await expect(getComputedStyle(table).borderCollapse).toBe('collapse');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare Markdown styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Markdown style comparison' }),
      ).toHaveAttribute('data-report-state', 'ready');
    });
  },
};

export const Extensions: Story = {
  render: () => <Markdown {...markdownExtendedExample.props} />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Extended Consumer heading' }),
    ).toBeVisible();
    await expect(canvas.getByText('Remark extension content.')).toBeVisible();
    await expect(canvas.getByText('Rehype extension content.')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Consumer link' })).toHaveAttribute(
      'data-renderer',
      'consumer-link',
    );
    await expect(canvas.getByRole('button', { name: 'Copy code' })).toBeVisible();
  },
};

export const NativeEditingFlow: Story = {
  render: () => <MarkdownFlow />,
  play: async ({ canvas }) => {
    const originalWriteText = navigator.clipboard.writeText;
    const writeText = fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    navigator.clipboard.writeText = writeText;
    try {
      const external = canvas.getByRole('link', { name: 'External guide' });
      await expect(external).toHaveAttribute('target', '_blank');
      await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
      await userEvent.click(external);
      await expect(canvas.getByRole('status', { name: 'Markdown link result' })).toHaveTextContent(
        'https://example.com',
      );
      await expect(
        canvas.getByRole('link', { name: 'Jump to release details' }),
      ).not.toHaveAttribute('target');
      await expect(
        canvas.getByRole('heading', { level: 2, name: 'Release details' }),
      ).toHaveAttribute('id', 'release-details');
      await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));
      await expect(writeText).toHaveBeenLastCalledWith('const version = "1.0";');
      await expect(canvas.getByRole('status', { name: 'Markdown form result' })).toHaveTextContent(
        'No submission',
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Save Markdown' }));
      await expect(canvas.getByRole('status', { name: 'Markdown form result' })).toHaveTextContent(
        markdownFlowSource,
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Load new document' }));
      await expect(
        canvas.getByRole('heading', { level: 2, name: 'Updated content' }),
      ).toHaveAttribute('id', 'updated-content');
      await expect(canvas.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
    } finally {
      navigator.clipboard.writeText = originalWriteText;
    }
  },
};
