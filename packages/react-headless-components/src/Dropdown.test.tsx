// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  DropdownSelectionFlow,
  OptionPickerFormFlow,
  PickerOptions,
  dropdownButtonExamples,
  dropdownExamples,
  pickerAppearances,
} from '../../../apps/storybook/src/stories/experiments/OptionPickerComparison.js';
import {
  captureOptionPickerStyles,
  compareOptionPickerStyles,
  getPickerTrigger,
  settleOptionPickerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareOptionPickerStyles.js';
import {
  Dropdown,
  dropdownClassNames,
  type DropdownProps,
  type DropdownSlots,
} from './Dropdown.js';
import { DropdownButton, type DropdownButtonProps } from './DropdownButton.js';
import { Field } from './Field.js';
import {
  htmlElement,
  renderPickerPair,
} from '../../../apps/storybook/src/stories/experiments/OptionPickerTestUtils.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each([...dropdownExamples, ...dropdownButtonExamples])(
    `matches $kind $name in ${mode} mode`,
    async (example) => {
      const { legacy, headless, differences } = await renderPickerPair(example, theme);
      expect(differences()).toEqual([]);
      expect(getPickerTrigger(headless).textContent).toBe(getPickerTrigger(legacy).textContent);
      expect(getPickerTrigger(headless).disabled).toBe(getPickerTrigger(legacy).disabled);
    },
  );

  test.each(pickerAppearances)(`matches %s pointer hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPickerPair(
      { name: appearance, kind: 'dropdown', props: { appearance, placeholder: 'Choose' } },
      theme,
    );
    await userEvent.hover(getPickerTrigger(legacy));
    expect(legacy.matches(':hover')).toBe(true);
    await settleOptionPickerStyles(legacy);
    const expected = captureOptionPickerStyles(legacy, null);
    await userEvent.hover(getPickerTrigger(headless));
    expect(headless.matches(':hover')).toBe(true);
    await settleOptionPickerStyles(headless);
    expect(compareOptionPickerStyles(expected, captureOptionPickerStyles(headless, null))).toEqual(
      [],
    );
  });
}

test.each([true, false])('keeps filled-darker with provider defaults=%s', async (enabled) => {
  const { headless, differences } = await renderPickerPair(
    { name: 'Defaults', kind: 'dropdown', props: { appearance: undefined, size: undefined } },
    coreaiLightTheme,
    enabled,
  );
  expect(differences()).toEqual([]);
  expect(headless).toHaveAttribute('data-appearance', 'filled-darker');
  expect(headless).toHaveAttribute('data-size', 'medium');
});

test.each(['outline, small', 'Inline label with value', 'Clearable inline selection'])(
  'matches RTL %s',
  async (name) => {
    const example = dropdownExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error(`Unknown fixture ${name}`);
    const { differences } = await renderPickerPair(example, coreaiLightTheme, true, 'rtl');
    expect(differences()).toEqual([]);
  },
);

test('preserves type-to-find, disabled navigation, exact keyboard payloads, and native dismissal', async () => {
  const onOptionSelect = vi.fn<NonNullable<DropdownProps['onOptionSelect']>>();
  const onActiveOptionChange = vi.fn<NonNullable<DropdownProps['onActiveOptionChange']>>();
  const onOpenChange = vi.fn<NonNullable<DropdownProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before</button>
      <Dropdown
        aria-label="Project"
        onOptionSelect={onOptionSelect}
        onActiveOptionChange={onActiveOptionChange}
        onOpenChange={onOpenChange}
      >
        <PickerOptions grouped />
      </Dropdown>
      <button type="button">After</button>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('combobox', { name: 'Project', exact: true });
  await userEvent.click(screen.getByRole('button', { name: 'Before', exact: true }));
  await userEvent.hover(screen.getByRole('button', { name: 'Before', exact: true }));
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}{Home}{ArrowDown}');
  const active = htmlElement(trigger).getAttribute('aria-activedescendant');
  expect(document.getElementById(active ?? '')?.textContent).toBe('Beta');
  expect(document.getElementById(active ?? '')?.getAttribute('aria-disabled')).toBe('true');
  await userEvent.keyboard('{Enter}');
  expect(onOptionSelect).not.toHaveBeenCalled();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await userEvent.keyboard('{ArrowDown}');
  const gammaActiveId = htmlElement(trigger).getAttribute('aria-activedescendant');
  await userEvent.keyboard('{Enter}');
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['gamma'],
  });
  await expect.element(trigger).toHaveTextContent('Gamma');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  const activeData = onActiveOptionChange.mock.calls
    .filter((call) => call[1].nextOption?.value === 'gamma')
    .at(-1)?.[1];
  expect(activeData?.type).toBe('change');
  expect(activeData?.nextOption?.value).toBe('gamma');
  expect(activeData?.nextOption?.text).toBe('Gamma');
  expect(activeData?.nextOption?.id).toBe(gammaActiveId);
  expect(activeData?.event.type).toBe('activedescendantchange');
  expect(onOpenChange.mock.calls.some((call) => call[1].open)).toBe(true);
  await userEvent.click(trigger);
  await userEvent.keyboard('d{Enter}');
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'delta',
    optionText: 'Delta',
    selectedOptions: ['delta'],
  });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'After', exact: true }));
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test.each([false, true])('controlled selection and clearing preserve button=%s', async (button) => {
  const onOptionSelect = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      {button ? (
        <DropdownSelectionFlow variant="button" onOptionSelect={onOptionSelect} />
      ) : (
        <DropdownSelectionFlow onOptionSelect={onOptionSelect} />
      )}
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('combobox', { name: 'Project access' });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('option', { name: 'Alpha', exact: true }));
  await expect.element(trigger).toHaveTextContent('Alpha');
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'alpha',
    optionText: 'Alpha',
    selectedOptions: ['alpha'],
  });
  const inlineLabel = htmlElement(trigger).querySelector('[data-inline-label]');
  if (!inlineLabel) throw new Error('Missing inline label');
  expect(getComputedStyle(inlineLabel, '::after').content).toBe('":"');
  await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: undefined,
    optionText: undefined,
    selectedOptions: [],
  });
  await expect.element(trigger).toHaveFocus();
  await expect
    .element(screen.getByRole('status', { name: 'Selected access' }))
    .toBeEmptyDOMElement();
  expect(getComputedStyle(inlineLabel, '::after').content).toBe('none');
});

test('multiselect keeps popup open and exact option order without exposing clear controls', async () => {
  const onOptionSelect = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <DropdownSelectionFlow multiselect onOptionSelect={onOptionSelect} />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('combobox', { name: 'Project access' });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Alpha', exact: true }));
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Gamma', exact: true }));
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['alpha', 'gamma'],
  });
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(trigger).toHaveTextContent('Alpha, Gamma');
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Alpha', exact: true }));
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'alpha',
    optionText: 'Alpha',
    selectedOptions: ['gamma'],
  });
  await expect
    .element(screen.getByRole('button', { name: 'Clear selection' }))
    .not.toBeInTheDocument();
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After project access' })).toHaveFocus();
});

test('controlled open requests do not create a second open-state model', async () => {
  const onOpenChange = vi.fn<NonNullable<DropdownProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Dropdown aria-label="Controlled" open={false} onOpenChange={onOpenChange}>
        <PickerOptions />
      </Dropdown>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('combobox', { name: 'Controlled' });
  await userEvent.click(trigger);
  expect(onOpenChange).toHaveBeenLastCalledWith(expect.anything(), { open: true });
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
});

test('explicit null expand and clear slots are never recreated by styling', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Dropdown
        aria-label="No glyph"
        clearable
        value="Alpha"
        selectedOptions={['alpha']}
        expandIcon={null}
        clearButton={null}
      />
    </CoreAIFluentProvider>,
  );
  const root = htmlElement(screen.getByRole('combobox', { name: 'No glyph' })).parentElement;
  expect(root?.querySelector('.fui-Dropdown__expandIcon')).toBeNull();
  expect(root?.querySelector('.fui-Dropdown__clearButton')).toBeNull();
});

test('native CSS anchors follow ancestor relocation and expose collision fallbacks', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div data-relocation="" style={{ padding: 8, marginTop: 100 }}>
        <Dropdown
          aria-label="Anchored"
          defaultOpen
          root={{ style: { width: 280 } }}
          positioning={{ position: 'below', align: 'start', matchTargetSize: 'width', offset: 0 }}
        >
          <PickerOptions />
        </Dropdown>
      </div>
    </CoreAIFluentProvider>,
  );
  const trigger = htmlElement(screen.getByRole('combobox', { name: 'Anchored' }));
  const root = trigger.closest('.fui-Dropdown');
  const popup = htmlElement(screen.getByRole('listbox'));
  if (!(root instanceof HTMLElement)) throw new Error('Missing anchored root');
  await expect.poll(() => popup.matches(':popover-open')).toBe(true);
  expect(popup.style.getPropertyValue('position-try-fallbacks')).toContain('flip-block');
  const before = popup.getBoundingClientRect();
  const ancestor = screen.container.querySelector('[data-relocation]');
  if (!(ancestor instanceof HTMLElement)) throw new Error('Missing relocation ancestor');
  ancestor.style.marginTop = '137px';
  await expect.poll(() => popup.getBoundingClientRect().top - before.top).toBe(37);
  expect(popup.getBoundingClientRect().top - root.getBoundingClientRect().bottom).toBe(0);
  expect(popup.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width);
  const top = root.getBoundingClientRect().top;
  ancestor.style.marginTop = `${137 + window.innerHeight - top - 48}px`;
  await expect
    .poll(() => popup.getBoundingClientRect().bottom <= root.getBoundingClientRect().top)
    .toBe(true);
});

test('preserves current native default placement rather than restoring legacy Popper defaults', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ marginTop: 300 }}>
        <Dropdown aria-label="Native default" defaultOpen>
          <PickerOptions />
        </Dropdown>
      </div>
    </CoreAIFluentProvider>,
  );
  const popup = htmlElement(screen.getByRole('listbox'));
  await expect.poll(() => popup.matches(':popover-open')).toBe(true);
  expect(popup.style.getPropertyValue('position')).toBe('fixed');
  expect(popup.style.getPropertyValue('position-area')).toBe('block-start');
  expect(popup.style.getPropertyValue('width')).toBe('');
});

test('keeps ref, class, caller button/listbox renderers, data attributes and custom icons', async () => {
  const forwarded = React.createRef<HTMLButtonElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const listboxRef = React.createRef<HTMLDivElement>();
  type ButtonSlotProps = ExtractSlotProps<DropdownSlots['button']>;
  type PopupProps = ExtractSlotProps<DropdownSlots['listbox']>;
  const renderButton: SlotRenderFunction<ButtonSlotProps> = (Component, props) => (
    <Component {...props} data-custom-button="">
      {props.children}
    </Component>
  );
  const renderPopup: SlotRenderFunction<PopupProps> = (Component, props) => (
    <Component {...props} data-custom-listbox="" />
  );
  const rootSlot: ExtractSlotProps<DropdownSlots['root']> & { 'data-custom-root': string } = {
    ref: rootRef,
    className: 'consumer-root',
    'data-custom-root': 'yes',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Dropdown
        aria-label="Custom picker"
        ref={forwarded}
        defaultOpen
        label="Project"
        className="consumer-picker"
        root={rootSlot}
        button={{ ref: buttonRef, className: 'consumer-button', children: renderButton }}
        listbox={{ ref: listboxRef, className: 'consumer-listbox', children: renderPopup }}
        expandIcon={<span data-custom-glyph="">+</span>}
      >
        <PickerOptions />
      </Dropdown>
    </CoreAIFluentProvider>,
  );
  const trigger = htmlElement(screen.getByRole('combobox', { name: 'Custom picker' }));
  expect(forwarded.current).toBe(trigger);
  expect(buttonRef.current).toBe(trigger);
  expect(rootRef.current).toBe(trigger.parentElement);
  expect(trigger).toHaveClass(dropdownClassNames.button, 'consumer-button');
  expect(rootRef.current).toHaveClass(dropdownClassNames.root, 'consumer-root');
  expect(rootRef.current).not.toHaveClass('consumer-picker');
  expect(rootRef.current).toHaveAttribute('data-custom-root', 'yes');
  expect(trigger).toHaveAttribute('data-custom-button', '');
  expect(trigger.querySelector('[data-inline-label]')?.textContent).toBe('Project');
  expect(trigger.querySelector('[data-custom-glyph]')?.textContent).toBe('+');
  expect(listboxRef.current).toHaveClass(
    'fui-Listbox',
    dropdownClassNames.listbox,
    'consumer-listbox',
  );
  expect(listboxRef.current).toHaveAttribute('data-custom-listbox', '');
});

test('Field supplies ARIA validation and descriptions without inventing a native select form entry', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <OptionPickerFormFlow />
    </CoreAIFluentProvider>,
  );
  const form = htmlElement(screen.getByRole('form', { name: 'Project preferences' }));
  if (!(form instanceof HTMLFormElement)) throw new Error('Missing preferences form');
  const trigger = screen.getByRole('combobox', { name: 'Access preset' });
  await expect.element(trigger).toHaveAttribute('aria-required', 'true');
  expect(htmlElement(trigger).hasAttribute('required')).toBe(false);
  expect([...new FormData(form).entries()]).toEqual([['project', 'Alpha']]);
  await userEvent.click(trigger);
  await userEvent.keyboard('{End}{Enter}');
  await expect.element(trigger).toHaveTextContent('Delta');
  form.reset();
  await expect.element(trigger).toHaveTextContent('Delta');
  expect([...new FormData(form).entries()]).toEqual([['project', 'Alpha']]);
});

test('DropdownButton size and circular default stay distinct from nested Button defaults', async () => {
  const screen = await render(
    <CoreAIFluentProvider withComponentDefaults={false}>
      <Field label="Sort order" size="large">
        <DropdownButton label="Sort by">
          <PickerOptions />
        </DropdownButton>
      </Field>
    </CoreAIFluentProvider>,
  );
  const trigger = htmlElement(screen.getByRole('combobox', { name: 'Sort order' }));
  const root = trigger.closest('.fui-DropdownButton');
  expect(root).toHaveAttribute('data-appearance', 'secondary');
  expect(root).toHaveAttribute('data-shape', 'circular');
  expect(root).toHaveAttribute('data-size', 'medium');
  expect(trigger).toHaveAttribute('data-size', 'large');
});

test.each([
  ['Dropdown', Dropdown],
  ['DropdownButton', DropdownButton],
] as const)(
  '%s keeps Field native naming ahead of its inline visual label',
  async (_name, Control) => {
    const screen = await render(
      <CoreAIFluentProvider>
        <Field
          label="Project field"
          required
          validationState="error"
          validationMessage="Choose a project"
          hint="Use an available workspace"
        >
          <Control label="Inline project">
            <PickerOptions />
          </Control>
        </Field>
      </CoreAIFluentProvider>,
    );
    const trigger = htmlElement(screen.getByRole('combobox', { name: 'Project field' }));
    expect(trigger.getAttribute('aria-labelledby')).toBeNull();
    expect(trigger).toHaveAttribute('aria-required', 'true');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    const descriptions = (trigger.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent);
    expect(descriptions).toContain('Choose a project');
    expect(descriptions).toContain('Use an available workspace');
    expect(trigger.querySelector('[data-inline-label]')?.textContent).toBe('Inline project');
  },
);

test('public typed facade components retain their native trigger refs', () => {
  expectTypeOf(Dropdown).toMatchTypeOf<ForwardRefComponent<DropdownProps>>();
  expectTypeOf(DropdownButton).toMatchTypeOf<ForwardRefComponent<DropdownButtonProps>>();
  expectTypeOf<React.ComponentPropsWithRef<typeof Dropdown>['ref']>().toEqualTypeOf<
    React.Ref<HTMLButtonElement> | undefined
  >();
});
