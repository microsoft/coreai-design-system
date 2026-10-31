// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  Field,
  coreaiDarkTheme,
  coreaiLightTheme,
  type SlotRenderFunction,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  TextareaComparison,
  textareaConsumerExample,
  textareaExamples,
  textareaResizeModes,
  textareaSizes,
  type TextareaExample,
} from '../../../apps/storybook/src/stories/experiments/TextareaComparison.js';
import {
  captureTextareaStyles,
  compareTextareaStyles,
  getComparisonTextarea,
  settleTextareaStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTextareaStyles.js';
import { Textarea, textareaClassNames, type TextareaProps } from './Textarea.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;
const interactiveAppearances = ['outline', 'filled-darker', 'filled-lighter'] as const;

async function renderPair(
  example: TextareaExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<TextareaComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonTextarea(screen.container, 'legacy');
  const headless = getComparisonTextarea(screen.container, 'headless');
  await userEvent.hover(screen.getByText('Case'));
  await Promise.all([settleTextareaStyles(legacy), settleTextareaStyles(headless)]);
  return { legacy, headless, neutral: screen.getByText('Case') };
}

for (const [mode, theme] of themes) {
  test.each(textareaExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
    ).toEqual([]);
  });

  test.each(interactiveAppearances)(`matches %s on hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      { name: appearance, props: { appearance, placeholder: 'Write notes…' } },
      theme,
    );
    await userEvent.hover(legacy.textarea);
    await settleTextareaStyles(legacy);
    const expected = captureTextareaStyles(legacy);
    await userEvent.hover(headless.textarea);
    await settleTextareaStyles(headless);
    expect(compareTextareaStyles(expected, captureTextareaStyles(headless))).toEqual([]);
  });

  test.each(interactiveAppearances)(
    `matches %s on keyboard focus and focused hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless, neutral } = await renderPair(
        { name: appearance, props: { appearance, defaultValue: 'Notes' } },
        theme,
      );
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(legacy.textarea).toHaveFocus();
      await settleTextareaStyles(legacy);
      expect(legacy.root.matches(':hover')).toBe(false);
      const focused = captureTextareaStyles(legacy);
      expect(focused['underline.transform']).toBe('matrix(1, 0, 0, 1, 0, 0)');
      await userEvent.hover(legacy.textarea);
      await settleTextareaStyles(legacy);
      expect(legacy.root.matches(':hover')).toBe(true);
      const focusedHover = captureTextareaStyles(legacy);

      // Tabbing scrolls the narrow grid; keep its stationary pointer off both controls.
      await userEvent.hover(neutral);
      await userEvent.tab();
      await expect.element(headless.textarea).toHaveFocus();
      expect(headless.textarea.matches(':focus-visible')).toBe(true);
      await settleTextareaStyles(headless);
      expect(headless.root.matches(':hover')).toBe(false);
      expect(compareTextareaStyles(focused, captureTextareaStyles(headless))).toEqual([]);
      await userEvent.hover(headless.textarea);
      await settleTextareaStyles(headless);
      expect(headless.root.matches(':hover')).toBe(true);
      expect(compareTextareaStyles(focusedHover, captureTextareaStyles(headless))).toEqual([]);
    },
  );

  test.each(textareaExamples.filter(({ props }) => props.disabled))(
    `keeps $name non-interactive on hover in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      await userEvent.hover(legacy.textarea);
      await settleTextareaStyles(legacy);
      const expected = captureTextareaStyles(legacy);
      await userEvent.hover(headless.textarea);
      await settleTextareaStyles(headless);
      expect(compareTextareaStyles(expected, captureTextareaStyles(headless))).toEqual([]);
      expect(getComputedStyle(headless.textarea).cursor).toBe('not-allowed');
      expect(getComputedStyle(headless.root, '::after').content).toBe('none');
    },
  );

  test.each(
    textareaExamples.filter(
      ({ props }) => !props.disabled && (props.readOnly || props['aria-invalid'] === true),
    ),
  )(`matches $name on hover and pointer focus in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    await userEvent.hover(legacy.textarea);
    await settleTextareaStyles(legacy);
    const hovered = captureTextareaStyles(legacy);
    await userEvent.click(legacy.textarea);
    await settleTextareaStyles(legacy);
    const focused = captureTextareaStyles(legacy);
    expect(focused['underline.transform']).toBe('matrix(1, 0, 0, 1, 0, 0)');
    if (example.props['aria-invalid'] === true) {
      expect(focused['root.border-top-color']).not.toBe(hovered['root.border-top-color']);
    }
    await userEvent.hover(headless.textarea);
    await settleTextareaStyles(headless);
    expect(compareTextareaStyles(hovered, captureTextareaStyles(headless))).toEqual([]);
    await userEvent.click(headless.textarea);
    await settleTextareaStyles(headless);
    expect(compareTextareaStyles(focused, captureTextareaStyles(headless))).toEqual([]);
  });
}

