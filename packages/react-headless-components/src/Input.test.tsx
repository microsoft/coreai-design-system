// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  Field,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  InputComparison,
  inputAppearances,
  inputConsumerExample,
  inputExamples,
  type InputExample,
} from '../../../apps/storybook/src/stories/experiments/InputComparison.js';
import {
  captureInputStyles,
  compareInputStyles,
  getComparisonInput,
  getInputSlots,
  settleInputStyles,
} from '../../../apps/storybook/src/stories/experiments/compareInputStyles.js';
import { Input, inputClassNames, type InputProps } from './Input.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: InputExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <InputComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  // Park the pointer outside both controls so rest/focus comparisons do not inherit hover.
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonInput(screen.container, 'legacy');
  const headless = getComparisonInput(screen.container, 'headless');
  await Promise.all([settleInputStyles(legacy), settleInputStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(inputExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless))).toEqual(
      [],
    );
    expect(getInputSlots(legacy).input.id).not.toBe(getInputSlots(headless).input.id);
  });

  test.each(inputAppearances)(`matches %s on hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      {
        name: appearance,
        props: { appearance, defaultValue: 'Example', contentBefore: '$', contentAfter: 'USD' },
      },
      theme,
    );
    await userEvent.hover(legacy);
    await settleInputStyles(legacy);
    const expected = captureInputStyles(legacy);
    await userEvent.hover(headless);
    await settleInputStyles(headless);
    expect(compareInputStyles(expected, captureInputStyles(headless))).toEqual([]);
  });

  test.each(inputAppearances)(
    `matches %s with keyboard focus and focused hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        {
          name: appearance,
          props: { appearance, defaultValue: 'Example', contentBefore: '$' },
        },
        theme,
      );
      const pointerTarget = document.querySelector('[data-input-comparison-header]')!;
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(getInputSlots(legacy).input).toHaveFocus();
      await userEvent.hover(pointerTarget);
      expect(legacy.matches(':hover')).toBe(false);
      await settleInputStyles(legacy);
      const focused = captureInputStyles(legacy);
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleInputStyles(legacy);
      const focusedHover = captureInputStyles(legacy);

      await userEvent.tab();
      await expect.element(getInputSlots(headless).input).toHaveFocus();
      await userEvent.hover(pointerTarget);
      expect(headless.matches(':hover')).toBe(false);
      await settleInputStyles(headless);
      expect(compareInputStyles(focused, captureInputStyles(headless))).toEqual([]);
      await userEvent.hover(headless);
      expect(headless.matches(':hover')).toBe(true);
      await settleInputStyles(headless);
      expect(compareInputStyles(focusedHover, captureInputStyles(headless))).toEqual([]);
    },
  );

  test.each(inputAppearances)(
    `keeps disabled %s inert and visually unchanged on hover in ${mode} mode`,
    async (appearance) => {
      const onChange = vi.fn();
      const { legacy, headless } = await renderPair(
        {
          name: appearance,
          props: {
            appearance,
            disabled: true,
            'aria-invalid': true,
            placeholder: 'Unavailable',
            contentBefore: '$',
            contentAfter: 'USD',
            onChange,
          },
        },
        theme,
      );
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleInputStyles(legacy);
      const expected = captureInputStyles(legacy);
      await userEvent.hover(headless);
      expect(headless.matches(':hover')).toBe(true);
      await settleInputStyles(headless);
      expect(compareInputStyles(expected, captureInputStyles(headless))).toEqual([]);
      await userEvent.click(headless, { force: true });
      await expect.element(getInputSlots(headless).input).not.toHaveFocus();
      expect(getComputedStyle(headless).cursor).toBe('not-allowed');
      expect(getInputSlots(headless).input.disabled).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  test(`keeps invalid borders on hover, then uses the focused treatment in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Invalid focus',
        props: { appearance: 'outline', 'aria-invalid': true, defaultValue: 'Invalid' },
      },
      theme,
    );
    await userEvent.hover(legacy);
    expect(legacy.matches(':hover')).toBe(true);
    const invalid = captureInputStyles(legacy);
    await userEvent.hover(headless);
    expect(headless.matches(':hover')).toBe(true);
    expect(compareInputStyles(invalid, captureInputStyles(headless))).toEqual([]);
    await userEvent.tab();
    await expect.element(getInputSlots(legacy).input).toHaveFocus();
    await userEvent.hover(legacy);
    await settleInputStyles(legacy);
    const focused = captureInputStyles(legacy);
    expect(focused['root.border-top-color']).not.toBe(invalid['root.border-top-color']);
    await userEvent.tab();
    await expect.element(getInputSlots(headless).input).toHaveFocus();
    await userEvent.hover(headless);
    await settleInputStyles(headless);
    expect(compareInputStyles(focused, captureInputStyles(headless))).toEqual([]);
  });

  test.each(['outline', 'filled-darker'] as const)(
    `matches read-only %s focus styling in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'Read only focus',
          props: {
            appearance,
            readOnly: true,
            defaultValue: 'Example',
            contentAfter: 'Read only',
          },
        },
        theme,
      );
      const pointerTarget = document.querySelector('[data-input-comparison-header]')!;
      await userEvent.tab();
      await expect.element(getInputSlots(legacy).input).toHaveFocus();
      await userEvent.hover(pointerTarget);
      expect(legacy.matches(':hover')).toBe(false);
      await settleInputStyles(legacy);
      const expected = captureInputStyles(legacy);
      await userEvent.tab();
      await expect.element(getInputSlots(headless).input).toHaveFocus();
      await userEvent.hover(pointerTarget);
      expect(headless.matches(':hover')).toBe(false);
      await settleInputStyles(headless);
      expect(compareInputStyles(expected, captureInputStyles(headless))).toEqual([]);
    },
  );
}

