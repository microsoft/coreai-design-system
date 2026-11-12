// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import { InfoLabel } from '@coreai-ds/react-headless-components';
import {
  InfoLabelComparisonWithReport,
  InfoLabelHelpFlow,
  infoLabelConsumerExample,
  infoLabelExamples,
} from './InfoLabelComparison.js';
import {
  captureInfoLabelStyles,
  compareInfoLabelStyles,
  getComparisonInfoLabel,
} from './compareInfoLabelStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless InfoLabel',
  component: InfoLabel,
  args: { children: 'Project name', info: 'Use the name your team recognizes.' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Public headless 0.4.1 InfoLabel hook/renderer with react-infolabel 9.4.27 visual selection, completed Label 9.4.6 styling, and native Popover composition. CoreAI has no InfoLabel defaults or style overrides. The label is the primary slot and forward-ref target; className/style remain on the root span. Public slot render adapters preserve HeadlessLabel/HeadlessInfoButton element metadata without registry mutation or casts. An internal styled base retains the current InfoButton contract and generated label/self-reference naming without generated aria-owns ownership, while the public standalone InfoButton retains CoreAI’s required-name union and primitive naming. Required indicators remain inside the label, before its sibling information button. Current truthy info resolution and slot overrides are preserved. Native Popover/dialog/CSS-anchor polyfills are consumer-owned on older browsers; there is no Tabster, Portal, JS positioning fallback, or focusgroup requirement.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    weight: { control: 'select', options: ['regular', 'semibold'] },
  },
} satisfies Meta<typeof InfoLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <InfoLabelComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('infolabel-pointer-rest'));
    await waitFor(
      async () => {
        const report = canvas.getByRole('status', { name: 'InfoLabel style report' });
        await expect(report).toHaveAttribute('data-infolabel-report-state', 'ready');
        await expect(report).toHaveAttribute(
          'data-infolabel-fixture-count',
          String(infoLabelExamples.length),
        );
        await expect(report).toHaveAttribute('data-infolabel-unexpected-count', '0');
      },
      { timeout: 10000 },
    );
    for (const row of canvasElement.querySelectorAll('[data-infolabel-case]')) {
      const legacy = getComparisonInfoLabel(row, 'legacy');
      const headless = getComparisonInfoLabel(row, 'headless');
      await expect(
        compareInfoLabelStyles(captureInfoLabelStyles(legacy), captureInfoLabelStyles(headless)),
      ).toEqual([]);
      await expect(headless.label.control).toBe(headless.control);
      await expect(headless.root.getBoundingClientRect().height).toBeGreaterThan(0);
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <InfoLabelComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <InfoLabelComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <InfoLabelComparisonWithReport examples={[infoLabelConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(
      async () => {
        await expect(
          canvas.getByRole('status', { name: 'InfoLabel style report' }),
        ).toHaveAttribute('data-infolabel-report-state', 'ready');
      },
      { timeout: 10000 },
    );
    const current = getComparisonInfoLabel(canvasElement, 'headless');
    await expect(getComputedStyle(current.label).color).toBe('rgb(20, 90, 60)');
    if (!current.button) throw new Error('Missing consumer information button');
    await expect(getComputedStyle(current.button).marginTop).toBe('3px');
  },
};

export const RequiredLabelAndNativeHelp: Story = {
  render: () => <InfoLabelHelpFlow />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Project name' });
    await expect(input).toBeRequired();
    await expect(input).not.toHaveAttribute('aria-invalid');
    await userEvent.click(canvas.getByText('Project name', { selector: 'label' }));
    await expect(input).toHaveFocus();
    const trigger = canvas.getByRole('button', { name: 'Project name information' });
    await userEvent.click(trigger);
    await waitFor(async () => {
      const note = canvas.getByRole('note');
      await expect(note).toHaveFocus();
      await expect(note.matches(':popover-open')).toBe(true);
      await expect(trigger.closest('.fui-InfoLabel')).not.toHaveAttribute('aria-owns');
    });
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Naming guide' })).toHaveFocus();
    // Trusted Escape is covered by Chromium; this play uses the native dismissal API.
    canvas.getByRole('note').hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('note')).toBeNull();
    });
    await expect(
      canvas.getByRole('status', { name: 'InfoLabel callback count' }),
    ).toHaveTextContent('2');
  },
};
