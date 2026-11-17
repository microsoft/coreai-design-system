// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  Tooltip,
  makeStyles,
  tokens,
} from '@coreai-ds/react-components';
import { PanelLeftContractRegular, NavigationRegular } from '@fluentui/react-icons';
import { useLocation } from 'react-router-dom';
import { LeftNavLinkList, type NavigationItem } from './LeftNavLinkList';
import { TabLinkList } from '../react-router/TabLinkList';
import { useLayoutWidth } from '../Pages/LayoutContainer';
const useMobileLeftNavStyles = makeStyles({
  drawer: { '--fui-Drawer--size': '380px', width: '380px', maxWidth: '100vw' },
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM,
  },
  tabs: { overflowX: 'auto', flexShrink: 0 },
  links: { paddingTop: tokens.spacingVerticalXL },
  mobileActions: { display: 'flex', flexDirection: 'row' },
  bottom: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    alignSelf: 'stretch',
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS} ${tokens.spacingVerticalM}`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground4}`,
  },
  expander: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `0 ${tokens.spacingHorizontalXS}`,
  },
});
export interface MobileLeftNavProps {
  items: NavigationItem[];
  topItems?: NavigationItem[];
  actions?: React.ReactNode;
}
/** Mobile menu uses the same items as LeftNav and closes after navigation, Escape, or dismissal. */
export function MobileLeftNav({ items, topItems = [], actions }: MobileLeftNavProps) {
  const styles = useMobileLeftNavStyles();
  const width = useLayoutWidth();
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  const location = useLocation();
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  React.useEffect(() => {
    setOpen(false);
  }, [location.key]);
  return (
    <>
      <Tooltip content="Open navigation" relationship="label">
        <Button
          ref={trigger}
          appearance="subtle"
          aria-label="Open navigation"
          icon={<NavigationRegular />}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <Drawer
        id={id}
        className={styles.drawer}
        type="overlay"
        position="start"
        open={open}
        onOpenChange={(_, data) => {
          if (!data.open) close();
        }}
        aria-label="Navigation"
      >
        <DrawerBody className={styles.body}>
          {width <= 620 && actions != null && <div className={styles.mobileActions}>{actions}</div>}
          {topItems.length > 0 && (
            <div className={styles.tabs}>
              <TabLinkList
                appearance="elevated"
                aria-label="Top navigation"
                links={topItems.map((item) => ({
                  label: item.label,
                  to: item.to,
                  end: item.end,
                  onClick: close,
                }))}
              />
            </div>
          )}
          <nav aria-label="Primary navigation" className={styles.links}>
            <LeftNavLinkList
              items={items.filter((item) => item.placement !== 'bottom')}
              onNavigate={close}
            />
          </nav>
        </DrawerBody>
        <div className={styles.bottom}>
          <nav aria-label="Additional navigation">
            <LeftNavLinkList
              items={items.filter((item) => item.placement === 'bottom')}
              onNavigate={close}
            />
          </nav>
          <div className={styles.expander}>
            <Button
              appearance="subtle"
              aria-label="Close navigation"
              title="Close navigation"
              icon={<PanelLeftContractRegular />}
              onClick={close}
              size="small"
            />
          </div>
        </div>
      </Drawer>
    </>
  );
}
