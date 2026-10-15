// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Combobox` that extends Fluent UI's Combobox with an inline `label`
 * rendered inside the control (before the input) instead of a separate
 * `<Label>` above it.
 *
 * CoreAI default `appearance` is `'filled-darker'` (matches the other
 * input-family wrappers). Per-instance `className` overrides win (merged last).
 *
 * Styling is expressed with Griffel `makeStyles`.
 */
import * as React from 'react';
import {
  Combobox as FluentCombobox,
  type ComboboxProps as FluentComboboxProps,
  type ComboboxState as FluentComboboxState,
  type ForwardRefComponent,
  Label,
  makeStyles,
  mergeClasses,
  tokens,
  useId,
} from '@fluentui/react-components';
import type { InlineLabelProps } from './inlineLabelProps.js';

const DEFAULT_PLACEHOLDER = 'Select...';

const useComboboxStyles = makeStyles({
  // Re-flow the root grid so the inline label sits before the input.
  inlineLabelLayout: {
    gridTemplateColumns: 'auto 1fr auto',
    gap: 0,
  },

  label: {
    alignSelf: 'stretch',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',

    paddingRight: '0.5em',
    paddingLeft: tokens.spacingHorizontalS,

    fontSize: 'inherit',
    fontWeight: 600,
    lineHeight: 'inherit',
    color: tokens.colorNeutralForeground1,
  },

  inlineLabelInput: {
    padding: 0,
    paddingRight: '0.5em',
  },

  // `dynamicWidth`: collapse the input to zero width when nothing is selected
  // and grow with the typed/selected content otherwise. Only applied when a
  // `label` is present (enforced by the prop type).
  dynamicWidthInput: {
    // https://caniuse.com/wf-field-sizing - Firefox not supported
    // this component still renders functionally without this property
    fieldSizing: 'content',
    maxWidth: '200px',

    '&:focus': {
      minWidth: `${DEFAULT_PLACEHOLDER.length}ch`,
    },
    "&[value='']:not(:focus)": {
      paddingInline: 0,
      width: 0,
    },
  },
  dynamicWidthLayout: {
    minWidth: 0,
  },

  truncatedText: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // When the control is disabled, dim the inline label to match the native
  // disabled foreground (the label sets its own color otherwise).
  disabled: {
    '& [data-inline-label]': {
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
});

// Trailing colon after the inline label when a value is selected (e.g.
// `Status: In Progress`). Inert without a value or a `[data-inline-label]` span.
const useComboboxValueStyles = makeStyles({
  hasValue: {
    '& [data-inline-label]::after': {
      content: '":"',
    },
  },
});

// Custom style hook (registered in `../contexts/styleHooks.ts`). Runs after Fluent
// resolves `state`, exposing `state.value` — the live selection we can't read
// from props. Tags the root so the inline label gets its colon.
export const useComboboxStyleHook = (stateUnknown: unknown): void => {
  const styles = useComboboxValueStyles();
  const state = stateUnknown as FluentComboboxState;

  if (state.root && state.value) {
    state.root.className = mergeClasses(state.root.className, styles.hasValue);
  }
};

export type ComboboxProps = FluentComboboxProps & InlineLabelProps;

/**
 * A Combobox component that extends Fluent UI's Combobox with an inline label.
 */
export const Combobox: ForwardRefComponent<ComboboxProps> = React.forwardRef<
  HTMLInputElement,
  ComboboxProps
>((props, ref) => {
  const {
    appearance = 'filled-darker',
    className,
    label,
    dynamicWidth,
    truncateTextOverflow = false,
    id,
    input,
    placeholder,
    ...rest
  } = props;
  const styles = useComboboxStyles();
  const generatedId = useId();
  const inlineLabelId = id ?? generatedId;
  const inputId = label ? inlineLabelId : id;

  const renderInputWithLabel = React.useCallback(
    (Component: React.ElementType, slotProps: React.JSX.IntrinsicElements['input']) => (
      <>
        <Label
          data-inline-label
          className={mergeClasses('fui-Combobox__label', styles.label)}
          htmlFor={inlineLabelId}
        >
          {label}
        </Label>
        <Component
          {...slotProps}
          className={mergeClasses(
            slotProps.className,
            styles.inlineLabelInput,
            dynamicWidth && styles.dynamicWidthInput,
            truncateTextOverflow && styles.truncatedText,
          )}
        />
      </>
    ),
    [
      label,
      dynamicWidth,
      truncateTextOverflow,
      inlineLabelId,
      styles.label,
      styles.inlineLabelInput,
      styles.dynamicWidthInput,
      styles.truncatedText,
    ],
  );

  const inputObj =
    typeof input === 'object' && input !== null && !React.isValidElement(input)
      ? (input as Record<string, unknown>)
      : {};

  let inputSlot: unknown = input;
  if (label) {
    inputSlot = { ...inputObj, children: renderInputWithLabel };
  } else if (truncateTextOverflow) {
    inputSlot = {
      ...inputObj,
      className: mergeClasses(inputObj.className as string | undefined, styles.truncatedText),
    };
  }

  return (
    <FluentCombobox
      ref={ref}
      appearance={appearance}
      className={mergeClasses(
        label !== undefined && styles.inlineLabelLayout,
        dynamicWidth && styles.dynamicWidthLayout,
        rest.disabled && styles.disabled,
        className,
      )}
      id={inputId}
      placeholder={placeholder == null && dynamicWidth ? DEFAULT_PLACEHOLDER : placeholder}
      // Cast required: Fluent's input slot type does not expose the children
      // render-prop pattern in its public types, but it works at runtime.
      input={inputSlot as FluentComboboxProps['input']}
      {...rest}
    />
  );
}) as ForwardRefComponent<ComboboxProps>;

Combobox.displayName = 'Combobox';
