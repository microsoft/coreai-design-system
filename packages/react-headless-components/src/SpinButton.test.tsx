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
import { SpinButton as RawSpinButton } from '@fluentui/react-headless-components-preview/spin-button';
import { Field, coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  SpinButtonComparison,
  SpinButtonNumericFlow,
  SpinButtonValidationFlow,
  spinButtonAppearances,
  spinButtonConsumerExample,
  spinButtonExamples,
  spinButtonSizes,
  type SpinButtonExample,
} from '../../../apps/storybook/src/stories/experiments/SpinButtonComparison.js';
import {
  captureSpinButtonStyles,
  compareSpinButtonStyles,
  getComparisonSpinButton,
  getSpinButtonSlots,
  settleSpinButtonStyles,
} from '../../../apps/storybook/src/stories/experiments/compareSpinButtonStyles.js';
import {
  SpinButton,
  spinButtonClassNames,
  type SpinButtonChangeEvent,
  type SpinButtonOnChangeData,
  type SpinButtonProps,
  type SpinButtonSlots,
} from './SpinButton.js';

afterEach(async () => {
  vi.useRealTimers();
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SpinButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <SpinButtonComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonSpinButton(screen.container, 'legacy');
  const headless = getComparisonSpinButton(screen.container, 'headless');
  await Promise.all([settleSpinButtonStyles(legacy), settleSpinButtonStyles(headless)]);
  return { screen, legacy, headless };
}

function nativeInput(container: ParentNode, name: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Missing native SpinButton input named ${name}`);
  return input;
}

function spinRoot(input: HTMLInputElement): HTMLElement {
  const root = input.closest<HTMLElement>('.fui-SpinButton');
  if (!root) throw new Error('Missing SpinButton root');
  return root;
}

for (const [mode, theme] of themes) {
  test.each(spinButtonExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareSpinButtonStyles(captureSpinButtonStyles(legacy), captureSpinButtonStyles(headless)),
    ).toEqual([]);
    const previous = getSpinButtonSlots(legacy);
    const current = getSpinButtonSlots(headless);
    expect(current.input.id).not.toBe(previous.input.id);
    expect(current.input.value).toBe(previous.input.value);
    expect(current.input.type).toBe(previous.input.type);
    expect(current.input.disabled).toBe(previous.input.disabled);
    expect(current.input.readOnly).toBe(previous.input.readOnly);
    expect(current.incrementButton.disabled).toBe(previous.incrementButton.disabled);
    expect(current.decrementButton.disabled).toBe(previous.decrementButton.disabled);
  });

  test.each(spinButtonAppearances)(`matches %s input hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      { name: appearance, props: { appearance, defaultValue: 4 } },
      theme,
    );
    await userEvent.hover(getSpinButtonSlots(legacy).input);
    expect(legacy.matches(':hover')).toBe(true);
    await settleSpinButtonStyles(legacy);
    const expected = captureSpinButtonStyles(legacy);
    await userEvent.hover(getSpinButtonSlots(headless).input);
    expect(headless.matches(':hover')).toBe(true);
    await settleSpinButtonStyles(headless);
    expect(compareSpinButtonStyles(expected, captureSpinButtonStyles(headless))).toEqual([]);
  });

  test.each(spinButtonAppearances)(
    `matches %s repeat-button hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, defaultValue: 4 } },
        theme,
      );
      for (const name of ['incrementButton', 'decrementButton'] as const) {
        await userEvent.hover(getSpinButtonSlots(legacy)[name]);
        expect(getSpinButtonSlots(legacy)[name].matches(':hover')).toBe(true);
        await settleSpinButtonStyles(legacy);
        const expected = captureSpinButtonStyles(legacy);
        await userEvent.hover(getSpinButtonSlots(headless)[name]);
        expect(getSpinButtonSlots(headless)[name].matches(':hover')).toBe(true);
        await settleSpinButtonStyles(headless);
        expect(compareSpinButtonStyles(expected, captureSpinButtonStyles(headless))).toEqual([]);
      }
    },
  );

  test.each(spinButtonAppearances)(
    `matches %s keyboard focus and focused hover in ${mode} mode`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, defaultValue: 4 } },
        theme,
      );
      const sentinel = screen.getByText('Case', { exact: true });
      await userEvent.tab();
      await expect.element(getSpinButtonSlots(legacy).input).toHaveFocus();
      await userEvent.hover(sentinel);
      expect(legacy.matches(':hover')).toBe(false);
      expect(getSpinButtonSlots(legacy).input.matches(':focus-visible')).toBe(true);
      await settleSpinButtonStyles(legacy);
      const focused = captureSpinButtonStyles(legacy);
      await userEvent.hover(getSpinButtonSlots(legacy).input);
      expect(legacy.matches(':hover')).toBe(true);
      await settleSpinButtonStyles(legacy);
      const focusedHover = captureSpinButtonStyles(legacy);

      await userEvent.tab();
      await expect.element(getSpinButtonSlots(headless).input).toHaveFocus();
      await userEvent.hover(sentinel);
      expect(headless.matches(':hover')).toBe(false);
      expect(getSpinButtonSlots(headless).input.matches(':focus-visible')).toBe(true);
      await settleSpinButtonStyles(headless);
      expect(compareSpinButtonStyles(focused, captureSpinButtonStyles(headless))).toEqual([]);
      expect(captureSpinButtonStyles(headless)['root.after.transform']).toBe(
        'matrix(1, 0, 0, 1, 0, 0)',
      );
      await userEvent.hover(getSpinButtonSlots(headless).input);
      expect(headless.matches(':hover')).toBe(true);
      await settleSpinButtonStyles(headless);
      expect(compareSpinButtonStyles(focusedHover, captureSpinButtonStyles(headless))).toEqual([]);
    },
  );

  test.each(spinButtonAppearances)(
    `matches %s held keyboard direction styles in ${mode} mode`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        { name: appearance, props: { appearance, defaultValue: 4 } },
        theme,
      );
      const sentinel = screen.getByText('Case', { exact: true });
      await userEvent.tab();
      await userEvent.keyboard('[ArrowUp>]');
      await userEvent.hover(sentinel);
      await settleSpinButtonStyles(legacy);
      const expected = captureSpinButtonStyles(legacy);
      expect(getSpinButtonSlots(legacy).input.value).toBe('5');
      await userEvent.keyboard('[/ArrowUp]');
      await userEvent.tab();
      await userEvent.keyboard('[ArrowUp>]');
      expect(headless).toHaveAttribute('data-spin-state', 'up');
      expect(getSpinButtonSlots(headless).input.value).toBe('5');
      await userEvent.hover(sentinel);
      await settleSpinButtonStyles(headless);
      expect(compareSpinButtonStyles(expected, captureSpinButtonStyles(headless))).toEqual([]);
      await userEvent.keyboard('[/ArrowUp]');
      expect(headless).not.toHaveAttribute('data-spin-state');
    },
  );

  test.each(spinButtonAppearances)(
    `keeps disabled invalid %s styles on hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        {
          name: appearance,
          props: { appearance, defaultValue: 4, disabled: true, 'aria-invalid': true },
        },
        theme,
      );
      await userEvent.hover(getSpinButtonSlots(legacy).input);
      expect(legacy.matches(':hover')).toBe(true);
      const expected = captureSpinButtonStyles(legacy);
      await userEvent.hover(getSpinButtonSlots(headless).input);
      expect(headless.matches(':hover')).toBe(true);
      expect(compareSpinButtonStyles(expected, captureSpinButtonStyles(headless))).toEqual([]);
      for (const name of ['incrementButton', 'decrementButton'] as const) {
        expect(getComputedStyle(getSpinButtonSlots(headless)[name]).cursor).toBe('not-allowed');
        expect(getSpinButtonSlots(headless)[name].disabled).toBe(true);
      }
    },
  );

  test('matches invalid borders before and during keyboard focus in ' + mode, async () => {
    const { screen, legacy, headless } = await renderPair(
      {
        name: 'Invalid focus',
        props: { appearance: 'outline', defaultValue: 4, 'aria-invalid': true },
      },
      theme,
    );
    const resting = captureSpinButtonStyles(headless);
    await userEvent.tab();
    await userEvent.hover(screen.getByText('Case', { exact: true }));
    await settleSpinButtonStyles(legacy);
    const focused = captureSpinButtonStyles(legacy);
    await userEvent.tab();
    await settleSpinButtonStyles(headless);
    expect(compareSpinButtonStyles(focused, captureSpinButtonStyles(headless))).toEqual([]);
    expect(captureSpinButtonStyles(headless)['root.before.border-bottom-color']).not.toBe(
      resting['root.before.border-bottom-color'],
    );
  });

  test.each(spinButtonSizes)(
    `matches %s logical RTL padding, button corners, and glyphs in ${mode} mode`,
    async (size) => {
      const { legacy, headless } = await renderPair(
        { name: size, props: { appearance: 'outline', size, defaultValue: 4 } },
        theme,
        true,
        'rtl',
      );
      expect(
        compareSpinButtonStyles(captureSpinButtonStyles(legacy), captureSpinButtonStyles(headless)),
      ).toEqual([]);
      const { input, incrementButton, decrementButton } = getSpinButtonSlots(headless);
      expect(input.getBoundingClientRect().left).toBeGreaterThan(
        incrementButton.getBoundingClientRect().left,
      );
      expect(getComputedStyle(incrementButton).borderTopLeftRadius).not.toBe('0px');
      expect(getComputedStyle(incrementButton).borderTopRightRadius).toBe('0px');
      expect(getComputedStyle(decrementButton).borderBottomLeftRadius).not.toBe('0px');
      expect(getComputedStyle(decrementButton).borderBottomRightRadius).toBe('0px');
      expect(getComputedStyle(headless).paddingRight).toBe(size === 'small' ? '8px' : '10px');
      expect(getComputedStyle(headless).paddingLeft).toBe('0px');
    },
  );

  test('gives ordinary consumer CSS priority on every owned slot in ' + mode, async () => {
    const { headless } = await renderPair(spinButtonConsumerExample, theme);
    const values = captureSpinButtonStyles(headless);
    expect(values['root.min-height']).toBe('44px');
    expect(values['root.border-radius']).toBe('3px');
    expect(values['root.background-color']).toBe('rgb(232, 240, 255)');
    expect(values['input.color']).toBe('rgb(32, 48, 96)');
    expect(values['input.padding-left']).toBe('12px');
    expect(values['incrementButton.color']).toBe('rgb(128, 48, 32)');
    expect(values['incrementButton.background-color']).toBe('rgb(255, 224, 192)');
    expect(values['decrementButton.color']).toBe('rgb(72, 32, 128)');
    expect(values['decrementButton.background-color']).toBe('rgb(224, 208, 255)');
    await userEvent.hover(getSpinButtonSlots(headless).incrementButton);
    expect(getComputedStyle(getSpinButtonSlots(headless).incrementButton).color).toBe(
      'rgb(128, 48, 32)',
    );
  });
}

