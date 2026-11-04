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
  Field,
  Radio as LegacyRadio,
  RadioGroup as LegacyRadioGroup,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  RadioGroupComparison,
  radioGroupLayouts,
} from '../../../apps/storybook/src/stories/experiments/RadioGroupComparison.js';
import {
  captureRadioGroupStyles,
  compareRadioGroupStyles,
  getComparisonRadioGroup,
} from '../../../apps/storybook/src/stories/experiments/compareRadioGroupStyles.js';
import { Radio } from './Radio.js';
import {
  RadioGroup,
  radioGroupClassNames,
  type RadioGroupOnChangeData,
  type RadioGroupProps,
  type RadioGroupSlots,
} from './RadioGroup.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const families = [
  { name: 'legacy', Group: LegacyRadioGroup, Item: LegacyRadio },
  { name: 'headless', Group: RadioGroup, Item: Radio },
  { name: 'raw', Group: RawRadioGroup, Item: RawRadio },
] as const;

function inputs(container: ParentNode): HTMLInputElement[] {
  return [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
}

function formNamed(container: ParentNode, name: string): HTMLFormElement {
  const form = container.querySelector<HTMLFormElement>(`form[data-family="${name}"]`);
  if (!form) throw new Error(`Missing ${name} form`);
  return form;
}

function selectedValue(container: ParentNode): string | null {
  return inputs(container).find((input) => input.checked)?.value ?? null;
}

test('exposes only the missing current visual layout and public ref/change-data contracts', () => {
  expectTypeOf<typeof RadioGroup>().toEqualTypeOf<ForwardRefComponent<RadioGroupProps>>();
  expectTypeOf<RadioGroupProps['layout']>().toEqualTypeOf<
    'vertical' | 'horizontal' | 'horizontal-stacked' | undefined
  >();
  expectTypeOf<RadioGroupOnChangeData>().toEqualTypeOf<{ value: string }>();
  expectTypeOf<'size' extends keyof RadioGroupProps ? true : false>().toEqualTypeOf<false>();
});

test.each(radioGroupLayouts)(
  'resolves %s layout through the public group context',
  async (layout) => {
    const screen = await render(
      <CoreAIFluentProvider>
        <RadioGroup name="layout" aria-label="Layout" layout={layout} defaultValue="inherited">
          <Radio value="inherited" label="Inherited" />
          <Radio value="after" label="After" labelPosition="after" />
          <Radio value="below" label="Below" labelPosition="below" />
        </RadioGroup>
      </CoreAIFluentProvider>,
    );
    const group = screen.container.querySelector('.fui-RadioGroup');
    if (!(group instanceof HTMLDivElement)) throw new Error('Missing RadioGroup');
    const roots = [...group.querySelectorAll<HTMLSpanElement>('.fui-Radio')];
    expect(group).toHaveClass(radioGroupClassNames.root);
    expect(group).toHaveAttribute('data-layout', layout);
    expect(group).not.toHaveAttribute('layout');
    expect(getComputedStyle(group).flexDirection).toBe(layout === 'vertical' ? 'column' : 'row');
    expect(roots[0]).toHaveAttribute(
      'data-label-position',
      layout === 'horizontal-stacked' ? 'below' : 'after',
    );
    expect(roots[1]).toHaveAttribute('data-label-position', 'after');
    expect(roots[2]).toHaveAttribute('data-label-position', 'below');
    expect(inputs(group).map((input) => input.name)).toEqual(['layout', 'layout', 'layout']);
    expect(inputs(group)[0].checked).toBe(true);
  },
);

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {} },
    { name: 'explicitly undefined', props: { layout: undefined } },
  ])(
    `keeps $name Fluent defaults with CoreAI defaults ${withComponentDefaults}`,
    async ({ props }) => {
      const screen = await render(
        <CoreAIFluentProvider
          theme={coreaiLightTheme}
          withComponentDefaults={withComponentDefaults}
        >
          <RadioGroupComparison
            examples={[{ name: 'Defaults', props: { ...props, defaultValue: 'standard' } }]}
          />
        </CoreAIFluentProvider>,
      );
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      const legacy = getComparisonRadioGroup(screen.container, 'legacy');
      const headless = getComparisonRadioGroup(screen.container, 'headless');
      expect(
        compareRadioGroupStyles(captureRadioGroupStyles(legacy), captureRadioGroupStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute('data-layout', 'vertical');
      expect(headless.radios[0].root).toHaveAttribute('data-label-position', 'after');
      expect(getComputedStyle(headless.radios[0].indicator).width).toBe('16px');
    },
  );
}

test('keeps controlled selection, exact callback payloads, and selection-only item notifications', async () => {
  const freeChange = vi.fn();
  const teamChange = vi.fn();
  const events: { type: string; currentTarget: string; value: string }[] = [];
  const groupChange = vi.fn<NonNullable<RadioGroupProps['onChange']>>((event, data) => {
    events.push({
      type: event.type,
      currentTarget: event.currentTarget.tagName,
      value: data.value,
    });
  });
  function Controlled() {
    const [value, setValue] = React.useState('free');
    return (
      <>
        <RadioGroup
          name="controlled"
          aria-label="Controlled plan"
          value={value}
          onChange={(event, data) => {
            groupChange(event, data);
            setValue(data.value);
          }}
        >
          <Radio value="free" label="Free" onChange={freeChange} />
          <Radio value="team" label="Team" onChange={teamChange} />
        </RadioGroup>
        <output aria-label="Current plan">{value}</output>
        <button type="button" onClick={() => setValue('free')}>
          Choose Free
        </button>
      </>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <Controlled />
    </CoreAIFluentProvider>,
  );
  const free = screen.getByRole('radio', { name: 'Free', exact: true });
  const team = screen.getByRole('radio', { name: 'Team', exact: true });
  await expect.element(free).toBeChecked();
  await userEvent.click(screen.getByText('Team', { exact: true }));
  await expect.element(team).toBeChecked();
  await expect.element(free).not.toBeChecked();
  await expect
    .element(screen.getByRole('status', { name: 'Current plan' }))
    .toHaveTextContent('team');
  expect(teamChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'team' });
  expect(freeChange).not.toHaveBeenCalled();
  expect(groupChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'team' });
  expect(events).toEqual([{ type: 'change', currentTarget: 'DIV', value: 'team' }]);
  await userEvent.click(team);
  expect(groupChange).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: 'Choose Free' }));
  await expect.element(free).toBeChecked();
  await expect.element(team).not.toBeChecked();
  expect(groupChange).toHaveBeenCalledTimes(1);
  expect(freeChange).not.toHaveBeenCalled();
});

