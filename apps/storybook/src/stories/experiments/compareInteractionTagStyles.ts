// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  captureTagParts,
  captureTagStyles,
  compareTagStyles,
  tagPartProperties,
  tagRootProperties,
} from './compareTagStyles.js';

export { compareTagStyles as compareInteractionTagStyles } from './compareTagStyles.js';

export function captureInteractionTagStyles(root: HTMLElement): Record<string, string> {
  return captureTagParts(
    root,
    root.hasAttribute('data-tag-group')
      ? ['display', 'column-gap', 'row-gap', 'flex-wrap', 'align-items', 'box-sizing']
      : ['display', 'align-items', 'box-sizing', 'border-radius'],
    {
      ...tagPartProperties,
      item: ['display', 'align-items', 'box-sizing', 'border-radius'],
      primary: tagRootProperties,
      secondary: tagRootProperties,
    },
  );
}

export function compareTagGroupStyles(
  legacyRoot: HTMLElement,
  headlessRoot: HTMLElement,
  interaction: boolean,
  consumer = false,
) {
  const capture = interaction ? captureInteractionTagStyles : captureTagStyles;
  return compareTagStyles(capture(legacyRoot), capture(headlessRoot), consumer);
}
