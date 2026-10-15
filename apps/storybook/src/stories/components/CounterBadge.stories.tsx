// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CounterBadge, type CounterBadgeProps, type JSXElement } from '@coreai-ds/react-components';

import * as React from 'react';

export const Default = (args: CounterBadgeProps): JSXElement => <CounterBadge {...args} />;

Default.args = {
  count: 5,
};

/**
 * A counter badge is a badge that displays a numerical count.
 *
 * @summary Badge that displays a numerical count.
 */
export default {
  title: 'Components/Badge/Counter Badge',
  component: CounterBadge,
};
