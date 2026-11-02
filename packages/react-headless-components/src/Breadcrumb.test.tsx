// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Breadcrumb as PrimitiveBreadcrumb,
  BreadcrumbButton as PrimitiveBreadcrumbButton,
  BreadcrumbDivider as PrimitiveBreadcrumbDivider,
  BreadcrumbItem as PrimitiveBreadcrumbItem,
  type BreadcrumbButtonSlots as PrimitiveBreadcrumbButtonSlots,
  type BreadcrumbDividerSlots as PrimitiveBreadcrumbDividerSlots,
  type BreadcrumbItemSlots as PrimitiveBreadcrumbItemSlots,
  type BreadcrumbSlots as PrimitiveBreadcrumbSlots,
} from '@fluentui/react-headless-components-preview/breadcrumb';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  Breadcrumb as LegacyBreadcrumb,
  BreadcrumbButton as LegacyBreadcrumbButton,
  BreadcrumbDivider as LegacyBreadcrumbDivider,
  BreadcrumbItem as LegacyBreadcrumbItem,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  BreadcrumbCalendarIcon,
  BreadcrumbCollapsedAncestors,
  BreadcrumbComparison,
  BreadcrumbNavigationFlow,
  breadcrumbConsumerExample,
  breadcrumbExamples,
  breadcrumbSizes,
  type BreadcrumbExample,
} from '../../../apps/storybook/src/stories/experiments/BreadcrumbComparison.js';
import {
  captureBreadcrumbStyles,
  compareBreadcrumbStyles,
  getBreadcrumbSlots,
  getComparisonBreadcrumb,
  settleBreadcrumbStyles,
} from '../../../apps/storybook/src/stories/experiments/compareBreadcrumbStyles.js';
import {
  Breadcrumb,
  breadcrumbClassNames,
  type BreadcrumbProps,
  type BreadcrumbSlots,
} from './Breadcrumb.js';
import {
  BreadcrumbButton,
  breadcrumbButtonClassNames,
  type BreadcrumbButtonProps,
  type BreadcrumbButtonSlots,
} from './BreadcrumbButton.js';
import {
  BreadcrumbDivider,
  breadcrumbDividerClassNames,
  type BreadcrumbDividerProps,
  type BreadcrumbDividerSlots,
} from './BreadcrumbDivider.js';
import {
  BreadcrumbItem,
  breadcrumbItemClassNames,
  type BreadcrumbItemProps,
  type BreadcrumbItemSlots,
} from './BreadcrumbItem.js';

type NativeAnchorProps = Extract<BreadcrumbButtonProps, { as: 'a' }>;
type AnchorClickHandler = NonNullable<NativeAnchorProps['onClick']>;
type NativeButtonProps = Extract<BreadcrumbButtonProps, { as?: 'button' }>;
type ButtonClickHandler = NonNullable<NativeButtonProps['onClick']>;

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: BreadcrumbExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <BreadcrumbComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonBreadcrumb(screen.container, 'legacy');
  const headless = getComparisonBreadcrumb(screen.container, 'headless');
  await Promise.all([settleBreadcrumbStyles(legacy), settleBreadcrumbStyles(headless)]);
  return { screen, legacy, headless };
}

async function focusViaTab(element: HTMLElement): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    if (document.activeElement === element) return;
    await userEvent.tab();
  }
  throw new Error('Breadcrumb fixture control was not reached by native Tab');
}

test('preserves the current public native slots and ForwardRefComponent contracts for all four components', () => {
  expectTypeOf<typeof Breadcrumb>().toEqualTypeOf<ForwardRefComponent<BreadcrumbProps>>();
  expectTypeOf<typeof BreadcrumbItem>().toEqualTypeOf<ForwardRefComponent<BreadcrumbItemProps>>();
  expectTypeOf<typeof BreadcrumbButton>().toEqualTypeOf<
    ForwardRefComponent<BreadcrumbButtonProps>
  >();
  expectTypeOf<typeof BreadcrumbDivider>().toEqualTypeOf<
    ForwardRefComponent<BreadcrumbDividerProps>
  >();
  expectTypeOf<React.ComponentProps<typeof Breadcrumb>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveBreadcrumb>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof BreadcrumbItem>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveBreadcrumbItem>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof BreadcrumbButton>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveBreadcrumbButton>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof BreadcrumbDivider>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveBreadcrumbDivider>['ref']
  >();
  expectTypeOf<BreadcrumbSlots>().toEqualTypeOf<PrimitiveBreadcrumbSlots>();
  expectTypeOf<BreadcrumbItemSlots>().toEqualTypeOf<PrimitiveBreadcrumbItemSlots>();
  expectTypeOf<BreadcrumbButtonSlots>().toEqualTypeOf<PrimitiveBreadcrumbButtonSlots>();
  expectTypeOf<BreadcrumbDividerSlots>().toEqualTypeOf<PrimitiveBreadcrumbDividerSlots>();
  expectTypeOf<BreadcrumbButtonProps['as']>().toEqualTypeOf<'button' | 'a' | undefined>();
});

