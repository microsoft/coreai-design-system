// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  Link as PrimitiveLink,
  LinkContextProvider,
  type LinkSlots as PrimitiveLinkSlots,
} from '@fluentui/react-headless-components-preview/link';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { Link as LegacyLink, coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  LinkComparison,
  LinkContentIcon,
  linkAppearances,
  linkConsumerExample,
  linkExamples,
  type LinkExample,
} from '../../../apps/storybook/src/stories/experiments/LinkComparison.js';
import {
  captureLinkStyles,
  compareLinkStyles,
  getComparisonLink,
  settleLinkStyles,
  type ComparisonLink,
} from '../../../apps/storybook/src/stories/experiments/compareLinkStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/LinkComparison.module.css';
import { Link, linkClassNames, type LinkProps, type LinkSlots } from './Link.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: LinkExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <>
      <div className={comparisonStyles.pointerParking} data-testid="pointer-parking" aria-hidden />
      <LinkComparison examples={[example]} />
    </>,
    { providerProps: { theme, withComponentDefaults, dir } },
  );
  const legacy = getComparisonLink(screen.container, 'legacy');
  const headless = getComparisonLink(screen.container, 'headless');
  // A retained pointer can hover a newly mounted link before any interaction in this test.
  await userEvent.hover(screen.getByTestId('pointer-parking'));
  for (const link of [legacy, headless]) expect(link.root.matches(':hover')).toBe(false);
  await Promise.all([settleLinkStyles(legacy), settleLinkStyles(headless)]);
  return { screen, legacy, headless };
}

async function capturePointerPress(link: ComparisonLink): Promise<Record<string, string>> {
  await userEvent.hover(link.root);
  expect(link.root.matches(':hover')).toBe(true);
  await settleLinkStyles(link);
  let onMouseDown: () => void = () => {};
  const pressed = new Promise<Record<string, string>>((resolve, reject) => {
    onMouseDown = () => {
      settleLinkStyles(link)
        .then(() => {
          if (!link.root.matches(':hover:active')) {
            throw new Error('Pointer press ended before the Link styles settled');
          }
          resolve(captureLinkStyles(link));
        })
        .catch(reject);
    };
    link.root.addEventListener('mousedown', onMouseDown, { once: true });
  });
  try {
    const [values] = await Promise.all([pressed, userEvent.click(link.root, { delay: 350 })]);
    return values;
  } finally {
    link.root.removeEventListener('mousedown', onMouseDown);
  }
}

test('retains the current public intrinsic-root, slot, and ref contracts', () => {
  expectTypeOf<React.ComponentProps<typeof Link>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveLink>['ref']
  >();
  expectTypeOf<LinkProps['as']>().toEqualTypeOf<'a' | 'button' | 'span' | undefined>();
  expectTypeOf<LinkSlots>().toEqualTypeOf<PrimitiveLinkSlots>();
});

