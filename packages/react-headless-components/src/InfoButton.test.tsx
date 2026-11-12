// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import {
  InfoButton as PrimitiveInfoButton,
  type InfoButtonSlots as PrimitiveInfoButtonSlots,
} from '@fluentui/react-headless-components-preview/info-label';
import {
  InfoButton as LegacyInfoButton,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  InfoButtonComparison,
  InfoButtonHelpFlow,
  infoButtonConsumerExample,
  infoButtonExamples,
  type InfoButtonExample,
} from '../../../apps/storybook/src/stories/experiments/InfoButtonComparison.js';
import {
  captureInfoButtonStyles,
  compareInfoButtonStyles,
  getComparisonInfoButton,
  refreshInformationPositioning,
  settleInfoButtonStyles,
} from '../../../apps/storybook/src/stories/experiments/compareInfoButtonStyles.js';
import {
  InfoButton,
  infoButtonClassNames,
  type InfoButtonProps,
  type InfoButtonSlots,
} from './InfoButton.js';
import { InfoLabel } from './InfoLabel.js';
import { Button } from './Button.js';

afterEach(cleanup);

test('keeps the CoreAI custom accessible-name union and current button ref/API', () => {
  expectTypeOf<React.ComponentProps<typeof InfoButton>['ref']>().toEqualTypeOf<
    React.Ref<HTMLButtonElement> | undefined
  >();
  expectTypeOf<{ info: string }>().not.toMatchTypeOf<InfoButtonProps>();
  expectTypeOf<{ 'aria-label': string; info: string }>().toMatchTypeOf<InfoButtonProps>();
  expectTypeOf<{ 'aria-labelledby': string; info: number }>().toMatchTypeOf<InfoButtonProps>();
  expectTypeOf<InfoButtonProps>().not.toHaveProperty('disabled');
  expectTypeOf<InfoButtonProps>().not.toHaveProperty('inline');
});

