// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface ToastStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getToastSlots(root: Element) {
  return {
    root,
    title: root.querySelector<HTMLElement>(':scope > .fui-ToastTitle'),
    media: root.querySelector<HTMLElement>(':scope > .fui-ToastTitle__media'),
    action: root.querySelector<HTMLElement>(':scope > .fui-ToastTitle__action'),
    body: root.querySelector<HTMLElement>(':scope > .fui-ToastBody'),
    subtitle: root.querySelector<HTMLElement>(':scope > .fui-ToastBody__subtitle'),
    footer: root.querySelector<HTMLElement>(':scope > .fui-ToastFooter'),
    link: root.querySelector<HTMLElement>('.fui-ToastFooter .fui-Link'),
    button: root.querySelector<HTMLElement>('.fui-ToastFooter .fui-Button'),
  };
}

export function captureToastStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const origin = root.getBoundingClientRect();
  const capture = (name: string, element: Element, properties: readonly string[]) => {
    const computed = getComputedStyle(element);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.rect.width`] = rect.width.toFixed(2);
    values[`${name}.rect.height`] = rect.height.toFixed(2);
    values[`${name}.rect.left`] = (rect.left - origin.left).toFixed(2);
    values[`${name}.rect.top`] = (rect.top - origin.top).toFixed(2);
  };
  capture('root', root, [
    'display',
    'grid-template-columns',
    'padding-top',
    'padding-inline-start',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-radius',
    'box-shadow',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'background-color',
  ]);
  const slots = getToastSlots(root);
  for (const name of ['title', 'body', 'subtitle'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) {
      capture(name, element, [
        'display',
        'grid-column-start',
        'grid-column-end',
        'padding-top',
        'font-size',
        'font-weight',
        'line-height',
        'color',
        'word-break',
      ]);
    }
  }
  for (const name of ['media', 'action', 'footer'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) {
      capture(name, element, [
        'display',
        'align-items',
        'grid-column-start',
        'grid-column-end',
        'padding-top',
        'padding-inline-start',
        'padding-inline-end',
        'font-size',
        'color',
        'column-gap',
      ]);
    }
  }
  const glyph = slots.media?.querySelector('svg');
  values['glyph.present'] = String(Boolean(glyph));
  if (glyph) capture('glyph', glyph, ['display', 'width', 'height', 'fill']);
  for (const name of ['link', 'button'] as const) {
    const element = slots[name];
    values[`${name}.present`] = String(Boolean(element));
    if (element) {
      capture(name, element, [
        'display',
        'color',
        'font-size',
        'font-weight',
        'line-height',
        'min-width',
        'border-radius',
      ]);
    }
  }
  return values;
}

export function captureToasterStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const computed = getComputedStyle(root);
  for (const property of ['position', 'width', 'pointer-events'] as const) {
    values[`toaster.${property}`] = computed.getPropertyValue(property);
  }
  const rect = root.getBoundingClientRect();
  for (const property of ['top', 'left', 'width', 'height'] as const) {
    values[`toaster.rect.${property}`] = rect[property].toFixed(2);
  }
  const items = [...root.querySelectorAll<HTMLElement>(":scope > [role='listitem']")];
  values['toaster.items'] = String(items.length);
  if (items[0]) {
    const item = items[0];
    const itemStyles = getComputedStyle(item);
    for (const property of [
      'box-sizing',
      'margin-top',
      'pointer-events',
      'border-radius',
    ] as const) {
      values[`container.${property}`] = itemStyles.getPropertyValue(property);
    }
    const itemRect = item.getBoundingClientRect();
    values['container.rect.width'] = itemRect.width.toFixed(2);
    values['container.rect.height'] = itemRect.height.toFixed(2);
    values['container.rect.top'] = (itemRect.top - rect.top).toFixed(2);
    values['container.rect.left'] = (itemRect.left - rect.left).toFixed(2);
  }
  return values;
}

export function compareToastStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): ToastStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function getComparisonToast(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-toast-implementation="${implementation}"] [data-toast-root]`,
  );
  if (!root) throw new Error(`Missing ${implementation} Toast in shared fixture`);
  return root;
}

export function getPositionToaster(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
  position?: string,
): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-toast-position-implementation="${implementation}"][data-toaster-position]${
      position ? `[data-toaster-position="${position}"]` : ''
    }`,
  );
  if (!root) throw new Error(`Missing ${implementation} position Toaster`);
  return root;
}

export async function settleToastStyles(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  const animations = root.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return (
      effect instanceof KeyframeEffect &&
      effect.target instanceof Element &&
      (effect.target === root || root.contains(effect.target)) &&
      Number.isFinite(effect.getComputedTiming().endTime) &&
      animation.playState === 'running'
    );
  });
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))),
      new Promise<never>((_, reject) => {
        deadline = setTimeout(
          () => reject(new Error('Owned Toast animations did not settle')),
          3000,
        );
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
  let previous = '';
  let stableFrames = 0;
  for (let frame = 0; frame < 120; frame++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const rect = root.getBoundingClientRect();
    const geometry = [rect.top, rect.left, rect.width, rect.height].join(':');
    if (geometry === previous) {
      if (++stableFrames === 3) return;
    } else {
      stableFrames = 0;
      previous = geometry;
    }
  }
  throw new Error('Toast geometry did not settle');
}
