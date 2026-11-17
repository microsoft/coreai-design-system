// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import {
  HomeFilled,
  HomeRegular,
  ListFilled,
  ListRegular,
  SettingsFilled,
  SettingsRegular,
  bundleIcon,
} from '@fluentui/react-icons';
import { LeftNav } from './LeftNav';
const meta = {
  title: 'Templates/App Shell/Left Nav',
  component: LeftNav,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof LeftNav>;
/** Copy-paste template — not an importable component. Copy `templates-app-shell-left-nav--source-code` and dependencies. Reuses Left Nav Link List; App Shell substitutes Mobile Left Nav on small screens. @summary Grouped route-aware navigation with collapse control and bottom links. */
export default meta;
/** Collapse labels to an icon rail while keeping accessible names and tooltips. */
export const Default: StoryObj = {
  render: () => {
    const HomeIcon = bundleIcon(HomeFilled, HomeRegular);
    const ListIcon = bundleIcon(ListFilled, ListRegular);
    const SettingsIcon = bundleIcon(SettingsFilled, SettingsRegular);
    const styles = /* css */ `.left-nav-example { display: flex; height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <MemoryRouter initialEntries={['/overview']}>
          <div className="left-nav-example">
            <LeftNav
              items={[
                {
                  to: '/overview',
                  label: 'Overview',
                  icon: <HomeIcon />,
                  sectionTitle: 'Workspace',
                },
                { to: '/items', label: 'Items', icon: <ListIcon /> },
                {
                  to: '/settings',
                  label: 'Settings',
                  icon: <SettingsIcon />,
                  placement: 'bottom',
                },
              ]}
            />
          </div>
        </MemoryRouter>
      </>
    );
  },
};
