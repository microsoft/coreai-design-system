// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from '@coreai-ds/react-headless-components';
import {
  DialogConfirmationFlow,
  DialogControlledFlow,
  DialogFormFlow,
  DialogNestedFlow,
  dialogConsumerExample,
} from './DialogComparison.js';
import { DialogComparisonWithReport } from './DialogComparisonReport.js';

const meta = {
  title: 'Experiments/Headless Dialog',
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogSurface,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogActions,
  },
  args: {
    children: (
      <DialogSurface aria-label="Project dialog">
        <DialogBody>Project information.</DialogBody>
      </DialogSurface>
    ),
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Native Dialog migration using the installed public headless 0.3.2 hook/render/context/trigger facade and react-dialog 9.18.6 visual sources. The supported structure is Surface > Header/Title, Body (scrollable content), Actions. This facade has no DialogContent, Title.action, backdrop DOM/slot, mountNode, motion slots, or public DialogProvider/SurfaceProvider; none is invented. Compose an explicit completed Button + DialogTrigger in Header for a close action. There are no size/fullscreen props or CoreAI Dialog prop defaults. The real defaults-gated CoreAI surface border, 16px spacing, content padding and divider are adapted to the native grid. Actions position/fluid are visual-only and stripped before the hook. Modal/alert uses showModal(), native top-layer inertness and focus restoration; non-modal uses popover="manual"/showPopover() with dialog.show() fallback. Outside click does not dismiss non-modal or alert; current Escape closes all types unless prevented. The current native cancel handler leaves React in control. Keep-mounted closed surfaces remain UA-hidden; no unconditional author display exposes them. Inline theme inheritance replaces Portal cloning. Native focus restoration is immediate and default legacy animations are intentionally absent; consumers may use ordinary reduced-motion-aware CSS. Native form submissions use a real SubmitEvent and submitter; the controlled example prevents navigation and closes in its successful onSubmit. A bare method="dialog" form can close the element without changing the public hook state, so use the controlled onSubmit pattern when application state must track closure. Use explicit aria-describedby for short descriptions and omit it for complex forms; the current facade generates title IDs, not content IDs. The nested Popover example stops Escape propagation at its surface while retaining the browser default action, so the parent Dialog does not receive that same key; this is a consumer handler, not a component shim. Older-browser platform polyfills are consumer-owned; Dialog itself needs neither focusgroup nor CSS-anchor polyfills. Trusted Chromium tests cover Tab trapping, native Escape/backdrop/cancel, nested top-layer behavior and restoration, beyond synthetic Storybook keyboard events.',
      },
    },
  },
  argTypes: {
    modalType: { control: 'select', options: ['modal', 'non-modal', 'alert'] },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    unmountOnClose: { control: 'boolean' },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <DialogComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    const report = canvas.getByRole('status', { name: 'Dialog style report' });
    await waitFor(async () => {
      await expect(report).toHaveAttribute('data-dialog-report-state', 'ready');
      await expect(report).toHaveAttribute('data-dialog-report-phase', 'idle');
      await expect(report).toHaveAttribute('data-dialog-report-example', 'Modal');
      await expect(report).toHaveAttribute('data-dialog-unexpected-count', '0');
    });
    const reportHeight = report.getBoundingClientRect().height;
    await expect(reportHeight).toBe(448);
    await expect(canvasElement.querySelector('dialog[open], dialog:popover-open')).toBeNull();
    await userEvent.hover(canvas.getByTestId('dialog-report-pointer-rest'));
    for (const name of ['Start actions', 'Scrollable content', 'Explicit header close']) {
      await userEvent.selectOptions(canvas.getByLabelText('Dialog visual fixture'), name);
      await waitFor(async () => {
        await expect(report).toHaveAttribute('data-dialog-report-state', 'ready');
        await expect(report).toHaveAttribute('data-dialog-report-phase', 'idle');
        await expect(report).toHaveAttribute('data-dialog-report-example', name);
        await expect(report).toHaveAttribute('data-dialog-unexpected-count', '0');
      });
      await expect(report.getBoundingClientRect().height).toBe(reportHeight);
      await expect(canvasElement.querySelector('dialog[open], dialog:popover-open')).toBeNull();
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect native dialog' }));
    const native = canvas.getByRole('dialog', { name: 'Project access' });
    await expect(native instanceof HTMLDialogElement && native.matches(':modal')).toBe(true);
    await expect(native.getBoundingClientRect().width).toBe(
      Math.min(600, native.ownerDocument.documentElement.clientWidth),
    );
    await expect(native.getBoundingClientRect().height).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Close header' }));
    await waitFor(async () => {
      await expect(canvas.queryByRole('dialog', { name: 'Project access' })).toBeNull();
      await expect(report).toHaveAttribute('data-dialog-report-phase', 'idle');
      await expect(report).toHaveAttribute('data-dialog-unexpected-count', '0');
    });
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <DialogComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <DialogComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <DialogComparisonWithReport examples={[dialogConsumerExample]} consumer />,
  play: async ({ canvas }) => {
    const report = canvas.getByRole('status', { name: 'Dialog style report' });
    await waitFor(async () => {
      await expect(report).toHaveAttribute('data-dialog-report-state', 'ready');
      await expect(report).toHaveAttribute('data-dialog-report-phase', 'idle');
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect native dialog' }));
    const surface = canvas.getByRole('dialog', { name: 'Project access' });
    await expect(getComputedStyle(surface).paddingTop).toBe('18px');
    await expect(getComputedStyle(surface).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(surface).borderRadius).toBe('3px');
    await expect(
      getComputedStyle(canvas.getByRole('heading', { name: 'Project access' })).fontSize,
    ).toBe('22px');
    await expect(surface.getBoundingClientRect().width).toBe(
      Math.min(600, surface.ownerDocument.documentElement.clientWidth),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.queryByRole('dialog', { name: 'Project access' })).toBeNull();
  },
};

export const Modal: Story = {
  render: () => <DialogControlledFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open project dialog' });
    await userEvent.hover(canvas.getByTestId('dialog-pointer-rest'));
    await userEvent.click(trigger);
    const surface = canvas.getByRole('dialog', { name: 'Project settings' });
    await expect(surface instanceof HTMLDialogElement && surface.open).toBe(true);
    await expect(surface.matches(':modal')).toBe(true);
    await expect(surface).toHaveAttribute('aria-modal', 'true');
    await expect(surface).toHaveAccessibleDescription('Update the project note before saving.');
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Project note' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Project note' }), 'Ready to share');
    await userEvent.click(canvas.getByRole('button', { name: 'Close project dialog' }));
    await expect(surface).not.toBeVisible();
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole('status', { name: 'Dialog event log' })).toHaveTextContent(
      'triggerClick:true|triggerClick:false',
    );
  },
};

