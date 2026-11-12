// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FluentProvider } from '@coreai-ds/react-components';
import { RangeSlider } from '../../../../../packages/react-headless-components/src/RangeSlider.js';
import {
  RangeSliderComparison,
  RangeSliderPriceFilter,
  rangeSliderSizes,
} from './RangeSliderComparison.js';

function getRow(canvasElement: HTMLElement, name: string) {
  const row = canvasElement.querySelector<HTMLElement>(`[data-range-slider-case="${name}"]`);
  if (!row) throw new Error(`Missing range slider fixture ${name}`);
  const root = row.querySelector<HTMLElement>('.fui-RangeSlider');
  const reference = row.querySelector<HTMLElement>('.fui-Slider');
  if (!root || !reference) throw new Error(`Incomplete range slider fixture ${name}`);
  const part = (element: HTMLElement, selector: string) => {
    const match = element.querySelector<HTMLElement>(selector);
    if (!match) throw new Error(`Missing ${selector} in ${name}`);
    return match;
  };
  return {
    root,
    rail: part(root, '.fui-RangeSlider__rail'),
    startThumb: part(root, '.fui-RangeSlider__startThumb'),
    endThumb: part(root, '.fui-RangeSlider__endThumb'),
    referenceRail: part(reference, '.fui-Slider__rail'),
    referenceThumb: part(reference, '.fui-Slider__thumb'),
  };
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless RangeSlider',
  component: RangeSlider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useRangeSlider/renderRangeSlider from headless preview 0.4.1, with CSS Modules ported from react-range-slider-preview 0.1.0. CoreAI has no legacy RangeSlider, so each row compares against the headless Slider of the same size, which shares its rail, thumb, and color tokens. The wrapper restores only the small/medium size prop and a data-thumbs-overlap flag that mirrors the v9 rule for raising the active thumb. Pointer handling, the per-thumb native range inputs, values, data-disabled/data-vertical/data-active, and the progress, step, and direction variables remain headless-owned. Native :focus-visible replaces the legacy focus-within attribute.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: rangeSliderSizes },
    vertical: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    rail: { control: false },
    startThumb: { control: false },
    endThumb: { control: false },
    startInput: { control: false },
    endInput: { control: false },
  },
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <RangeSliderComparison />,
  play: async ({ canvasElement }) => {
    for (const name of ['Default', 'Size: small', 'Size: medium', 'Vertical: small']) {
      const { rail, startThumb, endThumb, referenceRail, referenceThumb } = getRow(
        canvasElement,
        name,
      );
      const vertical = name.startsWith('Vertical');
      const railBox = rail.getBoundingClientRect();
      const referenceRailBox = referenceRail.getBoundingClientRect();
      await expect(vertical ? railBox.width : railBox.height).toBe(
        vertical ? referenceRailBox.width : referenceRailBox.height,
      );
      for (const thumb of [startThumb, endThumb]) {
        await expect(thumb.getBoundingClientRect().width).toBe(
          referenceThumb.getBoundingClientRect().width,
        );
        await expect(getComputedStyle(thumb).backgroundColor).toBe(
          getComputedStyle(referenceThumb).backgroundColor,
        );
        await expect(getComputedStyle(thumb).boxShadow).toBe(
          getComputedStyle(referenceThumb).boxShadow,
        );
      }
    }
    const disabled = getRow(canvasElement, 'Disabled');
    await expect(getComputedStyle(disabled.startThumb).backgroundColor).toBe(
      getComputedStyle(disabled.referenceThumb).backgroundColor,
    );
    const startDisabled = getRow(canvasElement, 'Start thumb disabled');
    await expect(startDisabled.startThumb).toHaveAttribute('data-disabled');
    await expect(getComputedStyle(startDisabled.startThumb).backgroundColor).toBe(
      getComputedStyle(disabled.startThumb).backgroundColor,
    );
    await expect(getComputedStyle(startDisabled.endThumb).backgroundColor).not.toBe(
      getComputedStyle(disabled.startThumb).backgroundColor,
    );
  },
};

export const RightToLeft: Story = {
  render: () => (
    <FluentProvider dir="rtl">
      <RangeSliderComparison
        examples={[
          { name: 'RTL horizontal', props: { defaultValue: { start: 20, end: 60 } } },
          { name: 'RTL vertical', props: { vertical: true, defaultValue: { start: 20, end: 60 } } },
        ]}
      />
    </FluentProvider>
  ),
  play: async ({ canvasElement }) => {
    const { root, rail, startThumb, endThumb } = getRow(canvasElement, 'RTL horizontal');
    await expect(root.style.getPropertyValue('--fui-RangeSlider--direction')).toBe('270deg');
    const railBox = rail.getBoundingClientRect();
    const center = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return box.left + box.width / 2;
    };
    await expect(center(startThumb)).toBeGreaterThan(center(endThumb));
    await expect(center(startThumb)).toBeGreaterThan(railBox.left + railBox.width / 2);
  },
};

export const PriceFilter: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <>
      <p>
        This play uses native stepUp/stepDown and input events. Storybook&apos;s synthetic keyboard
        events do not invoke the browser&apos;s default range stepping. Trusted keyboard and pointer
        behavior is covered in the Vitest Chromium tests.
      </p>
      <RangeSliderPriceFilter {...args} />
    </>
  ),
  play: async ({ canvas, args }) => {
    const start = canvas.getByRole('slider', { name: 'Minimum price' });
    const end = canvas.getByRole('slider', { name: 'Maximum price' });
    if (!(start instanceof HTMLInputElement) || !(end instanceof HTMLInputElement)) {
      throw new Error('Missing native range inputs');
    }
    const status = canvas.getByRole('status', { name: 'Selected price range' });
    await userEvent.tab();
    await expect(start).toHaveFocus();
    await expect(start.matches(':focus-visible')).toBe(true);
    start.stepUp();
    start.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(status).toHaveTextContent('250–800'));
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'change', value: { start: 250, end: 800 } }),
    );
    end.stepDown(20);
    end.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(status).toHaveTextContent('250–250'));
    await expect(end.min).toBe('250');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset range' }));
    await expect(status).toHaveTextContent('200–800');
    await expect(canvas.getByRole('status', { name: 'Change events' })).toHaveTextContent('2');
  },
};