for (const [mode, theme] of themes) {
  test.each(linkExamples)(
    `matches $name styles and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareLinkStyles(captureLinkStyles(legacy), captureLinkStyles(headless))).toEqual([]);
      expect(headless.root.tagName).toBe(legacy.root.tagName);
      expect(headless.root.getAttribute('aria-disabled')).toBe(
        legacy.root.getAttribute('aria-disabled'),
      );
      if (legacy.root instanceof HTMLAnchorElement && headless.root instanceof HTMLAnchorElement) {
        for (const attribute of ['href', 'target', 'rel']) {
          expect(headless.root.getAttribute(attribute)).toBe(legacy.root.getAttribute(attribute));
        }
      }
      if (example.backgroundAppearance) {
        expect(headless.root).toHaveAttribute(
          'data-background-appearance',
          example.backgroundAppearance,
        );
      }
      if (example.props.external) {
        expect(headless.externalIcon).toHaveAttribute('aria-hidden', 'true');
        expect(headless.externalIcon?.getAttribute('viewBox')).toBe(
          legacy.externalIcon?.getAttribute('viewBox'),
        );
        expect(headless.externalIcon?.querySelector('path')?.getAttribute('d')).toBe(
          legacy.externalIcon?.querySelector('path')?.getAttribute('d'),
        );
      }
    },
  );

  test.each(linkAppearances)(
    `matches %s hover and pointer press in ${mode} mode`,
    async (appearance) => {
      const onClick = vi.fn((event: React.MouseEvent<HTMLElement>) => event.preventDefault());
      const { legacy, headless } = await renderPair(
        {
          name: 'Hover and pointer press',
          props: {
            href: '#pointer-link',
            appearance,
            inline: true,
            children: 'Documentation',
            onClick,
          },
        },
        theme,
      );
      await userEvent.hover(legacy.root);
      expect(legacy.root.matches(':hover')).toBe(true);
      await settleLinkStyles(legacy);
      const hovered = captureLinkStyles(legacy);
      await userEvent.hover(headless.root);
      expect(headless.root.matches(':hover')).toBe(true);
      await settleLinkStyles(headless);
      expect(compareLinkStyles(hovered, captureLinkStyles(headless))).toEqual([]);
      expect(
        compareLinkStyles(await capturePointerPress(legacy), await capturePointerPress(headless)),
      ).toEqual([]);
      expect(onClick).toHaveBeenCalledTimes(2);
    },
  );

  test.each(linkAppearances)(
    `matches %s pure keyboard focus, Space press, and combined hover in ${mode} mode`,
    async (appearance) => {
      const onClick = vi.fn();
      const { screen, legacy, headless } = await renderPair(
        {
          name: 'Keyboard focus',
          props: { as: 'button', appearance, children: 'Open help', onClick },
        },
        theme,
      );
      await userEvent.hover(screen.getByTestId('pointer-parking'));
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(legacy.root).toHaveFocus();
      expect(legacy.root.matches(':hover')).toBe(false);
      await settleLinkStyles(legacy);
      const focused = captureLinkStyles(legacy);
      await userEvent.keyboard('[Space>]');
      expect(legacy.root.matches(':active')).toBe(true);
      await settleLinkStyles(legacy);
      const pressed = captureLinkStyles(legacy);
      await userEvent.keyboard('[/Space]');
      await userEvent.hover(legacy.root);
      expect(legacy.root.matches(':hover')).toBe(true);
      await settleLinkStyles(legacy);
      const focusedHover = captureLinkStyles(legacy);

      await userEvent.hover(screen.getByTestId('pointer-parking'));
      await userEvent.tab();
      await expect.element(headless.root).toHaveFocus();
      expect(headless.root.matches(':focus-visible')).toBe(true);
      expect(headless.root.matches(':hover')).toBe(false);
      await settleLinkStyles(headless);
      expect(compareLinkStyles(focused, captureLinkStyles(headless))).toEqual([]);
      await userEvent.keyboard('[Space>]');
      expect(headless.root.matches(':active')).toBe(true);
      await settleLinkStyles(headless);
      expect(compareLinkStyles(pressed, captureLinkStyles(headless))).toEqual([]);
      await userEvent.keyboard('[/Space]');
      await userEvent.hover(headless.root);
      expect(headless.root.matches(':focus-visible:hover')).toBe(true);
      await settleLinkStyles(headless);
      expect(compareLinkStyles(focusedHover, captureLinkStyles(headless))).toEqual([]);
      expect(onClick).toHaveBeenCalledTimes(2);
    },
  );

  test.each([
    { name: 'disabled', disabled: true },
    { name: 'disabled-focusable', disabledFocusable: true },
  ])(`keeps $name hover colors disabled in ${mode} mode`, async (disabledProps) => {
    const { name, ...props } = disabledProps;
    const { legacy, headless } = await renderPair(
      { name, props: { href: '#disabled-link', inline: true, ...props, children: 'Unavailable' } },
      theme,
    );
    await userEvent.hover(legacy.root);
    expect(legacy.root.matches(':hover')).toBe(true);
    await settleLinkStyles(legacy);
    const expected = captureLinkStyles(legacy);
    await userEvent.hover(headless.root);
    expect(headless.root.matches(':hover')).toBe(true);
    await settleLinkStyles(headless);
    expect(compareLinkStyles(expected, captureLinkStyles(headless))).toEqual([]);
    expect(getComputedStyle(headless.root).cursor).toBe('not-allowed');
    expect(getComputedStyle(headless.root).textDecorationLine).toBe('none');
  });

  test(`keeps a hovered disabled-focusable keyboard focus indicator visible in ${mode} mode`, async () => {
    const { screen, legacy, headless } = await renderPair(
      {
        name: 'Disabled-focusable focus priority',
        props: {
          href: '#disabled-focus',
          disabled: true,
          disabledFocusable: true,
          children: 'Unavailable',
        },
      },
      theme,
    );
    await userEvent.tab();
    await expect.element(legacy.root).toHaveFocus();
    expect(legacy.root.matches(':hover')).toBe(false);
    await settleLinkStyles(legacy);
    const focused = captureLinkStyles(legacy);
    await userEvent.tab();
    await expect.element(headless.root).toHaveFocus();
    expect(headless.root.matches(':focus-visible')).toBe(true);
    expect(headless.root.matches(':hover')).toBe(false);
    await settleLinkStyles(headless);
    expect(compareLinkStyles(focused, captureLinkStyles(headless))).toEqual([]);
    await userEvent.hover(headless.root);
    expect(headless.root.matches(':focus-visible:hover')).toBe(true);
    await settleLinkStyles(headless);
    // Unlike legacy disabled :hover rules, native keyboard focus must not lose its underline.
    expect(getComputedStyle(headless.root).textDecorationLine).toBe('underline');
    expect(getComputedStyle(headless.root).textDecorationStyle).toBe('double');
    expect(getComputedStyle(headless.root).color).toBe(getComputedStyle(legacy.root).color);
    expect(getComputedStyle(headless.root).cursor).toBe('not-allowed');
    await userEvent.hover(screen.getByTestId('pointer-parking'));
  });

  test(`lets ordinary consumer CSS override external, hover, disabled, and focus styles in ${mode} mode`, async () => {
    const { screen, headless } = await renderPair(linkConsumerExample, theme);
    const assertConsumerStyles = (link = headless) => {
      const values = captureLinkStyles(link);
      expect(values['root.color']).toBe('rgb(20, 90, 160)');
      expect(values['root.font-size']).toBe('18px');
      expect(values['root.font-weight']).toBe('600');
      expect(values['root.line-height']).toBe('24px');
      expect(values['root.column-gap']).toBe('12px');
      expect(values['root.text-decoration-style']).toBe('dashed');
      expect(values['root.text-decoration-thickness']).toBe('2px');
      expect(values['root.cursor']).toBe('crosshair');
      expect(values['externalIcon.font-size']).toBe('12px');
      expect(values['externalIcon.width']).toBe('12.00');
      if (!link.externalIcon) throw new Error('Missing consumer external glyph');
      expect(getComputedStyle(link.externalIcon).flexShrink).toBe('0');
    };
    assertConsumerStyles();
    await userEvent.hover(headless.root);
    expect(headless.root.matches(':hover')).toBe(true);
    await settleLinkStyles(headless);
    assertConsumerStyles();
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(headless.root).toHaveFocus();
    expect(headless.root.matches(':hover')).toBe(false);
    await settleLinkStyles(headless);
    assertConsumerStyles();

    await screen.rerender(
      <>
        <div
          className={comparisonStyles.pointerParking}
          data-testid="pointer-parking"
          aria-hidden
        />
        <LinkComparison
          examples={[
            {
              ...linkConsumerExample,
              props: { ...linkConsumerExample.props, disabled: true, disabledFocusable: true },
            },
          ]}
        />
      </>,
    );
    const disabled = getComparisonLink(screen.container, 'headless');
    await settleLinkStyles(disabled);
    expect(disabled.root).toHaveAttribute('data-disabled', '');
    assertConsumerStyles(disabled);
  });

  test(`keeps external glyphs trailing and aligned in RTL in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'External RTL',
        props: {
          href: '#rtl-link',
          external: true,
          children: <span data-link-text="">Documentation</span>,
        },
      },
      theme,
      true,
      'rtl',
    );
    expect(compareLinkStyles(captureLinkStyles(legacy), captureLinkStyles(headless))).toEqual([]);
    for (const link of [legacy, headless]) {
      const text = link.root.querySelector<HTMLElement>('[data-link-text]');
      if (!text || !link.externalIcon) throw new Error('Missing RTL text or external glyph');
      expect(getComputedStyle(link.root).direction).toBe('rtl');
      expect(getComputedStyle(link.externalIcon).transform).toBe('none');
      const textRect = text.getBoundingClientRect();
      const iconRect = link.externalIcon.getBoundingClientRect();
      expect(textRect.left - iconRect.right).toBeCloseTo(parseFloat(theme.spacingHorizontalXXS), 1);
    }
  });
}

