// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  type PopoverSurfaceSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import {
  PopoverAnchorFlow,
  PopoverContextFlow,
  PopoverControlledFlow,
  PopoverNestedFlow,
  popoverAppearances,
  popoverConsumerExample,
  popoverSizes,
} from './PopoverComparison.js';
import { ComparisonWithReport } from './PopoverComparisonReport.js';
import {
  capturePopoverStyles,
  comparePopoverStyles,
  getComparisonPopover,
  getComparisonPopoverTrigger,
  settlePopoverStyles,
} from './comparePopoverStyles.js';
import styles from './PopoverComparison.module.css';

const CustomTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function CustomTrigger(props, ref) {
  return <button {...props} ref={ref} />;
});

type DialogRootProps = Extract<ExtractSlotProps<PopoverSurfaceSlots['root']>, { as?: 'dialog' }>;

const renderCustomSurface: SlotRenderFunction<DialogRootProps> = (Component, props) => (
  <Component {...props} data-custom-surface="">
    {props.children}
    <p className={styles.text}>A current typed root render function preserves the native dialog.</p>
  </Component>
);

function CustomTriggerFlow() {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const surfaceRef = React.useRef<HTMLDialogElement>(null);
  return (
    <div className={styles.anchorStage}>
      <Popover withArrow positioning={{ position: 'below', offset: 10 }}>
        <PopoverTrigger>
          <CustomTrigger ref={triggerRef} type="button" className="caller-trigger">
            Open custom trigger details
          </CustomTrigger>
        </PopoverTrigger>
        <PopoverSurface
          ref={surfaceRef}
          aria-label="Custom trigger details"
          className={`${styles.surface} caller-surface`}
        >
          {renderCustomSurface}
        </PopoverSurface>
      </Popover>
    </div>
  );
}

function NativeTriggersFlow() {
  return (
    <div className={styles.anchorStage}>
      <Popover openOnHover mouseLeaveDelay={80} positioning={{ position: 'below', offset: 10 }}>
        <PopoverTrigger>
          <button type="button">Hover access information</button>
        </PopoverTrigger>
        <PopoverSurface as="div" aria-label="Hover access information">
          Hover the trigger or this surface to keep it open.
        </PopoverSurface>
      </Popover>
      <PopoverContextFlow />
      <button type="button">Outside trigger areas</button>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Popover',
  component: Popover,
  subcomponents: { PopoverTrigger, PopoverSurface },
  args: {
    children: <PopoverSurface aria-label="Popover content">Project information.</PopoverSurface>,
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private native-overlay migration using public react-headless-components-preview 0.3.2 hooks/renderers and react-popover 9.14.10 visual sources. The pinned facade uses trapFocus (not the newer online inertTrapFocus name). Default dialog surfaces use showPopover(), popover="auto", browser light dismiss and the top layer; trapFocus uses showModal() and native inertness/focus restoration, not Tabster. as="div" is supported only without trapFocus. Surface DOM remains under its theme provider; there is no Portal, mountNode, legacy inline/z-index mode, motion slot, or JS positioning fallback. CSS anchors own placement/flipping. Native overlay/anchor polyfills are consumer-owned on older browsers; Popover needs no focusgroup polyfill. The pinned facade exports usePopoverContext/usePopoverContextValues and related types, but no public PopoverProvider; no internal provider is re-created. appearance and size are visual-only context values. There are no CoreAI prop defaults; only the real defaults-gated floating-surface/beak border is restored. Explicitly undefined size keeps the legacy unpadded state. withArrow uses the public data-arrow element, not a replaceable arrow slot; its offset is caller-owned. Centered pointers use the surface center. The nested arrow cannot resolve the external trigger anchor, so edge-aligned pointers use --fui-PopoverSurface--arrow-padding (8px by default), not legacy measured trigger-center coordinates. Current openOnContext anchors to the trigger rather than following pointer coordinates. It also waits for pointerup after contextmenu; Windows Chromium emits those in the opposite order and therefore needs another pointerup. The context example uses the documented controlled/without-PopoverTrigger pattern with a native onContextMenu handler instead. This does not patch or normalize primitive behavior. Non-modal div surfaces do not get an invented autofocus/focus trap; use native autofocus deliberately when needed. Story plays exercise native methods and React callbacks; trusted Escape/outside-click/focus/top-layer coverage belongs to the Chromium suite and acceptance replay.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: popoverAppearances },
    size: { control: 'select', options: popoverSizes },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(async () => {
      const report = canvas.getByRole('status', { name: 'Popover style report' });
      await expect(report).toHaveAttribute('data-popover-report-example', 'Default surface');
      await expect(report).toHaveAttribute('data-popover-report-state', 'ready');
      await expect(report).toHaveAttribute('data-popover-unexpected-count', '0');
      await expect(report).toHaveTextContent(
        'No unexpected differences in the selected properties.',
      );
    });
    await userEvent.selectOptions(
      canvas.getByLabelText('Popover visual fixture'),
      'Inverted arrow above',
    );
    await waitFor(async () => {
      const report = canvas.getByRole('status', { name: 'Popover style report' });
      await expect(canvas.getByLabelText('Popover visual fixture')).toHaveValue(
        'Inverted arrow above',
      );
      await expect(report).toHaveAttribute('data-popover-report-example', 'Inverted arrow above');
      await expect(report).toHaveAttribute('data-popover-report-state', 'ready');
      await expect(report).toHaveAttribute('data-popover-unexpected-count', '0');
      await expect(report).toHaveTextContent(
        'No unexpected differences in the selected properties.',
      );
    });
    await expect(canvas.getByRole('status', { name: 'Popover style report' })).toHaveTextContent(
      'native-arrow-gap',
    );
    const currentDifferences = comparePopoverStyles(
      capturePopoverStyles(
        getComparisonPopover(canvasElement, 'legacy'),
        getComparisonPopoverTrigger(canvasElement, 'legacy'),
      ),
      capturePopoverStyles(
        getComparisonPopover(canvasElement, 'headless'),
        getComparisonPopoverTrigger(canvasElement, 'headless'),
      ),
      8,
    );
    await expect(
      currentDifferences.filter((difference) => difference.kind === 'unexpected'),
    ).toEqual([]);
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <ComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[popoverConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('status', { name: 'Popover style report' })).toHaveTextContent(
        'Intentional consumer cascade example.',
      );
    });
    const surface = getComparisonPopover(canvasElement, 'headless');
    await expect(getComputedStyle(surface).paddingTop).toBe('9px');
    await expect(getComputedStyle(surface).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(surface).borderTopStyle).toBe('dashed');
  },
};

