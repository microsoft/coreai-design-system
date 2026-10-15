// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Field, Input, type FieldProps, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<FieldProps>): JSXElement => (
  <Field
    label="Example field"
    validationState="success"
    validationMessage="This is a success message."
    {...props}
  >
    <Input />
  </Field>
);

/**
 * Field adds a label, validation message, and hint text to a control.
 *
 * @summary Wraps a control with a label, hint, and validation message.
 */
export default {
  title: 'Components/Field',
  component: Field,
  parameters: {
    ...figmaDesign('Field'),
  },
};
