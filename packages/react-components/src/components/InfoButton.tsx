// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `InfoButton` — a button that reveals supplemental info in a Popover.
 *
 * Fluent deprecated `InfoButton` in favor of `InfoLabel` and discourages its
 * standalone use, though it's still re-exported from `@fluentui/react-components`
 * (via `@fluentui/react-infolabel`). We keep a wrapper here because `InfoLabel`
 * is only meant to be used inside form labels, whereas the standalone
 * info-button pattern is useful anywhere supplemental context is needed. If
 * Fluent ever removes `InfoButton` entirely, this can be reimplemented with
 * `Popover` + `Button`; for now we wrap the Fluent implementation so it stays
 * visually consistent with `InfoLabel` (which uses `InfoButton` under the hood).
 *
 * Accessibility:
 *   - An `aria-label` OR `aria-labelledby` is required so screen readers can
 *     differentiate the button from other controls.
 *   - When the Popover surface receives focus on open it has `role="note"`
 *     and no accessible name by default, so a screen reader announces only
 *     "note" instead of the tooltip text. When `info` is a primitive string
 *     or number we mirror it into an `aria-label` on the surface so the
 *     content is announced. Rich JSX content is left untouched so consumers
 *     can supply their own accessible name.
 */
import * as React from 'react';
import {
  InfoButton as FluentInfoButton,
  mergeClasses,
  type InfoButtonProps as FluentInfoButtonProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

type InfoButtonPropsWithAriaLabel = FluentInfoButtonProps & {
  'aria-label': string;
};
type InfoButtonPropsWithAriaLabelledBy = FluentInfoButtonProps & {
  'aria-labelledby': string;
};

/**
 * `InfoButton` requires an accessible name, supplied via either `aria-label`
 * or `aria-labelledby`.
 */
export type InfoButtonProps = InfoButtonPropsWithAriaLabel | InfoButtonPropsWithAriaLabelledBy;

type InfoSlot = FluentInfoButtonProps['info'];

/**
 * When the info content is a primitive string or number, mirror it into an
 * `aria-label` on the Popover surface so the content is announced when it
 * receives focus. Rich JSX content is left untouched so consumers can supply
 * their own accessible name.
 */
function withAccessibleName(info: InfoSlot): InfoSlot {
  if (typeof info === 'string' || typeof info === 'number') {
    return { 'aria-label': String(info), children: info };
  }
  return info;
}

/**
 * A button that reveals supplemental information in a Popover. Requires an
 * accessible name via `aria-label` or `aria-labelledby`.
 */
export const InfoButton: ForwardRefComponent<InfoButtonProps> = React.forwardRef<
  HTMLButtonElement,
  InfoButtonProps
>((props, ref) => {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className,
    info,
    ...rest
  } = props as InfoButtonPropsWithAriaLabel & InfoButtonPropsWithAriaLabelledBy;

  return (
    <FluentInfoButton
      ref={ref}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={mergeClasses('fui-InfoButton', className)}
      info={withAccessibleName(info)}
      {...rest}
    />
  );
}) as ForwardRefComponent<InfoButtonProps>;

InfoButton.displayName = 'InfoButton';
