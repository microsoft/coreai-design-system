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
  PresenceBadgeAvailability,
  PresenceBadgeComparison,
  presenceBadgeAccessibleStatus,
  presenceBadgeConsumerExample,
  presenceBadgeExamples,
  presenceBadgeStatuses,
  type PresenceBadgeExample,
} from '../../../apps/storybook/src/stories/experiments/PresenceBadgeComparison.js';
import {
  BadgeFixtureIcon,
  badgeIconRenderer,
  badgeRootRenderer,
} from '../../../apps/storybook/src/stories/experiments/BadgeComparison.js';
import {
  capturePresenceBadgeGlyph,
  capturePresenceBadgeStyles,
  comparePresenceBadgeStyles,
  getComparisonPresenceBadge,
  settlePresenceBadgeStyles,
} from '../../../apps/storybook/src/stories/experiments/comparePresenceBadgeStyles.js';
import {
  PresenceBadge,
  presenceBadgeClassNames,
  type PresenceBadgeProps,
  type PresenceBadgeStatus,
} from './PresenceBadge.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: PresenceBadgeExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<PresenceBadgeComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonPresenceBadge(screen.container, 'legacy');
  const headless = getComparisonPresenceBadge(screen.container, 'headless');
  await Promise.all([settlePresenceBadgeStyles(legacy), settlePresenceBadgeStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(presenceBadgeExamples)(
    `matches $name status styling, icon composition, and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        comparePresenceBadgeStyles(
          capturePresenceBadgeStyles(legacy),
          capturePresenceBadgeStyles(headless),
        ),
      ).toEqual([]);
      expect(capturePresenceBadgeGlyph(headless)).toEqual(capturePresenceBadgeGlyph(legacy));
    },
  );

  test(`lets consumer CSS override out-of-office status styling and slot margins in ${mode} mode`, async () => {
    const { headless } = await renderPair(presenceBadgeConsumerExample, theme);
    const values = capturePresenceBadgeStyles(headless);
    expect(values['root.color']).toBe('rgb(35, 95, 155)');
    expect(values['root.background-color']).toBe('rgb(245, 230, 215)');
    expect(values['root.border-radius']).toBe('3px');
    expect(values['icon.margin-left']).toBe('0px');
    expect(values['icon.margin-right']).toBe('0px');
  });
}

for (const outOfOffice of [false, true]) {
  test.each(presenceBadgeStatuses)(
    `preserves the current hook’s %s accessible name and glyph with outOfOffice=${outOfOffice}`,
    async (status) => {
      const { legacy, headless } = await renderPair({
        name: status,
        props: { status, outOfOffice },
      });
      const name =
        presenceBadgeAccessibleStatus[status] +
        (outOfOffice && status !== 'out-of-office' ? ' out of office' : '');
      expect(headless.root).toHaveAttribute('role', 'img');
      expect(headless.root).toHaveAccessibleName(name);
      expect(headless.root).toHaveAttribute('aria-label', name);
      expect(headless.root).toHaveAttribute('data-status', status);
      expect(headless.root.hasAttribute('data-out-of-office')).toBe(outOfOffice);
      expect(headless.root).not.toHaveAttribute('aria-live');
      expect(headless.root.tabIndex).toBe(-1);
      expect(headless.glyph).toHaveAttribute('aria-hidden', 'true');
      expect(capturePresenceBadgeGlyph(headless)).toEqual(capturePresenceBadgeGlyph(legacy));
    },
  );
}

test.each([
  { size: 'tiny', dimension: 6, viewBox: '0 0 10 10' },
  { size: 'extra-small', dimension: 10, viewBox: '0 0 10 10' },
  { size: 'small', dimension: 12, viewBox: '0 0 12 12' },
  { size: 'medium', dimension: 16, viewBox: '0 0 16 16' },
  { size: 'large', dimension: 20, viewBox: '0 0 20 20' },
  { size: 'extra-large', dimension: 28, viewBox: '0 0 20 20' },
] as const)(
  'uses the size-specific $size glyph and upstream missing-size treatment',
  async ({ size, dimension, viewBox }) => {
    const { legacy, headless } = await renderPair({ name: size, props: { size, status: 'away' } });
    expect(capturePresenceBadgeGlyph(headless)).toEqual(capturePresenceBadgeGlyph(legacy));
    expect(headless.glyph).toHaveAttribute('viewBox', viewBox);
    expect(headless.root.getBoundingClientRect().width).toBe(dimension);
    expect(headless.root.getBoundingClientRect().height).toBe(dimension);
    expect(headless.glyph?.getBoundingClientRect().width).toBe(dimension);
    expect(headless.glyph?.getBoundingClientRect().height).toBe(dimension);
  },
);

test.each([true, false])(
  'adds no CoreAI defaults with withComponentDefaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Undefined props',
        props: { size: undefined, status: undefined, outOfOffice: undefined },
      },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(
      comparePresenceBadgeStyles(
        capturePresenceBadgeStyles(legacy),
        capturePresenceBadgeStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-size', 'medium');
    expect(headless.root).toHaveAttribute('data-status', 'available');
    expect(headless.root).not.toHaveAttribute('data-out-of-office');
    expect(headless.root).toHaveAccessibleName('available');
  },
);

test.each(['ltr', 'rtl'] as const)(
  'keeps independent PresenceBadge styling in %s without importing Badge’s text foundation',
  async (dir) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Direction',
        props: { status: 'do-not-disturb', outOfOffice: true, size: 'extra-large' },
      },
      coreaiLightTheme,
      true,
      dir,
    );
    expect(
      comparePresenceBadgeStyles(
        capturePresenceBadgeStyles(legacy),
        capturePresenceBadgeStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).not.toHaveClass('fui-Badge');
    expect(headless.icon).not.toHaveClass('fui-Badge__icon');
    expect(getComputedStyle(headless.root).direction).toBe(dir);
  },
);

test('updates accessible status, out-of-office glyphs, and application-owned announcements in the shared availability fixture', async () => {
  const screen = await renderCoreAIComponent(<PresenceBadgeAvailability />);
  const root = screen.container.querySelector('.fui-PresenceBadge');
  if (!(root instanceof HTMLDivElement)) throw new Error('Missing availability badge');
  const availablePath = root.querySelector('path')?.getAttribute('d');
  expect(root).toHaveAccessibleName('available');
  await userEvent.click(screen.getByRole('button', { name: 'Set busy', exact: true }));
  expect(root).toHaveAccessibleName('busy');
  expect(root).toHaveAttribute('data-status', 'busy');
  const busyPath = root.querySelector('path')?.getAttribute('d');
  expect(busyPath).not.toBe(availablePath);
  await userEvent.click(screen.getByRole('button', { name: 'Out of office', exact: true }));
  expect(root).toHaveAccessibleName('busy out of office');
  expect(root).toHaveAttribute('data-out-of-office', '');
  const outOfOfficePath = root.querySelector('path')?.getAttribute('d');
  expect(outOfOfficePath).not.toBe(busyPath);
  const { headless: expected } = await renderPair({
    name: 'Expected unknown glyph',
    props: { status: 'unknown' },
  });
  expect(root.querySelector('path')?.getAttribute('d')).toBe(
    expected.glyph?.querySelector('path')?.getAttribute('d'),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Set out-of-office', exact: true }));
  expect(root).toHaveAccessibleName('out of office');
  expect(root).not.toHaveAttribute('aria-live');
  await expect
    .element(screen.getByText('Availability: out of office', { exact: true }))
    .toBeVisible();
});

test('preserves caller labels, native events, custom icon/content, refs, and classes without mutating supplied children', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const childRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const onIconClick = vi.fn();
  await renderCoreAIComponent(
    <PresenceBadge
      ref={rootRef}
      status="busy"
      outOfOffice
      size="large"
      role="status"
      aria-label="Presenting to the team"
      aria-live="polite"
      title="Current availability"
      className="consumer-root"
      data-consumer=""
      style={{ backgroundColor: 'rgb(210, 220, 230)' }}
      onClick={onClick}
      icon={{
        ref: iconRef,
        className: 'consumer-icon',
        onClick: onIconClick,
        children: <BadgeFixtureIcon />,
      }}
    >
      <span ref={childRef} className="consumer-content">
        !
      </span>
    </PresenceBadge>,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon || !childRef.current) throw new Error('Missing PresenceBadge refs');
  expect(root).toHaveClass(presenceBadgeClassNames.root, 'consumer-root');
  expect(icon).toHaveClass(presenceBadgeClassNames.icon, 'consumer-icon');
  expect(childRef.current.className).toBe('consumer-content');
  expect(root).toHaveAccessibleName('Presenting to the team');
  expect(root).toHaveAttribute('role', 'status');
  expect(root).toHaveAttribute('aria-live', 'polite');
  expect(root).toHaveAttribute('data-status', 'busy');
  expect(root).toHaveAttribute('data-out-of-office', '');
  expect(root).toHaveAttribute('data-consumer', '');
  expect(root).toHaveAttribute('title', 'Current availability');
  expect(root.style.backgroundColor).toBe('rgb(210, 220, 230)');
  expect(icon.querySelector('[data-parity-glyph]')).not.toBeNull();
  expect(icon.querySelectorAll('svg')).toHaveLength(1);
  for (const prop of ['size', 'status', 'outOfOffice']) expect(root).not.toHaveAttribute(prop);
  await userEvent.click(icon);
  expect(onIconClick).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
});

test('preserves external naming, current slot render functions, and explicit icon omission', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const screen = await renderCoreAIComponent(
    <>
      <span id="presence-name">Working remotely</span>
      <PresenceBadge
        ref={rootRef}
        aria-labelledby="presence-name"
        status="away"
        outOfOffice
        className="consumer-root"
        children={badgeRootRenderer}
        icon={{ ref: iconRef, className: 'consumer-icon', children: badgeIconRenderer }}
      />
      <PresenceBadge data-testid="no-icon" status="offline" icon={null} />
      <PresenceBadge data-testid="false-icon" status="offline" icon={{ children: false }} />
    </>,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon) throw new Error('Missing rendered PresenceBadge');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(root).toHaveAccessibleName('Working remotely');
  expect(root).toHaveAttribute('aria-label', 'away out of office');
  expect(root).toHaveClass(presenceBadgeClassNames.root, 'consumer-root');
  expect(icon).toHaveAttribute('data-rendered-icon', '');
  expect(icon).toHaveClass(presenceBadgeClassNames.icon, 'consumer-icon');
  expect(icon.querySelector('[data-parity-glyph]')).not.toBeNull();
  expect(root.querySelector('[data-consumer-root-child]')?.getAttribute('class')).toBeNull();
  expect(
    screen.getByTestId('no-icon').element().querySelector('.fui-PresenceBadge__icon'),
  ).toBeNull();
  expect(screen.getByTestId('false-icon').element().querySelector('svg')).toBeNull();
  expectTypeOf(PresenceBadge).toEqualTypeOf<ForwardRefComponent<PresenceBadgeProps>>();
  expectTypeOf<PresenceBadgeStatus>().toEqualTypeOf<NonNullable<PresenceBadgeProps['status']>>();
});
