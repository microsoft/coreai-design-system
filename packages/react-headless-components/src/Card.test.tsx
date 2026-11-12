// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Card as PrimitiveCard,
  CardFooter as PrimitiveCardFooter,
  CardHeader as PrimitiveCardHeader,
  CardPreview as PrimitiveCardPreview,
  useCardContext,
  type CardSlots as PrimitiveCardSlots,
  type CardHeaderSlots as PrimitiveCardHeaderSlots,
  type CardFooterSlots as PrimitiveCardFooterSlots,
  type CardPreviewSlots as PrimitiveCardPreviewSlots,
} from '@fluentui/react-headless-components-preview/card';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  CardComparison,
  CardNativeActionsFlow,
  CardSelectionFlow,
  cardAppearances,
  cardConsumerExample,
  cardExamples,
  cardFloatingActionPositions,
  cardImageSource,
  cardLogoSource,
  cardOrientations,
  cardSizes,
  type CardExample,
} from '../../../apps/storybook/src/stories/experiments/CardComparison.js';
import {
  captureCardStyles,
  compareCardStyles,
  getCardSlots,
  getComparisonCard,
  settleCardStyles,
} from '../../../apps/storybook/src/stories/experiments/compareCardStyles.js';
import { Card, cardClassNames, type CardProps, type CardSlots } from './Card.js';
import {
  CardHeader,
  cardHeaderClassNames,
  type CardHeaderProps,
  type CardHeaderSlots,
} from './CardHeader.js';
import {
  CardFooter,
  cardFooterClassNames,
  type CardFooterProps,
  type CardFooterSlots,
} from './CardFooter.js';
import {
  CardPreview,
  cardPreviewClassNames,
  type CardPreviewProps,
  type CardPreviewSlots,
} from './CardPreview.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: CardExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <CardComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonCard(screen.container, 'legacy');
  const headless = getComparisonCard(screen.container, 'headless');
  await Promise.all([settleCardStyles(legacy), settleCardStyles(headless)]);
  return { screen, legacy, headless };
}

test('preserves current native slots, refs, and public ForwardRefComponent contracts for all four components', () => {
  expectTypeOf<typeof Card>().toEqualTypeOf<ForwardRefComponent<CardProps>>();
  expectTypeOf<typeof CardHeader>().toEqualTypeOf<ForwardRefComponent<CardHeaderProps>>();
  expectTypeOf<typeof CardFooter>().toEqualTypeOf<ForwardRefComponent<CardFooterProps>>();
  expectTypeOf<typeof CardPreview>().toEqualTypeOf<ForwardRefComponent<CardPreviewProps>>();
  expectTypeOf<React.ComponentProps<typeof Card>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveCard>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof CardHeader>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveCardHeader>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof CardFooter>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveCardFooter>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof CardPreview>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveCardPreview>['ref']
  >();
  expectTypeOf<CardSlots>().toEqualTypeOf<PrimitiveCardSlots>();
  expectTypeOf<CardHeaderSlots>().toEqualTypeOf<PrimitiveCardHeaderSlots>();
  expectTypeOf<CardFooterSlots>().toEqualTypeOf<PrimitiveCardFooterSlots>();
  expectTypeOf<CardPreviewSlots>().toEqualTypeOf<PrimitiveCardPreviewSlots>();
  expectTypeOf<CardProps['as']>().toEqualTypeOf<'div' | undefined>();
  expectTypeOf<Extract<keyof CardProps, 'focusMode'>>().toEqualTypeOf<never>();
});