test('exposes current numeric, slot, void-input, and forwarded-ref contracts without deprecated visual props', () => {
  expectTypeOf<typeof SpinButton>().toEqualTypeOf<ForwardRefComponent<SpinButtonProps>>();
  expectTypeOf<SpinButtonOnChangeData>().toEqualTypeOf<{
    value?: number | null;
    displayValue?: string;
  }>();
  expectTypeOf<SpinButtonChangeEvent>().toEqualTypeOf<
    | React.MouseEvent<HTMLButtonElement>
    | React.ChangeEvent<HTMLElement>
    | React.FocusEvent<HTMLInputElement>
    | React.KeyboardEvent<HTMLInputElement>
  >();
  expectTypeOf<ExtractSlotProps<SpinButtonSlots['input']>['children']>().toEqualTypeOf<undefined>();
  expectTypeOf<SpinButtonProps['size']>().toEqualTypeOf<'small' | 'medium' | undefined>();
  expectTypeOf<SpinButtonProps['stepPage']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<'pageStep' extends keyof SpinButtonProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<'format' extends keyof SpinButtonProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<
    'filled-darker-shadow' extends NonNullable<SpinButtonProps['appearance']> ? true : false
  >().toEqualTypeOf<false>();
});

test.each([
  { defaults: true, props: {}, appearance: 'filled-darker' },
  { defaults: true, props: { appearance: undefined }, appearance: 'outline' },
  { defaults: false, props: {}, appearance: 'outline' },
  { defaults: false, props: { appearance: undefined }, appearance: 'outline' },
  { defaults: false, props: { appearance: 'filled-lighter' }, appearance: 'filled-lighter' },
] satisfies {
  defaults: boolean;
  props: SpinButtonProps;
  appearance: NonNullable<SpinButtonProps['appearance']>;
}[])(
  'resolves defaults=$defaults and $appearance without forwarding visual props',
  async ({ defaults, props, appearance }) => {
    const { legacy, headless } = await renderPair(
      { name: appearance, props },
      coreaiLightTheme,
      defaults,
    );
    expect(headless).toHaveAttribute('data-appearance', appearance);
    expect(headless).toHaveAttribute('data-size', 'medium');
    expect(
      compareSpinButtonStyles(captureSpinButtonStyles(legacy), captureSpinButtonStyles(headless)),
    ).toEqual([]);
    const { input } = getSpinButtonSlots(headless);
    expect(input).not.toHaveAttribute('appearance');
    expect(input).not.toHaveAttribute('data-size');
    expect(input).not.toHaveAttribute('size');
    expect(input.size).toBe(20);
  },
);

