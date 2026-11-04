// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { RefAttributes } from '@fluentui/react-utilities';
import styles from './Text.module.css';
import overrides from './Text.overrides.module.css';

export const textClassNames = { root: 'fui-Text' } as const;

type TextElement =
  'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'pre' | 'strong' | 'b' | 'em' | 'i';

type NativeTextProps = {
  [Element in TextElement]: React.ComponentPropsWithoutRef<Element> &
    (Element extends 'span' ? { as?: Element } : { as: Element });
}[TextElement];

/** Neutral foreground emphasis level, highest (`1`) to lowest (`4`). */
export type TextForeground = 1 | 2 | 3 | 4 | 'disabled';

/**
 * CoreAI's named size/weight combinations, replacing Fluent's fixed
 * typography-ramp preset components.
 *
 * `heading5`/`bodyStrong` and `heading6`/`bodySStrong` are aliases for the
 * same size/weight pair — use whichever name fits the semantic context.
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

export type TextProps = NativeTextProps & {
  /** Aligns text within its container. @default 'start' */
  align?: 'start' | 'center' | 'end' | 'justify';
  /** Applies a block display. @default false */
  block?: boolean;
  /** Applies a theme font family. When omitted, inherits from the CSS parent. */
  font?: 'base' | 'monospace' | 'numeric';
  /** Applies italic styling without changing the element's semantics. @default false */
  italic?: boolean;
  /** Applies a theme font size and line height. When omitted, inherits from the CSS parent. */
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;
  /** Applies a line-through decoration. @default false */
  strikethrough?: boolean;
  /** Applies ellipsis overflow; combine with block and wrap={false} for truncation. @default false */
  truncate?: boolean;
  /** Applies an underline decoration. @default false */
  underline?: boolean;
  /** Applies a theme font weight. When omitted, inherits from the CSS parent. */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Wraps text on white space. @default true */
  wrap?: boolean;
  /**
   * Selects colorNeutralForeground1–4 or colorNeutralForegroundDisabled.
   * When omitted, inherits the CSS parent's color.
   */
  foreground?: TextForeground;
  /** Transforms text to uppercase with 0.1em letter spacing. */
  uppercase?: boolean;
  /**
   * Supplies defaults for size and weight in place of fixed typography-ramp
   * preset components. Explicit size/weight values take precedence.
   */
  preset?: TextPreset;
};

const textPresets: Record<
  TextPreset,
  { size: NonNullable<TextProps['size']>; weight: NonNullable<TextProps['weight']> }
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

/**
 * Native typography primitive with CoreAI foreground and preset choices.
 * Unset typography inherits from the CSS parent, independently of provider
 * component defaults. The selected native element owns its semantics.
 */
export const Text: React.NamedExoticComponent<TextProps & RefAttributes<HTMLElement>> =
  React.forwardRef<HTMLElement, TextProps>(function Text(
    {
      as = 'span',
      align = 'start',
      block = false,
      font,
      italic = false,
      size,
      strikethrough = false,
      truncate = false,
      underline = false,
      weight,
      wrap = true,
      foreground,
      uppercase = false,
      preset,
      className,
      ...nativeProps
    },
    ref,
  ) {
    const presetValues = preset ? textPresets[preset] : undefined;
    const resolvedSize = size ?? presetValues?.size;
    const resolvedWeight = weight ?? presetValues?.weight;

    return React.createElement(as, {
      ...nativeProps,
      ref,
      className: [textClassNames.root, styles.Text, overrides.Text, className]
        .filter(Boolean)
        .join(' '),
      'data-align': align,
      'data-block': block ? '' : undefined,
      'data-font': font,
      'data-italic': italic ? '' : undefined,
      'data-size': resolvedSize,
      'data-strikethrough': strikethrough ? '' : undefined,
      'data-truncate': truncate ? '' : undefined,
      'data-underline': underline ? '' : undefined,
      'data-weight': resolvedWeight,
      'data-nowrap': wrap === false ? '' : undefined,
      'data-foreground': foreground,
      'data-uppercase': uppercase ? '' : undefined,
    });
  });

Text.displayName = 'Text';
