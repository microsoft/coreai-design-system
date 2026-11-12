// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';

const surfaceProperties = [
  'display',
  'box-sizing',
  'overflow-x',
  'overflow-y',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'filter',
] as const;

const arrowProperties = [
  'position',
  'box-sizing',
  'z-index',
  'background-color',
  'background-clip',
  'width',
  'height',
  'border-bottom-left-radius',
  'transform',
  'translate',
] as const;

const arrowBeforeProperties = [
  'content',
  'display',
  'background-color',
  'margin-top',
  'margin-right',
  'width',
  'height',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-bottom-left-radius',
  'clip-path',
] as const;

export interface PopoverStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-arrow-gap' | 'native-arrow-centering';
}

export function getPopoverArrow(surface: Element): HTMLElement | null {
  return surface.hasAttribute('data-popover-surface')
    ? surface.querySelector<HTMLElement>(':scope > [data-arrow]')
    : surface.querySelector<HTMLElement>(':scope > div:first-child:not([data-popover-content])');
}

export function getComparisonPopover(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLElement {
  const fixture =
    container instanceof HTMLElement && container.hasAttribute('data-popover-comparison')
      ? container
      : container.querySelector<HTMLElement>('[data-popover-comparison]');
  const fixtureId = fixture?.dataset.popoverComparison;
  const surface = [
    ...document.querySelectorAll<HTMLElement>(`[data-popover-implementation="${implementation}"]`),
  ].find((candidate) => candidate.dataset.popoverFixture === fixtureId);
  if (!fixtureId || !surface) throw new Error(`Missing ${implementation} Popover fixture`);
  return surface;
}

export function getComparisonPopoverTrigger(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLButtonElement {
  const trigger = container.querySelector<HTMLButtonElement>(
    `[data-popover-trigger="${implementation}"]`,
  );
  if (!trigger) throw new Error(`Missing ${implementation} Popover trigger`);
  return trigger;
}

export function capturePopoverPlacement(
  surface: Element,
  trigger: Element,
): Record<string, string> {
  const floating = surface.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  let side: 'above' | 'below' | 'before' | 'after' | 'overlap' = 'overlap';
  let gap = 0;
  if (floating.bottom <= anchor.top) {
    side = 'above';
    gap = anchor.top - floating.bottom;
  } else if (floating.top >= anchor.bottom) {
    side = 'below';
    gap = floating.top - anchor.bottom;
  } else if (floating.right <= anchor.left) {
    side = 'before';
    gap = anchor.left - floating.right;
  } else if (floating.left >= anchor.right) {
    side = 'after';
    gap = floating.left - anchor.right;
  }
  const block = side === 'above' || side === 'below';
  return {
    'anchor.side': side,
    'anchor.gap': String(gap),
    'anchor.cross-offset': String(
      block
        ? (floating.left + floating.right - anchor.left - anchor.right) / 2
        : (floating.top + floating.bottom - anchor.top - anchor.bottom) / 2,
    ),
  };
}

export function capturePopoverStyles(surface: Element, trigger: Element): Record<string, string> {
  const values: Record<string, string> = capturePopoverPlacement(surface, trigger);
  const capture = (
    name: string,
    element: Element,
    properties: readonly string[],
    pseudo?: string,
  ) => {
    const computed = getComputedStyle(element, pseudo);
    for (const property of properties) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    if (!pseudo) {
      const rect = element.getBoundingClientRect();
      values[`${name}.rect.width`] = String(rect.width);
      values[`${name}.rect.height`] = String(rect.height);
    }
  };
  capture('surface', surface, surfaceProperties);
  capture('trigger', trigger, ['font-size', 'line-height', 'border-radius']);
  const arrow = getPopoverArrow(surface);
  values['arrow.present'] = String(Boolean(arrow));
  if (arrow) {
    capture('arrow', arrow, arrowProperties);
    capture('arrow::before', arrow, arrowBeforeProperties, '::before');
  }
  return values;
}

export function capturePopoverNativeContract(surface: Element): Record<string, string> {
  const computed = getComputedStyle(surface);
  const backdrop = getComputedStyle(surface, '::backdrop');
  return {
    element: surface.tagName.toLowerCase(),
    role: surface.getAttribute('role') ?? '',
    popover: surface.getAttribute('popover') ?? '',
    'popover-open': String(surface.matches(':popover-open')),
    modal: String(surface.matches(':modal')),
    'dialog.open': String(surface instanceof HTMLDialogElement && surface.open),
    position: computed.position,
    'position-anchor': computed.getPropertyValue('position-anchor'),
    'position-area': computed.getPropertyValue('position-area'),
    'position-try-fallbacks': computed.getPropertyValue('position-try-fallbacks'),
    'backdrop.background-color': backdrop.backgroundColor,
    'backdrop.pointer-events': backdrop.pointerEvents,
  };
}

export function comparePopoverStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  arrowHeight?: 6 | 8,
): PopoverStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => {
      if (legacy[property] === headless[property]) return false;
      // Rotated small arrows differ by 1/16384px between viewport coordinates.
      // Only their captured rectangle dimensions permit subpixel allocation noise.
      if (property === 'arrow.rect.width' || property === 'arrow.rect.height') {
        const before = Number(legacy[property]);
        const after = Number(headless[property]);
        if (Number.isFinite(before) && Number.isFinite(after) && Math.abs(before - after) <= 0.5) {
          return false;
        }
      }
      return true;
    })
    .map((property) => {
      let kind: PopoverStyleDifference['kind'] = 'unexpected';
      if (
        property === 'anchor.gap' &&
        arrowHeight !== undefined &&
        Number(legacy[property]) - Number(headless[property]) === arrowHeight
      ) {
        kind = 'native-arrow-gap';
      } else if (property === 'arrow.translate' && legacy[property] === 'none') {
        const side = headless['anchor.side'];
        const expected =
          side === 'above' || side === 'below'
            ? '-50%'
            : side === 'before' || side === 'after'
              ? '0px -50%'
              : undefined;
        if (expected !== undefined && headless[property] === expected) {
          kind = 'native-arrow-centering';
        }
      }
      return {
        property,
        legacy: legacy[property] ?? null,
        headless: headless[property] ?? null,
        kind,
      };
    });
}

export async function settlePopoverStyles(surface: Element): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    surface
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}

export async function refreshPopoverComparisonPositioning(
  legacySurface: HTMLElement,
  legacyTrigger: HTMLElement,
  headlessSurface: HTMLElement,
  headlessTrigger: HTMLElement,
  legacyPositioning: PositioningImperativeRef,
  headlessPositioning: PositioningImperativeRef,
): Promise<void> {
  // The legacy reference observes size and scroll, not ancestor-only relocation.
  // Await its documented completion event rather than sampling before the update.
  const geometry = () =>
    [legacySurface, legacyTrigger, headlessSurface, headlessTrigger].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    });
  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timeout);
        legacySurface.removeEventListener('fui-positioningend', positioned);
      };
      const positioned = () => {
        cleanup();
        resolve();
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Legacy Popover reference did not finish its positioning update'));
      }, 1000);
      legacySurface.addEventListener('fui-positioningend', positioned, { once: true });
      legacyPositioning.updatePosition();
      headlessPositioning.updatePosition();
    });
    const positionedGeometry = geometry();
    await nextFrame();
    const firstFrame = geometry();
    await nextFrame();
    const secondFrame = geometry();
    if (
      positionedGeometry.every((value, index) => value === firstFrame[index]) &&
      firstFrame.every((value, index) => value === secondFrame[index])
    ) {
      return;
    }
  }
  throw new Error('Popover comparison layout did not settle after positioning');
}
