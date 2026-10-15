// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Rating, RatingItem, type JSXElement, type RatingProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<RatingProps>): JSXElement => {
  return <Rating {...props} />;
};

/**
 * A `Rating` component allows users to provide a rating for a particular item.
 *
 * `Rating` allows customers to determine a sense of value of a good or a service. By default, the rating is selected out of 5 stars, but the number and symbol used can be customized.
 *
 * To display the result of other users' rating values, use `RatingDisplay` instead.
 *
 * @summary Lets users provide a star rating for an item. Subcomponents: RatingItem.
 */
export default {
  title: 'Components/Rating',
  component: Rating,
  subcomponents: { RatingItem },
  parameters: {
    ...figmaDesign('Rating'),
  },
};
