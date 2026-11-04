// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { TagPickerExample } from './TagPickerComparison.js';
import {
  getComparisonTagPicker,
  getTagPickerPopup,
  tagPickerHTML,
} from './compareTagPickerStyles.js';

export async function assertTagPickerReport(container: HTMLElement, example: TagPickerExample) {
  const report = container.querySelector('[data-tagpicker-report-state]');
  if (!(report instanceof HTMLOutputElement)) throw new Error('Missing TagPicker style report');
  await waitFor(
    async () => {
      await expect(report).toHaveAttribute('data-tagpicker-report-state', 'ready');
      await expect(report).toHaveAttribute('data-tagpicker-report-example', example.name);
      await expect(report).toHaveAttribute('data-tagpicker-unexpected-count', '0');
      const control = getComparisonTagPicker(container, 'headless');
      const box = control.getBoundingClientRect();
      await expect(box.width).toBeGreaterThan(0);
      await expect(box.height).toBeGreaterThan(0);
      await expect(box.width).toBe(Number(report.dataset.tagpickerControlWidth));
      await expect(box.height).toBe(Number(report.dataset.tagpickerControlHeight));
      await expect(control.querySelectorAll('[data-tagpicker-part="tag"]').length).toBe(
        example.selected?.length ?? 0,
      );
      await expect(report).toHaveAttribute(
        'data-tagpicker-tag-count',
        String(example.selected?.length ?? 0),
      );
      const popup = getTagPickerPopup(container, 'headless');
      if (example.props?.open && !example.props.noPopover) {
        if (!popup) throw new Error('Missing open TagPickerList');
        await expect(popup.matches(':popover-open')).toBe(true);
        await expect(getComputedStyle(popup).display).toBe('flex');
        await expect(popup.querySelectorAll('.fui-TagPickerOption').length).toBe(
          example.empty ? 1 : 4,
        );
        await expect(report).toHaveAttribute(
          'data-tagpicker-option-count',
          String(example.empty ? 1 : 4),
        );
        const surface = popup.getBoundingClientRect();
        await expect(surface.width).toBe(Math.max(box.width, 160));
        await expect(surface.height).toBeGreaterThan(0);
        await expect(surface.left - box.left).toBe(0);
        await expect(surface.top - box.bottom).toBe(0);
        await expect(popup.querySelectorAll('.fui-Option__checkIcon').length).toBe(0);
      } else {
        await expect(popup).toBeNull();
        await expect(report).toHaveAttribute('data-tagpicker-option-count', '0');
      }
    },
    { timeout: 10000 },
  );
}

async function assertFocus(element: HTMLElement) {
  await waitFor(async () => {
    await expect(element.ownerDocument.activeElement).toBe(element);
  });
}

