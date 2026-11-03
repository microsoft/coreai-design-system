// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export {
  captureCopyButtonStyles as captureLinkButtonStyles,
  compareCopyButtonStyles as compareLinkButtonStyles,
  settleCopyButtonStyles as settleLinkButtonStyles,
  type CopyButtonStyleDifference as LinkButtonStyleDifference,
} from './CopyButtonComparisonStyles.js';

export function getComparisonLinkButton(
  container: ParentNode,
  implementation: 'legacy' | 'headless',
): HTMLAnchorElement {
  const root = container.querySelector(`[data-link-button-implementation="${implementation}"]`);
  if (!(root instanceof HTMLAnchorElement))
    throw new Error(`Missing ${implementation} LinkButton anchor`);
  return root;
}
