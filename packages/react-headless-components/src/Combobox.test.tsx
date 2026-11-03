// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Combobox as RawCombobox,
  Option as RawOption,
} from '@fluentui/react-headless-components-preview/combobox';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  ComboboxQueryFlow,
  PickerOptions,
  comboboxExamples,
  pickerAppearances,
  pickerConsumerExample,
  pickerOptions,
} from '../../../apps/storybook/src/stories/experiments/OptionPickerComparison.js';
import {
  captureOptionPickerNativeContract,
  captureOptionPickerStyles,
  compareOptionPickerStyles,
  getPickerTrigger,
  settleOptionPickerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareOptionPickerStyles.js';
import {
  Combobox,
  comboboxClassNames,
  type ComboboxProps,
  type ComboboxSlots,
} from './Combobox.js';
import { Field } from './Field.js';
import { Option } from './Option.js';
import {
  htmlElement,
  nativeInput,
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
  test.each(comboboxExamples)(`matches $name in ${mode} mode`, async (example) => {
    const { legacy, headless, headlessPopup, differences } = await renderPickerPair(example, theme);
    expect(differences()).toEqual([]);
    expect(nativeInput(headless).value).toBe(nativeInput(legacy).value);
    expect(nativeInput(headless).disabled).toBe(nativeInput(legacy).disabled);
    expect(nativeInput(headless).readOnly).toBe(nativeInput(legacy).readOnly);
    if (headlessPopup) {
      const contract = captureOptionPickerNativeContract(headless, headlessPopup);
      expect(contract.popover).toBe('auto');
      expect(contract.open).toBe('true');
      expect(contract.position).toBe('fixed');
      expect(contract.positionAnchor).toBe(contract.anchor);
    }
  });

  test.each(pickerAppearances)(`matches %s hover/focus in ${mode} mode`, async (appearance) => {
    const { screen, legacy, headless } = await renderPickerPair(
      { name: appearance, kind: 'combobox', props: { appearance, defaultValue: 'Alpha' } },
      theme,
    );
    const sentinel = screen.getByText('Current CoreAI / Griffel', { exact: true });
    await userEvent.hover(nativeInput(legacy));
    expect(legacy.matches(':hover')).toBe(true);
    await settleOptionPickerStyles(legacy);
    const hovered = captureOptionPickerStyles(legacy, null);
    await userEvent.hover(nativeInput(headless));
    expect(headless.matches(':hover')).toBe(true);
    await settleOptionPickerStyles(headless);
    expect(compareOptionPickerStyles(hovered, captureOptionPickerStyles(headless, null))).toEqual(
      [],
    );
    await userEvent.hover(sentinel);
    await userEvent.tab();
    expect(nativeInput(legacy)).toHaveFocus();
    expect(legacy.matches(':hover')).toBe(false);
    await settleOptionPickerStyles(legacy);
    const focused = captureOptionPickerStyles(legacy, null);
    nativeInput(headless).focus();
    expect(nativeInput(headless).matches(':focus-visible')).toBe(true);
    await settleOptionPickerStyles(headless);
    expect(compareOptionPickerStyles(focused, captureOptionPickerStyles(headless, null))).toEqual(
      [],
    );
  });
}

test.each([true, false])('keeps actual defaults with defaultsEnabled=%s', async (enabled) => {
  for (const props of [{}, { appearance: undefined, size: undefined }] satisfies ComboboxProps[]) {
    const { differences, headless } = await renderPickerPair(
      { name: 'Defaults', kind: 'combobox', props },
      coreaiLightTheme,
      enabled,
    );
    expect(differences()).toEqual([]);
    expect(headless).toHaveAttribute('data-appearance', 'filled-darker');
    expect(headless).toHaveAttribute('data-size', 'medium');
    await cleanup();
  }
});

test.each(['outline, small', 'Inline label with value', 'Clearable selection'])(
  'matches logical RTL for %s',
  async (name) => {
    const example = comboboxExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error(`Unknown fixture ${name}`);
    const { differences } = await renderPickerPair(example, coreaiLightTheme, true, 'rtl');
    expect(differences()).toEqual([]);
  },
);

test('preserves query onChange and exact selection payloads without a second filter state', async () => {
  const onChange = vi.fn<NonNullable<ComboboxProps['onChange']>>();
  const onOptionSelect = vi.fn<NonNullable<ComboboxProps['onOptionSelect']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <ComboboxQueryFlow onChange={onChange} onOptionSelect={onOptionSelect} />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('combobox', { name: 'Find a project' });
  await userEvent.click(input);
  await userEvent.type(input, 'Gam');
  expect(onChange).toHaveBeenCalledTimes(3);
  expect(onChange.mock.calls[0]).toHaveLength(1);
  expect(onChange.mock.calls[0][0].type).toBe('change');
  expect(onChange.mock.calls[0][0].target).toBe(input.element());
  await expect.element(screen.getByRole('option', { name: 'Gamma', exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('option', { name: 'Alpha', exact: true }))
    .not.toBeInTheDocument();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['gamma'],
  });
  await expect.element(input).toHaveValue('Gamma');
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  await expect
    .element(screen.getByRole('status', { name: 'Selected project' }))
    .toHaveTextContent('gamma');
});

test('keeps current freeform and empty-results behavior', async () => {
  const onOptionSelect = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <ComboboxQueryFlow freeform onOptionSelect={onOptionSelect} />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('combobox', { name: 'Find a project' });
  await userEvent.click(input);
  await userEvent.type(input, 'Unlisted');
  await expect
    .element(screen.getByRole('option', { name: 'No matching projects' }))
    .toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Escape}');
  await userEvent.click(screen.getByRole('button', { name: 'After project query' }));
  await expect.element(input).toHaveValue('Unlisted');
  expect(onOptionSelect).not.toHaveBeenCalled();
});

