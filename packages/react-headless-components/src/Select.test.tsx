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
import { Field, coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  SelectComparison,
  selectAppearances,
  selectConsumerExample,
  selectExamples,
  selectGroupedOptions,
  selectOptions,
  type SelectExample,
} from '../../../apps/storybook/src/stories/experiments/SelectComparison.js';
import {
  captureSelectStyles,
  compareSelectStyles,
  getComparisonSelect,
  getSelectSlots,
  settleSelectStyles,
} from '../../../apps/storybook/src/stories/experiments/compareSelectStyles.js';
import {
  Select,
  selectClassNames,
  type SelectOnChangeData,
  type SelectProps,
  type SelectSlots,
} from './Select.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SelectExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <SelectComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonSelect(screen.container, 'legacy');
  const headless = getComparisonSelect(screen.container, 'headless');
  await Promise.all([settleSelectStyles(legacy), settleSelectStyles(headless)]);
  return { screen, legacy, headless };
}

function nativeSelect(container: ParentNode, name: string): HTMLSelectElement {
  const select = container.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
  if (!select) throw new Error(`Missing native select named ${name}`);
  return select;
}

for (const [mode, theme] of themes) {
  test.each(selectExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareSelectStyles(captureSelectStyles(legacy), captureSelectStyles(headless))).toEqual(
      [],
    );
    const oldSelect = getSelectSlots(legacy).select;
    const newSelect = getSelectSlots(headless).select;
    expect(oldSelect.id).not.toBe(newSelect.id);
    expect(newSelect.value).toBe(oldSelect.value);
    expect([...newSelect.options].map((option) => option.selected)).toEqual(
      [...oldSelect.options].map((option) => option.selected),
    );
  });

  test.each(selectAppearances)(`matches %s on hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      { name: appearance, props: { appearance } },
      theme,
    );
    await userEvent.hover(getSelectSlots(legacy).select);
    expect(getSelectSlots(legacy).select.matches(':hover')).toBe(true);
    await settleSelectStyles(legacy);
    const expected = captureSelectStyles(legacy);
    await userEvent.hover(getSelectSlots(headless).select);
    expect(getSelectSlots(headless).select.matches(':hover')).toBe(true);
    await settleSelectStyles(headless);
    expect(compareSelectStyles(expected, captureSelectStyles(headless))).toEqual([]);
  });

  test.each(selectAppearances)(
    `matches %s with keyboard focus and focused hover in ${mode} mode`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        { name: appearance, props: { appearance } },
        theme,
      );
      const neutral = screen.getByText('Case', { exact: true });
      await userEvent.tab();
      await expect.element(getSelectSlots(legacy).select).toHaveFocus();
      await userEvent.hover(neutral);
      expect(legacy.matches(':hover')).toBe(false);
      expect(getSelectSlots(legacy).select.matches(':focus-visible')).toBe(true);
      await settleSelectStyles(legacy);
      const focused = captureSelectStyles(legacy);
      await userEvent.hover(getSelectSlots(legacy).select);
      expect(legacy.matches(':hover')).toBe(true);
      await settleSelectStyles(legacy);
      const focusedHover = captureSelectStyles(legacy);

      await userEvent.tab();
      await expect.element(getSelectSlots(headless).select).toHaveFocus();
      await userEvent.hover(neutral);
      expect(headless.matches(':hover')).toBe(false);
      expect(getSelectSlots(headless).select.matches(':focus-visible')).toBe(true);
      await settleSelectStyles(headless);
      expect(compareSelectStyles(focused, captureSelectStyles(headless))).toEqual([]);
      await userEvent.hover(getSelectSlots(headless).select);
      expect(headless.matches(':hover')).toBe(true);
      await settleSelectStyles(headless);
      expect(compareSelectStyles(focusedHover, captureSelectStyles(headless))).toEqual([]);
      expect(captureSelectStyles(headless)['root.after.transform']).toBe(
        'matrix(1, 0, 0, 1, 0, 0)',
      );
    },
  );

  test.each(selectAppearances)(
    `keeps disabled invalid %s styles on hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, disabled: true, 'aria-invalid': true } },
        theme,
      );
      await userEvent.hover(getSelectSlots(legacy).select);
      expect(legacy.matches(':hover')).toBe(true);
      const expected = captureSelectStyles(legacy);
      await userEvent.hover(getSelectSlots(headless).select);
      expect(headless.matches(':hover')).toBe(true);
      expect(compareSelectStyles(expected, captureSelectStyles(headless))).toEqual([]);
      expect(getComputedStyle(getSelectSlots(headless).select).cursor).toBe('not-allowed');
    },
  );

  test.each(['outline', 'underline'] as const)(
    `matches invalid %s borders before and during keyboard focus in ${mode} mode`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        { name: 'Invalid focus', props: { appearance, 'aria-invalid': true } },
        theme,
      );
      await userEvent.hover(getSelectSlots(legacy).select);
      const invalid = captureSelectStyles(legacy);
      await userEvent.hover(getSelectSlots(headless).select);
      expect(compareSelectStyles(invalid, captureSelectStyles(headless))).toEqual([]);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      await userEvent.tab();
      await expect.element(getSelectSlots(legacy).select).toHaveFocus();
      await settleSelectStyles(legacy);
      const focused = captureSelectStyles(legacy);
      expect(focused['select.border-bottom-color']).not.toBe(invalid['select.border-bottom-color']);
      await userEvent.tab();
      await expect.element(getSelectSlots(headless).select).toHaveFocus();
      await settleSelectStyles(headless);
      expect(compareSelectStyles(focused, captureSelectStyles(headless))).toEqual([]);
    },
  );
}