test('keeps all captured CSS, offsets, dimensions, and missing values exact in the report', () => {
  expect(
    compareSpinButtonStyles(
      { 'root.rect.width': '240.00', 'root.before.left': '0px', 'input.color': '' },
      { 'root.rect.width': '240.01', 'root.before.left': '0.01px' },
    ),
  ).toEqual([
    { property: 'root.rect.width', legacy: '240.00', headless: '240.01' },
    { property: 'root.before.left', legacy: '0px', headless: '0.01px' },
    { property: 'input.color', legacy: '', headless: null },
  ]);
});

type DataInputSlot = ExtractSlotProps<SpinButtonSlots['input']> & {
  'data-spinbutton-native'?: string;
};
type DataRootSlot = ExtractSlotProps<SpinButtonSlots['root']> & {
  'data-spinbutton-container'?: string;
};

test('preserves the owned DOM markers, consumer classes, native attributes, glyphs, and forwarded input ref', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const incrementRef = React.createRef<HTMLButtonElement>();
  const decrementRef = React.createRef<HTMLButtonElement>();
  const inputSlot: DataInputSlot = {
    className: 'consumer-native',
    size: 23,
    title: 'Numeric entry',
    'data-spinbutton-native': 'kept',
  };
  const rootSlot: DataRootSlot = {
    ref: rootRef,
    'data-spinbutton-container': 'kept',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        ref={inputRef}
        root={rootSlot}
        className="consumer-container"
        name="native"
        aria-label="Project quantity"
        aria-describedby="quantity-hint"
        aria-valuetext="Four projects"
        autoComplete="on"
        defaultValue={4}
        min={0}
        max={10}
        size="small"
        appearance="underline"
        input={inputSlot}
        incrementButton={{ ref: incrementRef, className: 'consumer-increment' }}
        decrementButton={{ ref: decrementRef, className: 'consumer-decrement' }}
      />
      <p id="quantity-hint">Use a number from zero to ten</p>
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'native');
  const root = spinRoot(input);
  const slots = getSpinButtonSlots(root);
  expect(inputRef.current).toBe(input);
  expect(rootRef.current).toBe(root);
  expect(incrementRef.current).toBe(slots.incrementButton);
  expect(decrementRef.current).toBe(slots.decrementButton);
  expect(root.tagName).toBe('SPAN');
  expect(root).toHaveClass(spinButtonClassNames.root, 'consumer-container');
  expect(input).toHaveClass(spinButtonClassNames.input, 'consumer-native');
  expect(slots.incrementButton).toHaveClass(
    spinButtonClassNames.incrementButton,
    'consumer-increment',
  );
  expect(slots.decrementButton).toHaveClass(
    spinButtonClassNames.decrementButton,
    'consumer-decrement',
  );
  expect(input).toHaveAccessibleName('Project quantity');
  expect(input).toHaveAccessibleDescription('Use a number from zero to ten');
  expect(input).toHaveAttribute('data-spinbutton-native', 'kept');
  expect(root).toHaveAttribute('data-spinbutton-container', 'kept');
  expect(input.size).toBe(23);
  expect(input.type).toBe('text');
  expect(input.autocomplete).toBe('on');
  expect(input).toHaveAttribute('aria-valuemin', '0');
  expect(input).toHaveAttribute('aria-valuemax', '10');
  expect(input).toHaveAttribute('aria-valuenow', '4');
  expect(input).toHaveAttribute('aria-valuetext', 'Four projects');
  expect(input).not.toHaveAttribute('min');
  expect(input).not.toHaveAttribute('max');
  expect(input).not.toHaveAttribute('appearance');
  expect(slots.incrementButton.type).toBe('button');
  expect(slots.decrementButton.type).toBe('button');
  expect(slots.incrementButton.tabIndex).toBe(-1);
  expect(slots.decrementButton.tabIndex).toBe(-1);
  expect(slots.incrementButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(slots.decrementButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(root.querySelector('[data-tabster], [data-fui-focus-visible], [focusgroup]')).toBeNull();
  expect(root).not.toHaveAttribute('data-tabster');
});

const ConsumerSpan: ForwardRefComponent<React.ComponentPropsWithRef<'span'>> = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithRef<'span'>
>(function ConsumerSpan(props, ref) {
  return <span {...props} ref={ref} />;
});

test('preserves valid root and button render functions, resolved children, refs, and numeric actions', async () => {
  const rootRef = React.createRef<HTMLSpanElement>();
  const incrementRef = React.createRef<HTMLButtonElement>();
  const decrementRef = React.createRef<HTMLButtonElement>();
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<SpinButtonSlots['root']>> = (
    _Component,
    props,
  ) => <ConsumerSpan {...props} data-rendered-spinbutton="" />;
  const renderIncrement: SlotRenderFunction<
    ExtractSlotProps<SpinButtonSlots['incrementButton']>
  > = (Component, props) => <Component {...props} data-rendered-increment="" />;
  const renderDecrement: SlotRenderFunction<
    ExtractSlotProps<SpinButtonSlots['decrementButton']>
  > = (Component, props) => (
    <Component {...props} data-rendered-decrement="">
      <span className="consumer-decrement-child">−</span>
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="rendered"
        aria-label="Rendered quantity"
        defaultValue={4}
        onChange={onChange}
        root={{ ref: rootRef, children: renderRoot }}
        incrementButton={{ ref: incrementRef, children: renderIncrement }}
        decrementButton={{ ref: decrementRef, children: renderDecrement }}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'rendered');
  const root = spinRoot(input);
  const { incrementButton, decrementButton } = getSpinButtonSlots(root);
  expect(rootRef.current).toBe(root);
  expect(incrementRef.current).toBe(incrementButton);
  expect(decrementRef.current).toBe(decrementButton);
  expect(root).toHaveAttribute('data-rendered-spinbutton', '');
  expect(incrementButton).toHaveAttribute('data-rendered-increment', '');
  expect(decrementButton).toHaveAttribute('data-rendered-decrement', '');
  expect(incrementButton.querySelector('svg')).not.toBeNull();
  const child = decrementButton.querySelector('.consumer-decrement-child');
  expect(child).toHaveTextContent('−');
  for (const marker of Object.values(spinButtonClassNames)) {
    expect(child).not.toHaveClass(marker);
  }
  await userEvent.click(incrementButton);
  await expect.element(input).toHaveValue('5');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
    value: 5,
    displayValue: undefined,
  });
  await userEvent.click(decrementButton);
  await expect.element(input).toHaveValue('4');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
    value: 4,
    displayValue: undefined,
  });
});