async function renderPair(
  example: InfoButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const legacyRef = React.createRef<PositioningImperativeRef>();
  const headlessRef = React.createRef<PositioningImperativeRef>();
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <span data-testid="information-pointer-rest">Rest pointer here</span>
      <InfoButtonComparison
        example={example}
        legacyPositioningRef={legacyRef}
        headlessPositioningRef={headlessRef}
      />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('information-pointer-rest'));
  const legacy = getComparisonInfoButton(screen.container, 'legacy');
  const headless = getComparisonInfoButton(screen.container, 'headless');
  await Promise.all([settleInfoButtonStyles(legacy), settleInfoButtonStyles(headless)]);
  if (!legacyRef.current || !headlessRef.current) throw new Error('Missing positioning handles');
  await refreshInformationPositioning(legacy, headless, legacyRef.current, headlessRef.current);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(infoButtonExamples)(
    `matches $name selected button/surface/glyph styles in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      const differences = compareInfoButtonStyles(
        captureInfoButtonStyles(legacy),
        captureInfoButtonStyles(headless),
        example.popoverSize ?? (example.size === 'large' ? 'medium' : 'small'),
      );
      expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
      expect(headless.surface).toBeInstanceOf(HTMLDivElement);
      expect(headless.surface.matches(':popover-open')).toBe(true);
      expect(headless.surface.getBoundingClientRect().height).toBeGreaterThan(0);
      expect(getComputedStyle(headless.surface).getPropertyValue('position-anchor')).not.toBe(
        'auto',
      );
    },
  );
}

test.each([true, false])(
  'reuses defaults-gated CoreAI Popover borders and RTL anchors with defaults %s',
  async (enabled) => {
    const { legacy, headless } = await renderPair(
      infoButtonExamples[0],
      coreaiLightTheme,
      enabled,
      'rtl',
    );
    expect(
      compareInfoButtonStyles(
        captureInfoButtonStyles(legacy),
        captureInfoButtonStyles(headless),
      ).filter((difference) => difference.kind === 'unexpected'),
    ).toEqual([]);
    if (enabled) {
      expect(headless.surface).toHaveAttribute('data-coreai-defaults', '');
      expect(getComputedStyle(headless.surface).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    } else {
      expect(headless.surface).not.toHaveAttribute('data-coreai-defaults');
      expect(getComputedStyle(headless.surface).borderTopColor).toBe('rgba(0, 0, 0, 0)');
    }
  },
);

test('keeps the reused geometry tolerance limited to rotated-arrow dimensions', () => {
  expect(
    compareInfoButtonStyles({ 'arrow.rect.width': '12' }, { 'arrow.rect.width': '12.5' }),
  ).toEqual([]);
  expect(
    compareInfoButtonStyles({ 'arrow.rect.width': '12' }, { 'arrow.rect.width': '12.501' }),
  ).toHaveLength(1);
  expect(
    compareInfoButtonStyles({ 'button.width': '24' }, { 'button.width': '24.01' }),
  ).toHaveLength(1);
  expect(
    compareInfoButtonStyles({ 'surface.padding-top': '12px' }, { 'surface.padding-top': '12.1px' }),
  ).toHaveLength(1);
  expect(
    compareInfoButtonStyles({ 'anchor.cross-offset': '0' }, { 'anchor.cross-offset': '0.01' }),
  ).toHaveLength(1);
});

test.each([
  ['string', 'Editors can update project settings.'],
  ['number', 3],
  ['zero', 0],
] as const)('mirrors primitive %s info into the native surface name', async (_, info) => {
  const ref = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoButton ref={ref} aria-label="About project access" info={info} />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'About project access' });
  expect(ref.current).toBe(trigger.element());
  expect(trigger.element()).toHaveClass(infoButtonClassNames.root);
  expect(trigger.element()).toHaveAttribute('type', 'button');
  await trigger.click();
  const note = screen.getByRole('note', { name: String(info) });
  await expect.element(note).toBeVisible();
  await expect.element(note).toHaveFocus();
  const surface = note.element();
  expect(note.element()).toHaveAttribute('aria-label', String(info));
  expect(note.element()).toHaveClass(infoButtonClassNames.info, 'fui-PopoverSurface');
  expect(note.element().matches(':popover-open')).toBe(true);
  expect(trigger.element()).toHaveAttribute('aria-details', note.element().id);
  // Native above/below-start aligns to the trigger edge without the old narrow-arrow shift.
  expect(note.element().getBoundingClientRect().left).toBe(
    trigger.element().getBoundingClientRect().left,
  );
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
});

test('preserves aria-labelledby, rich slot naming, custom content, refs, classes, and callbacks', async () => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const surfaceRef = React.createRef<HTMLDialogElement>();
  const clicks = vi.fn();
  const opened = vi.fn();
  const surfaceProps = {
    as: 'dialog' as const,
    ref: surfaceRef,
    className: 'caller-info',
    'aria-label': 'Caller-rich information',
    'data-caller-info': '',
    children: (
      <>
        <strong>Project access</strong>
        <button type="button" onClick={clicks}>
          Review access
        </button>
      </>
    ),
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <span id="caller-name">About permissions</span>
      <InfoButton
        ref={buttonRef}
        aria-labelledby="caller-name"
        className="caller-button"
        data-caller-button=""
        info={surfaceProps}
        popover={{ id: 'caller-popup-id', onOpenChange: opened }}
      >
        <span data-custom-glyph="" aria-hidden>
          ?
        </span>
      </InfoButton>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'About permissions' });
  expect(buttonRef.current).toBe(trigger.element());
  expect(buttonRef.current).toHaveClass(infoButtonClassNames.root, 'caller-button');
  expect(buttonRef.current?.querySelector('[data-custom-glyph]')?.textContent).toBe('?');
  expect(buttonRef.current).toHaveAttribute('data-caller-button', '');
  await trigger.click();
  const note = screen.getByRole('note', { name: 'Caller-rich information' });
  await expect.element(note).toBeVisible();
  expect(surfaceRef.current).toBe(note.element());
  expect(surfaceRef.current).toHaveClass(infoButtonClassNames.info, 'caller-info');
  expect(surfaceRef.current).toHaveAttribute('data-caller-info', '');
  expect(surfaceRef.current?.id).toBe('caller-popup-id');
  expect(opened.mock.calls.at(-1)?.[1].open).toBe(true);
  await screen.getByRole('button', { name: 'Review access' }).click();
  expect(clicks).toHaveBeenCalledTimes(1);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surfaceRef.current).toBeNull();
  expect(opened.mock.calls.at(-1)?.[1].open).toBe(false);
});

test.each([
  ['current primitive', PrimitiveInfoButton],
  ['ported wrapper', InfoButton],
] as const)(
  'records the pinned %s root-render-function boundary without a shim',
  async (_, Component) => {
    const renderButton: SlotRenderFunction<ExtractSlotProps<PrimitiveInfoButtonSlots['root']>> = (
      Root,
      props,
    ) => <Root {...props}>?</Root>;
    await expect(async () => {
      await render(
        <CoreAIFluentProvider>
          <Component aria-label="Root render information" info="Root render content.">
            {renderButton}
          </Component>
        </CoreAIFluentProvider>,
      );
    }).rejects.toThrow(
      "A trigger element must be a single element for this component. Please ensure that you're not using React Fragments.",
    );
  },
);

test('retains native div surface selection and a caller surface render function', async () => {
  const ref = React.createRef<HTMLDivElement>();
  type DivInfoProps = Extract<ExtractSlotProps<InfoButtonSlots['info']>, { as: 'div' }>;
  const renderInfo: SlotRenderFunction<DivInfoProps> = (Component, props) => (
    <Component {...props} as="div" data-rendered-info="">
      Native div content
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoButton
        aria-label="About native div help"
        info={{
          as: 'div',
          ref,
          'aria-label': 'Native div help',
          children: renderInfo,
        }}
      />
    </CoreAIFluentProvider>,
  );
  await screen.getByRole('button', { name: 'About native div help' }).click();
  const note = screen.getByRole('note', { name: 'Native div help' });
  await expect.element(note).toBeVisible();
  expect(ref.current).toBe(note.element());
  expect(note.element()).toBeInstanceOf(HTMLDivElement);
  expect(note.element()).toHaveAttribute('data-rendered-info', '');
  expect(note.element().matches(':popover-open')).toBe(true);
});

test('opens native help, focuses its note, supports inner actions, and dismisses on trusted outside click', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoButtonHelpFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'About project access' });
  await trigger.click();
  const note = screen.getByRole('note', { name: 'Project access details' });
  await expect.element(note).toHaveFocus();
  const surface = note.element();
  await screen.getByRole('button', { name: 'Review project access' }).click();
  expect(
    screen.getByRole('status', { name: 'Information action count' }).element().textContent,
  ).toBe('1');
  await screen.getByRole('button', { name: 'Outside project information' }).click();
  await expect.poll(() => surface.isConnected).toBe(false);
  expect(trigger.element()).not.toHaveAttribute('data-open');
  expect(
    screen.getByRole('button', { name: 'Outside project information' }).element(),
  ).toHaveFocus();
});

test('keeps controlled native open/dismiss callbacks and caller refs intact', async () => {
  const onOpenChange = vi.fn();
  function Controlled() {
    const [open, setOpen] = React.useState(false);
    return (
      <InfoButton
        aria-label="Controlled information"
        info="Controlled project information."
        popover={{
          open,
          onOpenChange: (event, data) => {
            setOpen(data.open);
            onOpenChange(event, data);
          },
        }}
      />
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <Controlled />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Controlled information' });
  await trigger.click();
  const note = screen.getByRole('note', { name: 'Controlled project information.' });
  await expect.element(note).toBeVisible();
  const surface = note.element();
  expect(onOpenChange.mock.calls.at(-1)?.[1].open).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  expect(onOpenChange.mock.calls.at(-1)?.[1].open).toBe(false);
});

test('matches actual hover colors and glyph visibility without pointer/focus contamination', async () => {
  const { legacy, headless } = await renderPair(infoButtonExamples[0]);
  await userEvent.hover(legacy.button);
  expect(legacy.button.matches(':hover')).toBe(true);
  await settleInfoButtonStyles(legacy);
  const before = captureInfoButtonStyles(legacy);
  await userEvent.hover(headless.button);
  expect(headless.button.matches(':hover')).toBe(true);
  expect(legacy.button.matches(':hover')).toBe(false);
  await settleInfoButtonStyles(headless);
  expect(
    compareInfoButtonStyles(before, captureInfoButtonStyles(headless)).filter(
      (difference) => difference.kind === 'unexpected',
    ),
  ).toEqual([]);
});

test('uses native keyboard-focus styling with the same bounded outline geometry', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <span data-testid="focus-rest">Rest pointer here</span>
      <button type="button">Before information buttons</button>
      <LegacyInfoButton aria-label="Legacy focus" info="Legacy information." />
      <InfoButton aria-label="Native focus" info="Native information." />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('focus-rest'));
  await screen.getByRole('button', { name: 'Before information buttons' }).click();
  await userEvent.tab();
  const legacy = screen.getByRole('button', { name: 'Legacy focus' }).element();
  expect(legacy).toHaveFocus();
  expect(legacy.matches(':hover')).toBe(false);
  const outline = (element: Element) => {
    const computed = getComputedStyle(element, '::after');
    return Object.fromEntries(
      [
        'content',
        'border-top-color',
        'border-top-width',
        'border-top-style',
        'border-radius',
        'top',
        'right',
        'bottom',
        'left',
      ].map((property) => [property, computed.getPropertyValue(property)]),
    );
  };
  const legacyOutline = outline(legacy);
  await userEvent.tab();
  const headless = screen.getByRole('button', { name: 'Native focus' }).element();
  expect(headless).toHaveFocus();
  expect(headless.matches(':focus-visible')).toBe(true);
  expect(headless.matches(':hover')).toBe(false);
  expect(outline(headless)).toEqual(legacyOutline);
  expect(getComputedStyle(headless, '::after').borderTopWidth).toBe('2px');
});

test('inertTrapFocus switches the surface to a native modal dialog with focus containment, Escape, and trigger restoration', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoButton
        aria-label="Modal information"
        popover={{ inertTrapFocus: true }}
        info={{
          'aria-label': 'Modal project information',
          children: (
            <>
              Project access details.
              <button type="button">Modal action</button>
            </>
          ),
        }}
      />
      <button type="button">Outside modal information</button>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Modal information', exact: true });
  const outside = screen.getByRole('button', { name: 'Outside modal information' }).element();
  await trigger.click();
  const modal = screen.getByRole('dialog', { name: 'Modal project information' });
  await expect.element(modal).toHaveFocus();
  const surface = modal.element();
  expect(surface).toBeInstanceOf(HTMLDialogElement);
  expect(surface.matches(':modal')).toBe(true);
  expect(surface).toHaveAttribute('open');
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Modal action' }).element()).toHaveFocus();
  await userEvent.tab();
  expect(outside).not.toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

test('does not replace caller null/false/undefined glyph children with a default icon', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InfoButton aria-label="Null glyph" info="Null content" children={null} />
      <InfoButton aria-label="False glyph" info="False content" children={false} />
      <InfoButton aria-label="Undefined glyph" info="Undefined content" children={undefined} />
      <InfoButton aria-label="Default glyph" info="Default content" />
    </CoreAIFluentProvider>,
  );
  for (const name of ['Null glyph', 'False glyph', 'Undefined glyph']) {
    expect(screen.getByRole('button', { name }).element().querySelector('svg')).toBeNull();
  }
  expect(
    screen.getByRole('button', { name: 'Default glyph' }).element().querySelectorAll('svg'),
  ).toHaveLength(2);
});

test('retains derived specificity when Button, Label, and InfoLabel foundations are imported together', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <span data-testid="rest">Rest pointer here</span>
      <Button as="button">Completed Button</Button>
      <InfoLabel size="large" info="Large label information." required>
        Large label
      </InfoLabel>
      <InfoButton size="large" aria-label="Large standalone" info="Large standalone information." />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('rest'));
  const internal = screen.getByRole('button', { name: 'Large label information' }).element();
  expect(getComputedStyle(internal).marginTop).toBe('-1px');
  expect(getComputedStyle(internal).paddingTop).toBe(coreaiLightTheme.spacingVerticalXXS);
  const standalone = screen.getByRole('button', { name: 'Large standalone' }).element();
  expect(getComputedStyle(standalone).marginTop).toBe('0px');
  expect(getComputedStyle(standalone).paddingTop).toBe(coreaiLightTheme.spacingVerticalXXS);
});

test('supports unlayered consumer overrides on both button and reused native surface', async () => {
  const { headless } = await renderPair(infoButtonConsumerExample);
  expect(getComputedStyle(headless.button).borderRadius).toBe('9px');
  expect(getComputedStyle(headless.button).paddingTop).toBe('7px');
  expect(getComputedStyle(headless.surface).paddingTop).toBe('19px');
  expect(getComputedStyle(headless.surface).fontSize).toBe('15px');
  expect(getComputedStyle(headless.surface).lineHeight).toBe('21px');
});