test('exposes current visual props, native change data, and the public forward-ref contract', () => {
  expectTypeOf<SelectProps['appearance']>().toEqualTypeOf<
    'outline' | 'underline' | 'filled-darker' | 'filled-lighter' | undefined
  >();
  expectTypeOf<SelectProps['size']>().toEqualTypeOf<'small' | 'medium' | 'large' | undefined>();
  expectTypeOf<SelectOnChangeData>().toEqualTypeOf<{ value: string }>();
  expectTypeOf<typeof Select>().toEqualTypeOf<ForwardRefComponent<SelectProps>>();
  expectTypeOf<'shape' extends keyof SelectProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<'readOnly' extends keyof SelectProps ? true : false>().toEqualTypeOf<false>();
});

test('does not apply CoreAI defaults outside the provider', async () => {
  const screen = await render(<Select name="outside">{selectOptions}</Select>);
  const select = nativeSelect(screen.container, 'outside');
  expect(select.closest('.fui-Select')).toHaveAttribute('data-appearance', 'outline');
  expect(select.value).toBe('red');
});

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {}, enabled: 'filled-darker', disabled: 'outline' },
    {
      name: 'explicit undefined',
      props: { appearance: undefined },
      enabled: 'outline',
      disabled: 'outline',
    },
    {
      name: 'explicit filled-lighter',
      props: { appearance: 'filled-lighter' as const },
      enabled: 'filled-lighter',
      disabled: 'filled-lighter',
    },
  ])(
    `preserves $name appearance with CoreAI defaults ${withComponentDefaults ? 'on' : 'off'}`,
    async ({ name, props, enabled, disabled }) => {
      const { legacy, headless } = await renderPair(
        { name, props },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(headless.getAttribute('data-appearance')).toBe(
        withComponentDefaults ? enabled : disabled,
      );
      expect(
        compareSelectStyles(captureSelectStyles(legacy), captureSelectStyles(headless)),
      ).toEqual([]);
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'matches %s logical padding and chevron position in RTL',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: 'RTL', props: { size, appearance: 'underline' } },
      coreaiDarkTheme,
      true,
      'rtl',
    );
    expect(compareSelectStyles(captureSelectStyles(legacy), captureSelectStyles(headless))).toEqual(
      [],
    );
    const { select, icon } = getSelectSlots(headless);
    expect(parseFloat(getComputedStyle(select).paddingLeft)).toBeGreaterThan(
      parseFloat(getComputedStyle(select).paddingRight),
    );
    if (!icon) throw new Error('Missing RTL chevron slot');
    const rootRect = headless.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    expect(iconRect.left - rootRect.left).toBeLessThan(rootRect.right - iconRect.right);
  },
);

