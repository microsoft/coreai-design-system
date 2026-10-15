// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import {
  type JSXElement,
  type CompoundButtonProps,
  CompoundButton,
} from '@coreai-ds/react-components';

import { CalendarMonthRegular } from '@fluentui/react-icons';

// Inline wrapper so RCM resolves CompoundButton props and this meta owns
// `Default` (the fork-id dedup in main.ts drops the vendored duplicate).

export const Default = (props: CompoundButtonProps): JSXElement => (
  <CompoundButton icon={<CalendarMonthRegular />} secondaryContent="Secondary content" {...props}>
    Example
  </CompoundButton>
);

/**
 * A compound button is a button with an additional slot for secondary textual content.
 *
 * Since both primary and secondary textual contents are part of a compound button's name they should be kept concise.
 *
 * @summary Button with an additional line of secondary text below the label.
 */
export default {
  title: 'Components/Button/CompoundButton',
  component: CompoundButton,
  parameters: { ...figmaDesign('Compound button') },
};