for (const [mode, theme] of themes) {
  test.each(breadcrumbExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareBreadcrumbStyles(captureBreadcrumbStyles(legacy), captureBreadcrumbStyles(headless)),
    ).toEqual([]);
    expect(headless.tagName).toBe('NAV');
    expect(headless.getAttribute('aria-label')).toBe(example.name);
    const oldSlots = getBreadcrumbSlots(legacy);
    const newSlots = getBreadcrumbSlots(headless);
    expect(newSlots.list?.tagName).toBe('OL');
    expect(newSlots.list).toHaveAttribute('role', 'list');
    expect(newSlots.items.length).toBe(3);
    for (const [index, control] of newSlots.buttons.entries()) {
      expect(control.tagName).toBe(oldSlots.buttons[index].tagName);
      expect(control.getAttribute('aria-current')).toBe(
        oldSlots.buttons[index].getAttribute('aria-current'),
      );
      expect(control.getAttribute('aria-disabled')).toBe(
        oldSlots.buttons[index].getAttribute('aria-disabled'),
      );
      expect(control.getAttribute('href')).toBe(oldSlots.buttons[index].getAttribute('href'));
    }
    for (const divider of newSlots.dividers) expect(divider).toHaveAttribute('aria-hidden', 'true');
  });

  test.each(breadcrumbSizes)(
    `matches %s normal and current hover in ${mode} mode`,
    async (size) => {
      const { screen, legacy, headless } = await renderPair({ name: size, props: { size } }, theme);
      const oldSlots = getBreadcrumbSlots(legacy);
      const newSlots = getBreadcrumbSlots(headless);
      for (const index of [1, 2]) {
        await userEvent.hover(oldSlots.buttons[index]);
        expect(oldSlots.buttons[index].matches(':hover')).toBe(true);
        await settleBreadcrumbStyles(legacy);
        const expected = captureBreadcrumbStyles(legacy);
        await userEvent.hover(newSlots.buttons[index]);
        expect(newSlots.buttons[index].matches(':hover')).toBe(true);
        await settleBreadcrumbStyles(headless);
        expect(compareBreadcrumbStyles(expected, captureBreadcrumbStyles(headless))).toEqual([]);
        const regular = newSlots.buttons[index].querySelector('.fui-Icon-regular');
        const filled = newSlots.buttons[index].querySelector('.fui-Icon-filled');
        if (!regular || !filled) throw new Error('Missing supplied paired Breadcrumb glyphs');
        expect(getComputedStyle(regular).display).toBe(index === 2 ? 'block' : 'none');
        expect(getComputedStyle(filled).display).toBe(index === 2 ? 'none' : 'block');
        await userEvent.hover(screen.getByText('Case', { exact: true }));
        await Promise.all([settleBreadcrumbStyles(legacy), settleBreadcrumbStyles(headless)]);
      }
    },
  );

  test.each(breadcrumbSizes)(
    `matches %s keyboard focus and focused hover in ${mode} mode`,
    async (size) => {
      const { screen, legacy, headless } = await renderPair({ name: size, props: { size } }, theme);
      const oldControl = getBreadcrumbSlots(legacy).buttons[1];
      const newControl = getBreadcrumbSlots(headless).buttons[1];
      await focusViaTab(oldControl);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      expect(oldControl.matches(':hover')).toBe(false);
      expect(oldControl.matches(':focus-visible')).toBe(true);
      await settleBreadcrumbStyles(legacy);
      const focused = captureBreadcrumbStyles(legacy);
      await userEvent.hover(oldControl);
      expect(oldControl.matches(':hover')).toBe(true);
      await settleBreadcrumbStyles(legacy);
      const focusedHover = captureBreadcrumbStyles(legacy);
      await focusViaTab(newControl);
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      expect(newControl.matches(':hover')).toBe(false);
      expect(newControl.matches(':focus-visible')).toBe(true);
      await settleBreadcrumbStyles(headless);
      expect(compareBreadcrumbStyles(focused, captureBreadcrumbStyles(headless))).toEqual([]);
      await userEvent.hover(newControl);
      expect(newControl.matches(':hover')).toBe(true);
      await settleBreadcrumbStyles(headless);
      expect(compareBreadcrumbStyles(focusedHover, captureBreadcrumbStyles(headless))).toEqual([]);
    },
  );

  test.each([false, true])(
    `keeps disabled focusable=%s hover in ${mode} mode`,
    async (disabledFocusable) => {
      const { legacy, headless } = await renderPair(
        { name: 'Unavailable ancestor', buttonProps: { disabled: true, disabledFocusable } },
        theme,
      );
      const oldControl = getBreadcrumbSlots(legacy).buttons[1];
      const newControl = getBreadcrumbSlots(headless).buttons[1];
      await userEvent.hover(oldControl);
      expect(oldControl.matches(':hover')).toBe(true);
      await settleBreadcrumbStyles(legacy);
      const expected = captureBreadcrumbStyles(legacy);
      await userEvent.hover(newControl);
      expect(newControl.matches(':hover')).toBe(true);
      await settleBreadcrumbStyles(headless);
      expect(compareBreadcrumbStyles(expected, captureBreadcrumbStyles(headless))).toEqual([]);
      expect(getComputedStyle(newControl).cursor).toBe('not-allowed');
    },
  );
}

