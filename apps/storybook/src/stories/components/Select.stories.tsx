// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Select, useId, type JSXElement, type SelectProps } from '@coreai-ds/react-components';

import * as React from 'react';

export const Default = (props: SelectProps): JSXElement => {
  const selectId = useId();

  return (
    <>
      <label htmlFor={selectId}>Color</label>
      <Select id={selectId} {...props}>
        <option>Red</option>
        <option>Green</option>
        <option>Blue</option>
      </Select>
    </>
  );
};

/**
 * A Select allows one option to be selected from multiple options.
 * The Select component is a wrapper around the native `<select>` element.
 *
 * @summary Wrapper around the native select element for choosing one option.
 */
export default {
  title: 'Components/Select',
  component: Select,
};
