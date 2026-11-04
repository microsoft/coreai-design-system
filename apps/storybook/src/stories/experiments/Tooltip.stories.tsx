// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
  type TooltipSlots,
} from '@coreai-ds/react-headless-components';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { TooltipHelpFlow, tooltipConsumerExample } from './TooltipComparison.js';
import { TooltipComparisonReport } from './TooltipComparisonReport.js';
import {
  captureTooltipStyles,
  compareTooltipStyles,
  getComparisonTooltip,
  getComparisonTooltipTrigger,
} from './compareTooltipStyles.js';

async function assertReport(canvasElement: HTMLElement, example: string) {
  const canvas = within(canvasElement);
  await waitFor(async () => {
    const report = canvas.getByRole('status', { name: 'Tooltip style report' });
    await expect(report).toHaveAttribute('data-tooltip-report-state', 'ready');
    await expect(report).toHaveAttribute('data-tooltip-report-example', example);
    await expect(report).toHaveAttribute('data-tooltip-unexpected-count', '0');
    await expect(report).toHaveAttribute('data-tooltip-fixture-count', '2');
    await expect(Number(report.getAttribute('data-tooltip-property-count'))).toBeGreaterThan(30);
    const content = getComparisonTooltip(canvasElement, 'headless');
    await expect(content.matches(':popover-open')).toBe(true);
    await expect(Number(report.getAttribute('data-tooltip-content-width'))).toBe(
      content.getBoundingClientRect().width,
    );
    await expect(Number(report.getAttribute('data-tooltip-content-height'))).toBe(
      content.getBoundingClientRect().height,
    );
    await expect(content.getBoundingClientRect().width).toBeGreaterThan(0);
    await expect(content.getBoundingClientRect().height).toBeGreaterThan(0);
  });
}

async function prepareReport(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const rest = canvas.getByTestId('tooltip-report-pointer-rest');
  rest.scrollIntoView({ block: 'start' });
  await userEvent.click(canvas.getByRole('button', { name: 'Refresh Tooltip report' }));
  await userEvent.hover(rest);
}

const CustomTrigger: ForwardRefComponent<React.ComponentPropsWithRef<'button'>> = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(function CustomTrigger(props, ref) {
  return <button {...props} ref={ref} />;
});

const renderContent: SlotRenderFunction<ExtractSlotProps<TooltipSlots['content']>> = (
  Component,
  props,
) => (
  <Component {...props} data-caller-tooltip-renderer="">
    {props.children}
    <strong>Review everyone who can edit Atlas.</strong>
  </Component>
);

