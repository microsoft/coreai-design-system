// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import {
  HomeFilled,
  HomeRegular,
  ListFilled,
  ListRegular,
  bundleIcon,
} from '@fluentui/react-icons';
import { MobileLeftNav } from './MobileLeftNav';
const meta = {
  title: 'Templates/App Shell/Mobile Left Nav',
  component: MobileLeftNav,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MobileLeftNav>;
/** Copy-paste template — not an importable component. Copy `templates-app-shell-mobile-left-nav--source-code` and dependencies. Uses the same navigation items as Left Nav. @summary Modal mobile navigation with top tabs, route links, and dismissal focus return. */
export default meta;
/** Navigation closes after choosing a route or pressing Escape. */
export const Default: StoryObj = {
  render: () => {
    const HomeIcon = bundleIcon(HomeFilled, HomeRegular);
    const ListIcon = bundleIcon(ListFilled, ListRegular);
    return (
      <MemoryRouter>
        <MobileLeftNav
          items={[
            { to: '/', label: 'Overview', icon: <HomeIcon /> },
            { to: '/items', label: 'Items', icon: <ListIcon /> },
          ]}
          topItems={[
            { to: '/', label: 'Workspace' },
            { to: '/settings', label: 'Settings' },
          ]}
        />
      </MemoryRouter>
    );
  },
};
