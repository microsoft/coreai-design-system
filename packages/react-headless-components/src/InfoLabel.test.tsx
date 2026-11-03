// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  InfoLabelComparison,
  InfoLabelHelpFlow,
  infoLabelConsumerExample,
  infoLabelExamples,
  type InfoLabelExample,
} from '../../../apps/storybook/src/stories/experiments/InfoLabelComparison.js';
import {
  captureInfoLabelStyles,
  compareInfoLabelStyles,
  getComparisonInfoLabel,
  settleInfoLabelStyles,
} from '../../../apps/storybook/src/stories/experiments/compareInfoLabelStyles.js';
import { InfoLabel, infoLabelClassNames, type InfoLabelSlots } from './InfoLabel.js';

afterEach(cleanup);

test('exposes the label, not wrapper-span, forward ref contract', () => {
  expectTypeOf<React.ComponentProps<typeof InfoLabel>['ref']>().toEqualTypeOf<
    React.Ref<HTMLLabelElement> | undefined
  >();
});

async function renderPair(
  example: InfoLabelExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <InfoLabelComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('infolabel-pointer-rest'));
  const legacy = getComparisonInfoLabel(screen.container, 'legacy');
  const headless = getComparisonInfoLabel(screen.container, 'headless');
  await Promise.all([settleInfoLabelStyles(legacy), settleInfoLabelStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(infoLabelExamples)(`matches $name InfoLabel slots in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareInfoLabelStyles(captureInfoLabelStyles(legacy), captureInfoLabelStyles(headless)),
    ).toEqual([]);
    expect(headless.label.control).toBe(headless.control);
    expect(headless.root).toHaveClass(infoLabelClassNames.root);
    expect(headless.label).toHaveClass(infoLabelClassNames.label);
    if (headless.button) expect(headless.button).toHaveClass(infoLabelClassNames.infoButton);
  });
}

test.each([true, false])(
  'retains Fluent defaults and logical required spacing in RTL with defaults %s',
  async (enabled) => {
    const example = infoLabelExamples.find((candidate) => candidate.name === 'large required');
    if (!example) throw new Error('Missing required fixture');
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, enabled, 'rtl');
    expect(
      compareInfoLabelStyles(captureInfoLabelStyles(legacy), captureInfoLabelStyles(headless)),
    ).toEqual([]);
    expect(headless.required && getComputedStyle(headless.required).paddingRight).toBe(
      coreaiLightTheme.spacingHorizontalXS,
    );
    expect(headless.required && getComputedStyle(headless.required).paddingLeft).toBe('0px');
  },
);

test('preserves primary-label/root refs, consumer slots, data, required ordering, and native click focus', async () => {
  const labelRef = React.createRef<HTMLLabelElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const requiredRef = React.createRef<HTMLSpanElement>();
  const rootProps = {
    ref: rootRef,
    className: 'caller-wrapper',
    'data-caller-wrapper': '',
  };
  const requiredProps = {
    ref: requiredRef,
    children: '(required)',
    className: 'caller-required',
    'data-caller-required': '',
  };
  const buttonProps = {
    ref: buttonRef,
    className: 'caller-button',
    'data-caller-button': '',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoLabel
        ref={labelRef}
        root={rootProps}
        className="caller-root"
        data-testid="primary-label"
        data-caller-primary=""
        label={{ className: 'caller-label' }}
        infoButton={buttonProps}
        htmlFor="project-control"
        required={requiredProps}
        info="Use the project name your team recognizes."
      >
        Project
      </InfoLabel>
      <input id="project-control" />
    </CoreAIFluentProvider>,
  );
  const label = screen.getByTestId('primary-label').element();
  const input = screen.getByRole('textbox', { name: 'Project' });
  expect(labelRef.current).toBe(label);
  expect(rootRef.current).toBe(label.parentElement);
  // The explicit root slot overrides the top-level className, as the current primitive does.
  expect(rootRef.current).toHaveClass(infoLabelClassNames.root, 'caller-wrapper');
  expect(labelRef.current).toHaveClass(infoLabelClassNames.label, 'caller-label');
  expect(rootRef.current).toHaveAttribute('data-caller-wrapper', '');
  expect(labelRef.current).toHaveAttribute('data-caller-primary', '');
  expect(requiredRef.current).toHaveClass('fui-Label__required', 'caller-required');
  expect(requiredRef.current).toHaveAttribute('data-caller-required', '');
  expect(buttonRef.current).toHaveClass(infoLabelClassNames.infoButton, 'caller-button');
  expect(buttonRef.current).toHaveAttribute('data-caller-button', '');
  expect(requiredRef.current?.parentElement).toBe(label);
  expect(label.nextElementSibling).toBe(buttonRef.current);
  expect(labelRef.current?.control).toBe(input.element());
  await userEvent.click(label);
  expect(input.element()).toHaveFocus();
  expect(buttonRef.current).toHaveAccessibleName('Project information');
});

test('uses current styled slot adapters while preserving caller render functions and refs', async () => {
  const warnings = vi.spyOn(console, 'warn');
  const labelRef = React.createRef<HTMLLabelElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const renderLabel: SlotRenderFunction<ExtractSlotProps<InfoLabelSlots['label']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-label="">
      Caller project
    </Component>
  );
  const renderButton: SlotRenderFunction<ExtractSlotProps<InfoLabelSlots['infoButton']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-button="">
      ?
    </Component>
  );
  try {
    const screen = await render(
      <CoreAIFluentProvider>
        <InfoLabel
          ref={labelRef}
          htmlFor="render-project"
          size="large"
          weight="semibold"
          required
          info="Render-function information."
          label={{ children: renderLabel }}
          infoButton={{
            ref: buttonRef,
            children: renderButton,
          }}
        />
        <input id="render-project" />
      </CoreAIFluentProvider>,
    );
    expect(labelRef.current).toHaveAttribute('data-rendered-label', '');
    expect(labelRef.current).toHaveAttribute('data-size', 'large');
    expect(labelRef.current?.control).toBe(
      screen.getByRole('textbox', { name: 'Caller project' }).element(),
    );
    expect(labelRef.current?.querySelector('.fui-Label__required')?.textContent).toBe('*');
    expect(buttonRef.current).toHaveAttribute('data-rendered-button', '');
    expect(buttonRef.current).toHaveAttribute('data-size', 'large');
    expect(buttonRef.current?.textContent).toBe('?');
    expect(warnings).not.toHaveBeenCalled();
  } finally {
    warnings.mockRestore();
  }
});

test('retains current optional-button resolution without inventing behavior for zero info', async () => {
  const root = (id: string): React.HTMLAttributes<HTMLSpanElement> & { 'data-testid': string } => ({
    id,
    'data-testid': id,
  });
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoLabel root={root('missing-info')}>No information</InfoLabel>
      <InfoLabel root={root('zero-info')} info={0}>
        Zero information
      </InfoLabel>
      <InfoLabel root={root('explicit-null')} info="Hidden" infoButton={null}>
        Hidden information
      </InfoLabel>
      <InfoLabel root={root('explicit-zero-button')} infoButton={{ info: 0 }}>
        Explicit button
      </InfoLabel>
    </CoreAIFluentProvider>,
  );
  for (const id of ['missing-info', 'zero-info', 'explicit-null']) {
    expect(screen.getByTestId(id).element().querySelector('button')).toBeNull();
  }
  expect(
    screen.getByTestId('explicit-zero-button').element().querySelector('button'),
  ).toHaveAccessibleName('Explicit button information');
});

test('keeps required/status descriptions and generated popup ownership through native open and Escape', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoLabelHelpFlow />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('textbox', { name: 'Project name' }).element();
  expect(input).toBeRequired();
  expect(input).not.toHaveAttribute('aria-invalid');
  const descriptions = input.getAttribute('aria-describedby')?.split(' ') ?? [];
  expect(descriptions).toHaveLength(2);
  expect(descriptions.map((id) => document.getElementById(id)?.textContent)).toEqual([
    'Check that this project does not already exist.',
    'Names are visible to your team.',
  ]);
  const trigger = screen.getByRole('button', { name: 'Project name information' });
  await trigger.click();
  const note = screen.getByRole('note');
  await expect.element(note).toBeVisible();
  await expect.element(note).toHaveFocus();
  const surface = note.element();
  expect(surface).toBeInstanceOf(HTMLDialogElement);
  expect(surface.matches(':popover-open')).toBe(true);
  expect(trigger.element()).toHaveAttribute('aria-details', surface.id);
  expect(trigger.element().closest('.fui-InfoLabel')).toHaveAttribute('aria-owns', surface.id);
  expect(surface).toHaveAttribute('aria-labelledby', surface.id);
  expect(surface).toHaveAccessibleName('Use a stable project name. Naming guide');
  await userEvent.tab();
  expect(screen.getByRole('link', { name: 'Naming guide' }).element()).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect
    .poll(() => trigger.element().closest('.fui-InfoLabel')?.hasAttribute('aria-owns'))
    .toBe(false);
  expect(
    screen.getByRole('status', { name: 'InfoLabel callback count' }).element().textContent,
  ).toBe('2');
});

test('a visual disabled Label does not disable its information button', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoLabel disabled required info="Still available information.">
        Managed project
      </InfoLabel>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Managed project information' });
  expect(trigger.element()).not.toBeDisabled();
  await trigger.click();
  await expect.element(screen.getByRole('note')).toBeVisible();
  expect(screen.getByRole('note').element().textContent).toContain('Still available information.');
});

test('lets ordinary consumer classes override the composed Label and InfoButton foundations', async () => {
  const { headless } = await renderPair(infoLabelConsumerExample);
  expect(getComputedStyle(headless.root).color).toBe('rgb(90, 40, 130)');
  expect(getComputedStyle(headless.label).color).toBe('rgb(20, 90, 60)');
  expect(getComputedStyle(headless.label).fontWeight).toBe('700');
  expect(headless.button && getComputedStyle(headless.button).marginTop).toBe('3px');
  expect(headless.button && getComputedStyle(headless.button).borderRadius).toBe('9px');
});
