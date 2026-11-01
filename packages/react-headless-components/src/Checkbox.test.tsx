// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import type { SlotRenderFunction } from '@fluentui/react-utilities';
import {
  Checkbox as LegacyCheckbox,
  Field,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  CheckboxComparison,
  checkboxCheckedStates,
  checkboxConsumerExample,
  checkboxExamples,
  type CheckboxExample,
} from '../../../apps/storybook/src/stories/experiments/CheckboxComparison.js';
import {
  captureCheckboxStyles,
  compareCheckboxStyles,
  getCheckboxSlots,
  getComparisonCheckbox,
  settleCheckboxStyles,
} from '../../../apps/storybook/src/stories/experiments/compareCheckboxStyles.js';
import { Checkbox, checkboxClassNames, type CheckboxProps } from './Checkbox.js';
import { labelClassNames, type Label } from './Label.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

function getNativeCheckbox(element: Element): HTMLInputElement {
  if (!(element instanceof HTMLInputElement) || element.type !== 'checkbox') {
    throw new Error('Expected a native Checkbox input');
  }
  return element;
}

function getNativeForm(element: Element): HTMLFormElement {
  if (!(element instanceof HTMLFormElement)) {
    throw new Error('Expected a native form');
  }
  return element;
}

interface KeyboardDiagnostic {
  key: string;
  code: string;
  trusted: boolean;
  targetId: string | null;
}

function nativeFocusDiagnostics(root: HTMLElement, keys: readonly KeyboardDiagnostic[]): string {
  const { input } = getCheckboxSlots(root);
  const document = input.ownerDocument;
  const styles = getComputedStyle(input);
  return JSON.stringify({
    inputId: input.id,
    activeElementId: document.activeElement?.id,
    documentFocused: document.hasFocus(),
    inputFocused: input.matches(':focus'),
    inputFocusVisible: input.matches(':focus-visible'),
    rootHovered: root.matches(':hover'),
    inputHovered: input.matches(':hover'),
    inputDisplay: styles.display,
    inputVisibility: styles.visibility,
    inputOpacity: styles.opacity,
    focusRingContent: getComputedStyle(root, '::after').content,
    recentKeys: keys.slice(-4),
  });
}

async function renderPair(
  example: CheckboxExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<CheckboxComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const pointerTarget = screen.getByText('Case', { exact: true });
  await userEvent.hover(pointerTarget);
  const legacy = getComparisonCheckbox(screen.container, 'legacy');
  const headless = getComparisonCheckbox(screen.container, 'headless');
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  await Promise.all([settleCheckboxStyles(legacy), settleCheckboxStyles(headless)]);
  return { screen, pointerTarget, legacy, headless };
}

async function captureKeyboardPress(root: HTMLElement) {
  const { input } = getCheckboxSlots(root);
  const checked = input.checked;
  const indeterminate = input.indeterminate;
  await userEvent.keyboard('[Space>]');
  try {
    // Space presses the native checkbox, not its wrapper; the toggle commits on key release.
    expect(root.matches(':active')).toBe(false);
    expect(input.matches(':active')).toBe(true);
    await expect.element(input).toHaveFocus();
    expect(input.matches(':focus-visible')).toBe(true);
    expect(input.checked).toBe(checked);
    expect(input.indeterminate).toBe(indeterminate);
    await settleCheckboxStyles(root);
    return captureCheckboxStyles(root);
  } finally {
    await userEvent.keyboard('[/Space]');
  }
}

test.each(checkboxCheckedStates)(
  'keeps checked=%s keyboard activation on Space release while preserving native focus',
  async (checked) => {
    const changes: {
      checked: boolean | 'mixed';
      nativeChecked: boolean;
      indeterminate: boolean;
    }[] = [];
    const onChange = vi.fn<NonNullable<CheckboxProps['onChange']>>((event, data) => {
      changes.push({
        checked: data.checked,
        nativeChecked: event.currentTarget.checked,
        indeterminate: event.currentTarget.indeterminate,
      });
    });
    const { legacy, headless } = await renderPair({
      name: 'Native keyboard hold',
      props: { label: 'Keyboard preference', checked, onChange },
    });
    await userEvent.keyboard('{Escape}');
    for (const [implementation, root] of [
      ['legacy', legacy],
      ['headless', headless],
    ] as const) {
      const { input } = getCheckboxSlots(root);
      await userEvent.tab();
      await expect.element(input).toHaveFocus();
      expect(input.matches(':focus-visible')).toBe(true);
      expect(root.matches(':hover')).toBe(false);
      await settleCheckboxStyles(root);
      const focused = captureCheckboxStyles(root);
      const previousChanges = changes.length;
      const keys: KeyboardDiagnostic[] = [];
      const recordKey = (event: KeyboardEvent) => {
        keys.push({
          key: event.key,
          code: event.code,
          trusted: event.isTrusted,
          targetId: event.target instanceof Element ? event.target.id : null,
        });
      };
      input.addEventListener('keydown', recordKey);
      try {
        await userEvent.keyboard('[Space>]');
        await settleCheckboxStyles(root);
        const held = captureCheckboxStyles(root);
        expect(
          { rootActive: root.matches(':active'), inputActive: input.matches(':active') },
          `${implementation} native Space-hold state`,
        ).toEqual({ rootActive: false, inputActive: true });
        expect(compareCheckboxStyles(focused, held)).toEqual([]);
        expect(keys[0]?.code).toBe('Space');
        expect(keys[0]?.trusted).toBe(true);
        expect(keys[0]?.targetId).toBe(input.id);
        await expect.element(input).toHaveFocus();
        expect(input.matches(':focus-visible')).toBe(true);
        expect(input.checked).toBe(checked === true);
        expect(input.indeterminate).toBe(checked === 'mixed');
        expect(changes).toHaveLength(previousChanges);
      } finally {
        await userEvent.keyboard('[/Space]');
        input.removeEventListener('keydown', recordKey);
      }
      expect(changes).toHaveLength(previousChanges + 1);
      expect(changes[previousChanges]).toEqual({
        checked: checked !== true,
        nativeChecked: checked !== true,
        indeterminate: false,
      });
    }
  },
);

