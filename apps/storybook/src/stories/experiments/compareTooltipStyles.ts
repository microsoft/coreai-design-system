// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { TooltipExample } from './TooltipComparison.js';
import { capturePopoverNativeContract, capturePopoverPlacement } from './comparePopoverStyles.js';

export {
  refreshPopoverComparisonPositioning as refreshTooltipComparisonPositioning,
  settlePopoverStyles as settleTooltipStyles,
} from './comparePopoverStyles.js';

const contentProperties = [
  'display',
  'box-sizing',
  'max-width',
  'cursor',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'overflow-wrap',
  'border-radius',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
  'color',
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
  'width',
  'height',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-bottom-left-radius',
  'clip-path',
] as const;

export interface TooltipStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
  kind: 'unexpected' | 'native-gap' | 'native-arrow-centering' | 'consumer-cascade';
}

export function getComparisonTooltip(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLDivElement {
  const fixture =
    container instanceof HTMLElement && container.hasAttribute('data-tooltip-comparison')
      ? container
      : container.querySelector<HTMLElement>('[data-tooltip-comparison]');
  const fixtureId = fixture?.dataset.tooltipComparison;
  const surfaces = [
    ...document.querySelectorAll<HTMLDivElement>(
      `[data-tooltip-implementation="${implementation}"]`,
    ),
  ].filter((candidate) => candidate.dataset.tooltipFixture === fixtureId);
  if (!fixtureId || surfaces.length !== 1)
    throw new Error(`Expected one ${implementation} Tooltip content fixture`);
  return surfaces[0];
}

export function getComparisonTooltipTrigger(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLButtonElement {
  const trigger = container.querySelector<HTMLButtonElement>(
    `[data-tooltip-trigger="${implementation}"]`,
  );
  if (!trigger) throw new Error(`Missing ${implementation} Tooltip trigger`);
  return trigger;
}

export function getTooltipArrow(content: Element): HTMLDivElement | null {
  return content.hasAttribute('data-tooltip-content')
    ? content.querySelector<HTMLDivElement>(':scope > [data-arrow]')
    : content.querySelector<HTMLDivElement>(':scope > div:first-child');
}

export function captureTooltipStyles(content: Element, trigger: Element): Record<string, string> {
  const values = capturePopoverPlacement(content, trigger);
  const capture = (
    name: string,
    element: Element,
    properties: readonly string[],
    pseudo?: string,
  ) => {
    const computed = getComputedStyle(element, pseudo);
    for (const property of properties)
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    if (!pseudo) {
      const rect = element.getBoundingClientRect();
      values[`${name}.rect.width`] = String(rect.width);
      values[`${name}.rect.height`] = String(rect.height);
    }
  };
  capture('content', content, contentProperties);
  capture('trigger', trigger, ['font-size', 'line-height', 'border-radius']);
  const arrow = getTooltipArrow(content);
  values['arrow.present'] = String(Boolean(arrow));
  if (arrow) {
    capture('arrow', arrow, arrowProperties);
    capture('arrow::before', arrow, arrowBeforeProperties, '::before');
  }
  return values;
}

export function captureTooltipNativeContract(
  content: Element,
  trigger: Element,
): Record<string, string> {
  const result = {
    ...capturePopoverNativeContract(content),
    placement: content.getAttribute('data-placement') ?? '',
    'trigger.aria-describedby': trigger.getAttribute('aria-describedby') ?? '',
    'trigger.aria-label': trigger.getAttribute('aria-label') ?? '',
    'content.id': content.id,
  };
  const arrow = getTooltipArrow(content);
  if (!arrow) return result;
  const surface = content.getBoundingClientRect();
  const pointer = arrow.getBoundingClientRect();
  const placement = content.getAttribute('data-placement') ?? '';
  return {
    ...result,
    'arrow.cross-offset': String(
      placement.startsWith('above') || placement.startsWith('below')
        ? (pointer.left + pointer.right - surface.left - surface.right) / 2
        : (pointer.top + pointer.bottom - surface.top - surface.bottom) / 2,
    ),
  };
}

const consumerValues: Record<string, string> = {
  'content.max-width': '192px',
  'content.padding-top': '9px',
  'content.padding-right': '9px',
  'content.padding-bottom': '9px',
  'content.padding-left': '9px',
  'content.border-top-color': 'rgb(98, 42, 139)',
  'content.border-top-width': '3px',
  'content.border-top-style': 'dashed',
  'content.border-radius': '3px',
  'content.background-color': 'rgb(237, 232, 247)',
  'content.color': 'rgb(80, 40, 120)',
  'content.rect.width': '192',
  'content.rect.height': '40',
  'arrow.background-color': 'rgb(237, 232, 247)',
  'arrow::before.background-color': 'rgb(237, 232, 247)',
  'arrow::before.border-top-color': 'rgb(98, 42, 139)',
  'arrow::before.border-top-width': '3px',
  'arrow::before.border-top-style': 'dashed',
};

export function compareTooltipStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
  example: TooltipExample,
): TooltipStyleDifference[] {
  const positioning = example.props?.positioning;
  const defaultGap = typeof positioning === 'object' && positioning.offset !== undefined ? 0 : 4;
  const gapDifference = defaultGap + (example.props?.withArrow ? 6 : 0);
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => {
      if (legacy[property] === headless[property]) return false;
      if (property === 'arrow.rect.width' || property === 'arrow.rect.height') {
        const before = Number(legacy[property]);
        const after = Number(headless[property]);
        if (Number.isFinite(before) && Number.isFinite(after) && Math.abs(before - after) <= 0.5)
          return false;
      }
      return true;
    })
    .map((property) => {
      let kind: TooltipStyleDifference['kind'] = 'unexpected';
      if (
        property === 'anchor.gap' &&
        gapDifference > 0 &&
        Number(legacy[property]) - Number(headless[property]) === gapDifference
      ) {
        kind = 'native-gap';
      } else if (property === 'arrow.translate' && legacy[property] === 'none') {
        const side = headless['anchor.side'];
        const expected =
          side === 'above' || side === 'below'
            ? '-50%'
            : side === 'before' || side === 'after'
              ? '0px -50%'
              : undefined;
        if (expected !== undefined && headless[property] === expected)
          kind = 'native-arrow-centering';
      } else if (example.consumer && consumerValues[property] === headless[property]) {
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