test.each(breadcrumbSizes)(
  'matches %s RTL logical icon spacing and default chevrons',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: 'RTL', props: { size } },
      coreaiLightTheme,
      'rtl',
    );
    expect(
      compareBreadcrumbStyles(captureBreadcrumbStyles(legacy), captureBreadcrumbStyles(headless)),
    ).toEqual([]);
    const oldDivider = getBreadcrumbSlots(legacy).dividers[0];
    const newDivider = getBreadcrumbSlots(headless).dividers[0];
    expect(newDivider.querySelector('path')?.getAttribute('d')).toBe(
      oldDivider.querySelector('path')?.getAttribute('d'),
    );
    const icon = getBreadcrumbSlots(headless).buttons[1].querySelector(
      '.fui-BreadcrumbButton__icon',
    );
    if (!icon) throw new Error('Missing RTL Breadcrumb icon');
    expect(getComputedStyle(icon).marginLeft).toBe('4px');
    expect(getComputedStyle(icon).marginRight).toBe('0px');
  },
);

test.each([true, false])(
  'does not invent Breadcrumb CoreAI overrides or defaults when defaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      { name: 'Defaults' },
      coreaiLightTheme,
      'ltr',
      withComponentDefaults,
    );
    expect(
      compareBreadcrumbStyles(captureBreadcrumbStyles(legacy), captureBreadcrumbStyles(headless)),
    ).toEqual([]);
    const control = getBreadcrumbSlots(headless).buttons[1];
    expect(control).toHaveAttribute('data-size', 'medium');
    expect(control).toHaveAttribute('data-appearance', 'subtle');
    expect(control).toHaveAttribute('data-shape', 'rounded');
    expect(getComputedStyle(control).minWidth).toBe('auto');
    expect(getComputedStyle(control).borderRadius).toBe('4px');
  },
);

test('lets ordinary consumer CSS override each owned slot without changing the legacy comparison', async () => {
  const { headless } = await renderPair(breadcrumbConsumerExample);
  const { list, items, buttons, dividers } = getBreadcrumbSlots(headless);
  expect(getComputedStyle(headless).paddingTop).toBe('7px');
  if (!list) throw new Error('Missing consumer list');
  expect(getComputedStyle(list).columnGap).toBe('9px');
  expect(getComputedStyle(items[0]).color).toBe('rgb(70, 40, 120)');
  const control = buttons[1];
  expect(getComputedStyle(control).minWidth).toBe('110px');
  expect(getComputedStyle(control).height).toBe('38px');
  expect(getComputedStyle(control).paddingTop).toBe('9px');
  expect(getComputedStyle(control).borderRadius).toBe('3px');
  expect(getComputedStyle(control).color).toBe('rgb(30, 70, 120)');
  const icon = control.querySelector('.fui-BreadcrumbButton__icon');
  if (!icon) throw new Error('Missing consumer icon');
  expect(getComputedStyle(icon).width).toBe('18px');
  expect(getComputedStyle(icon).height).toBe('18px');
  expect(getComputedStyle(icon).marginInlineEnd).toBe('9px');
  expect(getComputedStyle(dividers[0]).fontSize).toBe('22px');
  expect(getComputedStyle(dividers[0]).color).toBe('rgb(100, 40, 80)');
});

test('uses public family context for root size, including nested families and primitive children', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Breadcrumb aria-label="Outer" size="large">
        <BreadcrumbItem size="small">
          <BreadcrumbButton size="small">Outer control</BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <Breadcrumb aria-label="Inner" size="small">
            <BreadcrumbItem>
              <BreadcrumbButton>Inner control</BreadcrumbButton>
            </BreadcrumbItem>
            <BreadcrumbDivider />
            <PrimitiveBreadcrumbItem>Primitive item</PrimitiveBreadcrumbItem>
          </Breadcrumb>
        </BreadcrumbItem>
      </Breadcrumb>
      <PrimitiveBreadcrumb aria-label="Primitive parent">
        <BreadcrumbItem>
          <BreadcrumbButton>Medium fallback</BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
      </PrimitiveBreadcrumb>
    </CoreAIFluentProvider>,
  );
  const outer = screen.getByRole('button', { name: 'Outer control' }).element();
  const inner = screen.getByRole('button', { name: 'Inner control' }).element();
  const fallback = screen.getByRole('button', { name: 'Medium fallback' }).element();
  expect(outer).toHaveAttribute('data-size', 'large');
  expect(getComputedStyle(outer).height).toBe('40px');
  expect(inner).toHaveAttribute('data-size', 'small');
  expect(getComputedStyle(inner).height).toBe('24px');
  expect(fallback).toHaveAttribute('data-size', 'medium');
  expect(getComputedStyle(fallback).height).toBe('32px');
  for (const root of [outer, inner, fallback]) expect(root).not.toHaveAttribute('size');
});

