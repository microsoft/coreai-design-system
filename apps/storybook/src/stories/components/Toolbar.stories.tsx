// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  ToolbarToggleButton,
  type JSXElement,
  type ToolbarProps,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';
import {
  FontIncrease24Regular,
  FontDecrease24Regular,
  TextFont24Regular,
  MoreHorizontal24Filled,
} from '@fluentui/react-icons';

export const Default = (props: Partial<ToolbarProps>): JSXElement => (
  <Toolbar aria-label="Default" {...props}>
    <ToolbarButton
      aria-label="Increase Font Size"
      appearance="primary"
      icon={<FontIncrease24Regular />}
    />
    <ToolbarButton aria-label="Decrease Font Size" icon={<FontDecrease24Regular />} />
    <ToolbarButton aria-label="Reset Font Size" icon={<TextFont24Regular />} />
    <ToolbarDivider />
    <Menu>
      <MenuTrigger>
        <ToolbarButton aria-label="More" icon={<MoreHorizontal24Filled />} />
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
  </Toolbar>
);

/**
 * A toolbar is a container for grouping a set of controls, such as buttons, menu buttons, or checkboxes.
 *
 * @summary Container that groups controls such as buttons and menus. Subcomponents: ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarRadioButton, ToolbarRadioGroup, ToolbarToggleButton.
 */
export default {
  title: 'Components/Toolbar',
  component: Toolbar,
  subcomponents: {
    ToolbarButton,
    ToolbarDivider,
    ToolbarGroup,
    ToolbarRadioButton,
    ToolbarRadioGroup,
    ToolbarToggleButton,
  },
  parameters: {
    ...figmaDesign('Toolbar'),
  },
};
