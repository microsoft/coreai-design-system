// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Dropdown` that extends Fluent UI's Dropdown with:
 *   - an inline `label` that is rendered inside the trigger (instead of a
 *     separate `<Label>` above the control),
 *   - `dynamicWidth` to collapse the control to its content width when nothing
 *     is selected (only valid alongside `label`), and
 *   - `truncateTextOverflow` to ellipsis-clip long selected text.
 *
 * For a trigger rendered as a secondary / subtle button, use `DropdownButton`.
 *
 * CoreAI default `appearance` is `'filled-darker'` (matches the other
 * input-family wrappers). Per-instance `className` overrides win (merged last).
 *
 * Styling is expressed with Griffel `makeStyles`. Cross-slot selectors
 * reference Fluent's stable Dropdown classnames (`fui-Dropdown__button`,
 * `fui-Dropdown__clearButton`) because Griffel cannot compose generated class
 * names within a single `makeStyles` call.
 */
import * as React from 'react';
import {
  Dropdown as FluentDropdown,
  type DropdownProps as FluentDropdownProps,
  type DropdownState as FluentDropdownState,
  type ForwardRefComponent,
  makeStyles,
  mergeClasses,
  useId,
} from '@fluentui/react-components';
import type { InlineLabelProps } from './inlineLabelProps.js';

const useDropdownStyles = makeStyles({
  label: {
    fontSize: 'inherit',
    fontWeight: 600,
    lineHeight: 'inherit',
    color: 'var(--colorNeutralForeground1)',

    // When the inline-label button is disabled, inherit the disabled
    // foreground color from the button instead of the hardcoded color above.
    // TODO: FIX - this selector DOESN'T WORK IN GRIFFEL!?
    // "button:disabled &": {
    //   color: "inherit",
    // },
  },

  // rewrite the layout and padding so the inline label will work
  inlineLabelLayout: {
    '& .fui-Dropdown__button span': {
      margin: 0,
    },
    '& .fui-Dropdown__button': {
      gridTemplateColumns: '[label] auto [content] 1fr [icon] auto [end]',
      gap: '0.5em',
    },
    // When the clear button is visible, Fluent sets its `tabindex` attribute.
    '&:has(.fui-Dropdown__clearButton[tabindex]) .fui-Dropdown__button': {
      paddingRight: '0.5em',
    },
  },

  disabled: {
    '& [data-inline-label]': {
      color: 'var(--colorNeutralForegroundDisabled)',
    },
  },

  truncatedText: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // `dynamicWidth`: collapse the control to its content width when nothing is
  // selected. Only applied when a `label` is present (enforced by the prop type).
  dynamicWidth: {
    minWidth: 0,
  },
});

// Trailing colon after the inline label when a value is selected (e.g.
// `Status: In Progress`). Inert without a value or a `[data-inline-label]` span.
const useDropdownValueStyles = makeStyles({
  hasValue: {
    '& [data-inline-label]::after': {
      content: '":"',
    },
  },
});

// Custom style hook (registered in `../contexts/styleHooks.ts`). Runs after Fluent
// resolves `state`, exposing `state.value` — the live selection we can't read
// from props. Tags the trigger button so the inline label gets its colon.
export const useDropdownStyleHook = (stateUnknown: unknown): void => {
  const styles = useDropdownValueStyles();
  const state = stateUnknown as FluentDropdownState;

  if (state.button && state.value) {
    state.button.className = mergeClasses(state.button.className, styles.hasValue);
  }
};

interface ButtonWithInlineLabelProps extends React.ComponentProps<'button'> {
  ButtonComponent: React.ElementType;
  label: string;
  inlineLabelId: string;
}

const ButtonWithInlineLabel = React.forwardRef<HTMLButtonElement, ButtonWithInlineLabelProps>(
  function ButtonWithInlineLabel(
    { ButtonComponent, label, inlineLabelId, children, className, ...props },
    ref,
  ) {
    const styles = useDropdownStyles();

    return (
      <ButtonComponent
        ref={ref}
        aria-labelledby={inlineLabelId}
        // `className` carries Fluent's `fui-Dropdown__button` class, which the
        // `inlineLabelLayout` rule targets for the flex layout.
        className={className}
        {...props}
      >
        <span
          aria-hidden="true"
          data-inline-label
          className={mergeClasses('fui-Dropdown__label', styles.label)}
          id={inlineLabelId}
        >
          {label}
        </span>
        {children}
      </ButtonComponent>
    );
  },
);

export type DropdownProps = FluentDropdownProps & InlineLabelProps;

/**
 * A Dropdown component that extends Fluent UI's Dropdown.
 */
export const Dropdown: ForwardRefComponent<DropdownProps> = React.forwardRef<
  HTMLButtonElement,
  DropdownProps
>((props, ref) => {
  const {
    appearance = 'filled-darker',
    className,
    label,
    dynamicWidth,
    truncateTextOverflow = false,
    ...rest
  } = props;
  const styles = useDropdownStyles();
  const inlineLabelId = useId();

  const renderButtonWithLabel = React.useCallback(
    (Component: React.ElementType, slotProps: React.JSX.IntrinsicElements['button']) => (
      <ButtonWithInlineLabel
        ButtonComponent={Component}
        inlineLabelId={inlineLabelId}
        label={label ?? ''}
        {...slotProps}
      />
    ),
    [inlineLabelId, label],
  );

  let button: FluentDropdownProps['button'] = label
    ? { children: renderButtonWithLabel }
    : undefined;

  if (truncateTextOverflow && !label) {
    const displayText = rest.value ?? rest.placeholder ?? '';
    button = <span className={styles.truncatedText}>{displayText}</span>;
  }

  if (typeof rest.button === 'object' && !React.isValidElement(rest.button)) {
    button = {
      ...(rest.button as Record<string, unknown>),
      ...(typeof button === 'object' && !React.isValidElement(button) ? button : {}),
    };
  }

  return (
    <FluentDropdown
      ref={ref}
      appearance={appearance}
      button={button}
      className={mergeClasses(
        label !== undefined && styles.inlineLabelLayout,
        dynamicWidth && styles.dynamicWidth,
        rest.disabled && styles.disabled,
        className,
      )}
      {...rest}
    />
  );
}) as ForwardRefComponent<DropdownProps>;

Dropdown.displayName = 'Dropdown';