test('allows ordinary consumer CSS Modules to override root, select, and icon styles', async () => {
  const { headless } = await renderPair(selectConsumerExample);
  const { select, icon } = getSelectSlots(headless);
  expect(getComputedStyle(headless).minWidth).toBe('220px');
  expect(getComputedStyle(select).backgroundColor).toBe('rgb(232, 240, 255)');
  expect(getComputedStyle(select).color).toBe('rgb(32, 48, 96)');
  expect(getComputedStyle(select).borderRadius).toBe('3px');
  expect(getComputedStyle(select).paddingInlineStart).toBe('18px');
  expect(getComputedStyle(select).paddingInlineEnd).toBe('44px');
  if (!icon) throw new Error('Missing consumer chevron slot');
  expect(getComputedStyle(icon).color).toBe('rgb(72, 32, 128)');
  expect(getComputedStyle(icon).fontSize).toBe('16px');
  expect(getComputedStyle(icon).width).toBe('16px');
  expect(getComputedStyle(icon).insetInlineEnd).toBe('14px');
});

test('preserves native refs, caller slot render functions, classes, children, and handlers', async () => {
  const selectRef = React.createRef<HTMLSelectElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const onKeyDown = vi.fn();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<SelectSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-root="">
      {props.children}
      <span className="select-consumer-root-child" />
    </Component>
  );
  const renderNative: SlotRenderFunction<ExtractSlotProps<SelectSlots['select']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-select="" />;
  const renderIcon: SlotRenderFunction<ExtractSlotProps<SelectSlots['icon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-icon="">
      {props.children}
      <span className="select-consumer-icon-child" />
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <Select
        ref={selectRef}
        aria-label="Custom slots"
        name="color"
        defaultValue="green"
        className="select-consumer-root"
        style={{ maxWidth: '300px' }}
        size="small"
        appearance="outline"
        root={{ ref: rootRef, children: renderRoot }}
        select={{
          id: 'select-slot-id',
          className: 'select-consumer-select',
          children: renderNative,
        }}
        icon={{ ref: iconRef, className: 'select-consumer-icon', children: renderIcon }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      >
        <option value="red">Red</option>
        <option value="green" className="select-consumer-option">
          Green
        </option>
      </Select>
      <button type="button">Next</button>
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'color');
  const root = select.closest<HTMLElement>('.fui-Select');
  if (!root) throw new Error('Missing custom root');
  const { icon } = getSelectSlots(root);
  expect(selectRef.current).toBe(select);
  expect(rootRef.current).toBe(root);
  expect(iconRef.current).toBe(icon);
  expect(root.tagName).toBe('SPAN');
  expect(select.tagName).toBe('SELECT');
  expect(root).toHaveClass(selectClassNames.root, 'select-consumer-root');
  expect(select).toHaveClass(selectClassNames.select, 'select-consumer-select');
  expect(icon).toHaveClass(selectClassNames.icon, 'select-consumer-icon');
  expect(root.style.maxWidth).toBe('300px');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(select).toHaveAttribute('data-rendered-select', '');
  expect(icon).toHaveAttribute('data-rendered-icon', '');
  expect(select.id).toBe('select-slot-id');
  expect(select.value).toBe('green');
  expect(select.selectedOptions[0]).toHaveClass('select-consumer-option');
  expect(icon?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  for (const child of root.querySelectorAll('[class^="select-consumer-"]')) {
    if (child === select || child === icon) continue;
    expect(child).not.toHaveClass(
      selectClassNames.root,
      selectClassNames.select,
      selectClassNames.icon,
    );
  }
  for (const element of [root, select]) {
    expect(element.hasAttribute('appearance')).toBe(false);
    expect(element.hasAttribute('size')).toBe(false);
  }
  await userEvent.tab();
  await expect.element(select).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(onKeyDown).toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('keeps global markers unstyled and applies them only to the owned slots', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <style>{`
        .select-global-consumer .fui-Select { max-width: 280px; }
        .select-global-consumer .fui-Select__select { border-radius: 9px; }
        .select-global-consumer .fui-Select__icon { color: rgb(20, 40, 60); }
      `}</style>
      <div className="select-global-consumer">
        <Select name="color" icon={<span className="select-child-icon">⌄</span>}>
          {selectOptions}
        </Select>
      </div>
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'color');
  const root = select.closest<HTMLElement>('.fui-Select');
  if (!root) throw new Error('Missing globally targeted root');
  const { icon } = getSelectSlots(root);
  expect(getComputedStyle(root).maxWidth).toBe('280px');
  expect(getComputedStyle(select).borderRadius).toBe('9px');
  if (!icon) throw new Error('Missing globally targeted icon');
  expect(getComputedStyle(icon).color).toBe('rgb(20, 40, 60)');
  expect(icon.querySelector('.select-child-icon')).not.toHaveClass(selectClassNames.icon);
});

test('styles resolved native slot state without overwriting headless state attributes', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Select
        name="resolved"
        disabled
        required
        aria-invalid
        size="large"
        select={{ disabled: false, required: false, 'aria-invalid': 'grammar' }}
        icon={null}
      >
        {selectOptions}
      </Select>
      <Select name="disabled" select={{ disabled: true, 'aria-invalid': true }}>
        {selectOptions}
      </Select>
    </CoreAIFluentProvider>,
  );
  const resolved = nativeSelect(screen.container, 'resolved');
  const root = resolved.closest<HTMLElement>('.fui-Select');
  if (!root) throw new Error('Missing resolved root');
  expect(resolved.disabled).toBe(false);
  expect(resolved.required).toBe(false);
  expect(root).not.toHaveAttribute('data-disabled');
  expect(root).not.toHaveAttribute('data-required');
  expect(root).not.toHaveAttribute('data-has-icon');
  expect(root).toHaveAttribute('data-invalid', 'grammar');
  expect(root).toHaveAttribute('data-size', 'large');
  expect(getSelectSlots(root).icon).toBeNull();
  expect(getComputedStyle(resolved).cursor).toBe('pointer');
  const disabled = nativeSelect(screen.container, 'disabled');
  const disabledRoot = disabled.closest<HTMLElement>('.fui-Select');
  expect(disabledRoot).toHaveAttribute('data-disabled', '');
  expect(disabledRoot).toHaveAttribute('data-invalid', '');
  expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
});

