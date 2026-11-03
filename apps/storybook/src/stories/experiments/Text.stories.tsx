// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Text, type TextProps } from '@coreai-ds/react-headless-components';
import { withHeadlessProvider } from './ComparisonProvider.js';
import { TextComparison } from './TextComparison.js';
import {
  textAlignments,
  textConsumerExample,
  textFonts,
  textForegrounds,
  textPresetExpectations,
  textSizes,
  textUppercaseExamples,
  textWeights,
  type TextExample,
} from './TextFixtures.js';
import {
  captureTextStyles,
  compareTextStyles,
  getComparisonText,
  settleTextStyles,
  type TextStyleDifference,
} from './TextComparisonStyles.js';
import styles from './TextComparison.module.css';

function ComparisonWithReport({
  examples,
  showUppercaseTracking = false,
  consumerOverrides = false,
}: {
  examples?: readonly TextExample[];
  showUppercaseTracking?: boolean;
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<string>('Comparison not run.');

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Text comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-text-case]')];
    if (!rows.length) throw new Error('Text comparison has no examples');
    const differences: (TextStyleDifference & { example: string })[] = [];
    const tracking: {
      example: string;
      legacy: string;
      nativeInComparison: string;
      expectedWithNewProviderOnly: string;
    }[] = [];
    for (const row of rows) {
      const legacy = getComparisonText(row, 'legacy');
      const native = getComparisonText(row, 'headless');
      await Promise.all([settleTextStyles(legacy), settleTextStyles(native)]);
      const legacyStyles = captureTextStyles(legacy);
      const nativeStyles = captureTextStyles(native);
      const example = row.dataset.textCase ?? '';
      differences.push(
        ...compareTextStyles(legacyStyles, nativeStyles).map((difference) => ({
          example,
          ...difference,
        })),
      );
      if (showUppercaseTracking) {
        tracking.push({
          example,
          legacy: legacyStyles['letter-spacing'],
          nativeInComparison: nativeStyles['letter-spacing'],
          expectedWithNewProviderOnly: `${Number.parseFloat(nativeStyles['font-size']) * 0.1}px`,
        });
      }
    }
    setReport(
      showUppercaseTracking
        ? JSON.stringify({ differences, tracking }, null, 2)
        : differences.length
          ? JSON.stringify(differences, null, 2)
          : 'No differences in the selected properties.',
    );
  };

  return (
    <div>
      <p>
        Native Text recreates the supported Fluent visual props and CoreAI inheritance, foreground,
        uppercase, and size/weight presets. The selected HTML element owns semantics. No deprecated
        typography preset components or styled Fluent Text hooks are used.
      </p>
      <p>
        The report compares selected typography, decorations, wrapping, margins, direction, and
        dimensions. It reports every difference in those properties, not screenshot parity.
      </p>
      {showUppercaseTracking && (
        <p>
          Known legacy bug: the old provider&apos;s unlayered responsive tracking overrides
          uppercase&apos;s 0.1em spacing. This Storybook comparison is inside that old provider, so
          its descendant rule can also override the new column. The report retains actual values and
          the expected new-provider-only spacing; independent native-provider tests cover that
          contract without the old provider.
        </p>
      )}
      {consumerOverrides && (
        <p>
          Intentional cascade difference: unlayered consumer CSS overrides the local native
          component. Legacy Griffel may retain its styles. The old outer provider can also override
          letter spacing in either column; independent new-provider tests verify the consumer&apos;s
          2px tracking without that legacy rule. Differences are not suppressed.
        </p>
      )}
      <button type="button" onClick={compare}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {report}
      </output>
      <div ref={containerRef}>
        <TextComparison examples={examples} />
      </div>
    </div>
  );
}

function TextPlayground(props: TextProps) {
  return (
    <div className={styles.playground}>
      <Text {...props} />
      <Text as="h2" preset="heading3" foreground={1}>
        Weekly report <Text foreground={4}>updated today</Text>
      </Text>
      <Text preset="body" foreground={2}>
        Configuration lives in{' '}
        <Text font="monospace" foreground={1}>
          report.json
        </Text>
        .
      </Text>
      <Text as="p" block wrap={false} truncate>
        A long project status line that truncates at the available container width without replacing
        its accessible text.
      </Text>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Text',
  component: Text,
  decorators: [withHeadlessProvider],
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Local native React typography primitive, because the current public headless package does not publish Text. Fluent visual selection is recreated with CSS Modules; CoreAI inheritance, foreground, uppercase, and presets remain separate overrides. Omitted font/size/weight inherit regardless of the component-defaults setting. Native polymorphic elements, refs, events, and React children are preserved. No Fluent slot state or deprecated typography preset component API is invented.',
      },
    },
  },
  argTypes: {
    align: { control: 'select', options: textAlignments },
    font: { control: 'select', options: textFonts },
    size: { control: 'select', options: textSizes },
    weight: { control: 'select', options: textWeights },
    foreground: { control: 'select', options: textForegrounds },
    preset: { control: 'select', options: textPresetExpectations.map(([preset]) => preset) },
    block: { control: 'boolean' },
    italic: { control: 'boolean' },
    strikethrough: { control: 'boolean' },
    truncate: { control: 'boolean' },
    underline: { control: 'boolean' },
    uppercase: { control: 'boolean' },
    wrap: { control: 'boolean' },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      await canvas.findByText('No differences in the selected properties.'),
    ).toBeVisible();
  },
};

export const UppercaseTracking: Story = {
  render: () => <ComparisonWithReport examples={textUppercaseExamples} showUppercaseTracking />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).toHaveTextContent('expectedWithNewProviderOnly');
    });
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[textConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const native = getComparisonText(canvasElement, 'headless');
    await settleTextStyles(native);
    const values = captureTextStyles(native);
    await expect(values['font-size']).toBe('22px');
    await expect(values['font-weight']).toBe('400');
    await expect(values['text-transform']).toBe('lowercase');
    await expect(values['text-decoration-line']).toBe('none');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.');
    });
  },
};

export const Playground: Story = {
  args: { children: 'Project status', preset: 'body', foreground: 2 },
  render: (args) => <TextPlayground {...args} />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Weekly report updated today', level: 2 }),
    ).toBeVisible();
    const heading = canvas.getByRole('heading', { level: 2 });
    const nested = canvas.getByText('updated today');
    const headingStyles = getComputedStyle(heading);
    const nestedStyles = getComputedStyle(nested);
    await expect(nestedStyles.fontSize).toBe(headingStyles.fontSize);
    await expect(nestedStyles.fontWeight).toBe(headingStyles.fontWeight);
    await expect(nestedStyles.color).not.toBe(headingStyles.color);
  },
};
