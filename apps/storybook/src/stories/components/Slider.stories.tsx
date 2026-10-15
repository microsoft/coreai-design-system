// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Label, Slider, useId, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => {
  const id = useId();
  return (
    <>
      <Label htmlFor={id}>Basic Example</Label>
      <Slider defaultValue={20} id={id} />
    </>
  );
};

/**
 * A Slider represents an input that allows user to choose a value from within a specific range.
 *
 * @summary Input for choosing a value from within a range.
 */
export default {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    ...figmaDesign('Slider'),
  },
};
