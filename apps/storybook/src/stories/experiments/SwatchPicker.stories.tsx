// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import {
  ColorSwatch,
  EmptySwatch,
  ImageSwatch,
  SwatchPicker,
  SwatchPickerRow,
} from '@coreai-ds/react-headless-components';
import {
  swatchBlueValue,
  swatchImageValue,
  swatchRedValue,
  SwatchPickerDynamicFlow,
  SwatchPickerFormFlow,
  SwatchPickerGridBoundaryFlow,
  SwatchPickerSelectionFlow,
} from './SwatchPickerFlows.js';
import {
  swatchImage,
  swatchPickerConsumerExample,
  swatchPickerExamples,
} from './SwatchPickerComparison.js';
import { SwatchPickerComparisonWithReport } from './SwatchPickerComparisonReport.js';
import {
  assertSwatchPickerFocus,
  assertSwatchPickerReport,
  focusSwatchPickerStoryItem,
} from './SwatchPickerStoryPlay.js';

const meta = {
  title: 'Experiments/Headless SwatchPicker',
  component: SwatchPicker,
  subcomponents: { ColorSwatch, ImageSwatch, EmptySwatch, SwatchPickerRow },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'All five supported SwatchPicker members use public headless-preview 0.3.2 /swatch-picker hooks, context helpers and renderers. Fluent visuals are ported from installed react-swatch-picker 9.6.3 raw styles. Restored size/shape/spacing remain visual-only and are stripped before behavior hooks. CoreAI only defaults omitted shape to rounded; explicit undefined and defaults opt-out resolve square. The public context carries visual inheritance with current selection. Native focusgroup and a story/test-only consumer polyfill own row navigation; the library has no polyfill, Tabster, deprecated slot registry or legacy grid factory. Row arrows focus, Space/Enter select. Pinned grid/manual tokens do not provide arrow navigation in either tested engine; the grid uses explicit focusMode=tab and includes raw-current/styled boundary probes rather than a wrapper fallback. ColorSwatch restores the current ProhibitedFilled default through its public disabledIcon slot; caller slots, render functions, refs, disabled native buttons, event identity and exact values remain supported. ImageSwatch follows the actual installed visual hook and inherits parent size/shape even when child overrides are passed. EmptySwatch is an author-owned native action with no automatic selection request. Native buttons do not create a radio form field or reset selection; the form example supplies its own hidden field and reset handler. Ordinary unlayered consumer CSS intentionally has priority. Reports compare bounded computed styles and exact relevant slot geometry with fixture-specific readiness/counts.',
      },
    },
  },
} satisfies Meta<typeof SwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <SwatchPickerComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('swatch-report-pointer-rest'));
    for (const [index, example] of swatchPickerExamples.entries()) {
      if (index) {
        await userEvent.selectOptions(
          canvas.getByLabelText('SwatchPicker visual fixture'),
          example.name,
        );
      }
      await assertSwatchPickerReport(canvasElement, example.name, example.layout === 'grid');
    }
  },
};

export const RTLComparison: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <SwatchPickerComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsDisabled: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <SwatchPickerComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <SwatchPickerComparisonWithReport examples={[swatchPickerConsumerExample]} consumer />
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('swatch-report-pointer-rest'));
    await assertSwatchPickerReport(canvasElement, swatchPickerConsumerExample.name, true);
    const root = canvasElement.querySelector('[data-swatch-implementation="headless"]');
    const swatch = root?.querySelector('[data-swatch-part="red"]');
    const icon = root?.querySelector('[data-swatch-slot="icon"]');
    if (!root || !swatch || !icon) throw new Error('Missing consumer SwatchPicker slots');
    await expect(getComputedStyle(root).gap).toBe('9px');
    await expect(getComputedStyle(root).paddingTop).toBe('6px');
    await expect(getComputedStyle(swatch).width).toBe('36px');
    await expect(getComputedStyle(swatch).borderRadius).toBe('3px');
    await expect(getComputedStyle(icon).fontSize).toBe('14px');
  },
};

async function playSelection({ canvas }: Parameters<NonNullable<Story['play']>>[0], grid: boolean) {
  await userEvent.hover(canvas.getByTestId('swatch-flow-pointer-rest'));
  const role = grid ? 'gridcell' : 'radio';
  const red = canvas.getByRole(role, { name: 'Red paint' });
  const blue = canvas.getByRole(role, { name: 'Blue paint' });
  const image = canvas.getByRole(role, { name: 'Mountain texture' });
  const selectedAttribute = grid ? 'aria-selected' : 'aria-checked';
  const events = canvas.getByLabelText('Swatch selection events');
  red.focus();
  await assertSwatchPickerFocus(red);
  if (grid) {
    await userEvent.tab();
    await assertSwatchPickerFocus(blue);
    await userEvent.tab();
    await assertSwatchPickerFocus(image);
  } else {
    await focusSwatchPickerStoryItem(blue, '{ArrowRight}');
  }
  await expect(red).toHaveAttribute(selectedAttribute, 'true');
  await expect(events).toHaveAttribute('data-swatch-change-count', '0');
  await userEvent.keyboard('{Enter}');
  await expect(events).toHaveAttribute('data-swatch-change-count', '1');
  await expect(events).toHaveAttribute(
    'data-swatch-change-value',
    grid ? swatchImageValue : swatchBlueValue,
  );
  await expect(events).toHaveAttribute('data-swatch-change-color', grid ? swatchImage : '#0078d4');
  await expect(events).toHaveAttribute('data-swatch-change-type', 'click');
  await expect(events).toHaveAttribute('data-swatch-event-type', 'click');
  await expect(events).toHaveAttribute('data-swatch-same-event', 'true');
  await userEvent.click(canvas.getByRole(role, { name: 'Unavailable paint' }));
  await userEvent.click(canvas.getByRole(role, { name: 'Unavailable texture' }));
  await expect(events).toHaveAttribute('data-swatch-change-count', '1');
  await userEvent.click(canvas.getByRole('checkbox', { name: 'Reject selection changes' }));
  await userEvent.click(red);
  await expect(events).toHaveAttribute('data-swatch-change-count', '2');
  await expect(events).toHaveAttribute('data-swatch-change-value', swatchRedValue);
  await expect(grid ? image : blue).toHaveAttribute(selectedAttribute, 'true');
  await userEvent.click(canvas.getByRole('checkbox', { name: 'Reject selection changes' }));
  await userEvent.click(image);
  await expect(image).toHaveAttribute(selectedAttribute, 'true');
  await expect(events).toHaveAttribute('data-swatch-change-color', swatchImage);
  await expect(events).toHaveAttribute('data-swatch-event-target', 'image');
}