test('inherits Field validation, labeling, descriptions, required state, and visual size', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field
        label="Project color"
        size="large"
        required
        validationState="error"
        validationMessage="Choose a color"
        hint="Shown beside the project"
      >
        <Select name="color" defaultValue="">
          <option value="">Choose…</option>
          {selectOptions}
        </Select>
      </Field>
      <Field label="Explicit small" size="large">
        <Select name="small" size="small">
          {selectOptions}
        </Select>
      </Field>
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'color');
  const root = select.closest<HTMLElement>('.fui-Select');
  expect(screen.getByRole('combobox', { name: 'Project color', exact: false }).element()).toBe(
    select,
  );
  expect(select.required).toBe(true);
  expect(select.validity.valueMissing).toBe(true);
  expect(select).toHaveAttribute('aria-invalid', 'true');
  expect(select).toHaveAccessibleDescription('Choose a color Shown beside the project');
  expect(root).toHaveAttribute('data-invalid', '');
  expect(root).toHaveAttribute('data-required', '');
  expect(root).toHaveAttribute('data-size', 'large');
  expect(getComputedStyle(select).height).toBe('40px');
  const small = nativeSelect(screen.container, 'small');
  expect(small.closest('.fui-Select')).toHaveAttribute('data-size', 'small');
  expect(getComputedStyle(small).height).toBe('24px');
  await userEvent.selectOptions(select, 'green');
  expect(select.validity.valid).toBe(true);
});

