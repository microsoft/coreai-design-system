// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Tag, type JSXElement, type TagProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<TagProps>): JSXElement => <Tag {...props}>Primary text</Tag>;

/**
 * A Tag provides a visual representation of an attribute, person, or asset.
 *
 * @summary Visual representation of an attribute, person, or asset.
 */
export default {
  title: 'Components/Tag/Tag',
  component: Tag,
  parameters: {
    ...figmaDesign('Tag'),
  },
};
