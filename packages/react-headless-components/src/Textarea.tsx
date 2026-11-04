// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTextarea,
  useTextarea,
  type TextareaProps as HeadlessTextareaProps,
} from '@fluentui/react-headless-components-preview/textarea';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import styles from './Textarea.module.css';
import './Textarea.overrides.module.css';

export type { TextareaSlots } from '@fluentui/react-headless-components-preview/textarea';

export type TextareaOnChangeData = Parameters<NonNullable<HeadlessTextareaProps['onChange']>>[1];

export const textareaClassNames = {
  root: 'fui-Textarea',
  textarea: 'fui-Textarea__textarea',
} as const;

export type TextareaProps = HeadlessTextareaProps & {
  /**
   * Visual appearance.
   * Disabling CoreAI component defaults restores 'outline'.
   * Explicit undefined clears the CoreAI appearance default.
   * @default 'filled-darker'
   */
  appearance?: 'outline' | 'filled-darker' | 'filled-lighter';
  /** Inherits Field size when omitted. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const defaultsEnabled = useCoreAIDefaults();
    const fieldContext = useFieldContext();
    const defaultAppearance =
      defaultsEnabled && !Object.prototype.hasOwnProperty.call(props, 'appearance')
        ? 'filled-darker'
        : 'outline';
    const { appearance = defaultAppearance, size: sizeProp, ...baseProps } = props;
    const size = sizeProp ?? fieldContext?.size ?? 'medium';
    const state = useTextarea(baseProps, ref);

    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-size': size,
      'data-read-only': state.textarea.readOnly ? '' : undefined,
      'data-required': state.textarea.required ? '' : undefined,
      'data-has-value': String(state.textarea.value ?? '').length ? '' : undefined,
    });
    state.root.className = [textareaClassNames.root, styles.Textarea, state.root.className]
      .filter(Boolean)
      .join(' ');
    state.textarea.className = [
      textareaClassNames.textarea,
      styles.Textarea__textarea,
      state.textarea.className,
    ]
      .filter(Boolean)
      .join(' ');

    return renderTextarea(state);
  },
);

Textarea.displayName = 'Textarea';