export const NonModal: Story = {
  render: () => <DialogControlledFlow modalType="non-modal" />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open project dialog' });
    await userEvent.click(trigger);
    const surface = canvas.getByRole('dialog', { name: 'Project settings' });
    await expect(surface.matches(':popover-open')).toBe(true);
    await expect(surface.matches(':modal')).toBe(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Outside project action' }));
    await expect(canvas.getByRole('status', { name: 'Outside project count' })).toHaveTextContent(
      '1',
    );
    await expect(surface).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Close project dialog' }));
    await expect(surface).not.toBeVisible();
    await expect(trigger).toHaveFocus();
  },
};

export const ControlledVeto: Story = {
  render: () => <DialogControlledFlow vetoClose />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open project dialog' });
    await userEvent.click(trigger);
    const surface = canvas.getByRole('dialog', { name: 'Project settings' });
    await userEvent.click(canvas.getByRole('button', { name: 'Close project dialog' }));
    await expect(surface instanceof HTMLDialogElement && surface.open).toBe(true);
    await expect(surface.matches(':modal')).toBe(true);
    await expect(canvas.getByRole('status', { name: 'Dialog event log' })).toHaveTextContent(
      'triggerClick:true|triggerClick:false',
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Keep dialog open' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Close project dialog' }));
    await expect(surface).not.toBeVisible();
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole('status', { name: 'Dialog event log' })).toHaveTextContent(
      'triggerClick:true|triggerClick:false|triggerClick:false',
    );
  },
};

export const Alert: Story = {
  render: () => <DialogConfirmationFlow alert />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Review sharing' }));
    const alert = canvas.getByRole('alertdialog', { name: 'Share Atlas?' });
    await expect(alert.matches(':modal')).toBe(true);
    await expect(canvas.getByRole('button', { name: 'Confirm sharing' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I reviewed access' }));
    await expect(canvas.getByRole('button', { name: 'Confirm sharing' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm sharing' }));
    await expect(canvas.queryByRole('alertdialog', { name: 'Share Atlas?' })).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Sharing result' })).toHaveTextContent(
      'Atlas shared',
    );
  },
};

export const Confirmation: Story = {
  render: () => <DialogConfirmationFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Review sharing' });
    await userEvent.click(trigger);
    await expect(canvas.getByRole('button', { name: 'Confirm sharing' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel sharing' }));
    await expect(canvas.getByRole('status', { name: 'Sharing result' })).toHaveTextContent(
      'Not shared',
    );
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I reviewed access' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm sharing' }));
    await expect(canvas.queryByRole('dialog', { name: 'Share Atlas?' })).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Sharing result' })).toHaveTextContent(
      'Atlas shared',
    );
  },
};

export const NativeForm: Story = {
  render: () => <DialogFormFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Edit project' });
    await userEvent.click(trigger);
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Project name' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Project name' }), 'Atlas v2');
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.queryByRole('dialog', { name: 'Edit Atlas' })).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Project submission' })).toHaveTextContent(
      '{"project":"Atlas v2","intent":"save"}',
    );
    await expect(canvas.getByRole('status', { name: 'Project submitter' })).toHaveTextContent(
      'submit:intent:save',
    );
    await expect(trigger).toHaveFocus();
  },
};

export const NativeNesting: Story = {
  render: () => <DialogNestedFlow />,
  play: async ({ canvas }) => {
    const outerTrigger = canvas.getByRole('button', { name: 'Open outer dialog' });
    await userEvent.click(outerTrigger);
    await expect(canvas.getByRole('status', { name: 'Outer dialog context' })).toHaveTextContent(
      'true:modal:false:true',
    );
    const innerTrigger = canvas.getByRole('button', { name: 'Open inner dialog' });
    await userEvent.click(innerTrigger);
    const inner = canvas.getByRole('dialog', { name: 'Inner project dialog' });
    await expect(inner.matches(':modal')).toBe(true);
    await expect(canvas.getByRole('status', { name: 'Inner dialog context' })).toHaveTextContent(
      'true:modal:true:true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Close inner dialog' }));
    await expect(innerTrigger).toHaveFocus();
    const outer = canvas.getByRole('dialog', { name: 'Outer project dialog' });
    await expect(outer.matches(':modal')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Open project help' }));
    const help = canvas.getByRole('note', { name: 'Project help' });
    await expect(help.matches(':popover-open')).toBe(true);
    await expect(outer.contains(help)).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Close project help' }));
    await expect(canvas.queryByRole('note', { name: 'Project help' })).toBeNull();
    await expect(outer.matches(':modal')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Close outer dialog' }));
    await expect(canvas.queryByRole('dialog', { name: 'Outer project dialog' })).toBeNull();
    await expect(outerTrigger).toHaveFocus();
  },
};