test('exposes only the current Input appearances', () => {
  expectTypeOf<InputProps['appearance']>().toEqualTypeOf<
    'outline' | 'underline' | 'filled-darker' | 'filled-lighter' | undefined
  >();
});

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {}, expected: 'filled-darker' },
    {
      name: 'explicitly undefined',
      props: { appearance: undefined },
      expected: 'filled-darker',
    },
    {
      name: 'explicit outline',
      props: { appearance: 'outline' },
      expected: 'outline',
    },
  ] as const)(
    `matches the CoreAI $name appearance with defaults ${withComponentDefaults ? 'enabled' : 'disabled'}`,
    async ({ name, props, expected }) => {
      const { legacy, headless } = await renderPair(
        { name, props: { ...props, defaultValue: 'Example' } },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(headless.getAttribute('data-appearance')).toBe(expected);
      expect(compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless))).toEqual(
        [],
      );
    },
  );
}

test.each(['small', 'medium', 'large'] as const)(
  'preserves the CoreAI filled default for %s when provider defaults are disabled',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, defaultValue: 'Example', contentBefore: '$' } },
      coreaiLightTheme,
      false,
    );
    expect(headless.getAttribute('data-appearance')).toBe('filled-darker');
    expect(compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless))).toEqual(
      [],
    );
  },
);

test.each(['Content before', 'Content after', 'Dynamic width'])(
  'matches logical RTL spacing for %s',
  async (name) => {
    const example = inputExamples.find((item) => item.name === name);
    if (!example) throw new Error(`Missing Input fixture: ${name}`);
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, true, 'rtl');
    expect(compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless))).toEqual(
      [],
    );
  },
);

test('allows ordinary consumer CSS Modules to override root, input, and suffix styles', async () => {
  const { headless } = await renderPair(inputConsumerExample);
  const values = captureInputStyles(headless);
  expect(values['root.background-color']).toBe('rgb(232, 240, 255)');
  expect(values['root.border-radius']).toBe('3px');
  expect(values['root.gap']).toBe('8px');
  expect(values['input.padding-left']).toBe('18px');
  expect(values['input.padding-right']).toBe('18px');
  expect(values['input.color']).toBe('rgb(32, 48, 96)');
  expect(values['contentAfter.color']).toBe('rgb(72, 32, 128)');
});

