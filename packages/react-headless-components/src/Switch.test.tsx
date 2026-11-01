// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import {
  Switch as LegacySwitch,
  Field,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  SwitchComparison,
  switchConsumerExample,
  switchExamples,
  switchLabelPositions,
  switchSizes,
  type SwitchExample,
} from '../../../apps/storybook/src/stories/experiments/SwitchComparison.js';
import {
  captureSwitchStyles,
  compareSwitchStyles,
  getComparisonSwitch,
  settleSwitchStyles,
  type ComparisonSwitch,
} from '../../../apps/storybook/src/stories/experiments/compareSwitchStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/SwitchComparison.module.css';
import { Switch, switchClassNames, type SwitchProps, type SwitchSlots } from './Switch.js';
import { Label, labelClassNames } from './Label.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SwitchExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <>
      <div className={comparisonStyles.pointerParking} data-testid="pointer-parking" aria-hidden />
      <SwitchComparison examples={[example]} />
    </>,
    { providerProps: { theme, withComponentDefaults, dir } },
  );
  const legacy = getComparisonSwitch(screen.container, 'legacy');
  const headless = getComparisonSwitch(screen.container, 'headless');
  // The browser retains pointer coordinates between tests, which can hover a newly mounted input.
  await userEvent.hover(screen.getByTestId('pointer-parking'));
  for (const control of [legacy, headless]) {
    expect(control.input.matches(':hover')).toBe(false);
  }
  await Promise.all([settleSwitchStyles(legacy), settleSwitchStyles(headless)]);
  return { screen, legacy, headless };
}

async function capturePointerPress(control: ComparisonSwitch): Promise<Record<string, string>> {
  await userEvent.hover(control.input);
  await settleSwitchStyles(control);
  let onMouseDown: () => void = () => {};
  const pressed = new Promise<Record<string, string>>((resolve, reject) => {
    onMouseDown = () => {
      settleSwitchStyles(control)
        .then(() => {
          if (!control.input.matches(':hover:active')) {
            throw new Error('Pointer press ended before the Switch transition settled');
          }
          resolve(captureSwitchStyles(control));
        })
        .catch(reject);
    };
    control.input.addEventListener('mousedown', onMouseDown, { once: true });
  });
  try {
    const [values] = await Promise.all([pressed, userEvent.click(control.input, { delay: 500 })]);
    return values;
  } finally {
    control.input.removeEventListener('mousedown', onMouseDown);
  }
}