test.each(textareaSizes)(
  'restores Fluent outline defaults for %s when CoreAI defaults are disabled',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, defaultValue: 'Notes' } },
      coreaiLightTheme,
      false,
    );
    expect(headless.root.getAttribute('data-appearance')).toBe('outline');
    expect(
      compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
    ).toEqual([]);
  },
);

test('preserves an explicit appearance when CoreAI defaults are disabled', async () => {
  const { legacy, headless } = await renderPair(
    { name: 'Explicit filled', props: { appearance: 'filled-darker' } },
    coreaiLightTheme,
    false,
  );
  expect(headless.root.getAttribute('data-appearance')).toBe('filled-darker');
  expect(
    compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
  ).toEqual([]);
});

test.each([
  {
    name: 'omitted with defaults enabled',
    props: {},
    defaults: true,
    expected: 'filled-darker',
  },
  {
    name: 'explicit undefined with defaults enabled',
    props: { appearance: undefined },
    defaults: true,
    expected: 'outline',
  },
  {
    name: 'omitted with defaults disabled',
    props: {},
    defaults: false,
    expected: 'outline',
  },
  {
    name: 'explicit undefined with defaults disabled',
    props: { appearance: undefined },
    defaults: false,
    expected: 'outline',
  },
  {
    name: 'explicit value with defaults enabled',
    props: { appearance: 'filled-lighter' },
    defaults: true,
    expected: 'filled-lighter',
  },
  {
    name: 'explicit value with defaults disabled',
    props: { appearance: 'filled-lighter' },
    defaults: false,
    expected: 'filled-lighter',
  },
] as const)(
  'matches legacy appearance resolution when $name',
  async ({ name, props, defaults, expected }) => {
    const { legacy, headless } = await renderPair(
      { name, props: { ...props, defaultValue: 'Notes' } },
      coreaiLightTheme,
      defaults,
    );
    expect(headless.root).toHaveAttribute('data-appearance', expected);
    expect(
      compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
    ).toEqual([]);
  },
);

test('exposes only the current Textarea appearances', () => {
  expectTypeOf<TextareaProps['appearance']>().toEqualTypeOf<
    'outline' | 'filled-darker' | 'filled-lighter' | undefined
  >();
});

test.each(interactiveAppearances)(
  'renders the supported %s appearance without errors',
  async (appearance) => {
    const errors = vi.spyOn(console, 'error');
    await renderCoreAIComponent(
      <Textarea aria-label="Supported appearance" appearance={appearance} />,
    );
    expect(errors).not.toHaveBeenCalled();
  },
);