test('preserves upstream native external-glyph shrinking in a constrained flex row', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Constrained external glyph',
    props: {
      href: '#constrained-link',
      external: true,
      children: 'Doc',
      style: { width: '44px', fontFamily: 'monospace', fontSize: '16px' },
    },
  });
  expect(compareLinkStyles(captureLinkStyles(legacy), captureLinkStyles(headless))).toEqual([]);
  for (const link of [legacy, headless]) {
    if (!link.externalIcon) throw new Error('Missing constrained external glyph');
    const computed = getComputedStyle(link.externalIcon);
    expect(link.externalIcon).toHaveAttribute('width', '1em');
    expect(computed.flexShrink).toBe('1');
    expect(link.externalIcon.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(link.externalIcon.getBoundingClientRect().width).toBeLessThan(
      parseFloat(computed.fontSize),
    );
  }
});

test.each([true, false])(
  'preserves omitted and undefined defaults with CoreAI defaults=%s',
  async (withComponentDefaults) => {
    const screen = await renderCoreAIComponent(
      <>
        <Link href="#defaults" data-testid="omitted">
          Documentation
        </Link>
        <Link
          href="#defaults"
          appearance={undefined}
          inline={undefined}
          external={undefined}
          target={undefined}
          rel={undefined}
          data-testid="undefined"
        >
          Documentation
        </Link>
        <Link href="#defaults" external data-testid="external">
          External documentation
        </Link>
      </>,
      { providerProps: { withComponentDefaults } },
    );
    for (const id of ['omitted', 'undefined']) {
      const link = screen.getByTestId(id).element();
      expect(link).toHaveAttribute('data-appearance', 'default');
      expect(link).not.toHaveAttribute('data-inline');
      expect(link).not.toHaveAttribute('data-external');
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
      expect(link.querySelector(`.${linkClassNames.externalIcon}`)).toBeNull();
    }
    const external = screen.getByTestId('external').element();
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(external.querySelector(`.${linkClassNames.externalIcon}`)).not.toBeNull();
  },
);