for (const [mode, theme] of themes) {
  test.each(cardExamples)(
    `matches $name across all owned regions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual([]);
      expect(headless.tagName).toBe('DIV');
      expect(headless).toHaveAttribute('role', 'group');
      expect(headless).toHaveAttribute('aria-label', example.name);
      expect(headless).toHaveAttribute('data-size', example.props?.size ?? 'medium');
      expect(headless).toHaveAttribute(
        'data-orientation',
        example.props?.orientation ?? 'vertical',
      );
      expect(headless.hasAttribute('data-selected')).toBe(
        Boolean(example.props?.selected ?? example.props?.defaultSelected),
      );
      const checkbox = getCardSlots(headless).checkbox;
      if (checkbox) {
        expect(checkbox.checked).toBe(
          Boolean(example.props?.selected ?? example.props?.defaultSelected),
        );
        expect(checkbox.disabled).toBe(Boolean(example.props?.disabled));
      }
    },
  );

  for (const selected of [false, true]) {
    test.each(cardAppearances)(
      `matches %s interactive hover with selected=${selected} in ${mode} mode`,
      async (appearance) => {
        const { screen, legacy, headless } = await renderPair(
          {
            name: 'Interactive hover',
            props: { appearance, ...(selected ? { selected } : {}), onClick: () => undefined },
          },
          theme,
        );
        await userEvent.hover(legacy);
        expect(legacy.matches(':hover')).toBe(true);
        await settleCardStyles(legacy);
        const expected = captureCardStyles(legacy);
        await userEvent.hover(headless);
        expect(headless.matches(':hover')).toBe(true);
        await settleCardStyles(headless);
        expect(compareCardStyles(expected, captureCardStyles(headless))).toEqual([]);
        await userEvent.hover(screen.getByText('Case', { exact: true }));
      },
    );

    test.each(cardAppearances)(
      `matches %s pointer press with selected=${selected} in ${mode} mode`,
      async (appearance) => {
        const captures: Record<string, string>[] = [];
        const pressed: boolean[] = [];
        const onMouseDown: NonNullable<CardProps['onMouseDown']> = (event) => {
          pressed.push(event.currentTarget.matches(':active'));
          captures.push(captureCardStyles(event.currentTarget));
        };
        const { legacy, headless } = await renderPair(
          {
            name: 'Pointer press',
            props: { appearance, ...(selected ? { selected } : {}), onMouseDown },
          },
          theme,
        );
        await userEvent.click(legacy);
        await userEvent.click(headless);
        expect(pressed).toEqual([true, true]);
        expect(captures).toHaveLength(2);
        expect(compareCardStyles(captures[0], captures[1])).toEqual([]);
      },
    );
  }

  test.each(cardAppearances)(`matches %s disabled hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      { name: 'Disabled hover', props: { appearance, disabled: true, selected: true } },
      theme,
    );
    await userEvent.hover(legacy);
    await settleCardStyles(legacy);
    const expected = captureCardStyles(legacy);
    await userEvent.hover(headless);
    await settleCardStyles(headless);
    expect(headless.matches(':hover')).toBe(true);
    expect(compareCardStyles(expected, captureCardStyles(headless))).toEqual([]);
    expect(getCardSlots(headless).checkbox?.checked).toBe(true);
  });
}

for (const dir of ['ltr', 'rtl'] as const) {
  for (const orientation of cardOrientations) {
    for (const preview of ['first', 'last'] as const) {
      test.each(cardFloatingActionPositions)(
        `matches physical %s rail and ${preview} preview edges in ${orientation} ${dir} layout`,
        async (floatingActionPosition) => {
          const { legacy, headless } = await renderPair(
            {
              name: 'Physical rail and preview',
              floating: true,
              preview,
              props: { orientation, floatingActionPosition },
            },
            coreaiLightTheme,
            dir,
          );
          expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual(
            [],
          );
          const floating = getCardSlots(headless).floatingAction;
          if (!floating) throw new Error('Missing floating-action rail');
          const computed = getComputedStyle(floating);
          expect(computed.width).toBe('28px');
          expect(computed.getPropertyValue(floatingActionPosition)).toBe('0px');
          expect(getCardSlots(headless).checkbox).toBe(null);
        },
      );
    }
  }
}

for (const orientation of cardOrientations) {
  test.each(['first', 'last', 'only'] as const)(
    `matches %s preview dimensions and margins in ${orientation} layout`,
    async (preview) => {
      const { legacy, headless } = await renderPair({
        name: 'Preview edges',
        preview,
        props: { orientation },
      });
      expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual([]);
      const slots = getCardSlots(headless);
      if (!slots.preview || !slots.media || !slots.logo) throw new Error('Missing preview slots');
      expect(slots.preview).toHaveClass(cardPreviewClassNames.root);
      expect(slots.logo).toHaveClass(cardPreviewClassNames.logo);
      expect(slots.media.getAttribute('alt')).toBe('Mountain project preview');
      expect(getComputedStyle(slots.media).objectFit).toBe('cover');
    },
  );
}

for (const [mode, theme] of themes) {
  test.each(cardSizes)(
    `matches %s baseline with defaults disabled in ${mode} mode`,
    async (size) => {
      const { legacy, headless } = await renderPair(
        { name: 'Defaults opt-out', props: { size } },
        theme,
        'ltr',
        false,
      );
      expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual([]);
      expect(headless).toHaveAttribute('data-appearance', 'filled');
      expect(headless.hasAttribute('data-coreai-defaults')).toBe(false);
      expect(getComputedStyle(headless).boxShadow).not.toBe('none');
      expect(getComputedStyle(headless).borderTopWidth).toBe('0px');
    },
  );
}

test.each(cardFloatingActionPositions)(
  'retains the CoreAI %s floating-action wrapper when component defaults are disabled',
  async (floatingActionPosition) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Floating wrapper opt-out',
        floating: true,
        preview: 'first',
        props: { floatingActionPosition },
      },
      coreaiLightTheme,
      'ltr',
      false,
    );
    expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual([]);
    const action = getCardSlots(headless).floatingAction;
    if (!action) throw new Error('Missing floating action');
    expect(getComputedStyle(action).width).toBe('28px');
    expect(getComputedStyle(action).paddingTop).toBe('6px');
  },
);