test.each(textareaSizes)('matches %s sizing and focus underline placement in RTL', async (size) => {
  const { legacy, headless } = await renderPair(
    { name: size, props: { size, resize: 'both', defaultValue: 'ملاحظات المشروع' } },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(
    compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
  ).toEqual([]);
  expect(getComputedStyle(headless.textarea).direction).toBe('rtl');
});

test.each(textareaResizeModes)('maps %s resizing to the native textarea', async (resize) => {
  const screen = await renderCoreAIComponent(
    <Textarea aria-label="Resizable notes" resize={resize} rows={4} cols={25} />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Resizable notes' }).element();
  expect(getComputedStyle(textarea).resize).toBe(resize);
  expect(textarea).toHaveAttribute('rows', '4');
  expect(textarea).toHaveAttribute('cols', '25');
  expect(textarea.parentElement).toHaveAttribute('data-resize', resize);
  expect(textarea).not.toHaveAttribute('resize');
});

test.each([
  { size: 'small', min: 40, max: 200 },
  { size: 'medium', min: 52, max: 260 },
  { size: 'large', min: 64, max: 320 },
] as const)('bounds native rows to the $size height range', async ({ size, min, max }) => {
  const screen = await renderCoreAIComponent(
    <>
      <Textarea aria-label="Short notes" size={size} rows={1} />
      <Textarea aria-label="Tall notes" size={size} rows={50} />
    </>,
  );
  const short = screen.getByRole('textbox', { name: 'Short notes' }).element();
  const tall = screen.getByRole('textbox', { name: 'Tall notes' }).element();
  expect(getComputedStyle(short).minHeight).toBe(`${min}px`);
  expect(getComputedStyle(tall).maxHeight).toBe(`${max}px`);
  expect(short.getBoundingClientRect().height).toBe(min);
  expect(tall.getBoundingClientRect().height).toBe(max);
});

test('lets ordinary consumer CSS Modules override wrapper and textarea slots', async () => {
  const { headless } = await renderPair(textareaConsumerExample);
  const styles = captureTextareaStyles(headless);
  expect(styles['root.border-radius']).toBe('3px');
  expect(styles['textarea.min-height']).toBe('96px');
  expect(styles['textarea.max-height']).toBe('180px');
  expect(styles['textarea.padding-left']).toBe('14px');
  expect(styles['textarea.padding-right']).toBe('14px');
});

test('exposes stable unstyled markers for consumer global selectors', async () => {
  const screen = await renderCoreAIComponent(
    <div className="textarea-consumer">
      <style>{`
        .textarea-consumer .fui-Textarea { border-radius: 7px; }
        .textarea-consumer .fui-Textarea__textarea { min-height: 88px; }
      `}</style>
      <Textarea aria-label="Targeted notes" />
    </div>,
  );
  const textarea = screen.getByRole('textbox', { name: 'Targeted notes' }).element();
  expect(textarea).toHaveClass(textareaClassNames.textarea);
  expect(textarea.parentElement).toHaveClass(textareaClassNames.root);
  expect(getComputedStyle(textarea).minHeight).toBe('88px');
  expect(getComputedStyle(textarea.parentElement!).borderRadius).toBe('7px');
});

test('preserves refs, native props, slot classes, and focus/input/blur callbacks', async () => {
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const onFocus = vi.fn();
  const onInput = vi.fn();
  const onBlur = vi.fn();
  const screen = await renderCoreAIComponent(
    <>
      <Textarea
        ref={textareaRef}
        aria-label="Slotted notes"
        appearance="outline"
        size="small"
        className="consumer-wrapper"
        root={{ ref: rootRef, style: { borderRadius: '9px' } }}
        textarea={{ className: 'consumer-textarea', onFocus }}
        onInput={onInput}
        onBlur={onBlur}
        name="notes"
        rows={3}
        maxLength={40}
      />
      <button type="button">Next</button>
    </>,
  );
  const textarea = screen.getByRole('textbox', { name: 'Slotted notes' }).element();
  expect(textareaRef.current).toBe(textarea);
  expect(rootRef.current).toBe(textarea.parentElement);
  expect(rootRef.current).toHaveClass(textareaClassNames.root, 'consumer-wrapper');
  expect(textarea).toHaveClass(textareaClassNames.textarea, 'consumer-textarea');
  expect(getComputedStyle(rootRef.current!).borderRadius).toBe('9px');
  expect(textarea).toHaveAttribute('name', 'notes');
  expect(textarea).toHaveAttribute('maxlength', '40');
  expect(rootRef.current).toHaveAttribute('data-appearance', 'outline');
  expect(rootRef.current).toHaveAttribute('data-size', 'small');
  for (const prop of ['appearance', 'size', 'resize']) {
    expect(textarea.hasAttribute(prop)).toBe(false);
    expect(rootRef.current!.hasAttribute(prop)).toBe(false);
  }
  await userEvent.fill(textarea, 'Edited');
  expect(onFocus).toHaveBeenCalledOnce();
  expect(onInput).toHaveBeenCalled();
  await userEvent.tab();
  expect(onBlur).toHaveBeenCalledOnce();
});

test('preserves root render children without adding slot markers to caller content', async () => {
  const childRef = React.createRef<HTMLSpanElement>();
  const child = (
    <span ref={childRef} className="caller-child">
      Extra content
    </span>
  );
  const renderRoot: SlotRenderFunction<React.ComponentPropsWithRef<'span'>> = (
    Component,
    slotProps,
  ) => (
    <Component {...slotProps}>
      {slotProps.children}
      {child}
    </Component>
  );
  const screen = await renderCoreAIComponent(
    <Textarea aria-label="Custom root" root={{ children: renderRoot }} />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Custom root' }).element();
  expect(textarea.parentElement).toHaveClass(textareaClassNames.root);
  expect(childRef.current).toBe(textarea.nextElementSibling);
  expect(childRef.current).toHaveClass('caller-child');
  expect(childRef.current).not.toHaveClass(textareaClassNames.root);
  expect(childRef.current).not.toHaveClass(textareaClassNames.textarea);
});

test('extends data attributes from resolved slots without replacing headless behavioral state', async () => {
  const screen = await renderCoreAIComponent(
    <Textarea
      aria-label="Resolved notes"
      disabled={false}
      readOnly={false}
      required={false}
      aria-invalid={false}
      defaultValue="0"
      resize="horizontal"
      textarea={{ disabled: true, readOnly: true, required: true, 'aria-invalid': 'spelling' }}
    />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Resolved notes' }).element();
  const root = textarea.parentElement!;
  expect(root).toHaveAttribute('data-disabled', '');
  expect(root).toHaveAttribute('data-invalid', 'spelling');
  expect(root).toHaveAttribute('data-resize', 'horizontal');
  expect(root).toHaveAttribute('data-read-only', '');
  expect(root).toHaveAttribute('data-required', '');
  expect(root).toHaveAttribute('data-has-value', '');
  expect(textarea).toBeDisabled();
  expect(textarea).toHaveAttribute('readonly');
});

test.each(['grammar', 'spelling', false] as const)(
  'does not treat aria-invalid=%s as the true error border state',
  async (invalid) => {
    const { legacy, headless } = await renderPair({
      name: String(invalid),
      props: { appearance: 'outline', 'aria-invalid': invalid },
    });
    expect(
      compareTextareaStyles(captureTextareaStyles(legacy), captureTextareaStyles(headless)),
    ).toEqual([]);
    if (invalid === false) {
      expect(headless.root).not.toHaveAttribute('data-invalid');
    } else {
      expect(headless.root).toHaveAttribute('data-invalid', invalid);
    }
  },
);

test('inherits Field size, required state, label, and error description', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Field
        label="Required notes"
        size="large"
        required
        validationState="error"
        validationMessage="Review these notes."
      >
        <Textarea />
      </Field>
      <Field label="Explicit size" size="large">
        <Textarea size="small" />
      </Field>
    </>,
  );
  const inherited = screen.getByRole('textbox', { name: /Required notes/ }).element();
  const explicit = screen.getByRole('textbox', { name: 'Explicit size' }).element();
  expect(inherited).toBeRequired();
  expect(inherited).toHaveAttribute('aria-invalid', 'true');
  expect(inherited).toHaveAccessibleDescription('Review these notes.');
  expect(inherited.parentElement).toHaveAttribute('data-size', 'large');
  expect(inherited.parentElement).toHaveAttribute('data-required', '');
  expect(inherited.parentElement).toHaveAttribute('data-invalid', '');
  expect(getComputedStyle(inherited).minHeight).toBe('64px');
  expect(explicit.parentElement).toHaveAttribute('data-size', 'small');
  expect(getComputedStyle(explicit).minHeight).toBe('40px');
});

test('updates uncontrolled text and value-presence data with onChange event/data', async () => {
  const onChange = vi.fn<NonNullable<TextareaProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <Textarea aria-label="Uncontrolled notes" defaultValue="Initial notes" onChange={onChange} />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Uncontrolled notes' }).element();
  expect(textarea).toHaveValue('Initial notes');
  expect(textarea.parentElement).toHaveAttribute('data-has-value', '');
  await userEvent.fill(textarea, '');
  expect(textarea.parentElement).not.toHaveAttribute('data-has-value');
  await userEvent.fill(textarea, 'First line\nSecond line');
  expect(textarea).toHaveValue('First line\nSecond line');
  expect(textarea.parentElement).toHaveAttribute('data-has-value', '');
  expect(onChange.mock.lastCall?.[1]).toEqual({ value: 'First line\nSecond line' });
  expect(onChange.mock.lastCall?.[0].target).toBe(textarea);
});

test('uses resolved controlled values for display and presence after callbacks and parent changes', async () => {
  const onChange = vi.fn<NonNullable<TextareaProps['onChange']>>();
  function Controlled() {
    const [value, setValue] = React.useState('');
    return (
      <>
        <Textarea
          aria-label="Controlled notes"
          value={value}
          onChange={(event, data) => {
            onChange(event, data);
            setValue(data.value.toUpperCase());
          }}
        />
        <button type="button" onClick={() => setValue('')}>
          Clear from parent
        </button>
      </>
    );
  }
  const screen = await renderCoreAIComponent(<Controlled />);
  const textarea = screen.getByRole('textbox', { name: 'Controlled notes' }).element();
  expect(textarea.parentElement).not.toHaveAttribute('data-has-value');
  await userEvent.fill(textarea, 'hello\nworld');
  expect(onChange.mock.lastCall?.[1]).toEqual({ value: 'hello\nworld' });
  expect(textarea).toHaveValue('HELLO\nWORLD');
  expect(textarea.parentElement).toHaveAttribute('data-has-value', '');
  await userEvent.click(screen.getByRole('button', { name: 'Clear from parent' }));
  expect(textarea).toHaveValue('');
  expect(textarea.parentElement).not.toHaveAttribute('data-has-value');
});

test('keeps readOnly focusable but not editable, and skips disabled textareas in tab order', async () => {
  const onChange = vi.fn();
  const screen = await renderCoreAIComponent(
    <>
      <Textarea aria-label="Disabled notes" disabled defaultValue="Disabled" onChange={onChange} />
      <Textarea aria-label="Read only notes" readOnly defaultValue="Saved" onChange={onChange} />
      <Textarea aria-label="Editable notes" />
    </>,
  );
  const disabled = screen.getByRole('textbox', { name: 'Disabled notes' });
  const readOnly = screen.getByRole('textbox', { name: 'Read only notes' });
  await userEvent.tab();
  await expect.element(readOnly).toHaveFocus();
  await expect.element(disabled).toBeDisabled();
  await userEvent.keyboard('Cannot edit{Enter}');
  expect(readOnly.element()).toHaveValue('Saved');
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.tab();
  await expect.element(screen.getByRole('textbox', { name: 'Editable notes' })).toHaveFocus();
});

test('retains native newline, required validation, and named form submission semantics', async () => {
  const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
  const onKeyDown = vi.fn();
  const screen = await renderCoreAIComponent(
    <form onSubmit={onSubmit}>
      <Textarea aria-label="Notes to submit" name="notes" required onKeyDown={onKeyDown} />
      <Textarea aria-label="Archived notes" name="archive" readOnly defaultValue="Saved" />
      <Textarea aria-label="Excluded notes" name="excluded" disabled defaultValue="Hidden" />
      <button type="submit">Submit notes</button>
    </form>,
  );
  const textarea = screen.getByRole('textbox', { name: 'Notes to submit' }).element();
  if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('Missing native textarea');
  expect(textarea.checkValidity()).toBe(false);
  await userEvent.fill(textarea, 'First');
  await userEvent.keyboard('{End}{Enter}Second');
  expect(textarea).toHaveValue('First\nSecond');
  expect(onKeyDown.mock.calls.some(([event]) => event.key === 'Enter')).toBe(true);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(textarea.checkValidity()).toBe(true);
  await userEvent.fill(textarea, 'Submitted notes');
  const form = textarea.form;
  expect(form).not.toBeNull();
  expect([...new FormData(form!).entries()]).toEqual([
    ['notes', 'Submitted notes'],
    ['archive', 'Saved'],
  ]);
  await userEvent.click(screen.getByRole('button', { name: 'Submit notes' }));
  expect(onSubmit).toHaveBeenCalledOnce();
});