export const ControlledAndNativeDismiss: Story = {
  render: () => <PopoverControlledFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open access details' });
    await userEvent.click(trigger);
    const surface = canvas.getByRole('group', { name: 'Atlas access details' });
    await expect(surface).toBeVisible();
    await expect(surface.matches(':popover-open')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-details', surface.id);
    await userEvent.click(canvas.getByRole('button', { name: 'Close access details' }));
    await waitFor(async () => {
      await expect(canvas.getByRole('status', { name: 'Access details state' })).toHaveTextContent(
        'Closed',
      );
      await expect(canvas.queryByRole('group', { name: 'Atlas access details' })).toBeNull();
    });
    await userEvent.click(trigger);
    canvas.getByRole('group', { name: 'Atlas access details' }).hidePopover();
    await waitFor(async () => {
      await expect(canvas.getByRole('status', { name: 'Access details events' })).toHaveTextContent(
        'toggle:closed',
      );
    });
  },
};

export const NativeModalFocus: Story = {
  render: () => <PopoverControlledFlow trapFocus />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open modal access details' });
    await userEvent.click(trigger);
    const surface = canvas.getByRole('dialog', { name: 'Atlas access details' });
    await expect(surface.matches(':modal')).toBe(true);
    await expect(surface).not.toHaveAttribute('popover');
    await expect(canvas.getByRole('button', { name: 'Review editors' })).toHaveFocus();
    await expect(getComputedStyle(surface, '::backdrop').backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await userEvent.click(canvas.getByRole('button', { name: 'Close access details' }));
    await waitFor(async () => {
      await expect(canvas.queryByRole('dialog', { name: 'Atlas access details' })).toBeNull();
      await expect(trigger).toHaveFocus();
    });
  },
};

export const NestedTopLayer: Story = {
  render: () => <PopoverNestedFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open project permissions' }));
    const outer = canvas.getByRole('group', { name: 'Project permissions' });
    await userEvent.click(canvas.getByRole('button', { name: 'Open editor permissions' }));
    const inner = canvas.getByRole('group', { name: 'Editor permissions' });
    await expect(outer.matches(':popover-open')).toBe(true);
    await expect(inner.matches(':popover-open')).toBe(true);
    await expect(outer.contains(inner)).toBe(true);
    inner.hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Editor permissions' })).toBeNull();
    });
    await expect(outer.matches(':popover-open')).toBe(true);
    outer.hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Project permissions' })).toBeNull();
    });
  },
};

export const CustomTriggerAndRoot: Story = {
  render: () => <CustomTriggerFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open custom trigger details' });
    await userEvent.click(trigger);
    const surface = canvas.getByRole('group', { name: 'Custom trigger details' });
    await expect(surface.tagName).toBe('DIALOG');
    await expect(surface).toHaveAttribute('data-custom-surface', '');
    await expect(surface).toHaveClass('caller-surface', 'fui-PopoverSurface');
    await expect(trigger).toHaveClass('caller-trigger');
    await expect(surface.querySelector(':scope > [data-arrow]')).not.toBeNull();
  },
};

export const HoverAndContext: Story = {
  render: () => <NativeTriggersFlow />,
  play: async ({ canvas }) => {
    const hoverTrigger = canvas.getByRole('button', { name: 'Hover access information' });
    await userEvent.hover(hoverTrigger);
    await expect(canvas.getByRole('group', { name: 'Hover access information' })).toBeVisible();
    await userEvent.unhover(hoverTrigger);
    await userEvent.hover(canvas.getByRole('button', { name: 'Outside trigger areas' }));
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Hover access information' })).toBeNull();
    });
    await userEvent.pointer({
      keys: '[MouseRight]',
      target: canvas.getByRole('button', { name: 'Right-click project actions' }),
    });
    const surface = canvas.getByRole('group', { name: 'Project context actions' });
    await expect(surface).toBeVisible();
    surface.hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('group', { name: 'Project context actions' })).toBeNull();
    });
  },
};

export const CustomAnchor: Story = {
  render: () => <PopoverAnchorFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle custom anchor' }));
    const surface = canvas.getByRole('group', { name: 'Custom anchored information' });
    const anchor = canvas.getByRole('button', { name: 'Atlas anchor' });
    await settlePopoverStyles(surface);
    await expect(surface.getBoundingClientRect().width).toBe(anchor.getBoundingClientRect().width);
    await expect(surface.getBoundingClientRect().top - anchor.getBoundingClientRect().bottom).toBe(
      10,
    );
    await expect(surface.style.getPropertyValue('width')).toBe('anchor-size(width)');
  },
};
