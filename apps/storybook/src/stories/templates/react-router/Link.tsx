// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Link as CoreAILink, type LinkProps as CoreAILinkProps } from '@coreai-ds/react-components';
import type { LinkProps as RouterLinkProps } from 'react-router-dom';
import { useRouterLinkSlot } from './RouterLinkSlots';

export type LinkProps = Omit<CoreAILinkProps, keyof RouterLinkProps | 'as' | 'href'> &
  RouterLinkProps;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const [RouterLinkSlot, linkProps] = useRouterLinkSlot(props);

  return <CoreAILink {...linkProps} as={RouterLinkSlot as unknown as 'a'} ref={ref} />;
});

Link.displayName = 'Link';