test('preserves native nav/list/item refs, consumer classes, render functions, and primitive metadata', async () => {
  const navRef = React.createRef<HTMLElement>();
  const listRef = React.createRef<HTMLOListElement>();
  const itemRef = React.createRef<HTMLLIElement>();
  const buttonRef = React.createRef<HTMLAnchorElement>();
  const actionRef = React.createRef<HTMLButtonElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const dividerRef = React.createRef<HTMLLIElement>();
  const renderedTags: unknown[] = [];
  const clickTargets: EventTarget[] = [];
  const onClick = vi.fn<AnchorClickHandler>((event) => {
    clickTargets.push(event.currentTarget);
    event.preventDefault();
  });
  const onWarning = vi.spyOn(console, 'warn');
  const renderNav: SlotRenderFunction<ExtractSlotProps<BreadcrumbSlots['root']>> = (
    Component,
    props,
  ) => {
    renderedTags.push(Component);
    return (
      <Component {...props} data-rendered-nav="">
        {props.children}
      </Component>
    );
  };
  const renderList: SlotRenderFunction<ExtractSlotProps<BreadcrumbSlots['list']>> = (
    Component,
    props,
  ) => {
    renderedTags.push(Component);
    return (
      <Component {...props} data-rendered-list="">
        {props.children}
      </Component>
    );
  };
  const renderItem: SlotRenderFunction<ExtractSlotProps<BreadcrumbItemSlots['root']>> = (
    Component,
    props,
  ) => {
    renderedTags.push(Component);
    return (
      <Component {...props}>
        <span data-item-child="">Item content</span>
      </Component>
    );
  };
  const renderControl: SlotRenderFunction<
    Extract<ExtractSlotProps<BreadcrumbButtonSlots['root']>, { as: 'a' }>
  > = (Component, props) => {
    renderedTags.push(Component);
    return (
      <a {...props}>
        {props.children}
        <span data-control-child="">Rendered ancestor</span>
      </a>
    );
  };
  const renderIcon: SlotRenderFunction<ExtractSlotProps<BreadcrumbButtonSlots['icon']>> = (
    Component,
    props,
  ) => {
    renderedTags.push(Component);
    return (
      <Component {...props}>
        <span data-icon-child="">I</span>
      </Component>
    );
  };
  const renderDivider: SlotRenderFunction<ExtractSlotProps<BreadcrumbDividerSlots['root']>> = (
    Component,
    props,
  ) => {
    renderedTags.push(Component);
    return <Component {...props}>/</Component>;
  };
  const iconProps: ExtractSlotProps<BreadcrumbButtonSlots['icon']> & {
    'data-consumer-icon': string;
  } = {
    ref: iconRef,
    className: 'caller-icon',
    children: renderIcon,
    'data-consumer-icon': 'kept',
  };
  const listProps: ExtractSlotProps<BreadcrumbSlots['list']> & { 'data-consumer-list': string } = {
    ref: listRef,
    className: 'caller-list',
    children: renderList,
    'data-consumer-list': 'kept',
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Breadcrumb
        ref={navRef}
        aria-label="Rendered path"
        className="caller-nav"
        size="large"
        list={listProps}
      >
        {renderNav}
      </Breadcrumb>
      <Breadcrumb aria-label="Rendered entries">
        <BreadcrumbItem ref={itemRef} className="caller-item">
          {renderItem}
        </BreadcrumbItem>
        <BreadcrumbDivider ref={dividerRef} className="caller-divider">
          {renderDivider}
        </BreadcrumbDivider>
        <BreadcrumbItem>
          <BreadcrumbButton
            ref={buttonRef}
            as="a"
            href="#rendered-ancestor"
            aria-label="Rendered ancestor"
            className="caller-button"
            icon={iconProps}
            onClick={onClick}
          >
            {renderControl}
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbButton ref={actionRef} as="button" type="button">
            Referenced action
          </BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>
    </CoreAIFluentProvider>,
  );
  expect(navRef.current).toBe(screen.getByRole('navigation', { name: 'Rendered path' }).element());
  expect(navRef.current?.tagName).toBe('NAV');
  expect(navRef.current).toHaveClass(breadcrumbClassNames.root, 'caller-nav');
  expect(listRef.current?.parentElement).toBe(navRef.current);
  expect(listRef.current).toHaveClass(breadcrumbClassNames.list, 'caller-list');
  expect(listRef.current).toHaveAttribute('data-consumer-list', 'kept');
  expect(listRef.current).toHaveAttribute('data-rendered-list', '');
  expect(itemRef.current?.tagName).toBe('LI');
  expect(itemRef.current).toHaveClass(breadcrumbItemClassNames.root, 'caller-item');
  expect(itemRef.current).toHaveTextContent('Item content');
  expect(buttonRef.current).toBe(screen.getByRole('link', { name: 'Rendered ancestor' }).element());
  expect(buttonRef.current).toHaveClass(
    breadcrumbButtonClassNames.root,
    'fui-Button',
    'caller-button',
  );
  expect(actionRef.current).toBe(
    screen.getByRole('button', { name: 'Referenced action' }).element(),
  );
  expect(actionRef.current?.type).toBe('button');
  expect(iconRef.current?.parentElement).toBe(buttonRef.current);
  expect(iconRef.current).toHaveClass(
    breadcrumbButtonClassNames.icon,
    'fui-Button__icon',
    'caller-icon',
  );
  expect(iconRef.current).toHaveAttribute('data-consumer-icon', 'kept');
  expect(dividerRef.current?.tagName).toBe('LI');
  expect(dividerRef.current).toHaveClass(breadcrumbDividerClassNames.root, 'caller-divider');
  expect(dividerRef.current).toHaveAttribute('aria-hidden', 'true');
  expect(dividerRef.current).toHaveTextContent('/');
  expect(renderedTags).toContain('nav');
  expect(renderedTags).toContain('ol');
  expect(renderedTags).toContain('li');
  expect(renderedTags).toContain('a');
  expect(renderedTags).toContain('span');
  expect(
    onWarning.mock.calls.filter(([message]) => String(message).includes('assertSlots')),
  ).toEqual([]);
  for (const child of screen.container.querySelectorAll(
    '[data-item-child], [data-control-child], [data-icon-child]',
  )) {
    for (const marker of [
      ...Object.values(breadcrumbClassNames),
      ...Object.values(breadcrumbItemClassNames),
      ...Object.values(breadcrumbButtonClassNames),
      ...Object.values(breadcrumbDividerClassNames),
    ])
      expect(child).not.toHaveClass(marker);
  }
  await userEvent.click(screen.getByRole('link', { name: 'Rendered ancestor' }));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(clickTargets[0]).toBe(buttonRef.current);
});