test.each(checkboxCheckedStates)(
  'matches checked=%s wrapper pressed styles during native pointer activation',
  async (checked) => {
    const onChange = vi.fn();
    const presses: {
      input: HTMLInputElement;
      rootActive: boolean;
      inputActive: boolean;
      trusted: boolean;
      checked: boolean;
      indeterminate: boolean;
      changes: number;
      styles: Record<string, string>;
    }[] = [];
    const onMouseDown: NonNullable<CheckboxProps['onMouseDown']> = (event) => {
      const input = event.currentTarget;
      const root = input.closest<HTMLElement>('.fui-Checkbox');
      if (!root) throw new Error('Missing pointer-pressed Checkbox root');
      presses.push({
        input,
        rootActive: root.matches(':active'),
        inputActive: input.matches(':active'),
        trusted: event.isTrusted,
        checked: input.checked,
        indeterminate: input.indeterminate,
        changes: onChange.mock.calls.length,
        styles: captureCheckboxStyles(root),
      });
    };
    const { legacy, headless } = await renderPair({
      name: 'Native pointer press',
      props: { label: 'Pointer preference', checked, onChange, onMouseDown },
    });
    const resting = captureCheckboxStyles(headless);
    await userEvent.click(getCheckboxSlots(legacy).input);
    await userEvent.click(getCheckboxSlots(headless).input);
    expect(presses).toHaveLength(2);
    const [legacyPress, headlessPress] = presses;
    if (!legacyPress || !headlessPress) throw new Error('Missing native pointer-press snapshots');
    for (const [index, press] of presses.entries()) {
      expect(press.rootActive).toBe(true);
      expect(press.inputActive).toBe(true);
      expect(press.trusted).toBe(true);
      expect(press.checked).toBe(checked === true);
      expect(press.indeterminate).toBe(checked === 'mixed');
      expect(press.changes).toBe(index);
      expect(onChange).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({ target: press.input }),
        { checked: checked !== true },
      );
    }
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(compareCheckboxStyles(legacyPress.styles, headlessPress.styles)).toEqual([]);
    expect(headlessPress.styles['indicator.border-top-color']).not.toBe(
      resting['indicator.border-top-color'],
    );
  },
);

