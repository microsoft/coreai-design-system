// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = ['display', 'direction', 'padding-left', 'padding-right'] as const;
const headerProperties = [
  'display',
  'color',
  'background-color',
  'border-radius',
  'margin-top',
  'margin-bottom',
] as const;
const buttonProperties = [
  'display',
  'align-items',
  'align-content',
  'grid-template-columns',
  'gap',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'min-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'box-sizing',
  'cursor',
] as const;
const iconProperties = [
  'display',
  'align-items',
  'align-self',
  'justify-content',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'font-size',
  'line-height',
  'color',
  'background-color',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;
const glyphProperties = ['transform', 'transition-duration', 'transition-timing-function'] as const;
const panelProperties = [
  'display',
  'color',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
] as const;
const focusProperties = [
  'content',
  'position',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-radius',
  'top',
  'right',
  'bottom',
  'left',
] as const;

export interface AccordionStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonAccordionHeader {
  root: HTMLElement;
  button: HTMLElement;
  expandIcon: HTMLElement | null;
  icon: HTMLElement | null;
  glyph: SVGElement | null;
  label: HTMLElement | null;
}

export interface ComparisonAccordionItem {
  root: HTMLDivElement;
  header: ComparisonAccordionHeader;
  panel: HTMLDivElement | null;
}

export interface ComparisonAccordion {
  root: HTMLDivElement;
  items: ComparisonAccordionItem[];
}

export function getAccordionHeaderSlots(root: HTMLElement): ComparisonAccordionHeader {
  const button = root.querySelector('.fui-AccordionHeader__button');
  if (!(button instanceof HTMLElement)) throw new Error('Missing AccordionHeader button');
  const expandIcon = button.querySelector<HTMLElement>('.fui-AccordionHeader__expandIcon');
  return {
    root,
    button,
    expandIcon,
    icon: button.querySelector<HTMLElement>('.fui-AccordionHeader__icon'),
    glyph: expandIcon?.querySelector<SVGElement>('svg') ?? null,
    label: button.querySelector<HTMLElement>('[data-accordion-label]'),
  };
}

export function getComparisonAccordion(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonAccordion {
  const cell = container.querySelector(`[data-accordion-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Accordion');
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} Accordion`);
  return {
    root,
    items: [...root.querySelectorAll<HTMLDivElement>(':scope > .fui-AccordionItem')].map((item) => {
      const header = item.querySelector<HTMLElement>(':scope > .fui-AccordionHeader');
      if (!header) throw new Error('Missing AccordionHeader');
      return {
        root: item,
        header: getAccordionHeaderSlots(header),
        panel: item.querySelector<HTMLDivElement>(':scope > .fui-AccordionPanel'),
      };
    }),
  };
}

function captureElement(
  values: Record<string, string>,
  slot: string,
  element: Element | null,
  properties: readonly string[],
  relativeTo?: DOMRect,
) {
  values[`${slot}.present`] = String(Boolean(element));
  if (!element) return;
  const styles = getComputedStyle(element);
  for (const property of properties)
    values[`${slot}.${property}`] = styles.getPropertyValue(property);
  const rect = element.getBoundingClientRect();
  values[`${slot}.width`] = rect.width.toFixed(2);
  values[`${slot}.height`] = rect.height.toFixed(2);
  if (relativeTo) {
    values[`${slot}.offset-left`] = (rect.left - relativeTo.left).toFixed(2);
    values[`${slot}.offset-top`] = (rect.top - relativeTo.top).toFixed(2);
  }
}

export function captureAccordionHeaderStyles({
  root,
  button,
  expandIcon,
  icon,
  glyph,
  label,
}: ComparisonAccordionHeader): Record<string, string> {
  const values: Record<string, string> = {};
  const rect = root.getBoundingClientRect();
  for (const [slot, element, properties] of [
    ['header', root, headerProperties],
    ['button', button, buttonProperties],
    ['expandIcon', expandIcon, iconProperties],
    ['icon', icon, iconProperties],
    ['glyph', glyph, glyphProperties],
    ['label', label, []],
  ] as const) {
    captureElement(values, slot, element, properties, slot === 'header' ? undefined : rect);
  }
  const focus = getComputedStyle(button, '::after');
  for (const property of focusProperties)
    values[`focus.${property}`] = focus.getPropertyValue(property);
  return values;
}

export function captureAccordionStyles({
  root,
  items,
}: ComparisonAccordion): Record<string, string> {
  const values: Record<string, string> = {};
  captureElement(values, 'accordion', root, rootProperties);
  for (const [index, { root: item, header, panel }] of items.entries()) {
    captureElement(values, `item${index}`, item, rootProperties);
    for (const [property, value] of Object.entries(captureAccordionHeaderStyles(header))) {
      values[`item${index}.${property}`] = value;
    }
    // Measure visible content, but report the native mounted-panel difference separately.
    // Headless 0.3.2 keeps closed panels mounted; legacy Collapse unmounts them.
    values[`item${index}.panel.mounted`] = String(Boolean(panel));
    const visiblePanel = panel && panel.getClientRects().length > 0 ? panel : null;
    captureElement(values, `item${index}.panel`, visiblePanel, panelProperties);
  }
  return values;
}

export function compareAccordionStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): AccordionStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export function expectedAccordionMountDifferences({
  items,
}: ComparisonAccordion): AccordionStyleDifference[] {
  return items.flatMap(({ header }, index) =>
    header.button.getAttribute('aria-expanded') === 'false'
      ? [{ property: `item${index}.panel.mounted`, legacy: 'false', headless: 'true' }]
      : [],
  );
}

export async function settleAccordionStyles({
  root,
}: Pick<ComparisonAccordion, 'root'> | Pick<ComparisonAccordionHeader, 'root'>): Promise<void> {
  await document.fonts.ready;
  for (const button of root.querySelectorAll('.fui-AccordionHeader__button')) {
    getComputedStyle(button, '::after').getPropertyValue('content');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