test('gives ordinary consumer CSS priority on every owned family region', async () => {
  const { legacy, headless } = await renderPair(cardConsumerExample);
  const slots = getCardSlots(headless);
  const rootStyle = getComputedStyle(headless);
  expect(rootStyle.backgroundColor).toBe('rgb(237, 232, 247)');
  expect(rootStyle.borderTopWidth).toBe('3px');
  expect(rootStyle.borderRadius).toBe('3px');
  expect(rootStyle.paddingTop).toBe('17px');
  expect(rootStyle.gap).toBe('9px');
  if (
    !slots.header ||
    !slots.image ||
    !slots.title ||
    !slots.description ||
    !slots.headerAction ||
    !slots.preview ||
    !slots.logo ||
    !slots.footer ||
    !slots.footerAction ||
    !slots.floatingAction
  ) {
    throw new Error('Missing consumer Card regions');
  }
  expect(getComputedStyle(slots.header).getPropertyValue('--fui-CardHeader--gap')).toBe('7px');
  expect(getComputedStyle(slots.image).width).toBe('28px');
  expect(getComputedStyle(slots.title).color).toBe('rgb(80, 40, 120)');
  expect(getComputedStyle(slots.description).color).toBe('rgb(60, 70, 90)');
  expect(getComputedStyle(slots.headerAction).marginInlineStart).toBe('5px');
  expect(getComputedStyle(slots.preview).height).toBe('100px');
  expect(getComputedStyle(slots.logo).width).toBe('24px');
  expect(getComputedStyle(slots.logo).insetInlineStart).toBe('7px');
  expect(getComputedStyle(slots.footer).gap).toBe('7px');
  expect(getComputedStyle(slots.footerAction).marginInlineStart).toBe('9px');
  expect(getComputedStyle(slots.floatingAction).paddingTop).toBe('2px');
  expect(getComputedStyle(slots.floatingAction).width).toBe('24px');
  expect(
    compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless)).length,
  ).toBeGreaterThan(0);
});

test('preserves the CoreAI custom Text color instead of applying interactive currentColor', async () => {
  const { screen, legacy, headless } = await renderPair({
    name: 'Custom text color',
    tintedText: true,
    props: { onClick: () => undefined },
  });
  const reference = screen.container.querySelector('[data-card-color-reference]');
  if (!reference) throw new Error('Missing foreground color reference');
  const expectedColor = getComputedStyle(reference).color;
  for (const root of [legacy, headless]) {
    const text = root.querySelector('.fui-Text');
    if (!text) throw new Error('Missing supplied Text');
    expect(expectedColor).not.toBe(getComputedStyle(root).color);
    expect(getComputedStyle(text).color).toBe(expectedColor);
    await userEvent.hover(root);
    expect(getComputedStyle(text).color).toBe(expectedColor);
  }
});

test('reports the exact intentional consumer Text cascade difference when defaults are disabled', async () => {
  const { screen, legacy, headless } = await renderPair(
    { name: 'Custom Text color', tintedText: true, props: { onClick: () => undefined } },
    coreaiLightTheme,
    'ltr',
    false,
  );
  const reference = screen.container.querySelector('[data-card-color-reference]');
  if (!reference) throw new Error('Missing foreground color reference');
  expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual([
    {
      property: 'text.color',
      legacy: getComputedStyle(legacy).color,
      headless: getComputedStyle(reference).color,
    },
  ]);
});

test('keeps strict comparisons for dimensions, offsets, style strings, and missing values', () => {
  const legacy = {
    'root.rect.width': '320.00',
    'header.rect.height': '32.00',
    'logo.inset-inline-start': '12px',
    'root.background-color': 'rgb(0, 0, 0)',
  };
  expect(compareCardStyles(legacy, { ...legacy })).toEqual([]);
  expect(compareCardStyles(legacy, { ...legacy, 'root.rect.width': '320.01' })).toEqual([
    { property: 'root.rect.width', legacy: '320.00', headless: '320.01' },
  ]);
  expect(compareCardStyles(legacy, { ...legacy, 'logo.inset-inline-start': '12.1px' })).toEqual([
    { property: 'logo.inset-inline-start', legacy: '12px', headless: '12.1px' },
  ]);
  expect(compareCardStyles({}, { 'logo.present': 'false' })).toEqual([
    { property: 'logo.present', legacy: null, headless: 'false' },
  ]);
});

