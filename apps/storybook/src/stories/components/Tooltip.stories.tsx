// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button, Tooltip, type JSXElement, type TooltipProps } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';
import { SlideTextRegular } from '@fluentui/react-icons';

export const Default = (props: Partial<TooltipProps>): JSXElement => (
  <Tooltip content="Example tooltip" relationship="label" {...props}>
    <Button icon={<SlideTextRegular />} size="large" />
  </Tooltip>
);

/**
 * A tooltip displays additional information about another component.
 * The information is displayed above and near the target component.
 *
 * Tooltip is not expected to handle interactive content.
 * If this is necessary behavior, an expand/collapse button + popover should be used instead.
 *
 * Hover or focus the buttons in the examples to see their tooltips.
 *
 * @summary Shows additional information about an element on hover or focus.
 */
export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    ...figmaDesign('Tooltip'),
  },
};
