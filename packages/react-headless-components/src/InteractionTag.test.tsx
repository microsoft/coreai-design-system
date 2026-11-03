// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/interaction-tag';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  InteractionTagComparison,
  interactionTagConsumerExample,
  interactionTagExamples,
  type InteractionTagExample,
} from '../../../apps/storybook/src/stories/experiments/InteractionTagComparison.js';
import {
  captureInteractionTagStyles,
  compareInteractionTagStyles,
} from '../../../apps/storybook/src/stories/experiments/compareInteractionTagStyles.js';
import {
  getComparisonTag,
  requireTagHTML,
  settleTagStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTagStyles.js';
import { tagTextRenderer } from '../../../apps/storybook/src/stories/experiments/TagComparison.js';
import { Avatar, avatarClassNames } from './Avatar.js';
import { presenceBadgeClassNames } from './PresenceBadge.js';
import { TagGroup } from './TagGroup.js';
import {
  InteractionTag,
  interactionTagClassNames,
  useInteractionTagContextValues,
  type InteractionTagProps,
} from './InteractionTag.js';
import {
  InteractionTagPrimary,
  interactionTagPrimaryClassNames,
  useInteractionTagPrimaryContextValues,
  type InteractionTagPrimaryProps,
} from './InteractionTagPrimary.js';
import {
  InteractionTagSecondary,
  interactionTagSecondaryClassNames,
  type InteractionTagSecondaryProps,
  type InteractionTagSecondarySlots,
} from './InteractionTagSecondary.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: InteractionTagExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <>
      <button type="button" data-testid="interaction-pointer-rest">
        Pointer rest
      </button>
      <InteractionTagComparison example={example} />
    </>,
    { providerProps: { theme, withComponentDefaults: defaults, dir } },
  );
  await userEvent.hover(screen.getByTestId('interaction-pointer-rest'));
  const legacy = getComparisonTag(screen.container, 'legacy');
  const headless = getComparisonTag(screen.container, 'headless');
  await settleTagStyles(legacy, headless);
  return { screen, legacy, headless };
}

