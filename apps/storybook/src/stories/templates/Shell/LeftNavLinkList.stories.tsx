// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  HomeFilled,
  HomeRegular,
  ListFilled,
  ListRegular,
  bundleIcon,
} from '@fluentui/react-icons';
import { MemoryRouter } from 'react-router-dom';
import { LeftNavLinkList } from './LeftNavLinkList';
const meta = {
  title: 'Templates/App Shell/Left Nav Link List',
  component: LeftNavLinkList,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LeftNavLinkList>;
/** Copy-paste template — not an importable component. Copy `templates-app-shell-left-nav-link-list--source-code` and its router dependency. Shared by Left Nav and Mobile Left Nav. @summary Labelled navigation groups with active-route styling and native link behavior. */
export default meta;
/** The current route is marked with aria-current, including nested destinations. Bundled icons show their filled variant on the selected link. */
export const Default: StoryObj = {
  render: () => {
    const HomeIcon = bundleIcon(HomeFilled, HomeRegular);
    const ListIcon = bundleIcon(ListFilled, ListRegular);
    return (
      <MemoryRouter initialEntries={['/items/detail']}>
        <nav aria-label="Primary navigation">
          <LeftNavLinkList
            items={[
              { to: '/overview', label: 'Overview', icon: <HomeIcon />, sectionTitle: 'Workspace' },
              { to: '/items', label: 'Items', icon: <ListIcon /> },
            ]}
          />
        </nav>
      </MemoryRouter>
    );
  },
};
