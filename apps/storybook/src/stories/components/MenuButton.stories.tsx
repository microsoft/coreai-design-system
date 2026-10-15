// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  type JSXElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from '@coreai-ds/react-components';

// Inline wrapper — see CompoundButton.stories.tsx.

export const Default = (): JSXElement => (
  <Menu>
    <MenuTrigger disableButtonEnhancement>
      <MenuButton>Example</MenuButton>
    </MenuTrigger>

    <MenuPopover>
      <MenuList>
        <MenuItem>Item a</MenuItem>
        <MenuItem>Item b</MenuItem>
      </MenuList>
    </MenuPopover>
  </Menu>
);

/**
 * A menu button is a button with a chevron icon after the text typically used to trigger a menu.
 *
 * @summary Button with a trailing chevron that opens a menu.
 */
export default {
  title: 'Components/Button/MenuButton',
  component: MenuButton,
};