for (const [mode, theme] of themes) {
  test.each(checkboxExamples)(
    `matches $name owned-slot styles, dimensions, and glyph visibility in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareCheckboxStyles(captureCheckboxStyles(legacy), captureCheckboxStyles(headless)),
      ).toEqual([]);
      const oldSlots = getCheckboxSlots(legacy);
      const newSlots = getCheckboxSlots(headless);
      expect(newSlots.input.id).not.toBe(oldSlots.input.id);
      expect(oldSlots.label?.control).toBe(oldSlots.input);
      expect(newSlots.label?.control).toBe(newSlots.input);
      expect(newSlots.input.checked).toBe(oldSlots.input.checked);
      expect(newSlots.input.indeterminate).toBe(oldSlots.input.indeterminate);
      if (newSlots.glyph) {
        expect(getComputedStyle(newSlots.glyph).display).not.toBe('none');
        expect(getComputedStyle(newSlots.glyph).visibility).toBe('visible');
        expect(newSlots.glyph.getBoundingClientRect().width).toBeGreaterThan(0);
      }
    },
  );

  test.each(checkboxCheckedStates)(
    `matches checked=%s on hover, pure focus, focused hover, and keyboard press in ${mode} mode`,
    async (checked) => {
      const onChange = vi.fn();
      const { pointerTarget, legacy, headless } = await renderPair(
        { name: String(checked), props: { label: 'Send project updates', checked, onChange } },
        theme,
      );
      const resting = captureCheckboxStyles(headless);
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleCheckboxStyles(legacy);
      const hovered = captureCheckboxStyles(legacy);
      await userEvent.hover(headless);
      expect(headless.matches(':hover')).toBe(true);
      await settleCheckboxStyles(headless);
      expect(compareCheckboxStyles(hovered, captureCheckboxStyles(headless))).toEqual([]);
      expect(hovered['indicator.border-top-color']).not.toBe(resting['indicator.border-top-color']);

      const keys: KeyboardDiagnostic[] = [];
      const recordKey = (event: KeyboardEvent) => {
        keys.push({
          key: event.key,
          code: event.code,
          trusted: event.isTrusted,
          targetId: event.target instanceof Element ? event.target.id : null,
        });
      };
      const document = getCheckboxSlots(legacy).input.ownerDocument;
      document.addEventListener('keydown', recordKey, true);
      try {
        await userEvent.hover(pointerTarget);
        await userEvent.keyboard('{Escape}');
        await userEvent.tab();
        await expect.element(getCheckboxSlots(legacy).input).toHaveFocus();
        expect(legacy.matches(':hover')).toBe(false);
        expect(
          getCheckboxSlots(legacy).input.matches(':focus-visible'),
          nativeFocusDiagnostics(legacy, keys),
        ).toBe(true);
        await expect.poll(() => getComputedStyle(legacy, '::after').content).toBe('""');
        await settleCheckboxStyles(legacy);
        const focused = captureCheckboxStyles(legacy);
        await userEvent.hover(legacy);
        expect(legacy.matches(':hover')).toBe(true);
        await settleCheckboxStyles(legacy);
        const focusedHover = captureCheckboxStyles(legacy);
        await userEvent.hover(pointerTarget);
        expect(legacy.matches(':hover')).toBe(false);
        const pressed = await captureKeyboardPress(legacy);

        await userEvent.tab();
        await expect.element(getCheckboxSlots(headless).input).toHaveFocus();
        expect(headless.matches(':hover')).toBe(false);
        expect(
          getCheckboxSlots(headless).input.matches(':focus-visible'),
          nativeFocusDiagnostics(headless, keys),
        ).toBe(true);
        await settleCheckboxStyles(headless);
        expect(compareCheckboxStyles(focused, captureCheckboxStyles(headless))).toEqual([]);
        await userEvent.hover(headless);
        expect(headless.matches(':hover')).toBe(true);
        await settleCheckboxStyles(headless);
        expect(compareCheckboxStyles(focusedHover, captureCheckboxStyles(headless))).toEqual([]);
        await userEvent.hover(pointerTarget);
        expect(headless.matches(':hover')).toBe(false);
        expect(compareCheckboxStyles(pressed, await captureKeyboardPress(headless))).toEqual([]);
        const nextChecked = checked !== true;
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(1, expect.anything(), { checked: nextChecked });
        expect(onChange).toHaveBeenNthCalledWith(2, expect.anything(), { checked: nextChecked });
      } finally {
        document.removeEventListener('keydown', recordKey, true);
      }
    },
  );

  test.each(checkboxCheckedStates)(
    `keeps disabled checked=%s unchanged on hover and native label activation in ${mode} mode`,
    async (checked) => {
      const onChange = vi.fn();
      const { legacy, headless } = await renderPair(
        {
          name: `Disabled ${String(checked)}`,
          props: { label: 'Unavailable preference', disabled: true, checked, onChange },
        },
        theme,
      );
      await userEvent.hover(legacy);
      expect(legacy.matches(':hover')).toBe(true);
      await settleCheckboxStyles(legacy);
      const expected = captureCheckboxStyles(legacy);
      await userEvent.hover(headless);
      expect(headless.matches(':hover')).toBe(true);
      await settleCheckboxStyles(headless);
      expect(compareCheckboxStyles(expected, captureCheckboxStyles(headless))).toEqual([]);
      for (const root of [legacy, headless]) {
        const { input, label } = getCheckboxSlots(root);
        if (!label) throw new Error('Missing disabled Checkbox label');
        // Playwright otherwise waits for the associated disabled input to become enabled.
        await userEvent.click(label, { force: input.disabled });
        expect(input.disabled).toBe(true);
        expect(input.checked).toBe(checked === true);
        expect(input.indeterminate).toBe(checked === 'mixed');
        await expect.element(input).not.toHaveFocus();
      }
      expect(getComputedStyle(headless).cursor).toBe('default');
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  test(`allows ordinary consumer CSS to override Checkbox and nested Label visuals in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(checkboxConsumerExample, theme);
    const values = captureCheckboxStyles(headless);
    expect(values['root.color']).toBe('rgb(20, 90, 160)');
    expect(values['input.width']).toBe('44.00');
    expect(values['indicator.width']).toBe('24.00');
    expect(values['indicator.height']).toBe('24.00');
    expect(values['indicator.border-radius']).toBe('3px');
    expect(values['indicator.border-top-color']).toBe('rgb(40, 110, 60)');
    expect(values['indicator.background-color']).toBe('rgb(235, 245, 240)');
    expect(values['label.font-size']).toBe('18px');
    expect(values['label.font-weight']).toBe('400');
    expect(values['label.line-height']).toBe('26px');
    expect(values['label.padding-left']).toBe('12px');
    expect(values['required.color']).toBe('rgb(40, 110, 60)');
    expect(values['required.padding-left']).toBe('10px');
    expect(compareCheckboxStyles(captureCheckboxStyles(legacy), values).length).toBeGreaterThan(0);
  });
}

