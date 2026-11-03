// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  InlineDrawer,
  OverlayDrawer,
} from '@coreai-ds/react-headless-components';
import {
  DrawerFormFlow,
  DrawerNestedFlow,
  InlineDrawerFlow,
  OverlayDrawerFlow,
  drawerConsumerExample,
} from './DrawerComparison.js';
import { DrawerComparisonWithReport } from './DrawerComparisonReport.js';
import { DRAWER_COMPARISON_PROPERTY_COUNT } from './compareDrawerStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Drawer',
  component: OverlayDrawer,
  subcomponents: {
    Drawer,
    InlineDrawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerHeaderNavigation,
  },
  args: { children: <DrawerBody>Supplementary project information.</DrawerBody> },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Native Drawer migration using the installed public headless 0.3.2 hook/render/context facade and react-drawer 9.13.5 visual sources. The current Drawer convenience wrapper selects the completed InlineDrawer/OverlayDrawer implementations without reading deprecated state.components. The actual public DrawerProvider/useDrawerContext/useDrawerContextValue remain available. There are no CoreAI Drawer defaults or visual overrides; defaults opt-out changes nothing. Size (small 320, medium 592, large 940, full viewport) and inline separator are visual-only and stripped before the hook. Current start/end are logical positions; bottom sizes the block axis and clamps to the viewport. OverlayDrawer is controlled-only: no defaultOpen, appearance, orientation, obsolete aliases, backdrop slots, mountNode, motion slots, legacy portals or focus manager are added. Its actual legacy surface delegates only backdrop styles, not DialogSurface visual styles; DrawerHeaderTitle does delegate DialogTitle typography, reused through the completed CSS foundation on its real native heading slot. Heading/action/root render functions retain the current slot metadata and refs. Modal/alert uses native showModal(), top-layer inertness, focus trapping and restoration; non-modal uses popover="manual"/showPopover(), with dialog.show() fallback. Outside click dismisses modal only; current Escape closes all types unless prevented. The current native cancel handler leaves React in control. Kept-mounted native surfaces remain UA-hidden when closed; kept-mounted inline surfaces collapse their layout axis, become visibility-hidden, and preserve local form state. Header/footer separators follow the public Drawer scroll context. Native controlled submission preserves the real SubmitEvent and submitter. Nested Popover Escape stops propagation at its consumer surface without blocking the browser default; no Drawer fallback is introduced. Platform polyfills are consumer-owned; Drawer needs neither focusgroup nor CSS-anchor polyfills. Trusted Chromium tests cover native keyboard/cancel/backdrop/focus behavior in addition to the synthetic Storybook plays.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    position: { control: 'select', options: ['start', 'end', 'bottom'] },
    size: { control: 'select', options: ['small', 'medium', 'large', 'full'] },
    modalType: { control: 'select', options: ['modal', 'non-modal', 'alert'] },
    unmountOnClose: { control: 'boolean' },
  },
} satisfies Meta<typeof OverlayDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <DrawerComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    const report = canvas.getByRole('status', { name: 'Drawer style report' });
    const ready = async (name: string) => {
      await waitFor(async () => {
        await expect(report).toHaveAttribute('data-drawer-report-state', 'ready');
        await expect(report).toHaveAttribute('data-drawer-report-phase', 'idle');
        await expect(report).toHaveAttribute('data-drawer-report-example', name);
        await expect(report).toHaveAttribute('data-drawer-unexpected-count', '0');
        await expect(report).toHaveAttribute(
          'data-drawer-comparison-count',
          String(DRAWER_COMPARISON_PROPERTY_COUNT),
        );
      });
      await expect(report.getBoundingClientRect().height).toBe(384);
      await expect(canvasElement.querySelector('dialog[open], dialog:popover-open')).toBeNull();
    };
    await ready('Overlay start small');
    await userEvent.hover(canvas.getByTestId('drawer-report-pointer-rest'));
    for (const name of [
      'With navigation',
      'Overlay bottom medium',
      'Inline end separator',
      'Scrollable overlay',
      'Overlay start small',
    ]) {
      await userEvent.selectOptions(canvas.getByLabelText('Drawer visual fixture'), name);
      await ready(name);
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect native drawer' }));
    const native = canvas.getByRole('dialog', { name: 'Project access' });
    await expect(native instanceof HTMLDialogElement && native.matches(':modal')).toBe(true);
    const viewport = native.ownerDocument.documentElement.getBoundingClientRect().width;
    await expect(native.getBoundingClientRect().width).toBe(Math.min(320, viewport));
    await expect(native.getBoundingClientRect().height).toBe(window.innerHeight);
    const rect = native.getBoundingClientRect();
    await expect(getComputedStyle(native).direction === 'rtl' ? rect.right : rect.left).toBe(
      getComputedStyle(native).direction === 'rtl' ? viewport : 0,
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await ready('Overlay start small');
    await expect(canvas.getByRole('button', { name: 'Inspect native drawer' })).toHaveFocus();
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <DrawerComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <DrawerComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <DrawerComparisonWithReport examples={[drawerConsumerExample]} />,
  play: async ({ canvas }) => {
    const report = canvas.getByRole('status', { name: 'Drawer style report' });
    await waitFor(async () => {
      await expect(report).toHaveAttribute('data-drawer-report-state', 'ready');
      await expect(report).toHaveAttribute('data-drawer-report-phase', 'idle');
      await expect(report).toHaveAttribute(
        'data-drawer-comparison-count',
        String(DRAWER_COMPARISON_PROPERTY_COUNT),
      );
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect native drawer' }));
    const surface = canvas.getByRole('dialog', { name: 'Project access' });
    await expect(surface.getBoundingClientRect().width).toBe(280);
    await expect(getComputedStyle(surface).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(surface).borderRadius).toBe('3px');
    await expect(
      getComputedStyle(canvas.getByRole('heading', { name: 'Project access' })).fontSize,
    ).toBe('22px');
    await expect(
      getComputedStyle(canvas.getByRole('navigation', { name: 'Project navigation' })).marginTop,
    ).toBe('0px');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.queryByRole('dialog', { name: 'Project access' })).toBeNull();
    await expect(report.getBoundingClientRect().height).toBe(384);
  },
};

export const Modal: Story = {
  render: () => <OverlayDrawerFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open project drawer' });
    await userEvent.hover(canvas.getByTestId('drawer-pointer-rest'));
    await userEvent.click(trigger);
    const surface = canvas.getByRole('dialog', { name: 'Project drawer' });
    await expect(surface instanceof HTMLDialogElement && surface.matches(':modal')).toBe(true);
    await expect(canvas.getByRole('button', { name: 'Close drawer' })).toHaveFocus();
    canvas.getByRole('button', { name: 'Outside drawer action' }).focus();
    await expect(canvas.getByRole('button', { name: 'Close drawer' })).toHaveFocus();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Drawer note' }), 'Native state');
    await expect(canvas.getByRole('textbox', { name: 'Drawer note' })).toHaveValue('Native state');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Prevent dismissal' }));
    await userEvent.keyboard('{Escape}');
    await expect(surface).toBeVisible();
    await expect(canvas.getByLabelText('Drawer changes')).toHaveTextContent(
      'escapeKeyDown:false:keydown',
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Prevent dismissal' }));
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Project drawer' })).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

export const NonModal: Story = {
  render: () => <OverlayDrawerFlow modalType="non-modal" keepMounted position="end" />,
  play: async ({ canvas, canvasElement }) => {
    const closed = canvasElement.querySelector('dialog');
    await expect(closed instanceof HTMLDialogElement).toBe(true);
    if (!(closed instanceof HTMLDialogElement)) throw new Error('Missing kept native drawer');
    await expect(getComputedStyle(closed).display).toBe('none');
    await userEvent.click(canvas.getByRole('button', { name: 'Open project drawer' }));
    const surface = canvas.getByRole('dialog', { name: 'Project drawer' });
    await expect(surface.matches(':popover-open')).toBe(true);
    await expect(surface.matches(':modal')).toBe(false);
    const outside = canvas.getByRole('button', { name: 'Outside drawer action' });
    const outsideRect = outside.getBoundingClientRect();
    await expect(
      outside.ownerDocument.elementFromPoint(
        outsideRect.left + outsideRect.width / 2,
        outsideRect.top + outsideRect.height / 2,
      ),
    ).toBe(outside);
    await userEvent.click(outside);
    await expect(surface).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Outside drawer action' })).toHaveFocus();
    surface.focus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Project drawer' })).toBeNull();
    await expect(closed.isConnected).toBe(true);
    await expect(closed.matches(':popover-open')).toBe(false);
    await expect(getComputedStyle(closed).display).toBe('none');
  },
};

export const Alert: Story = {
  render: () => <OverlayDrawerFlow modalType="alert" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open project drawer' }));
    const surface = canvas.getByRole('alertdialog', { name: 'Project drawer' });
    await expect(surface instanceof HTMLDialogElement && surface.matches(':modal')).toBe(true);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Prevent dismissal' }));
    await userEvent.keyboard('{Escape}');
    await expect(surface).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Close drawer' }));
    await expect(canvas.queryByRole('alertdialog', { name: 'Project drawer' })).toBeNull();
  },
};

export const InlineNavigation: Story = {
  render: () => <InlineDrawerFlow />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show navigation' }));
    const drawer = canvas.getByRole('complementary', { name: 'Projects' });
    await expect(drawer.tagName).toBe('ASIDE');
    await expect(getComputedStyle(drawer).position).toBe('relative');
    await userEvent.click(canvas.getByRole('link', { name: 'Activity' }));
    await expect(canvas.getByRole('link', { name: 'Activity' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('heading', { name: 'Activity page' })).toBeVisible();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Filter projects' }), 'Atlas');
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh main content' }));
    await expect(canvas.getByLabelText('Refresh count')).toHaveTextContent('1');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide navigation' }));
    await expect(canvas.queryByRole('complementary', { name: 'Projects' })).toBeNull();
    await expect(drawer.isConnected).toBe(true);
    await expect(getComputedStyle(drawer).visibility).toBe('hidden');
    await expect(drawer.getBoundingClientRect().width).toBe(0);
    await expect(canvasElement.querySelector('dialog')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Show navigation' }));
    await expect(canvas.getByRole('textbox', { name: 'Filter projects' })).toHaveValue('Atlas');
  },
};

export const NativeForm: Story = {
  render: () => <DrawerFormFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open sharing form' });
    await userEvent.click(trigger);
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Project name' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Share project' }));
    await expect(canvas.getByRole('dialog', { name: 'Share project' })).toBeVisible();
    await expect(canvas.getByLabelText('Drawer form result')).toBeEmptyDOMElement();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Project name' }), 'Atlas');
    await userEvent.click(canvas.getByRole('button', { name: 'Share project' }));
    await expect(canvas.getByLabelText('Drawer form result')).toHaveTextContent(
      'Atlas|share|SubmitEvent',
    );
    await expect(canvas.queryByRole('dialog', { name: 'Share project' })).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

export const NestedTopLayer: Story = {
  render: () => <DrawerNestedFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open nested drawer' });
    await userEvent.click(trigger);
    const drawer = canvas.getByRole('dialog', { name: 'Nested drawer' });
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer help' }));
    const help = canvas.getByRole('group', { name: 'Drawer help' });
    await expect(help.matches(':popover-open')).toBe(true);
    await expect(drawer.matches(':modal')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Close drawer help' }));
    await expect(canvas.queryByRole('group', { name: 'Drawer help' })).toBeNull();
    const confirmationTrigger = canvas.getByRole('button', { name: 'Open drawer confirmation' });
    await userEvent.click(confirmationTrigger);
    const confirmation = canvas.getByRole('dialog', { name: 'Drawer confirmation' });
    await expect(confirmation.matches(':modal')).toBe(true);
    await expect(drawer.matches(':modal')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Close drawer confirmation' }));
    await expect(canvas.queryByRole('dialog', { name: 'Drawer confirmation' })).toBeNull();
    await expect(confirmationTrigger).toHaveFocus();
    await expect(drawer).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Close nested drawer' }));
    await expect(canvas.queryByRole('dialog', { name: 'Nested drawer' })).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};