test.each([
  ['raw public hook', RawSpinButton],
  ['styled port', SpinButton],
] as const)(
  'retains the %s forwarded-input-ref precedence over an explicit native slot ref',
  async (_name, Component) => {
    const forwardedRef = React.createRef<HTMLInputElement>();
    const slotRef = React.createRef<HTMLInputElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <Component
          ref={forwardedRef}
          name="ref-precedence"
          aria-label="Ref precedence"
          input={{ ref: slotRef }}
        />
      </CoreAIFluentProvider>,
    );
    const input = nativeInput(screen.container, 'ref-precedence');
    expect(forwardedRef.current).toBe(input);
    expect(slotRef.current).toBeNull();
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    expect(forwardedRef.current).toBe(input);
    expect(nativeInput(screen.container, 'ref-precedence')).toBe(input);
  },
);

test.each([
  ['raw public hook', RawSpinButton],
  ['styled port', SpinButton],
] as const)(
  'retains %s native input-slot overrides and the inherited repeat-button disabled precedence',
  async (_name, Component) => {
    const screen = await render(
      <CoreAIFluentProvider>
        <Component
          name="slot-flags"
          aria-label="Slot flags"
          disabled
          readOnly
          aria-invalid
          input={{ disabled: false, readOnly: false, 'aria-invalid': 'grammar' }}
        />
      </CoreAIFluentProvider>,
    );
    const input = nativeInput(screen.container, 'slot-flags');
    const root = input.parentElement;
    if (!root) throw new Error('Missing SpinButton root');
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(false);
    expect(input).toHaveAttribute('aria-invalid', 'grammar');
    expect(root).not.toHaveAttribute('data-disabled');
    expect(root).not.toHaveAttribute('data-readonly');
    expect(root).toHaveAttribute('data-invalid', 'grammar');
    // The pinned hook derives these button flags before resolving the input slot.
    const buttons = [...root.querySelectorAll('button')];
    expect(buttons).toHaveLength(2);
    expect(buttons.map((button) => button.disabled)).toEqual([true, true]);
  },
);