test('matches explicit external styling when CoreAI defaults are disabled', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'External defaults opt-out',
      props: { href: '#external', external: true, children: 'Documentation' },
    },
    coreaiLightTheme,
    false,
  );
  expect(compareLinkStyles(captureLinkStyles(legacy), captureLinkStyles(headless))).toEqual([]);
});

test('inherits public inline context and lets explicit false override it', async () => {
  const screen = await renderCoreAIComponent(
    <LinkContextProvider value={{ inline: true }}>
      <Link href="#context" data-testid="inherited">
        Documentation
      </Link>
      <Link href="#context" inline={undefined} data-testid="undefined">
        Documentation
      </Link>
      <Link href="#context" inline={false} data-testid="opt-out">
        Documentation
      </Link>
    </LinkContextProvider>,
  );
  for (const id of ['inherited', 'undefined']) {
    expect(screen.getByTestId(id).element()).toHaveAttribute('data-inline', '');
    expect(getComputedStyle(screen.getByTestId(id).element()).textDecorationLine).toBe('underline');
  }
  expect(screen.getByTestId('opt-out').element()).not.toHaveAttribute('data-inline');
  expect(getComputedStyle(screen.getByTestId('opt-out').element()).textDecorationLine).toBe('none');
});

test('preserves current anchor, button, and span refs, native props, caller classes, and child ownership', async () => {
  const anchorRef = React.createRef<HTMLAnchorElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const spanRef = vi.fn<(element: HTMLSpanElement | null) => void>();
  const childRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn((event: React.MouseEvent<HTMLElement>) => event.preventDefault());
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const screen = await renderCoreAIComponent(
    <>
      <div className={comparisonStyles.pointerParking} data-testid="pointer-parking" aria-hidden />
      <span id="link-hint">Opens the documentation.</span>
      <Link
        ref={anchorRef}
        href="#consumer-link"
        external
        inline
        appearance="subtle"
        className="consumer-link"
        data-testid="anchor"
        data-consumer="root"
        id="consumer-link"
        title="Project documentation"
        aria-describedby="link-hint"
        target="_self"
        rel="author"
        style={{ color: 'rgb(30, 80, 130)' }}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <span ref={childRef} className="consumer-link-child">
          Documentation
        </span>
        <LinkContentIcon />
      </Link>
      <Link as="button" ref={buttonRef} data-testid="button">
        Open help
      </Link>
      <Link as="span" ref={spanRef} data-testid="span">
        More details
      </Link>
    </>,
  );
  const root = screen.getByTestId('anchor').element();
  expect(anchorRef.current).toBe(root);
  expect(root).toBeInstanceOf(HTMLAnchorElement);
  expect(root).toHaveClass(linkClassNames.root, 'consumer-link');
  expect(root).toHaveAttribute('href', '#consumer-link');
  expect(root).toHaveAttribute('target', '_self');
  expect(root).toHaveAttribute('rel', 'author');
  expect(root).toHaveAttribute('data-consumer', 'root');
  expect(root).toHaveAttribute('data-appearance', 'subtle');
  expect(root).toHaveAttribute('data-inline', '');
  expect(root).toHaveAttribute('data-external', '');
  expect(root).toHaveAttribute('title', 'Project documentation');
  expect(root).toHaveAccessibleDescription('Opens the documentation.');
  expect(getComputedStyle(root).color).toBe('rgb(30, 80, 130)');
  expect(root.querySelector(`.${linkClassNames.externalIcon}`)).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  for (const child of [childRef.current, root.querySelector('[data-parity-child-icon]')]) {
    for (const marker of Object.values(linkClassNames)) expect(child).not.toHaveClass(marker);
  }
  for (const prop of ['appearance', 'inline', 'external']) expect(root).not.toHaveAttribute(prop);
  expect(buttonRef.current).toBe(screen.getByTestId('button').element());
  expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
  expect(buttonRef.current?.type).toBe('button');
  expect(spanRef).toHaveBeenCalledWith(screen.getByTestId('span').element());
  expect(screen.getByTestId('span').element()).toHaveAttribute('role', 'button');
  await userEvent.hover(screen.getByTestId('pointer-parking'));
  expect(root.matches(':hover')).toBe(false);
  await userEvent.tab();
  await expect.element(root).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onFocus).toHaveBeenCalledTimes(1);
  await userEvent.tab();
  expect(onBlur).toHaveBeenCalledTimes(1);
});

