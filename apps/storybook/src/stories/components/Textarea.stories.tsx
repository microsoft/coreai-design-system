// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Field, Textarea, type JSXElement, type TextareaProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<TextareaProps>): JSXElement => (
  <Field label="Default Textarea">
    <Textarea {...props} />
  </Field>
);

/**
 * Textarea allows the user to enter and edit multiline text.
 *
 * @summary Multi-line field for entering and editing text.
 */
export default {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    ...figmaDesign('Textarea'),
  },
};
