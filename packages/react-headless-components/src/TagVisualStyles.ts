// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { TagState } from '@fluentui/react-headless-components-preview/tag';
import type { TagSize } from './TagVisualContext.js';
import overrides from './TagVisual.overrides.module.css';

type VisualSlot = 'media' | 'icon' | 'primaryText' | 'secondaryText';

export function applyTagVisualSlots(
  state: Pick<TagState, VisualSlot>,
  size: TagSize,
  classNames: Record<VisualSlot, string>,
  classes: Record<VisualSlot, string>,
  defaultsEnabled: boolean,
) {
  for (const name of ['media', 'icon', 'primaryText', 'secondaryText'] as const) {
    const resolved = state[name];
    if (!resolved) continue;
    resolved.className = [
      classNames[name],
      classes[name],
      name === 'primaryText' && defaultsEnabled && overrides.TagVisual__primaryText,
      resolved.className,
    ]
      .filter(Boolean)
      .join(' ');
    Object.assign(resolved, {
      'data-size': size,
      ...(name === 'primaryText' && {
        'data-has-secondary-text': state.secondaryText ? '' : undefined,
      }),
    });
  }
}