test('exposes only the missing current Checkbox visual props', () => {
  expectTypeOf<CheckboxProps['size']>().toEqualTypeOf<'medium' | 'large' | undefined>();
  expectTypeOf<CheckboxProps['shape']>().toEqualTypeOf<'square' | 'circular' | undefined>();
});

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {} },
    {
      name: 'explicitly undefined',
      props: { shape: undefined, size: undefined, labelPosition: undefined, disabled: undefined },
    },
  ])(
    `keeps $name Fluent defaults with CoreAI defaults ${withComponentDefaults}`,
    async ({ props }) => {
      const { legacy, headless } = await renderPair(
        { name: 'Defaults', props: { ...props, label: 'Send project updates' } },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(
        compareCheckboxStyles(captureCheckboxStyles(legacy), captureCheckboxStyles(headless)),
      ).toEqual([]);
      expect(headless).toHaveAttribute('data-shape', 'square');
      expect(headless).toHaveAttribute('data-size', 'medium');
      expect(headless).toHaveAttribute('data-label-position', 'after');
      expect(headless).not.toHaveAttribute('data-disabled');
      expect(headless).not.toHaveAttribute('data-checked');
      expect(getCheckboxSlots(headless).label).toHaveAttribute('data-size', 'medium');
      expect(getCheckboxSlots(headless).input).not.toHaveAttribute('size');
      expect(getCheckboxSlots(headless).input).not.toHaveAttribute('shape');
    },
  );
}

