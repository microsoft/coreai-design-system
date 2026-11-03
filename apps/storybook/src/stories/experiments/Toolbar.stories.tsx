// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
} from '@coreai-ds/react-headless-components';
import { toolbarConsumerExample, toolbarExamples } from './ToolbarComparison.js';
import { ToolbarComparisonWithReport } from './ToolbarComparisonReport.js';
import {
  ToolbarDynamicFlow,
  ToolbarEditingFlow,
  ToolbarFormFlow,
  ToolbarMenuFlow,
} from './ToolbarFlows.js';
import {
  assertToolbarFocus,
  assertToolbarReport,
  focusToolbarStoryItem,
  leaveToolbarStory,
} from './ToolbarStoryPlay.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Toolbar',
  component: Toolbar,
  subcomponents: {
    ToolbarButton,
    ToolbarDivider,
    ToolbarGroup,
    ToolbarRadioButton,
    ToolbarRadioGroup,
    ToolbarToggleButton,
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'All seven current Toolbar members use public headless-preview 0.3.2 /toolbar hooks/renderers and react-toolbar 9.8.7 raw styles. Public context helpers remain available; the facade has no ToolbarProvider. Existing Button/ToggleButton/Divider CSS and the typed Button styling helper supply delegated visuals, without standalone Button CoreAI shape/min-width defaults. There are no Toolbar-family CoreAI defaults or overrides. Toolbar size controls spacing and toggle/radio size; plain ToolbarButton is medium and its explicit vertical prop controls icon/text layout. The current native focusgroup owns arrow/Home/End/Tab/RTL navigation. This shared story/test-only consumer loads the exact public focusgroup-polyfill 1.6.0 initializer before children and initializes new subtree groups; the library imports no polyfill or focus manager. Visibility-only polyfill limitations stay consumer-owned. Dynamic examples unmount/remount groups. Storybook synthetic keys prepare focus explicitly on native engines; trusted Browser Mode/acceptance checks real keys with native support enabled and disabled. Checked-values state, native buttons/anchors/forms, disabled activation, callbacks, refs, slot/render-function metadata and public context stay in current hooks. Toggle/radio buttons are native buttons, not form radio/checkbox inputs; native form reset does not reset Toolbar checked values. Caller event handlers retain upstream ordering rather than adding a second selection state. Completed native Menu is used only for the documented ToolbarButton trigger composition. Native overlays are tested separately, without legacy Portal/motion/Tabster machinery. Bounded shared reports compare exact selected CSS, rectangles and offsets; ordinary unlayered consumer CSS intentionally has priority. No deprecated visual props, shape/size props for plain ToolbarButton, overflow helpers or provider aliases are invented.',
      },
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ToolbarComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('toolbar-report-pointer-rest'));
    await assertToolbarReport(canvasElement, toolbarExamples[0].name);
    for (const example of toolbarExamples.slice(1)) {
      await userEvent.selectOptions(canvas.getByLabelText('Toolbar visual fixture'), example.name);
      await assertToolbarReport(canvasElement, example.name);
    }
  },
};

export const RTLComparison: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ToolbarComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <ToolbarComparisonWithReport examples={[toolbarConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('toolbar-report-pointer-rest'));
    await assertToolbarReport(canvasElement, toolbarConsumerExample.name);
    const root = canvasElement.querySelector('[data-toolbar-implementation="headless"]');
    const button = root?.querySelector('[data-toolbar-part="button"]');
    const icon = button?.querySelector('[data-toolbar-part="icon"]');
    if (!(root instanceof HTMLElement) || !(button instanceof HTMLElement) || !icon) {
      throw new Error('Missing consumer Toolbar slots');
    }
    await expect(getComputedStyle(root).paddingTop).toBe('10px');
    await expect(getComputedStyle(button).minWidth).toBe('120px');
    await expect(getComputedStyle(button).borderRadius).toBe('3px');
    await expect(getComputedStyle(icon).fontSize).toBe('16px');
  },
};

async function playEditing(
  context: Parameters<NonNullable<Story['play']>>[0],
  arrow = '{ArrowRight}',
) {
  const { canvas } = context;
  await userEvent.hover(canvas.getByTestId('toolbar-pointer-rest'));
  const first = canvas.getByRole('button', { name: 'Save draft' });
  first.focus();
  await assertToolbarFocus(first);
  await focusToolbarStoryItem(canvas.getByRole('button', { name: 'Bold' }), arrow);
  await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await focusToolbarStoryItem(canvas.getByRole('radio', { name: 'Align center' }), '{End}');
  await focusToolbarStoryItem(first, '{Home}');
  await leaveToolbarStory(canvas.getByRole('button', { name: 'After toolbar' }));
  await userEvent.click(canvas.getByRole('button', { name: 'Italic' }));
  await userEvent.click(canvas.getByRole('button', { name: 'Bold' }));
  await userEvent.click(canvas.getByRole('radio', { name: 'Align center' }));
  const events = canvas.getByLabelText('Toolbar editing events');
  await expect(events).toHaveAttribute('data-toolbar-change-count', '3');
  await expect(events).toHaveAttribute('data-toolbar-change-name', 'align');
  await expect(events).toHaveAttribute('data-toolbar-change-items', '["center"]');
  await userEvent.click(canvas.getByRole('button', { name: 'Lock unavailable' }));
  await expect(events).toHaveAttribute('data-toolbar-change-count', '3');
  await userEvent.click(first);
  await expect(events).toHaveAttribute('data-toolbar-last-action', 'save');
  const editor = canvas.getByRole('textbox', { name: 'Document content' });
  await userEvent.clear(editor);
  await userEvent.type(editor, 'Toolbar notes');
  await expect(editor).toHaveValue('Toolbar notes');
  await expect(events).toHaveAttribute('data-toolbar-text', 'Toolbar notes');
  await expect(getComputedStyle(editor).fontStyle).toBe('italic');
  await expect(getComputedStyle(editor).textAlign).toBe('center');
  await expect(canvas.getByLabelText('Public Toolbar context')).toHaveAttribute(
    'data-context-checked',
    '{"format":["italic"],"align":["center"]}',
  );
}