test.each(radioGroupLayouts)(
  'uses native arrows, Space, one Tab stop, and disabled-item skipping in %s layout',
  async (layout) => {
    const groupChange = vi.fn();
    const itemChange = vi.fn();
    function KeyboardGroup() {
      const [value, setValue] = React.useState('standard');
      return (
        <>
          <button type="button">Before plans</button>
          <span>Pointer parking</span>
          <RadioGroup
            name="keyboard"
            aria-label="Keyboard plan"
            layout={layout}
            value={value}
            onChange={(event, data) => {
              groupChange(event, data);
              setValue(data.value);
            }}
          >
            <Radio value="free" label="Free" onChange={itemChange} />
            <Radio value="standard" label="Standard" onChange={itemChange} />
            <Radio value="unavailable" label="Unavailable" disabled onChange={itemChange} />
            <Radio value="team" label="Team" onChange={itemChange} />
          </RadioGroup>
          <button type="button">After plans</button>
        </>
      );
    }
    const screen = await render(
      <CoreAIFluentProvider>
        <KeyboardGroup />
      </CoreAIFluentProvider>,
    );
    const free = screen.getByRole('radio', { name: 'Free', exact: true });
    const standard = screen.getByRole('radio', { name: 'Standard' });
    const team = screen.getByRole('radio', { name: 'Team' });
    await userEvent.click(screen.getByRole('button', { name: 'Before plans' }));
    await userEvent.hover(screen.getByText('Pointer parking'));
    await userEvent.tab();
    await expect.element(standard).toHaveFocus();
    for (const [key, radio, value] of [
      ['{ArrowDown}', team, 'team'],
      ['{ArrowRight}', free, 'free'],
      ['{ArrowLeft}', team, 'team'],
      ['{ArrowUp}', standard, 'standard'],
    ] as const) {
      await userEvent.keyboard(key);
      await expect.element(radio).toHaveFocus();
      await expect.element(radio).toBeChecked();
      expect(groupChange).toHaveBeenLastCalledWith(expect.anything(), { value });
      expect(itemChange).toHaveBeenLastCalledWith(expect.anything(), { value });
    }
    await userEvent.keyboard(' ');
    expect(groupChange).toHaveBeenCalledTimes(4);
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'After plans' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(standard).toHaveFocus();
    const freeInput = inputs(screen.container).find((input) => input.value === 'free');
    if (!freeInput) throw new Error('Missing Free input');
    freeInput.focus();
    expect(freeInput.checked).toBe(false);
    await userEvent.keyboard(' ');
    await expect.element(free).toBeChecked();
    expect(groupChange).toHaveBeenCalledTimes(5);
    expect(itemChange).toHaveBeenCalledTimes(5);
    expect(groupChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'free' });
    expect(screen.container.querySelector('[role="radiogroup"]')?.hasAttribute('focusgroup')).toBe(
      false,
    );
  },
);

