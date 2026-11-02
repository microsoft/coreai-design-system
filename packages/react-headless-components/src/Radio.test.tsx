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
import {
  Radio as RawRadio,
  RadioGroup as RawRadioGroup,
} from '@fluentui/react-headless-components-preview/radio-group';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  RadioGroupComparison,
  radioGroupConsumerExample,
  radioGroupExamples,
  type RadioGroupExample,
} from '../../../apps/storybook/src/stories/experiments/RadioGroupComparison.js';
import {
  captureRadioGroupStyles,
  captureRadioStyles,
  compareRadioGroupStyles,
  getComparisonRadioGroup,
  getRadioSlots,
  settleRadioGroupStyles,
} from '../../../apps/storybook/src/stories/experiments/compareRadioGroupStyles.js';
import {
  Radio,
  radioClassNames,
  type RadioOnChangeData,
  type RadioProps,
  type RadioSlots,
} from './Radio.js';
import { RadioGroup } from './RadioGroup.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: RadioGroupExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <RadioGroupComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  const parking = screen.getByText('Case', { exact: true });
  await userEvent.hover(parking);
  const legacy = getComparisonRadioGroup(screen.container, 'legacy');
  const headless = getComparisonRadioGroup(screen.container, 'headless');
  await Promise.all([settleRadioGroupStyles(legacy), settleRadioGroupStyles(headless)]);
  return { screen, parking, legacy, headless };
}

test('ignores at most 0.5 CSSpx of allocation noise only in captured rectangle dimensions', () => {
  expect(
    compareRadioGroupStyles(
      {
        'group.width': '389.33',
        'group.height': '100.00',
        'radio0.input.width': '32.00',
        'label.height': '20.50',
      },
      {
        'group.width': '389.34',
        'group.height': '100.50',
        'radio0.input.width': '32.01',
        'label.height': '20.00',
      },
    ),
  ).toEqual([]);
});

test('reports over-threshold or missing dimensions and keeps CSS property strings exact', () => {
  expect(
    compareRadioGroupStyles(
      {
        'group.width': '389.33',
        'radio0.indicator.height': '16.51',
        'radio0.label.height': '20.00',
        'radio0.label.font-size': '14px',
        'radio0.dot.width': '16px',
        'radio0.custom-dot.opacity': '0.00',
        'radio0.offset-left': '0.00',
        'root.width': '32px',
      },
      {
        'group.width': '389.84',
        'radio0.indicator.height': '16.00',
        'radio0.label.font-size': '14.01px',
        'radio0.dot.width': '16.01px',
        'radio0.custom-dot.opacity': '0.01',
        'radio0.offset-left': '0.01',
        'root.width': '32.01px',
      },
    ),
  ).toEqual([
    { property: 'group.width', legacy: '389.33', headless: '389.84' },
    { property: 'radio0.indicator.height', legacy: '16.51', headless: '16.00' },
    { property: 'radio0.label.height', legacy: '20.00', headless: null },
    { property: 'radio0.label.font-size', legacy: '14px', headless: '14.01px' },
    { property: 'radio0.dot.width', legacy: '16px', headless: '16.01px' },
    { property: 'radio0.custom-dot.opacity', legacy: '0.00', headless: '0.01' },
    { property: 'radio0.offset-left', legacy: '0.00', headless: '0.01' },
    { property: 'root.width', legacy: '32px', headless: '32.01px' },
  ]);
});