export const EditingAndSelection: Story = {
  render: () => <ToolbarEditingFlow />,
  play: (context) => playEditing(context),
};

export const UncontrolledSelection: Story = {
  render: () => <ToolbarEditingFlow controlled={false} />,
  play: EditingAndSelection.play,
};

export const VerticalKeyboard: Story = {
  render: () => <ToolbarEditingFlow vertical />,
  play: (context) => playEditing(context, '{ArrowDown}'),
};

export const RTLKeyboard: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ToolbarEditingFlow />
    </CoreAIFluentProvider>
  ),
  play: (context) => playEditing(context, '{ArrowLeft}'),
};

export const DynamicGroups: Story = {
  render: () => <ToolbarDynamicFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Mount additional toolbar' }));
    await userEvent.hover(canvas.getByTestId('toolbar-dynamic-pointer-rest'));
    const first = canvas.getByRole('button', { name: 'Additional first' });
    first.focus();
    await focusToolbarStoryItem(
      canvas.getByRole('button', { name: 'Additional second' }),
      '{ArrowRight}',
    );
    await focusToolbarStoryItem(canvas.getByRole('button', { name: 'Additional last' }), '{End}');
    await userEvent.click(canvas.getByRole('button', { name: 'Unmount additional toolbar' }));
    await expect(canvas.queryByRole('toolbar', { name: 'Additional commands' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Mount additional toolbar' }));
    await userEvent.hover(canvas.getByTestId('toolbar-dynamic-pointer-rest'));
    canvas.getByRole('button', { name: 'Additional first' }).focus();
    await focusToolbarStoryItem(canvas.getByRole('button', { name: 'Additional last' }), '{End}');
    await userEvent.click(canvas.getByRole('button', { name: 'Add action group' }));
    await userEvent.hover(canvas.getByTestId('toolbar-dynamic-pointer-rest'));
    canvas.getByRole('button', { name: 'Second command' }).focus();
    await focusToolbarStoryItem(
      canvas.getByRole('button', { name: 'Added command' }),
      '{ArrowRight}',
    );
    await focusToolbarStoryItem(
      canvas.getByRole('button', { name: 'Final added command' }),
      '{End}',
    );
  },
};

export const NativeForms: Story = {
  render: () => <ToolbarFormFlow />,
  play: async ({ canvas }) => {
    const title = canvas.getByRole('textbox', { name: 'Document title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Project plan');
    await userEvent.click(canvas.getByRole('button', { name: 'Preview document' }));
    const result = canvas.getByLabelText('Toolbar form result');
    await expect(result).toHaveAttribute('data-toolbar-previews', '1');
    await expect(result).toHaveAttribute('data-toolbar-form-payload', '');
    await userEvent.click(canvas.getByRole('button', { name: 'Form bold' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save document' }));
    await expect(result).toHaveAttribute(
      'data-toolbar-form-payload',
      '[["title","Project plan"],["action","save"]]',
    );
    await userEvent.click(canvas.getByRole('link', { name: 'Veto navigation' }));
    await expect(result).toHaveAttribute('data-toolbar-navigation-vetoed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset document' }));
    await expect(title).toHaveValue('Draft');
    await expect(canvas.getByRole('button', { name: 'Form bold' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};

export const ToolbarMenu: Story = {
  render: () => <ToolbarMenuFlow />,
  play: async ({ canvas, canvasElement }) => {
    const surface = canvasElement.querySelector('[data-testid="toolbar-menu-surface"]');
    if (!(surface instanceof HTMLElement)) throw new Error('Missing Toolbar Menu surface');
    await expect(surface.matches(':popover-open')).toBe(false);
    await expect(surface.getBoundingClientRect().width).toBe(0);
    const trigger = canvas.getByRole('button', { name: 'More document commands' });
    await userEvent.click(trigger);
    await waitFor(async () => {
      await expect(surface.matches(':popover-open')).toBe(true);
    });
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Rename document' }));
    await expect(canvas.getByLabelText('Toolbar menu result')).toHaveAttribute(
      'data-toolbar-menu-action',
      'rename',
    );
    await waitFor(async () => {
      await expect(surface.matches(':popover-open')).toBe(false);
    });
    await userEvent.click(trigger);
    await waitFor(async () => {
      await expect(surface.matches(':popover-open')).toBe(true);
    });
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Duplicate document' }));
    await expect(canvas.getByLabelText('Toolbar menu result')).toHaveAttribute(
      'data-toolbar-menu-action',
      'duplicate',
    );
    await waitFor(async () => {
      await expect(surface.matches(':popover-open')).toBe(false);
      await expect(surface.getBoundingClientRect().width).toBe(0);
    });
  },
};
