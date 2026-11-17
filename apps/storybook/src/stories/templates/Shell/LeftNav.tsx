// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, Tooltip, makeStyles, tokens } from '@coreai-ds/react-components';
import { PanelLeftContractRegular, PanelLeftExpandRegular } from '@fluentui/react-icons';
import { useLayoutWidth } from '../Pages/LayoutContainer';
import { LeftNavLinkList, type NavigationItem } from './LeftNavLinkList';
const useLeftNavStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    minHeight: 0,
    height: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    borderTopRightRadius: 'var(--borderRadius2XLarge)',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    transition: 'width 0.2s ease-in-out',
    '@media (max-height: 480px)': { position: 'sticky', top: '48px', height: 'calc(100vh - 48px)' },
  },
  main: {
    flexGrow: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: tokens.spacingHorizontalS,
    scrollbarWidth: 'thin',
  },
  bottom: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS} ${tokens.spacingVerticalM}`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground4}`,
  },
  expander: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: `0 ${tokens.spacingHorizontalXS}`,
  },
});
export interface LeftNavProps {
  items: NavigationItem[];
  width?: number;
  defaultCollapsed?: boolean;
}
/** Desktop navigation with explicit collapse preference; defaults to compact below 1024px. Width is a layout dimension in pixels. */
export function LeftNav({ items, width = 218, defaultCollapsed }: LeftNavProps) {
  const styles = useLeftNavStyles();
  const availableWidth = useLayoutWidth();
  const [preference, setPreference] = React.useState(defaultCollapsed);
  const collapsed = preference ?? availableWidth <= 1024;
  const label = collapsed ? 'Expand navigation' : 'Collapse navigation';
  return (
    <nav
      aria-label="Primary navigation"
      className={styles.root}
      style={{ width: collapsed ? 56 : width }}
    >
      <div className={styles.main}>
        <LeftNavLinkList
          items={items.filter((item) => item.placement !== 'bottom')}
          collapsed={collapsed}
        />
      </div>
      <div className={styles.bottom}>
        <LeftNavLinkList
          items={items.filter((item) => item.placement === 'bottom')}
          collapsed={collapsed}
        />
        <div className={styles.expander}>
          <Tooltip content={label} relationship="label">
            <Button
              appearance="subtle"
              aria-label={label}
              aria-expanded={!collapsed}
              icon={collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />}
              onClick={() => setPreference(!collapsed)}
            />
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
