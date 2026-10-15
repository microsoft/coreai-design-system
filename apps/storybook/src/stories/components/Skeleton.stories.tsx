// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Skeleton,
  SkeletonItem,
  type JSXElement,
  type SkeletonProps,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: Partial<SkeletonProps>): JSXElement => (
  <Skeleton {...props} aria-label="Loading Content">
    <SkeletonItem />
  </Skeleton>
);

/**
 * The `Skeleton` component is a temporary animation placeholder for when a service call takes time to return data and we don't want to block rendering the rest of the UI.
 *
 * @summary Animated placeholder shown while content is loading. Subcomponents: SkeletonItem.
 */
export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  subcomponents: { SkeletonItem },
  parameters: {
    ...figmaDesign('Skeleton'),
  },
};