test('generates distinct native group names and keeps item checked/defaultChecked overrides', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RadioGroup aria-label="First" value="free">
        <Radio value="free" checked={false} label="First Free" />
        <Radio value="team" checked label="First Team" />
      </RadioGroup>
      <RadioGroup aria-label="Second">
        <Radio value="free" defaultChecked label="Second Free" />
        <Radio value="team" label="Second Team" />
      </RadioGroup>
    </CoreAIFluentProvider>,
  );
  const [firstFree, firstTeam, secondFree, secondTeam] = inputs(screen.container);
  expect(firstFree.name).toBeTruthy();
  expect(firstTeam.name).toBe(firstFree.name);
  expect(secondFree.name).toBeTruthy();
  expect(secondTeam.name).toBe(secondFree.name);
  expect(firstFree.name).not.toBe(secondFree.name);
  expect(firstFree.checked).toBe(false);
  expect(firstTeam.checked).toBe(true);
  expect(secondFree.checked).toBe(true);
  await userEvent.click(secondTeam);
  expect(secondFree.checked).toBe(false);
  expect(secondTeam.checked).toBe(true);
  expect(firstTeam.checked).toBe(true);
});

test('retains the current raw group/item/input disabled and required precedence', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      {families.map(({ name, Group, Item }) => (
        <form key={name} data-family={name}>
          <Group name="plan" aria-label={name} disabled required defaultValue="free">
            <Item value="free" label={`Free ${name}`} disabled={false} />
            <Item value="standard" label={`Standard ${name}`} required={false} />
            <Item
              value="team"
              label={`Team ${name}`}
              input={{ disabled: false, required: false }}
            />
          </Group>
        </form>
      ))}
    </CoreAIFluentProvider>,
  );
  for (const { name } of families) {
    const form = formNamed(screen.container, name);
    const [free, standard, team] = inputs(form);
    expect([free.disabled, standard.disabled, team.disabled]).toEqual([false, true, false]);
    expect([free.required, standard.required, team.required]).toEqual([true, false, false]);
    expect(new FormData(form).get('plan')).toBe('free');
    await userEvent.click(team);
    expect(selectedValue(form)).toBe('team');
    expect(new FormData(form).get('plan')).toBe('team');
    await userEvent.click(form.querySelector<HTMLLabelElement>(`label[for="${standard.id}"]`)!, {
      force: true,
    });
    expect(selectedValue(form)).toBe('team');
  }
});

