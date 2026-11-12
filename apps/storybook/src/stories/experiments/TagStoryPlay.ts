// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor, within } from 'storybook/test';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { getComparisonTag } from './compareTagStyles.js';

export async function assertTagReport(container: HTMLElement, example: string) {
  const report = container.querySelector('[data-tag-report-state]');
  if (!(report instanceof HTMLElement)) throw new Error('Missing Tag style report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-tag-report-state', 'ready');
      await expect(report).toHaveAttribute('data-tag-report-example', example);
      await expect(report).toHaveAttribute('data-tag-unexpected-count', '0');
    },
    { timeout: 10000 },
  );
  const surface = getComparisonTag(container, 'headless');
  const rect = surface.getBoundingClientRect();
  await expect(rect.width).toBeGreaterThan(0);
  await expect(rect.height).toBeGreaterThan(0);
  await expect(rect.width).toBe(Number(report.dataset.tagRootWidth));
  await expect(rect.height).toBe(Number(report.dataset.tagRootHeight));
  await expect(surface.querySelectorAll('[data-tag-part]').length).toBe(
    Number(report.dataset.tagSlotCount),
  );
  await expect(surface.querySelectorAll('[data-tag-part="primaryText"]').length).toBe(
    surface.hasAttribute('data-tag-group') ? 3 : 1,
  );
  if (surface.hasAttribute('data-tag-group')) {
    await expect(surface.querySelectorAll('[data-tag-part="item"]').length).toBe(3);
  }
  await expect(report).toHaveAttribute(
    'data-tag-focusgroup-mode',
    supportsFocusGroup() ? 'native' : 'consumer-polyfill',
  );
}

export async function assertTagFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function moveTagStoryFocus(element: HTMLElement, key: string) {
  if (supportsFocusGroup()) {
    // Synthetic events cannot invoke native focusgroup defaults. Trusted acceptance uses real keys.
    element.focus();
  } else {
    await userEvent.keyboard(key);
  }
  await assertTagFocus(element);
}

