// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import {
  type JSXElement,
  type MenuButtonProps,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
} from '@coreai-ds/react-components';

// Inline wrapper — see CompoundButton.stories.tsx.

const onClick = () => alert('Primary action button clicked.');

const primaryActionButtonProps = {
  onClick,
};

export const Default = (): JSXElement => (
  <Menu positioning="below-end">
    <MenuTrigger disableButtonEnhancement>
      {(triggerProps: MenuButtonProps) => (
        <SplitButton menuButton={triggerProps} primaryActionButton={primaryActionButtonProps}>
          Example
        </SplitButton>
      )}
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
 * A split button is a button with a primary action and a secondary action primarily used for opening a menu.
 *
 * @summary Button with a primary action and a secondary action that opens a menu.
 */
export default {
  title: 'Components/Button/SplitButton',
  component: SplitButton,
  parameters: { ...figmaDesign('Split button') },
};
