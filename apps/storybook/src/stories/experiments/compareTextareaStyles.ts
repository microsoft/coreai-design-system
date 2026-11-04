// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = [
  'display',
  'box-sizing',
  'position',
  'vertical-align',
  'background-color',
  'border-top-color',
  'border-bottom-color',
  'border-top-width',
  'border-bottom-width',
  'border-top-style',
  'border-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'outline-color',
  'outline-style',
  'outline-width',
  'box-shadow',
] as const;

const textareaProperties = [
  'box-sizing',
  'background-color',
  'color',
  'border-top-style',
  'border-top-width',
  'flex-grow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'min-height',
  'max-height',
  'resize',
  'overflow-x',
  'overflow-y',
  'outline-style',
  'cursor',
  'direction',
  'text-align',
] as const;

const underlineProperties = [
  'content',
  'box-sizing',
  'position',
  'left',
  'right',
  'bottom',
  'height',
  'border-bottom-color',
  'border-bottom-style',
  'border-bottom-width',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'clip-path',
  'transform',
  'transition-property',
  'transition-duration',
  'transition-delay',
] as const;

export interface TextareaStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonTextarea {
  root: HTMLElement;
  textarea: HTMLTextAreaElement;
}

export function getComparisonTextarea(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonTextarea {
  const cell = container.querySelector(`[data-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Textarea');
  const textarea = root?.querySelector('.fui-Textarea__textarea');
  if (!(root instanceof HTMLElement) || !(textarea instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing ${implementation} Textarea root or textarea slot`);
  }
  return { root, textarea };
}

export function captureTextareaStyles({
  root,
  textarea,
}: ComparisonTextarea): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [slot, element, properties] of [
    ['root', root, rootProperties],
    ['textarea', textarea, textareaProperties],
  ] as const) {
    const styles = getComputedStyle(element);
    for (const property of properties) {
      values[`${slot}.${property}`] = styles.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${slot}.width`] = rect.width.toFixed(2);
    values[`${slot}.height`] = rect.height.toFixed(2);
  }
  const underline = getComputedStyle(root, '::after');
  for (const property of underlineProperties) {
    values[`underline.${property}`] = underline.getPropertyValue(property);
  }
  const placeholder = getComputedStyle(textarea, '::placeholder');
  values['placeholder.color'] = placeholder.color;
  values['placeholder.opacity'] = placeholder.opacity;
  return values;
}

export function compareTextareaStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): TextareaStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleTextareaStyles({ root }: ComparisonTextarea): Promise<void> {
  await document.fonts.ready;
  await Promise.all(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
