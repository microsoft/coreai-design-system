// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Label, type JSXElement, type LabelProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: LabelProps): JSXElement => <Label {...props}>This is a label</Label>;

/**
 * A label provides a name or title for an input.
 *
 * @summary Provides a name or title for an input.
 */
export default {
  title: 'Components/Label',
  component: Label,
  parameters: {
    ...figmaDesign('Label'),
  },
};