test.each([undefined, true, false])(
  'matches installed raw Field ARIA/native-required boundaries with group required=%s',
  async (required) => {
    const screen = await render(
      <CoreAIFluentProvider>
        <p id="radio-extra-description">Applies to this workspace.</p>
        {families.map(({ name, Group, Item }) => (
          <div key={name} data-family={name}>
            <Field
              label={`Plan ${name}`}
              size="large"
              required
              hint={`Hint ${name}`}
              validationState="error"
              validationMessage={`Error ${name}`}
            >
              <Group
                name={`plan-${name}`}
                required={required}
                aria-describedby="radio-extra-description"
              >
                <Item value="free" label={`Free ${name}`} />
                <Item value="team" label={`Team ${name}`} />
              </Group>
            </Field>
          </div>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const { name } of families) {
      const cell = screen.container.querySelector(`[data-family="${name}"]`);
      const group = cell?.querySelector('[role="radiogroup"]');
      if (!cell || !group) throw new Error(`Missing ${name} Field control`);
      const labelId = group.getAttribute('aria-labelledby');
      const describedBy = group.getAttribute('aria-describedby');
      expect(document.getElementById(labelId ?? '')?.textContent).toContain(`Plan ${name}`);
      expect(group).toHaveAttribute('aria-required', 'true');
      expect(group).toHaveAttribute('aria-invalid', 'true');
      expect(describedBy).toContain('radio-extra-description');
      const descriptions = (describedBy ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent);
      expect(descriptions).toEqual([`Error ${name}`, `Hint ${name}`, 'Applies to this workspace.']);
      for (const input of inputs(cell)) {
        expect(input.required).toBe(required === true);
        expect(input).toHaveAttribute('aria-describedby', describedBy);
        expect(input).not.toHaveAttribute('aria-invalid');
      }
    }
    const localLabel = screen.container.querySelector('[data-family="headless"] .fui-Radio__label');
    expect(getComputedStyle(localLabel!).fontSize).toBe('14px');
  },
);

test.each(['group defaultValue', 'item defaultChecked'] as const)(
  'preserves native FormData and reset from %s without introducing hook state',
  async (initialization) => {
    const examples = families.map((family) => ({ ...family, onChange: vi.fn() }));
    const screen = await render(
      <CoreAIFluentProvider>
        {examples.map(({ name, Group, Item, onChange }) => (
          <form key={name} data-family={name}>
            <Group
              name="plan"
              aria-label={name}
              defaultValue={initialization === 'group defaultValue' ? 'standard' : undefined}
              onChange={onChange}
            >
              <Item value="free" label={`Free ${name}`} />
              <Item
                value="standard"
                label={`Standard ${name}`}
                defaultChecked={initialization === 'item defaultChecked' ? true : undefined}
              />
              <Item value="team" label={`Team ${name}`} />
              <Item value="unavailable" label={`Unavailable ${name}`} disabled />
            </Group>
            <button type="reset">Reset {name}</button>
          </form>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const { name, onChange } of examples) {
      const form = formNamed(screen.container, name);
      expect(selectedValue(form)).toBe('standard');
      expect(new FormData(form).getAll('plan')).toEqual(['standard']);
      expect(form.checkValidity()).toBe(true);
      await userEvent.click(screen.getByRole('radio', { name: `Team ${name}`, exact: true }));
      expect(selectedValue(form)).toBe('team');
      expect(new FormData(form).getAll('plan')).toEqual(['team']);
      expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'team' });
      await userEvent.click(screen.getByRole('button', { name: `Reset ${name}`, exact: true }));
      expect(selectedValue(form)).toBe('standard');
      expect(new FormData(form).getAll('plan')).toEqual(['standard']);
      expect(onChange).toHaveBeenCalledTimes(1);
    }
  },
);

test('keeps native reset separate from controlled React state, matching current raw headless', async () => {
  const groupChange = vi.fn();
  function Controlled({ name, Group, Item }: (typeof families)[number]) {
    const [value, setValue] = React.useState('standard');
    return (
      <form data-family={name}>
        <Group
          name="plan"
          aria-label={name}
          value={value}
          onChange={(event, data) => {
            groupChange(event, data);
            setValue(data.value);
          }}
        >
          <Item value="free" label={`Free ${name}`} />
          <Item value="standard" label={`Standard ${name}`} />
          <Item value="team" label={`Team ${name}`} />
        </Group>
        <output aria-label={`Model ${name}`}>{value}</output>
        <button type="reset">Reset {name}</button>
        <button type="button" onClick={() => setValue('free')}>
          Choose Free {name}
        </button>
      </form>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      {families.map((family) => (
        <Controlled key={family.name} {...family} />
      ))}
    </CoreAIFluentProvider>,
  );
  const resetValues: (string | null)[] = [];
  for (const { name } of families) {
    const form = formNamed(screen.container, name);
    await userEvent.click(screen.getByRole('radio', { name: `Team ${name}`, exact: true }));
    const expectedReset = inputs(form).find((input) => input.defaultChecked)?.value ?? null;
    await userEvent.click(screen.getByRole('button', { name: `Reset ${name}`, exact: true }));
    expect(selectedValue(form)).toBe(expectedReset);
    expect(new FormData(form).get('plan')).toBe(expectedReset);
    await expect
      .element(screen.getByRole('status', { name: `Model ${name}` }))
      .toHaveTextContent('team');
    resetValues.push(selectedValue(form));
    await userEvent.click(screen.getByRole('button', { name: `Choose Free ${name}`, exact: true }));
    expect(selectedValue(form)).toBe('free');
  }
  expect(resetValues).toEqual([resetValues[2], resetValues[2], resetValues[2]]);
  expect(groupChange).toHaveBeenCalledTimes(3);
  for (const [, data] of groupChange.mock.calls) expect(data).toEqual({ value: 'team' });
});

test('preserves native required validity, disabled omission, and external form association', async () => {
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form id="radio-external-form" data-family="external" />
      <form data-family="required">
        <RadioGroup name="required-plan" aria-label="Required plan" required onChange={onChange}>
          <Radio value="free" label="Required Free" />
          <Radio value="team" label="Required Team" />
        </RadioGroup>
        <RadioGroup name="disabled-plan" aria-label="Disabled plan" disabled defaultValue="free">
          <Radio value="free" label="Disabled Free" />
        </RadioGroup>
        <RadioGroup name="external-group" aria-label="External plan">
          <Radio
            value="external"
            label="External Team"
            input={{ name: 'external-plan', value: 'team', form: 'radio-external-form' }}
          />
        </RadioGroup>
      </form>
    </CoreAIFluentProvider>,
  );
  const form = formNamed(screen.container, 'required');
  const external = formNamed(screen.container, 'external');
  expect(form.checkValidity()).toBe(false);
  expect(new FormData(form).get('required-plan')).toBe(null);
  expect(new FormData(form).get('disabled-plan')).toBe(null);
  await userEvent.click(screen.getByRole('radio', { name: 'Required Team' }));
  expect(form.checkValidity()).toBe(true);
  expect(new FormData(form).get('required-plan')).toBe('team');
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'team' });
  await userEvent.click(screen.getByRole('radio', { name: 'External Team' }));
  expect(new FormData(external).get('external-plan')).toBe('team');
  expect(new FormData(form).get('external-plan')).toBe(null);
});

test('preserves the public group root render function, ref, consumer classes, ARIA, and child context', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLInputElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<RadioGroupSlots['root']>> = (
    Component,
    slotProps,
  ) => (
    <Component {...slotProps} data-rendered-group="">
      <Radio ref={itemRef} value="team" label="Rendered Team" />
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <p id="rendered-description">Shared description</p>
      <RadioGroup
        ref={ref}
        className="consumer-group"
        data-consumer="preserved"
        name="rendered"
        aria-label="Rendered plans"
        aria-describedby="rendered-description"
        defaultValue="team"
        required
        layout="horizontal-stacked"
      >
        {renderRoot}
      </RadioGroup>
    </CoreAIFluentProvider>,
  );
  expect(ref.current).toHaveClass(radioGroupClassNames.root, 'consumer-group');
  expect(ref.current).toHaveAttribute('data-rendered-group', '');
  expect(ref.current).toHaveAttribute('data-consumer', 'preserved');
  expect(ref.current).toHaveAttribute('aria-describedby', 'rendered-description');
  expect(itemRef.current).toHaveAttribute('name', 'rendered');
  expect(itemRef.current?.required).toBe(true);
  expect(itemRef.current?.checked).toBe(true);
  expect(itemRef.current?.closest('.fui-Radio')).toHaveAttribute('data-label-position', 'below');
  await expect.element(screen.getByRole('radio', { name: 'Rendered Team' })).toBeChecked();
});