test('preserves native refs and slots while an inline label replaces the supplied prefix', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const beforeRef = React.createRef<HTMLSpanElement>();
  const afterRef = React.createRef<HTMLSpanElement>();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const onKeyDown = vi.fn();
  const onBeforeClick = vi.fn();
  const rootProps = { ref: rootRef, 'data-consumer-root': 'kept' };
  const child = <span className="consumer-prefix-child">£</span>;
  const screen = await render(
    <CoreAIFluentProvider>
      <Input
        ref={ref}
        id="headless-input-slots"
        label="Amount"
        appearance="outline"
        size="small"
        dynamicWidth
        truncateTextOverflow
        defaultValue="12"
        name="amount"
        className="consumer-root"
        style={{ maxWidth: '300px' }}
        root={rootProps}
        input={{ className: 'consumer-input', id: 'resolved-input-slot-id' }}
        contentBefore={{
          ref: beforeRef,
          className: 'consumer-prefix',
          children: child,
          onClick: onBeforeClick,
        }}
        contentAfter={{
          ref: afterRef,
          className: 'consumer-suffix',
          children: <span className="consumer-suffix-child">GBP</span>,
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <button type="button">Next</button>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Amount').element() as HTMLInputElement;
  const root = input.closest<HTMLElement>('.fui-Input')!;
  const slots = getInputSlots(root);
  expect(ref.current).toBe(input);
  expect(rootRef.current).toBe(root);
  expect(beforeRef.current).toBeNull();
  expect(afterRef.current).toBe(slots.contentAfter);
  expect(input.id).toBe('resolved-input-slot-id');
  expect(slots.label?.getAttribute('for')).toBe(input.id);
  expect(input.tagName).toBe('INPUT');
  expect(root.tagName).toBe('SPAN');
  expect(input.name).toBe('amount');
  expect(input.type).toBe('text');
  expect(root.getAttribute('data-consumer-root')).toBe('kept');
  expect(root.style.maxWidth).toBe('300px');
  expect(root).toHaveClass('consumer-root');
  expect(input).toHaveClass('consumer-input');
  expect(slots.contentBefore).not.toHaveClass('consumer-prefix');
  expect(slots.contentAfter).toHaveClass('consumer-suffix');
  for (const [slot, marker] of Object.entries(inputClassNames)) {
    expect(slots[slot as keyof typeof slots]).toHaveClass(marker);
  }
  expect(root.querySelector('.consumer-prefix-child')).toBeNull();
  expect(slots.contentBefore?.textContent).toBe('Amount');
  expect(child.props.className).toBe('consumer-prefix-child');
  expect(root.querySelector('.consumer-suffix-child')).not.toHaveClass(
    inputClassNames.contentAfter,
  );
  for (const attribute of [
    'data-has-value',
    'data-has-label',
    'data-has-content-before',
    'data-has-content-after',
    'data-dynamic-width',
    'data-truncate-text-overflow',
  ]) {
    expect(root.getAttribute(attribute)).toBe('');
  }
  expect(root.getAttribute('data-size')).toBe('small');
  expect(root.getAttribute('data-appearance')).toBe('outline');
  for (const element of [root, input]) {
    for (const prop of ['appearance', 'size', 'label', 'dynamicWidth', 'truncateTextOverflow']) {
      expect(element.hasAttribute(prop)).toBe(false);
    }
  }
  await userEvent.click(slots.label!);
  expect(onBeforeClick).not.toHaveBeenCalled();
  await expect.element(input).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  expect(onFocus).toHaveBeenCalled();
  expect(onKeyDown).toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test('preserves supplied prefix props and children when no inline label replaces them', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const child = <span className="consumer-prefix-child">£</span>;
  const screen = await render(
    <CoreAIFluentProvider>
      <Input
        aria-label="Amount without inline label"
        contentBefore={{ ref, className: 'consumer-prefix', onClick, children: child }}
      />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Amount without inline label').element();
  const root = input.closest<HTMLElement>('.fui-Input')!;
  const prefix = getInputSlots(root).contentBefore!;
  expect(ref.current).toBe(prefix);
  expect(prefix).toHaveClass(inputClassNames.contentBefore, 'consumer-prefix');
  const renderedChild = prefix.querySelector('.consumer-prefix-child')!;
  expect(renderedChild.className).toBe('consumer-prefix-child');
  expect(child.props.className).toBe('consumer-prefix-child');
  await userEvent.click(renderedChild);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('exposes unstyled global slot markers for consumer selectors', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <style>{`
        .input-consumer-globals .fui-Input { border-radius: 9px; }
        .input-consumer-globals .fui-Input__input { padding-inline: 17px; }
        .input-consumer-globals .fui-Input__contentBefore { color: rgb(20, 40, 60); }
        .input-consumer-globals .fui-Input__contentAfter { color: rgb(60, 40, 20); }
        .input-consumer-globals .fui-Input__label { font-weight: 500; }
      `}</style>
      <div className="input-consumer-globals">
        <Input label="Global target" defaultValue="Value" contentAfter="Suffix" />
      </div>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByLabelText('Global target').element().closest<HTMLElement>('.fui-Input')!;
  const values = captureInputStyles(root);
  expect(values['root.border-radius']).toBe('9px');
  expect(values['input.padding-left']).toBe('17px');
  expect(values['input.padding-right']).toBe('17px');
  expect(values['contentBefore.color']).toBe('rgb(20, 40, 60)');
  expect(values['contentAfter.color']).toBe('rgb(60, 40, 20)');
  expect(values['label.font-weight']).toBe('500');
});

test('uses resolved slot state without overwriting headless disabled or invalid attributes', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <p>Outside inputs</p>
      <Input
        aria-label="Resolved input"
        disabled
        aria-invalid
        input={{ disabled: false, 'aria-invalid': 'grammar', readOnly: true }}
        contentBefore={0}
        contentAfter={{ children: 'Custom suffix' }}
      />
      <Input aria-label="Normal input" />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Outside inputs'));
  const input = screen.getByRole('textbox', { name: 'Resolved input' }).element();
  const root = input.closest<HTMLElement>('.fui-Input')!;
  const normal = screen
    .getByRole('textbox', { name: 'Normal input' })
    .element()
    .closest('.fui-Input')!;
  expect(root.hasAttribute('data-disabled')).toBe(false);
  expect(root.getAttribute('data-invalid')).toBe('grammar');
  expect(root.getAttribute('data-read-only')).toBe('');
  expect(root.getAttribute('data-has-content-before')).toBe('');
  expect(root.getAttribute('data-has-content-after')).toBe('');
  expect(root.hasAttribute('data-has-label')).toBe(false);
  expect(root.hasAttribute('data-has-value')).toBe(false);
  expect(getComputedStyle(root).borderTopColor).toBe(getComputedStyle(normal).borderTopColor);
  expect(getInputSlots(root).contentBefore?.textContent).toBe('0');
  await expect.element(screen.getByText('Custom suffix')).toBeVisible();
  expect(root.querySelector('button')).toBeNull();
});

test('inherits Field size, required, label, and validation while allowing explicit size', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field label="Inherited" size="small" required validationMessage="Enter a value">
        <Input />
      </Field>
      <Field label="Explicit" size="small">
        <Input size="large" />
      </Field>
    </CoreAIFluentProvider>,
  );
  const inherited = screen.getByLabelText('Inherited').element() as HTMLInputElement;
  const root = inherited.closest<HTMLElement>('.fui-Input')!;
  expect(root.getAttribute('data-size')).toBe('small');
  expect(root.getAttribute('data-invalid')).toBe('');
  expect(inherited.required).toBe(true);
  expect(inherited.getAttribute('aria-invalid')).toBe('true');
  expect(inherited.getAttribute('aria-describedby')).toBeTruthy();
  expect(getComputedStyle(root).minHeight).toBe('24px');
  const explicit = screen.getByLabelText('Explicit').element().closest<HTMLElement>('.fui-Input')!;
  expect(explicit.getAttribute('data-size')).toBe('large');
  expect(getComputedStyle(explicit).minHeight).toBe('40px');
});

test('updates uncontrolled value state and the inline colon, including clearing', async () => {
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Input label="Name" defaultValue="Ada" onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Name').element() as HTMLInputElement;
  const root = input.closest<HTMLElement>('.fui-Input')!;
  const label = getInputSlots(root).label!;
  expect(root.getAttribute('data-has-value')).toBe('');
  expect(getComputedStyle(label, '::after').content).toBe('":"');
  await userEvent.clear(input);
  expect(input.value).toBe('');
  expect(root.hasAttribute('data-has-value')).toBe(false);
  expect(getComputedStyle(label, '::after').content).not.toBe('":"');
  await userEvent.fill(input, 'Grace');
  expect(input.value).toBe('Grace');
  expect(root.getAttribute('data-has-value')).toBe('');
  expect(getComputedStyle(label, '::after').content).toBe('":"');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'Grace' });
});