for (const [mode, theme] of themes) {
  test.each(switchExamples)(
    `matches $name slots and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareSwitchStyles(captureSwitchStyles(legacy), captureSwitchStyles(headless)),
      ).toEqual([]);
      expect(legacy.input.id).not.toBe(headless.input.id);
      for (const control of [legacy, headless]) {
        expect(control.input).toHaveAttribute('role', 'switch');
        expect(control.input.type).toBe('checkbox');
        if (control.label) expect(control.label.control).toBe(control.input);
      }
      expect(headless.input.checked).toBe(legacy.input.checked);
      expect(headless.input.disabled).toBe(legacy.input.disabled);
    },
  );

  test.each([false, true])(`matches checked=%s hover colors in ${mode} mode`, async (checked) => {
    const { legacy, headless } = await renderPair(
      { name: 'Hover', props: { checked, label: 'Notifications' } },
      theme,
    );
    await userEvent.hover(legacy.input);
    expect(legacy.input.matches(':hover')).toBe(true);
    await settleSwitchStyles(legacy);
    const expected = captureSwitchStyles(legacy);
    await userEvent.hover(headless.input);
    expect(headless.input.matches(':hover')).toBe(true);
    await settleSwitchStyles(headless);
    expect(compareSwitchStyles(expected, captureSwitchStyles(headless))).toEqual([]);
  });

  test(`matches pure keyboard focus and Space press in ${mode} mode without accidental hover`, async () => {
    const onChange = vi.fn();
    const { screen, legacy, headless } = await renderPair(
      { name: 'Focus', props: { label: 'Notifications', onChange } },
      theme,
    );
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    await expect.element(legacy.input).toHaveFocus();
    expect(legacy.input.matches(':hover')).toBe(false);
    await settleSwitchStyles(legacy);
    expect(getComputedStyle(legacy.root, '::after').content).not.toBe('none');
    const focused = captureSwitchStyles(legacy);
    await userEvent.keyboard('[Space>]');
    expect(legacy.input.matches(':active')).toBe(true);
    await settleSwitchStyles(legacy);
    const pressed = captureSwitchStyles(legacy);
    await userEvent.keyboard('[/Space]');
    expect(legacy.input.checked).toBe(true);

    await userEvent.tab();
    await expect.element(headless.input).toHaveFocus();
    expect(headless.input.matches(':focus-visible')).toBe(true);
    expect(headless.input.matches(':hover')).toBe(false);
    await settleSwitchStyles(headless);
    expect(compareSwitchStyles(focused, captureSwitchStyles(headless))).toEqual([]);
    await userEvent.keyboard('[Space>]');
    expect(headless.input.matches(':active')).toBe(true);
    await settleSwitchStyles(headless);
    expect(compareSwitchStyles(pressed, captureSwitchStyles(headless))).toEqual([]);
    await userEvent.keyboard('[/Space]');
    expect(headless.input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls.map(([, data]) => data)).toEqual([
      { checked: true },
      { checked: true },
    ]);
  });

  test.each([false, true])(
    `matches checked=%s pointer-pressed styles in ${mode} mode`,
    async (checked) => {
      const onChange = vi.fn();
      const { legacy, headless } = await renderPair(
        { name: 'Pointer press', props: { checked, label: 'Notifications', onChange } },
        theme,
      );
      const expected = await capturePointerPress(legacy);
      const actual = await capturePointerPress(headless);
      expect(compareSwitchStyles(expected, actual)).toEqual([]);
      expect(legacy.input.checked).toBe(checked);
      expect(headless.input.checked).toBe(checked);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls.map(([, data]) => data)).toEqual([
        { checked: !checked },
        { checked: !checked },
      ]);
    },
  );

  test(`lets unlayered consumer CSS override small checked slots in ${mode} mode`, async () => {
    const { headless } = await renderPair(switchConsumerExample, theme);
    const values = captureSwitchStyles(headless);
    expect(values['root.align-items']).toBe('center');
    expect(values['input.width']).toBe('68.00');
    expect(values['input.cursor']).toBe('crosshair');
    expect(values['indicator.width']).toBe('52.00');
    expect(values['indicator.height']).toBe('24.00');
    expect(values['indicator.border-radius']).toBe('3px');
    expect(values['indicator.border-top-width']).toBe('2px');
    expect(values['indicator.background-color']).toBe('rgb(20, 80, 120)');
    expect(values['indicator.color']).toBe('rgb(250, 240, 200)');
    expect(values['label.font-size']).toBe('18px');
    expect(values['label.line-height']).toBe('24px');
    expect(values['label.color']).toBe('rgb(20, 80, 120)');
    expect(values['required.color']).toBe('rgb(40, 110, 60)');
    expect(values['required.padding-left']).toBe('10px');
  });
}

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {} },
    {
      name: 'explicitly undefined',
      props: {
        size: undefined,
        labelPosition: undefined,
        disabled: undefined,
        disabledFocusable: undefined,
        required: undefined,
      },
    },
  ])(
    `keeps $name Fluent defaults with CoreAI defaults ${withComponentDefaults}`,
    async ({ props }) => {
      const { legacy, headless } = await renderPair(
        { name: 'Defaults', props: { ...props, label: 'Notifications' } },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(
        compareSwitchStyles(captureSwitchStyles(legacy), captureSwitchStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute('data-size', 'medium');
      expect(headless.root).toHaveAttribute('data-label-position', 'after');
      expect(headless.root).not.toHaveAttribute('data-disabled');
      expect(headless.root).not.toHaveAttribute('data-disabled-focusable');
      expect(headless.input).not.toHaveAttribute('size');
    },
  );
}

for (const size of switchSizes) {
  test.each(switchLabelPositions)(
    `matches ${size} label %s placement and checked translation in RTL`,
    async (labelPosition) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'RTL',
          props: {
            size,
            labelPosition,
            defaultChecked: true,
            required: true,
            label: 'Notifications',
          },
        },
        coreaiLightTheme,
        true,
        'rtl',
      );
      expect(
        compareSwitchStyles(captureSwitchStyles(legacy), captureSwitchStyles(headless)),
      ).toEqual([]);
      expect(new DOMMatrix(getComputedStyle(headless.thumb!).transform).m41).toBe(
        size === 'small' ? -16 : -20,
      );
    },
  );
}

test.each([
  { disabled: true, checked: false },
  { disabled: true, checked: true },
  { disabledFocusable: true, checked: true },
])(
  'keeps disabled branch $disabled/$disabledFocusable with checked=$checked unchanged on hover',
  async (props) => {
    const { legacy, headless } = await renderPair({
      name: 'Disabled hover',
      props: { ...props, label: 'Unavailable' },
    });
    const resting = captureSwitchStyles(headless);
    await userEvent.hover(legacy.input);
    await settleSwitchStyles(legacy);
    const expected = captureSwitchStyles(legacy);
    await userEvent.hover(headless.input);
    expect(headless.input.matches(':hover')).toBe(true);
    await settleSwitchStyles(headless);
    const hovered = captureSwitchStyles(headless);
    expect(compareSwitchStyles(expected, hovered)).toEqual([]);
    expect(compareSwitchStyles(resting, hovered)).toEqual([]);
    expect(getComputedStyle(headless.input).cursor).toBe('default');
  },
);

test.each([false, true])(
  'matches checked=%s combined keyboard focus and hover',
  async (checked) => {
    const { screen, legacy, headless } = await renderPair({
      name: 'Combined focus and hover',
      props: { checked, label: 'Notifications' },
    });
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    await userEvent.hover(legacy.input);
    await expect.element(legacy.input).toHaveFocus();
    expect(legacy.input.matches(':hover')).toBe(true);
    await settleSwitchStyles(legacy);
    expect(getComputedStyle(legacy.root, '::after').content).not.toBe('none');
    const expected = captureSwitchStyles(legacy);
    await userEvent.tab();
    await userEvent.hover(headless.input);
    await expect.element(headless.input).toHaveFocus();
    expect(headless.input.matches(':focus-visible:hover')).toBe(true);
    await settleSwitchStyles(headless);
    expect(compareSwitchStyles(expected, captureSwitchStyles(headless))).toEqual([]);
  },
);

test('preserves native, root, label, required, and indicator refs and consumer slot content', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const indicatorRef = React.createRef<HTMLDivElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const requiredRef = React.createRef<HTMLSpanElement>();
  const events: { source: string; checked: boolean }[] = [];
  const onChange = vi.fn(
    (event: React.ChangeEvent<HTMLInputElement>, data: { checked: boolean }) => {
      events.push({ source: 'component', checked: event.currentTarget.checked });
      expect(data.checked).toBe(event.currentTarget.checked);
    },
  );
  const screen = await renderCoreAIComponent(
    <Switch
      ref={inputRef}
      id="switch-slots"
      name="notifications"
      value="enabled"
      required
      className="consumer-root"
      size="small"
      labelPosition="before"
      root={{ ref: rootRef, title: 'Switch row' }}
      input={{
        className: 'consumer-input',
        title: 'Native input',
        onChange: (event) => events.push({ source: 'slot', checked: event.currentTarget.checked }),
      }}
      indicator={{
        ref: indicatorRef,
        className: 'consumer-indicator',
        'aria-hidden': false,
        children: <span className="consumer-thumb">•</span>,
      }}
      label={{
        ref: labelRef,
        className: 'consumer-label',
        size: 'large',
        weight: 'semibold',
        children: <span className="consumer-label-child">Notifications</span>,
        required: {
          ref: requiredRef,
          className: 'consumer-required',
          'aria-hidden': false,
          children: <em className="consumer-required-child">!</em>,
        },
      }}
      onChange={onChange}
    />,
  );
  const input = screen.getByRole('switch', { name: 'Notifications!', exact: true }).element();
  expect(input).toHaveAccessibleName('Notifications!');
  expect(inputRef.current).toBe(input);
  expect(rootRef.current).toHaveClass(switchClassNames.root, 'consumer-root');
  expect(input).toHaveClass(switchClassNames.input, 'consumer-input');
  expect(indicatorRef.current).toHaveClass(switchClassNames.indicator, 'consumer-indicator');
  expect(labelRef.current).toHaveClass(
    switchClassNames.label,
    labelClassNames.root,
    'consumer-label',
  );
  expect(requiredRef.current).toHaveClass(labelClassNames.required, 'consumer-required');
  expect(rootRef.current).toHaveAttribute('title', 'Switch row');
  expect(input).toHaveAttribute('title', 'Native input');
  expect(input).toHaveAttribute('name', 'notifications');
  expect(input).toHaveAttribute('value', 'enabled');
  expect(input).toHaveAttribute('required');
  expect(labelRef.current?.control).toBe(input);
  expect(labelRef.current).toHaveAttribute('data-size', 'large');
  expect(labelRef.current).toHaveAttribute('data-weight', 'semibold');
  expect(labelRef.current).toHaveAttribute('data-required', '');
  expect(indicatorRef.current).toHaveAttribute('aria-hidden', 'false');
  expect(requiredRef.current).toHaveAttribute('aria-hidden', 'false');
  expect(indicatorRef.current?.firstElementChild?.className).toBe('consumer-thumb');
  expect(labelRef.current?.firstElementChild?.className).toBe('consumer-label-child');
  expect(requiredRef.current?.firstElementChild?.className).toBe('consumer-required-child');
  for (const child of [
    indicatorRef.current?.firstElementChild,
    labelRef.current?.firstElementChild,
    requiredRef.current?.firstElementChild,
  ]) {
    for (const marker of [...Object.values(switchClassNames), ...Object.values(labelClassNames)]) {
      expect(child).not.toHaveClass(marker);
    }
  }
  expect(indicatorRef.current?.querySelector('svg')).toBeNull();
  await userEvent.click(labelRef.current!);
  await expect.element(input).toBeChecked();
  expect(events).toEqual([
    { source: 'slot', checked: true },
    { source: 'component', checked: true },
  ]);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
  expect(rootRef.current).toHaveAttribute('data-has-label', '');
  expect(rootRef.current).not.toHaveAttribute('data-checked');
  for (const prop of ['size', 'labelPosition', 'disabledFocusable']) {
    expect(input).not.toHaveAttribute(prop);
    expect(rootRef.current).not.toHaveAttribute(prop);
  }
});

test('preserves label slot render functions while using the local Label component', async () => {
  const labelRef = React.createRef<HTMLLabelElement>();
  let renderedComponent: unknown;
  const renderLabel: SlotRenderFunction<ExtractSlotProps<SwitchSlots['label']>> = (
    Component,
    props,
  ) => {
    renderedComponent = Component;
    return (
      <Component {...props}>
        <span className="consumer-rendered-label">Rendered label</span>
      </Component>
    );
  };
  const screen = await renderCoreAIComponent(
    <Switch
      label={{
        ref: labelRef,
        required: true,
        children: renderLabel,
      }}
    />,
  );
  expect(renderedComponent).toBe(Label);
  const input = screen.getByRole('switch', { name: 'Rendered label' }).element();
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing native rendered-label input');
  const label = input.labels?.[0];
  if (!(label instanceof HTMLLabelElement)) throw new Error('Missing rendered-label association');
  expect(labelRef.current).toBe(label);
  expect(label).toHaveClass(switchClassNames.label, labelClassNames.root);
  expect(label.querySelector(`.${labelClassNames.required}`)).not.toBeNull();
  expect(label.firstElementChild).toHaveClass('consumer-rendered-label');
  await userEvent.click(label);
  await expect.element(input).toBeChecked();
});

test.each([undefined, null])(
  'restores only the missing nullish thumb content (%s)',
  async (children) => {
    const { legacy, headless } = await renderPair({
      name: 'Nullish thumb',
      props: { indicator: { children }, label: 'Notifications' },
    });
    for (const control of [legacy, headless]) {
      expect(control.thumb).toBeInstanceOf(SVGSVGElement);
      expect(control.thumb).toHaveAttribute('viewBox', '0 0 20 20');
      expect(control.thumb?.querySelector('path')).toHaveAttribute(
        'd',
        'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16',
      );
    }
  },
);

test.each([false, '', 0])(
  'retains non-nullish consumer indicator content (%s)',
  async (children) => {
    const { legacy, headless } = await renderPair({
      name: 'Consumer thumb content',
      props: { indicator: { children }, label: 'Notifications' },
    });
    expect(headless.indicator.innerHTML).toBe(legacy.indicator.innerHTML);
    expect(headless.indicator.querySelector('svg')).toBeNull();
  },
);

test('uses native unchecked/checked state and form reset for uncontrolled switches, not data-checked', async () => {
  const onChange = vi.fn();
  const screen = await renderCoreAIComponent(
    <form data-testid="settings">
      <Switch
        label="Notifications"
        name="notifications"
        value="enabled"
        defaultChecked
        onChange={onChange}
      />
      <button type="reset">Reset setting</button>
    </form>,
  );
  const input = screen.getByRole('switch', { name: 'Notifications' }).element() as HTMLInputElement;
  const root = input.parentElement as HTMLDivElement;
  const indicator = root.querySelector<HTMLDivElement>(`.${switchClassNames.indicator}`)!;
  const thumb = indicator.firstElementChild!;
  await settleSwitchStyles({ root, indicator, thumb });
  expect(input.checked).toBe(true);
  expect(input.defaultChecked).toBe(true);
  expect(root).not.toHaveAttribute('data-checked');
  expect(new DOMMatrix(getComputedStyle(thumb).transform).m41).toBe(20);
  await userEvent.click(input);
  await settleSwitchStyles({ root, indicator, thumb });
  expect(input.checked).toBe(false);
  expect(new DOMMatrix(getComputedStyle(thumb).transform).m41).toBe(0);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: false });
  expect(new FormData(input.form!).has('notifications')).toBe(false);
  await userEvent.click(screen.getByRole('button', { name: 'Reset setting' }));
  await settleSwitchStyles({ root, indicator, thumb });
  expect(input.checked).toBe(true);
  expect(new DOMMatrix(getComputedStyle(thumb).transform).m41).toBe(20);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(new FormData(input.form!).get('notifications')).toBe('enabled');
  expect(root).not.toHaveAttribute('data-checked');
});

test('controlled checked takes precedence over defaultChecked and follows actual callback data', async () => {
  const onChange = vi.fn();
  function Controlled() {
    const [checked, setChecked] = React.useState(false);
    return (
      <Switch
        label="Controlled notifications"
        checked={checked}
        defaultChecked
        onChange={(event, data) => {
          onChange(event.currentTarget.checked, data);
          setChecked(data.checked);
        }}
      />
    );
  }
  const screen = await renderCoreAIComponent(<Controlled />);
  const input = screen.getByRole('switch', { name: 'Controlled notifications' }).element();
  expect(input).not.toBeChecked();
  await userEvent.click(input);
  await expect.element(input).toBeChecked();
  expect(input.parentElement).toHaveAttribute('data-checked', '');
  expect(onChange).toHaveBeenLastCalledWith(true, { checked: true });
  await userEvent.keyboard(' ');
  await expect.element(input).not.toBeChecked();
  expect(input.parentElement).not.toHaveAttribute('data-checked');
  expect(onChange).toHaveBeenLastCalledWith(false, { checked: false });
  expect(onChange).toHaveBeenCalledTimes(2);
});

test.each([
  ['legacy', LegacySwitch],
  ['headless', Switch],
] as const)(
  'retains actual %s name/value, required validation, native prop filtering, and external form association',
  async (_name, Component) => {
    const onSubmit = vi.fn();
    const screen = await renderCoreAIComponent(
      <>
        <form
          id="switch-external-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget).get('notifications'));
          }}
        >
          <button type="submit">Inspect setting</button>
        </form>
        <Component
          form="switch-external-form"
          name="notifications"
          value="enabled"
          required
          autoComplete="on"
          inputMode="none"
          label="Notifications"
        />
        <Component
          form="switch-external-form"
          name="disabled"
          value="unavailable"
          disabled
          checked
          readOnly
          label="Unavailable"
        />
      </>,
    );
    const input = screen
      .getByRole('switch', { name: 'Notifications' })
      .element() as HTMLInputElement;
    expect(input.form?.id).toBe('switch-external-form');
    expect(input.required).toBe(true);
    expect(
      (screen.getByRole('switch', { name: 'Unavailable' }).element() as HTMLInputElement).readOnly,
    ).toBe(true);
    expect(input).toHaveAttribute('autocomplete', 'on');
    expect(input).toHaveAttribute('inputmode', 'none');
    expect(input.checkValidity()).toBe(false);
    expect(input.validity.valueMissing).toBe(true);
    expect(new FormData(input.form!).has('notifications')).toBe(false);
    expect(new FormData(input.form!).has('disabled')).toBe(false);
    await userEvent.click(input.labels![0]);
    expect(input.checked).toBe(true);
    expect(input.checkValidity()).toBe(true);
    expect(new FormData(input.form!).get('notifications')).toBe('enabled');
    await userEvent.click(screen.getByRole('button', { name: 'Inspect setting' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('enabled');
  },
);

test('required Label is visual; only resolved native input required controls validation', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Switch label={{ children: 'Visual requirement', required: true }} />
      <Switch required label={{ children: 'Native requirement', required: false }} />
    </>,
  );
  const visual = screen
    .getByRole('switch', { name: 'Visual requirement' })
    .element() as HTMLInputElement;
  const native = screen
    .getByRole('switch', { name: 'Native requirement' })
    .element() as HTMLInputElement;
  expect(visual.required).toBe(false);
  expect(visual.checkValidity()).toBe(true);
  expect(visual.labels![0].querySelector(`.${labelClassNames.required}`)).not.toBeNull();
  expect(native.required).toBe(true);
  expect(native.checkValidity()).toBe(false);
  expect(native.labels![0].querySelector(`.${labelClassNames.required}`)).toBeNull();
});

test.each([
  ['legacy', LegacySwitch],
  ['headless', Switch],
] as const)(
  'preserves %s native-disabled label clicks and disabled-focusable keyboard behavior',
  async (_name, Component) => {
    const onChange = vi.fn();
    const screen = await renderCoreAIComponent(
      <>
        <Component disabled label="Disabled setting" onChange={onChange} />
        <Component disabledFocusable label="Focusable setting" onChange={onChange} />
        <button type="button">Next</button>
      </>,
    );
    const disabled = screen
      .getByRole('switch', { name: 'Disabled setting' })
      .element() as HTMLInputElement;
    const focusable = screen
      .getByRole('switch', { name: 'Focusable setting' })
      .element() as HTMLInputElement;
    expect(disabled.disabled).toBe(true);
    expect(focusable.disabled).toBe(false);
    expect(focusable).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    await expect.element(focusable).toHaveFocus();
    await userEvent.keyboard(' {Enter}');
    expect(focusable.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    await userEvent.click(disabled.labels![0], { force: disabled.disabled });
    expect(disabled.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  },
);

test.each(['input', 'label'] as const)(
  'preserves legacy disabled-focusable first %s click callback data despite native checked rollback',
  async (target) => {
    const changes: Record<'legacy' | 'headless', { checked: boolean; nativeChecked: boolean }[]> = {
      legacy: [],
      headless: [],
    };
    const onChange: SwitchProps['onChange'] = (event, data) => {
      const implementation = event.currentTarget.closest<HTMLElement>(
        '[data-switch-implementation]',
      )?.dataset.switchImplementation;
      if (implementation !== 'legacy' && implementation !== 'headless') {
        throw new Error('Missing Switch callback implementation');
      }
      changes[implementation].push({
        checked: data.checked,
        nativeChecked: event.currentTarget.checked,
      });
    };
    const { legacy, headless } = await renderPair({
      name: 'Disabled-focusable pointer callback',
      props: { disabledFocusable: true, label: 'Notifications', onChange },
    });
    // The pinned base cancels the click default, but does not suppress React's checkbox
    // onChange, which is extracted before onClick handlers run. Use fresh controls here.
    for (const control of [legacy, headless]) {
      const force =
        control.input.disabled || control.input.getAttribute('aria-disabled') === 'true';
      await userEvent.click(target === 'label' ? control.label! : control.input, { force });
      expect(control.input.checked).toBe(false);
    }
    expect(changes.legacy).toEqual([{ checked: true, nativeChecked: true }]);
    expect(changes.headless).toEqual(changes.legacy);
  },
);

test('receives Field required association with control/label-owned disabled state, without inheriting visual Field size', async () => {
  const screen = await renderCoreAIComponent(
    <Field label={{ children: 'Notifications', disabled: true }} required size="small">
      <Switch disabled />
    </Field>,
  );
  const input = screen.getByRole('switch', { name: 'Notifications' }).element();
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing native Field Switch input');
  expect(input.disabled).toBe(true);
  expect(input.required).toBe(true);
  expect(input.parentElement).toHaveAttribute('data-disabled', '');
  expect(input.parentElement).toHaveAttribute('data-size', 'medium');
  expect(input.labels?.[0].control).toBe(input);
});

test('styles resolved native input-slot state with v9 as the visual reference', async () => {
  const props: SwitchProps = {
    disabled: true,
    checked: false,
    required: true,
    input: { disabled: false, checked: true, required: false },
    label: 'Slot state',
  };
  const { legacy, headless } = await renderPair({ name: 'Slot state', props });
  for (const control of [legacy, headless]) {
    expect(control.input.disabled).toBe(false);
    expect(control.input.checked).toBe(true);
    expect(control.input.required).toBe(false);
  }
  expect(headless.root).not.toHaveAttribute('data-disabled');
  expect(headless.root).toHaveAttribute('data-checked', '');
  expect(compareSwitchStyles(captureSwitchStyles(legacy), captureSwitchStyles(headless))).toEqual(
    [],
  );
});
