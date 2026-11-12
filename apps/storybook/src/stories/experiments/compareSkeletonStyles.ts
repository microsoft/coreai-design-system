// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const rootProperties = ['display', 'direction', 'padding', 'gap'] as const;
const itemProperties = [
  'display',
  'position',
  'overflow',
  'border-radius',
  'background-color',
  'direction',
  'opacity',
] as const;
const animationProperties = [
  'animation-duration',
  'animation-delay',
  'animation-iteration-count',
  'animation-timing-function',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
] as const;
const pseudoProperties = [
  'content',
  'display',
  'position',
  'inset',
  'width',
  'height',
  'background-color',
  'background-image',
  'transform',
  'opacity',
  ...animationProperties,
] as const;

export interface SkeletonStyleDifference {
  property: string;
  legacy: string | null;
  headless: string | null;
}

export interface ComparisonSkeleton {
  root: HTMLElement;
  groups: HTMLElement[];
  items: HTMLElement[];
}

export function getSkeletonElements(root: HTMLElement): ComparisonSkeleton {
  return {
    root,
    groups: [root, ...root.querySelectorAll<HTMLElement>('.fui-Skeleton')],
    items: [...root.querySelectorAll<HTMLElement>('.fui-SkeletonItem')],
  };
}

export function getComparisonSkeleton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): ComparisonSkeleton {
  const cell = container.querySelector(`[data-skeleton-implementation="${implementation}"]`);
  const root = cell?.querySelector('.fui-Skeleton');
  if (!(root instanceof HTMLElement)) throw new Error(`Missing ${implementation} Skeleton root`);
  return getSkeletonElements(root);
}

export function getOwnedSkeletonAnimations({ root, items }: ComparisonSkeleton): CSSAnimation[] {
  return root.getAnimations({ subtree: true }).filter((animation): animation is CSSAnimation => {
    const effect = animation.effect;
    return (
      animation instanceof CSSAnimation &&
      effect instanceof KeyframeEffect &&
      items.some((item) => effect.target === item) &&
      effect.pseudoElement === '::after'
    );
  });
}

export function captureSkeletonStyles(control: ComparisonSkeleton): Record<string, string> {
  const { root, groups, items } = control;
  const values: Record<string, string> = {
    'groups.count': String(groups.length),
    'items.count': String(items.length),
  };
  const rootRect = root.getBoundingClientRect();
  for (const [prefix, elements, properties] of [
    ['group', groups, rootProperties],
    ['item', items, itemProperties],
  ] as const) {
    elements.forEach((element, index) => {
      const slot = `${prefix}[${index}]`;
      const styles = getComputedStyle(element);
      for (const property of properties) {
        values[`${slot}.${property}`] = styles.getPropertyValue(property);
      }
      const rect = element.getBoundingClientRect();
      values[`${slot}.width`] = rect.width.toFixed(2);
      values[`${slot}.height`] = rect.height.toFixed(2);
      values[`${slot}.offset-left`] = (rect.left - rootRect.left).toFixed(2);
      values[`${slot}.offset-top`] = (rect.top - rootRect.top).toFixed(2);
    });
  }

  const animations = getOwnedSkeletonAnimations(control);
  items.forEach((item, index) => {
    const pseudo = `item[${index}]::after`;
    const styles = getComputedStyle(item, '::after');
    for (const property of pseudoProperties) {
      values[`${pseudo}.${property}`] = styles.getPropertyValue(property);
    }
    // Generated animation names differ; compare actual keyframes instead.
    values[`${pseudo}.animation-keyframes`] = JSON.stringify(
      animations.flatMap((animation) => {
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect) || effect.target !== item) return [];
        return [
          effect.getKeyframes().map((frame) => ({
            offset: frame.computedOffset,
            easing: frame.easing,
            transform: frame.transform,
            opacity: frame.opacity,
          })),
        ];
      }),
    );
  });
  return values;
}

export function compareSkeletonStyles(
  legacy: Record<string, string>,
  headless: Record<string, string>,
): SkeletonStyleDifference[] {
  return [...new Set([...Object.keys(legacy), ...Object.keys(headless)])]
    .filter((property) => legacy[property] !== headless[property])
    .map((property) => ({
      property,
      legacy: legacy[property] ?? null,
      headless: headless[property] ?? null,
    }));
}

export async function settleSkeletonStyles(control: ComparisonSkeleton): Promise<void> {
  await document.fonts.ready;
  for (const item of control.items) {
    getComputedStyle(item, '::after').getPropertyValue('content');
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Freeze only owned item ::after CSS animations at time zero; never await infinite animations.
  // Consumer children and caller-created element animations keep running.
  const animations = getOwnedSkeletonAnimations(control);
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = 0;
  }
  await Promise.all(animations.map((animation) => animation.ready));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