test('keeps the current multiselect display contract rather than legacy editable-input behavior', async () => {
  const onOptionSelect = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Combobox
        aria-label="Multiple projects"
        multiselect
        defaultOpen
        defaultSelectedOptions={['alpha', 'gamma']}
        defaultValue="Alpha, Gamma"
        onOptionSelect={onOptionSelect}
      >
        <PickerOptions />
      </Combobox>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('combobox', { name: 'Multiple projects' });
  await expect.element(input).toHaveValue('Alpha, Gamma');
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Alpha', exact: true }));
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'alpha',
    optionText: 'Alpha',
    selectedOptions: ['gamma'],
  });
  await expect.element(input).toHaveValue('Gamma');
  await expect.element(input).toHaveAttribute('aria-expanded', 'true');
});

test('null and explicit empty icon slots remain opted out', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Combobox
        aria-label="No glyph"
        clearable
        value="Alpha"
        selectedOptions={['alpha']}
        expandIcon={null}
        clearIcon={{ children: false }}
      />
    </CoreAIFluentProvider>,
  );
  const root = htmlElement(screen.getByRole('combobox', { name: 'No glyph' })).parentElement;
  expect(root?.querySelector('.fui-Combobox__expandIcon')).toBeNull();
  expect(root?.querySelector('.fui-Combobox__clearIcon svg')).toBeNull();
});

test('keeps the accessible expand slot keyboard and click-only activation contract', async () => {
  const onOpenChange = vi.fn<NonNullable<ComboboxProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Combobox aria-label="Project" onOpenChange={onOpenChange}>
        <PickerOptions />
      </Combobox>
      <button type="button">After picker</button>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('combobox', { name: 'Project', exact: true });
  const expand = screen.getByRole('button', { name: 'Open Project', exact: true });
  htmlElement(expand).focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveFocus();
  await expect.element(input).toHaveAttribute('aria-expanded', 'true');
  expect(onOpenChange.mock.calls.map((call) => call[1])).toEqual([{ open: true }]);
  await userEvent.keyboard('{Escape}');
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  expect(onOpenChange.mock.calls.map((call) => call[1])).toEqual([{ open: true }, { open: false }]);
  htmlElement(expand).click();
  await expect.element(input).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'After picker' }));
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
});

test('preserves caller refs, classes, input props, and supported root/listbox/icon renderers', async () => {
  const forwarded = React.createRef<HTMLInputElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const popupRef = React.createRef<HTMLDivElement>();
  type RootProps = ExtractSlotProps<ComboboxSlots['root']>;
  type PopupProps = ExtractSlotProps<ComboboxSlots['listbox']>;
  type IconProps = ExtractSlotProps<ComboboxSlots['expandIcon']>;
  const rootRender = vi.fn<SlotRenderFunction<RootProps>>((Component, props) => (
    <Component {...props} data-custom-root="">
      {props.children}
    </Component>
  ));
  const popupRender = vi.fn<SlotRenderFunction<PopupProps>>((Component, props) => (
    <Component {...props} data-custom-popup="" />
  ));
  const iconRender: SlotRenderFunction<IconProps> = (Component, props) => (
    <Component {...props} data-custom-expand="">
      <span aria-hidden>v</span>
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <Combobox
        ref={forwarded}
        label="Project"
        className="consumer-picker"
        data-custom-control="retained"
        defaultOpen
        input={{ ref: inputRef, className: 'consumer-input', 'aria-label': 'Named input' }}
        root={{ ref: rootRef, className: 'consumer-root', children: rootRender }}
        listbox={{ ref: popupRef, className: 'consumer-popup', children: popupRender }}
        expandIcon={{ className: 'consumer-expand', children: iconRender }}
      >
        <PickerOptions />
      </Combobox>
    </CoreAIFluentProvider>,
  );
  const input = htmlElement(screen.getByRole('combobox', { name: 'Named input' }));
  expect(forwarded.current).toBe(input);
  expect(inputRef.current).toBe(input);
  expect(rootRef.current).toBe(input.parentElement);
  expect(input).toHaveClass(comboboxClassNames.input, 'consumer-input');
  expect(rootRef.current).toHaveClass(comboboxClassNames.root, 'consumer-root');
  expect(rootRef.current).not.toHaveClass('consumer-picker');
  expect(rootRef.current).toHaveAttribute('data-custom-root', '');
  expect(input).toHaveAttribute('data-custom-control', 'retained');
  expect(popupRef.current).toHaveClass('fui-Listbox', comboboxClassNames.listbox, 'consumer-popup');
  expect(popupRef.current).toHaveAttribute('data-custom-popup', '');
  expect(rootRef.current?.querySelector('[data-custom-expand]')).toHaveClass('consumer-expand');
  expect(rootRef.current?.querySelector('label')?.htmlFor).toBe(input.id);
  expect(rootRender).toHaveBeenCalled();
  expect(popupRender).toHaveBeenCalled();
});

