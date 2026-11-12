// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import { InfoButton } from '@coreai-ds/react-headless-components';
import {
  InfoButtonComparisonWithReport,
  InfoButtonHelpFlow,
  infoButtonConsumerExample,
  infoButtonSizes,
} from './InfoButtonComparison.js';
import {
  captureInfoButtonStyles,
  compareInfoButtonStyles,
  getComparisonInfoButton,
} from './compareInfoButtonStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless InfoButton',
  component: InfoButton,
  args: { 'aria-label': 'About project access', info: 'Editors can update project settings.' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'CoreAI standalone InfoButton preserves its custom required aria-label OR aria-labelledby union and primitive string/number→surface aria-label mapping. Rich slots remain caller-owned. This is intentionally distinct from the private current-base adapter that InfoLabel uses with its generated name. Public headless 0.4.1 useInfoButton/renderInfoButton own open state, blur closes (reported through onOpenChange), merged refs, initial surface focus, native light dismissal, and callbacks. Visuals come from react-infolabel 9.4.27. The primitive retains its own native Popover behavior and metadata; the completed PopoverSurface supplies its styles and defaults-gated CoreAI overlay border through the existing visual-only context. The props-object popover slot does not gain an unsupported render-children API. The default surface is a non-modal div popover with role=note; inertTrapFocus switches it to a modal native dialog with role=dialog. Both surface branches retain their real prop/ref contracts. Root render-function children are a pinned upstream boundary: the JSX runtime wraps their result in a Fragment that the built-in PopoverTrigger rejects. Use ordinary ReactNode button content; info-surface and InfoLabel slot render functions remain supported. No Fragment unwrapping or substitute trigger behavior is added. No old inline/Portal, Tabster, deprecated state components, JS positioner, or motion compatibility API is retained. The wrapper adds no callbacks beyond the hook’s own blur-close onOpenChange notification. CSS anchor/Popover/dialog polyfills remain consumer-owned; this family needs no focusgroup polyfill.',
      },
    },
  },
  argTypes: { size: { control: 'select', options: infoButtonSizes } },
} satisfies Meta<typeof InfoButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <InfoButtonComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('information-pointer-rest'));
    const assertReport = async (example: string) => {
      await waitFor(
        async () => {
          const report = canvas.getByRole('status', { name: 'InfoButton style report' });
          await expect(report).toHaveAttribute('data-infobutton-report-state', 'ready');
          await expect(report).toHaveAttribute('data-infobutton-report-example', example);
          await expect(report).toHaveAttribute('data-infobutton-fixture-count', '1');
          await expect(report).toHaveAttribute('data-infobutton-unexpected-count', '0');
        },
        { timeout: 10000 },
      );
    };
    await assertReport('Medium information');
    await userEvent.selectOptions(
      canvas.getByLabelText('InfoButton visual fixture'),
      'Large information',
    );
    await assertReport('Large information');
    const legacy = getComparisonInfoButton(canvasElement, 'legacy');
    const headless = getComparisonInfoButton(canvasElement, 'headless');
    await expect(headless.surface.matches(':popover-open')).toBe(true);
    await expect(headless.surface.getBoundingClientRect().height).toBeGreaterThan(0);
    await expect(
      compareInfoButtonStyles(
        captureInfoButtonStyles(legacy),
        captureInfoButtonStyles(headless),
        'medium',
      ).filter((difference) => difference.kind === 'unexpected'),
    ).toEqual([]);
  },
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <InfoButtonComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <InfoButtonComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <InfoButtonComparisonWithReport examples={[infoButtonConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(
      async () => {
        await expect(
          canvas.getByRole('status', { name: 'InfoButton style report' }),
        ).toHaveAttribute('data-infobutton-report-state', 'ready');
      },
      { timeout: 10000 },
    );
    const current = getComparisonInfoButton(canvasElement, 'headless');
    await expect(getComputedStyle(current.button).borderRadius).toBe('9px');
    await expect(getComputedStyle(current.surface).paddingTop).toBe('19px');
    await expect(getComputedStyle(current.surface).fontSize).toBe('15px');
  },
};

export const NativeHelp: Story = {
  render: () => <InfoButtonHelpFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'About project access' });
    await userEvent.click(trigger);
    await waitFor(async () => {
      const surface = canvas.getByRole('note', { name: 'Project access details' });
      await expect(surface).toHaveFocus();
      await expect(surface.matches(':popover-open')).toBe(true);
      await expect(trigger).toHaveAttribute('data-open', '');
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Review project access' }));
    await expect(
      canvas.getByRole('status', { name: 'Information action count' }),
    ).toHaveTextContent('1');
    // Trusted Escape is covered by Chromium; this play uses the native dismissal API.
    canvas.getByRole('note', { name: 'Project access details' }).hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('note')).toBeNull();
      await expect(trigger).not.toHaveAttribute('data-open');
    });
    await expect(canvas.getByRole('status', { name: 'Information events' })).toHaveTextContent(
      'open',
    );
    await expect(canvas.getByRole('status', { name: 'Information events' })).toHaveTextContent(
      'closed',
    );
  },
};