export const Selection: Story = {
  render: () => <SwatchPickerSelectionFlow />,
  play: (context) => playSelection(context, false),
};

export const GridSelection: Story = {
  render: () => (
    <>
      <SwatchPickerSelectionFlow layout="grid" focusMode="tab" />
      <SwatchPickerGridBoundaryFlow implementation="raw" />
      <SwatchPickerGridBoundaryFlow implementation="headless" />
    </>
  ),
  play: async (context) => {
    await playSelection(context, true);
    for (const implementation of ['raw', 'headless']) {
      const first = context.canvas.getByRole('gridcell', {
        name: `${implementation} arrow A`,
      });
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await assertSwatchPickerFocus(first);
      await expect(
        context.canvas.getByLabelText(`${implementation} arrow-grid events`),
      ).toHaveAttribute('data-swatch-change-count', '0');
      await userEvent.tab();
      const second = context.canvas.getByRole('gridcell', {
        name: `${implementation} arrow B`,
      });
      await assertSwatchPickerFocus(second);
      await userEvent.keyboard('{Enter}');
      await expect(second).toHaveAttribute('aria-selected', 'true');
      await expect(
        context.canvas.getByLabelText(`${implementation} arrow-grid events`),
      ).toHaveAttribute('data-swatch-change-count', '1');
    }
  },
};

export const TabNavigation: Story = {
  render: () => <SwatchPickerSelectionFlow focusMode="tab" />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('swatch-flow-pointer-rest'));
    canvas.getByRole('button', { name: 'Before swatches' }).focus();
    for (const name of ['Red paint', 'Blue paint', 'Mountain texture', 'Green paint']) {
      await userEvent.tab();
      await assertSwatchPickerFocus(canvas.getByRole('radio', { name }));
    }
    await userEvent.tab();
    await assertSwatchPickerFocus(canvas.getByRole('button', { name: 'After swatches' }));
    await expect(canvas.getByLabelText('Swatch selection events')).toHaveAttribute(
      'data-swatch-change-count',
      '0',
    );
  },
};

export const AddAndRemove: Story = {
  render: () => <SwatchPickerDynamicFlow />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('swatch-flow-pointer-rest'));
    await userEvent.click(canvas.getByRole('radio', { name: 'Add purple' }));
    await assertSwatchPickerFocus(canvas.getByRole('radio', { name: 'Added purple' }));
    const events = canvas.getByLabelText('Editable palette events');
    await expect(events).toHaveAttribute('data-swatch-selected', 'custom:purple / 01');
    await expect(events).toHaveAttribute('data-swatch-action-count', '1');
    await expect(events).toHaveAttribute('data-swatch-change-count', '0');
    await userEvent.click(canvas.getByRole('radio', { name: 'Saved red' }));
    await expect(events).toHaveAttribute('data-swatch-change-count', '1');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove custom color' }));
    await assertSwatchPickerFocus(canvas.getByRole('radio', { name: 'Saved red' }));
    await expect(events).toHaveAttribute('data-swatch-selected', swatchRedValue);
    await expect(events).toHaveAttribute('data-swatch-action-count', '2');
    await expect(canvas.queryByRole('radio', { name: 'Added purple' })).toBeNull();
  },
};

export const NativeForm: Story = {
  render: () => <SwatchPickerFormFlow />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('swatch-flow-pointer-rest'));
    await expect(canvas.getByRole('radiogroup', { name: 'Publication palette' })).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: 'Publication blue' }));
    const events = canvas.getByLabelText('Palette form events');
    await expect(events).toHaveAttribute('data-swatch-submit-count', '0');
    await userEvent.click(canvas.getByRole('radio', { name: 'Reserve color slot' }));
    await expect(events).toHaveAttribute(
      'data-swatch-form-data',
      JSON.stringify([
        ['paint', swatchBlueValue],
        ['action', 'reserve-slot'],
      ]),
    );
    await expect(events).toHaveAttribute('data-swatch-submit-count', '1');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset palette' }));
    await expect(events).toHaveAttribute('data-swatch-reset-count', '1');
    await expect(canvas.getByRole('radio', { name: 'Publication red' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Publish palette' }));
    await expect(events).toHaveAttribute(
      'data-swatch-form-data',
      JSON.stringify([
        ['paint', swatchRedValue],
        ['action', 'publish'],
      ]),
    );
    await expect(events).toHaveAttribute('data-swatch-submit-count', '2');
  },
};