test('keeps caller divider children rather than the legacy forced glyph, including null and false', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <LegacyBreadcrumb aria-label="Old custom">
        <LegacyBreadcrumbItem>Home</LegacyBreadcrumbItem>
        <LegacyBreadcrumbDivider>/</LegacyBreadcrumbDivider>
      </LegacyBreadcrumb>
      <Breadcrumb aria-label="New custom">
        <BreadcrumbItem>Home</BreadcrumbItem>
        <BreadcrumbDivider>/</BreadcrumbDivider>
        <BreadcrumbDivider>{null}</BreadcrumbDivider>
        <BreadcrumbDivider>{false}</BreadcrumbDivider>
        <BreadcrumbDivider>
          <span data-custom-divider="">››</span>
        </BreadcrumbDivider>
      </Breadcrumb>
    </CoreAIFluentProvider>,
  );
  const oldRoot = screen.getByRole('navigation', { name: 'Old custom' }).element();
  const newRoot = screen.getByRole('navigation', { name: 'New custom' }).element();
  expect(oldRoot.querySelector('.fui-BreadcrumbDivider > svg')).not.toBeNull();
  expect(oldRoot.querySelector('.fui-BreadcrumbDivider')).not.toHaveTextContent('/');
  const dividers = getBreadcrumbSlots(newRoot).dividers;
  expect(dividers[0]).toHaveTextContent('/');
  expect(dividers[0].querySelector('svg')).toBeNull();
  expect(dividers[1]).toBeEmptyDOMElement();
  expect(dividers[2]).toBeEmptyDOMElement();
  expect(dividers[3].querySelector('[data-custom-divider]')).toHaveTextContent('››');
  for (const divider of dividers) expect(divider).toHaveAttribute('aria-hidden', 'true');
});

test('uses resolved current/disabled/presence attributes rather than caller data or visual props', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Breadcrumb aria-label="Resolved path" size="small" data-size="forged">
        <BreadcrumbItem size="large">
          <BreadcrumbButton
            current
            disabled
            size="large"
            icon={<BreadcrumbCalendarIcon />}
            data-current="forged"
            data-size="forged"
            data-appearance="forged"
            data-disabled="forged"
            data-icon-position="after"
          >
            Atlas
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider data-size="forged" />
      </Breadcrumb>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('navigation', { name: 'Resolved path' }).element();
  const { items, buttons, dividers } = getBreadcrumbSlots(root);
  expect(root).toHaveAttribute('data-size', 'small');
  expect(items[0]).toHaveAttribute('data-size', 'small');
  const control = buttons[0];
  expect(control).toHaveAttribute('data-current', '');
  expect(control).toHaveAttribute('data-disabled', '');
  expect(control).toHaveAttribute('data-size', 'small');
  expect(control).toHaveAttribute('data-appearance', 'subtle');
  expect(control).toHaveAttribute('data-icon-position', 'before');
  expect(control).toHaveAttribute('data-has-icon', '');
  expect(control).toHaveAttribute('data-has-content', '');
  expect(control).not.toHaveAttribute('data-icon-only');
  expect(control).toHaveAttribute('aria-current', 'page');
  expect(control).toHaveAttribute('aria-disabled', 'true');
  expect(dividers[0]).toHaveAttribute('data-size', 'small');
  for (const element of [root, items[0], control]) {
    for (const prop of ['size', 'current', 'appearance', 'shape', 'iconposition'])
      expect(element).not.toHaveAttribute(prop);
  }
});