test('selects by native checkbox Space, preserves controlled callbacks, and restricts nested actions when requested', async () => {
  const onSelectionChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const onAction = vi.fn<React.MouseEventHandler<HTMLButtonElement>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <CardSelectionFlow onSelectionChange={onSelectionChange} onAction={onAction} />
    </CoreAIFluentProvider>,
  );
  const checkbox = screen.getByRole('checkbox', { name: 'Project Atlas', exact: true });
  const root = screen.getByRole('group', { name: 'Selectable Atlas', exact: true });
  await userEvent.click(screen.getByRole('button', { name: 'Start keyboard selection' }));
  await userEvent.hover(screen.getByText(/Native Tab reaches/));
  await userEvent.tab();
  await expect.element(checkbox).toHaveFocus();
  expect(checkbox.element().matches(':focus-visible')).toBe(true);
  expect(getComputedStyle(root.element()).outlineStyle).toBe('solid');
  expect(getComputedStyle(root.element()).outlineWidth).toBe('2px');
  await userEvent.keyboard(' ');
  await expect.element(checkbox).toBeChecked();
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
  expect(onSelectionChange.mock.calls[0][1].selected).toBe(true);
  expect(onSelectionChange.mock.calls[0][0].type).toBe('change');
  await expect.element(root).toHaveAttribute('data-selected', '');
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Open Atlas actions' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(onAction).toHaveBeenCalledTimes(1);
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
  await expect.element(checkbox).toBeChecked();
  await expect
    .element(screen.getByRole('status', { name: 'Atlas selection' }))
    .toHaveTextContent('Selected; changes: 1; actions: 1');
  await userEvent.click(screen.getByText('Select the Atlas card body.'));
  expect(onSelectionChange).toHaveBeenCalledTimes(2);
  expect(onSelectionChange.mock.calls[1][1].selected).toBe(false);
  expect(onSelectionChange.mock.calls[1][0].type).toBe('click');
  await expect.element(checkbox).not.toBeChecked();
  await expect.element(root).not.toHaveAttribute('data-selected');
  await userEvent.click(screen.getByText('Project Borealis'));
  await expect
    .element(screen.getByRole('checkbox', { name: 'Project Borealis' }))
    .not.toBeChecked();
});

test('does not replace controlled state and preserves supplied native click/keydown callbacks', async () => {
  const onSelectionChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const onClick = vi.fn<NonNullable<CardProps['onClick']>>();
  const onKeyDown = vi.fn<NonNullable<CardProps['onKeyDown']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before controlled card</button>
      <Card
        selected={false}
        tabIndex={0}
        aria-label="Controlled card"
        checkbox={{ 'aria-label': 'Controlled selection' }}
        onSelectionChange={onSelectionChange}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        Controlled card body
      </Card>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByText('Controlled card body'));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
  expect(onSelectionChange.mock.calls[0][1].selected).toBe(true);
  await expect
    .element(screen.getByRole('checkbox', { name: 'Controlled selection' }))
    .not.toBeChecked();
  await userEvent.click(screen.getByRole('button', { name: 'Before controlled card' }));
  await userEvent.hover(screen.getByRole('button', { name: 'Before controlled card' }));
  await userEvent.tab();
  await expect.element(screen.getByRole('group', { name: 'Controlled card' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(onKeyDown.mock.calls[0][0].key).toBe('Enter');
  expect(onSelectionChange).toHaveBeenCalledTimes(2);
  expect(onSelectionChange.mock.calls[1][1].selected).toBe(true);
  await expect
    .element(screen.getByRole('checkbox', { name: 'Controlled selection' }))
    .not.toBeChecked();
});

test('keeps the installed primitive default for nested interactive bubbling without a restriction predicate', async () => {
  const styledChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const primitiveChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Card defaultSelected={false} onSelectionChange={styledChange}>
        <button type="button">Styled nested action</button>
      </Card>
      <PrimitiveCard defaultSelected={false} onSelectionChange={primitiveChange}>
        <button type="button">Primitive nested action</button>
      </PrimitiveCard>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Styled nested action' }));
  await userEvent.click(screen.getByRole('button', { name: 'Primitive nested action' }));
  expect(styledChange).toHaveBeenCalledTimes(1);
  expect(primitiveChange).toHaveBeenCalledTimes(1);
  expect(styledChange.mock.calls[0][1].selected).toBe(true);
  expect(primitiveChange.mock.calls[0][1].selected).toBe(true);
});

test('preserves the current primitive duplicate click/change notifications for an unmodified native checkbox', async () => {
  const styledChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const primitiveChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before styled checkbox</button>
      <Card onSelectionChange={styledChange} checkbox={{ 'aria-label': 'Styled default checkbox' }}>
        Styled selection
      </Card>
      <button type="button">Before primitive checkbox</button>
      <PrimitiveCard
        onSelectionChange={primitiveChange}
        checkbox={{ 'aria-label': 'Primitive default checkbox' }}
      >
        Primitive selection
      </PrimitiveCard>
    </CoreAIFluentProvider>,
  );
  for (const [kind, callback] of [
    ['styled', styledChange],
    ['primitive', primitiveChange],
  ] as const) {
    const name = kind === 'styled' ? 'Styled default checkbox' : 'Primitive default checkbox';
    await userEvent.click(screen.getByRole('button', { name: `Before ${kind} checkbox` }));
    await userEvent.tab();
    const checkbox = screen.getByRole('checkbox', { name });
    await expect.element(checkbox).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect.element(checkbox).toBeChecked();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls.map(([event, data]) => [event.type, data.selected])).toEqual([
      ['click', true],
      ['change', true],
    ]);
  }
});

