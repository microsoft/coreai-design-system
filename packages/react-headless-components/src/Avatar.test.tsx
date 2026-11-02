// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  Avatar as RawAvatar,
  AvatarContextProvider,
  type AvatarProps as HeadlessAvatarProps,
} from '@fluentui/react-headless-components-preview/avatar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  AvatarComparison,
  AvatarFixtureIcon,
  AvatarIdentityPlayground,
  AvatarImageFallbackFlow,
  avatarBadgeRenderer,
  avatarBrokenImage,
  avatarConsumerExample,
  avatarExamples,
  avatarIconRenderer,
  avatarInitialsRenderer,
  avatarInlineImage,
  avatarOutOfOfficeExample,
  avatarRootRenderer,
  type AvatarExample,
} from '../../../apps/storybook/src/stories/experiments/AvatarComparison.js';
import {
  captureAvatarStyles,
  compareAvatarStyles,
  getAvatarSlots,
  getComparisonAvatar,
  settleAvatarStyles,
} from '../../../apps/storybook/src/stories/experiments/compareAvatarStyles.js';
import {
  Avatar,
  avatarClassNames,
  type AvatarColor,
  type AvatarProps,
  type AvatarShape,
  type AvatarSize,
} from './Avatar.js';
import { presenceBadgeClassNames } from './PresenceBadge.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: AvatarExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<AvatarComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  await Promise.all(
    (['legacy', 'headless'] as const).map((implementation) =>
      settleAvatarStyles(getComparisonAvatar(screen.container, implementation)),
    ),
  );
  return {
    screen,
    legacy: getComparisonAvatar(screen.container, 'legacy'),
    headless: getComparisonAvatar(screen.container, 'headless'),
  };
}

