// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { type JSXElement, type ToggleButtonProps, ToggleButton } from '@coreai-ds/react-components';

// Inline wrapper — see CompoundButton.stories.tsx.

export const Default = (props: ToggleButtonProps): JSXElement => (
  <ToggleButton {...props}>Example</ToggleButton>
);

/**
 * A toggle button is a button that can be checked on and off.
 *
 * @summary Button that can be toggled between checked and unchecked states.
 */
export default {
  title: 'Components/Button/ToggleButton',
  component: ToggleButton,
};
