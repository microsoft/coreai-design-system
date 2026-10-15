// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  TabList as CoreAITabList,
  type TabListProps as CoreAITabListProps,
} from '@coreai-ds/react-components';
import {
  matchPath,
  parsePath,
  resolvePath,
  useLocation,
  useResolvedPath,
  type NavLinkProps,
} from 'react-router-dom';
import { TabLink, type TabLinkProps } from './TabLink';

export interface TabLinkListProps extends Omit<CoreAITabListProps, 'children' | 'selectedValue'> {
  links: Array<Omit<TabLinkProps, 'children'> & { label: React.ReactNode }>;
}

function pathFor(to: NavLinkProps['to']): string {
  return typeof to === 'string' ? to : (to.pathname ?? '');
}

export function TabLinkList({ links, ...props }: TabLinkListProps): React.JSX.Element {
  const { pathname } = useLocation();
  const base = useResolvedPath('.').pathname;
  const selectedValue = links.find(({ caseSensitive, end, to }) => {
    const destination = typeof to === 'string' ? parsePath(to) : to;
    const path = resolvePath(destination, destination.pathname ? base : pathname).pathname;
    return matchPath({ path, caseSensitive, end: path === '/' || (end ?? false) }, pathname);
  });

  return (
    <CoreAITabList {...props} selectedValue={selectedValue ? pathFor(selectedValue.to) : ''}>
      {links.map(({ label, ...linkProps }) => (
        <TabLink key={pathFor(linkProps.to)} {...linkProps}>
          {label}
        </TabLink>
      ))}
    </CoreAITabList>
  );
}