test('preserves the primitive nested Enter cancellation and native Space activation with a selection restriction', async () => {
  const styledSelection = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const primitiveSelection = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const styledAction = vi.fn();
  const primitiveAction = vi.fn();
  const restrict: NonNullable<CardProps['shouldRestrictTriggerAction']> = (event) =>
    event.target instanceof Element && Boolean(event.target.closest('button'));
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before styled restricted action</button>
      <Card
        onSelectionChange={styledSelection}
        shouldRestrictTriggerAction={restrict}
        checkbox={{ 'aria-label': 'Styled restricted selection' }}
      >
        <button type="button" onClick={styledAction}>
          Styled restricted action
        </button>
      </Card>
      <button type="button">Before primitive restricted action</button>
      <PrimitiveCard
        onSelectionChange={primitiveSelection}
        shouldRestrictTriggerAction={restrict}
        checkbox={{ 'aria-label': 'Primitive restricted selection' }}
      >
        <button type="button" onClick={primitiveAction}>
          Primitive restricted action
        </button>
      </PrimitiveCard>
    </CoreAIFluentProvider>,
  );
  for (const [kind, action, selection] of [
    ['styled', styledAction, styledSelection],
    ['primitive', primitiveAction, primitiveSelection],
  ] as const) {
    const name = kind === 'styled' ? 'Styled restricted action' : 'Primitive restricted action';
    await userEvent.click(screen.getByRole('button', { name: `Before ${kind} restricted action` }));
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name, exact: true })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(action).not.toHaveBeenCalled();
    expect(selection).not.toHaveBeenCalled();
    await userEvent.keyboard(' ');
    expect(action).toHaveBeenCalledTimes(1);
    expect(selection).not.toHaveBeenCalled();
  }
});

test('blocks disabled root activation and selection while leaving native child disabling to the consumer', async () => {
  const onClick = vi.fn<NonNullable<CardProps['onClick']>>();
  const onSelectionChange = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const childAction = vi.fn();
  const childRef = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before disabled card</button>
      <Card
        aria-label="Disabled card"
        disabled
        defaultSelected
        onClick={onClick}
        onSelectionChange={onSelectionChange}
        checkbox={{ 'aria-label': 'Disabled selection' }}
      >
        <p>Disabled card body</p>
        <button ref={childRef} type="button" onClick={childAction}>
          Explicitly enabled child
        </button>
      </Card>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('group', { name: 'Disabled card' });
  await expect.element(root).toHaveAttribute('aria-disabled', 'true');
  expect(root.element().tabIndex).toBe(-1);
  await expect.element(screen.getByRole('checkbox', { name: 'Disabled selection' })).toBeDisabled();
  await userEvent.click(screen.getByText('Disabled card body'));
  expect(onClick).not.toHaveBeenCalled();
  expect(onSelectionChange).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('checkbox', { name: 'Disabled selection' })).toBeChecked();
  expect(childRef.current?.disabled).toBe(false);
  expect(childRef.current).not.toHaveAttribute('disabled');
  await userEvent.click(screen.getByRole('button', { name: 'Before disabled card' }));
  await userEvent.tab();
  await expect
    .element(screen.getByRole('button', { name: 'Explicitly enabled child' }))
    .toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(childAction).toHaveBeenCalledTimes(1);
  expect(onSelectionChange).not.toHaveBeenCalled();
});

test('keeps native Tab behavior, explicit focus-visible styling, and no invented div keyboard activation', async () => {
  const clicked = vi.fn<NonNullable<CardProps['onClick']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <p>Native focus sentinel</p>
      <button type="button">Before native group</button>
      <Card tabIndex={0} aria-label="Native group" onClick={clicked}>
        <CardHeader header="Native group title" />
        <CardFooter>
          <button type="button">Inner native action</button>
        </CardFooter>
      </Card>
      <button type="button">After native group</button>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('group', { name: 'Native group' });
  expect(root.element().hasAttribute('data-tabster')).toBe(false);
  expect(root.element().hasAttribute('focusgroup')).toBe(false);
  expect(root.element().querySelector('[data-tabster]')).toBe(null);
  await userEvent.click(screen.getByRole('button', { name: 'Before native group' }));
  await userEvent.hover(screen.getByText('Native focus sentinel'));
  await userEvent.tab();
  await expect.element(root).toHaveFocus();
  expect(root.element().matches(':focus-visible')).toBe(true);
  expect(root.element().matches(':hover')).toBe(false);
  expect(getComputedStyle(root.element()).outlineStyle).toBe('solid');
  expect(getComputedStyle(root.element()).outlineOffset).toBe('-2px');
  await userEvent.hover(root);
  expect(root.element().matches(':focus-visible')).toBe(true);
  expect(root.element().matches(':hover')).toBe(true);
  expect(getComputedStyle(root.element()).outlineStyle).toBe('solid');
  await userEvent.keyboard('{Enter}');
  expect(clicked).not.toHaveBeenCalled();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Inner native action' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(clicked).toHaveBeenCalledTimes(1);
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After native group' })).toHaveFocus();
});