test.each([false, true])(
  'preserves caller root render functions with external=%s',
  async (external) => {
    const ref = React.createRef<HTMLAnchorElement>();
    const onClick = vi.fn((event: React.MouseEvent<HTMLElement>) => event.preventDefault());
    const onRender = vi.fn();
    const renderRoot: SlotRenderFunction<
      Extract<ExtractSlotProps<LinkSlots['root']>, { as?: 'a' }>
    > = (Component, props) => {
      onRender(Component, props);
      return (
        <Component {...props}>
          <span className="caller-rendered-child">Rendered documentation</span>
          {props.children}
        </Component>
      );
    };
    const warnings = vi.spyOn(console, 'warn');
    const screen = await renderCoreAIComponent(
      <Link
        href="#render-link"
        ref={ref}
        external={external}
        className="caller-root"
        data-testid="render-link"
        aria-label="Rendered documentation"
        onClick={onClick}
        children={renderRoot}
      />,
    );
    const root = screen.getByTestId('render-link').element();
    expect(onRender).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({
        href: '#render-link',
        'aria-label': 'Rendered documentation',
        className: expect.stringContaining('caller-root'),
      }),
    );
    expect(ref.current).toBe(root);
    expect(root).toHaveClass(linkClassNames.root, 'caller-root');
    expect(root.firstElementChild).toHaveClass('caller-rendered-child');
    for (const marker of Object.values(linkClassNames))
      expect(root.firstElementChild).not.toHaveClass(marker);
    expect(root.querySelectorAll(`.${linkClassNames.externalIcon}`)).toHaveLength(external ? 1 : 0);
    expect(warnings).not.toHaveBeenCalled();
    await userEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
  },
);