test('keeps controlled values and callback data separate from consumer transformations', async () => {
  const onChange = vi.fn();
  function ControlledInput() {
    const [value, setValue] = React.useState('');
    return (
      <Input
        label="Controlled name"
        value={value}
        onChange={(event, data) => {
          onChange(event.type, data);
          setValue(data.value.toUpperCase());
        }}
      />
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <ControlledInput />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Controlled name').element() as HTMLInputElement;
  await userEvent.fill(input, 'ada');
  expect(input.value).toBe('ADA');
  expect(onChange).toHaveBeenLastCalledWith('change', { value: 'ada' });
  expect(input.closest('.fui-Input')?.getAttribute('data-has-value')).toBe('');
});

test('retains the supplied defaultValue copy payload after an uncontrolled edit', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  function LockableInput() {
    const [readOnly, setReadOnly] = React.useState(false);
    return (
      <>
        <Input label="Token" defaultValue="initial" readOnly={readOnly} />
        <Input label="Controlled token" value="controlled value" readOnly />
        <button type="button" onClick={() => setReadOnly(true)}>
          Lock value
        </button>
      </>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <LockableInput />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Token', { exact: true }).element() as HTMLInputElement;
  const root = input.closest<HTMLElement>('.fui-Input')!;
  expect(root.hasAttribute('data-has-content-after')).toBe(false);
  await userEvent.fill(input, 'current value');
  await userEvent.click(screen.getByRole('button', { name: 'Lock value' }));
  expect(input.readOnly).toBe(true);
  expect(root.getAttribute('data-read-only')).toBe('');
  expect(root.getAttribute('data-has-content-after')).toBe('');
  expect(input.value).toBe('current value');
  await userEvent.click(screen.getByRole('button', { name: 'Copy Token', exact: true }));
  await userEvent.click(screen.getByRole('button', { name: 'Copy Controlled token', exact: true }));
  await expect.poll(() => writeText.mock.calls).toEqual([['initial'], ['controlled value']]);
});

test.each([
  {
    name: 'top-level readOnly with an editable native slot',
    props: { label: 'Token', readOnly: true, input: { readOnly: false }, defaultValue: 'Value' },
    hasCopy: true,
  },
  {
    name: 'native-slot readOnly without a top-level readOnly prop',
    props: { label: 'Token', input: { readOnly: true }, defaultValue: 'Value' },
    hasCopy: false,
  },
  {
    name: 'top-level disabled with an enabled native slot',
    props: { label: 'Token', disabled: true, input: { disabled: false }, defaultValue: 'Value' },
    hasCopy: false,
  },
  {
    name: 'native-slot disabled without a top-level disabled prop',
    props: { label: 'Token', input: { disabled: true }, defaultValue: 'Value' },
    hasCopy: false,
  },
  {
    name: 'null contentAfter in readOnly mode',
    props: { label: 'Token', readOnly: true, contentAfter: null, defaultValue: 'Value' },
    hasCopy: true,
  },
  {
    name: 'supplied contentAfter in readOnly mode',
    props: { label: 'Token', readOnly: true, contentAfter: 'Custom suffix', defaultValue: 'Value' },
    hasCopy: false,
  },
] satisfies (InputExample & { hasCopy: boolean })[])(
  'matches legacy $name composition and wrapper-level treatments',
  async (example) => {
    const { legacy, headless } = await renderPair(example);
    expect(compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless))).toEqual(
      [],
    );
    for (const root of [legacy, headless]) {
      expect(root.querySelectorAll('button[aria-label^="Copy "]')).toHaveLength(
        example.hasCopy ? 1 : 0,
      );
    }
    const input = getInputSlots(headless).input;
    expect(headless.hasAttribute('data-read-only')).toBe(input.readOnly);
    expect(headless.hasAttribute('data-disabled')).toBe(input.disabled);
  },
);

test('preserves native form submission and read-only editing semantics', async () => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit([...new FormData(event.currentTarget).entries()]);
        }}
      >
        <Input
          aria-label="Read only account"
          name="account"
          readOnly
          defaultValue="Ada"
          contentAfter="Read only"
          onChange={onChange}
        />
        <Input aria-label="Disabled account" name="excluded" disabled defaultValue="Hidden" />
        <button type="submit">Submit values</button>
      </form>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('textbox', { name: 'Read only account' }).element();
  await userEvent.click(input);
  await userEvent.keyboard('x');
  await expect.element(input).toHaveValue('Ada');
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Submit values' }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith([['account', 'Ada']]);
});

test('keeps CoreAI inline-label features when provider defaults are disabled', async () => {
  const screen = await render(
    <CoreAIFluentProvider withComponentDefaults={false}>
      <Input label="Explicit features" defaultValue="Ada" dynamicWidth truncateTextOverflow />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByLabelText('Explicit features').element();
  const root = input.closest<HTMLElement>('.fui-Input')!;
  expect(root.getAttribute('data-appearance')).toBe('filled-darker');
  expect(getComputedStyle(input).getPropertyValue('field-sizing')).toBe('content');
  expect(getComputedStyle(input).maxWidth).toBe('200px');
  expect(getComputedStyle(input).textOverflow).toBe('ellipsis');
  expect(getComputedStyle(getInputSlots(root).label!, '::after').content).toBe('":"');
});
