// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  captureCodeBlockStyles,
  compareCodeBlockStyles,
  settleCodeBlockStyles,
  type CodeBlockStyleDifference,
} from './CodeBlockComparisonStyles.js';

export { settleCodeBlockStyles as settleMarkdownStyles };
export type MarkdownStyleDifference = CodeBlockStyleDifference;

const contentProperties = [
  'display',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration-line',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'border-radius',
  'border-collapse',
  'border-spacing',
  'overflow-x',
  'direction',
] as const;

function canonicalizeTextAlignment(values: Record<string, string>): Record<string, string> {
  const canonical = { ...values };
  for (const [property, value] of Object.entries(values)) {
    if (!property.endsWith('.text-align') || (value !== 'start' && value !== 'end')) continue;
    const direction = values[`${property.slice(0, -'text-align'.length)}direction`];
    if (direction !== 'ltr' && direction !== 'rtl') continue;
    // Resolve only known logical values using the same element's captured direction.
    canonical[property] = (value === 'start') === (direction === 'ltr') ? 'left' : 'right';
  }
  return canonical;
}

export function compareMarkdownStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): MarkdownStyleDifference[] {
  return compareCodeBlockStyles(
    canonicalizeTextAlignment(legacy),
    canonicalizeTextAlignment(headless),
  ).map(({ property }) => ({
    property,
    legacy: legacy[property] ?? null,
    headless: headless[property] ?? null,
  }));
}

export function getComparisonMarkdown(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLDivElement {
  const root = container.querySelector(
    `[data-markdown-implementation="${implementation}"] > .fui-Markdown`,
  );
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} Markdown`);
  return root;
}

export function captureMarkdownStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const table = root.querySelector('table');
  const parts: (readonly [string, Element | null])[] = [
    ['root', root],
    ...[
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'strong',
      'em',
      'del',
      'blockquote',
      'ul',
      'ul ul',
      'ol',
      'ol ol',
      'hr',
      'p code:not([class], [style])',
      'a',
      'table',
      'th',
      'td',
      'tr:last-child td',
      '[data-footnotes]',
      '[data-footnotes] h2',
      '[data-footnotes] p',
    ].map((selector) => [selector, root.querySelector(selector)] as const),
    ['tableScroll', table?.parentElement ?? null],
  ];
  for (const [part, element] of parts) {
    if (!(element instanceof HTMLElement)) continue;
    const computed = getComputedStyle(element);
    for (const property of contentProperties) {
      values[`${part}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${part}.width`] = rect.width.toFixed(2);
    values[`${part}.height`] = rect.height.toFixed(2);
  }
  for (const [index, codeBlock] of [
    ...root.querySelectorAll<HTMLElement>('.fui-CodeBlock'),
  ].entries()) {
    for (const [property, value] of Object.entries(captureCodeBlockStyles(codeBlock))) {
      values[`codeBlock${index}.${property}`] = value;
    }
  }
  return values;
}