for (const [implementation, Component] of [
  ['legacy', LegacyLink],
  ['headless', Link],
] as const) {
  test(`preserves ${implementation} native anchor navigation and activation callbacks`, async () => {
    const originalUrl = window.location.href;
    const onClick = vi.fn();
    try {
      const screen = await renderCoreAIComponent(
        <>
          <Component href="#link-native-destination" target="_self" onClick={onClick}>
            Open documentation
          </Component>
          <span id="link-native-destination">Documentation destination</span>
        </>,
      );
      const link = screen.getByRole('link', { name: 'Open documentation' });
      await userEvent.click(link);
      await vi.waitFor(() => expect(window.location.hash).toBe('#link-native-destination'));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0].defaultPrevented).toBe(false);
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  });

  test(`keeps ${implementation} anchor Space native and activates only on Enter`, async () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLSpanElement>) => event.preventDefault());
    const screen = await renderCoreAIComponent(
      <>
        <div
          className={comparisonStyles.pointerParking}
          data-testid="pointer-parking"
          aria-hidden
        />
        <Component href="#keyboard-anchor" onClick={onClick}>
          Documentation
        </Component>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' }).element();
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.tab();
    await expect.element(link).toHaveFocus();
    expect(link.matches(':hover')).toBe(false);
    await userEvent.keyboard(' ');
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test(`keeps ${implementation} disabled links out of tab order while disabled-focusable links cannot activate`, async () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const originalUrl = window.location.href;
    try {
      const screen = await renderCoreAIComponent(
        <>
          <div
            className={comparisonStyles.pointerParking}
            data-testid="pointer-parking"
            aria-hidden
          />
          <Component href="#disabled-native" disabled onClick={onClick}>
            Disabled anchor
          </Component>
          <Component as="button" disabled onClick={onClick}>
            Disabled button
          </Component>
          <Component
            href="#disabled-native"
            disabled
            disabledFocusable
            onClick={onClick}
            onKeyDown={onKeyDown}
          >
            Focusable disabled anchor
          </Component>
          <Component
            href="#disabled-native"
            disabledFocusable
            onClick={onClick}
            onKeyDown={onKeyDown}
          >
            Focusable-only anchor
          </Component>
          <Component as="button" disabledFocusable onClick={onClick} onKeyDown={onKeyDown}>
            Focusable disabled button
          </Component>
          <button type="button">Next</button>
        </>,
      );
      const disabledAnchor = screen
        .getByRole('link', { name: 'Disabled anchor', exact: true })
        .element();
      const disabledButton = screen
        .getByRole('button', { name: 'Disabled button', exact: true })
        .element();
      expect(disabledAnchor).not.toHaveAttribute('href');
      expect(disabledButton).toHaveAttribute('disabled');
      await userEvent.click(disabledAnchor, { force: true });
      await userEvent.click(disabledButton, { force: true });
      await userEvent.hover(screen.getByTestId('pointer-parking'));
      for (const [role, name, keepsHref] of [
        ['link', 'Focusable disabled anchor', false],
        ['link', 'Focusable-only anchor', true],
        ['button', 'Focusable disabled button', false],
      ] as const) {
        const focusable = screen.getByRole(role, { name, exact: true }).element();
        await userEvent.tab();
        await expect.element(focusable).toHaveFocus();
        expect(focusable.matches(':hover')).toBe(false);
        expect(focusable).toHaveAttribute('aria-disabled', 'true');
        expect(focusable.hasAttribute('href')).toBe(keepsHref);
        if (focusable instanceof HTMLButtonElement) expect(focusable.disabled).toBe(false);
        onKeyDown.mockClear();
        await userEvent.keyboard('{Enter} ');
        await userEvent.click(focusable, { force: true });
        expect(onClick).not.toHaveBeenCalled();
        expect(onKeyDown).not.toHaveBeenCalled();
        expect(window.location.href).toBe(originalUrl);
        await userEvent.hover(screen.getByTestId('pointer-parking'));
      }
      await userEvent.tab();
      await expect.element(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  });

  test(`preserves ${implementation} button type, native submission, and submitter values`, async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn();
    const screen = await renderCoreAIComponent(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!(event.nativeEvent instanceof SubmitEvent))
            throw new Error('Missing native SubmitEvent');
          const submitter = event.nativeEvent.submitter;
          if (!(submitter instanceof HTMLButtonElement))
            throw new Error('Missing native button submitter');
          onSubmit(submitter, Object.fromEntries(new FormData(event.currentTarget, submitter)));
        }}
      >
        <input type="hidden" name="project" value="CoreAI" />
        <Component onClick={onClick}>Preview</Component>
        <Component as="button" type="submit" name="action" value="save" onClick={onClick}>
          Save project
        </Component>
        <Component as="button" type="submit" disabledFocusable onClick={onClick}>
          Disabled save
        </Component>
      </form>,
    );
    const preview = screen.getByRole('button', { name: 'Preview' }).element();
    const save = screen.getByRole('button', { name: 'Save project' }).element();
    expect(preview).toHaveAttribute('type', 'button');
    await userEvent.click(preview);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(save);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenCalledWith(save, { project: 'CoreAI', action: 'save' });
    await userEvent.click(screen.getByRole('button', { name: 'Disabled save' }), { force: true });
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test(`retains ${implementation} span keyboard activation and respects caller key handlers`, async () => {
    const activated = vi.fn();
    const customActivated = vi.fn();
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLElement>) => event.preventDefault());
    const screen = await renderCoreAIComponent(
      <>
        <div
          className={comparisonStyles.pointerParking}
          data-testid="pointer-parking"
          aria-hidden
        />
        <Component as="span" onClick={activated}>
          Expand details
        </Component>
        <Component as="span" onClick={customActivated} onKeyDown={onKeyDown}>
          Custom details
        </Component>
      </>,
    );
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Expand details' })).toHaveFocus();
    await userEvent.keyboard('{Enter} ');
    expect(activated).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Custom details' })).toHaveFocus();
    await userEvent.keyboard('{Enter} ');
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(customActivated).not.toHaveBeenCalled();
  });
}
