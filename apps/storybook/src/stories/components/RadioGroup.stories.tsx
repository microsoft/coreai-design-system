// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Field,
  Radio,
  RadioGroup,
  type JSXElement,
  type RadioGroupProps,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<RadioGroupProps>): JSXElement => (
  <Field label="Favorite Fruit">
    <RadioGroup {...props}>
      <Radio value="apple" label="Apple" />
      <Radio value="pear" label="Pear" />
      <Radio value="banana" label="Banana" />
      <Radio value="orange" label="Orange" />
    </RadioGroup>
  </Field>
);

/**
 * RadioGroup lets people select a single option from two or more Radio items. Use RadioGroup to present all available choices if there's enough space. For more than 5 choices, consider using a different component such as Dropdown.
 *
 * @summary Lets people select a single option from two or more radio items. Subcomponents: Radio.
 */
export default {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  parameters: {
    ...figmaDesign('RadioGroup'),
  },
};
