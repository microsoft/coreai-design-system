// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Tab as CoreAITab, type TabProps as CoreAITabProps } from '@coreai-ds/react-components';
import type { NavLinkProps } from 'react-router-dom';
import { useRouterNavLinkSlot } from './RouterLinkSlots';

type RouterNavLinkProps = Omit<NavLinkProps, 'children' | 'className' | 'style'>;

export type TabLinkProps = Omit<CoreAITabProps, keyof RouterNavLinkProps | 'as' | 'value'> &
  RouterNavLinkProps;

export const TabLink = React.forwardRef<HTMLAnchorElement, TabLinkProps>((props, ref) => {
  const value = typeof props.to === 'string' ? props.to : (props.to.pathname ?? '');
  const [RouterLinkSlot, tabProps] = useRouterNavLinkSlot(props, 'tab');

  return (
    <CoreAITab
      {...(tabProps as CoreAITabProps)}
      as={RouterLinkSlot as unknown as 'button'}
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      value={value}
    />
  );
});

TabLink.displayName = 'TabLink';