test('does not automatically make a pointer-interactive card a tab stop', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Current native focus boundary',
    props: { onClick: () => undefined },
  });
  expect(legacy.tabIndex).toBe(0);
  expect(headless.tabIndex).toBe(-1);
  expect(headless.hasAttribute('data-tabster')).toBe(false);
});

test('keeps native floating actions, submitter FormData, and link navigation in valid child elements', async () => {
  const originalUrl = window.location.href;
  const screen = await render(
    <CoreAIFluentProvider>
      <CardNativeActionsFlow />
    </CoreAIFluentProvider>,
  );
  try {
    const root = screen.getByRole('group', { name: 'Atlas actions' });
    expect(root.element().tabIndex).toBe(-1);
    expect(root.element().querySelector('.fui-Card__checkbox')).toBe(null);
    await userEvent.click(screen.getByRole('button', { name: 'Start keyboard actions' }));
    await userEvent.hover(screen.getByText(/Card is a noninteractive group/));
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Pin project' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect
      .element(screen.getByRole('status', { name: 'Project pins' }))
      .toHaveTextContent('Pins: 1');
    await expect
      .element(screen.getByRole('status', { name: 'Project submission' }))
      .toHaveTextContent('No submission; submissions: 0');
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Open project' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect
      .element(screen.getByRole('status', { name: 'Project submission' }))
      .toHaveTextContent('Atlas:open; submissions: 1');
    await userEvent.tab();
    const link = screen.getByRole('link', { name: 'Project details' });
    await expect.element(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect
      .element(screen.getByRole('status', { name: 'Project visits' }))
      .toHaveTextContent('Visits: 1');
    expect(window.location.hash).toBe(link.element().getAttribute('href'));
  } finally {
    window.history.replaceState(null, '', originalUrl);
  }
});

test('preserves checkbox form name/value and excludes disabled selections from FormData', async () => {
  const formRef = React.createRef<HTMLFormElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <form ref={formRef}>
        <Card
          defaultSelected
          checkbox={{ name: 'project', value: 'Atlas', 'aria-label': 'Submit Atlas selection' }}
        >
          Atlas selected
        </Card>
        <Card
          defaultSelected
          disabled
          checkbox={{ name: 'project', value: 'Borealis', 'aria-label': 'Locked Borealis' }}
        >
          Borealis disabled
        </Card>
      </form>
    </CoreAIFluentProvider>,
  );
  if (!formRef.current) throw new Error('Missing selection form');
  expect(new FormData(formRef.current).getAll('project')).toEqual(['Atlas']);
  await userEvent.click(screen.getByText('Atlas selected'));
  expect(new FormData(formRef.current).getAll('project')).toEqual([]);
});

