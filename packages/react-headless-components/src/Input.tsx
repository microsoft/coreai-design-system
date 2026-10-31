// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInput,
  useInput,
  type InputProps as HeadlessInputProps,
} from '@fluentui/react-headless-components-preview/input';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import { CopyButton, useId } from '@coreai-ds/react-components';
import styles from './Input.module.css';
import overrides from './Input.overrides.module.css';

export const inputClassNames = {
  root: 'fui-Input',
  input: 'fui-Input__input',
  contentBefore: 'fui-Input__contentBefore',
  contentAfter: 'fui-Input__contentAfter',
  label: 'fui-Input__label',
} as const;

export type InputOnChangeData = Parameters<NonNullable<HeadlessInputProps['onChange']>>[1];

export type InputProps = HeadlessInputProps & {
  /** Matches the CoreAI wrapper, including when provider defaults are disabled. @default 'filled-darker' */
  appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
  /** Inherits Field size when omitted. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /** Truncate long values with an ellipsis. */
  truncateTextOverflow?: boolean;
} & (
    | {
        /** Inline label, associated with the resolved native input id. */
        label: string;
        /** Use native field-sizing: content, capped at 200px. */
        dynamicWidth?: boolean;
      }
    | {
        label?: undefined;
        dynamicWidth?: never;
      }
  );

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    appearance = 'filled-darker',
    size: sizeProp,
    label,
    dynamicWidth = false,
    truncateTextOverflow = false,
    contentBefore,
    contentAfter,
    ...props
  },
  ref,
) {
  const field = useFieldContext();
  const generatedId = useId('headless-input');
  const size = sizeProp ?? field?.size ?? 'medium';
  const hasLabel = Boolean(label);
  // The legacy wrapper bases copy composition on the top-level props, not the native slot.
  const resolvedContentAfter =
    props.readOnly && contentAfter == null ? (
      <CopyButton
        aria-label={`Copy ${label ?? 'value'}`}
        size="small"
        contentToCopy={props.value ?? props.defaultValue ?? ''}
      />
    ) : (
      contentAfter
    );
  const state = useInput(
    {
      ...props,
      contentBefore: hasLabel ? {} : contentBefore,
      contentAfter: resolvedContentAfter,
    },
    ref,
  );

  if (hasLabel && state.contentBefore) {
    state.input.id ??= generatedId;
    state.contentBefore.children = (
      <label
        className={`${inputClassNames.label} ${overrides.Input__label}`}
        data-inline-label=""
        htmlFor={state.input.id}
      >
        {label}
      </label>
    );
  }

  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-size': size,
    'data-read-only': state.input.readOnly ? '' : undefined,
    'data-has-content-before': state.contentBefore ? '' : undefined,
    'data-has-content-after': state.contentAfter ? '' : undefined,
    'data-has-label': hasLabel ? '' : undefined,
    'data-has-value': String(state.input.value ?? '').length ? '' : undefined,
    'data-dynamic-width': dynamicWidth ? '' : undefined,
    'data-truncate-text-overflow': truncateTextOverflow ? '' : undefined,
    // Keep legacy wrapper-level visual choices separate from resolved headless behavior.
    'data-coreai-read-only': props.readOnly ? '' : undefined,
    'data-coreai-disabled': props.disabled ? '' : undefined,
  });
  state.root.className = [inputClassNames.root, styles.Input, overrides.Input, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.input.className = [
    inputClassNames.input,
    styles.Input__input,
    overrides.Input__input,
    state.input.className,
  ]
    .filter(Boolean)
    .join(' ');

  if (state.contentBefore) {
    state.contentBefore.className = [
      inputClassNames.contentBefore,
      styles.Input__contentBefore,
      hasLabel && overrides.Input__contentBefore,
      state.contentBefore.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.contentAfter) {
    state.contentAfter.className = [
      inputClassNames.contentAfter,
      styles.Input__contentAfter,
      state.contentAfter.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderInput(state);
});

Input.displayName = 'Input';
