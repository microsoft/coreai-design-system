// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Label, SpinButton, useId } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default: StoryObj = {
  render: () => {
    const id = useId();

    const styles = /* css */ `
      .spin-button-default-example {
        display: flex;
        flex-direction: column;
        max-width: 500px;
      }

      .spin-button-default-example > .spin-button-default-example__label {
        margin-bottom: var(--spacingVerticalXXS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="spin-button-default-example">
          <Label className="spin-button-default-example__label" htmlFor={id}>
            Default SpinButton
          </Label>
          <SpinButton defaultValue={10} min={0} max={20} id={id} />
        </div>
      </>
    );
  },
};

/**
 * SpinButtons are used to allow numerical and non-numerical input bounded between minimum and maximum values with buttons to increment and decrement the input value.
 * Values can also be manipulated via the keyboard.
 *
 * @summary Numeric (or bounded) input with increment and decrement buttons.
 */
export default {
  title: 'Components/SpinButton',
  component: SpinButton,
  parameters: {
    ...figmaDesign('Spin button'),
  },
};