test('reports every selected CSS string, offset, missing slot, and rectangle dimension exactly', () => {
  expect(
    compareAvatarStyles(
      {
        'root.width': '32.00',
        'root.height': '32.00',
        'initials.font-size': '14px',
        'badge.offset-left': '22.00',
        'image.present': 'true',
        'image.hidden': 'false',
      },
      {
        'root.width': '32.01',
        'root.height': '32.50',
        'initials.font-size': '14.01px',
        'badge.offset-left': '22.01',
        'image.present': 'false',
      },
    ),
  ).toEqual([
    { property: 'root.width', legacy: '32.00', headless: '32.01' },
    { property: 'root.height', legacy: '32.00', headless: '32.50' },
    { property: 'initials.font-size', legacy: '14px', headless: '14.01px' },
    { property: 'badge.offset-left', legacy: '22.00', headless: '22.01' },
    { property: 'image.present', legacy: 'true', headless: 'false' },
    { property: 'image.hidden', legacy: 'false', headless: null },
  ]);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(avatarExamples)(
    `matches $name selected slot styles, glyphs, and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareAvatarStyles(captureAvatarStyles(legacy), captureAvatarStyles(headless)),
      ).toEqual(example.intentionalDifferences ?? []);
      expect(headless.root.getAttribute('role')).toBe(legacy.root.getAttribute('role'));
      expect(headless.root.getAttribute('aria-label')).toBe(legacy.root.getAttribute('aria-label'));
      expect(headless.image?.alt).toBe(legacy.image?.alt);
      expect(headless.image?.hidden).toBe(legacy.image?.hidden);
      if (headless.badge) {
        expect(headless.badge).toHaveClass(presenceBadgeClassNames.root);
      }
    },
  );

  test(`retains the raw current out-of-office accessible status instead of styled v9’s truncated label in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(avatarOutOfOfficeExample, theme);
    const rawRef = React.createRef<HTMLSpanElement>();
    await renderCoreAIComponent(
      <RawAvatar
        ref={rawRef}
        name={avatarOutOfOfficeExample.props.name}
        badge={avatarOutOfOfficeExample.props.badge}
      />,
      { providerProps: { theme } },
    );
    const raw = rawRef.current;
    const rawBadge = raw?.querySelector('[id$="__badge"]');
    if (!raw || !rawBadge) throw new Error('Missing current raw Avatar presence fixture');
    expect(legacy.badge).toHaveAttribute('aria-label', 'available');
    expect(legacy.root).toHaveAccessibleName('Out Of Office available');
    expect(rawBadge).toHaveAttribute('aria-label', 'available out of office');
    expect(headless.badge).toHaveAttribute('aria-label', 'available out of office');
    expect(raw).toHaveAccessibleName('Out Of Office available out of office');
    expect(headless.root).toHaveAccessibleName('Out Of Office available out of office');
    expect(headless.badge).toHaveAttribute('data-out-of-office', '');
    expect(compareAvatarStyles(captureAvatarStyles(legacy), captureAvatarStyles(headless))).toEqual(
      avatarOutOfOfficeExample.intentionalDifferences,
    );
  });

  test(`lets ordinary consumer CSS override root, initials, and badge placement in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(avatarConsumerExample, theme);
    const values = captureAvatarStyles(headless);
    expect(values['root.width']).toBe('52.00');
    expect(values['root.height']).toBe('52.00');
    expect(values['root.border-radius']).toBe('3px');
    expect(values['initials.color']).toBe('rgb(35, 95, 155)');
    expect(values['initials.background-color']).toBe('rgb(245, 230, 215)');
    expect(values['initials.border-top-width']).toBe('2px');
    expect(values['badge.offset-left']).toBe('46.00');
    expect(values['badge.offset-top']).toBe('45.00');
    expect(compareAvatarStyles(captureAvatarStyles(legacy), values).length).toBeGreaterThan(0);
  });
}

test.each([true, false])(
  'retains actual CoreAI wrapper defaults and neutral-alt with withComponentDefaults=%s',
  async (withComponentDefaults) => {
    for (const color of [undefined, 'neutral', 'neutral-alt'] as const) {
      const { legacy, headless } = await renderPair(
        {
          name: 'Defaults',
          props: {
            name: 'Ada Lovelace',
            color,
            size: undefined,
            shape: undefined,
            activeAppearance: undefined,
          },
        },
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(
        compareAvatarStyles(captureAvatarStyles(legacy), captureAvatarStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute('data-size', '32');
      expect(headless.root).toHaveAttribute('data-shape', 'circular');
      expect(headless.root).toHaveAttribute('data-color', color ?? 'neutral');
      expect(headless.root).toHaveAttribute('data-active-appearance', 'ring');
      expect(headless.root).not.toHaveAttribute('data-active');
    }
  },
);

test.each(['ltr', 'rtl'] as const)(
  'matches %s initials order, logical badge offsets, and image/ring masks',
  async (dir) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Direction',
        props: {
          size: 64,
          shape: 'square',
          color: 'seafoam',
          name: 'Ada Lovelace',
          active: 'active',
          activeAppearance: 'ring-shadow',
          image: { src: avatarInlineImage },
          badge: { status: 'away' },
        },
      },
      coreaiLightTheme,
      true,
      dir,
    );
    const values = captureAvatarStyles(headless);
    expect(compareAvatarStyles(captureAvatarStyles(legacy), values)).toEqual([]);
    expect(headless.initials).toHaveTextContent(dir === 'rtl' ? 'LA' : 'AL');
    expect(values['badge.offset-left']).toBe(dir === 'rtl' ? '0.00' : '44.00');
    const imageInlineCenter = dir === 'rtl' ? '10px' : 'calc(100% - 10px)';
    const ringInlineCenter = dir === 'rtl' ? '16px' : 'calc(100% - 16px)';
    const stops = 'rgba(0, 0, 0, 0) 11.75px, rgb(255, 255, 255) 12.25px';
    expect(values['image.mask-image']).toBe(
      `radial-gradient(circle at ${imageInlineCenter} calc(100% - 10px), ${stops})`,
    );
    expect(values['::before.mask-image']).toBe(
      `radial-gradient(circle at ${ringInlineCenter} calc(100% - 16px), ${stops})`,
    );
    const rootStyle = getComputedStyle(headless.root);
    expect(rootStyle.getPropertyValue('--fui-Avatar-badgeAlign').trim()).toBe(
      dir === 'rtl' ? 'left' : 'right',
    );
    expect(rootStyle.getPropertyValue('--fui-Avatar-badgeRadius').trim()).toBe('10px');
    expect(rootStyle.getPropertyValue('--fui-Avatar-badgeGap').trim()).toBe('2px');
    expect(rootStyle.getPropertyValue('--fui-Avatar-ringWidth').trim()).toBe('3px');
    expect(values['::before.margin-left']).toBe('-6px');
    expect(values['::before.margin-right']).toBe('-6px');
    expect(headless.root).not.toHaveAttribute('data-tabster');
    expect(headless.root).not.toHaveAttribute('focusgroup');
  },
);

test('does not report document-origin offsets as shifted photos when failed images have no rendered box', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Hidden image geometry',
    props: { name: 'Ada Lovelace', image: { src: avatarBrokenImage } },
  });
  expect(legacy.root.getBoundingClientRect().left).not.toBe(
    headless.root.getBoundingClientRect().left,
  );
  for (const avatar of [legacy, headless]) {
    const image = avatar.image;
    if (!image) throw new Error('Missing failed image fixture');
    expect(image.hidden).toBe(true);
    expect(getComputedStyle(image).display).toBe('none');
    expect(image.getClientRects()).toHaveLength(0);
    const rect = image.getBoundingClientRect();
    expect([rect.left, rect.top, rect.width, rect.height]).toEqual([0, 0, 0, 0]);
    const values = captureAvatarStyles(avatar);
    expect(values['image.present']).toBe('true');
    expect(values['image.hidden']).toBe('true');
    expect(values['image.rendered']).toBe('false');
    expect(values['image.display']).toBe('none');
    expect(values['image.visibility']).toBe('visible');
    expect(values['image.width']).toBe('0.00');
    expect(values['image.height']).toBe('0.00');
    expect(values['image.offset-left']).toBe('not-rendered');
    expect(values['image.offset-top']).toBe('not-rendered');
  }
  expect(compareAvatarStyles(captureAvatarStyles(legacy), captureAvatarStyles(headless))).toEqual(
    [],
  );
});

test.each([0, 32])(
  'still reports real offsets for a rendered %spx photo, including a zero-area rendered box',
  async (size) => {
    const { headless } = await renderPair({
      name: 'Rendered image geometry',
      props: {
        name: 'Ada Lovelace',
        image: { src: avatarInlineImage, style: { width: size, height: size } },
      },
    });
    const image = headless.image;
    if (!image) throw new Error('Missing rendered photo fixture');
    expect(image.getClientRects()).toHaveLength(1);
    const resting = captureAvatarStyles(headless);
    expect(resting['image.hidden']).toBe('false');
    expect(resting['image.rendered']).toBe('true');
    expect(resting['image.width']).toBe(size.toFixed(2));
    expect(resting['image.height']).toBe(size.toFixed(2));
    expect(resting['image.offset-left']).toBe('0.00');
    expect(resting['image.offset-top']).toBe('0.00');
    image.style.insetInlineStart = '2px';
    expect(compareAvatarStyles(resting, captureAvatarStyles(headless))).toEqual([
      { property: 'image.offset-left', legacy: '0.00', headless: '2.00' },
    ]);
  },
);

test('does not canonicalize a hidden image when consumer CSS restores its rendered box', async () => {
  const { headless } = await renderPair({
    name: 'Consumer-visible failed image',
    props: { name: 'Ada Lovelace', image: { src: avatarBrokenImage } },
  });
  const image = headless.image;
  if (!image) throw new Error('Missing failed photo fixture');
  expect(image.hidden).toBe(true);
  image.style.display = 'block';
  image.style.insetInlineStart = '2px';
  const values = captureAvatarStyles(headless);
  expect(image.getClientRects()).toHaveLength(1);
  expect(values['image.present']).toBe('true');
  expect(values['image.hidden']).toBe('true');
  expect(values['image.rendered']).toBe('true');
  expect(values['image.display']).toBe('block');
  expect(values['image.width']).toBe('32.00');
  expect(values['image.height']).toBe('32.00');
  expect(values['image.offset-left']).toBe('2.00');
  expect(values['image.offset-top']).toBe('0.00');
});

test.each([
  { name: 'Katri Athokas', idForColor: undefined, expected: 'lilac' },
  { name: 'Katri Athokas', idForColor: 'id-123', expected: 'dark-green' },
  { name: 'Katri Athokas', idForColor: '', expected: 'dark-red' },
  { name: undefined, idForColor: 'Guest-23', expected: 'dark-red' },
] as const)(
  'resolves colorful name=$name id=$idForColor to the pinned visual palette $expected',
  async ({ name, idForColor, expected }) => {
    const { legacy, headless } = await renderPair({
      name: 'Hashed color',
      props: { name, idForColor, color: 'colorful', 'aria-label': 'Identity' },
    });
    expect(headless.root).toHaveAttribute('data-color', expected);
    expect(compareAvatarStyles(captureAvatarStyles(legacy), captureAvatarStyles(headless))).toEqual(
      [],
    );
  },
);

test.each(['ltr', 'rtl'] as const)(
  'keeps current hook-generated initials at size 16 and current name accessibility in %s',
  async (dir) => {
    const screen = await renderCoreAIComponent(
      <>
        <RawAvatar
          name="Ada Lovelace"
          data-testid="raw-avatar"
          initials={{ className: 'current-initials' }}
        />
        <Avatar
          name="Ada Lovelace"
          size={16}
          data-testid="styled-avatar"
          initials={{ className: 'current-initials' }}
        />
      </>,
      { providerProps: { dir } },
    );
    const raw = screen.getByTestId('raw-avatar').element();
    const styled = screen.getByTestId('styled-avatar').element();
    expect(styled.querySelector('.current-initials')?.textContent).toBe(
      raw.querySelector('.current-initials')?.textContent,
    );
    expect(styled.querySelector('.current-initials')).toHaveTextContent(
      dir === 'rtl' ? 'LA' : 'AL',
    );
    expect(styled).toHaveAccessibleName('Ada Lovelace');
  },
);

test('inherits only the public current Avatar context and lets explicit visual props override it', async () => {
  const screen = await renderCoreAIComponent(
    <AvatarContextProvider value={{ size: 64, shape: 'square' }}>
      <Avatar name="Inherited" data-testid="inherited" />
      <Avatar name="Undefined" size={undefined} shape={undefined} data-testid="undefined" />
      <Avatar name="Explicit" size={24} shape="circular" data-testid="explicit" />
    </AvatarContextProvider>,
  );
  for (const id of ['inherited', 'undefined']) {
    const root = screen.getByTestId(id).element();
    expect(root).toHaveAttribute('data-size', '64');
    expect(root).toHaveAttribute('data-shape', 'square');
    expect(root.getBoundingClientRect().width).toBe(64);
  }
  const explicit = screen.getByTestId('explicit').element();
  expect(explicit).toHaveAttribute('data-size', '24');
  expect(explicit).toHaveAttribute('data-shape', 'circular');
  expect(explicit.getBoundingClientRect().width).toBe(24);
});

test('preserves automatic and caller accessibility, including presence/activity and decorative usage', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Avatar name="Ada Lovelace" badge={{ status: 'available' }} active="active" />
      <Avatar initials="GH" />
      <Avatar name="Grace Hopper" aria-label="Me" active="inactive" badge={{ status: 'busy' }} />
      <span id="avatar-external-name">Moderator</span>
      <Avatar name="Grace Hopper" aria-labelledby="avatar-external-name" active="active" />
      <Avatar name="Decorative" role="presentation" aria-hidden data-testid="decorative" />
    </>,
  );
  const automatic = screen
    .getByRole('img', { name: 'Ada Lovelace available active', exact: true })
    .element();
  expect(automatic).toHaveAttribute('aria-label', 'Ada Lovelace');
  expect(automatic.getAttribute('aria-labelledby')).toContain(`${automatic.id}__badge`);
  expect(automatic.querySelector('[hidden]')).toHaveTextContent('active');
  expect(automatic.querySelector('.fui-PresenceBadge')).not.toHaveAttribute('aria-live');
  expect(automatic.tabIndex).toBe(-1);
  await expect.element(screen.getByRole('img', { name: 'GH', exact: true })).toBeVisible();
  const me = screen.getByRole('img', { name: 'Me', exact: true }).element();
  expect(me).not.toHaveAttribute('aria-labelledby');
  expect(me.querySelector('[id$="__active"]')).toBeNull();
  await expect.element(screen.getByRole('img', { name: 'Moderator', exact: true })).toBeVisible();
  expect(screen.getByTestId('decorative').element()).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByTestId('decorative').element()).toHaveAttribute('role', 'presentation');
});

test('keeps caller slot render functions, classes, owned markers, refs, and native events', async () => {
  const rootRef = React.createRef<HTMLSpanElement>();
  const initialsRef = React.createRef<HTMLSpanElement>();
  const imageRef = React.createRef<HTMLImageElement>();
  const badgeRef = React.createRef<HTMLDivElement>();
  const rootTargets: HTMLSpanElement[] = [];
  const onClick = vi.fn<NonNullable<AvatarProps['onClick']>>((event) => {
    rootTargets.push(event.currentTarget);
  });
  const onFocus = vi.fn<NonNullable<AvatarProps['onFocus']>>();
  const onKeyDown = vi.fn<NonNullable<AvatarProps['onKeyDown']>>();
  const onBadgeClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <Avatar
      ref={rootRef}
      name="Ada Lovelace"
      tabIndex={0}
      title="Open profile"
      className="consumer-root"
      children={avatarRootRenderer}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      initials={{
        ref: initialsRef,
        className: 'consumer-initials',
        children: avatarInitialsRenderer,
      }}
      image={{ ref: imageRef, className: 'consumer-image', src: avatarInlineImage }}
      badge={{
        ref: badgeRef,
        className: 'consumer-badge',
        status: 'away',
        children: avatarBadgeRenderer,
        onClick: onBadgeClick,
      }}
    />,
  );
  const root = rootRef.current;
  const initials = initialsRef.current;
  const image = imageRef.current;
  const badge = badgeRef.current;
  if (!root || !initials || !image || !badge) throw new Error('Missing Avatar native slot refs');
  await settleAvatarStyles(getAvatarSlots(root));
  expect(root).toHaveClass(avatarClassNames.root, 'consumer-root');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(root).toHaveAttribute('title', 'Open profile');
  expect(root).toHaveAccessibleName('Ada Lovelace away');
  expect(initials).toHaveClass(avatarClassNames.initials, 'consumer-initials');
  expect(initials).toHaveAttribute('data-rendered-initials', '');
  expect(initials).toHaveTextContent('AL');
  expect(image).toHaveClass(avatarClassNames.image, 'consumer-image');
  expect(image).toHaveAttribute('alt', '');
  expect(image).toHaveAttribute('role', 'presentation');
  expect(image).toHaveAttribute('aria-hidden', 'true');
  expect(badge).toHaveClass(avatarClassNames.badge, presenceBadgeClassNames.root, 'consumer-badge');
  expect(badge).toHaveAttribute('data-rendered-badge', '');
  expect(badge).toHaveAttribute('data-status', 'away');
  expect(badge).toHaveAttribute('data-size', 'extra-small');
  expect(badge).toHaveAccessibleName('away');
  await userEvent.tab();
  expect(root).toHaveFocus();
  expect(onFocus).toHaveBeenCalledOnce();
  await userEvent.keyboard('a');
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(onKeyDown.mock.calls[0][0].key).toBe('a');
  await userEvent.click(badge);
  expect(onBadgeClick).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
  expect(rootTargets).toEqual([root]);
  expect(screen.container.querySelector('.fui-Avatar__icon')).toBeNull();
});

test('retains the native icon render contract and does not decorate arbitrary icon children', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const onIconClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <Avatar
      aria-label="Team"
      icon={{ ref, className: 'consumer-icon', children: avatarIconRenderer, onClick: onIconClick }}
    />,
  );
  const icon = ref.current;
  if (!icon) throw new Error('Missing native icon ref');
  expect(icon).toHaveClass(avatarClassNames.icon, 'consumer-icon');
  expect(icon).toHaveAttribute('data-rendered-icon', '');
  expect(icon).toHaveAttribute('aria-hidden', 'true');
  const glyph = icon.querySelector('[data-avatar-fixture-glyph]');
  expect(glyph).not.toBeNull();
  expect(glyph).not.toHaveClass(avatarClassNames.icon);
  expect(icon.querySelectorAll('svg')).toHaveLength(1);
  await userEvent.click(icon);
  expect(onIconClick).toHaveBeenCalledOnce();
  expect(screen.getByRole('img', { name: 'Team' }).element()).toHaveAttribute('data-has-icon', '');
});

test('keeps owned-slot neutral styling and badge cutouts when a caller render function adds a wrapper', async () => {
  const { headless } = await renderPair({
    name: 'Direct initials',
    props: { name: 'Ada Lovelace', color: 'neutral-alt', badge: { status: 'available' } },
  });
  if (!headless.initials) throw new Error('Missing direct initials');
  const expected = getComputedStyle(headless.initials);
  const expectedBackground = expected.backgroundColor;
  const expectedMask = expected.maskImage;
  const ref = React.createRef<HTMLSpanElement>();
  const wrapped: typeof avatarInitialsRenderer = (Component, props) => (
    <span className="consumer-wrapper">
      <Component {...props} />
    </span>
  );
  await renderCoreAIComponent(
    <Avatar
      name="Ada Lovelace"
      color="neutral-alt"
      badge={{ status: 'available' }}
      initials={{ ref, className: 'consumer-initials', children: wrapped }}
    />,
  );
  const initials = ref.current;
  if (!initials) throw new Error('Missing wrapped initials ref');
  expect(initials.parentElement).toHaveClass('consumer-wrapper');
  expect(initials).toHaveClass(avatarClassNames.initials, 'consumer-initials');
  expect(initials).toHaveTextContent('AL');
  expect(getComputedStyle(initials).backgroundColor).toBe(expectedBackground);
  expect(getComputedStyle(initials).maskImage).toBe(expectedMask);
  expect(initials.getBoundingClientRect().width).toBe(32);
  expect(initials.parentElement).not.toHaveClass(avatarClassNames.initials);
});

test('keeps real native image load/error callbacks, the image ref, fallback, and source recovery', async () => {
  const ref = React.createRef<HTMLImageElement>();
  const targets: HTMLImageElement[] = [];
  const onLoad = vi.fn<React.ReactEventHandler<HTMLImageElement>>((event) =>
    targets.push(event.currentTarget),
  );
  const onError = vi.fn<React.ReactEventHandler<HTMLImageElement>>((event) =>
    targets.push(event.currentTarget),
  );
  const props: AvatarProps = {
    name: 'Ada Lovelace',
    image: { ref, src: avatarInlineImage, onLoad, onError },
  };
  const screen = await renderCoreAIComponent(<Avatar {...props} />);
  await expect.poll(() => onLoad.mock.calls.length).toBe(1);
  const image = ref.current;
  if (!image) throw new Error('Missing Avatar image ref');
  expect(image.naturalWidth).toBe(80);
  expect(image.hidden).toBe(false);
  expect(image.alt).toBe('');
  await screen.rerender(
    <Avatar name="Ada Lovelace" image={{ ref, src: avatarBrokenImage, onLoad, onError }} />,
  );
  await expect.poll(() => onError.mock.calls.length).toBe(1);
  await expect.poll(() => image.hidden).toBe(true);
  expect(ref.current).toBe(image);
  expect(screen.container.querySelector('.fui-Avatar__initials')).toHaveTextContent('AL');
  await screen.rerender(<Avatar {...props} />);
  await expect.poll(() => onLoad.mock.calls.length).toBe(2);
  await expect.poll(() => image.hidden).toBe(false);
  expect(ref.current).toBe(image);
  expect(targets).toEqual([image, image, image]);
});

test('preserves image/initials/icon priority, explicit omission, resolved attributes, and visual-prop filtering', async () => {
  const screen = await renderCoreAIComponent(
    <Avatar
      name="Ada Lovelace"
      initials="CUSTOM"
      icon={<AvatarFixtureIcon />}
      image={{ src: avatarInlineImage }}
      size={64}
      shape="square"
      color="brand"
      idForColor="stable-id"
      activeAppearance="ring-shadow"
      data-size="999"
    />,
  );
  let root = screen.container.querySelector<HTMLSpanElement>('.fui-Avatar');
  if (!root) throw new Error('Missing priority Avatar');
  expect(root).toHaveAttribute('data-size', '64');
  expect(root).toHaveAttribute('data-shape', 'square');
  expect(root).toHaveAttribute('data-color', 'brand');
  expect(root).toHaveAttribute('data-active-appearance', 'ring-shadow');
  expect(root).toHaveAttribute('data-has-image', '');
  expect(root).toHaveAttribute('data-has-initials', '');
  expect(root).not.toHaveAttribute('data-has-icon');
  expect(root.querySelector('.fui-Avatar__initials')).toHaveTextContent('CUSTOM');
  for (const attribute of ['size', 'shape', 'color', 'idforcolor', 'activeappearance']) {
    expect(root).not.toHaveAttribute(attribute);
  }
  await screen.rerender(
    <Avatar
      name="Ada Lovelace"
      initials={null}
      image={{ src: '' }}
      icon={<AvatarFixtureIcon />}
      badge={null}
    />,
  );
  root = screen.container.querySelector<HTMLSpanElement>('.fui-Avatar');
  if (!root) throw new Error('Missing rerendered Avatar');
  expect(root.querySelector('.fui-Avatar__image')).toBeNull();
  expect(root.querySelector('.fui-Avatar__initials')).toBeNull();
  expect(root.querySelector('[data-avatar-fixture-glyph]')).not.toBeNull();
  expect(root).toHaveAttribute('data-has-icon', '');
  expect(root).not.toHaveAttribute('data-has-badge');
  expect(root).not.toHaveAttribute('data-badge-size');
  await screen.rerender(<Avatar aria-label="Empty guest" icon={{ children: null }} />);
  expect(screen.container.querySelector('.fui-Avatar__icon')).not.toBeNull();
  expect(screen.container.querySelector('svg')).toBeNull();
  await screen.rerender(<Avatar aria-label="Empty guest" icon={null} />);
  expect(screen.container.querySelector('.fui-Avatar__icon')).toBeNull();
});

test('runs the shared image-fallback flow through named initials, failed guest glyph, and recovery', async () => {
  const screen = await renderCoreAIComponent(<AvatarImageFallbackFlow size={64} />);
  const getRoot = () => {
    const root = screen.container.querySelector<HTMLSpanElement>('.fui-Avatar');
    if (!root) throw new Error('Missing flow Avatar');
    return getAvatarSlots(root);
  };
  expect(getRoot().initials).toHaveTextContent('AL');
  await userEvent.click(screen.getByRole('button', { name: 'Load photo' }));
  await expect
    .element(screen.getByRole('status', { name: 'Image events' }))
    .toHaveTextContent('Loads: 1; errors: 0');
  expect(getRoot().image?.naturalWidth).toBe(80);
  expect(getRoot().image?.hidden).toBe(false);
  await userEvent.click(screen.getByRole('button', { name: 'Break photo' }));
  await expect.poll(() => getRoot().image?.hidden).toBe(true);
  expect(getRoot().initials).toHaveTextContent('AL');
  await userEvent.click(screen.getByRole('button', { name: 'Use guest identity' }));
  expect(getRoot().root).toHaveAccessibleName('Guest avatar');
  expect(getRoot().initials).toBeNull();
  expect(getRoot().icon?.querySelector('svg')).not.toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Load photo' }));
  await expect
    .element(screen.getByRole('status', { name: 'Image events' }))
    .toHaveTextContent('Loads: 2; errors: 1');
  await expect.poll(() => getRoot().image?.hidden).toBe(false);
  expect(getRoot().icon).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
  expect(getRoot().image).toBeNull();
  expect(getRoot().icon?.querySelector('svg')).not.toBeNull();
});

test('updates shared identity-flow initials, colorful palette, activity name, and application announcement', async () => {
  const screen = await renderCoreAIComponent(
    <AvatarIdentityPlayground color="colorful" badge={{ status: 'available' }} />,
  );
  const input = screen.getByRole('textbox', { name: 'Display name' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Grace Hopper');
  const root = screen.container.querySelector<HTMLSpanElement>('.fui-Avatar');
  if (!root) throw new Error('Missing identity-flow Avatar');
  expect(root).toHaveAttribute('data-color', 'beige');
  expect(root.querySelector('.fui-Avatar__initials')).toHaveTextContent('GH');
  expect(root).toHaveAccessibleName('Grace Hopper available');
  await userEvent.click(screen.getByRole('button', { name: 'Speaking' }));
  expect(root).toHaveAttribute('data-active', 'active');
  expect(root).toHaveAccessibleName('Grace Hopper available active');
  await expect.element(screen.getByText('Grace Hopper is speaking')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Speaking' }));
  expect(root).not.toHaveAttribute('data-active');
});

test('exposes the current ForwardRefComponent and native slot/event contracts without widening void image children', () => {
  expectTypeOf(Avatar).toEqualTypeOf<ForwardRefComponent<AvatarProps>>();
  expectTypeOf<AvatarProps['image']>().toEqualTypeOf<HeadlessAvatarProps['image']>();
  expectTypeOf<AvatarProps['initials']>().toEqualTypeOf<HeadlessAvatarProps['initials']>();
  expectTypeOf<AvatarProps['icon']>().toEqualTypeOf<HeadlessAvatarProps['icon']>();
  expectTypeOf<AvatarProps['onClick']>().toEqualTypeOf<HeadlessAvatarProps['onClick']>();
  expectTypeOf<React.ComponentProps<typeof Avatar>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof RawAvatar>['ref']
  >();
  expectTypeOf<AvatarColor>().toEqualTypeOf<NonNullable<AvatarProps['color']>>();
  expectTypeOf<AvatarSize>().toEqualTypeOf<NonNullable<AvatarProps['size']>>();
  expectTypeOf<AvatarShape>().toEqualTypeOf<NonNullable<AvatarProps['shape']>>();
});