export async function playTagPickerSelectionFlow(container: HTMLElement, grouped = false) {
  const canvas = within(container);
  await userEvent.hover(canvas.getByTestId('tagpicker-flow-pointer-rest'));
  const input = canvas.getByRole('combobox', { name: 'Find reviewers' });
  const record = canvas.getByLabelText('Reviewer selection');
  await userEvent.click(input);
  if (grouped) {
    await expect(canvas.getByRole('group', { name: 'Research' })).toBeVisible();
    await expect(canvas.getByRole('group', { name: 'Engineering' })).toBeVisible();
  }
  await userEvent.type(input, 'Gra');
  await expect(canvas.queryByRole('option', { name: 'Ada Lovelace' })).toBeNull();
  await userEvent.click(canvas.getByRole('option', { name: 'Grace Hopper' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-values', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-previous', '[]');
  await expect(record).toHaveAttribute('data-tagpicker-event-type', 'click');
  await expect(record).toHaveAttribute('data-tagpicker-event-same', 'true');
  await expect(record).toHaveAttribute(
    'data-tagpicker-event-keys',
    'event,selectedOptions,type,value',
  );
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await userEvent.type(input, 'Ada');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["grace","ada"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-previous', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-type', 'keydown');
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '2');
  await expect(record).toHaveAttribute('data-tagpicker-open-same', 'true');
  await expect(input).toHaveValue('');
  input.focus();
  await userEvent.keyboard('{ArrowLeft}');
  await assertFocus(canvas.getByRole('button', { name: 'Remove Ada Lovelace' }));
  await userEvent.keyboard('{Delete}');
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-value', 'ada');
  await expect(record).toHaveAttribute('data-tagpicker-dismiss-count', '1');
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '3');
  await assertFocus(canvas.getByRole('button', { name: 'Remove Grace Hopper' }));
  await userEvent.keyboard('{ArrowRight}');
  await assertFocus(input);
  await userEvent.type(input, 'zzzz');
  const empty = canvas.getByRole('option', { name: 'No matching reviewers' });
  await expect(empty).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '3');
  await userEvent.clear(input);
  await userEvent.type(input, 'Margaret');
  const unavailable = canvas.getByRole('option', { name: 'Margaret Hamilton' });
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(unavailable);
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '3');
  await userEvent.clear(input);
  await userEvent.keyboard('{Escape}');
  await userEvent.click(canvas.getByRole('button', { name: 'Clear reviewers' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect(canvas.queryByRole('toolbar', { name: 'Selected reviewers' })).toBeNull();
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '3');
  await expect(input.getBoundingClientRect().width).toBeGreaterThan(24);
}

export async function playTagPickerControlledFlow(container: HTMLElement) {
  const canvas = within(container);
  const input = canvas.getByRole('combobox', { name: 'Find reviewers' });
  const record = canvas.getByLabelText('Reviewer selection');
  await userEvent.click(canvas.getByRole('button', { name: 'Reject selection changes' }));
  await userEvent.click(input);
  await userEvent.type(input, 'Ada');
  await userEvent.click(canvas.getByRole('option', { name: 'Ada Lovelace' }));
  await expect(record).toHaveAttribute('data-tagpicker-event-values', '["ada"]');
  await expect(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect(input).toHaveValue('Ada');
  await userEvent.click(canvas.getByRole('button', { name: 'Accept selection changes' }));
  await userEvent.click(input);
  await userEvent.click(canvas.getByRole('option', { name: 'Ada Lovelace' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["ada"]');
  await expect(input).toHaveValue('');
  await userEvent.click(canvas.getByRole('button', { name: 'Disable reviewers' }));
  await expect(input).toBeDisabled();
  await expect(canvas.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeDisabled();
  await expect(canvas.getByRole('button', { name: 'Clear reviewers' })).toBeDisabled();
  await expect(record).toHaveAttribute('data-tagpicker-event-count', '2');
  await userEvent.click(canvas.getByRole('button', { name: 'Enable reviewers' }));
  await expect(input).toBeEnabled();
}

export async function playTagPickerSingleFlow(container: HTMLElement) {
  const canvas = within(container);
  const input = canvas.getByRole('combobox', { name: 'Find reviewers' });
  const record = canvas.getByLabelText('Reviewer selection');
  await userEvent.click(input);
  await userEvent.type(input, 'Ada');
  await userEvent.click(canvas.getByRole('option', { name: 'Ada Lovelace' }));
  await userEvent.type(input, 'Grace');
  await userEvent.click(canvas.getByRole('option', { name: 'Grace Hopper' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-values', '["ada","grace"]');
  await expect(record).toHaveAttribute('data-tagpicker-event-previous', '["ada"]');
  await expect(canvas.queryByRole('button', { name: 'Remove Ada Lovelace' })).toBeNull();
  await userEvent.click(canvas.getByRole('button', { name: 'Remove Grace Hopper' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect(record).toHaveAttribute('data-tagpicker-event-values', '[]');
  await assertFocus(input);
}

export async function playTagPickerButtonFlow(container: HTMLElement) {
  const canvas = within(container);
  const button = canvas.getByRole('combobox', { name: 'Choose reviewers' });
  const record = canvas.getByLabelText('Reviewer selection');
  await expect(button).toHaveAttribute('type', 'button');
  await userEvent.click(button);
  await userEvent.click(canvas.getByRole('option', { name: 'Ada Lovelace' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '["ada"]');
  await expect(getComputedStyle(button).clip).toBe('rect(0px, 0px, 0px, 0px)');
  await userEvent.click(canvas.getByRole('button', { name: 'Remove Ada Lovelace' }));
  await expect(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect(getComputedStyle(button).clip).toBe('auto');
  await assertFocus(button);
  await expect(button.getBoundingClientRect().width).toBeGreaterThan(24);
}

export async function playTagPickerNativeFormFlow(container: HTMLElement) {
  const canvas = within(container);
  const input = canvas.getByRole('combobox', { name: 'Approval note' });
  const record = canvas.getByLabelText('Reviewer form result');
  await expect(input).toBeRequired();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const descriptionIds = input.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  const descriptions = descriptionIds.map((id) => document.getElementById(id)?.textContent);
  await expect(descriptions).toEqual(
    expect.arrayContaining([
      'Enter an approval note',
      'This name belongs to the query input, not to the selected tags',
    ]),
  );
  await userEvent.clear(input);
  await userEvent.click(canvas.getByRole('button', { name: 'Submit reviewer form' }));
  await expect(record).toHaveAttribute('data-tagpicker-form-submits', '0');
  await userEvent.type(input, 'Approved');
  await userEvent.click(canvas.getByRole('button', { name: 'Submit reviewer form' }));
  await expect(record).toHaveAttribute('data-tagpicker-form-submits', '1');
  await expect(record).toHaveAttribute(
    'data-tagpicker-form-entries',
    '[["approvalNote","Approved"],["reviewer","ada"]]',
  );
  await userEvent.click(canvas.getByRole('button', { name: 'Native reviewer reset' }));
  await expect(record).toHaveAttribute('data-tagpicker-form-resets', '1');
  await expect(input).toHaveValue('Approved');
  await expect(canvas.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: 'Reset reviewer state' }));
  await expect(input).toHaveValue('');
  await userEvent.click(canvas.getByRole('button', { name: 'Submit reviewer form' }));
  await expect(record).toHaveAttribute('data-tagpicker-form-submits', '1');
  await expect(canvas.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeVisible();
}

export async function playTagPickerCustomValuesFlow(container: HTMLElement) {
  const canvas = within(container);
  const input = canvas.getByRole('combobox', { name: 'Add review label' });
  const result = canvas.getByLabelText('Custom review labels result');
  await userEvent.type(input, 'Ready{Enter}');
  await expect(input).toHaveValue('');
  await expect(result).toHaveTextContent('["Ready"]');
  await userEvent.type(input, 'Ready{Enter}');
  await expect(result).toHaveTextContent('["Ready"]');
  await expect(container.querySelector('.fui-TagPickerList')).toBeNull();
  const control = tagPickerHTML(input.closest('.fui-TagPickerControl'));
  await expect(control.querySelector('.fui-TagPickerControl__expandIcon')).toBeNull();
  await userEvent.click(canvas.getByRole('button', { name: 'Remove Ready' }));
  await expect(result).toHaveTextContent('[]');
  await assertFocus(input);
}
