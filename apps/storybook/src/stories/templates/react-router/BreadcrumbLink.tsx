// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBreadcrumbButton_unstable,
  useBreadcrumbButtonStyles_unstable,
  useBreadcrumbButton_unstable,
  type BreadcrumbButtonProps as CoreAIBreadcrumbButtonProps,
} from '@coreai-ds/react-components';
import { useHref, type LinkProps as RouterLinkProps } from 'react-router-dom';
import { useRouterLinkSlot } from './RouterLinkSlots';

export type BreadcrumbLinkProps = Omit<
  CoreAIBreadcrumbButtonProps,
  keyof RouterLinkProps | 'as' | 'href'
> &
  RouterLinkProps;

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  (props, ref) => {
    const href = useHref(props.to, { relative: props.relative });
    const [RouterLinkSlot, breadcrumbButtonProps] = useRouterLinkSlot(props);
    const breadcrumbProps = {
      ...(breadcrumbButtonProps as CoreAIBreadcrumbButtonProps),
      as: 'a',
      href,
    } as CoreAIBreadcrumbButtonProps;
    const breadcrumbRef = ref as unknown as React.Ref<HTMLButtonElement>;
    const breadcrumbState = useBreadcrumbButton_unstable(breadcrumbProps, breadcrumbRef);

    (breadcrumbState.root as unknown as { as?: React.ElementType }).as = RouterLinkSlot;
    useBreadcrumbButtonStyles_unstable(breadcrumbState);

    return renderBreadcrumbButton_unstable(breadcrumbState);
  },
);

BreadcrumbLink.displayName = 'BreadcrumbLink';
