// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface PersonaStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonPersona {
  root: HTMLDivElement;
  avatar: HTMLSpanElement | null;
  presence: HTMLDivElement | null;
  primaryText: HTMLSpanElement | null;
  secondaryText: HTMLSpanElement | null;
  tertiaryText: HTMLSpanElement | null;
  quaternaryText: HTMLSpanElement | null;
}

export function getPersonaSlots(root: HTMLDivElement): ComparisonPersona {
  return {
    root,
    avatar: root.querySelector<HTMLSpanElement>(':scope > .fui-Persona__avatar'),
    presence: root.querySelector<HTMLDivElement>(':scope > .fui-Persona__presence'),
    primaryText: root.querySelector<HTMLSpanElement>(':scope > .fui-Persona__primaryText'),
    secondaryText: root.querySelector<HTMLSpanElement>(':scope > .fui-Persona__secondaryText'),
    tertiaryText: root.querySelector<HTMLSpanElement>(':scope > .fui-Persona__tertiaryText'),
    quaternaryText: root.querySelector<HTMLSpanElement>(':scope > .fui-Persona__quaternaryText'),
  };
}

export function getComparisonPersona(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonPersona {
  const cell = container.querySelector(`[data-persona-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Persona');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} Persona`);
  return getPersonaSlots(root);
}

function captureElement(
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

export function capturePersonaStyles({ root }: ComparisonPersona): Record<string, string> {
  const slots = getPersonaSlots(root);
  const rect = root.getBoundingClientRect();
  const values: Record<string, string> = {};
  const coinProperties = [
    'display',
    'position',
    'align-self',
    'grid-row-start',
    'grid-column-start',
    'grid-column-end',
    'margin-inline-start',
    'margin-inline-end',
    'margin-block-end',
    'border-radius',
    'color',
    'background-color',
  ] as const;
  const textProperties = [
    'display',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'grid-row-start',
    'grid-column-start',
    'grid-column-end',
    'margin-block-start',
    'white-space',
    'overflow-x',
    'text-overflow',
  ] as const;
  for (const [name, element, properties] of [
    [
      'root',
      root,
      [
        'display',
        'grid-auto-flow',
        'grid-auto-rows',
        'grid-template-columns',
        'grid-template-rows',
        'justify-items',
        'direction',
      ],
    ],
    ['avatar', slots.avatar, coinProperties],
    ['presence', slots.presence, coinProperties],
    ['primaryText', slots.primaryText, textProperties],
    ['secondaryText', slots.secondaryText, textProperties],
    ['tertiaryText', slots.tertiaryText, textProperties],
    ['quaternaryText', slots.quaternaryText, textProperties],
  ] as const) {
    captureElement(values, name, element, properties, name === 'root' ? undefined : rect);
  }
  if (slots.avatar) {
    for (const [name, selector] of [
      ['avatar.initials', '.fui-Avatar__initials'],
      ['avatar.icon', '.fui-Avatar__icon'],
      ['avatar.image', '.fui-Avatar__image'],
    ] as const) {
      const element = slots.avatar.querySelector(selector);
      captureElement(values, name, element, [
        'display',
        'color',
        'background-color',
        'font-size',
        'line-height',
        'border-radius',
        'mask-image',
        ...(name === 'avatar.image' ? ['object-fit'] : []),
      ]);
      if (name === 'avatar.initials' && element) values[`${name}.text`] = element.textContent ?? '';
      if (element instanceof HTMLImageElement) {
        values[`${name}.hidden`] = String(element.hidden);
        values[`${name}.rendered`] = String(element.getClientRects().length > 0);
      }
    }
  }
  const presence = slots.presence ?? slots.avatar?.querySelector('.fui-PresenceBadge') ?? null;
  captureElement(values, 'status', presence, [
    'display',
    'position',
    'color',
    'background-color',
    'padding-top',
    'background-clip',
  ]);
  if (presence) values['status.aria-label'] = presence.getAttribute('aria-label') ?? '';
  return values;
}

export function comparePersonaStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): PersonaStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settlePersonaStyles({ root }: ComparisonPersona): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    [...root.querySelectorAll('img')].map((image) => image.decode().catch(() => undefined)),
  );
  for (const avatar of root.querySelectorAll('.fui-Avatar')) {
    getComputedStyle(avatar, '::before').getPropertyValue('content');
    getComputedStyle(avatar, '::after').getPropertyValue('content');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