test('captures hidden bundled glyph visibility and zero dimensions without inventing root-relative offsets', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Hidden bundled glyph',
    props: { appearance: 'outline' },
    bundledIcon: true,
    secondary: true,
  });
  const oldStyles = captureInteractionTagStyles(legacy);
  const newStyles = captureInteractionTagStyles(headless);
  expect(newStyles['glyph.0.display']).toBe('none');
  expect(newStyles['glyph.0.has-layout-box']).toBe('false');
  expect(newStyles['glyph.0.rect.width']).toBe('0');
  expect(newStyles['glyph.0.rect.height']).toBe('0');
  expect(newStyles['glyph.0.offset.left']).toBeUndefined();
  expect(newStyles['glyph.0.offset.top']).toBeUndefined();
  expect(newStyles['glyph.1.has-layout-box']).toBe('true');
  expect(newStyles['glyph.1.offset.left']).toBeDefined();
  expect(compareInteractionTagStyles(oldStyles, newStyles)).toEqual([]);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(interactionTagExamples)(
    `matches $name root/action/media/text/glyph geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareInteractionTagStyles(
          captureInteractionTagStyles(legacy),
          captureInteractionTagStyles(headless),
        ),
      ).toEqual([]);
      expect(headless).toHaveClass(interactionTagClassNames.root);
      const primary = requireTagHTML(headless.querySelector('[data-tag-part="primary"]'));
      expect(primary).toHaveClass(interactionTagPrimaryClassNames.root);
      expect(primary).toHaveAttribute('data-size', example.props?.size ?? 'medium');
      expect(primary).toHaveAttribute('data-shape', example.props?.shape ?? 'rounded');
      expect(primary.getAttribute('appearance')).toBeNull();
      if (example.secondary)
        expect(headless.querySelector('[data-tag-part="secondary"]')).toHaveClass(
          interactionTagSecondaryClassNames.root,
        );
    },
  );

  test.each([true, false])(
    `restores actual CoreAI text/divider overrides only when enabled in ${mode}, defaults=%s`,
    async (enabled) => {
      const { legacy, headless } = await renderPair(
        { name: 'Defaults', secondary: true },
        theme,
        enabled,
      );
      expect(
        compareInteractionTagStyles(
          captureInteractionTagStyles(legacy),
          captureInteractionTagStyles(headless),
        ),
      ).toEqual([]);
      const primaryText = requireTagHTML(headless.querySelector('[data-tag-part="primaryText"]'));
      const secondary = requireTagHTML(headless.querySelector('[data-tag-part="secondary"]'));
      expect(getComputedStyle(primaryText).paddingBottom).toBe(enabled ? '0px' : '2px');
      expect(getComputedStyle(secondary).borderInlineStartStyle).toBe(enabled ? 'none' : 'solid');
      expect(getComputedStyle(secondary).marginInlineStart).toBe(enabled ? '1px' : '0px');
      expect(getComputedStyle(secondary).borderTopWidth).toBe('0px');
    },
  );

  test(`keeps the outline secondary divider with CoreAI defaults and logical RTL radii/spacing in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'RTL outline',
        props: { appearance: 'outline', shape: 'circular', size: 'small' },
        secondary: true,
        media: true,
      },
      theme,
      true,
      'rtl',
    );
    expect(
      compareInteractionTagStyles(
        captureInteractionTagStyles(legacy),
        captureInteractionTagStyles(headless),
      ),
    ).toEqual([]);
    const primary = requireTagHTML(headless.querySelector('[data-tag-part="primary"]'));
    const secondary = requireTagHTML(headless.querySelector('[data-tag-part="secondary"]'));
    expect(getComputedStyle(primary).borderTopLeftRadius).toBe('0px');
    expect(getComputedStyle(secondary).borderRightStyle).toBe('solid');
    expect(getComputedStyle(secondary).marginRight).toBe('0px');
  });

  test(`lets ordinary consumer CSS override action/text/icon/divider styles in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(interactionTagConsumerExample, theme);
    const primary = requireTagHTML(headless.querySelector('[data-tag-part="primary"]'));
    const text = requireTagHTML(headless.querySelector('[data-tag-part="primaryText"]'));
    const secondary = requireTagHTML(headless.querySelector('[data-tag-part="secondary"]'));
    expect(getComputedStyle(primary).minWidth).toBe('180px');
    expect(getComputedStyle(primary).borderRadius).toBe('3px');
    expect(getComputedStyle(text).paddingBottom).toBe('4px');
    expect(getComputedStyle(secondary).borderInlineStartWidth).toBe('3px');
    expect(getComputedStyle(secondary).marginInlineStart).toBe('4px');
    expect(
      compareInteractionTagStyles(
        captureInteractionTagStyles(legacy),
        captureInteractionTagStyles(headless),
        true,
      ).filter((difference) => difference.kind === 'unexpected'),
    ).toEqual([]);
  });
}

for (const appearance of ['filled', 'outline', 'brand'] as const) {
  for (const disabled of [false, true]) {
    test(`retains primary/secondary hover priority for ${appearance}, disabled=${disabled}`, async () => {
      const { legacy, headless } = await renderPair({
        name: 'Hover priorities',
        props: { appearance, disabled, selected: true },
        secondary: true,
        icon: true,
      });
      for (const part of ['primary', 'secondary']) {
        const oldPart = requireTagHTML(legacy.querySelector(`[data-tag-part="${part}"]`));
        const newPart = requireTagHTML(headless.querySelector(`[data-tag-part="${part}"]`));
        await userEvent.hover(oldPart);
        await settleTagStyles(legacy);
        expect(oldPart.matches(':hover')).toBe(true);
        const oldStyles = captureInteractionTagStyles(legacy);
        await userEvent.hover(newPart);
        await settleTagStyles(headless);
        expect(newPart.matches(':hover')).toBe(true);
        expect(
          compareInteractionTagStyles(oldStyles, captureInteractionTagStyles(headless)),
        ).toEqual([]);
      }
    });
  }
}

test('preserves the actual outline bundled-icon hover selection without styling unrelated caller glyphs', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Bundled hover',
    props: { appearance: 'outline' },
    secondary: true,
    bundledIcon: true,
  });
  const oldPrimary = requireTagHTML(legacy.querySelector('[data-tag-part="primary"]'));
  const newPrimary = requireTagHTML(headless.querySelector('[data-tag-part="primary"]'));
  await userEvent.hover(oldPrimary);
  await settleTagStyles(legacy);
  const oldStyles = captureInteractionTagStyles(legacy);
  await userEvent.hover(newPrimary);
  await settleTagStyles(headless);
  expect(compareInteractionTagStyles(oldStyles, captureInteractionTagStyles(headless))).toEqual([]);
  const filled = headless.querySelector('.fui-Icon-filled');
  const regular = headless.querySelector('.fui-Icon-regular');
  if (!filled || !regular) throw new Error('Missing fixture bundle');
  // The flex icon slot blockifies its visible SVG in computed style.
  expect(getComputedStyle(filled).display).toBe('block');
  expect(getComputedStyle(filled).display).toBe(oldStyles['glyph.0.display']);
  expect(getComputedStyle(regular).display).toBe('none');
});

for (const appearance of ['filled', 'outline', 'brand'] as const) {
  for (const selected of [false, true]) {
    test(`matches native keyboard-pressed primary and secondary actions: ${appearance}, selected=${selected}`, async () => {
      const { screen, legacy, headless } = await renderPair({
        name: 'Keyboard press',
        props: { appearance, selected },
        secondary: true,
        icon: true,
      });
      await userEvent.hover(screen.getByTestId('interaction-pointer-rest'));
      requireTagHTML(screen.getByTestId('interaction-pointer-rest').element()).focus();
      await userEvent.tab();
      for (const part of ['primary', 'secondary']) {
        const oldPart = requireTagHTML(legacy.querySelector(`[data-tag-part="${part}"]`));
        const newPart = requireTagHTML(headless.querySelector(`[data-tag-part="${part}"]`));
        oldPart.focus();
        await userEvent.keyboard('[Space>]');
        await settleTagStyles(legacy);
        expect(oldPart.matches(':active')).toBe(true);
        const oldStyles = captureInteractionTagStyles(legacy);
        await userEvent.keyboard('[/Space]');
        newPart.focus();
        await userEvent.keyboard('[Space>]');
        try {
          await settleTagStyles(headless);
          expect(newPart.matches(':active')).toBe(true);
          expect(
            compareInteractionTagStyles(oldStyles, captureInteractionTagStyles(headless)),
          ).toEqual([]);
        } finally {
          await userEvent.keyboard('[/Space]');
        }
      }
    });
  }
}

test('uses native keyboard-focus outlines on both actions without a legacy focus selector', async () => {
  const { screen, legacy, headless } = await renderPair({
    name: 'Keyboard focus',
    props: { shape: 'circular' },
    secondary: true,
  });
  await userEvent.hover(screen.getByTestId('interaction-pointer-rest'));
  requireTagHTML(screen.getByTestId('interaction-pointer-rest').element()).focus();
  await userEvent.tab();
  for (const part of ['primary', 'secondary']) {
    const oldPart = requireTagHTML(legacy.querySelector(`[data-tag-part="${part}"]`));
    const newPart = requireTagHTML(headless.querySelector(`[data-tag-part="${part}"]`));
    oldPart.focus();
    await settleTagStyles(legacy);
    const oldComputed = getComputedStyle(oldPart);
    const oldOutline = [
      oldComputed.outlineStyle,
      oldComputed.outlineWidth,
      oldComputed.outlineColor,
    ];
    newPart.focus();
    await settleTagStyles(headless);
    expect(newPart.matches(':focus-visible')).toBe(true);
    const computed = getComputedStyle(newPart);
    expect([computed.outlineStyle, computed.outlineWidth, computed.outlineColor]).toEqual(
      oldOutline,
    );
  }
});

test('preserves current public part types/helpers, refs, slot render functions and completed Avatar/presence context', async () => {
  expectTypeOf(InteractionTag).toMatchTypeOf<ForwardRefComponent<InteractionTagProps>>();
  expectTypeOf(InteractionTagPrimary).toMatchTypeOf<
    ForwardRefComponent<InteractionTagPrimaryProps>
  >();
  expectTypeOf(InteractionTagSecondary).toMatchTypeOf<
    ForwardRefComponent<InteractionTagSecondaryProps>
  >();
  expectTypeOf<NonNullable<InteractionTagPrimaryProps['as']>>().toEqualTypeOf<'button'>();
  expectTypeOf<NonNullable<InteractionTagSecondaryProps['as']>>().toEqualTypeOf<'button'>();
  expect(useInteractionTagContextValues).toBe(primitive.useInteractionTagContextValues);
  expect(useInteractionTagPrimaryContextValues).toBe(
    primitive.useInteractionTagPrimaryContextValues,
  );
  const rootRef = React.createRef<HTMLDivElement>();
  const primaryRef = React.createRef<HTMLButtonElement>();
  const secondaryRef = React.createRef<HTMLButtonElement>();
  const textRef = React.createRef<HTMLSpanElement>();
  const mediaRef = React.createRef<HTMLSpanElement>();
  const renderSecondary: SlotRenderFunction<
    ExtractSlotProps<InteractionTagSecondarySlots['root']>
  > = (Component, props) => <Component {...props} data-caller-secondary />;
  const screen = await renderCoreAIComponent(
    <InteractionTag
      ref={rootRef}
      size="small"
      shape="circular"
      className="caller-interaction"
      data-consumer="root"
    >
      <InteractionTagPrimary
        ref={primaryRef}
        type="button"
        hasSecondaryAction
        className="caller-primary"
        aria-label="Open Project Atlas"
        primaryText={{ ref: textRef, children: tagTextRenderer, className: 'caller-text' }}
        media={{
          ref: mediaRef,
          className: 'caller-media',
          children: <Avatar name="Katri Athokas" badge={{ status: 'busy' }} />,
        }}
      >
        Project Atlas
      </InteractionTagPrimary>
      <InteractionTagSecondary ref={secondaryRef} className="caller-secondary" aria-label="remove">
        {renderSecondary}
      </InteractionTagSecondary>
    </InteractionTag>,
  );
  expect(rootRef.current).toHaveClass(interactionTagClassNames.root, 'caller-interaction');
  expect(rootRef.current).toHaveAttribute('data-consumer', 'root');
  expect(primaryRef.current).toBe(
    screen.getByRole('button', { name: 'Open Project Atlas', exact: true }).element(),
  );
  expect(primaryRef.current).toHaveClass(interactionTagPrimaryClassNames.root, 'caller-primary');
  expect(textRef.current).toHaveClass(interactionTagPrimaryClassNames.primaryText, 'caller-text');
  expect(textRef.current).toHaveAttribute('data-tag-rendered-text');
  expect(textRef.current?.textContent).toBe('Project Atlas');
  expect(mediaRef.current).toHaveClass(interactionTagPrimaryClassNames.media, 'caller-media');
  const avatar = requireTagHTML(
    mediaRef.current?.querySelector(`.${avatarClassNames.root}`) ?? null,
  );
  expect(avatar).toHaveAttribute('data-size', '20');
  expect(avatar).toHaveAttribute('data-shape', 'circular');
  expect(avatar.querySelector(`.${presenceBadgeClassNames.root}`)).not.toBeNull();
  expect(secondaryRef.current).toHaveClass(
    interactionTagSecondaryClassNames.root,
    'caller-secondary',
  );
  expect(secondaryRef.current).toHaveAttribute('data-caller-secondary');
  expect(secondaryRef.current?.getAttribute('aria-labelledby')).toBe(
    `${primaryRef.current?.id} ${secondaryRef.current?.id}`,
  );
  expect(secondaryRef.current?.querySelectorAll('svg').length).toBe(1);
});

test('keeps primary, secondary and bubbling callbacks distinct, including Delete only on the secondary action', async () => {
  const trace: string[] = [];
  const screen = await renderCoreAIComponent(
    <TagGroup onDismiss={(event, data) => trace.push(`dismiss:${data.value}:${event.type}`)}>
      <InteractionTag value="atlas" onClick={() => trace.push('root')}>
        <InteractionTagPrimary
          type="button"
          hasSecondaryAction
          onClick={() => trace.push('primary')}
        >
          Project Atlas
        </InteractionTagPrimary>
        <InteractionTagSecondary
          aria-label="Remove atlas"
          aria-labelledby={undefined}
          onClick={() => trace.push('secondary')}
          onKeyDown={() => trace.push('secondary-key')}
        />
      </InteractionTag>
    </TagGroup>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Project Atlas', exact: true }));
  await userEvent.keyboard('{Delete}{Backspace}');
  expect(trace).toEqual(['primary', 'root']);
  await userEvent.click(screen.getByRole('button', { name: 'Remove atlas', exact: true }));
  expect(trace).toEqual(['primary', 'root', 'secondary', 'dismiss:atlas:click', 'root']);
  await userEvent.keyboard('{Delete}{Backspace}');
  expect(trace.slice(5)).toEqual([
    'secondary-key',
    'dismiss:atlas:keydown',
    'secondary-key',
    'dismiss:atlas:keydown',
  ]);
});

test('retains secondary preventDefault for click and keyboard while preserving native bubbling', async () => {
  const dismiss = vi.fn();
  const bubbles: boolean[] = [];
  const screen = await renderCoreAIComponent(
    <TagGroup onDismiss={dismiss}>
      <InteractionTag value="keep" onClick={(event) => bubbles.push(event.defaultPrevented)}>
        <InteractionTagPrimary type="button" hasSecondaryAction>
          Keep
        </InteractionTagPrimary>
        <InteractionTagSecondary
          aria-label="Veto removal"
          aria-labelledby={undefined}
          onClick={(event) => event.preventDefault()}
          onKeyDown={(event) => event.preventDefault()}
        />
      </InteractionTag>
    </TagGroup>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Veto removal', exact: true }));
  await userEvent.keyboard('{Delete}{Backspace}');
  expect(dismiss).not.toHaveBeenCalled();
  expect(bubbles).toEqual([true]);
});

test('preserves current explicit primary onClick precedence instead of normalizing group selection callbacks', async () => {
  const select = vi.fn();
  const primary = vi.fn();
  const screen = await renderCoreAIComponent(
    <TagGroup selectedValues={[]} onTagSelect={select}>
      <InteractionTag value="atlas">
        <InteractionTagPrimary type="button" onClick={primary}>
          Project Atlas
        </InteractionTagPrimary>
      </InteractionTag>
    </TagGroup>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Project Atlas', exact: true }));
  expect(primary).toHaveBeenCalledTimes(1);
  expect(select).not.toHaveBeenCalled();
});

test('blocks disabled native actions and retains caller secondary content/labels without default-glyph duplication', async () => {
  const click = vi.fn();
  const dismiss = vi.fn();
  const screen = await renderCoreAIComponent(
    <TagGroup onDismiss={dismiss}>
      <InteractionTag disabled>
        <InteractionTagPrimary type="button" hasSecondaryAction onClick={click}>
          Disabled action
        </InteractionTagPrimary>
        <InteractionTagSecondary
          aria-label="Remove disabled"
          aria-labelledby={undefined}
          onClick={click}
        />
      </InteractionTag>
      <InteractionTag>
        <InteractionTagPrimary id="custom-tag-primary" type="button" hasSecondaryAction>
          Custom label
        </InteractionTagPrimary>
        <InteractionTagSecondary
          id="custom-tag-secondary"
          aria-label="Close"
          aria-labelledby="custom-tag-primary custom-tag-secondary"
        >
          <span data-testid="secondary-text">Close</span>
        </InteractionTagSecondary>
      </InteractionTag>
    </TagGroup>,
  );
  const primary = screen.getByRole('button', { name: 'Disabled action', exact: true });
  const secondary = screen.getByRole('button', { name: 'Remove disabled', exact: true });
  await expect.element(primary).toBeDisabled();
  await expect.element(secondary).toBeDisabled();
  for (const locator of [primary, secondary]) {
    const disabledButton = locator.element();
    if (!(disabledButton instanceof HTMLButtonElement))
      throw new Error('Expected a native action button');
    disabledButton.click();
  }
  expect(click).not.toHaveBeenCalled();
  expect(dismiss).not.toHaveBeenCalled();
  const custom = screen.getByRole('button', { name: 'Custom label Close', exact: true });
  expect(custom.element().querySelector('svg')).toBeNull();
  expect(screen.getByTestId('secondary-text').element().textContent).toBe('Close');
});
