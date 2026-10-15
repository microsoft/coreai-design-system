// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button, Menu, MenuList, MenuPopover, MenuTrigger } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { MenuItemLink } from './MenuItemLink';

/**
 * CoreAI MenuItemLinks that navigate with React Router.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button>Open menu</Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItemLink to="/settings">Settings</MenuItemLink>
            <MenuItemLink to="/help">Help</MenuItemLink>
          </MenuList>
        </MenuPopover>
      </Menu>
    </MemoryRouter>
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-menu-item-link--source-code` docs entry.
 *
 * Adapts the CoreAI MenuItemLink root to React Router's Link component.
 *
 * @summary CoreAI MenuItemLink adapter for React Router navigation.
 */
const meta: Meta = {
  title: 'Templates/React Router/Menu Item Link',
  parameters: { layout: 'fullscreen' },
};

export default meta;
