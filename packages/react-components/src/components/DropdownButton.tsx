// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `DropdownButton` — a `Dropdown` whose trigger is rendered as a secondary
 * button instead of a text-input-style field.
 *
 * It wraps the CoreAI `Dropdown`, requires an inline `label`, and renders the
 * trigger with the native Fluent `Button` chrome (secondary or subtle). All
 * other `Dropdown` props (`value`, `selectedOptions`, `clearable`,
 * `dynamicWidth`, `truncateTextOverflow`, …) are forwarded unchanged.
 *
 * Use this when you want a compact, button-like trigger with an inline label
 * (e.g. `Sort by: Newest`). For the standard input-style dropdown, use
 * `Dropdown`.
 *
 * The native Fluent Button chrome is reused: `useButtonStyles_unstable` is run
 * against a minimal `ButtonState` and the generated root class is merged onto
 * the Dropdown root. Because the native appearance/size come from a
 * low-priority `makeResetStyles` base class, the Dropdown's own atomic styles
 * would win — so appearance, size, and disabled are re-asserted here as atomic
 * overrides (merged last). A small `reset` strips the underlying input-style
 * chrome (field border / background / focus underline).
 */
import * as React from 'react';
import {
  type ButtonProps,
  type ButtonState,
  type DropdownProps as FluentDropdownProps,
  type ForwardRefComponent,
  makeStyles,
  mergeClasses,
  useButtonStyles_unstable,
} from '@fluentui/react-components';
import { Dropdown, type DropdownProps } from './Dropdown.js';

const useDropdownButtonStyles = makeStyles({
  // Strip the underlying input-style appearance from the Dropdown root so the
  // Button chrome on the trigger can take over (no field border / background /
  // focus underline / min-width).
  reset: {
    minWidth: 'unset',
    padding: 0,

    '&::before': {
      content: 'unset',
    },
    '&::after': {
      content: 'unset',
    },

    '&:has([data-fui-focus-visible]):focus-within': {
      outline: 'var(--strokeWidthThick) solid var(--colorStrokeFocus2)',
      outlineOffset: '-2px',
      boxShadow: '0 0 0 var(--strokeWidthThin) var(--colorStrokeFocus2) inset',
      zIndex: 1,
    },
  },

  // Appearance overrides. The native Button appearance comes from a low-priority
  // `makeResetStyles` base class, which the Dropdown's own atomic styles win
  // over — so re-assert each appearance here as atomic classes (merged last).
  appearanceSecondary: {
    '&:has(button:not(:disabled))': {
      backgroundColor: `var(--colorNeutralBackground1)`,
      border: `var(--strokeWidthThin) solid var(--colorNeutralStroke1)`,
    },
    '&:has(button:disabled)': {
      backgroundColor: `var(--colorNeutralBackgroundDisabled)`,
      border: `var(--strokeWidthThin) solid var(--colorNeutralStrokeDisabled)`,
    },
  },
  appearancePrimary: {
    // works
  },
  appearanceOutline: {
    backgroundColor: `transparent`,
    '&:has(button:not(:disabled))': {
      border: `var(--strokeWidthThin) solid var(--colorNeutralStroke1)`,
    },
    '&:has(button:disabled)': {
      border: `var(--strokeWidthThin) solid var(--colorNeutralStrokeDisabled)`,
    },
  },
  appearanceSubtle: {
    // works
  },
  appearanceTransparent: {
    '&:hover *, &:active *': {
      color: 'inherit',
    },
  },
});

const appearanceClassNames: Record<
  NonNullable<ButtonProps['appearance']>,
  keyof ReturnType<typeof useDropdownButtonStyles>
> = {
  secondary: 'appearanceSecondary',
  primary: 'appearancePrimary',
  outline: 'appearanceOutline',
  subtle: 'appearanceSubtle',
  transparent: 'appearanceTransparent',
};

function useFluentButtonClassName({
  appearance,
  disabled,
  shape = 'circular',
  size,
}: SupportedButtonProps): string {
  const state = {
    appearance: appearance,
    disabled: disabled,
    disabledFocusable: false,
    icon: undefined,
    iconOnly: false,
    iconPosition: 'after',
    shape: shape,
    size: size,
    root: { className: '' },
  } as unknown as ButtonState;

  useButtonStyles_unstable(state);

  return state.root.className ?? '';
}

type SupportedButtonProps = Pick<ButtonProps, 'appearance' | 'disabled' | 'shape' | 'size'>;

export type DropdownButtonProps = Omit<
  FluentDropdownProps,
  'appearance' | 'dynamicWidth' | 'truncateTextOverflow' | 'button'
> &
  SupportedButtonProps &
  Required<Pick<DropdownProps, 'label'>>;

/**
 * A `Dropdown` rendered as a button with a required inline `label`.
 */
export const DropdownButton: ForwardRefComponent<DropdownButtonProps> = React.forwardRef<
  HTMLButtonElement,
  DropdownButtonProps
>((props, ref) => {
  const { className, appearance, shape, disabled, size, ...rest } = props;
  const styles = useDropdownButtonStyles();
  const buttonClassName = useFluentButtonClassName({
    appearance,
    disabled,
    shape,
    size,
  });

  return (
    <Dropdown
      ref={ref}
      className={mergeClasses(
        'fui-DropdownButton',
        buttonClassName,
        styles.reset,
        styles[appearanceClassNames[appearance ?? 'secondary']],
        className,
      )}
      disabled={disabled}
      size={size}
      truncateTextOverflow
      dynamicWidth
      {...rest}
    />
  );
}) as ForwardRefComponent<DropdownButtonProps>;

DropdownButton.displayName = 'DropdownButton';