test('supports an omitted list and the default accessible nav label without introducing focus machinery', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <p>Pointer parking</p>
      <Breadcrumb list={null}>
        <BreadcrumbItem>Not rendered</BreadcrumbItem>
      </Breadcrumb>
      <Breadcrumb aria-label="Arrow request" focusMode="arrow">
        <BreadcrumbItem>
          <BreadcrumbButton>First ancestor</BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton>Second ancestor</BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>
      <button type="button">After path</button>
    </CoreAIFluentProvider>,
  );
  const defaultRoot = screen.getByRole('navigation', { name: 'breadcrumb', exact: true }).element();
  expect(defaultRoot).toBeEmptyDOMElement();
  const arrowRoot = screen.getByRole('navigation', { name: 'Arrow request' }).element();
  for (const attribute of ['focusmode', 'focusgroup', 'data-tabster'])
    expect(arrowRoot).not.toHaveAttribute(attribute);
  await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
  await userEvent.tab();
  const first = screen.getByRole('button', { name: 'First ancestor' }).element();
  const second = screen.getByRole('button', { name: 'Second ancestor' }).element();
  await expect.element(first).toHaveFocus();
  expect(first.matches(':hover')).toBe(false);
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(first).toHaveFocus();
  await userEvent.tab();
  await expect.element(second).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After path' })).toHaveFocus();
});

for (const [implementation, Root, Item, Control] of [
  ['raw headless', PrimitiveBreadcrumb, PrimitiveBreadcrumbItem, PrimitiveBreadcrumbButton],
  ['legacy', LegacyBreadcrumb, LegacyBreadcrumbItem, LegacyBreadcrumbButton],
  ['styled headless', Breadcrumb, BreadcrumbItem, BreadcrumbButton],
] as const) {
  test(`preserves ${implementation} native submit defaults and explicit non-submit form behavior`, async () => {
    const defaultTargets: HTMLButtonElement[] = [];
    const explicitTargets: HTMLButtonElement[] = [];
    const submitters: HTMLButtonElement[] = [];
    const submissions: Record<string, FormDataEntryValue>[] = [];
    const order: string[] = [];
    const onDefaultClick = vi.fn<ButtonClickHandler>((event) => {
      defaultTargets.push(event.currentTarget);
      order.push('default-click');
    });
    const onExplicitClick = vi.fn<ButtonClickHandler>((event) => {
      explicitTargets.push(event.currentTarget);
      order.push('explicit-click');
    });
    const screen = await render(
      <CoreAIFluentProvider>
        <form
          aria-label="Breadcrumb actions"
          onSubmit={(event) => {
            event.preventDefault();
            if (!(event.nativeEvent instanceof SubmitEvent))
              throw new Error('Missing native Breadcrumb SubmitEvent');
            const submitter = event.nativeEvent.submitter;
            if (!(submitter instanceof HTMLButtonElement))
              throw new Error('Missing native Breadcrumb button submitter');
            submitters.push(submitter);
            submissions.push(Object.fromEntries(new FormData(event.currentTarget, submitter)));
            order.push('submit');
          }}
        >
          <input type="hidden" name="project" value="Atlas" />
          <Root aria-label="Form path">
            <Item>
              <Control as="button" name="action" value="open" onClick={onDefaultClick}>
                Default breadcrumb action
              </Control>
            </Item>
            <Item>
              <Control
                as="button"
                type="button"
                name="action"
                value="preview"
                onClick={onExplicitClick}
              >
                Explicit non-submit breadcrumb action
              </Control>
            </Item>
          </Root>
        </form>
      </CoreAIFluentProvider>,
    );
    const form = screen.getByRole('form', { name: 'Breadcrumb actions' }).element();
    const defaultAction = screen
      .getByRole('button', { name: 'Default breadcrumb action', exact: true })
      .element();
    const explicitAction = screen
      .getByRole('button', { name: 'Explicit non-submit breadcrumb action', exact: true })
      .element();
    if (
      !(form instanceof HTMLFormElement) ||
      !(defaultAction instanceof HTMLButtonElement) ||
      !(explicitAction instanceof HTMLButtonElement)
    ) {
      throw new Error('Missing native Breadcrumb form controls');
    }

    // Breadcrumb passes type: undefined through Button, retaining the native submit default.
    expect(defaultAction).not.toHaveAttribute('type');
    expect(defaultAction.type).toBe('submit');
    expect(defaultAction.form).toBe(form);
    expect(explicitAction).toHaveAttribute('type', 'button');
    expect(explicitAction.type).toBe('button');
    expect(explicitAction.form).toBe(form);

    await userEvent.click(explicitAction);
    expect(onExplicitClick).toHaveBeenCalledTimes(1);
    expect(explicitTargets[0]).toBe(explicitAction);
    expect(onDefaultClick).not.toHaveBeenCalled();
    expect(submissions).toEqual([]);

    await userEvent.click(defaultAction);
    expect(onDefaultClick).toHaveBeenCalledTimes(1);
    expect(defaultTargets[0]).toBe(defaultAction);
    expect(submitters.length).toBe(1);
    expect(submitters[0]).toBe(defaultAction);
    expect(submissions).toEqual([{ project: 'Atlas', action: 'open' }]);
    expect(order).toEqual(['explicit-click', 'default-click', 'submit']);
  });
}

