// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `MessageBar` with an extra `intent="brand"` value.
 *
 * The stock Fluent MessageBar accepts
 *   'info' | 'warning' | 'error' | 'success'
 * — all of which map to a status color ramp (danger, warning, success) or
 * a neutral surface (info). None of them tint the bar with the CoreAI brand
 * ramp. This wrapper adds a `'brand'` value that:
 *   - delegates the underlying rendering to the stock `'info'` intent (so
 *     the default icon, aria live politeness, and layout behavior are
 *     preserved), and
 *   - layers brand-token styling on top of the root surface and icon so the
 *     bar reads as a branded, informational callout.
 *
 * Pure CSS extension — no announcement or layout behavior is changed. The
 * `'brand'` value is always available regardless of `useCoreAIDefaults()`;
 * the caller opts in by passing it. Per-instance `className` overrides still
 * win (merged last).
 *
 * Notes on the wrapper:
 *   - This is NOT a `withComponentDefaults` factory case: that factory only
 *     fills in default prop values, it cannot widen the prop union or remap
 *     an unknown enum value to a stock one.
 */
import * as React from 'react';
import {
  MessageBar as FluentMessageBar,
  makeStyles,
  mergeClasses,
  tokens,
  type MessageBarProps as FluentMessageBarProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

/**
 * CoreAI MessageBar intent options. Extends Fluent's `intent` prop with an
 * additional `"brand"` value that tints the bar with the brand ramp.
 *
 * - `"info"` → neutral informational surface (Fluent default)
 * - `"warning"` / `"error"` / `"success"` → Fluent status ramps
 * - `"brand"` → brand foreground/stroke
 */
export type MessageBarIntent = NonNullable<FluentMessageBarProps['intent']> | 'brand';

export interface MessageBarProps extends Omit<FluentMessageBarProps, 'intent'> {
  /**
   * The intent of the message. In addition to Fluent's options, CoreAI adds
   * `"brand"` for a branded informational callout.
   *
   * - `"info"`: Neutral informational surface.
   * - `"warning"`: Warning status ramp.
   * - `"error"`: Danger status ramp.
   * - `"success"`: Success status ramp.
   * - `"brand"`: Brand primary ramp.
   * @default 'info'
   */
  intent?: MessageBarIntent;
}

const useStyles = makeStyles({
  brand: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke2}`,

    '& .fui-MessageBar__icon': {
      color: tokens.colorBrandForeground1,
    },
  },
});

export const MessageBar: ForwardRefComponent<MessageBarProps> = React.forwardRef<
  HTMLDivElement,
  MessageBarProps
>((props, ref) => {
  const { intent, className, ...rest } = props;
  const styles = useStyles();

  const isBrand = intent === 'brand';

  return (
    <FluentMessageBar
      {...rest}
      ref={ref}
      // `brand` is a CoreAI-only value; map it back to Fluent's neutral `info`
      intent={isBrand ? 'info' : intent}
      className={isBrand ? mergeClasses(styles.brand, className) : className}
    />
  );
}) as ForwardRefComponent<MessageBarProps>;

MessageBar.displayName = 'MessageBar';
