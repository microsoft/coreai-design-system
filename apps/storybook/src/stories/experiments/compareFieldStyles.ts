// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const slotProperties = {
  root: ['display', 'grid-template-columns', 'grid-template-rows', 'padding-left', 'padding-right'],
  label: [
    'display',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'max-width',
    'max-height',
    'padding-top',
    'padding-bottom',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'grid-row-start',
    'grid-row-end',
  ],
  required: ['display', 'color', 'padding-left', 'padding-right', 'font-size', 'line-height'],
  validationMessage: [
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'margin-top',
    'padding-left',
    'padding-right',
  ],
  validationMessageIcon: [
    'display',
    'font-size',
    'color',
    'margin-left',
    'margin-right',
    'line-height',
    'vertical-align',
  ],
  hint: ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'margin-top'],
} as const;

export interface ComparisonField {
  root: HTMLElement;
  label: HTMLElement | null;
  required: HTMLElement | null;
  validationMessage: HTMLElement | null;
  validationMessageIcon: HTMLElement | null;
  hint: HTMLElement | null;
}

export interface FieldStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export function getComparisonField(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonField {
  const root = container.querySelector<HTMLElement>(
    `[data-field-implementation="${implementation}"] > .fui-Field`,
  );
  if (!root) throw new Error(`Missing ${implementation} Field fixture`);
  return {
    root,
    label: root.querySelector<HTMLElement>(':scope > .fui-Field__label'),
    required: root.querySelector<HTMLElement>('.fui-Field__label .fui-Label__required'),
    validationMessage: root.querySelector<HTMLElement>(':scope > .fui-Field__validationMessage'),
    validationMessageIcon: root.querySelector<HTMLElement>('.fui-Field__validationMessageIcon'),
    hint: root.querySelector<HTMLElement>(':scope > .fui-Field__hint'),
  };
}

export function captureFieldStyles(field: ComparisonField): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of Object.keys(slotProperties) as (keyof typeof slotProperties)[]) {
    const element = field[name];
    values[`${name}.present`] = String(Boolean(element));
    if (!element) continue;
    const computed = getComputedStyle(element);
    for (const property of slotProperties[name]) {
      values[`${name}.${property}`] = computed.getPropertyValue(property);
    }
    const rect = element.getBoundingClientRect();
    values[`${name}.width`] = String(rect.width);
    values[`${name}.height`] = String(rect.height);
  }
  const glyph = field.validationMessageIcon?.querySelector('svg');
  values['glyph.present'] = String(Boolean(glyph));
  if (glyph) {
    values['glyph.width'] = String(glyph.getBoundingClientRect().width);
    values['glyph.height'] = String(glyph.getBoundingClientRect().height);
    values['glyph.path'] = glyph.querySelector('path')?.getAttribute('d') ?? '';
  }
  return values;
}

export function compareFieldStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): FieldStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleFieldStyles({ root }: ComparisonField): Promise<void> {
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity),
      )
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