test('preserves native input callbacks, explicit slot-handler precedence, and single committed payloads', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const nativeChange = vi.fn<(type: string, value: string) => void>();
  const nativeInputEvent = vi.fn<(type: string, value: string) => void>();
  const topKeyDown = vi.fn();
  const slotKeyDown = vi.fn<(key: string) => void>();
  const buttonMouseDown = vi.fn<(type: string, tag: string, trusted: boolean) => void>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="callbacks"
        aria-label="Native callbacks"
        defaultValue={4}
        onChange={onChange}
        onKeyDown={topKeyDown}
        input={{
          onChange: (event) => nativeChange(event.type, event.currentTarget.value),
          onInput: (event) => nativeInputEvent(event.type, event.currentTarget.value),
          onKeyDown: (event) => slotKeyDown(event.key),
        }}
        incrementButton={{
          onMouseDown: (event) =>
            buttonMouseDown(event.type, event.currentTarget.tagName, event.isTrusted),
        }}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'callbacks');
  await userEvent.fill(input, '6');
  expect(nativeChange).toHaveBeenCalledExactlyOnceWith('change', '6');
  expect(nativeInputEvent).toHaveBeenCalledExactlyOnceWith('input', '6');
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.keyboard('{Enter}');
  expect(topKeyDown).not.toHaveBeenCalled();
  expect(slotKeyDown).toHaveBeenCalledExactlyOnceWith('Enter');
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
    value: undefined,
    displayValue: '6',
  });
  expect(onChange.mock.calls[0][0].type).toBe('keydown');
  await userEvent.click(getSpinButtonSlots(spinRoot(input)).incrementButton);
  expect(buttonMouseDown).toHaveBeenCalledExactlyOnceWith('mousedown', 'BUTTON', true);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
    value: 7,
    displayValue: undefined,
  });
  expect(onChange.mock.calls[1][0].type).toBe('mousedown');
  expect(onChange).toHaveBeenCalledTimes(2);
});

