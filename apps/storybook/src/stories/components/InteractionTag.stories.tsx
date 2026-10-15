// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
  type InteractionTagProps,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<InteractionTagProps>): JSXElement => (
  <InteractionTag {...props}>
    <InteractionTagPrimary>Primary text</InteractionTagPrimary>
  </InteractionTag>
);

/**
 * A InteractionTag follows the same characteristics as a Tag, but with the added functionality of having a primary and secondary action. This is mostly used in scenarios where gaining more context for a InteractionTag is available for the user, an example would be clicking into a persona to expand their profile page.
 *
 * @summary Tag with primary and secondary actions. Subcomponents: InteractionTagPrimary, InteractionTagSecondary.
 */
export default {
  title: 'Components/Tag/InteractionTag',
  component: InteractionTag,
  subcomponents: { InteractionTagPrimary, InteractionTagSecondary },
  parameters: {
    ...figmaDesign('Interaction tag'),
  },
};
