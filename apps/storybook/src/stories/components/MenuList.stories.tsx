// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuItemLink,
  MenuItemRadio,
  MenuList,
  MenuSplitGroup,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

/**
 * Displays a standalone list of common editing actions.
 */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .menu-list-default-example {
        background-color: var(--colorNeutralBackground1);
        min-width: 128px;
        min-height: 48px;
        max-width: 300px;
        width: max-content;
        box-shadow: var(--shadow16);
        padding-top: var(--spacingVerticalXS);
        padding-bottom: var(--spacingVerticalXS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <MenuList className="menu-list-default-example">
          <MenuItem>Cut</MenuItem>
          <MenuItem>Paste</MenuItem>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </>
    );
  },
};

/**
 * A menu list displays a list of actions. It is usually rendered inside of the Menu component.
 *
 * @summary Standalone list of menu actions, usually rendered inside a Menu. Subcomponents: MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemCheckbox, MenuItemLink, MenuItemRadio, MenuSplitGroup.
 */
export default {
  title: 'Components/Menu/MenuList',
  component: MenuList,
  subcomponents: {
    MenuDivider,
    MenuGroup,
    MenuGroupHeader,
    MenuItem,
    MenuItemCheckbox,
    MenuItemLink,
    MenuItemRadio,
    MenuSplitGroup,
  },
};