test.each(['before', 'after'] as const)(
  'preserves %s label spacing and the native hit target in RTL',
  async (labelPosition) => {
    const { legacy, headless } = await renderPair(
      {
        name: labelPosition,
        props: {
          label: 'Send project updates',
          labelPosition,
          size: 'large',
          shape: 'circular',
          required: true,
          defaultChecked: 'mixed',
        },
      },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(
      compareCheckboxStyles(captureCheckboxStyles(legacy), captureCheckboxStyles(headless)),
    ).toEqual([]);
    const { input, label } = getCheckboxSlots(headless);
    if (!label) throw new Error('Missing RTL Checkbox label');
    const rootRect = headless.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    if (labelPosition === 'after') {
      expect(inputRect.right).toBeCloseTo(rootRect.right, 2);
      expect(getComputedStyle(label).paddingRight).toBe(coreaiLightTheme.spacingHorizontalXS);
    } else {
      expect(inputRect.left).toBeCloseTo(rootRect.left, 2);
      expect(getComputedStyle(label).paddingLeft).toBe(coreaiLightTheme.spacingHorizontalXS);
    }
  },
);

test('keeps consumer Label and required-marker spacing logical in RTL', async () => {
  const { headless } = await renderPair(checkboxConsumerExample, coreaiLightTheme, true, 'rtl');
  const values = captureCheckboxStyles(headless);
  expect(values['indicator.border-radius']).toBe('3px');
  expect(values['input.width']).toBe('44.00');
  expect(values['label.padding-right']).toBe('12px');
  expect(values['required.padding-right']).toBe('10px');
});

test('preserves keyboard-visible focus within caller label content without styling its children', async () => {
  const { pointerTarget, legacy, headless } = await renderPair({
    name: 'Interactive label content',
    props: {
      label: (
        <span>
          Send updates <a href="#checkbox-details">Details</a>
        </span>
      ),
    },
  });
  await userEvent.keyboard('{Escape}');
  await userEvent.tab();
  await userEvent.tab();
  const legacyLink = getCheckboxSlots(legacy).label?.querySelector('a');
  const headlessLink = getCheckboxSlots(headless).label?.querySelector('a');
  if (!legacyLink || !headlessLink) throw new Error('Missing caller label links');
  await expect.element(legacyLink).toHaveFocus();
  await userEvent.hover(pointerTarget);
  expect(legacy.matches(':hover')).toBe(false);
  await expect.poll(() => getComputedStyle(legacy, '::after').content).toBe('""');
  await settleCheckboxStyles(legacy);
  const focused = captureCheckboxStyles(legacy);
  await userEvent.tab();
  await userEvent.tab();
  await expect.element(headlessLink).toHaveFocus();
  expect(headless.matches(':hover')).toBe(false);
  await settleCheckboxStyles(headless);
  expect(compareCheckboxStyles(focused, captureCheckboxStyles(headless))).toEqual([]);
  expect(headlessLink.classList.length).toBe(0);
});

test.each(
  checkboxExamples.filter(({ name }) =>
    [
      'Checked',
      'Large checked',
      'Mixed',
      'Large mixed',
      'Circular mixed',
      'Large circular mixed',
    ].includes(name),
  ),
)(
  'uses the legacy size and shape glyph for $name without a styled icon component',
  async (example) => {
    const { legacy, headless } = await renderPair(example);
    const oldGlyph = getCheckboxSlots(legacy).glyph;
    const newGlyph = getCheckboxSlots(headless).glyph;
    expect(newGlyph).toBeInstanceOf(SVGSVGElement);
    expect(newGlyph?.getAttribute('viewBox')).toBe(oldGlyph?.getAttribute('viewBox'));
    expect(newGlyph?.querySelector('path')?.getAttribute('d')).toBe(
      oldGlyph?.querySelector('path')?.getAttribute('d'),
    );
    expect(newGlyph).toHaveAttribute('aria-hidden', 'true');
    expect(newGlyph).toHaveAttribute('data-fui-icon', '');
    expect(newGlyph?.className.baseVal).not.toMatch(/(?:^|\s)__|(?:^|\s)f\d/);
  },
);

test.each([
  { name: 'null', children: null, defaultGlyph: true },
  { name: 'undefined', children: undefined, defaultGlyph: true },
  { name: 'empty string', children: '', defaultGlyph: false },
  { name: 'false', children: false, defaultGlyph: false },
])(
  'preserves the nullish-only default glyph rule for $name children',
  async ({ children, defaultGlyph }) => {
    const { legacy, headless } = await renderPair({
      name: 'Indicator children',
      props: { label: 'Send project updates', defaultChecked: true, indicator: { children } },
    });
    expect(Boolean(getCheckboxSlots(legacy).glyph)).toBe(defaultGlyph);
    expect(Boolean(getCheckboxSlots(headless).glyph)).toBe(defaultGlyph);
  },
);

test('preserves native refs, Label refs and markers, caller slot props, and arbitrary children', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const indicatorRef = React.createRef<HTMLDivElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const requiredRef = React.createRef<HTMLSpanElement>();
  const rootSlot = {
    ref: rootRef,
    title: 'Preference root',
    'data-consumer': 'root',
  } satisfies NonNullable<CheckboxProps['root']> & { 'data-consumer': string };
  const inputSlot = {
    className: 'consumer-input',
    name: 'updates',
    value: 'yes',
    size: 6,
    'data-consumer': 'input',
  } satisfies NonNullable<CheckboxProps['input']> & { 'data-consumer': string };
  await renderCoreAIComponent(
    <Checkbox
      ref={inputRef}
      id="checkbox-slots"
      className="consumer-checkbox"
      root={rootSlot}
      input={inputSlot}
      indicator={{
        ref: indicatorRef,
        className: 'consumer-indicator',
        title: 'Custom indicator',
        'aria-hidden': false,
        children: <span className="consumer-indicator-child">✓</span>,
      }}
      label={{
        ref: labelRef,
        className: 'consumer-label',
        title: 'Preference label',
        size: 'small',
        weight: 'semibold',
        children: <span className="consumer-label-child">Send project updates</span>,
        required: {
          ref: requiredRef,
          className: 'consumer-required',
          title: 'Required preference',
          children: <em className="consumer-required-child">!</em>,
        },
      }}
      size="large"
      shape="circular"
      checked="mixed"
      required
    />,
  );
  const root = rootRef.current;
  if (!root) throw new Error('Missing forwarded Checkbox root ref');
  const { input, label, indicator, required } = getCheckboxSlots(root);
  expect(inputRef.current).toBe(input);
  expect(labelRef.current).toBe(label);
  expect(indicatorRef.current).toBe(indicator);
  expect(requiredRef.current).toBe(required);
  expect(root).toHaveClass(checkboxClassNames.root, 'consumer-checkbox');
  expect(root).toHaveAttribute('data-consumer', 'root');
  expect(root).toHaveAttribute('title', 'Preference root');
  expect(root).toHaveAttribute('data-checked', 'mixed');
  expect(root).toHaveAttribute('data-size', 'large');
  expect(root).toHaveAttribute('data-shape', 'circular');
  expect(input).toHaveClass(checkboxClassNames.input, 'consumer-input');
  expect(input).toHaveAttribute('data-consumer', 'input');
  expect(input).toHaveAttribute('name', 'updates');
  expect(input).toHaveAttribute('value', 'yes');
  expect(input).toHaveAttribute('size', '6');
  expect(input.required).toBe(true);
  expect(input.indeterminate).toBe(true);
  expect(input.checked).toBe(false);
  expect(label).toHaveClass(checkboxClassNames.label, labelClassNames.root, 'consumer-label');
  expect(label).toHaveAttribute('data-size', 'small');
  expect(label).toHaveAttribute('data-weight', 'semibold');
  expect(label).toHaveAttribute('data-required', '');
  expect(label?.control).toBe(input);
  expect(required).toHaveClass(labelClassNames.required, 'consumer-required');
  expect(required).toHaveAttribute('title', 'Required preference');
  expect(indicator).toHaveClass(checkboxClassNames.indicator, 'consumer-indicator');
  expect(indicator).toHaveAttribute('aria-hidden', 'false');
  expect(indicator).toHaveAttribute('title', 'Custom indicator');
  for (const element of [
    indicator?.firstElementChild,
    label?.firstElementChild,
    required?.firstElementChild,
  ]) {
    for (const marker of [
      ...Object.values(checkboxClassNames),
      ...Object.values(labelClassNames),
    ]) {
      expect(element).not.toHaveClass(marker);
    }
    expect(element?.classList.length).toBe(1);
  }
  expect(input).not.toHaveAttribute('shape');
  expect(label).not.toHaveAttribute('disabled');
  expect(label).not.toHaveAttribute('required');
});

