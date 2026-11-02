// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  SkeletonComparison,
  SkeletonLoadingFlow,
  skeletonAnimations,
  skeletonAppearances,
  skeletonConsumerExample,
  skeletonExamples,
  type SkeletonExample,
} from '../../../apps/storybook/src/stories/experiments/SkeletonComparison.js';
import {
  captureSkeletonStyles,
  compareSkeletonStyles,
  getComparisonSkeleton,
  getOwnedSkeletonAnimations,
  getSkeletonElements,
  settleSkeletonStyles,
} from '../../../apps/storybook/src/stories/experiments/compareSkeletonStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/SkeletonComparison.module.css';
import {
  Skeleton,
  skeletonClassNames,
  type SkeletonProps,
  type SkeletonSlots,
} from './Skeleton.js';
import {
  SkeletonItem,
  skeletonItemClassNames,
  type SkeletonItemProps,
  type SkeletonItemSize,
  type SkeletonItemSlots,
} from './SkeletonItem.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SkeletonExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<SkeletonComparison examples={[example]} />, {
    providerProps: { theme, dir },
  });
  const legacy = getComparisonSkeleton(screen.container, 'legacy');
  const headless = getComparisonSkeleton(screen.container, 'headless');
  await Promise.all([settleSkeletonStyles(legacy), settleSkeletonStyles(headless)]);
  return { screen, legacy, headless };
}

function expectVisuals(
  item: HTMLElement,
  { animation = 'wave', appearance = 'opaque', size = 16, shape = 'rectangle' }: SkeletonItemProps,
) {
  expect(item).toHaveAttribute('data-animation', animation);
  expect(item).toHaveAttribute('data-appearance', appearance);
  expect(item).toHaveAttribute('data-size', String(size));
  expect(item).toHaveAttribute('data-shape', shape);
  expect(item.getBoundingClientRect().height).toBe(size);
  if (shape !== 'rectangle') expect(item.getBoundingClientRect().width).toBe(size);
  expect(getComputedStyle(item).borderRadius).toBe(
    shape === 'circle' ? '50%' : shape === 'rectangle' ? '4px' : '0px',
  );
}

test('exposes supported native slots, current public ref types, and non-deprecated visual choices', () => {
  expectTypeOf<SkeletonProps['as']>().toEqualTypeOf<'div' | 'span' | undefined>();
  expectTypeOf<SkeletonItemProps['as']>().toEqualTypeOf<'div' | 'span' | undefined>();
  expectTypeOf<NonNullable<SkeletonItemProps['size']>>().toEqualTypeOf<SkeletonItemSize>();
  expectTypeOf<
    Extract<React.ComponentProps<typeof Skeleton>['ref'], string>
  >().toEqualTypeOf<never>();
  expectTypeOf<
    Extract<React.ComponentProps<typeof SkeletonItem>['ref'], string>
  >().toEqualTypeOf<never>();
  expectTypeOf<'width' extends keyof SkeletonProps ? true : false>().toEqualTypeOf<false>();
});

