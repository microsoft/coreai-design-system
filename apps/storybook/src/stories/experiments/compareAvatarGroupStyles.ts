// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import type { AvatarGroupExample } from './AvatarGroupComparison.js';
import {
  capturePopoverNativeContract,
  capturePopoverPlacement,
  refreshPopoverComparisonPositioning,
} from './comparePopoverStyles.js';

export interface ComparisonAvatarGroup {
  root: HTMLDivElement;
  items: HTMLElement[];
  trigger: HTMLButtonElement | null;
  surface: HTMLElement | null;
}

export interface AvatarGroupStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'current-small-initials' | 'consumer-cascade';
}

export function getComparisonAvatarGroup(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonAvatarGroup {
  const fixture = container.querySelector<HTMLElement>('[data-avatar-group-comparison]');
  const fixtureId = fixture?.dataset.avatarGroupComparison;
  const cell = fixture?.querySelector(`[data-avatar-group-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-AvatarGroup');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} AvatarGroup`);
  const surface =
    [...document.querySelectorAll<HTMLElement>('[data-avatar-group-surface-implementation]')].find(
      (candidate) =>
        candidate.dataset.avatarGroupSurfaceImplementation === implementation &&
        candidate.dataset.avatarGroupFixture === fixtureId,
    ) ?? null;
  return {
    root,
    items: [...root.querySelectorAll<HTMLElement>(':scope > .fui-AvatarGroupItem')],
    trigger: root.querySelector<HTMLButtonElement>('[data-avatar-group-trigger]'),
    surface,
  };
}

function capture(
  values: Record<string, string>,
  name: string,
  element: Element | null,
  properties: readonly string[],
  relativeTo?: DOMRect,
) {
  values[`${name}.present`] = String(Boolean(element));
  if (!element) return;
  const style = getComputedStyle(element);
  for (const property of properties)
    values[`${name}.${property}`] = style.getPropertyValue(property);
  const rect = element.getBoundingClientRect();
  values[`${name}.width`] = rect.width.toFixed(2);
  values[`${name}.height`] = rect.height.toFixed(2);
  if (relativeTo) {
    values[`${name}.offset-left`] = (rect.left - relativeTo.left).toFixed(2);
    values[`${name}.offset-top`] = (rect.top - relativeTo.top).toFixed(2);
  }
}

function captureItem(
  values: Record<string, string>,
  name: string,
  item: HTMLElement,
  parent: DOMRect,
) {
  capture(
    values,
    name,
    item,
    [
      'display',
      'position',
      'flex-shrink',
      'border-radius',
      'box-shadow',
      'margin-inline-start',
      'padding-top',
      'padding-right',
      'clip-path',
      'transform',
      'transform-origin',
    ],
    parent,
  );
  const avatar = item.querySelector<HTMLElement>(':scope > .fui-AvatarGroupItem__avatar');
  capture(values, `${name}.avatar`, avatar, [
    'display',
    'position',
    'border-radius',
    'font-size',
    'font-weight',
    'opacity',
  ]);
  for (const [part, selector] of [
    ['initials', '.fui-Avatar__initials'],
    ['icon', '.fui-Avatar__icon'],
    ['image', '.fui-Avatar__image'],
    ['badge', '.fui-PresenceBadge'],
  ] as const) {
    const element = avatar?.querySelector(selector) ?? null;
    capture(values, `${name}.${part}`, element, [
      'display',
      'color',
      'background-color',
      'border-radius',
      'font-size',
    ]);
    if (part === 'initials' && element) values[`${name}.initials.text`] = element.textContent ?? '';
  }
  capture(
    values,
    `${name}.overflowLabel`,
    item.querySelector(':scope > .fui-AvatarGroupItem__overflowLabel'),
    ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'margin-inline-start'],
  );
}