test('preserves label slot render functions when rebinding to the local Label', async () => {
  const onChange = vi.fn();
  const renderLabel = vi.fn();
  const renderLabelSlot: SlotRenderFunction<React.ComponentProps<typeof Label>> = (
    Component,
    props,
  ) => {
    renderLabel(props);
    return (
      <Component {...props}>
        <span className="consumer-render-child">Rendered preference</span>
      </Component>
    );
  };
  const screen = await renderCoreAIComponent(
    <Checkbox
      id="render-label"
      required
      onChange={onChange}
      label={{
        className: 'consumer-render-label',
        children: renderLabelSlot,
      }}
    />,
  );
  const input = screen.getByRole('checkbox', { name: 'Rendered preference' }).element();
  const root = input.closest<HTMLElement>('.fui-Checkbox');
  if (!root) throw new Error('Missing rendered Checkbox root');
  const { label, required } = getCheckboxSlots(root);
  expect(label).toHaveClass(
    checkboxClassNames.label,
    labelClassNames.root,
    'consumer-render-label',
  );
  expect(label?.control).toBe(input);
  expect(required).toHaveClass(labelClassNames.required);
  expect(renderLabel).toHaveBeenCalledWith(
    expect.objectContaining({ htmlFor: 'render-label', required: true, size: 'medium' }),
  );
  await userEvent.click(screen.getByText('Rendered preference'));
  await expect.element(input).toBeChecked();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
});

test('retains an explicit input-slot ref and a consumer-supplied label association', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const screen = await renderCoreAIComponent(
    <Checkbox
      id="top-level-id"
      input={{ ref: inputRef, id: 'slot-id', name: 'slot-name', value: 'slot-value' }}
      label={{ htmlFor: 'slot-id', children: 'Slot preference' }}
    />,
  );
  const input = screen.getByRole('checkbox', { name: 'Slot preference' }).element();
  expect(inputRef.current).toBe(input);
  expect(input).toHaveAttribute('id', 'slot-id');
  expect(input).toHaveAttribute('name', 'slot-name');
  expect(input).toHaveAttribute('value', 'slot-value');
});

test('keeps optional label and indicator removal without inventing a replacement slot', async () => {
  const screen = await renderCoreAIComponent(
    <Checkbox aria-label="Compact preference" label={null} indicator={null} />,
  );
  const input = screen.getByRole('checkbox', { name: 'Compact preference' }).element();
  const root = input.closest<HTMLElement>('.fui-Checkbox');
  if (!root) throw new Error('Missing compact Checkbox root');
  expect(getCheckboxSlots(root).label).toBeNull();
  expect(getCheckboxSlots(root).indicator).toBeNull();
  expect(input).toHaveClass(checkboxClassNames.input);
});

