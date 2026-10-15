// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  LinkButton as CoreAILinkButton,
  type LinkButtonProps as CoreAILinkButtonProps,
} from '@coreai-ds/react-components';
import { useHref, type LinkProps as RouterLinkProps } from 'react-router-dom';
import { useRouterLinkSlot } from './RouterLinkSlots';

export type LinkButtonProps = Omit<
  CoreAILinkButtonProps,
  keyof RouterLinkProps | 'as' | 'external' | 'href'
> &
  RouterLinkProps;

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>((props, ref) => {
  const href = useHref(props.to, { relative: props.relative });
  const [RouterLinkSlot, linkButtonProps] = useRouterLinkSlot(props);

  return <CoreAILinkButton {...linkButtonProps} as={RouterLinkSlot} href={href} ref={ref} />;
});

LinkButton.displayName = 'LinkButton';