for (const [mode, theme] of themes) {
  test.each(skeletonExamples)(
    `matches $name root/item dimensions, backgrounds, pseudo-elements, and keyframes in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareSkeletonStyles(captureSkeletonStyles(legacy), captureSkeletonStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveClass(skeletonClassNames.root);
      for (const item of headless.items) {
        expect(item).toHaveClass(skeletonItemClassNames.root);
        for (const prop of ['animation', 'appearance', 'size', 'shape']) {
          expect(item).not.toHaveAttribute(prop);
        }
      }
      for (const prop of ['animation', 'appearance', 'size', 'shape']) {
        expect(headless.root).not.toHaveAttribute(prop);
      }
      const inherited = example.props;
      const first = example.items?.[0];
      expectVisuals(headless.items[0], {
        animation: first?.animation ?? inherited?.animation ?? 'wave',
        appearance: first?.appearance ?? inherited?.appearance ?? 'opaque',
        size: first?.size ?? inherited?.size ?? 16,
        shape: first?.shape ?? inherited?.shape ?? 'rectangle',
      });
    },
  );

  test(`allows unlayered consumer CSS to override root, item, and pseudo-element styles in ${mode}`, async () => {
    const { headless } = await renderPair(skeletonConsumerExample, theme);
    const values = captureSkeletonStyles(headless);
    expect(values['group[0].display']).toBe('grid');
    expect(values['group[0].gap']).toBe('6px');
    expect(values['group[0].padding']).toBe('5px');
    expect(values['item[0].width']).toBe('68.00');
    expect(values['item[0].height']).toBe('26.00');
    expect(values['item[0].border-radius']).toBe('3px');
    expect(values['item[0].overflow']).toBe('visible');
    if (!matchMedia('(forced-colors: active)').matches) {
      expect(values['item[0].background-color']).toBe('rgb(20, 80, 120)');
      expect(values['item[0]::after.background-image']).toBe(
        'linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(40, 110, 60), rgba(0, 0, 0, 0))',
      );
    }
    expect(values['item[0]::after.animation-duration']).toBe('2.4s');
    expect(values['item[0]::after.animation-timing-function']).toBe('linear');
  });
}

for (const dir of ['ltr', 'rtl'] as const) {
  for (const animation of skeletonAnimations) {
    test.each(skeletonAppearances)(
      `retains ${animation} duration, easing, keyframes, and wave direction for %s in ${dir}`,
      async (appearance) => {
        const { legacy, headless } = await renderPair(
          { name: 'Animation contract', props: { animation, appearance, size: 28 } },
          coreaiLightTheme,
          dir,
        );
        const values = captureSkeletonStyles(headless);
        expect(compareSkeletonStyles(captureSkeletonStyles(legacy), values)).toEqual([]);
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const forcedColors = matchMedia('(forced-colors: active)').matches;
        expect(values['item[0]::after.animation-duration']).toBe(
          reducedMotion ? '1e-05s' : animation === 'wave' ? '3s' : '1s',
        );
        expect(values['item[0]::after.animation-timing-function']).toBe('ease-in-out');
        expect(values['item[0]::after.animation-iteration-count']).toBe(
          reducedMotion ? '1' : 'infinite',
        );
        if (!reducedMotion) {
          const animations = getOwnedSkeletonAnimations(headless);
          expect(animations).toHaveLength(1);
          const effect = animations[0].effect;
          if (!(effect instanceof KeyframeEffect)) throw new Error('Missing item keyframes');
          const frames = effect.getKeyframes();
          expect(effect.getTiming().duration).toBe(animation === 'wave' ? 3000 : 1000);
          // CSS timing applies to keyframe segments; the enclosing effect remains linear.
          expect(effect.getTiming().easing).toBe('linear');
          expect(effect.getTiming().iterations).toBe(Infinity);
          for (const frame of frames.slice(0, -1)) expect(frame.easing).toBe('ease-in-out');
          if (animation === 'wave') {
            expect(frames.map((frame) => frame.computedOffset)).toEqual([0, 1]);
            expect(frames[1].transform).toBe(
              dir === 'rtl' ? 'translate(-100%)' : 'translate(100%)',
            );
            const matrix = new DOMMatrix(values['item[0]::after.transform']);
            expect(matrix.m41).toBe(
              headless.items[0].getBoundingClientRect().width * (dir === 'rtl' ? 1 : -1),
            );
            if (!forcedColors) {
              expect(values['item[0]::after.background-image']).toContain(
                dir === 'rtl' ? 'to left' : 'to right',
              );
            }
          } else {
            expect(frames.map((frame) => [frame.computedOffset, frame.opacity])).toEqual([
              [0, '1'],
              [0.5, '0.4'],
              [1, '1'],
            ]);
          }
        }
        if (animation === 'pulse' && !forcedColors) {
          expect(values['item[0].background-color']).toBe('rgba(0, 0, 0, 0)');
        }
      },
    );
  }
}

test.each([
  { name: 'omitted', props: {} },
  {
    name: 'explicitly undefined',
    props: { animation: undefined, appearance: undefined, size: undefined, shape: undefined },
  },
] satisfies { name: string; props: SkeletonItemProps }[])(
  'inherits all four visual choices for $name item props',
  async ({ props }) => {
    const rootRef = React.createRef<HTMLDivElement>();
    await renderCoreAIComponent(
      <Skeleton ref={rootRef} animation="pulse" appearance="translucent" size={40} shape="circle">
        <SkeletonItem {...props} />
      </Skeleton>,
    );
    if (!rootRef.current) throw new Error('Missing inherited Skeleton');
    expectVisuals(getSkeletonElements(rootRef.current).items[0], {
      animation: 'pulse',
      appearance: 'translucent',
      size: 40,
      shape: 'circle',
    });
  },
);

test('updates inherited choices while preserving explicit item overrides and nested size/shape scopes', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const tree = (props: SkeletonProps) => (
    <Skeleton ref={rootRef} {...props}>
      <SkeletonItem />
      <SkeletonItem animation="wave" appearance="opaque" size={22} shape="square" />
      <SkeletonItem
        animation={undefined}
        appearance={undefined}
        size={undefined}
        shape={undefined}
      />
      <Skeleton>
        <SkeletonItem />
      </Skeleton>
    </Skeleton>
  );
  const screen = await renderCoreAIComponent(
    tree({ animation: 'pulse', appearance: 'translucent', size: 64, shape: 'circle' }),
  );
  if (!rootRef.current) throw new Error('Missing contextual Skeleton');
  const root = rootRef.current;
  const first = getSkeletonElements(root);
  for (const index of [0, 2]) {
    expectVisuals(first.items[index], {
      animation: 'pulse',
      appearance: 'translucent',
      size: 64,
      shape: 'circle',
    });
  }
  expectVisuals(first.items[1], { size: 22, shape: 'square' });
  expectVisuals(first.items[3], { animation: 'pulse', appearance: 'translucent' });
  expect(first.groups[1]).not.toHaveAttribute('data-size');
  expect(first.groups[1]).not.toHaveAttribute('data-shape');

  await screen.rerender(
    tree({ animation: 'wave', appearance: 'opaque', size: 36, shape: 'square' }),
  );
  expect(rootRef.current).toBe(root);
  const updated = getSkeletonElements(root);
  for (const index of [0, 2]) expectVisuals(updated.items[index], { size: 36, shape: 'square' });
  expectVisuals(updated.items[1], { size: 22, shape: 'square' });
  expectVisuals(updated.items[3], {});
  await screen.rerender(
    tree({ animation: undefined, appearance: undefined, size: undefined, shape: undefined }),
  );
  const reset = getSkeletonElements(root);
  for (const index of [0, 2, 3]) expectVisuals(reset.items[index], {});
  expectVisuals(reset.items[1], { size: 22, shape: 'square' });
});

test('inherits animation and appearance through nested roots while accepting explicit root overrides', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  await renderCoreAIComponent(
    <Skeleton ref={rootRef} animation="pulse" appearance="translucent" size={64} shape="circle">
      <Skeleton animation={undefined} appearance={undefined} size={24} shape="square">
        <SkeletonItem />
      </Skeleton>
      <Skeleton animation="wave" appearance="opaque">
        <SkeletonItem />
      </Skeleton>
    </Skeleton>,
  );
  if (!rootRef.current) throw new Error('Missing nested Skeleton');
  const { groups, items } = getSkeletonElements(rootRef.current);
  expect(groups).toHaveLength(3);
  expectVisuals(items[0], {
    animation: 'pulse',
    appearance: 'translucent',
    size: 24,
    shape: 'square',
  });
  expectVisuals(items[1], {});
  expect(groups[1]).toHaveAttribute('data-animation', 'pulse');
  expect(groups[2]).toHaveAttribute('data-animation', 'wave');
});

test('keeps standalone item defaults and content without inventing loading or accessibility state', async () => {
  const itemRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <SkeletonItem ref={itemRef}>
      <span data-consumer-content="">A supplied placeholder</span>
    </SkeletonItem>,
  );
  if (!itemRef.current) throw new Error('Missing standalone item');
  expectVisuals(itemRef.current, {});
  expect(itemRef.current).toHaveTextContent('A supplied placeholder');
  for (const attr of ['role', 'aria-busy', 'aria-live', 'aria-hidden', 'tabindex']) {
    expect(itemRef.current).not.toHaveAttribute(attr);
  }
  await expect.element(screen.getByText('A supplied placeholder')).toBeInTheDocument();
});

test('retains the primitive progressbar/aria-busy defaults without implicit live-region or value attributes', async () => {
  const screen = await renderCoreAIComponent(
    <Skeleton aria-label="Loading project owner">
      <SkeletonItem />
    </Skeleton>,
  );
  const root = screen.getByRole('progressbar', { name: 'Loading project owner' }).element();
  expect(root).toHaveAttribute('aria-busy', 'true');
  for (const attr of ['aria-live', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'tabindex']) {
    expect(root).not.toHaveAttribute(attr);
  }
});

test('preserves explicit caller role, busy state, naming, and explicit undefined native attributes', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <>
      <span id="skeleton-external-label">Owner details</span>
      <Skeleton
        ref={rootRef}
        role="status"
        aria-busy={false}
        aria-labelledby="skeleton-external-label"
        aria-live="polite"
      >
        <SkeletonItem />
      </Skeleton>
    </>,
  );
  expect(rootRef.current).toBe(screen.getByRole('status', { name: 'Owner details' }).element());
  expect(rootRef.current).toHaveAttribute('aria-busy', 'false');
  expect(rootRef.current).toHaveAttribute('aria-live', 'polite');
  await screen.rerender(
    <Skeleton
      ref={rootRef}
      role={undefined}
      aria-busy={undefined}
      aria-label="Caller-owned loading"
    >
      <SkeletonItem />
    </Skeleton>,
  );
  expect(rootRef.current).not.toHaveAttribute('role');
  expect(rootRef.current).not.toHaveAttribute('aria-busy');
  expect(rootRef.current).toHaveAttribute('aria-label', 'Caller-owned loading');
});

test('preserves resolved refs, classes, data attributes, native events, and custom content', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLDivElement>();
  const events: string[] = [];
  const onKeyDown = vi.fn<NonNullable<SkeletonProps['onKeyDown']>>();
  const screen = await renderCoreAIComponent(
    <Skeleton
      ref={rootRef}
      className="consumer-root"
      title="Owner loading"
      data-consumer-root=""
      animation="pulse"
      appearance="translucent"
      size={48}
      shape="circle"
      style={{ maxWidth: '220px', paddingInlineStart: '3px' }}
      tabIndex={0}
      onClick={() => events.push('root')}
      onKeyDown={onKeyDown}
    >
      <SkeletonItem
        ref={itemRef}
        className="consumer-item"
        title="Avatar placeholder"
        data-consumer-item=""
        animation="wave"
        appearance="opaque"
        size={24}
        shape="square"
        style={{ opacity: 0.75 }}
        onClick={() => events.push('item')}
      >
        <span data-consumer-item-child="">Supplied content</span>
      </SkeletonItem>
    </Skeleton>,
  );
  if (!rootRef.current || !itemRef.current) throw new Error('Missing Skeleton refs');
  const root = rootRef.current;
  const item = itemRef.current;
  expect(root).toHaveClass(skeletonClassNames.root, 'consumer-root');
  expect(item).toHaveClass(skeletonItemClassNames.root, 'consumer-item');
  expect(root).toHaveAttribute('data-consumer-root', '');
  expect(item).toHaveAttribute('data-consumer-item', '');
  expect(root).toHaveAttribute('title', 'Owner loading');
  expect(item).toHaveAttribute('title', 'Avatar placeholder');
  expect(item).toHaveTextContent('Supplied content');
  expect(getComputedStyle(root).maxWidth).toBe('220px');
  expect(getComputedStyle(root).paddingInlineStart).toBe('3px');
  expect(getComputedStyle(item).opacity).toBe('0.75');
  expectVisuals(item, { size: 24, shape: 'square' });
  for (const element of [root, item]) {
    for (const prop of ['animation', 'appearance', 'size', 'shape']) {
      expect(element).not.toHaveAttribute(prop);
    }
  }
  expect(item.firstElementChild).not.toHaveClass(skeletonClassNames.root);
  expect(item.firstElementChild).not.toHaveClass(skeletonItemClassNames.root);
  await userEvent.click(item);
  expect(events).toEqual(['item', 'root']);
  root.focus();
  await userEvent.keyboard('{Escape}');
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(onKeyDown.mock.calls[0][0].key).toBe('Escape');
  expect(document.activeElement).toBe(root);
  await screen.unmount();
  expect(rootRef.current).toBeNull();
  expect(itemRef.current).toBeNull();
});

test('preserves span refs and the source block layout without replacing native slot metadata', async () => {
  const rootRef = React.createRef<HTMLSpanElement>();
  const itemRef = React.createRef<HTMLSpanElement>();
  const warnings = vi.spyOn(console, 'warn');
  const errors = vi.spyOn(console, 'error');
  await renderCoreAIComponent(
    <Skeleton ref={rootRef} as="span" aria-label="Inline owner placeholder">
      <SkeletonItem ref={itemRef} as="span" size={24} />
    </Skeleton>,
  );
  if (!rootRef.current || !itemRef.current) throw new Error('Missing span refs');
  expect(rootRef.current.tagName).toBe('SPAN');
  expect(itemRef.current.tagName).toBe('SPAN');
  expect(getComputedStyle(rootRef.current).display).toBe('block');
  expect(getComputedStyle(itemRef.current).display).toBe('block');
  expectVisuals(itemRef.current, { size: 24 });
  expect(warnings).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});

test('passes styled resolved props, refs, and caller content through valid public slot render functions', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLSpanElement>();
  const warnings = vi.spyOn(console, 'warn');
  const errors = vi.spyOn(console, 'error');
  const renderItem: SlotRenderFunction<
    Extract<ExtractSlotProps<SkeletonItemSlots['root']>, { as: 'span' }>
  > = (Component, props) => (
    <Component {...props} as="span" data-rendered-item="">
      <em data-consumer-item-child="">Rendered owner placeholder</em>
    </Component>
  );
  const renderRoot: SlotRenderFunction<
    Extract<ExtractSlotProps<SkeletonSlots['root']>, { as?: 'div' }>
  > = (Component, props) => (
    <Component {...props} data-rendered-root="">
      <SkeletonItem ref={itemRef} as="span" className="consumer-item">
        {renderItem}
      </SkeletonItem>
      <span data-consumer-root-child="">Root extension</span>
    </Component>
  );
  await renderCoreAIComponent(
    <Skeleton ref={rootRef} className="consumer-root" size={32} aria-label="Rendered owner loading">
      {renderRoot}
    </Skeleton>,
  );
  if (!rootRef.current || !itemRef.current) throw new Error('Missing renderer refs');
  expect(itemRef.current.tagName).toBe('SPAN');
  expect(rootRef.current).toHaveAttribute('data-rendered-root', '');
  expect(itemRef.current).toHaveAttribute('data-rendered-item', '');
  expect(rootRef.current).toHaveClass(skeletonClassNames.root, 'consumer-root');
  expect(itemRef.current).toHaveClass(skeletonItemClassNames.root, 'consumer-item');
  expect(rootRef.current).toHaveAttribute('role', 'progressbar');
  expect(rootRef.current).toHaveAttribute('aria-busy', 'true');
  expect(rootRef.current).toHaveAccessibleName('Rendered owner loading');
  expectVisuals(itemRef.current, { size: 32 });
  expect(rootRef.current).toHaveTextContent('Root extension');
  expect(itemRef.current).toHaveTextContent('Rendered owner placeholder');
  for (const child of rootRef.current.querySelectorAll(
    '[data-consumer-item-child], [data-consumer-root-child]',
  )) {
    expect(child).not.toHaveClass(skeletonClassNames.root);
    expect(child).not.toHaveClass(skeletonItemClassNames.root);
  }
  expect(warnings).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});

test('freezes only owned pseudo-element animations while consumer root, item, and child animations run', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLDivElement>();
  const childRef = React.createRef<HTMLSpanElement>();
  await renderCoreAIComponent(
    <Skeleton ref={rootRef} className={comparisonStyles.animatedChild}>
      <SkeletonItem ref={itemRef} className={comparisonStyles.animatedChild}>
        <span ref={childRef} className={comparisonStyles.animatedChild}>
          Supplied animated child
        </span>
      </SkeletonItem>
    </Skeleton>,
  );
  if (!rootRef.current || !itemRef.current || !childRef.current) {
    throw new Error('Missing animated Skeleton fixture');
  }
  const control = getSkeletonElements(rootRef.current);
  await settleSkeletonStyles(control);
  const owned = getOwnedSkeletonAnimations(control);
  expect(owned).toHaveLength(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1);
  for (const animation of owned) {
    expect(animation.playState).toBe('paused');
    expect(animation.currentTime).toBe(0);
  }
  for (const element of [rootRef.current, itemRef.current, childRef.current]) {
    const consumerAnimation = element
      .getAnimations()
      .find(
        (animation) =>
          animation.effect instanceof KeyframeEffect &&
          animation.effect.target === element &&
          animation.effect.pseudoElement === null,
      );
    if (!consumerAnimation) throw new Error('Missing consumer-owned animation');
    expect(consumerAnimation).toBeInstanceOf(CSSAnimation);
    expect(consumerAnimation.playState).toBe('running');
  }
});

test('completes and reloads the shared mock request while the application owns loading state', async () => {
  const screen = await renderCoreAIComponent(<SkeletonLoadingFlow animation="pulse" />);
  const region = screen.getByRole('region', { name: 'Project owner' });
  await expect.element(region).toHaveAttribute('aria-busy', 'true');
  await expect
    .element(screen.getByRole('progressbar', { name: 'Loading project owner' }))
    .toHaveAttribute('aria-busy', 'true');
  expect(screen.container.querySelectorAll('.fui-SkeletonItem')).toHaveLength(3);
  await expect.element(screen.getByRole('button', { name: 'Reload owner' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Complete mock load' }));
  await expect.element(region).toHaveAttribute('aria-busy', 'false');
  expect(screen.container.querySelector('.fui-Skeleton')).toBeNull();
  expect(screen.container.querySelector('.fui-SkeletonItem')).toBeNull();
  await expect
    .element(screen.getByRole('article', { name: 'Loaded project owner' }))
    .toHaveTextContent('Jordan Lee');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Project owner loaded.');
  await expect.element(screen.getByRole('button', { name: 'Complete mock load' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Reload owner' }));
  await expect.element(region).toHaveAttribute('aria-busy', 'true');
  await expect
    .element(screen.getByRole('progressbar', { name: 'Loading project owner' }))
    .toHaveAttribute('aria-busy', 'true');
  expect(screen.container.querySelectorAll('.fui-SkeletonItem')).toHaveLength(3);
});

test('keeps geometry, CSS, animation, and missing-value regressions exact in the bounded report', () => {
  expect(
    compareSkeletonStyles(
      {
        'item[0].width': '28.00',
        'item[0].height': '28.00',
        'item[0].offset-left': '0.00',
        'item[0]::after.animation-duration': '3s',
        'item[0]::after.animation-keyframes': '[{"transform":"translate(100%)"}]',
        'item[0].background-color': '',
      },
      {
        'item[0].width': '28.01',
        'item[0].height': '28.51',
        'item[0].offset-left': '0.01',
        'item[0]::after.animation-duration': '1s',
        'item[0]::after.animation-keyframes': '[{"transform":"translate(-100%)"}]',
      },
    ),
  ).toEqual([
    { property: 'item[0].width', legacy: '28.00', headless: '28.01' },
    { property: 'item[0].height', legacy: '28.00', headless: '28.51' },
    { property: 'item[0].offset-left', legacy: '0.00', headless: '0.01' },
    { property: 'item[0]::after.animation-duration', legacy: '3s', headless: '1s' },
    {
      property: 'item[0]::after.animation-keyframes',
      legacy: '[{"transform":"translate(100%)"}]',
      headless: '[{"transform":"translate(-100%)"}]',
    },
    { property: 'item[0].background-color', legacy: '', headless: null },
  ]);
});
