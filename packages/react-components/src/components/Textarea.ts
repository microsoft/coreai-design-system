// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Textarea as FluentTextarea,
  type ForwardRefComponent,
  type TextareaProps as FluentTextareaProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAITextareaAppearanceProps {
  /**
   * Styling the Textarea should use.
   * @default 'filled-darker'
   */
  appearance?: FluentTextareaProps['appearance'];
}

export type TextareaProps = WithDefaultPropDocs<FluentTextareaProps, CoreAITextareaAppearanceProps>;

export const Textarea = withComponentDefaults<TextareaProps>(FluentTextarea, {
  appearance: 'filled-darker',
}) as ForwardRefComponent<TextareaProps>;