for (const [implementation, Root, Item, Control, Separator] of [
  [
    'legacy',
    LegacyBreadcrumb,
    LegacyBreadcrumbItem,
    LegacyBreadcrumbButton,
    LegacyBreadcrumbDivider,
  ],
  ['headless', Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider],
] as const) {
  test(`retains ${implementation} native hash navigation and native button activation callbacks`, async () => {
    const originalUrl = window.location.href;
    const onLinkClick = vi.fn();
    const onButtonClick = vi.fn();
    try {
      const screen = await render(
        <CoreAIFluentProvider>
          <p>Pointer parking</p>
          <Root aria-label="Keyboard path">
            <Item>
              <Control as="button" onClick={onButtonClick}>
                Action ancestor
              </Control>
            </Item>
            <Separator />
            <Item>
              <Control as="a" href="#breadcrumb-native-target" onClick={onLinkClick}>
                Linked ancestor
              </Control>
            </Item>
          </Root>
          <span id="breadcrumb-native-target">Native destination</span>
          <button type="button">After path</button>
        </CoreAIFluentProvider>,
      );
      await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
      await userEvent.tab();
      await expect.element(screen.getByRole('button', { name: 'Action ancestor' })).toHaveFocus();
      await userEvent.keyboard('{Enter} ');
      expect(onButtonClick).toHaveBeenCalledTimes(2);
      await userEvent.tab();
      const link = screen.getByRole('link', { name: 'Linked ancestor' }).element();
      await expect.element(link).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => window.location.hash).toBe('#breadcrumb-native-target');
      expect(onLinkClick).toHaveBeenCalledTimes(1);
      expect(onLinkClick.mock.calls[0][0].defaultPrevented).toBe(false);
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  });

  test(`retains ${implementation} public Button-style Enter and Space handling on anchors`, async () => {
    const originalUrl = window.location.href;
    const onClick = vi.fn<AnchorClickHandler>((event) => event.preventDefault());
    const screen = await render(
      <CoreAIFluentProvider>
        <p>Pointer parking</p>
        <Root aria-label="Anchor key handling">
          <Item>
            <Control as="a" href="#breadcrumb-keyboard-target" onClick={onClick}>
              Linked ancestor
            </Control>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
    await userEvent.tab();
    await expect.element(screen.getByRole('link', { name: 'Linked ancestor' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    // Unlike Link, BreadcrumbButton retains the public Button hook's Space activation.
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(window.location.href).toBe(originalUrl);
  });

  test(`keeps ${implementation} current-page and disabled activation blocked while preserving native Tab order`, async () => {
    const originalUrl = window.location.href;
    const onClick = vi.fn();
    try {
      const screen = await render(
        <CoreAIFluentProvider>
          <p>Pointer parking</p>
          <Root aria-label="Unavailable ancestors">
            <Item>
              <Control as="button" disabled onClick={onClick}>
                Disabled button
              </Control>
            </Item>
            <Item>
              <Control as="a" href="#blocked-breadcrumb" disabled onClick={onClick}>
                Disabled anchor
              </Control>
            </Item>
            <Item>
              <Control as="a" current href="#blocked-breadcrumb" onClick={onClick}>
                Current anchor
              </Control>
            </Item>
            <Item>
              <Control as="button" current onClick={onClick}>
                Current button
              </Control>
            </Item>
            <Item>
              <Control as="button" disabled disabledFocusable onClick={onClick}>
                Focusable disabled button
              </Control>
            </Item>
            <Item>
              <Control
                as="a"
                href="#blocked-breadcrumb"
                disabled
                disabledFocusable
                onClick={onClick}
              >
                Focusable disabled anchor
              </Control>
            </Item>
          </Root>
          <button type="button">After path</button>
        </CoreAIFluentProvider>,
      );
      for (const name of ['Disabled anchor', 'Current anchor', 'Focusable disabled anchor']) {
        const anchor = screen.getByText(name, { exact: true }).element();
        expect(anchor.tagName).toBe('A');
        expect(anchor).not.toHaveAttribute('href');
        expect(anchor).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(anchor, { force: true });
      }
      const currentAnchor = screen.getByText('Current anchor', { exact: true }).element();
      expect(currentAnchor).toHaveAttribute('aria-current', 'page');
      await userEvent.click(screen.getByRole('button', { name: 'Disabled button', exact: true }), {
        force: true,
      });
      await userEvent.click(screen.getByText('Pointer parking', { exact: true }));
      await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
      for (const [role, name] of [
        ['button', 'Current button'],
        ['button', 'Focusable disabled button'],
        ['link', 'Focusable disabled anchor'],
      ] as const) {
        await userEvent.tab();
        const control =
          role === 'link'
            ? screen.getByText(name, { exact: true }).element()
            : screen.getByRole(role, { name, exact: true }).element();
        await expect.element(control).toHaveFocus();
        expect(control.matches(':hover')).toBe(false);
        await userEvent.keyboard('{Enter} ');
        await userEvent.click(control, { force: true });
        expect(onClick).not.toHaveBeenCalled();
        expect(window.location.href).toBe(originalUrl);
        await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
      }
      await userEvent.tab();
      await expect.element(screen.getByRole('button', { name: 'After path' })).toHaveFocus();
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  });

  test(`preserves ${implementation} explicit aria-current/aria-disabled overrides and callback-cancelled navigation`, async () => {
    const onClick = vi.fn<AnchorClickHandler>((event) => event.preventDefault());
    const originalUrl = window.location.href;
    const screen = await render(
      <CoreAIFluentProvider>
        <Root aria-label="Explicit current semantics">
          <Item>
            <Control
              as="a"
              current
              href="#cancelled-breadcrumb"
              aria-current="location"
              aria-disabled={false}
              onClick={onClick}
            >
              Current but navigable
            </Control>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const anchor = screen.getByRole('link', { name: 'Current but navigable' }).element();
    expect(anchor).toHaveAttribute('href', '#cancelled-breadcrumb');
    expect(anchor).toHaveAttribute('aria-current', 'location');
    expect(anchor).toHaveAttribute('aria-disabled', 'false');
    await userEvent.click(anchor);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].defaultPrevented).toBe(true);
    expect(window.location.href).toBe(originalUrl);
  });
}

test('runs the shared navigation flow through native hash navigation, app current-page updates, and blocked reactivation', async () => {
  const originalUrl = window.location.href;
  const onLinkClick = vi.fn();
  const onButtonClick = vi.fn();
  try {
    const screen = await render(
      <CoreAIFluentProvider>
        <BreadcrumbNavigationFlow onLinkClick={onLinkClick} onButtonClick={onButtonClick} />
      </CoreAIFluentProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start keyboard navigation' }));
    await userEvent.hover(screen.getByText(/Native Tab visits/));
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Home', exact: true })).toHaveFocus();
    await userEvent.tab();
    const projects = screen.getByRole('link', { name: 'Projects', exact: true }).element();
    await expect.element(projects).toHaveFocus();
    const targetHash = projects.getAttribute('href');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => window.location.hash).toBe(targetHash);
    await expect
      .element(screen.getByRole('status', { name: 'Navigation result' }))
      .toHaveTextContent('Page: Projects. Link callbacks: 1. Button callbacks: 0. Hash visits: 1.');
    expect(projects).toHaveAttribute('aria-current', 'page');
    expect(projects).not.toHaveAttribute('href');
    expect(onLinkClick).toHaveBeenCalledTimes(1);
    expect(onLinkClick.mock.calls[0][0].defaultPrevented).toBe(false);
    await userEvent.click(projects, { force: true });
    expect(onLinkClick).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Home', exact: true }));
    expect(onButtonClick).toHaveBeenCalledTimes(1);
    await expect
      .element(screen.getByRole('status', { name: 'Navigation result' }))
      .toHaveTextContent('Page: Home. Link callbacks: 1. Button callbacks: 1. Hash visits: 1.');
    await userEvent.click(screen.getByRole('button', { name: 'Home', exact: true }), {
      force: true,
    });
    expect(onButtonClick).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reset navigation demo' }));
    expect(window.location.href).toBe(originalUrl);
  } finally {
    window.history.replaceState(window.history.state, '', originalUrl);
  }
});

test('supports consumer-owned collapsed-ancestor composition without introducing a menu or overflow behavior', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <BreadcrumbCollapsedAncestors />
    </CoreAIFluentProvider>,
  );
  const reveal = screen.getByRole('button', { name: 'Show two hidden ancestors' });
  expect(reveal.element()).toHaveAttribute('aria-expanded', 'false');
  await expect.element(screen.getByRole('button', { name: 'Collapse ancestors' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Team', exact: true }).query()).toBeNull();
  await userEvent.click(reveal);
  await expect.element(screen.getByRole('link', { name: 'Team', exact: true })).toBeVisible();
  await expect.element(screen.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('All four breadcrumb entries shown.');
  expect(screen.getByRole('menu').query()).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Collapse ancestors' }));
  expect(screen.getByRole('link', { name: 'Team', exact: true }).query()).toBeNull();
  await expect.element(screen.getByRole('status')).toHaveTextContent('Two ancestors collapsed.');
});

test('does not suppress numeric CSS values, geometry, offsets, or missing slots in reports', () => {
  expect(
    compareBreadcrumbStyles(
      {
        'button.1.rect.width': '100.00',
        'button.1.padding-left': '4px',
        'divider.0.rect.height': '16.00',
      },
      {
        'button.1.rect.width': '100.01',
        'button.1.padding-left': '4.01px',
        'divider.0.rect.height': '16.51',
        'button.1.icon.present': 'true',
      },
    ),
  ).toEqual([
    { property: 'button.1.rect.width', legacy: '100.00', headless: '100.01' },
    { property: 'button.1.padding-left', legacy: '4px', headless: '4.01px' },
    { property: 'divider.0.rect.height', legacy: '16.00', headless: '16.51' },
    { property: 'button.1.icon.present', legacy: null, headless: 'true' },
  ]);
});
