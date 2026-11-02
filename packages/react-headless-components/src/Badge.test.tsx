// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  BadgeComparison,
  BadgeFixtureIcon,
  badgeConsumerExample,
  badgeExamples,
  badgeIconRenderer,
  badgeRootRenderer,
  type BadgeExample,
} from '../../../apps/storybook/src/stories/experiments/BadgeComparison.js';
import {
  captureBadgeStyles,
  compareBadgeStyles,
  getComparisonBadge,
  settleBadgeStyles,
} from '../../../apps/storybook/src/stories/experiments/compareBadgeStyles.js';
import { Badge, badgeClassNames, type BadgeProps } from './Badge.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: BadgeExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<BadgeComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonBadge(screen.container, 'legacy');
  const headless = getComparisonBadge(screen.container, 'headless');
  await Promise.all([settleBadgeStyles(legacy), settleBadgeStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(badgeExamples)(
    `matches $name root/icon styles, stroke, and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareBadgeStyles(captureBadgeStyles(legacy), captureBadgeStyles(headless))).toEqual(
        [],
      );
    },
  );

  test(`gives unlayered consumer CSS priority over combined visual states in ${mode} mode`, async () => {
    const { headless } = await renderPair(badgeConsumerExample, theme);
    const values = captureBadgeStyles(headless);
    expect(values['root.min-width']).toBe('60px');
    expect(values['root.height']).toBe('30.00');
    expect(values['root.border-radius']).toBe('3px');
    expect(values['root.background-color']).toBe('rgb(225, 238, 250)');
    expect(values['root.color']).toBe('rgb(25, 55, 85)');
    expect(values['root.padding-left']).toBe('10px');
    expect(values['icon.font-size']).toBe('18px');
    expect(values['icon.margin-left']).toBe('2px');
    expect(values['icon.margin-right']).toBe('2px');
  });
}

test.each([true, false])(
  'adds no CoreAI defaults with withComponentDefaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Undefined visual props',
        props: {
          appearance: undefined,
          color: undefined,
          shape: undefined,
          size: undefined,
          children: 'Ready',
        },
      },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(compareBadgeStyles(captureBadgeStyles(legacy), captureBadgeStyles(headless))).toEqual(
      [],
    );
    expect(headless.root).toHaveAttribute('data-appearance', 'filled');
    expect(headless.root).toHaveAttribute('data-color', 'brand');
    expect(headless.root).toHaveAttribute('data-shape', 'circular');
    expect(headless.root).toHaveAttribute('data-size', 'medium');
  },
);

for (const dir of ['ltr', 'rtl'] as const) {
  test.each([
    { size: 'medium', iconPosition: 'before' },
    { size: 'medium', iconPosition: 'after' },
    { size: 'extra-large', iconPosition: 'before' },
    { size: 'extra-large', iconPosition: 'after' },
  ] as const)(
    `retains $size/$iconPosition logical icon spacing and DOM order in ${dir}`,
    async ({ size, iconPosition }) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'Logical icon',
          props: {
            size,
            iconPosition,
            icon: <BadgeFixtureIcon />,
            children: <span data-content="">9</span>,
          },
        },
        coreaiLightTheme,
        true,
        dir,
      );
      expect(compareBadgeStyles(captureBadgeStyles(legacy), captureBadgeStyles(headless))).toEqual(
        [],
      );
      if (!headless.icon) throw new Error('Missing Badge icon');
      const icon = getComputedStyle(headless.icon);
      const root = getComputedStyle(headless.root);
      const textPadding = parseFloat(root.getPropertyValue('--spacingHorizontalXXS'));
      const spacing =
        parseFloat(
          root.getPropertyValue(
            size === 'extra-large' ? '--spacingHorizontalXS' : '--spacingHorizontalXXS',
          ),
        ) + textPadding;
      expect(root.direction).toBe(dir);
      expect(icon.marginInlineStart).toBe(`${iconPosition === 'after' ? spacing : -textPadding}px`);
      expect(icon.marginInlineEnd).toBe(`${iconPosition === 'before' ? spacing : -textPadding}px`);
      expect(
        iconPosition === 'before'
          ? headless.root.firstElementChild
          : headless.root.lastElementChild,
      ).toBe(headless.icon);
    },
  );
}

test.each([
  { name: 'zero', children: 0, content: true },
  { name: 'false', children: false, content: false },
  { name: 'null', children: null, content: false },
  { name: 'omitted', children: undefined, content: false },
  { name: 'text', children: '9', content: true },
])(
  'uses resolved $name content for icon spacing without rewriting children',
  async ({ name, children, content }) => {
    const { legacy, headless } = await renderPair({
      name,
      props: { children, icon: <BadgeFixtureIcon /> },
    });
    expect(headless.root.hasAttribute('data-has-content')).toBe(content);
    expect(compareBadgeStyles(captureBadgeStyles(legacy), captureBadgeStyles(headless))).toEqual(
      [],
    );
    expect(headless.root.textContent).toBe(
      children === 0 ? '0' : typeof children === 'string' ? children : '',
    );
  },
);

test('retains the upstream border pseudo-element as the default pointer hit target over decorative icons', async () => {
  const onClick = vi.fn();
  const onIconClick = vi.fn();
  const { legacy, headless } = await renderPair({
    name: 'Default border hit target',
    props: {
      children: 'Ready',
      onClick,
      icon: { children: <BadgeFixtureIcon />, onClick: onIconClick },
    },
  });
  for (const { root, icon } of [legacy, headless]) {
    if (!icon) throw new Error('Missing decorative Badge icon');
    root.scrollIntoView({ block: 'center', inline: 'center' });
    const stroke = getComputedStyle(root, '::after');
    expect(getComputedStyle(icon).pointerEvents).toBe('auto');
    expect(stroke.pointerEvents).toBe('auto');
    expect(stroke.position).toBe('absolute');
    expect(stroke.display).toBe('block');
    const rect = icon.getBoundingClientRect();
    expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(
      root,
    );
    await userEvent.click(root);
  }
  expect(onClick).toHaveBeenCalledTimes(2);
  expect(onIconClick).not.toHaveBeenCalled();
});

test('preserves owned slots, refs, caller classes, native events, and ARIA without leaking visual props', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const childRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn<NonNullable<BadgeProps['onClick']>>();
  const onIconClick = vi.fn<React.MouseEventHandler<HTMLSpanElement>>();
  await renderCoreAIComponent(
    <Badge
      ref={rootRef}
      role="img"
      aria-label="Project ready"
      aria-describedby="badge-hint"
      className="consumer-root"
      data-consumer=""
      title="Project status"
      style={{ borderRadius: '9px' }}
      appearance="outline"
      color="success"
      shape="square"
      size="large"
      onClick={onClick}
      icon={{
        ref: iconRef,
        className: 'consumer-icon',
        title: 'Ready icon',
        onClick: onIconClick,
        // Opt this callback fixture above the upstream border's default hit surface.
        style: { position: 'relative', zIndex: 1, pointerEvents: 'auto' },
        children: <BadgeFixtureIcon />,
      }}
    >
      <span ref={childRef} className="consumer-content">
        Ready
      </span>
    </Badge>,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon || !childRef.current) throw new Error('Missing Badge slot refs');
  expect(root).toHaveClass(badgeClassNames.root, 'consumer-root');
  expect(icon).toHaveClass(badgeClassNames.icon, 'consumer-icon');
  expect(root.querySelector(`:scope > .${badgeClassNames.icon}`)).toBe(icon);
  expect(root).toHaveAccessibleName('Project ready');
  expect(root).toHaveAttribute('aria-describedby', 'badge-hint');
  expect(root).toHaveAttribute('data-consumer', '');
  expect(root).toHaveAttribute('title', 'Project status');
  expect(root.style.borderRadius).toBe('9px');
  expect(icon).toHaveAttribute('title', 'Ready icon');
  expect(childRef.current.className).toBe('consumer-content');
  for (const prop of ['appearance', 'color', 'shape', 'size', 'iconPosition'])
    expect(root).not.toHaveAttribute(prop);
  await userEvent.click(icon);
  expect(onIconClick).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
});

test('passes resolved root and icon props through valid current slot render functions', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const onIconClick = vi.fn();
  await renderCoreAIComponent(
    <Badge
      ref={rootRef}
      className="consumer-root"
      role="img"
      aria-label="Rendered badge"
      onClick={onClick}
      children={badgeRootRenderer}
      icon={{
        ref: iconRef,
        className: 'consumer-icon',
        style: { position: 'relative', zIndex: 1, pointerEvents: 'auto' },
        onClick: onIconClick,
        children: badgeIconRenderer,
      }}
    />,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon) throw new Error('Missing rendered Badge refs');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(root).toHaveAttribute('data-icon-position', 'before');
  expect(root).toHaveAccessibleName('Rendered badge');
  expect(root).toHaveClass(badgeClassNames.root, 'consumer-root');
  expect(icon).toHaveAttribute('data-rendered-icon', '');
  expect(icon).toHaveClass(badgeClassNames.icon, 'consumer-icon');
  expect(root.querySelector('[data-consumer-root-child]')).not.toHaveClass(badgeClassNames.root);
  await userEvent.click(icon);
  expect(onIconClick).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
});

test('keeps badge semantics non-interactive and gives stable markers to owned DOM only', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  await renderCoreAIComponent(
    <div className="consumer-globals">
      <style>{`
        .consumer-globals .fui-Badge { border-radius: 7px; color: rgb(12, 34, 56); }
        .consumer-globals .fui-Badge__icon { font-size: 15px; }
      `}</style>
      <Badge ref={rootRef} icon={<BadgeFixtureIcon />}>
        <span className="untouched-child">Ready</span>
      </Badge>
    </div>,
  );
  const root = rootRef.current;
  if (!root) throw new Error('Missing Badge');
  expect(root.tabIndex).toBe(-1);
  expect(root).not.toHaveAttribute('role');
  expect(root).not.toHaveAttribute('aria-live');
  expect(getComputedStyle(root).borderRadius).toBe('7px');
  expect(getComputedStyle(root).color).toBe('rgb(12, 34, 56)');
  const icon = root.querySelector(`.${badgeClassNames.icon}`);
  if (!icon) throw new Error('Missing owned icon');
  expect(getComputedStyle(icon).fontSize).toBe('15px');
  expect(root.querySelector('.untouched-child')?.className).toBe('untouched-child');
  expect(root.querySelector('[data-parity-glyph]')?.getAttribute('class')).toBeNull();
  expectTypeOf(Badge).toEqualTypeOf<ForwardRefComponent<BadgeProps>>();
});