test('retains Field labeling, required validity, error descriptions, and SpinButton-specific size resolution', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field
        label="Project quantity"
        size="large"
        required
        validationState="error"
        validationMessage="Enter a quantity"
        hint="Choose zero to ten projects"
      >
        <SpinButton name="field" defaultValue={null} min={0} max={10} />
      </Field>
      <Field label="Small quantity" size="large">
        <SpinButton name="small-field" size="small" />
      </Field>
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'field');
  expect(screen.getByRole('spinbutton', { name: /Project quantity/ }).element()).toBe(input);
  expect(input.required).toBe(true);
  expect(input.validity.valueMissing).toBe(true);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Enter a quantity Choose zero to ten projects');
  expect(spinRoot(input)).toHaveAttribute('data-invalid', '');
  expect(spinRoot(input)).toHaveAttribute('data-size', 'medium');
  expect(getComputedStyle(spinRoot(input)).minHeight).toBe('32px');
  const small = nativeInput(screen.container, 'small-field');
  expect(spinRoot(small)).toHaveAttribute('data-size', 'small');
  expect(getComputedStyle(spinRoot(small)).minHeight).toBe('24px');
});

test('keeps edits uncommitted until Enter or blur, reverts Escape, and reports display-only commits exactly', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="editing"
        aria-label="Editable quantity"
        defaultValue={4}
        step={0.25}
        onChange={onChange}
      />
      <button type="button">Finish editing</button>
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'editing');
  await userEvent.fill(input, '7.25');
  expect(onChange).not.toHaveBeenCalled();
  expect(input).toHaveAttribute('aria-valuenow', '7.25');
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('7.25');
  expect(onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
    value: undefined,
    displayValue: '7.25',
  });
  await userEvent.fill(input, '9');
  await userEvent.keyboard('{Escape}');
  await expect.element(input).toHaveValue('7.25');
  expect(onChange).toHaveBeenCalledTimes(1);
  await userEvent.fill(input, '8.5');
  await userEvent.click(screen.getByRole('button', { name: 'Finish editing', exact: true }));
  await expect.element(input).toHaveValue('8.5');
  expect(onChange).toHaveBeenNthCalledWith(2, expect.anything(), {
    value: undefined,
    displayValue: '8.5',
  });
  expect(onChange.mock.calls[1][0].type).toBe('blur');
});

test('preserves the current distinction between typed bounds and clamped step changes', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="typed-bounds"
        aria-label="Bounded quantity"
        defaultValue={4}
        min={0}
        max={10}
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'typed-bounds');
  await userEvent.fill(input, '99');
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('99');
  expect(input.validity.rangeOverflow).toBe(false);
  expect(input.validity.valid).toBe(true);
  expect(onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
    value: undefined,
    displayValue: '99',
  });
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(input).toHaveValue('10');
  expect(onChange).toHaveBeenNthCalledWith(2, expect.anything(), {
    value: 10,
    displayValue: undefined,
  });
  expect(spinRoot(input)).toHaveAttribute('data-at-bound', 'max');
  expect(getSpinButtonSlots(spinRoot(input)).incrementButton.disabled).toBe(true);
});

test('lets controlled values and display text remain application-owned while emitting current numeric and text data', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="controlled"
        aria-label="Controlled quantity"
        value={5}
        displayValue="$5"
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'controlled');
  expect(input).toHaveAttribute('aria-valuetext', '$5');
  await userEvent.click(input);
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(input).toHaveValue('$5');
  expect(input).toHaveAttribute('aria-valuenow', '5');
  expect(onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
    value: 6,
    displayValue: undefined,
  });
  await userEvent.fill(input, '$7');
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('$5');
  expect(onChange).toHaveBeenNthCalledWith(2, expect.anything(), {
    value: undefined,
    displayValue: '$7',
  });
  await screen.rerender(
    <CoreAIFluentProvider>
      <SpinButton
        name="controlled"
        aria-label="Controlled quantity"
        value={9}
        displayValue="$9"
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  expect(nativeInput(screen.container, 'controlled')).toBe(input);
  await expect.element(input).toHaveValue('$9');
  expect(input).toHaveAttribute('aria-valuenow', '9');
  expect(input).toHaveAttribute('aria-valuetext', '$9');
  expect(onChange).toHaveBeenCalledTimes(2);
});

test('ignores later uncontrolled defaults and non-null uncontrolled display text, matching the public hook', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="uncontrolled-default"
        aria-label="Uncontrolled default"
        defaultValue={4}
        displayValue="$4"
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'uncontrolled-default');
  expect(input.value).toBe('4');
  expect(input).not.toHaveAttribute('aria-valuetext');
  await screen.rerender(
    <CoreAIFluentProvider>
      <SpinButton
        name="uncontrolled-default"
        aria-label="Uncontrolled default"
        defaultValue={9}
        displayValue="$9"
      />
    </CoreAIFluentProvider>,
  );
  expect(input.value).toBe('4');
  await userEvent.click(input);
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(input).toHaveValue('5');
});

