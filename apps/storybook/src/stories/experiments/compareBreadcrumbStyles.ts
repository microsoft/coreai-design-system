// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = ['display', 'color', 'direction', 'padding-top', 'padding-left'] as const;
const listProperties = [
  'display',
  'align-items',
  'list-style-type',
  'margin-top',
  'margin-left',
  'padding-top',
  'padding-left',
  'column-gap',
] as const;
const itemProperties = [
  'display',
  'align-items',
  'box-sizing',
  'color',
  'text-wrap-mode',
  'font-size',
  'line-height',
] as const;
const buttonProperties = [
  'display',
  'align-items',
  'box-sizing',
  'justify-content',
  'min-width',
  'max-width',
  'height',
  'background-color',
  'color',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-wrap-mode',
  'text-decoration-line',
  'cursor',
  'outline-color',
  'outline-style',
  'outline-width',
  'box-shadow',
] as const;
const iconProperties = [
  'display',
  'align-items',
  'justify-content',
  'font-size',
  'line-height',
  'width',
  'height',
  'margin-inline-start',
  'margin-inline-end',
  'color',
] as const;

export interface BreadcrumbStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getBreadcrumbSlots(root: Element) {
  const list = root.querySelector<HTMLOListElement>(':scope > .fui-Breadcrumb__list');
  return {
    root,
    list,
    items: [...(list?.querySelectorAll<HTMLLIElement>(':scope > .fui-BreadcrumbItem') ?? [])],
    buttons: [
      ...(list?.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('.fui-BreadcrumbButton') ??
        []),
    ],
    dividers: [...(list?.querySelectorAll<HTMLLIElement>(':scope > .fui-BreadcrumbDivider') ?? [])],
  };
}

export function captureBreadcrumbStyles(root: HTMLElement): Record<string, string> {
  const slots = getBreadcrumbSlots(root);
  const values: Record<string, string> = {};
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
  };

  capture('root', root, rootProperties);
  values['list.present'] = String(Boolean(slots.list));
  if (slots.list) capture('list', slots.list, listProperties);
  values['items.count'] = String(slots.items.length);
  values['buttons.count'] = String(slots.buttons.length);
  values['dividers.count'] = String(slots.dividers.length);
  slots.items.forEach((item, index) => capture(`item.${index}`, item, itemProperties));
  slots.buttons.forEach((button, index) => {
    const prefix = `button.${index}`;
    capture(prefix, button, buttonProperties);
    const icon = button.querySelector<HTMLElement>(':scope > .fui-Button__icon');
    values[`${prefix}.icon.present`] = String(Boolean(icon));
    if (!icon) return;
    capture(`${prefix}.icon`, icon, iconProperties);
    for (const variant of ['regular', 'filled']) {
      const glyph = icon.querySelector(`.fui-Icon-${variant}`);
      values[`${prefix}.icon.${variant}.present`] = String(Boolean(glyph));
      if (glyph) {
        capture(`${prefix}.icon.${variant}`, glyph, ['display', 'font-size', 'fill']);
      }
    }
  });
  slots.dividers.forEach((divider, index) => {
    const prefix = `divider.${index}`;
    capture(prefix, divider, ['display', 'font-size', 'color', 'direction']);
    const glyph = divider.querySelector(':scope > svg');
    values[`${prefix}.glyph.present`] = String(Boolean(glyph));
    if (glyph) capture(`${prefix}.glyph`, glyph, ['display', 'font-size', 'fill']);
  });
  return values;
}

export function compareBreadcrumbStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): BreadcrumbStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonBreadcrumb(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-breadcrumb-implementation="${implementation}"] .fui-Breadcrumb`,
  );
  if (!root) throw new Error(`Missing ${implementation} Breadcrumb in comparison fixture`);
  return root;
}

export async function settleBreadcrumbStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
