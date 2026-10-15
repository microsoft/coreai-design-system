// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { RatingDisplay, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => <RatingDisplay value={4} />;

/**
 * `RatingDisplay` is used to communicate user sentiment. By default, it shows rating as filled stars out of 5, as well as a text displaying the average value and the aggregate number of ratings.
 *
 * @summary Read-only display of an average rating with stars and count.
 */
export default {
  title: 'Components/RatingDisplay',
  component: RatingDisplay,
  parameters: {
    ...figmaDesign('RatingDisplay'),
  },
};