test('shares the current public context and labels selection from header child IDs or preview image alt text', async () => {
  function ContextProbe() {
    const context = useCardContext();
    return (
      <output aria-label="Public card context">{context.selectableA11yProps.referenceId}</output>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <Card defaultSelected aria-label="Header-labelled card">
        <CardHeader header={<h3 id="atlas-card-title">Atlas heading</h3>} />
        <ContextProbe />
      </Card>
      <Card defaultSelected aria-label="Preview-labelled card">
        <CardPreview>
          <img src={cardImageSource} alt="Borealis document preview" />
        </CardPreview>
      </Card>
    </CoreAIFluentProvider>,
  );
  await expect.element(screen.getByRole('checkbox', { name: 'Atlas heading' })).toBeChecked();
  await expect
    .element(screen.getByRole('checkbox', { name: 'Atlas heading' }))
    .toHaveAttribute('aria-labelledby', 'atlas-card-title');
  await expect
    .element(screen.getByRole('status', { name: 'Public card context' }))
    .toHaveTextContent('atlas-card-title');
  await expect
    .element(screen.getByRole('checkbox', { name: 'Borealis document preview' }))
    .toHaveAttribute('aria-label', 'Borealis document preview');
});

test('preserves caller root/checkbox/floating slots, native refs, render functions, classes, and data', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const checkboxRef = React.createRef<HTMLInputElement>();
  const floatingRef = React.createRef<HTMLDivElement>();
  const rendered: unknown[] = [];
  const onSelection = vi.fn<NonNullable<CardProps['onSelectionChange']>>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<CardSlots['root']>> = (
    Component,
    props,
  ) => {
    rendered.push(Component);
    return <Component {...props} data-rendered-card="" />;
  };
  const renderFloating: SlotRenderFunction<ExtractSlotProps<CardSlots['floatingAction']>> = (
    Component,
    props,
  ) => {
    rendered.push(Component);
    return (
      <Component {...props} data-rendered-floating="">
        <button type="button">Caller floating action</button>
      </Component>
    );
  };
  const checkbox: ExtractSlotProps<CardSlots['checkbox']> & { 'data-caller-checkbox': string } = {
    ref: checkboxRef,
    className: 'caller-checkbox',
    'aria-label': 'Caller selection',
    'data-caller-checkbox': 'kept',
    onClick: (event) => event.stopPropagation(),
  };
  const floating: ExtractSlotProps<CardSlots['floatingAction']> & {
    'data-caller-floating': string;
  } = {
    ref: floatingRef,
    className: 'caller-floating',
    children: renderFloating,
    'data-caller-floating': 'kept',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Start custom-slot keyboard</button>
      <Card
        ref={rootRef}
        className="caller-card"
        aria-label="Caller rendered card"
        defaultSelected
        checkbox={checkbox}
        onSelectionChange={onSelection}
      >
        {renderRoot}
      </Card>
      <Card
        aria-label="Caller floating card"
        floatingAction={floating}
        floatingActionPosition="left"
      >
        Preserved card content
      </Card>
      <Card aria-label="Suppressed native selection" defaultSelected checkbox={null}>
        No generated checkbox
      </Card>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toBe(
    screen.getByRole('group', { name: 'Caller rendered card' }).element(),
  );
  expect(rootRef.current).toHaveClass(cardClassNames.root, 'caller-card');
  expect(rootRef.current).toHaveAttribute('data-rendered-card', '');
  expect(checkboxRef.current).toBe(
    screen.getByRole('checkbox', { name: 'Caller selection' }).element(),
  );
  expect(checkboxRef.current).toHaveClass(cardClassNames.checkbox, 'caller-checkbox');
  expect(checkboxRef.current).toHaveAttribute('data-caller-checkbox', 'kept');
  expect(checkboxRef.current?.checked).toBe(true);
  expect(floatingRef.current).toHaveClass(cardClassNames.floatingAction, 'caller-floating');
  expect(floatingRef.current).toHaveAttribute('data-caller-floating', 'kept');
  expect(floatingRef.current).toHaveAttribute('data-rendered-floating', '');
  expect(screen.getByRole('group', { name: 'Caller floating card' }).element()).toHaveTextContent(
    'Preserved card content',
  );
  expect(
    screen
      .getByRole('group', { name: 'Suppressed native selection' })
      .element()
      .querySelector('.fui-Card__checkbox'),
  ).toBe(null);
  expect(rendered.every((component) => component === 'div')).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Start custom-slot keyboard' }));
  await userEvent.tab();
  await expect.element(screen.getByRole('checkbox', { name: 'Caller selection' })).toHaveFocus();
  await userEvent.keyboard(' ');
  expect(onSelection).toHaveBeenCalledTimes(1);
  expect(onSelection.mock.calls[0][1].selected).toBe(false);
});

test('preserves every CardHeader native slot and caller rendering while retaining the resolved grid layout', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const imageRef = React.createRef<HTMLImageElement>();
  const headerRef = React.createRef<HTMLDivElement>();
  const descriptionRef = React.createRef<HTMLDivElement>();
  const actionRef = React.createRef<HTMLDivElement>();
  const actionClick = vi.fn();
  const renderHeader: SlotRenderFunction<ExtractSlotProps<CardHeaderSlots['header']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-header="">
      Caller title
    </Component>
  );
  const renderDescription: SlotRenderFunction<ExtractSlotProps<CardHeaderSlots['description']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-description="">
      Caller description
    </Component>
  );
  const image: Extract<ExtractSlotProps<CardHeaderSlots['image']>, { as: 'img' }> & {
    'data-caller-image': string;
  } = {
    as: 'img',
    ref: imageRef,
    src: cardLogoSource,
    alt: 'Caller header image',
    width: 32,
    height: 32,
    className: 'caller-header-image',
    'data-caller-image': 'kept',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <CardHeader
        ref={rootRef}
        className="caller-header"
        image={image}
        header={{ ref: headerRef, className: 'caller-title', children: renderHeader }}
        description={{
          ref: descriptionRef,
          className: 'caller-description',
          children: renderDescription,
        }}
        action={{
          ref: actionRef,
          className: 'caller-header-action',
          children: (
            <button type="button" onClick={actionClick}>
              Header action
            </button>
          ),
        }}
      />
      <CardHeader header="Flex title" description={null} image={null} action={null} />
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toHaveClass(cardHeaderClassNames.root, 'caller-header');
  expect(rootRef.current).toHaveAttribute('data-has-description', '');
  expect(imageRef.current).toBe(screen.getByRole('img', { name: 'Caller header image' }).element());
  expect(imageRef.current).toHaveClass(cardHeaderClassNames.image, 'caller-header-image');
  expect(imageRef.current).toHaveAttribute('data-caller-image', 'kept');
  expect(imageRef.current?.tagName).toBe('IMG');
  expect(headerRef.current).toHaveClass(cardHeaderClassNames.header, 'caller-title');
  expect(headerRef.current).toHaveAttribute('data-rendered-header', '');
  expect(descriptionRef.current).toHaveClass(
    cardHeaderClassNames.description,
    'caller-description',
  );
  expect(descriptionRef.current).toHaveAttribute('data-rendered-description', '');
  expect(actionRef.current).toHaveClass(cardHeaderClassNames.action, 'caller-header-action');
  if (!rootRef.current) throw new Error('Missing header root');
  expect(getComputedStyle(rootRef.current).display).toBe('grid');
  await userEvent.click(screen.getByRole('button', { name: 'Header action' }));
  expect(actionClick).toHaveBeenCalledTimes(1);
  const flex = screen.getByText('Flex title').element().parentElement;
  if (!flex) throw new Error('Missing flex header root');
  expect(flex.hasAttribute('data-has-description')).toBe(false);
  expect(getComputedStyle(flex).display).toBe('flex');
  expect(flex.querySelector('.fui-CardHeader__image')).toBe(null);
});

