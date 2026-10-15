// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `TabList` with an extra `appearance="elevated"` value.
 *
 * The stock Fluent TabList accepts
 *   'transparent' | 'subtle' | 'subtle-circular' | 'filled-circular'
 * — none of which give the tab strip a card-like surface. The playground
 * adds an `'elevated'` value that:
 *   - delegates internal tab styling to the stock `'subtle'` behavior
 *     (active indicator, hover, etc.), and
 *   - layers a raised container around the strip (background, shadow,
 *     rounded corners, inline-flex sizing) so it floats above the page
 *     surface like a Card.
 *
 * Pure CSS extension — no per-tab behavior is changed and no React state
 * is added. Per-instance `className` overrides still win (merged last).
 *
 * Notes on the wrapper:
 *   - This is NOT a `withComponentDefaults` factory case: that factory only
 *     fills in default prop values, it cannot widen the prop union or
 *     remap an unknown enum value to a stock one.
 *   - `'elevated'` is always available regardless of `useCoreAIDefaults()`
 *     — it's purely visual and the caller opted in by passing the value.
 */
import * as React from 'react';
import {
  TabList as FluentTabList,
  type TabListProps as FluentTabListProps,
  type ForwardRefComponent,
  makeStyles,
  mergeClasses,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    '& a.fui-Tab': {
      textDecoration: 'none',
    },
  },

  // overrides the appearance="filled-circular" styles
  elevated: {
    gap: 'var(--spacingVerticalXXS) var(--spacingHorizontalXXS)',
    padding: 'var(--spacingVerticalXXS) var(--spacingHorizontalXXS)',
    borderRadius: 'var(--borderRadiusLarge)',
    backgroundColor: 'var(--colorNeutralBackground3)',
    color: 'var(--colorNeutralForeground2)',

    '& .fui-Tab': {
      borderRadius: 'var(--borderRadiusMedium)',
      backgroundColor: 'transparent',

      '&:not([disabled]):not([aria-disabled="true"])': {
        '&:hover': {
          backgroundColor: 'var(--colorInteractiveBackgroundHover)',
          color: 'var(--colorNeutralForeground1)',
        },
        '&:active': {
          backgroundColor: 'var(--colorInteractiveBackgroundPressed)',
          color: 'var(--colorNeutralForeground1)',
        },
      },

      '&[aria-selected="true"]': {
        '&, &:hover, &:active': {
          backgroundColor: 'var(--colorInteractiveBackgroundSelected)',
          color: 'var(--colorNeutralForeground1)',
        },
      },

      // '.fui-Tab__icon': {},
      // '.fui-Tab__content': {},
    },
  },
});

export type TabListAppearance = NonNullable<FluentTabListProps['appearance']> | 'elevated';

export interface TabListProps extends Omit<FluentTabListProps, 'appearance'> {
  /**
   * A tab list can supports 'transparent' and 'subtle' appearance.
   * - 'subtle': Minimizes emphasis to blend into the background until hovered or focused.
   * - 'transparent': No background and border styling
   * - 'subtle-circular': Adds background and border styling
   * - 'filled-circular': Adds background styling
   * - 'elevated': Adds background around all tabs for visual grouping
   *
   * The appearance affects each of the contained tabs.
   * @default 'transparent'
   */
  appearance?: TabListAppearance;
}

export const TabList: ForwardRefComponent<TabListProps> = React.forwardRef<
  HTMLDivElement,
  TabListProps
>((props, ref) => {
  const { appearance, className, ...rest } = props;
  const styles = useStyles();

  return (
    <FluentTabList
      {...rest}
      ref={ref}
      appearance={appearance === 'elevated' ? 'filled-circular' : appearance}
      className={mergeClasses(styles.root, appearance === 'elevated' && styles.elevated, className)}
    />
  );
}) as ForwardRefComponent<TabListProps>;

TabList.displayName = 'TabList';
