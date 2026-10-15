// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Text` that adds `foreground` and `preset` props to Fluent UI's Text.
 *
 * The `foreground` prop selects one of Fluent's four neutral foreground
 * emphasis levels (`1` | `2` | `3` | `4`), mapping to the
 * `colorNeutralForeground1`–`colorNeutralForeground4` tokens. Level `1` is the
 * highest-emphasis (primary) text color and `4` is the lowest-emphasis
 * (disabled-like) color. Everything else about Fluent's `Text` is preserved.
 *
 * The `preset` prop selects one of CoreAI's named `size`/`weight` combos
 * (`heading1`…`bodyXS`) in place of Fluent's fixed typography-ramp preset
 * components (`LargeTitle`, `Title2`, `Body1`, etc. — see `Text.deprecated.ts`).
 * Explicit `size`/`weight` props always win over `preset`, so `preset` only
 * supplies defaults. Unset font, size, and weight values inherit from the CSS
 * parent, so nested `Text` changes only the typography properties it specifies.
 *
 * Styling is expressed with Griffel `makeStyles` + Fluent `tokens`.
 */
import * as React from 'react';
import {
  Text as FluentText,
  makeStyles,
  mergeClasses,
  tokens,
  type ForwardRefComponent,
  type TextProps as FluentTextProps,
} from '@fluentui/react-components';

const useTextStyles = makeStyles({
  inherit: {
    color: 'inherit',
    margin: 0, // reset browser default margin for h1-h6 & p tags
  },
  // Responsive letter spacing is applied by the provider in theme/globalStyles.ts.
  inheritFont: { fontFamily: 'inherit' },
  inheritSize: { fontSize: 'inherit', lineHeight: 'inherit' },
  inheritWeight: { fontWeight: 'inherit' },
  foreground1: { color: tokens.colorNeutralForeground1 },
  foreground2: { color: tokens.colorNeutralForeground2 },
  foreground3: { color: tokens.colorNeutralForeground3 },
  foreground4: { color: tokens.colorNeutralForeground4 },
  foregrounddisabled: { color: tokens.colorNeutralForegroundDisabled },
  // TODO: CoreAI bug — provider tracking overrides uppercase letter spacing.
  // Expected contract: uppercase Text uses 0.1em letter spacing.
  // Remove this TODO when the implementation is fixed.
  uppercase: { textTransform: 'uppercase', letterSpacing: '0.1em' },
});

/** Neutral foreground emphasis level, highest (`1`) to lowest (`4`). */
export type TextForeground = 1 | 2 | 3 | 4 | 'disabled';

/**
 * CoreAI's named `size`/`weight` combos, replacing Fluent's fixed
 * typography-ramp presets (`LargeTitle`, `Title2`, `Subtitle1`, `Subtitle2`,
 * `Body1`(`Strong`), `Caption1`(`Strong`), `Caption2`(`Strong`)).
 *
 * `heading5`/`bodyStrong` and `heading6`/`bodySStrong` are aliases for the
 * same `size`/`weight` pair — use whichever name fits the semantic context.
 */
export type TextPreset =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'bodyStrong'
  | 'body'
  | 'heading6'
  | 'bodySStrong'
  | 'bodyS'
  | 'bodyXSStrong'
  | 'bodyXS';

const textPresets: Record<
  TextPreset,
  { size: NonNullable<FluentTextProps['size']>; weight: NonNullable<FluentTextProps['weight']> }
> = {
  heading1: { size: 900, weight: 'semibold' },
  heading2: { size: 700, weight: 'semibold' },
  heading3: { size: 500, weight: 'semibold' },
  heading4: { size: 400, weight: 'semibold' },
  heading5: { size: 300, weight: 'semibold' },
  bodyStrong: { size: 300, weight: 'semibold' },
  body: { size: 300, weight: 'regular' },
  heading6: { size: 200, weight: 'semibold' },
  bodySStrong: { size: 200, weight: 'semibold' },
  bodyS: { size: 200, weight: 'regular' },
  bodyXSStrong: { size: 100, weight: 'semibold' },
  bodyXS: { size: 100, weight: 'regular' },
};

export type TextProps = FluentTextProps & {
  /**
   * Selects a neutral foreground emphasis level, mapping to the
   * `colorNeutralForeground1`–`colorNeutralForeground4` tokens. `1` is the
   * highest-emphasis (primary) color; `4` is the lowest-emphasis color.
   */
  foreground?: TextForeground;
  /** When `true`, transforms the text to uppercase (`text-transform: uppercase`). */
  uppercase?: boolean;
  /**
   * Selects one of CoreAI's named `size`/`weight` combos (`heading1`…`bodyXS`).
   * Supplies defaults for `size`/`weight` — pass either prop explicitly to override.
   */
  preset?: TextPreset;
};

/**
 * A text component that extends Fluent UI's Text with a `foreground` prop for
 * choosing one of the four neutral foreground emphasis levels, and a
 * `preset` prop for choosing one of CoreAI's named `size`/`weight` combos.
 * Unset typography properties inherit from the component's CSS parent.
 */
export const Text: ForwardRefComponent<TextProps> = React.forwardRef<HTMLElement, TextProps>(
  (props, ref) => {
    const { foreground, uppercase, preset, font, size, weight, className, ...rest } = props;
    const styles = useTextStyles();

    const presetValues = preset ? textPresets[preset] : undefined;
    const resolvedSize = size ?? presetValues?.size;
    const resolvedWeight = weight ?? presetValues?.weight;

    const foregroundClass =
      foreground !== undefined ? styles[`foreground${foreground}` as const] : undefined;

    return (
      <FluentText
        ref={ref}
        font={font}
        size={resolvedSize}
        weight={resolvedWeight}
        className={mergeClasses(
          styles.inherit,
          font === undefined && styles.inheritFont,
          resolvedSize === undefined && styles.inheritSize,
          resolvedWeight === undefined && styles.inheritWeight,
          foregroundClass,
          uppercase && styles.uppercase,
          className,
        )}
        {...rest}
      />
    );
  },
) as ForwardRefComponent<TextProps>;

Text.displayName = 'Text';