test('preserves CardFooter child order, custom root/action renderers, native refs, and caller classes', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const actionRef = React.createRef<HTMLDivElement>();
  const clicked = vi.fn();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<CardFooterSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-footer="" />;
  const renderAction: SlotRenderFunction<ExtractSlotProps<CardFooterSlots['action']>> = (
    Component,
    props,
  ) => (
    <Component {...props}>
      <button type="button" onClick={clicked}>
        Rendered footer action
      </button>
    </Component>
  );
  const action: ExtractSlotProps<CardFooterSlots['action']> & { 'data-footer-action': string } = {
    ref: actionRef,
    className: 'caller-footer-action',
    'data-footer-action': 'kept',
    children: renderAction,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <CardFooter ref={rootRef} className="caller-footer" action={action}>
        {renderRoot}
      </CardFooter>
      <CardFooter data-testid="ordered-footer" action={<span>Trailing action</span>}>
        <button type="button">Leading action</button>
      </CardFooter>
      <CardFooter data-testid="empty-footer-action" action={null}>
        Only footer content
      </CardFooter>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toHaveClass(cardFooterClassNames.root, 'caller-footer');
  expect(rootRef.current).toHaveAttribute('data-rendered-footer', '');
  expect(actionRef.current).toHaveClass(cardFooterClassNames.action, 'caller-footer-action');
  expect(actionRef.current).toHaveAttribute('data-footer-action', 'kept');
  await userEvent.click(screen.getByRole('button', { name: 'Rendered footer action' }));
  expect(clicked).toHaveBeenCalledTimes(1);
  const ordered = screen.getByTestId('ordered-footer').element();
  expect(ordered.firstElementChild).toBe(
    screen.getByRole('button', { name: 'Leading action' }).element(),
  );
  expect(ordered.lastElementChild).toHaveClass(cardFooterClassNames.action);
  expect(screen.getByTestId('empty-footer-action').element().children).toHaveLength(0);
});

test('preserves CardPreview root/logo refs, current native img slot metadata, caller rendering, and nullable logos', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const logoRef = React.createRef<HTMLImageElement>();
  const renderedLogoRef = React.createRef<HTMLDivElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<CardPreviewSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-preview="" />;
  const renderLogo: SlotRenderFunction<
    Extract<ExtractSlotProps<CardPreviewSlots['logo']>, { as?: 'div' }>
  > = (Component, props) => <Component {...props}>Rendered logo</Component>;
  const nativeLogo: Extract<ExtractSlotProps<CardPreviewSlots['logo']>, { as: 'img' }> & {
    'data-preview-logo': string;
  } = {
    as: 'img',
    src: cardLogoSource,
    alt: 'Caller preview logo',
    ref: logoRef,
    className: 'caller-logo',
    'data-preview-logo': 'kept',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <CardPreview ref={rootRef} className="caller-preview" logo={nativeLogo}>
        {renderRoot}
      </CardPreview>
      <CardPreview
        data-testid="custom-logo-preview"
        logo={{
          as: 'div',
          ref: renderedLogoRef,
          className: 'caller-rendered-logo',
          children: renderLogo,
        }}
      >
        <img src={cardImageSource} alt="Rendered media" />
      </CardPreview>
      <CardPreview logo={null} data-testid="no-logo-preview">
        <img src={cardImageSource} alt="No logo media" />
      </CardPreview>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toHaveClass(cardPreviewClassNames.root, 'caller-preview');
  expect(rootRef.current).toHaveAttribute('data-rendered-preview', '');
  expect(logoRef.current).toBe(screen.getByRole('img', { name: 'Caller preview logo' }).element());
  expect(logoRef.current?.tagName).toBe('IMG');
  expect(logoRef.current).toHaveClass(cardPreviewClassNames.logo, 'caller-logo');
  expect(logoRef.current).toHaveAttribute('data-preview-logo', 'kept');
  expect(renderedLogoRef.current).toHaveClass(cardPreviewClassNames.logo, 'caller-rendered-logo');
  expect(renderedLogoRef.current).toHaveTextContent('Rendered logo');
  expect(screen.getByTestId('custom-logo-preview').element().firstElementChild).toBe(
    screen.getByRole('img', { name: 'Rendered media' }).element(),
  );
  expect(
    screen.getByTestId('no-logo-preview').element().querySelector('.fui-CardPreview__logo'),
  ).toBe(null);
});