export function captureAvatarGroupStyles(group: ComparisonAvatarGroup): Record<string, string> {
  const values: Record<string, string> = {};
  const rect = group.root.getBoundingClientRect();
  capture(values, 'root', group.root, [
    'display',
    'position',
    'direction',
    'clip-path',
    'background-color',
  ]);
  values['inline.count'] = String(group.items.length);
  group.items.forEach((item, index) => captureItem(values, `inline.${index}`, item, rect));
  capture(
    values,
    'trigger',
    group.trigger,
    [
      'display',
      'position',
      'margin-inline-start',
      'border-radius',
      'border-top-color',
      'border-top-width',
      'border-top-style',
      'color',
      'background-color',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'box-shadow',
    ],
    rect,
  );
  if (group.trigger) {
    values['trigger.text'] = group.trigger.textContent ?? '';
    const glyph = group.trigger.querySelector('svg');
    capture(values, 'trigger.glyph', glyph, ['display', 'width', 'height']);
    if (glyph) values['trigger.glyph.path'] = glyph.querySelector('path')?.getAttribute('d') ?? '';
  }
  capture(values, 'surface', group.surface, [
    'box-sizing',
    'color',
    'background-color',
    'border-top-color',
    'border-top-width',
    'border-radius',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'min-height',
    'max-height',
    'overflow-x',
    'overflow-y',
    'filter',
  ]);
  const content =
    group.surface?.querySelector<HTMLElement>('.fui-AvatarGroupPopover__content') ?? null;
  capture(values, 'content', content, [
    'display',
    'flex-direction',
    'list-style-type',
    'margin-top',
    'padding-top',
  ]);
  const overflow = content
    ? [...content.querySelectorAll<HTMLElement>(':scope > .fui-AvatarGroupItem')]
    : [];
  values['overflow.count'] = String(overflow.length);
  if (content) {
    const parent = content.getBoundingClientRect();
    overflow.forEach((item, index) => captureItem(values, `overflow.${index}`, item, parent));
  }
  return values;
}

export function compareAvatarGroupStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  example?: AvatarGroupExample,
): AvatarGroupStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => {
      let kind: AvatarGroupStyleDifference['kind'] = 'unexpected';
      if (
        example?.currentSmallInitials &&
        property === 'inline.0.initials.text' &&
        legacy[property] === 'A' &&
        headless[property] === (headless['root.direction'] === 'rtl' ? 'LA' : 'AL')
      ) {
        kind = 'current-small-initials';
      }
      if (
        example?.consumer &&
        (((/^(inline|overflow)\.\d+\.(avatar|initials)\.border-radius$/.test(property) ||
          property === 'trigger.border-radius') &&
          headless[property] === '3px') ||
          (/^(inline|overflow)\.\d+\.initials\.color$/.test(property) &&
            headless[property] === 'rgb(35, 95, 155)') ||
          (/^(inline|overflow)\.\d+\.initials\.background-color$/.test(property) &&
            headless[property] === 'rgb(195, 220, 245)') ||
          (/^overflow\.\d+\.overflowLabel\.color$/.test(property) &&
            headless[property] === 'rgb(130, 45, 80)') ||
          (property === 'trigger.border-top-color' && headless[property] === 'rgb(35, 95, 155)'))
      ) {
        kind = 'consumer-cascade';
      }
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind,
      };
    });
}

export function captureAvatarGroupNativeContract(
  group: ComparisonAvatarGroup,
): Record<string, string> {
  return {
    groupRole: group.root.getAttribute('role') ?? '',
    focusgroup: group.root.getAttribute('focusgroup') ?? 'none',
    triggerExpanded: group.trigger?.getAttribute('aria-expanded') ?? '',
    triggerDetails: group.trigger?.getAttribute('aria-details') ?? '',
    overflowRoles:
      group.surface?.querySelector('.fui-AvatarGroupPopover__content')?.getAttribute('role') ?? '',
    ...(group.surface ? capturePopoverNativeContract(group.surface) : {}),
    ...(group.surface && group.trigger
      ? capturePopoverPlacement(group.surface, group.trigger)
      : {}),
  };
}

export async function settleAvatarGroupStyles(...groups: ComparisonAvatarGroup[]): Promise<void> {
  await document.fonts.ready;
  const roots = groups.flatMap((group) => [group.root, ...(group.surface ? [group.surface] : [])]);
  await Promise.all(
    roots.flatMap((root) =>
      [...root.querySelectorAll('img')].map((image) => image.decode().catch(() => undefined)),
    ),
  );
  for (const root of roots) {
    for (const avatar of root.querySelectorAll('.fui-Avatar')) {
      getComputedStyle(avatar, '::before').getPropertyValue('content');
      getComputedStyle(avatar, '::after').getPropertyValue('content');
    }
  }
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    roots.flatMap((root) =>
      root
        .getAnimations({ subtree: true })
        .filter((animation) =>
          Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

export async function refreshAvatarGroupPositioning(
  legacy: ComparisonAvatarGroup,
  headless: ComparisonAvatarGroup,
  legacyPositioning: PositioningImperativeRef | null,
  headlessPositioning: PositioningImperativeRef | null,
): Promise<void> {
  if (!legacy.surface || !headless.surface) return;
  if (!legacy.trigger || !headless.trigger || !legacyPositioning || !headlessPositioning)
    throw new Error('AvatarGroup public positioning handles are unavailable');
  await refreshPopoverComparisonPositioning(
    legacy.surface,
    legacy.trigger,
    headless.surface,
    headless.trigger,
    legacyPositioning,
    headlessPositioning,
  );
}
