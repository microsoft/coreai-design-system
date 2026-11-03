// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { List, ListItem } from '@coreai-ds/react-headless-components';
import { listConsumerExample, listExamples } from './ListComparison.js';
import { ListComparisonWithReport } from './ListComparisonReport.js';
import {
  ListBoundariesFlow,
  ListCompositeFlow,
  ListSelectionFlow,
  listArchiveValue,
  listDesignValue,
  listReviewValue,
} from './ListFlows.js';
import { assertListFocus, assertListReport, focusListStoryItem } from './ListStoryPlay.js';

const meta = {
  title: 'Experiments/Headless List',
  component: List,
  subcomponents: { ListItem },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'The complete pinned headless-preview 0.3.2/list visual surface is List and ListItem. Installed react-list 9.7.0 publishes no size, layout, inset or spacing props; none are invented. CoreAI directly reexports both without List defaults or overrides. Public hooks resolve all semantics, native selection and refs before layered CSS Modules style the state and public renderers render it. Native focusgroup supplies item navigation, with a test/story-only consumer polyfill where needed. Current public composite navigation owns row/control movement and roving Tab behavior. Listbox checkmarks use the supported null slot; grid checkmarks remain native inputs in public grid cells. A CSS-only bridge composes the completed Checkbox indicator foundation and exact MIT checkmark mask, not a styled runtime or replacement control. Native forms, caller renderers, current disabledSelection semantics and event/payload identity remain intact. Raw-current/styled boundary probes demonstrate consumer-owned nested-action propagation. Strict reports compare bounded styles and actual geometry with fixture-specific readiness/counts. Ordinary unlayered consumer CSS intentionally has priority.',
      },
    },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ListComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('list-report-pointer-rest'));
    for (const [index, example] of listExamples.entries()) {
      if (index) {
        await userEvent.selectOptions(canvas.getByLabelText('List visual fixture'), example.name);
      }
      await assertListReport(canvasElement, example.name, !!example.checkmarks);
    }
  },
};

export const RTLComparison: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ListComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsDisabled: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <ListComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <ListComparisonWithReport examples={[listConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('list-report-pointer-rest'));
    await assertListReport(canvasElement, listConsumerExample.name, true);
    const list = canvas.getByRole('grid', { name: 'headless project list' });
    const row = list.querySelector('[data-list-row="alpha"]');
    const checkmark = row?.querySelector('input[type="checkbox"]');
    if (!row || !checkmark) throw new Error('Missing consumer List slots');
    await expect(getComputedStyle(list).paddingTop).toBe('7px');
    await expect(getComputedStyle(row).paddingInlineStart).toBe('9px');
    await expect(getComputedStyle(checkmark).borderRadius).toBe('3px');
    await expect(getComputedStyle(checkmark).borderTopWidth).toBe('2px');
  },
};

async function playSelection(
  { canvas }: Parameters<NonNullable<Story['play']>>[0],
  single: boolean,
) {
  await userEvent.hover(canvas.getByTestId('list-flow-pointer-rest'));
  const design = canvas.getByRole('option', { name: 'Design review' });
  const review = canvas.getByRole('option', { name: 'Accessibility audit' });
  const locked = canvas.getByRole('option', { name: 'Locked project' });
  const events = canvas.getByLabelText('List selection events');
  design.focus();
  await assertListFocus(design);
  await focusListStoryItem(review, '{ArrowDown}');
  await expect(design).toHaveAttribute('aria-selected', 'true');
  await userEvent.keyboard(' ');
  const requested = single ? [listReviewValue] : [listDesignValue, listReviewValue];
  await expect(events).toHaveAttribute('data-list-change-count', '1');
  await expect(events).toHaveAttribute('data-list-change-values', JSON.stringify(requested));
  await expect(events).toHaveAttribute('data-list-event-type', 'keydown');
  await expect(events).toHaveAttribute('data-list-data-type', 'change');
  await expect(events).toHaveAttribute('data-list-same-event', 'true');
  await expect(events).toHaveAttribute('data-list-event-target', String(listReviewValue));
  await expect(events).toHaveAttribute('data-list-event-current-target', String(listReviewValue));
  await expect(review).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(locked);
  await expect(locked).toHaveAttribute('aria-disabled', 'true');
  await expect(events).toHaveAttribute('data-list-change-count', '1');
  await userEvent.click(canvas.getByRole('option', { name: 'Open archive' }));
  const action = canvas.getByLabelText('List primary actions');
  await expect(action).toHaveAttribute('data-list-action-count', '1');
  await expect(action).toHaveAttribute('data-list-action-value', listArchiveValue);
  await expect(action).toHaveAttribute('data-list-action-event-type', 'ListItemAction');
  await expect(action).toHaveAttribute('data-list-action-data-type', 'ListItemAction');
  await expect(action).toHaveAttribute('data-list-action-same-event', 'true');
  await expect(action).toHaveAttribute('data-list-action-original-type', 'click');
  await expect(action).toHaveAttribute('data-list-action-original-target', listArchiveValue);
  await expect(action).toHaveAttribute(
    'data-list-action-original-current-target',
    listArchiveValue,
  );
  await expect(events).toHaveAttribute('data-list-change-count', '1');
  await userEvent.click(canvas.getByRole('checkbox', { name: 'Reject selection requests' }));
  await userEvent.click(design);
  await expect(events).toHaveAttribute('data-list-change-count', '2');
  await expect(events).toHaveAttribute('data-list-selected-values', JSON.stringify(requested));
  await expect(review).toHaveAttribute('aria-selected', 'true');
}

