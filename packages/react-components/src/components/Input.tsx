// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Input` that extends Fluent UI's Input with an inline `label`
 * rendered inside the control (before the text), plus the same
 * `dynamicWidth` / `truncateTextOverflow` knobs as the Dropdown / Combobox
 * wrappers.
 *
 * Unlike the Dropdown / Combobox wrappers (which rewire the trigger/input
 * render via a children render-prop), the inline label here is injected
 * through Fluent's existing `contentBefore` slot — a much lighter-weight
 * integration that reuses the control's built-in layout.
 *
 * CoreAI default `appearance` is `'filled-darker'` (matches the other
 * input-family wrappers). Per-instance `className` overrides win (merged last).
 *
 * Styling is expressed with Griffel `makeStyles`.
 */
import * as React from 'react';
import {
  Input as FluentInput,
  type InputProps as FluentInputProps,
  type InputState as FluentInputState,
  type ForwardRefComponent,
  Label,
  makeStyles,
  mergeClasses,
  tokens,
  useId,
} from '@fluentui/react-components';
import { CopyButton } from './CopyButton.js';
import type { InlineLabelProps } from './inlineLabelProps.js';

const useInputStyles = makeStyles({
  // Collapse the default `contentBefore` spacing so the label sits snug
  // against the input text (the root already supplies a small flex gap).
  contentBefore: {
    marginRight: 0,
  },

  label: {
    cursor: 'text',
    fontSize: 'inherit',
    fontWeight: 600,
    lineHeight: 'inherit',
    color: tokens.colorNeutralForeground1,
  },

  // `dynamicWidth`: collapse the input to its content width and grow with the
  // typed content. Only applied when a `label` is present (enforced by type).
  dynamicWidthInput: {
    // https://caniuse.com/wf-field-sizing - Firefox not supported
    // this component still renders functionally without this property
    fieldSizing: 'content',
    maxWidth: '200px',
  },
  dynamicWidthLayout: {
    minWidth: 0,
  },

  truncatedInput: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // When the input is disabled, dim the inline label to match the native
  // disabled foreground (the label sets its own color otherwise).
  disabled: {
    '& [data-inline-label]': {
      color: tokens.colorNeutralForegroundDisabled,
    },
  },

  // Special-case styling applied to the root when the input is `readOnly`.
  // TODO: fill in the read-only treatment.
  readOnly: {
    '&::after, &:focus-within:active::after': {
      borderBottom: '2px solid var(--colorNeutralStroke1)',
    },
  },
});

// Trailing colon after the inline label when the input has a value (e.g.
// `Name: Ada`). Inert without a value or a `[data-inline-label]` element.
const useInputValueStyles = makeStyles({
  hasValue: {
    '& [data-inline-label]::after': {
      content: '":"',
    },
  },
});

// Custom style hook (registered in `../contexts/styleHooks.ts`). Runs after Fluent
// resolves `state`, exposing the live input value. Tags the root so the
// inline label gets its colon once a value is present.
export const useInputStyleHook = (stateUnknown: unknown): void => {
  const styles = useInputValueStyles();
  const state = stateUnknown as FluentInputState;
  const value = state.input?.value ?? state.input?.defaultValue;

  if (state.root && value) {
    state.root.className = mergeClasses(state.root.className, styles.hasValue);
  }
};

export type InputProps = FluentInputProps & InlineLabelProps;

/**
 * An Input component that extends Fluent UI's Input with an inline label.
 */
export const Input: ForwardRefComponent<InputProps> = React.forwardRef<
  HTMLInputElement,
  InputProps
>((props, ref) => {
  const {
    appearance = 'filled-darker',
    className,
    label,
    dynamicWidth,
    truncateTextOverflow = false,
    id,
    contentBefore,
    contentAfter,
    input,
    ...rest
  } = props;
  const styles = useInputStyles();
  const generatedId = useId();
  const inputId = label ? (id ?? generatedId) : id;

  // In read-only mode, surface a CopyButton in the `contentAfter` slot (unless
  // the caller already provided their own `contentAfter`).
  const copyValue = props.value ?? props.defaultValue;
  const resolvedContentAfter =
    props.readOnly && contentAfter == null ? (
      <CopyButton
        aria-label={`Copy ${label ?? 'value'}`}
        size="small"
        contentToCopy={copyValue ?? ''}
      />
    ) : (
      contentAfter
    );

  const inputObj =
    typeof input === 'object' && input !== null && !React.isValidElement(input)
      ? (input as Record<string, unknown>)
      : {};

  let inputSlot: FluentInputProps['input'] = input;
  if (label || dynamicWidth || truncateTextOverflow) {
    inputSlot = {
      ...inputObj,
      className: mergeClasses(
        inputObj.className as string | undefined,
        dynamicWidth && styles.dynamicWidthInput,
        truncateTextOverflow && styles.truncatedInput,
      ),
    };
  }

  return (
    <FluentInput
      ref={ref}
      appearance={appearance}
      id={inputId}
      className={mergeClasses(
        dynamicWidth && styles.dynamicWidthLayout,
        props.readOnly && styles.readOnly,
        props.disabled && styles.disabled,
        className,
      )}
      contentBefore={
        label
          ? {
              className: styles.contentBefore,
              children: (
                <Label
                  data-inline-label
                  className={mergeClasses('fui-Input__label', styles.label)}
                  htmlFor={inputId}
                >
                  {label}
                </Label>
              ),
            }
          : contentBefore
      }
      contentAfter={resolvedContentAfter}
      input={inputSlot}
      {...rest}
    />
  );
}) as ForwardRefComponent<InputProps>;

Input.displayName = 'Input';