export async function playTagDismissFlow(
  container: HTMLElement,
  interaction = false,
  cold = false,
) {
  const canvas = within(container);
  await userEvent.hover(canvas.getByTestId('tag-flow-pointer-rest'));
  if (cold) {
    await expect(canvas.queryByRole('toolbar', { name: 'Project workflow labels' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Restore labels' }));
  }
  const group = canvas.getByRole('toolbar', { name: 'Project workflow labels' });
  await expect(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
  const directionKey = getComputedStyle(group).direction === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}';
  const plan = canvas.getByRole('button', { name: interaction ? 'Plan' : 'Remove Plan' });
  const build = canvas.getByRole('button', { name: interaction ? 'Build' : 'Remove Build' });
  const ship = canvas.getByRole('button', { name: interaction ? 'Ship' : 'Remove Ship' });
  const events = canvas.getByLabelText('Tag dismissal events');
  if (interaction) {
    await userEvent.click(plan);
    await expect(events).toHaveAttribute('data-tag-opened', 'plan');
    await expect(events).toHaveAttribute('data-tag-dismiss-count', '0');
  }
  canvas.getByRole('button', { name: 'Before labels' }).focus();
  await moveTagStoryFocus(plan, '{Tab}');
  await moveTagStoryFocus(
    interaction ? canvas.getByRole('button', { name: 'Remove Plan' }) : build,
    directionKey,
  );
  await moveTagStoryFocus(canvas.getByRole('button', { name: 'Remove Ship' }), '{End}');
  await moveTagStoryFocus(plan, '{Home}');
  if (interaction)
    await moveTagStoryFocus(canvas.getByRole('button', { name: 'Remove Plan' }), directionKey);
  await userEvent.keyboard('{Delete}');
  await expect(events).toHaveAttribute('data-tag-dismiss-value', 'plan');
  await expect(events).toHaveAttribute('data-tag-dismiss-type', 'keydown');
  await expect(events).toHaveAttribute('data-tag-dismiss-key', 'Delete');
  await expect(events).toHaveAttribute('data-tag-visible-count', '2');
  await assertTagFocus(build);
  if (interaction)
    await moveTagStoryFocus(canvas.getByRole('button', { name: 'Remove Build' }), directionKey);
  await userEvent.keyboard('{Backspace}');
  await expect(events).toHaveAttribute('data-tag-dismiss-value', 'build');
  await expect(events).toHaveAttribute('data-tag-dismiss-key', 'Backspace');
  await assertTagFocus(ship);
  await userEvent.click(canvas.getByRole('button', { name: 'Remove Ship' }));
  await expect(events).toHaveAttribute('data-tag-dismiss-count', '3');
  await expect(events).toHaveAttribute('data-tag-visible-count', '0');
  await expect(canvas.queryByRole('toolbar', { name: 'Project workflow labels' })).toBeNull();
  const restore = canvas.getByRole('button', { name: 'Restore labels' });
  await assertTagFocus(restore);
  await userEvent.click(restore);
  const restored = canvas.getByRole('button', { name: interaction ? 'Plan' : 'Remove Plan' });
  await assertTagFocus(restored);
  await expect(events).toHaveAttribute('data-tag-visible-count', '3');
  const restoredGroup = canvas.getByRole('toolbar', { name: 'Project workflow labels' });
  await expect(restoredGroup.querySelectorAll('button').length).toBe(interaction ? 6 : 3);
  await expect(restoredGroup.getBoundingClientRect().width).toBeGreaterThan(0);
  await expect(restoredGroup.getBoundingClientRect().height).toBeGreaterThan(0);
  await moveTagStoryFocus(restore, '{Tab}');
  await moveTagStoryFocus(restored, '{Shift>}{Tab}{/Shift}');
}

export async function playTagSelectionFlow(container: HTMLElement) {
  const canvas = within(container);
  await userEvent.hover(canvas.getByTestId('tag-flow-pointer-rest'));
  const events = canvas.getByLabelText('Tag selection events');
  const plan = canvas.getByRole('button', { name: 'Plan' });
  const build = canvas.getByRole('button', { name: 'Build' });
  await expect(plan).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(plan);
  await expect(plan).toHaveAttribute('aria-pressed', 'false');
  await expect(events).toHaveAttribute('data-tag-select-values', '["plan"]');
  await expect(events).toHaveAttribute('data-tag-selected', '[]');
  await expect(events).toHaveAttribute('data-tag-select-same-event', 'true');
  await expect(events).toHaveAttribute('data-tag-select-type', 'click');
  await userEvent.click(build);
  await expect(build).toHaveAttribute('aria-pressed', 'true');
  await expect(events).toHaveAttribute('data-tag-select-values', '[]');
  await expect(events).toHaveAttribute('data-tag-selected', '["build"]');
  await expect(events).toHaveAttribute('data-tag-select-count', '2');
  await userEvent.click(canvas.getByRole('button', { name: 'Toggle label group disabled' }));
  await expect(build).toBeDisabled();
  await userEvent.click(canvas.getByRole('button', { name: 'Ship' }));
  await expect(events).toHaveAttribute('data-tag-select-count', '2');
}

export async function playTagFormFlow(container: HTMLElement) {
  const canvas = within(container);
  await userEvent.hover(canvas.getByTestId('tag-flow-pointer-rest'));
  const input = canvas.getByRole('textbox', { name: 'Project' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Orion');
  const events = canvas.getByLabelText('Tag form events');
  await userEvent.click(canvas.getByRole('button', { name: 'Remove draft tag' }));
  await userEvent.click(canvas.getByRole('button', { name: 'Remove publish action' }));
  await expect(events).toHaveAttribute('data-tag-form-dismissals', '2');
  await expect(events).toHaveAttribute('data-tag-form-submissions', '0');
  await userEvent.click(canvas.getByRole('button', { name: 'Publish project' }));
  await expect(events).toHaveAttribute('data-tag-form-submissions', '1');
  await expect(events).toHaveAttribute('data-tag-form-submitter', 'action');
  await expect(events).toHaveAttribute(
    'data-tag-form-entries',
    '[["project","Orion"],["action","publish"]]',
  );
  await userEvent.click(canvas.getByRole('button', { name: 'Submit review tag' }));
  await expect(events).toHaveAttribute('data-tag-form-dismissals', '3');
  await expect(events).toHaveAttribute('data-tag-form-submissions', '2');
  await expect(events).toHaveAttribute('data-tag-form-submitter', 'label');
  await expect(events).toHaveAttribute(
    'data-tag-form-entries',
    '[["project","Orion"],["label","review"]]',
  );
  await userEvent.click(canvas.getByRole('button', { name: 'Reset project form' }));
  await expect(input).toHaveValue('Atlas');
  await expect(events).toHaveAttribute('data-tag-form-resets', '1');
}
