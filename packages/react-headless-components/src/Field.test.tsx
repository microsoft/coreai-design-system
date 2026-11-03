// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  FieldComparison,
  FieldFormFlow,
  fieldConsumerExample,
  fieldExamples,
  type FieldExample,
} from '../../../apps/storybook/src/stories/experiments/FieldComparison.js';
import {
  captureFieldStyles,
  compareFieldStyles,
  getComparisonField,
  settleFieldStyles,
} from '../../../apps/storybook/src/stories/experiments/compareFieldStyles.js';
import {
  Field,
  fieldClassNames,
  useFieldContext,
  useFieldControlProps,
  type FieldControlProps,
  type FieldProps,
  type FieldSlots,
} from './Field.js';
import { Input } from './Input.js';
import { Select } from './Select.js';
import { Radio } from './Radio.js';
import { RadioGroup } from './RadioGroup.js';
import { Checkbox } from './Checkbox.js';
import { Switch } from './Switch.js';

afterEach(cleanup);

test('exposes current Field refs, render children, and no invented disabled prop', () => {
  expectTypeOf<React.ComponentProps<typeof Field>['ref']>().toEqualTypeOf<
    React.Ref<HTMLDivElement> | undefined
  >();
  expectTypeOf<FieldControlProps>().toHaveProperty('aria-describedby');
  expectTypeOf<FieldProps>().not.toHaveProperty('disabled');
});