for (const [mode, theme] of themes) {
  test.each(radioGroupExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareRadioGroupStyles(captureRadioGroupStyles(legacy), captureRadioGroupStyles(headless)),
    ).toEqual([]);
    expect(headless.radios.length).toBe(legacy.radios.length);
    for (const [index, radio] of headless.radios.entries()) {
      const oldRadio = legacy.radios[index];
      expect(radio.input.id).not.toBe(oldRadio.input.id);
      expect(radio.input.name).not.toBe(oldRadio.input.name);
      expect(radio.input.checked).toBe(oldRadio.input.checked);
      expect(radio.input.disabled).toBe(oldRadio.input.disabled);
      expect(radio.input.required).toBe(oldRadio.input.required);
      expect(radio.root.hasAttribute('data-disabled')).toBe(radio.input.disabled);
      expect(radio.label?.control ?? null).toBe(radio.label ? radio.input : null);
      expect(radio.indicator).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test.each([false, true])(
    `matches real pointer-down checked=%s styles in ${mode} mode`,
    async (checked) => {
      const frames: Record<string, Record<string, string>> = {};
      const active: Record<string, boolean> = {};
      const hovered: Record<string, boolean> = {};
      const onMouseDown: RadioProps['onMouseDown'] = (event) => {
        const root = event.currentTarget.parentElement;
        const kind = root
          ?.closest('[data-radiogroup-implementation]')
          ?.getAttribute('data-radiogroup-implementation');
        if (!(root instanceof HTMLSpanElement) || !kind) {
          throw new Error('Missing pressed Radio fixture');
        }
        active[kind] = event.currentTarget.matches(':active');
        hovered[kind] = event.currentTarget.matches(':hover');
        frames[kind] = captureRadioStyles(getRadioSlots(root));
      };
      const { legacy, headless } = await renderPair(
        {
          name: 'Pointer press',
          props: { value: checked ? 'standard' : '' },
          radios: [{ value: 'standard', label: 'Standard', onMouseDown }],
        },
        theme,
      );
      const resting = captureRadioStyles(headless.radios[0]);
      await userEvent.click(legacy.radios[0].input);
      await userEvent.click(headless.radios[0].input);
      expect(active).toEqual({ legacy: true, headless: true });
      expect(hovered).toEqual({ legacy: true, headless: true });
      expect(compareRadioGroupStyles(frames.legacy, frames.headless)).toEqual([]);
      expect(frames.headless['indicator.border-top-color']).not.toBe(
        resting['indicator.border-top-color'],
      );
    },
  );

  test.each([false, true])(
    `matches checked=%s hover, native keyboard focus, and focused hover in ${mode} mode`,
    async (checked) => {
      const { legacy, headless, parking } = await renderPair(
        {
          name: 'Interaction',
          props: { value: checked ? 'standard' : '' },
          radios: [{ value: 'standard', label: 'Standard' }],
        },
        theme,
      );
      const oldRadio = legacy.radios[0];
      const newRadio = headless.radios[0];
      const resting = captureRadioStyles(newRadio);

      await userEvent.hover(oldRadio.input);
      expect(oldRadio.input.matches(':hover')).toBe(true);
      await settleRadioGroupStyles(legacy);
      const hovered = captureRadioStyles(oldRadio);
      await userEvent.hover(newRadio.input);
      expect(newRadio.input.matches(':hover')).toBe(true);
      await settleRadioGroupStyles(headless);
      expect(compareRadioGroupStyles(hovered, captureRadioStyles(newRadio))).toEqual([]);
      expect(hovered['indicator.border-top-color']).not.toBe(resting['indicator.border-top-color']);

      await userEvent.hover(parking);
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(oldRadio.input).toHaveFocus();
      expect(oldRadio.root.matches(':hover')).toBe(false);
      expect(oldRadio.input.matches(':focus-visible')).toBe(true);
      await expect.poll(() => getComputedStyle(oldRadio.root, '::after').content).toBe('""');
      await settleRadioGroupStyles(legacy);
      const focused = captureRadioStyles(oldRadio);
      await userEvent.hover(oldRadio.input);
      expect(oldRadio.input.matches(':hover')).toBe(true);
      const focusedHover = captureRadioStyles(oldRadio);

      await userEvent.hover(parking);
      await userEvent.tab();
      await expect.element(newRadio.input).toHaveFocus();
      expect(newRadio.root.matches(':hover')).toBe(false);
      expect(newRadio.input.matches(':focus-visible')).toBe(true);
      await settleRadioGroupStyles(headless);
      expect(compareRadioGroupStyles(focused, captureRadioStyles(newRadio))).toEqual([]);
      await userEvent.hover(newRadio.input);
      expect(newRadio.input.matches(':hover')).toBe(true);
      await settleRadioGroupStyles(headless);
      expect(compareRadioGroupStyles(focusedHover, captureRadioStyles(newRadio))).toEqual([]);
    },
  );

  test.each([false, true])(
    `keeps disabled checked=%s styles and selection during hover and label activation in ${mode}`,
    async (checked) => {
      const onChange = vi.fn();
      const { legacy, headless } = await renderPair(
        {
          name: 'Unavailable',
          props: { disabled: true, defaultValue: checked ? 'standard' : undefined, onChange },
          radios: [{ value: 'standard', label: 'Standard', onChange }],
        },
        theme,
      );
      await userEvent.hover(legacy.radios[0].input);
      expect(legacy.radios[0].input.matches(':hover')).toBe(true);
      const expected = captureRadioStyles(legacy.radios[0]);
      await userEvent.hover(headless.radios[0].input);
      expect(headless.radios[0].input.matches(':hover')).toBe(true);
      expect(compareRadioGroupStyles(expected, captureRadioStyles(headless.radios[0]))).toEqual([]);
      for (const { radios } of [legacy, headless]) {
        const { input, label } = radios[0];
        if (!label) throw new Error('Missing disabled Radio label');
        await userEvent.click(label, { force: true });
        expect(input.disabled).toBe(true);
        expect(input.checked).toBe(checked);
        await expect.element(input).not.toHaveFocus();
      }
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  test(`lets ordinary CSS override group, input, indicator, Label, and required marker in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(radioGroupConsumerExample, theme);
    const group = captureRadioGroupStyles(headless);
    const radio = captureRadioStyles(headless.radios[0]);
    expect(group['group.flex-direction']).toBe('row');
    expect(group['group.gap']).toBe('12px');
    expect(radio['input.width']).toBe('44.00');
    expect(radio['input.cursor']).toBe('crosshair');
    expect(radio['indicator.width']).toBe('24.00');
    expect(radio['indicator.height']).toBe('24.00');
    expect(radio['indicator.border-radius']).toBe('3px');
    expect(radio['indicator.border-top-width']).toBe('2px');
    expect(radio['indicator.border-top-color']).toBe('rgb(40, 110, 60)');
    expect(radio['label.color']).toBe('rgb(20, 90, 160)');
    expect(radio['label.font-size']).toBe('18px');
    expect(radio['label.line-height']).toBe('26px');
    expect(radio['label.padding-left']).toBe('12px');
    expect(radio['required.color']).toBe('rgb(40, 110, 60)');
    expect(radio['required.padding-left']).toBe('10px');
    expect(compareRadioGroupStyles(captureRadioGroupStyles(legacy), group).length).toBeGreaterThan(
      0,
    );
  });
}

test('exposes native Radio props, exact change data, a void input slot, and public refs without inventing a size', () => {
  expectTypeOf<typeof Radio>().toEqualTypeOf<ForwardRefComponent<RadioProps>>();
  expectTypeOf<RadioOnChangeData>().toEqualTypeOf<{ value: string }>();
  expectTypeOf<RadioProps['labelPosition']>().toEqualTypeOf<'after' | 'below' | undefined>();
  expectTypeOf<ExtractSlotProps<RadioSlots['input']>['children']>().toEqualTypeOf<undefined>();
  expectTypeOf<'size' extends keyof RadioProps ? true : false>().toEqualTypeOf<false>();
});

test.each(['vertical', 'horizontal-stacked'] as const)(
  'keeps RTL input alignment, label spacing, and group geometry for %s',
  async (layout) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'RTL',
        props: { layout, defaultValue: 'standard' },
        radios: [{ value: 'standard', label: { children: 'Standard', required: true } }],
      },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(
      compareRadioGroupStyles(captureRadioGroupStyles(legacy), captureRadioGroupStyles(headless)),
    ).toEqual([]);
    const radio = headless.radios[0];
    if (layout === 'vertical') {
      expect(getComputedStyle(radio.label!).paddingRight).toBe('4px');
      expect(getComputedStyle(radio.label!).paddingLeft).toBe('8px');
      const rootRect = radio.root.getBoundingClientRect();
      const inputRect = radio.input.getBoundingClientRect();
      expect(inputRect.right).toBe(rootRect.right);
    }
    expect(getComputedStyle(radio.required!).paddingRight).toBe('4px');
    expect(getComputedStyle(radio.required!).paddingLeft).toBe('0px');
  },
);

test('keeps the CSS default dot and consumer-indicator visibility tied to native checked state', async () => {
  const example = radioGroupExamples.find((item) => item.name === 'Consumer indicator children');
  if (!example) throw new Error('Missing shared custom-indicator fixture');
  const { legacy, headless } = await renderPair(example);
  for (const pair of [legacy, headless]) {
    expect(getComputedStyle(pair.radios[0].indicator, '::after').content).toBe('none');
    expect(
      getComputedStyle(pair.radios[0].indicator.querySelector('[data-custom-dot]')!).opacity,
    ).toBe('0');
    expect(
      getComputedStyle(pair.radios[1].indicator.querySelector('[data-custom-dot]')!).opacity,
    ).toBe('1');
    await userEvent.click(pair.radios[0].input);
    expect(pair.radios[0].input.checked).toBe(true);
    expect(pair.radios[1].input.checked).toBe(false);
    expect(
      getComputedStyle(pair.radios[0].indicator.querySelector('[data-custom-dot]')!).opacity,
    ).toBe('1');
    expect(
      getComputedStyle(pair.radios[1].indicator.querySelector('[data-custom-dot]')!).opacity,
    ).toBe('0');
  }
});

test('preserves native refs, consumer slot props, classes, and exact input/item/group callbacks', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const indicatorRef = React.createRef<HTMLDivElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const rootProps: ExtractSlotProps<RadioSlots['root']> & { 'data-root': string } = {
    ref: rootRef,
    'data-root': 'preserved',
  };
  const order: string[] = [];
  const inputChange = vi.fn(() => order.push('input'));
  const itemChange = vi.fn(() => order.push('item'));
  const groupChange = vi.fn(() => order.push('group'));
  const screen = await render(
    <CoreAIFluentProvider>
      <RadioGroup name="plans" aria-label="Plans" onChange={groupChange}>
        <Radio
          ref={inputRef}
          value="top-level"
          className="consumer-radio"
          data-native="preserved"
          root={rootProps}
          input={{
            id: 'radio-slot-id',
            name: 'slot-name',
            value: 'slot-value',
            className: 'consumer-input',
            onChange: inputChange,
          }}
          indicator={{ ref: indicatorRef, className: 'consumer-indicator', title: 'Indicator' }}
          label={{
            ref: labelRef,
            children: 'Custom plan',
            className: 'consumer-label',
            required: true,
          }}
          onChange={itemChange}
        />
      </RadioGroup>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('radio', { name: 'Custom plan' });
  const node = inputRef.current;
  expect(node).toBeInstanceOf(HTMLInputElement);
  expect(node).toHaveAttribute('id', 'radio-slot-id');
  expect(node).toHaveAttribute('name', 'slot-name');
  expect(node).toHaveAttribute('value', 'slot-value');
  expect(node).toHaveAttribute('data-native', 'preserved');
  expect(node).toHaveClass(radioClassNames.input, 'consumer-input');
  expect(rootRef.current).toHaveClass(radioClassNames.root, 'consumer-radio');
  expect(rootRef.current).toHaveAttribute('data-root', 'preserved');
  expect(indicatorRef.current).toHaveClass(radioClassNames.indicator, 'consumer-indicator');
  expect(indicatorRef.current).toHaveAttribute('title', 'Indicator');
  expect(labelRef.current).toHaveClass(radioClassNames.label, 'fui-Label', 'consumer-label');
  expect(labelRef.current?.control).toBe(node);
  await userEvent.click(labelRef.current!);
  await expect.element(input).toBeChecked();
  expect(inputChange).toHaveBeenCalledTimes(1);
  expect(itemChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'slot-value' });
  expect(groupChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'slot-value' });
  expect(order).toEqual(['input', 'item', 'group']);
  await userEvent.click(input);
  expect(itemChange).toHaveBeenCalledTimes(1);
  expect(groupChange).toHaveBeenCalledTimes(1);
});

test('keeps public root/indicator/Label render functions, refs, native metadata, and required styling', async () => {
  const rootRef = React.createRef<HTMLSpanElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<RadioSlots['root']>> = (
    Component,
    slotProps,
  ) => <Component {...slotProps} data-rendered-root="" />;
  const renderIndicator: SlotRenderFunction<ExtractSlotProps<RadioSlots['indicator']>> = (
    Component,
    slotProps,
  ) => <Component {...slotProps} data-rendered-indicator="" />;
  const renderLabel: SlotRenderFunction<ExtractSlotProps<RadioSlots['label']>> = (
    Component,
    slotProps,
  ) => (
    <Component {...slotProps} data-rendered-label="">
      Rendered plan
    </Component>
  );
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <RadioGroup name="rendered-plans" aria-label="Rendered plans">
        <Radio
          ref={inputRef}
          value="rendered"
          root={{ ref: rootRef, children: renderRoot, className: 'rendered-root' }}
          indicator={{ children: renderIndicator, className: 'rendered-indicator' }}
          label={{
            ref: labelRef,
            children: renderLabel,
            className: 'rendered-label',
            size: 'large',
            weight: 'semibold',
            required: { children: '(required)', className: 'rendered-required' },
          }}
          onChange={onChange}
        />
      </RadioGroup>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('radio', { name: 'Rendered plan' });
  expect(rootRef.current).toHaveAttribute('data-rendered-root', '');
  expect(rootRef.current).toHaveClass(radioClassNames.root, 'rendered-root');
  const slots = getRadioSlots(rootRef.current!);
  expect(slots.input).toBe(inputRef.current);
  expect(slots.indicator).toHaveAttribute('data-rendered-indicator', '');
  expect(slots.indicator).toHaveClass(radioClassNames.indicator, 'rendered-indicator');
  expect(labelRef.current).toBe(slots.label);
  expect(slots.label).toHaveAttribute('data-rendered-label', '');
  expect(slots.label).toHaveClass('fui-Label', radioClassNames.label, 'rendered-label');
  expect(slots.label?.control).toBe(slots.input);
  expect(slots.required).toHaveClass('fui-Label__required', 'rendered-required');
  expect(slots.required).toHaveAttribute('aria-hidden', 'true');
  expect(slots.required?.textContent).toBe('(required)');
  expect(getComputedStyle(slots.label!).fontSize).toBe('16px');
  expect(getComputedStyle(slots.required!).paddingLeft).toBe('4px');
  expect(getComputedStyle(slots.required!).color).not.toBe(getComputedStyle(slots.label!).color);
  await userEvent.click(slots.label!);
  await expect.element(input).toBeChecked();
  expect(getComputedStyle(slots.indicator, '::after').content).toBe('""');
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'rendered' });
});

test('preserves explicit native input-ref precedence from the current raw public hook', async () => {
  const examples = [
    { name: 'headless', Group: RadioGroup, Item: Radio },
    { name: 'raw', Group: RawRadioGroup, Item: RawRadio },
  ].map((family) => ({
    ...family,
    forwarded: React.createRef<HTMLInputElement>(),
    native: React.createRef<HTMLInputElement>(),
  }));
  const screen = await render(
    <CoreAIFluentProvider>
      {examples.map(({ name, Group, Item, forwarded, native }) => (
        <Group key={name} name={`ref-${name}`} aria-label={`Ref ${name}`}>
          <Item ref={forwarded} input={{ ref: native }} value="team" label={`Team ${name}`} />
        </Group>
      ))}
    </CoreAIFluentProvider>,
  );
  for (const { name, forwarded, native } of examples) {
    expect(forwarded.current).toBe(null);
    expect(native.current).toBeInstanceOf(HTMLInputElement);
    await expect.element(screen.getByRole('radio', { name: `Team ${name}` })).toBeEnabled();
    expect(native.current).toHaveAttribute('name', `ref-${name}`);
  }
});