function TooltipSlotsFlow() {
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  return (
    <div>
      <Popover>
        <PopoverTrigger>
          <Tooltip
            relationship="description"
            content={{
              children: renderContent,
              ref: setContent,
              'aria-label': 'Project reviewer guidance',
              className: 'caller-tooltip',
            }}
            withArrow
            showDelay={0}
            hideDelay={0}
            positioning={{ position: 'below', offset: 12 }}
          >
            <CustomTrigger ref={setTrigger} type="button" data-custom-tooltip-trigger="">
              Project reviewers
            </CustomTrigger>
          </Tooltip>
        </PopoverTrigger>
        <PopoverSurface aria-label="Project reviewers">
          Ada Lovelace and Grace Hopper can edit Atlas.
        </PopoverSurface>
      </Popover>
      <output aria-label="Tooltip slot refs">
        {`trigger=${trigger?.tagName.toLowerCase() ?? 'none'}; content=${content?.tagName.toLowerCase() ?? 'none'}`}
      </output>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Tooltip',
  component: Tooltip,
  args: {
    content: 'Review who can edit Atlas.',
    relationship: 'description',
    children: <button type="button">Project access</button>,
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private migration using the installed public react-headless-components-preview 0.3.2 Tooltip hook/renderer and react-tooltip 9.10.8 visual source. appearance (normal/inverted) is the only restored visual prop and is stripped before the hook. Tooltip has no root slot or forwarded root ref: trigger refs remain on the child and content refs remain on the native div slot. The public component static metadata is preserved for nested Fluent trigger composition without authoring a private trigger flag. Tooltip and AvatarGroupPopover share one resolved-content visual adapter and CSS foundation, composing the completed PopoverSurface arrow/native surface rules. The only CoreAI bridge is the actual defaults-gated surface/arrow border; ordinary first-child div content does not receive the old Overlay beak selector. Native popover="hint" and CSS anchors own hiding, placement, Escape and light dismissal. Consumers provide Popover/anchor polyfills where those browser capabilities are absent; Tooltip uses no focusgroup. No Portal, mountNode, legacy visibility manager, Tabster behavior, JS arrow positioner or removed variants are recreated. Native default offset is zero rather than the old 4px and withArrow adds no positioning gap. Centered arrows use the surface center; edge-aligned arrows share the completed Popover corner-padding boundary. Current controlled visible=true can remain natively dismissed until the owner changes visible; the example accepts onVisibleChange requests instead of adding a synchronization shim. Current native toggle dismissal supplies event=undefined and no documentKeyboardEvent. Ordinary and direct public trigger-render callback content are supported; the inherited nested InfoButton/AvatarGroup render-function Fragment guards are not patched. Use a genuinely disabledFocusable control if keyboard users need its hint, not a tabindex shim on a disabled native control. Vitest/trusted browser follow-ups cover focus, Escape and native light dismissal; synthetic story plays use native hidePopover() for native-only dismissal.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: ['normal', 'inverted'] },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TooltipComparisonReport />,
  play: async ({ canvas, canvasElement }) => {
    await prepareReport(canvasElement);
    await assertReport(canvasElement, 'Default description');
    await userEvent.selectOptions(
      canvas.getByLabelText('Tooltip visual fixture'),
      'Inverted arrow above',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh Tooltip report' }));
    await userEvent.hover(canvas.getByTestId('tooltip-report-pointer-rest'));
    await assertReport(canvasElement, 'Inverted arrow above');
    const report = canvas.getByRole('status', { name: 'Tooltip style report' });
    await expect(report).toHaveTextContent('native-gap');
    await expect(report).toHaveTextContent('native-arrow-centering');
  },
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TooltipComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: async (context) => {
    await Comparison.play?.(context);
    const content = getComparisonTooltip(context.canvasElement, 'headless');
    await expect(content).not.toHaveAttribute('data-coreai-defaults');
    await expect(getComputedStyle(content).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TooltipComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: async (context) => {
    await Comparison.play?.(context);
    await expect(
      getComputedStyle(getComparisonTooltip(context.canvasElement, 'headless')).direction,
    ).toBe('rtl');
  },
};

export const ConsumerOverrides: Story = {
  render: () => <TooltipComparisonReport examples={[tooltipConsumerExample]} />,
  play: async ({ canvasElement }) => {
    await prepareReport(canvasElement);
    await assertReport(canvasElement, tooltipConsumerExample.name);
    const legacy = getComparisonTooltip(canvasElement, 'legacy');
    const headless = getComparisonTooltip(canvasElement, 'headless');
    const values = captureTooltipStyles(
      headless,
      getComparisonTooltipTrigger(canvasElement, 'headless'),
    );
    const differences = compareTooltipStyles(
      captureTooltipStyles(legacy, getComparisonTooltipTrigger(canvasElement, 'legacy')),
      values,
      tooltipConsumerExample,
    );
    await expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
    await expect(differences.some((difference) => difference.kind === 'consumer-cascade')).toBe(
      true,
    );
    await expect(values['content.padding-top']).toBe('9px');
    await expect(values['content.border-top-width']).toBe('3px');
    await expect(values['content.rect.width']).toBe('192');
    await expect(values['arrow::before.border-top-style']).toBe('dashed');
  },
};

export const HoverAndControlledVisibility: Story = {
  render: () => <TooltipHelpFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Access policy' });
    await userEvent.hover(trigger);
    await waitFor(async () => {
      await expect(canvas.getByRole('tooltip', { name: 'Project access guidance' })).toBeVisible();
      await expect(
        canvas.getByRole('status', { name: 'Tooltip visibility events' }),
      ).toHaveTextContent('pointerenter:true');
    });
    await userEvent.unhover(trigger);
    await waitFor(async () => {
      await expect(canvas.queryByRole('tooltip', { name: 'Project access guidance' })).toBeNull();
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Show access hint' }));
    const content = await canvas.findByRole('tooltip', { name: 'Project access guidance' });
    if (!(content instanceof HTMLDivElement)) throw new Error('Expected native Tooltip content');
    content.hidePopover();
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Tooltip visibility events' }),
      ).toHaveTextContent('native-toggle:false');
      await expect(canvas.queryByRole('tooltip', { name: 'Project access guidance' })).toBeNull();
    });
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Allow access hints' }));
    await userEvent.hover(trigger);
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Tooltip visibility events' }),
      ).toHaveTextContent('pointerenter:true');
      await expect(canvas.queryByRole('tooltip', { name: 'Project access guidance' })).toBeNull();
    });
    await userEvent.unhover(trigger);
  },
};

export const SlotsAndComposition: Story = {
  render: () => <TooltipSlotsFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Project reviewers' });
    await expect(canvas.getByRole('status', { name: 'Tooltip slot refs' })).toHaveTextContent(
      'trigger=button; content=div',
    );
    await userEvent.hover(trigger);
    const content = await canvas.findByRole('tooltip', { name: 'Project reviewer guidance' });
    await expect(content).toHaveClass('fui-Tooltip__content', 'caller-tooltip');
    await expect(content).toHaveAttribute('data-caller-tooltip-renderer', '');
    await expect(content.querySelector(':scope > [data-arrow]')).not.toBeNull();
    await userEvent.click(trigger);
    const surface = await canvas.findByRole('group', { name: 'Project reviewers' });
    await expect(surface).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Project reviewers' })).toBe(trigger);
    await expect(canvas.queryByRole('tooltip', { name: 'Project reviewer guidance' })).toBeNull();
    if (!(surface instanceof HTMLDialogElement)) throw new Error('Expected native Popover surface');
    surface.hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Project reviewers' })).toBeNull();
      await expect(canvas.getByRole('button', { name: 'Project reviewers' })).toBe(trigger);
    });
  },
};