test.each([
  { props: { defaultValue: 0.1, step: 0.1 }, initial: '0.1', next: 0.2 },
  { props: { defaultValue: 1.234, step: 0.25, precision: 2 }, initial: '1.23', next: 1.48 },
  { props: { defaultValue: null, min: 2, step: 0.5 }, initial: '', next: 2.5 },
] satisfies { props: SpinButtonProps; initial: string; next: number }[])(
  'leaves precision and null-start stepping to the hook: $initial to $next',
  async ({ props, initial, next }) => {
    const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
    const screen = await render(
      <CoreAIFluentProvider>
        <SpinButton {...props} name="precision" aria-label="Precision" onChange={onChange} />
      </CoreAIFluentProvider>,
    );
    const input = nativeInput(screen.container, 'precision');
    expect(input.value).toBe(initial);
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(input).toHaveValue(String(next));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: next,
      displayValue: undefined,
    });
  },
);

test('retains arrow, page, Home/End, bound-button, FormData, and native reset behavior in the shared numeric flow', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButtonNumericFlow onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'quantity');
  const slots = getSpinButtonSlots(spinRoot(input));
  await userEvent.click(input);
  for (const [key, expected] of [
    ['ArrowUp', 4.5],
    ['ArrowDown', 4],
    ['PageUp', 9],
    ['PageDown', 4],
    ['Home', 0],
    ['End', 20],
  ] as const) {
    await userEvent.keyboard(`{${key}}`);
    await expect.element(input).toHaveValue(String(expected));
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
      value: expected,
      displayValue: undefined,
    });
  }
  expect(slots.incrementButton.disabled).toBe(true);
  expect(slots.decrementButton.disabled).toBe(false);
  expect(spinRoot(input)).toHaveAttribute('data-at-bound', 'max');
  await userEvent.keyboard('{ArrowUp}');
  expect(onChange).toHaveBeenCalledTimes(6);
  await userEvent.click(slots.decrementButton);
  await expect.element(input).toHaveValue('19.5');
  expect(onChange).toHaveBeenNthCalledWith(7, expect.anything(), {
    value: 19.5,
    displayValue: undefined,
  });
  if (!input.form) throw new Error('Missing native quantity form');
  expect([...new FormData(input.form).entries()]).toEqual([['quantity', '19.5']]);
  await userEvent.click(screen.getByRole('button', { name: 'Submit quantity', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Quantity submission', exact: true }))
    .toHaveTextContent('Submitted: 19.5');
  await userEvent.click(screen.getByRole('button', { name: 'Reset native form', exact: true }));
  await expect.element(input).toHaveValue('19.5');
  expect(onChange).toHaveBeenCalledTimes(7);
});

test('validates and formats controlled application input without adding parsing or a reset shim to the component', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButtonValidationFlow onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'budget');
  expect(input).toHaveAccessibleName(/Budget/);
  expect(input.value).toBe('$1');
  await userEvent.fill(input, 'bad');
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('(invalid)');
  expect(onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
    value: undefined,
    displayValue: 'bad',
  });
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).not.toHaveAttribute('aria-valuenow');
  expect(spinRoot(input)).toHaveAttribute('data-invalid', '');
  expect(input).toHaveAccessibleDescription(
    'Enter an amount between $0 and $10. Quarter-dollar steps; Page Up adds $2.',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Submit budget', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Budget submission', exact: true }))
    .toHaveTextContent('Submitted: (invalid)');
  await userEvent.fill(input, '$3.5');
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('$3.5');
  expect(input).not.toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-valuenow', '3.5');
  expect(input).toHaveAttribute('aria-valuetext', '$3.5');
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(input).toHaveValue('$3.75');
  expect(onChange).toHaveBeenNthCalledWith(3, expect.anything(), {
    value: 3.75,
    displayValue: undefined,
  });
  await userEvent.keyboard('{PageUp}');
  await expect.element(input).toHaveValue('$5.75');
  await userEvent.click(screen.getByRole('button', { name: 'Submit budget', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Budget submission', exact: true }))
    .toHaveTextContent('Submitted: $5.75');
  await userEvent.click(screen.getByRole('button', { name: 'Reset budget', exact: true }));
  await expect.element(input).toHaveValue('$1');
  expect(onChange).toHaveBeenCalledTimes(4);
});

test('keeps read-only input focusable, disables its repeat buttons, and skips disabled input in native Tab order', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before quantity</button>
      <SpinButton
        name="read-only"
        aria-label="Read-only quantity"
        defaultValue={4}
        readOnly
        onChange={onChange}
      />
      <SpinButton
        name="disabled"
        aria-label="Disabled quantity"
        defaultValue={4}
        disabled
        onChange={onChange}
      />
      <button type="button">After quantity</button>
    </CoreAIFluentProvider>,
  );
  const readOnly = nativeInput(screen.container, 'read-only');
  const disabled = nativeInput(screen.container, 'disabled');
  expect(spinRoot(readOnly)).toHaveAttribute('data-readonly', '');
  expect(spinRoot(disabled)).toHaveAttribute('data-disabled', '');
  await userEvent.click(screen.getByRole('button', { name: 'Before quantity', exact: true }));
  await userEvent.tab();
  await expect.element(readOnly).toHaveFocus();
  await userEvent.keyboard('{ArrowUp}{PageDown}{Home}{End}123');
  await expect.element(readOnly).toHaveValue('4');
  for (const input of [readOnly, disabled]) {
    const slots = getSpinButtonSlots(spinRoot(input));
    expect(slots.incrementButton.disabled).toBe(true);
    expect(slots.decrementButton.disabled).toBe(true);
    await userEvent.click(slots.incrementButton, { force: true });
    await userEvent.click(slots.decrementButton, { force: true });
  }
  await userEvent.click(readOnly);
  await userEvent.tab();
  await expect
    .element(screen.getByRole('button', { name: 'After quantity', exact: true }))
    .toHaveFocus();
  expect(onChange).not.toHaveBeenCalled();
});

