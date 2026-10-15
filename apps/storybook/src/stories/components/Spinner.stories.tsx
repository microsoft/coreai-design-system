// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Spinner, type JSXElement, type SpinnerProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<SpinnerProps>): JSXElement => <Spinner {...props} />;

/**
 * A spinner alerts a user that content is being loaded or processed and they should wait for the activity to complete.
 *
 * @summary Indicates that content is loading or processing.
 */
export default {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    ...figmaDesign('Spinner'),
  },
};
