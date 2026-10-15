// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  MenuItemLink as CoreAIMenuItemLink,
  type MenuItemLinkProps as CoreAIMenuItemLinkProps,
} from '@coreai-ds/react-components';
import { useHref, type LinkProps as RouterLinkProps } from 'react-router-dom';
import { useRouterLinkSlot } from './RouterLinkSlots';

export type MenuItemLinkProps = Omit<
  CoreAIMenuItemLinkProps,
  keyof RouterLinkProps | 'as' | 'href'
> &
  RouterLinkProps;

export const MenuItemLink = React.forwardRef<HTMLAnchorElement, MenuItemLinkProps>((props, ref) => {
  const href = useHref(props.to, { relative: props.relative });
  const [RouterLinkSlot, menuItemProps] = useRouterLinkSlot(props);

  return (
    <CoreAIMenuItemLink
      {...menuItemProps}
      as={RouterLinkSlot as unknown as 'a'}
      href={href}
      ref={ref}
    />
  );
});

MenuItemLink.displayName = 'MenuItemLink';