test('keeps a native tab stop only on the input, not its pointer-operated repeat buttons', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before spinbutton</button>
      <SpinButton name="tab-order" aria-label="Tab order quantity" defaultValue={4} />
      <button type="button">After spinbutton</button>
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'tab-order');
  await userEvent.click(screen.getByRole('button', { name: 'Before spinbutton', exact: true }));
  await userEvent.tab();
  await expect.element(input).toHaveFocus();
  await userEvent.tab();
  await expect
    .element(screen.getByRole('button', { name: 'After spinbutton', exact: true }))
    .toHaveFocus();
});

test('repeats a trusted pointer hold with exact sequential numeric payloads and native mouse events', async () => {
  const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SpinButton
        name="trusted-repeat"
        aria-label="Repeated quantity"
        defaultValue={0}
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeInput(screen.container, 'trusted-repeat');
  const { incrementButton, decrementButton } = getSpinButtonSlots(spinRoot(input));
  // The documented initial repeat delay is 300ms; this is a real held click, not a sleep.
  await userEvent.click(incrementButton, { delay: 360 });
  const count = onChange.mock.calls.length;
  expect(count).toBeGreaterThanOrEqual(2);
  expect(input.value).toBe(String(count));
  expect(onChange.mock.calls.map(([, data]) => data)).toEqual(
    Array.from({ length: count }, (_, index) => ({
      value: index + 1,
      displayValue: undefined,
    })),
  );
  expect(onChange.mock.calls.map(([event]) => [event.type, event.isTrusted])).toEqual(
    Array.from({ length: count }, () => ['mousedown', true]),
  );
  await userEvent.click(decrementButton);
  await expect.element(input).toHaveValue(String(count - 1));
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), {
    value: count - 1,
    displayValue: undefined,
  });
});

test.each(['mouseup', 'mouseout'] as const)(
  'stops the current hook repeat timer on %s using deterministic native events',
  async (release) => {
    const onChange = vi.fn<NonNullable<SpinButtonProps['onChange']>>();
    const fixture = (
      <CoreAIFluentProvider>
        <SpinButton
          name="deterministic-repeat"
          aria-label="Deterministic repeat"
          defaultValue={0}
          onChange={onChange}
        />
      </CoreAIFluentProvider>
    );
    // useTimeout captures the provider window's timer functions during render.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const screen = await render(fixture);
    const input = nativeInput(screen.container, 'deterministic-repeat');
    const { incrementButton } = getSpinButtonSlots(spinRoot(input));
    try {
      incrementButton.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1 }),
      );
      // The runner's rerender flushes pending updates in its configured React act environment.
      await screen.rerender(fixture);
      expect(input.value).toBe('1');
      expect(onChange).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(299);
      await screen.rerender(fixture);
      expect(onChange).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await screen.rerender(fixture);
      expect(input.value).toBe('2');
      expect(onChange.mock.calls.map(([, data]) => data)).toEqual([
        { value: 1, displayValue: undefined },
        { value: 2, displayValue: undefined },
      ]);
      incrementButton.dispatchEvent(
        new MouseEvent(release, {
          bubbles: true,
          button: 0,
          relatedTarget: release === 'mouseout' ? document.body : null,
        }),
      );
      await vi.advanceTimersByTimeAsync(1000);
      await screen.rerender(fixture);
      expect(input.value).toBe('2');
      expect(onChange).toHaveBeenCalledTimes(2);
    } finally {
      await screen.unmount();
      vi.useRealTimers();
    }
  },
);
