// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * A simplified `Divider` — a styled `<hr>` line.
 *
 * Fluent's stock `Divider` is a flex container that supports inline content
 * via `::before`/`::after` pseudo-elements and per-side alignment. This
 * CoreAI version drops the content/alignment machinery entirely and renders
 * a plain `<hr>`, keeping only the visual knobs people actually reach for:
 * `appearance`, `inset`, and `vertical`. The prop surface mirrors the subset
 * of Fluent's `DividerProps` that survives.
 *
 * Styling is expressed with Griffel `makeStyles` + Fluent `tokens`.
 */
import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  type DividerProps as FluentDividerProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

const useDividerStyles = makeStyles({
  // Reset the native <hr> and lay down the shared geometry. Borders default to
  // zero width; the horizontal/vertical variants turn on the side they need.
  base: {
    boxSizing: 'border-box',
    margin: 0,
    border: `0 solid ${tokens.colorNeutralStroke2}`,
  },

  horizontal: {
    width: '100%',
    height: 0,
    borderTopWidth: tokens.strokeWidthThin,
    marginBlock: tokens.spacingVerticalXS,
  },
  vertical: {
    minHeight: '1em',
    width: 0,
    borderRightWidth: tokens.strokeWidthThin,
    marginInline: tokens.spacingHorizontalXS,
  },

  horizontalInset: {
    marginInline: tokens.spacingHorizontalM,
  },
  verticalInset: {
    marginBlock: tokens.spacingVerticalM,
  },

  // Appearance variations (color the stroke).
  strong: {
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
  },
  default: {
    borderTopColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
  },
  subtle: {
    borderTopColor: tokens.colorNeutralStroke3,
    borderRightColor: tokens.colorNeutralStroke3,
  },
  brand: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
  },
});

export type DividerAppearance = NonNullable<FluentDividerProps['appearance']>;

export type DividerProps = Omit<React.ComponentProps<'hr'>, 'children'> &
  // Reuse Fluent's prop definitions (and their JSDoc) for the knobs we keep.
  Pick<FluentDividerProps, 'appearance' | 'inset' | 'vertical'> & {
    /** Render as a `div` instead of the default `hr`. */
    as?: 'div';
  };

/**
 * A divider visually separates two pieces of content. Renders a styled `<hr>`.
 */
export const Divider: ForwardRefComponent<DividerProps> = React.forwardRef<
  HTMLHRElement,
  DividerProps
>((props, ref) => {
  const {
    as: As = 'hr',
    appearance = 'default',
    inset = false,
    vertical = false,
    className,
    ...rest
  } = props;
  const styles = useDividerStyles();

  return (
    <As
      ref={ref}
      role={As === 'div' ? 'separator' : undefined}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={mergeClasses(
        'fui-Divider',
        styles.base,
        vertical ? styles.vertical : styles.horizontal,
        inset && (vertical ? styles.verticalInset : styles.horizontalInset),
        styles[appearance],
        className,
      )}
      {...rest}
    />
  );
}) as ForwardRefComponent<DividerProps>;

Divider.displayName = 'Divider';