export const Selection: Story = {
  render: () => <ListSelectionFlow />,
  play: (context) => playSelection(context, false),
};

export const SingleSelection: Story = {
  render: () => <ListSelectionFlow selectionMode="single" />,
  play: (context) => playSelection(context, true),
};

export const CompositeActions: Story = {
  render: () => <ListCompositeFlow />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('list-flow-pointer-rest'));
    const design = canvas.getByRole('row', { name: 'Design review' });
    const review = canvas.getByRole('row', { name: 'Accessibility audit' });
    const note = canvas.getByRole('textbox', { name: 'Note for Design review' });
    design.focus();
    await assertListFocus(design);
    await userEvent.keyboard('{ArrowRight}');
    await assertListFocus(note);
    await userEvent.keyboard('{End}{ArrowLeft}');
    await assertListFocus(note);
    await userEvent.keyboard('{Escape}');
    await assertListFocus(design);
    await userEvent.keyboard('{ArrowDown}');
    await assertListFocus(review);
    await userEvent.keyboard('{ArrowRight}');
    await assertListFocus(canvas.getByRole('textbox', { name: 'Note for Accessibility audit' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    await assertListFocus(canvas.getByRole('button', { name: 'After project grid' }));
    await userEvent.tab({ shift: true });
    await assertListFocus(review);
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect Design review' }));
    await expect(canvas.getByLabelText('Inspected project')).toHaveTextContent('Design review');
    await expect(canvas.getByLabelText('Composite list state')).toHaveAttribute(
      'data-list-selected-values',
      JSON.stringify([listDesignValue]),
    );
  },
};

export const RTLCompositeActions: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ListCompositeFlow />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('list-flow-pointer-rest'));
    const row = canvas.getByRole('row', { name: 'Design review' });
    const note = canvas.getByRole('textbox', { name: 'Note for Design review' });
    row.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await assertListFocus(note);
    await userEvent.keyboard('{Escape}');
    await assertListFocus(row);
    await userEvent.keyboard('{End}');
    await assertListFocus(canvas.getByRole('row', { name: 'Release notes' }));
    await userEvent.keyboard('{Home}');
    await assertListFocus(row);
  },
};

export const DynamicItemsAndForms: Story = {
  render: () => <ListCompositeFlow includeCheckmarksInNavigation />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('list-flow-pointer-rest'));
    const design = canvas.getByRole('row', { name: 'Design review' });
    design.focus();
    await userEvent.keyboard('{ArrowRight}');
    await assertListFocus(canvas.getByRole('checkbox', { name: 'Select Design review' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Accessibility audit' }));
    const note = canvas.getByRole('textbox', { name: 'Note for Accessibility audit' });
    await userEvent.clear(note);
    await userEvent.type(note, 'Audit approved');
    await userEvent.click(canvas.getByRole('button', { name: 'Submit projects' }));
    await expect(canvas.getByLabelText('Submitted projects')).toHaveTextContent(
      JSON.stringify([
        ['projects', listDesignValue],
        ['note-design', 'Design draft'],
        ['projects', String(listReviewValue)],
        ['note-review', 'Audit approved'],
        ['note-release', 'Release draft'],
        ['action', 'save-projects'],
      ]),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reset projects' }));
    await expect(note).toHaveValue('Audit draft');
    await expect(
      canvas.getByRole('checkbox', { name: 'Select Accessibility audit' }),
    ).not.toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Add project' }));
    await expect(canvas.getByLabelText('Composite list state')).toHaveAttribute(
      'data-list-project-count',
      '4',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Accessibility audit' }));
    await assertListFocus(canvas.getByRole('row', { name: 'Release notes' }));
    await expect(canvas.queryByRole('row', { name: 'Accessibility audit' })).toBeNull();
    await expect(canvas.getByLabelText('Composite list state')).toHaveAttribute(
      'data-list-project-count',
      '3',
    );
    await userEvent.click(canvas.getByRole('link', { name: 'Open Design review details' }));
    await expect(canvas.getByLabelText('List project links')).toHaveAttribute(
      'data-list-link-count',
      '1',
    );
    await waitFor(async () => {
      await expect(window.location.hash).toBe('#list-project-preview');
    });
  },
};

export const CurrentNativeBoundaries: Story = {
  render: () => <ListBoundariesFlow />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId('list-flow-pointer-rest'));
    for (const name of ['Raw current', 'Styled current']) {
      const events = canvas.getByLabelText(`${name} boundary events`);
      await userEvent.click(canvas.getByRole('button', { name: `${name} bubbling action` }));
      await expect(events).toHaveAttribute('data-list-boundary-requests', '1');
      await expect(events).toHaveAttribute('data-list-boundary-selected', '["bubbled"]');
      await userEvent.click(canvas.getByRole('button', { name: `${name} safe action` }));
      await expect(events).toHaveAttribute('data-list-boundary-requests', '1');
      const row = canvas.getByRole('row', { name: `${name} action-only row` });
      await expect(row).not.toHaveAttribute('aria-disabled');
      await expect(
        canvas.getByRole('checkbox', { name: `${name} disabled selection` }),
      ).toBeDisabled();
      await userEvent.click(row);
      await expect(events).toHaveAttribute('data-list-boundary-actions', '1');
      await expect(events).toHaveAttribute('data-list-boundary-requests', '1');
    }
  },
};