async function renderPair(
  example: FieldExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <FieldComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('field-pointer-rest'));
  const legacy = getComparisonField(screen.container, 'legacy');
  const headless = getComparisonField(screen.container, 'headless');
  await Promise.all([settleFieldStyles(legacy), settleFieldStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(fieldExamples)(`matches $name selected Field styles in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareFieldStyles(captureFieldStyles(legacy), captureFieldStyles(headless))).toEqual(
      [],
    );
    expect(headless.root.getBoundingClientRect().width).toBe(340);
    expect(headless.root.getBoundingClientRect().height).toBeGreaterThan(0);
  });
}

test.each([true, false])(
  'retains Fluent Field defaults with CoreAI defaults %s and RTL spacing',
  async (enabled) => {
    const example = fieldExamples.find((candidate) => candidate.name === 'Horizontal large');
    if (!example) throw new Error('Missing horizontal fixture');
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, enabled, 'rtl');
    expect(compareFieldStyles(captureFieldStyles(legacy), captureFieldStyles(headless))).toEqual(
      [],
    );
    expect(headless.root).toHaveAttribute('data-size', 'large');
    expect(headless.root).toHaveAttribute('data-orientation', 'horizontal');
    expect(headless.label).not.toBeNull();
    if (!headless.label) throw new Error('Missing label');
    expect(getComputedStyle(headless.label).marginLeft).toBe(coreaiLightTheme.spacingHorizontalM);
    expect(getComputedStyle(headless.label).marginRight).toBe('0px');
  },
);

test('preserves generated ids, label association, descriptions, required, validation, and refs', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const messageRef = React.createRef<HTMLDivElement>();
  const hintRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const labelProps = {
    children: 'Project',
    ref: labelRef,
    className: 'caller-label',
    'data-caller-label': '',
  };
  const messageProps = {
    children: 'Choose a unique name.',
    ref: messageRef,
    className: 'caller-message',
    'data-caller-message': '',
  };
  const hintProps = { children: 'Team-visible.', ref: hintRef, className: 'caller-hint' };
  const screen = await render(
    <CoreAIFluentProvider>
      <span id="caller-description">Your organization manages projects.</span>
      <Field
        ref={rootRef}
        label={labelProps}
        hint={hintProps}
        validationMessage={messageProps}
        validationMessageIcon={{ ref: iconRef }}
        className="caller-field"
        data-testid="field"
        required
      >
        <Input ref={inputRef} aria-describedby="caller-description" />
      </Field>
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('textbox', { name: 'Project' }).element();
  expect(inputRef.current).toBe(input);
  expect(rootRef.current).toBe(screen.getByTestId('field').element());
  expect(rootRef.current).toHaveClass(fieldClassNames.root, 'caller-field');
  expect(labelRef.current?.control).toBe(input);
  expect(labelRef.current?.htmlFor).toBe(input.id);
  expect(input.id).not.toBe('');
  expect(labelRef.current).toHaveClass(fieldClassNames.label, 'caller-label');
  expect(labelRef.current).toHaveAttribute('data-caller-label', '');
  expect(messageRef.current).toHaveClass(fieldClassNames.validationMessage, 'caller-message');
  expect(messageRef.current).toHaveAttribute('data-caller-message', '');
  expect(messageRef.current).toHaveAttribute('role', 'alert');
  expect(hintRef.current).toHaveClass(fieldClassNames.hint, 'caller-hint');
  expect(iconRef.current).toHaveClass(fieldClassNames.validationMessageIcon);
  expect(input).toHaveAttribute(
    'aria-describedby',
    `${messageRef.current?.id} ${hintRef.current?.id} caller-description`,
  );
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toBeRequired();
  expect(rootRef.current).toHaveAttribute('data-validate-state', 'error');
  expect(rootRef.current).toHaveAttribute('data-required', '');
  expect(labelRef.current?.querySelector('.fui-Label__required')?.textContent).toBe('*');
});

test('preserves supported slot render functions and control callback data without slot warnings', async () => {
  const warnings = vi.spyOn(console, 'warn');
  const onChange = vi.fn();
  const labelRef = React.createRef<HTMLLabelElement>();
  const renderLabel: SlotRenderFunction<ExtractSlotProps<FieldSlots['label']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-custom-label="">
      Caller project
    </Component>
  );
  const renderHint: SlotRenderFunction<ExtractSlotProps<FieldSlots['hint']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-custom-hint="">
      Caller hint
    </Component>
  );
  try {
    const screen = await render(
      <CoreAIFluentProvider>
        <Field
          required
          label={{
            ref: labelRef,
            children: renderLabel,
          }}
          hint={{ children: renderHint }}
        >
          <Input onChange={onChange} />
        </Field>
      </CoreAIFluentProvider>,
    );
    const input = screen.getByRole('textbox', { name: 'Caller project' });
    await input.fill('Atlas');
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'Atlas' });
    expect(labelRef.current).toHaveAttribute('data-custom-label', '');
    expect(labelRef.current?.control).toBe(input.element());
    expect(labelRef.current?.querySelector('.fui-Label__required')?.textContent).toBe('*');
    expect(screen.container.querySelector('[data-custom-hint]')?.textContent).toBe('Caller hint');
    expect(warnings).not.toHaveBeenCalled();
  } finally {
    warnings.mockRestore();
  }
});

function ContextProbe() {
  const field = useFieldContext();
  return <output aria-label="Field context">{JSON.stringify(field)}</output>;
}

function NativeSupportedControl(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const resolved = useFieldControlProps(props, { supportsLabelFor: true, supportsRequired: true });
  return <input {...resolved} />;
}

test('passes visual context and preserves native render-function/control-helper boundaries', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field label="Third-party" size="large" orientation="horizontal" required hint="Description">
        {(props) => <input {...props} data-testid="render-control" />}
      </Field>
      <Field
        label={{ children: 'Supported native', htmlFor: 'caller-native' }}
        required
        size="small"
        orientation="horizontal"
      >
        <NativeSupportedControl id="caller-native" />
        <ContextProbe />
      </Field>
    </CoreAIFluentProvider>,
  );
  const renderControl = screen.getByTestId('render-control').element();
  expect(renderControl).toHaveAttribute('aria-required', 'true');
  expect(renderControl).not.toHaveAttribute('required');
  expect(renderControl).toHaveAttribute('aria-labelledby');
  expect(renderControl).toHaveAttribute('aria-describedby');
  expect(screen.getByRole('textbox', { name: 'Supported native' }).element()).toBeRequired();
  expect(screen.getByRole('textbox', { name: 'Supported native' }).element()).not.toHaveAttribute(
    'aria-labelledby',
  );
  const context = screen.getByRole('status', { name: 'Field context' }).element().textContent;
  expect(context).toContain('"size":"small"');
  expect(context).toContain('"orientation":"horizontal"');
  expect(context).toContain('"required":true');
  expect(context).toContain('"labelFor":"caller-native"');
});

test('integrates native Input/Select/Radio/Checkbox/Switch semantics without disabling Field labels', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field label="Name" size="large" required>
        <Input />
      </Field>
      <Field label="Region" size="small" required>
        <Select>
          <option value="">Choose</option>
          <option>West</option>
        </Select>
      </Field>
      <Field label="Access" required validationMessage="Choose access.">
        <RadioGroup>
          <Radio label="Viewer" value="viewer" />
        </RadioGroup>
      </Field>
      <Field hint="Review first." required>
        <Checkbox label="Reviewed" />
      </Field>
      <Field label="Notifications" hint="Email updates.">
        <Switch />
      </Field>
      <Field label="Disabled name">
        <Input disabled />
      </Field>
    </CoreAIFluentProvider>,
  );
  expect(screen.getByRole('textbox', { name: 'Name', exact: true }).element()).toBeRequired();
  expect(
    screen.getByRole('textbox', { name: 'Name', exact: true }).element().parentElement,
  ).toHaveAttribute('data-size', 'large');
  expect(screen.getByRole('combobox', { name: 'Region' }).element()).toBeRequired();
  expect(screen.getByRole('combobox', { name: 'Region' }).element().parentElement).toHaveAttribute(
    'data-size',
    'small',
  );
  expect(screen.getByRole('radiogroup', { name: 'Access' }).element()).toHaveAttribute(
    'aria-required',
    'true',
  );
  expect(screen.getByRole('radiogroup', { name: 'Access' }).element()).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getByRole('radio', { name: 'Viewer' }).element()).not.toHaveAttribute('required');
  expect(screen.getByRole('checkbox', { name: 'Reviewed' }).element()).toBeRequired();
  expect(screen.getByRole('switch', { name: 'Notifications' }).element()).toHaveAttribute(
    'aria-describedby',
  );
  const disabled = screen.getByRole('textbox', { name: 'Disabled name' }).element();
  expect(disabled).toBeDisabled();
  const label = screen.container.querySelector<HTMLLabelElement>(`label[for="${disabled.id}"]`);
  expect(label).not.toHaveAttribute('data-disabled');
  const enabled = screen.getByRole('textbox', { name: 'Name', exact: true }).element();
  const enabledLabel = screen.container.querySelector<HTMLLabelElement>(
    `label[for="${enabled.id}"]`,
  );
  if (!enabledLabel) throw new Error('Missing enabled Field label');
  expect(label && getComputedStyle(label).color).toBe(getComputedStyle(enabledLabel).color);
});

test('retains native form errors, successful FormData, and actual change callbacks', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <FieldFormFlow />
    </CoreAIFluentProvider>,
  );
  await screen.getByRole('button', { name: 'Save project' }).click();
  expect(screen.getByRole('alert').element().textContent).toBe('Enter a project name.');
  const input = screen.getByRole('textbox', { name: 'Project name' });
  expect(input.element()).toHaveAttribute('aria-invalid', 'true');
  await input.fill('Atlas');
  expect(screen.getByRole('status', { name: 'Project change count' }).element().textContent).toBe(
    '1',
  );
  await screen.getByRole('combobox', { name: 'Region' }).selectOptions('east');
  await screen.getByRole('radio', { name: 'Editor' }).click();
  await screen.getByRole('checkbox', { name: 'Reviewed' }).click();
  await screen.getByRole('switch', { name: 'Notifications' }).click();
  await screen.getByRole('button', { name: 'Save project' }).click();
  expect(screen.getByRole('status', { name: 'Project submission' }).element().textContent).toBe(
    '{"project":"Atlas","region":"east","access":"editor","reviewed":"yes","notifications":"yes"}',
  );
  expect(input.element()).not.toHaveAttribute('aria-invalid');
  expect(input.element()).toHaveAttribute('aria-describedby');
});

test('gives unlayered consumer classes precedence on all owned Field slots', async () => {
  const { headless } = await renderPair(fieldConsumerExample);
  expect(getComputedStyle(headless.root).rowGap).toBe('9px');
  expect(headless.label && getComputedStyle(headless.label).color).toBe('rgb(90, 40, 130)');
  expect(headless.validationMessage && getComputedStyle(headless.validationMessage).color).toBe(
    'rgb(20, 90, 60)',
  );
  expect(
    headless.validationMessage && getComputedStyle(headless.validationMessage).paddingLeft,
  ).toBe('23px');
  expect(
    headless.validationMessageIcon && getComputedStyle(headless.validationMessageIcon).marginRight,
  ).toBe('8px');
  expect(headless.hint && getComputedStyle(headless.hint).fontWeight).toBe('600');
});
