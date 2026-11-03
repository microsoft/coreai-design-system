// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const surfaceProperties = [
  'display',
  'position',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'gap',
  'box-sizing',
  'background-color',
  'border-radius',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-bottom',
  'min-height',
  'overflow-x',
  'overflow-y',
  'color',
  'font-family',
  'font-size',
  'line-height',
  'direction',
] as const;

export interface CodeBlockStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonCodeBlock(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLDivElement {
  const root = container.querySelector(`[data-code-block-implementation="${implementation}"]`);
  if (!(root instanceof HTMLDivElement)) throw new Error(`Missing ${implementation} CodeBlock`);
  return root;
}

export function captureCodeBlockStyles(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  const rootRect = root.getBoundingClientRect();
  for (const [part, element] of [
    ['root', root],
    ['pre', root.querySelector('.fui-CodeBlock__pre')],
    ['header', root.querySelector('.fui-CodeBlock__header')],
    ['footer', root.querySelector('.fui-CodeBlock__footer')],
    ['fallback', root.querySelector('.fui-CodeBlock__fallbackContent')],
    ['copy', root.querySelector('.fui-CodeBlock__CopyButton')],
  ] as const) {
    if (!(element instanceof HTMLElement)) continue;
    const computed = getComputedStyle(element);
    for (const property of surfaceProperties) {
      values[`${part}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${part}.width`] = rect.width.toFixed(2);
    values[`${part}.height`] = rect.height.toFixed(2);
    if (part === 'copy') {
      values['copy.top'] = (rect.top - rootRect.top).toFixed(2);
      values['copy.right'] = (rootRect.right - rect.right).toFixed(2);
    }
  }
  const tokenClasses = new Set<string>();
  for (const token of root.querySelectorAll<HTMLElement>('code [class]')) {
    for (const className of token.classList) {
      if (!className.startsWith('hljs-') || tokenClasses.has(className)) continue;
      tokenClasses.add(className);
      const computed = getComputedStyle(token);
      for (const property of [
        'color',
        'background-color',
        'font-style',
        'font-weight',
        'display',
        'text-decoration-line',
      ]) {
        values[`${className}.${property}`] = computed.getPropertyValue(property);
      }
    }
  }
  return values;
}

export function compareCodeBlockStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): CodeBlockStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleCodeBlockStyles(root: HTMLElement): Promise<void> {
  await root.ownerDocument.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
