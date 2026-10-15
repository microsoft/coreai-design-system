// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Checkbox, type CheckboxProps, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: CheckboxProps): JSXElement => <Checkbox {...props} />;
Default.argTypes = {
  label: {
    control: 'text',
    defaultValue: 'Checkbox',
    type: 'string',
  },
  checked: {
    control: {
      type: 'inline-radio',
      options: [undefined, false, true, 'mixed'],
    },
  },
  size: {
    control: {
      type: 'inline-radio',
    },
  },
  defaultChecked: {
    control: {
      type: 'inline-radio',
      options: [false, true, 'mixed'],
    },
  },
};

/**
 * A checkbox lets a person select one or more items from a group, or toggle a
 * single option on or off.
 *
 * @summary A checkbox lets someone select items from a group or toggle an option on or off.
 */
export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    ...figmaDesign('Checkbox'),
  },
};