for (const labelPosition of ['before', 'after'] as const) {
  test.each(checkboxCheckedStates)(
    `preserves uncontrolled defaultChecked=%s through ${labelPosition} label clicks and Space`,
    async (defaultChecked) => {
      const calls: { source: string; checked: boolean | 'mixed'; indeterminate: boolean }[] = [];
      const onChange = vi.fn<NonNullable<CheckboxProps['onChange']>>((event, data) => {
        calls.push({
          source: 'component',
          checked: data.checked,
          indeterminate: event.currentTarget.indeterminate,
        });
      });
      const inputChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
        calls.push({
          source: 'input',
          checked: event.currentTarget.checked,
          indeterminate: event.currentTarget.indeterminate,
        });
      });
      const screen = await renderCoreAIComponent(
        <Checkbox
          label="Send project updates"
          labelPosition={labelPosition}
          defaultChecked={defaultChecked}
          onChange={onChange}
          input={{ onChange: inputChange }}
        />,
      );
      const input = screen.getByRole('checkbox', { name: 'Send project updates' }).element();
      expect(input).toBeInstanceOf(HTMLInputElement);
      const nativeInput = getNativeCheckbox(input);
      expect(nativeInput.checked).toBe(defaultChecked === true);
      expect(nativeInput.indeterminate).toBe(defaultChecked === 'mixed');
      expect(nativeInput.matches(':indeterminate')).toBe(defaultChecked === 'mixed');
      await userEvent.click(screen.getByText('Send project updates', { exact: true }));
      const firstChecked = defaultChecked !== true;
      expect(nativeInput.checked).toBe(firstChecked);
      expect(nativeInput.indeterminate).toBe(false);
      await userEvent.keyboard(' ');
      expect(nativeInput.checked).toBe(!firstChecked);
      expect(nativeInput.indeterminate).toBe(false);
      expect(calls).toEqual([
        { source: 'input', checked: firstChecked, indeterminate: false },
        { source: 'component', checked: firstChecked, indeterminate: false },
        { source: 'input', checked: !firstChecked, indeterminate: false },
        { source: 'component', checked: !firstChecked, indeterminate: false },
      ]);
      expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ target: input }), {
        checked: firstChecked,
      });
      expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ target: input }), {
        checked: !firstChecked,
      });
      const root = input.closest<HTMLElement>('.fui-Checkbox');
      if (!root) throw new Error('Missing uncontrolled Checkbox root');
      expect(Boolean(getCheckboxSlots(root).glyph)).toBe(!firstChecked);
    },
  );
}

test('preserves a fixed controlled value until its owner changes it', async () => {
  const onChange = vi.fn();
  const props = { label: 'Controlled preference', onChange };
  const screen = await renderCoreAIComponent(<Checkbox {...props} checked={false} />);
  const input = screen.getByRole('checkbox', { name: 'Controlled preference' });
  await userEvent.click(screen.getByText('Controlled preference'));
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
  await expect.element(input).not.toBeChecked();
  await screen.rerender(<Checkbox {...props} checked />);
  await expect.element(input).toBeChecked();
  await userEvent.keyboard(' ');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: false });
  await expect.element(input).toBeChecked();
});

test('keeps native mixed state, callback values, and the glyph synchronized in a controlled flow', async () => {
  const onChange = vi.fn();
  function ControlledCheckbox() {
    const [checked, setChecked] = React.useState<CheckboxProps['checked']>('mixed');
    return (
      <>
        <Checkbox
          label="Controlled mixed preference"
          checked={checked}
          onChange={(event, data) => {
            onChange(event, data);
            setChecked(data.checked);
          }}
        />
        <button type="button" onClick={() => setChecked('mixed')}>
          Restore mixed
        </button>
      </>
    );
  }
  const screen = await renderCoreAIComponent(<ControlledCheckbox />);
  const input = screen.getByRole('checkbox', { name: 'Controlled mixed preference' });
  await expect.element(input).toBePartiallyChecked();
  await userEvent.click(screen.getByText('Controlled mixed preference'));
  await expect.element(input).toBeChecked();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
  await userEvent.keyboard(' ');
  await expect.element(input).not.toBeChecked();
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: false });
  await userEvent.click(screen.getByRole('button', { name: 'Restore mixed' }));
  await expect.element(input).toBePartiallyChecked();
  const nativeInput = getNativeCheckbox(input.element());
  expect(nativeInput.indeterminate).toBe(true);
  expect(nativeInput.checked).toBe(false);
  const root = nativeInput.closest<HTMLElement>('.fui-Checkbox');
  if (!root) throw new Error('Missing controlled Checkbox root');
  expect(root).toHaveAttribute('data-checked', 'mixed');
  expect(getCheckboxSlots(root).glyph).not.toBeNull();
  expect(onChange).toHaveBeenCalledTimes(2);
});

