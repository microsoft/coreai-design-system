// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  Label as LegacyLabel,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  LabelComparison,
  labelConsumerExample,
  labelExamples,
  type LabelExample,
} from '../../../apps/storybook/src/stories/experiments/LabelComparison.js';
import {
  captureLabelStyles,
  compareLabelStyles,
  getComparisonLabel,
  settleLabelStyles,
} from '../../../apps/storybook/src/stories/experiments/compareLabelStyles.js';
import { Label, labelClassNames } from './Label.js';
import { Checkbox } from './Checkbox.js';
import { Switch } from './Switch.js';

afterEach(cleanup);

test('exposes the current public label ref contract', () => {
  expectTypeOf<React.ComponentProps<typeof Label>['ref']>().toEqualTypeOf<
    React.Ref<HTMLLabelElement> | undefined
  >();
});

test.each([
  ['Checkbox', Checkbox],
  ['Switch', Switch],
] as const)(
  'renders %s labels through current slots without compatibility warnings',
  async (_, Control) => {
    const warnings = vi.spyOn(console, 'warn');
    try {
      const screen = await render(
        <CoreAIFluentProvider>
          <Control label="Current label slot" required />
        </CoreAIFluentProvider>,
      );
      const required = screen.container.querySelector('.fui-Label__required');
      expect(required).toBeInstanceOf(HTMLElement);
      expect(required?.textContent).toBe('*');
      expect(warnings).not.toHaveBeenCalled();
    } finally {
      warnings.mockRestore();
    }
  },
);

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: LabelExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <LabelComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  const legacy = getComparisonLabel(document, 'legacy');
  const headless = getComparisonLabel(document, 'headless');
  await Promise.all([settleLabelStyles(legacy), settleLabelStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(labelExamples)(
    `matches $name root and required-slot styles in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareLabelStyles(captureLabelStyles(legacy), captureLabelStyles(headless))).toEqual(
        [],
      );
      expect(legacy.root.id).not.toBe(headless.root.id);
      expect(legacy.control.id).not.toBe(headless.control.id);
      expect(legacy.root.control).toBe(legacy.control);
      expect(headless.root.control).toBe(headless.control);
    },
  );
}

for (const withComponentDefaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {} },
    {
      name: 'explicitly undefined',
      props: { size: undefined, weight: undefined, disabled: undefined, required: undefined },
    },
  ])(
    `keeps $name Fluent defaults with CoreAI defaults ${withComponentDefaults}`,
    async ({ props }) => {
      const { legacy, headless } = await renderPair(
        { name: 'Defaults', props: { ...props, children: 'Project name' } },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(compareLabelStyles(captureLabelStyles(legacy), captureLabelStyles(headless))).toEqual(
        [],
      );
      expect(headless.root).toHaveAttribute('data-size', 'medium');
      expect(headless.root).toHaveAttribute('data-weight', 'regular');
      expect(headless.root).not.toHaveAttribute('data-disabled');
      expect(headless.root).not.toHaveAttribute('data-required');
    },
  );
}

test('inherits regular weight but keeps large and explicitly semibold labels semibold', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ fontWeight: 700 }}>
        <LegacyLabel data-testid="legacy-inherited">Inherited weight</LegacyLabel>
        <Label data-testid="headless-inherited">Inherited weight</Label>
        <Label data-testid="large-regular" size="large" weight="regular">
          Large regular
        </Label>
        <Label data-testid="small-strong" size="small" weight="semibold">
          Small semibold
        </Label>
      </div>
    </CoreAIFluentProvider>,
  );
  expect(getComputedStyle(screen.getByTestId('legacy-inherited').element()).fontWeight).toBe('700');
  expect(getComputedStyle(screen.getByTestId('headless-inherited').element()).fontWeight).toBe(
    '700',
  );
  for (const id of ['large-regular', 'small-strong']) {
    expect(getComputedStyle(screen.getByTestId(id).element()).fontWeight).toBe(
      String(coreaiLightTheme.fontWeightSemibold),
    );
  }
});

test('preserves refs, slot props, caller children and classes, and resolved data attributes', async () => {
  const rootRef = React.createRef<HTMLLabelElement>();
  const requiredRef = React.createRef<HTMLSpanElement>();
  const requiredProps = {
    ref: requiredRef,
    className: 'consumer-required',
    title: 'Required field',
    'aria-hidden': false,
    'data-consumer': 'required',
    children: <em className="consumer-required-child">!</em>,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Label
        ref={rootRef}
        data-testid="label"
        data-consumer="root"
        className="consumer-label"
        htmlFor="slot-control"
        title="Project field"
        size="small"
        weight="semibold"
        disabled
        required={requiredProps}
      >
        <span className="consumer-label-child">Project name</span>
      </Label>
      <input id="slot-control" />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByTestId('label').element();
  expect(rootRef.current).toBe(root);
  expect(root).toBeInstanceOf(HTMLLabelElement);
  expect(root).toHaveClass(labelClassNames.root, 'consumer-label');
  expect(root).toHaveAttribute('for', 'slot-control');
  expect(root).toHaveAttribute('title', 'Project field');
  expect(root).toHaveAttribute('data-consumer', 'root');
  expect(root).toHaveAttribute('data-size', 'small');
  expect(root).toHaveAttribute('data-weight', 'semibold');
  expect(root).toHaveAttribute('data-disabled', '');
  expect(root).toHaveAttribute('data-required', '');
  expect(requiredRef.current).toBe(root.querySelector(`.${labelClassNames.required}`));
  expect(requiredRef.current).toHaveClass(labelClassNames.required, 'consumer-required');
  expect(requiredRef.current).toHaveAttribute('aria-hidden', 'false');
  expect(requiredRef.current).toHaveAttribute('title', 'Required field');
  expect(requiredRef.current).toHaveAttribute('data-consumer', 'required');
  expect(root.firstElementChild).toHaveClass('consumer-label-child');
  expect(requiredRef.current?.firstElementChild).toHaveClass('consumer-required-child');
  for (const marker of Object.values(labelClassNames)) {
    expect(root.firstElementChild).not.toHaveClass(marker);
    expect(requiredRef.current?.firstElementChild).not.toHaveClass(marker);
  }
  for (const prop of ['size', 'weight', 'disabled', 'required']) {
    expect(root).not.toHaveAttribute(prop);
  }
});

test.each([
  { name: 'false', required: false },
  { name: 'null', required: null },
  { name: 'undefined', required: undefined },
  { name: 'empty string', required: '' },
])('omits the required slot and data state for $name', async ({ required }) => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Label required={required} data-testid="label">
        Project name
      </Label>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByTestId('label').element();
  expect(root).not.toHaveAttribute('data-required');
  expect(root.querySelector(`.${labelClassNames.required}`)).toBeNull();
  expect(root).toHaveTextContent('Project name');
});

test('allows unlayered consumer CSS Modules to override root and required-slot visuals', async () => {
  const { headless } = await renderPair(labelConsumerExample);
  const values = captureLabelStyles(headless);
  expect(values['root.color']).toBe('rgb(20, 90, 160)');
  expect(values['root.font-size']).toBe('22px');
  expect(values['root.font-weight']).toBe('400');
  expect(values['root.line-height']).toBe('30px');
  expect(values['required.color']).toBe('rgb(40, 110, 60)');
  expect(values['required.font-size']).toBe('12px');
  expect(values['required.padding-left']).toBe('12px');
});

test('exposes stable owned-slot markers for unlayered global consumer selectors', async () => {
  const rootRef = React.createRef<HTMLLabelElement>();
  await render(
    <CoreAIFluentProvider>
      <style>{`
        .consumer-globals .fui-Label { color: rgb(12, 34, 56); font-size: 24px; }
        .consumer-globals .fui-Label__required { color: rgb(65, 43, 21); padding-inline-start: 10px; }
      `}</style>
      <div className="consumer-globals">
        <Label ref={rootRef} disabled required>
          Project name
        </Label>
      </div>
    </CoreAIFluentProvider>,
  );
  const root = rootRef.current;
  const required = root?.querySelector(`.${labelClassNames.required}`);
  if (!root || !required) throw new Error('Label global-selector fixture has not mounted');
  expect(getComputedStyle(root).color).toBe('rgb(12, 34, 56)');
  expect(getComputedStyle(root).fontSize).toBe('24px');
  expect(getComputedStyle(required).color).toBe('rgb(65, 43, 21)');
  expect(getComputedStyle(required).paddingLeft).toBe('10px');
});

test('matches required-indicator leading padding in RTL', async () => {
  const { legacy, headless } = await renderPair(
    { name: 'RTL required', props: { required: '(required)', children: 'Project name' } },
    coreaiLightTheme,
    true,
    'rtl',
  );
  const values = captureLabelStyles(headless);
  expect(compareLabelStyles(captureLabelStyles(legacy), values)).toEqual([]);
  expect(values['required.padding-left']).toBe('0px');
  expect(values['required.padding-right']).toBe(coreaiLightTheme.spacingHorizontalXS);
});

for (const [implementation, Component] of [
  ['legacy', LegacyLabel],
  ['headless', Label],
] as const) {
  test(`preserves ${implementation} native association, callbacks, and form submission`, async () => {
    const rootRef = React.createRef<HTMLLabelElement>();
    const controlRef = React.createRef<HTMLInputElement>();
    const onLabelClick = vi.fn();
    const onControlClick = vi.fn();
    const onFocus = vi.fn();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const id = `${implementation}-project`;
    const screen = await render(
      <CoreAIFluentProvider>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit([...new FormData(event.currentTarget).entries()]);
          }}
        >
          <Component ref={rootRef} htmlFor={id} required onClick={onLabelClick}>
            Project name
          </Component>
          <input
            ref={controlRef}
            id={id}
            name="project"
            onClick={onControlClick}
            onFocus={onFocus}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
          <button type="submit">Save project</button>
        </form>
      </CoreAIFluentProvider>,
    );
    const root = rootRef.current;
    const control = controlRef.current;
    if (!root || !control) throw new Error('Label association fixture has not mounted');
    expect(root.control).toBe(control);
    expect([...(control.labels ?? [])]).toContain(root);
    expect(control).toHaveAccessibleName('Project name');
    expect(root.querySelector(`.${labelClassNames.required}`)).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(control.required).toBe(false);

    // The label's indicator does not impose required validation on its associated control.
    await userEvent.click(screen.getByRole('button', { name: 'Save project' }));
    expect(onSubmit).toHaveBeenLastCalledWith([['project', '']]);
    await userEvent.click(root);
    await expect.element(control).toHaveFocus();
    expect(onLabelClick).toHaveBeenCalledTimes(1);
    expect(onControlClick).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    await userEvent.type(control, 'CoreAI');
    expect(onChange).toHaveBeenLastCalledWith('CoreAI');
    await userEvent.click(screen.getByRole('button', { name: 'Save project' }));
    expect(onSubmit).toHaveBeenLastCalledWith([['project', 'CoreAI']]);
  });

  test.each([false, true])(
    `keeps ${implementation} Label disabled visual-only with native control disabled=%s`,
    async (controlDisabled) => {
      const rootRef = React.createRef<HTMLLabelElement>();
      const controlRef = React.createRef<HTMLInputElement>();
      const onLabelClick = vi.fn();
      const onControlClick = vi.fn();
      const onFocus = vi.fn();
      const id = `${implementation}-disabled-project`;
      await render(
        <CoreAIFluentProvider>
          <Component ref={rootRef} htmlFor={id} disabled required onClick={onLabelClick}>
            Project name
          </Component>
          <input
            ref={controlRef}
            id={id}
            disabled={controlDisabled}
            onClick={onControlClick}
            onFocus={onFocus}
          />
        </CoreAIFluentProvider>,
      );
      const root = rootRef.current;
      const control = controlRef.current;
      if (!root || !control) throw new Error('Disabled Label fixture has not mounted');
      expect(control.disabled).toBe(controlDisabled);
      expect(control.required).toBe(false);
      // Playwright checks a label's associated control for enabled actionability.
      await userEvent.click(root, { force: controlDisabled });
      expect(onLabelClick).toHaveBeenCalledTimes(1);
      if (controlDisabled) {
        await expect.element(control).not.toHaveFocus();
        expect(onControlClick).not.toHaveBeenCalled();
        expect(onFocus).not.toHaveBeenCalled();
      } else {
        await expect.element(control).toHaveFocus();
        expect(onControlClick).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
      }
    },
  );
}

test('keeps labels out of native tab order without hover influencing the focus check', async () => {
  const rootRef = React.createRef<HTMLLabelElement>();
  const controlRef = React.createRef<HTMLInputElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <div data-testid="pointer-parking" style={{ width: 32, height: 32 }} />
      <Label ref={rootRef} htmlFor="keyboard-project" required>
        Project name
      </Label>
      <input ref={controlRef} id="keyboard-project" />
      <button type="button">Next</button>
    </CoreAIFluentProvider>,
  );
  const root = rootRef.current;
  const control = controlRef.current;
  if (!root || !control) throw new Error('Label keyboard fixture has not mounted');
  await userEvent.hover(screen.getByTestId('pointer-parking'));
  expect(root.matches(':hover')).toBe(false);
  expect(control.matches(':hover')).toBe(false);
  await userEvent.tab();
  await expect.element(control).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
});

test('preserves implicit native association without adding slot markers to supplied children', async () => {
  const rootRef = React.createRef<HTMLLabelElement>();
  const controlRef = React.createRef<HTMLInputElement>();
  const onFocus = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Label ref={rootRef} required>
        <span data-testid="label-text">Project code</span>
        <input ref={controlRef} onFocus={onFocus} />
      </Label>
    </CoreAIFluentProvider>,
  );
  const root = rootRef.current;
  const control = controlRef.current;
  if (!root || !control) throw new Error('Implicit Label fixture has not mounted');
  expect(root.control).toBe(control);
  expect(control).toHaveAccessibleName('Project code');
  for (const marker of Object.values(labelClassNames)) {
    expect(control).not.toHaveClass(marker);
    expect(screen.getByTestId('label-text').element()).not.toHaveClass(marker);
  }
  await userEvent.click(screen.getByTestId('label-text'));
  await expect.element(control).toHaveFocus();
  expect(onFocus).toHaveBeenCalledTimes(1);
});
