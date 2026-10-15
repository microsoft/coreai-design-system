// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  useIsOverflowItemVisible,
  useOverflowMenu,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

/**
 * Moves buttons that no longer fit in a resizable row into an overflow menu.
 */
export const Default: StoryObj = {
  render: () => {
    const itemIds = new Array(8).fill(0).map((_, index) => index.toString());

    const OverflowMenuItem = ({ id }: { id: string }) => {
      const isVisible = useIsOverflowItemVisible(id);

      if (isVisible) {
        return null;
      }

      return <MenuItem>Item {id}</MenuItem>;
    };

    const OverflowMenu = ({ ids }: { ids: string[] }) => {
      const { ref, overflowCount, isOverflowing } = useOverflowMenu<HTMLButtonElement>();

      if (!isOverflowing) {
        return null;
      }

      return (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton ref={ref}>+{overflowCount} items</MenuButton>
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
              {ids.map((id) => (
                <OverflowMenuItem key={id} id={id} />
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      );
    };

    const styles = /* css */ `
      .overflow-default-example {
        display: flex;
        flex-wrap: nowrap;
        min-width: 200px;
        max-width: 800px;
        overflow: hidden;
        border: 2px solid var(--colorBrandBackground);
        padding: var(--spacingVerticalXXL) 10px 10px;
        position: relative;
        resize: horizontal;
      }

      .overflow-default-example::after {
        content: 'Resizable Area';
        position: absolute;
        padding: 1px var(--spacingHorizontalXS) 1px;
        top: -2px;
        left: -2px;
        font-family: monospace;
        font-size: 15px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: 1px;
        color: var(--colorNeutralForegroundOnBrand);
        background-color: var(--colorBrandBackground);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Overflow>
          <div className="overflow-default-example">
            {itemIds.map((id) => (
              <OverflowItem key={id} id={id}>
                <Button>Item {id}</Button>
              </OverflowItem>
            ))}
            <OverflowMenu ids={itemIds} />
          </div>
        </Overflow>
      </>
    );
  },
};

/**
 * The `Overflow` and `OverflowItem` components, are low level utilities that enable users to create overflow
 * experiences with any component. The components will detect and hide overflowing elements in DOM and manage
 * the overflow state. Additional overflow hooks can be used to handle overflowing items. In the reference
 * examples below the overflowing items are handled using a `Menu`.
 *
 * Additional hooks will be needed to create _**your specific overflow scenario**_. Please refer to the reference implementations
 * below, which will use the additional utilities:
 *
 * - `useOverflowMenu`- returns a ref that registers and overflow menu element.
 * - `useIsOverflowItemVisible`- returns whether an overflow item is visible.
 * - `useOverflowCount`- returns the number of overflowing items.
 * - `useOverflowGroupVisible`- return the visibility of an overflow group.
 *
 * @summary Low-level utility that moves items that don't fit into an overflow menu. Subcomponents: OverflowItem.
 */
export default {
  title: 'Components/Overflow',
  component: Overflow,
  subcomponents: { OverflowItem },
};
