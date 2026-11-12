// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInteractionTag,
  useInteractionTag,
  useInteractionTagContextValues,
  type InteractionTagProps as HeadlessInteractionTagProps,
} from '@fluentui/react-headless-components-preview/interaction-tag';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import {
  InteractionTagVisualContext,
  TagGroupVisualContext,
  type TagVisualOptions,
} from './TagVisualContext.js';
import styles from './InteractionTag.module.css';

export { useInteractionTagContextValues } from '@fluentui/react-headless-components-preview/interaction-tag';
export type {
  InteractionTagContextValues,
  InteractionTagSlots,
  InteractionTagState,
} from '@fluentui/react-headless-components-preview/interaction-tag';

export type InteractionTagProps = HeadlessInteractionTagProps & TagVisualOptions;
export const interactionTagClassNames = { root: 'fui-InteractionTag' } as const;

export const InteractionTag: ForwardRefComponent<InteractionTagProps> = React.forwardRef<
  HTMLDivElement,
  InteractionTagProps
>(function InteractionTag(
  { appearance: appearanceProp, shape = 'rounded', size: sizeProp, ...props },
  ref,
) {
  const context = React.useContext(TagGroupVisualContext);
  const appearance = appearanceProp ?? context.appearance;
  const size = sizeProp ?? context.size;
  const state = { ...useInteractionTag(props, ref), appearance, shape, size };
  state.root.className = [
    interactionTagClassNames.root,
    styles.InteractionTag,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-shape': shape,
    'data-size': size,
  });
  return (
    <InteractionTagVisualContext.Provider value={{ appearance, shape, size }}>
      {renderInteractionTag(state, useInteractionTagContextValues(state))}
    </InteractionTagVisualContext.Provider>
  );
});

InteractionTag.displayName = 'InteractionTag';
