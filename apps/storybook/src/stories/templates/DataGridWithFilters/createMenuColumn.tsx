// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import {
  MenuButton,
  Menu,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  mergeClasses,
  useRestoreFocusTarget,
} from '@coreai-ds/react-components';
import { MoreVerticalRegular } from '@fluentui/react-icons';
import type { TableColumnDefinition } from './DataGridWithFilters';

const useCreateMenuColumnStyles = makeStyles({
  button: {
    '[role="row"]:not(:hover, :focus-within:has(:focus-visible), [aria-selected="true"]) &:not(:hover, :focus-visible, [aria-expanded="true"])':
      {
        position: 'absolute',
        overflow: 'hidden',
        width: '1px',
        height: '1px',
        whiteSpace: 'nowrap',
        clipPath: 'inset(50%)',
      },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
  },
});

export interface MenuColumnOptions<T> {
  columnId?: string;
  renderMenuItems: (item: T) => ReactNode;
  getLabel: (item: T) => string;
  headingLabel?: string;
  isDialogTrigger?: boolean;
}
function HeaderCell({ label }: { label: string }) {
  const styles = useCreateMenuColumnStyles();
  return <span className={mergeClasses('template-grid-menu-header', styles.hidden)}>{label}</span>;
}
function MenuCell<T>({
  item,
  getLabel,
  renderMenuItems,
  isDialogTrigger,
}: MenuColumnOptions<T> & { item: T }) {
  const styles = useCreateMenuColumnStyles();
  const restoreFocus = useRestoreFocusTarget();
  return (
    <Menu positioning={{ autoSize: true }}>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={mergeClasses('template-grid-menu-button', styles.button)}
          shape="circular"
          appearance="subtle"
          aria-label={getLabel(item)}
          title={getLabel(item)}
          icon={<MoreVerticalRegular />}
          {...(isDialogTrigger ? restoreFocus : {})}
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>{renderMenuItems(item)}</MenuList>
      </MenuPopover>
    </Menu>
  );
}
/** Row action menus retain independent focus and do not toggle grid selection. */
export function createMenuColumn<T>(options: MenuColumnOptions<T>): TableColumnDefinition<T> {
  return {
    columnId: options.columnId ?? 'actions',
    compare: () => 0,
    interactiveChildren: 'single',
    renderHeaderCell: () => <HeaderCell label={options.headingLabel ?? 'Actions'} />,
    renderCell: (item) => <MenuCell {...options} item={item} />,
  };
}
