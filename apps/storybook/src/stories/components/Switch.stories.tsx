// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Switch, type JSXElement, type SwitchProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: SwitchProps): JSXElement => (
  <Switch label="This is a switch" {...props} />
);

Default.argTypes = {
  checked: {
    control: {
      type: 'inline-radio',
      options: [undefined, false, true],
    },
  },
  defaultChecked: {
    control: {
      type: 'inline-radio',
      options: [false, true],
    },
  },
};

/**
 * A switch represents a physical switch that allows someone to choose between two mutually exclusive options. For example, "On/Off" and "Show/Hide". Choosing an option should produce an immediate result.
 *
 * @summary Toggles between two mutually exclusive options, such as on and off.
 */
export default {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    ...figmaDesign('Switch'),
  },
};