test('keeps keyboard selection, native events, controlled values, and submitted form data', async () => {
  const observed: { target: EventTarget; currentTarget: HTMLSelectElement; value: string }[] = [];
  const onChange = vi.fn(
    (event: React.ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
      observed.push({
        target: event.target,
        currentTarget: event.currentTarget,
        value: data.value,
      });
    },
  );
  const onInput = vi.fn();
  const onSlotChange = vi.fn();
  const onSubmit = vi.fn();
  function ControlledForm() {
    const [value, setValue] = React.useState('red');
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget).get('color'));
        }}
      >
        <label htmlFor="select-controlled">Color</label>
        <Select
          id="select-controlled"
          name="color"
          value={value}
          onInput={onInput}
          select={{ onChange: onSlotChange }}
          onChange={(event, data) => {
            onChange(event, data);
            setValue(data.value);
          }}
        >
          {selectOptions}
        </Select>
        <button type="submit">Save</button>
        <button type="button" onClick={() => setValue('blue')}>
          Choose blue
        </button>
      </form>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <ControlledForm />
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'color');
  expect(select.value).toBe('red');
  await userEvent.tab();
  await expect.element(select).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(select).toHaveValue('green');
  expect(observed).toEqual([{ target: select, currentTarget: select, value: 'green' }]);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'green' });
  expect(onInput).toHaveBeenCalledTimes(1);
  // The current public hook owns onChange; a native slot callback does not replace it.
  expect(onSlotChange).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Choose blue', exact: true }));
  await expect.element(select).toHaveValue('blue');
  expect(onChange).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(onSubmit).toHaveBeenLastCalledWith('blue');
  expect([...select.selectedOptions].map((option) => option.value)).toEqual(['blue']);
});

test('retains defaultValue, optgroups, native reset, disabled form exclusion, and unchanged reset callbacks', async () => {
  const onChange = vi.fn();
  const onDisabledChange = vi.fn();
  const onSubmit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit([...new FormData(event.currentTarget).entries()]);
        }}
      >
        <Select name="color" aria-label="Color" defaultValue="green" onChange={onChange}>
          {selectGroupedOptions}
        </Select>
        <Select
          name="disabledColor"
          aria-label="Disabled color"
          disabled
          onChange={onDisabledChange}
        >
          {selectOptions}
        </Select>
        <button type="submit">Save</button>
        <button type="reset">Reset</button>
      </form>
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'color');
  const disabled = nativeSelect(screen.container, 'disabledColor');
  expect(select.value).toBe('green');
  expect(select.options[1].defaultSelected).toBe(true);
  expect(select.querySelector('optgroup[label="Later"]')).toHaveAttribute('disabled');
  expect(select.options[3].disabled).toBe(true);
  await userEvent.selectOptions(select, 'red');
  expect(select.value).toBe('red');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'red' });
  await userEvent.click(disabled, { force: true });
  await expect.element(disabled).not.toHaveFocus();
  expect(onDisabledChange).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(onSubmit).toHaveBeenLastCalledWith([['color', 'red']]);
  await userEvent.click(screen.getByRole('button', { name: 'Reset', exact: true }));
  await expect.element(select).toHaveValue('green');
  expect([...select.selectedOptions].map((option) => option.value)).toEqual(['green']);
  expect(onChange).toHaveBeenCalledTimes(1);
});

test('preserves native slot refs, numeric list size, multiple selected options, and form values', async () => {
  const ref = React.createRef<HTMLSelectElement>();
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form>
        <Select
          name="colors"
          aria-label="Colors"
          multiple
          defaultValue={['green']}
          size="large"
          select={{ ref, size: 3 }}
          onChange={onChange}
        >
          {selectOptions}
        </Select>
      </form>
    </CoreAIFluentProvider>,
  );
  const select = nativeSelect(screen.container, 'colors');
  expect(ref.current).toBe(select);
  expect(select.size).toBe(3);
  expect(select.multiple).toBe(true);
  expect(select.closest('.fui-Select')).toHaveAttribute('data-size', 'large');
  expect([...select.selectedOptions].map((option) => option.value)).toEqual(['green']);
  await userEvent.selectOptions(select, ['red', 'blue']);
  expect([...select.selectedOptions].map((option) => option.value)).toEqual(['red', 'blue']);
  if (!select.form) throw new Error('Missing native form owner');
  expect(new FormData(select.form).getAll('colors')).toEqual(['red', 'blue']);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'red' });
});
