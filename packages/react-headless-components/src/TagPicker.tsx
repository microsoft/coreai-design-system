// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTagPicker,
  useTagPicker,
  useTagPickerContextValues,
  type TagPickerProps as HeadlessTagPickerProps,
  type TagPickerSize,
} from '@fluentui/react-headless-components-preview/tag-picker';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';

export {
  useTagPickerContext_unstable,
  useTagPickerContextValues,
  useTagPickerFilter,
} from '@fluentui/react-headless-components-preview/tag-picker';
export type {
  TagPickerContextValue,
  TagPickerContextValues,
  TagPickerOnOpenChangeData,
  TagPickerOnOptionSelectData,
  TagPickerSize,
  TagPickerSlots,
  TagPickerState,
} from '@fluentui/react-headless-components-preview/tag-picker';

export type TagPickerAppearance = 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';

export type TagPickerProps = HeadlessTagPickerProps & {
  /** Control appearance. CoreAI defaults to filled-darker; Fluent defaults to outline. */
  appearance?: TagPickerAppearance;
  /** Sizes the control, input, button and selected tags. @default 'medium' */
  size?: TagPickerSize;
};

export function TagPicker(props: TagPickerProps): React.ReactElement {
  const defaultsEnabled = useCoreAIDefaults();
  const {
    appearance = 'outline',
    size = 'medium',
    ...headlessProps
  } = defaultsEnabled ? { appearance: 'filled-darker' as const, ...props } : props;
  const state = { ...useTagPicker(headlessProps), appearance, size };
  return renderTagPicker(state, useTagPickerContextValues(state));
}

TagPicker.displayName = 'TagPicker';