for (const [implementation, Component] of [
  ['legacy', LegacyCheckbox],
  ['headless', Checkbox],
] as const) {
  test.each([false, 'mixed'] as const)(
    `keeps required defaultChecked=%s validation, external form association, and submission in ${implementation}`,
    async (defaultChecked) => {
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
      });
      const screen = await renderCoreAIComponent(
        <>
          <form id="preferences-form" data-testid="preferences-form" onSubmit={onSubmit}>
            <button type="submit">Save preferences</button>
          </form>
          <Component
            label="Required updates"
            form="preferences-form"
            name="updates"
            value="yes"
            required
            defaultChecked={defaultChecked}
          />
        </>,
      );
      const input = getNativeCheckbox(
        screen.getByRole('checkbox', { name: 'Required updates' }).element(),
      );
      const form = getNativeForm(screen.getByTestId('preferences-form').element());
      const label = input.labels?.item(0);
      if (!label) throw new Error('Missing associated required Checkbox label');
      expect(label.control).toBe(input);
      expect(input.form).toBe(form);
      expect(input.required).toBe(true);
      expect(input.willValidate).toBe(true);
      expect(input.checked).toBe(false);
      expect(input.indeterminate).toBe(defaultChecked === 'mixed');
      expect(input.validity.valueMissing).toBe(true);
      expect(input.checkValidity()).toBe(false);
      expect(new FormData(form).get('updates')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
      expect(onSubmit).not.toHaveBeenCalled();
      await userEvent.click(label);
      expect(input.checked).toBe(true);
      expect(input.indeterminate).toBe(false);
      expect(input.checkValidity()).toBe(true);
      expect(new FormData(form).get('updates')).toBe('yes');
      await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    },
  );

  test(`keeps disabled required controls out of validation, tab order, and FormData in ${implementation}`, async () => {
    const onChange = vi.fn();
    const screen = await renderCoreAIComponent(
      <form data-testid="disabled-form">
        <Component
          label="Disabled updates"
          name="updates"
          value="yes"
          disabled
          required
          defaultChecked
          onChange={onChange}
        />
        <button type="button">Next control</button>
      </form>,
    );
    const input = getNativeCheckbox(
      screen.getByRole('checkbox', { name: 'Disabled updates' }).element(),
    );
    const form = getNativeForm(screen.getByTestId('disabled-form').element());
    const label = input.labels?.item(0);
    if (!label) throw new Error('Missing associated disabled Checkbox label');
    expect(label.control).toBe(input);
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.checked).toBe(true);
    expect(input.willValidate).toBe(false);
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).has('updates')).toBe(false);
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Next control' })).toHaveFocus();
    await userEvent.click(label, {
      force: input.disabled,
    });
    expect(input.checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  test(`retains the actual native-property filter for defaultValue and onInvalid in ${implementation}`, async () => {
    const onInvalid = vi.fn();
    const screen = await renderCoreAIComponent(
      <Component
        label="Filtered preference"
        name="preference"
        defaultValue="not-forwarded"
        required
        onInvalid={onInvalid}
      />,
    );
    const input = getNativeCheckbox(
      screen.getByRole('checkbox', { name: 'Filtered preference' }).element(),
    );
    expect(input.value).toBe('on');
    expect(input.checkValidity()).toBe(false);
    expect(onInvalid).not.toHaveBeenCalled();
  });

  test(`preserves Field association and required semantics without inheriting its visual size in ${implementation}`, async () => {
    const screen = await renderCoreAIComponent(
      <Field
        label="Project consent"
        size="large"
        required
        hint="Select to receive updates"
        validationState="error"
        validationMessage="Selection required"
      >
        <Component />
      </Field>,
    );
    const input = getNativeCheckbox(
      screen.getByRole('checkbox', { name: 'Project consent' }).element(),
    );
    const root = input.closest<HTMLElement>('.fui-Checkbox');
    if (!root) throw new Error('Missing Field Checkbox root');
    expect(input.required).toBe(true);
    expect(input.checkValidity()).toBe(false);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(describedBy).toContain(screen.getByText('Select to receive updates').element().id);
    expect(describedBy).toContain(screen.getByText('Selection required').element().id);
    expect(getCheckboxSlots(root).label).toBeNull();
    expect(getCheckboxSlots(root).indicator?.getBoundingClientRect().width).toBe(16);
  });
}

test('allows global consumer selectors for both Checkbox and the shared Label markers', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <style>{`
        .checkbox-consumer .fui-Checkbox { color: rgb(12, 34, 56); }
        .checkbox-consumer .fui-Checkbox__indicator { border-radius: 5px; }
        .checkbox-consumer .fui-Label { font-size: 20px; }
        .checkbox-consumer .fui-Label__required { padding-inline-start: 11px; }
      `}</style>
      <div className="checkbox-consumer">
        <Checkbox required label="Globally targeted preference" />
      </div>
    </>,
  );
  const input = screen.getByRole('checkbox', { name: 'Globally targeted preference' }).element();
  const root = input.closest<HTMLElement>('.fui-Checkbox');
  if (!root) throw new Error('Missing globally targeted Checkbox root');
  const values = captureCheckboxStyles(root);
  expect(values['root.color']).toBe('rgb(12, 34, 56)');
  expect(values['label.color']).toBe('rgb(12, 34, 56)');
  expect(values['indicator.border-radius']).toBe('5px');
  expect(values['label.font-size']).toBe('20px');
  expect(values['required.padding-left']).toBe('11px');
});