test('Field preserves required, validation descriptions, size, and explicit names', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field
        label="Project field"
        required
        size="large"
        validationState="error"
        validationMessage="Choose a project"
        hint="Use an available workspace"
      >
        <Combobox label="Inline project" aria-label="Explicit project" />
      </Field>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('combobox', { name: 'Explicit project' });
  await expect.element(input).toBeRequired();
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  const node = nativeInput(screen.container);
  expect(node.closest('.fui-Combobox')).toHaveAttribute('data-size', 'large');
  const descriptions = (node.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent);
  expect(descriptions).toContain('Choose a project');
  expect(descriptions).toContain('Use an available workspace');
});

test('native form submission and reset stay equivalent to the public primitive', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <form aria-label="Wrapper form">
        <Combobox
          name="wrapper"
          aria-label="Wrapper"
          defaultValue="Alpha"
          defaultSelectedOptions={['alpha']}
        >
          <PickerOptions />
        </Combobox>
      </form>
      <form aria-label="Raw form">
        <RawCombobox
          name="raw"
          aria-label="Raw"
          defaultValue="Alpha"
          defaultSelectedOptions={['alpha']}
        >
          {pickerOptions.map((option) => (
            <RawOption key={option.value} value={option.value}>
              {option.text}
            </RawOption>
          ))}
        </RawCombobox>
      </form>
    </CoreAIFluentProvider>,
  );
  for (const [name, field] of [
    ['Wrapper form', 'wrapper'],
    ['Raw form', 'raw'],
  ] as const) {
    const form = htmlElement(screen.getByRole('form', { name }));
    if (!(form instanceof HTMLFormElement)) throw new Error('Missing native form');
    const input = nativeInput(form);
    await userEvent.click(input);
    await userEvent.keyboard('{End}{Enter}');
    expect(input.value).toBe('Delta');
    expect([...new FormData(form).entries()]).toEqual([[field, 'Delta']]);
    form.reset();
    expect(input.value).toBe('Delta');
  }
});

test('consumer CSS overrides root/input/popup/option/group styles without raising specificity', async () => {
  const { headless, headlessPopup } = await renderPickerPair(pickerConsumerExample('combobox'));
  expect(getComputedStyle(headless).minWidth).toBe('300px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(getPickerTrigger(headless)).paddingInlineStart).toBe('18px');
  if (!headlessPopup) throw new Error('Missing consumer popup');
  expect(getComputedStyle(headlessPopup).paddingTop).toBe('8px');
  const option = headlessPopup.querySelector('.fui-Option');
  const check = headlessPopup.querySelector('.fui-Option__checkIcon');
  const group = headlessPopup.querySelector('.fui-OptionGroup__label');
  if (!option || !check || !group) throw new Error('Missing consumer family slots');
  expect(getComputedStyle(option).paddingTop).toBe('9px');
  expect(getComputedStyle(check).color).toBe('rgb(128, 48, 32)');
  expect(getComputedStyle(group).color).toBe('rgb(72, 32, 128)');
});

test('public component and ref types remain current', () => {
  expectTypeOf(Combobox).toMatchTypeOf<ForwardRefComponent<ComboboxProps>>();
  expectTypeOf<React.ComponentPropsWithRef<typeof Combobox>['ref']>().toEqualTypeOf<
    React.Ref<HTMLInputElement> | undefined
  >();
  expectTypeOf(Option).toMatchTypeOf<ForwardRefComponent<React.ComponentProps<typeof Option>>>();
});
