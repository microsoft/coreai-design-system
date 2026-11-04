// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { InfoButtonSlots as HeadlessInfoButtonSlots } from '@fluentui/react-headless-components-preview/info-label';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { InfoButtonBase, type InfoButtonBaseProps } from './InfoButtonBase.js';

export { infoButtonClassNames } from './InfoButtonBase.js';

export type InfoButtonSlots = Omit<HeadlessInfoButtonSlots, 'popover'> & {
  popover: NonNullable<InfoButtonBaseProps['popover']>;
};

/** CoreAI standalone information buttons require a consumer-supplied accessible name. */
export type InfoButtonProps = InfoButtonBaseProps &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

export const InfoButton: ForwardRefComponent<InfoButtonProps> = React.forwardRef<
  HTMLButtonElement,
  InfoButtonProps
>(function InfoButton({ info, ...props }, ref) {
  // Match CoreAI's primitive-content naming without changing rich or explicitly named slots.
  const accessibleInfo =
    typeof info === 'string' || typeof info === 'number'
      ? { 'aria-label': String(info), children: info }
      : info;
  return <InfoButtonBase {...props} info={accessibleInfo} ref={ref} />;
});

InfoButton.displayName = 'InfoButton';
