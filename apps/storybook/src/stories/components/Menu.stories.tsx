// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuItemLink,
  MenuItemRadio,
  MenuItemSwitch,
  MenuList,
  MenuPopover,
  MenuSplitGroup,
  MenuTrigger,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => (
  <Menu positioning={{ autoSize: true }}>
    <MenuTrigger disableButtonEnhancement>
      <Button>Toggle menu</Button>
    </MenuTrigger>

    <MenuPopover>
      <MenuList>
        <MenuItem>New </MenuItem>
        <MenuItem>New Window</MenuItem>
        <MenuItem disabled>Open File</MenuItem>
        <MenuItem>Open Folder</MenuItem>
      </MenuList>
    </MenuPopover>
  </Menu>
);

/**
 * A menu displays a list of actions. The Menu component handles the
 * state management of the passed in list of actions.
 *
 * @summary Displays a list of actions in a popup surface. Subcomponents: MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemCheckbox, MenuItemLink, MenuItemRadio, MenuList, MenuPopover, MenuSplitGroup, MenuTrigger, MenuItemSwitch.
 */
export default {
  title: 'Components/Menu/Menu',
  component: Menu,
  subcomponents: {
    MenuDivider,
    MenuGroup,
    MenuGroupHeader,
    MenuItem,
    MenuItemCheckbox,
    MenuItemLink,
    MenuItemRadio,
    MenuList,
    MenuPopover,
    MenuSplitGroup,
    MenuTrigger,
    MenuItemSwitch,
  },
  parameters: {
    ...figmaDesign('Menu'),
  },
};
