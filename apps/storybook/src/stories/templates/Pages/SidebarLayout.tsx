// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, makeStyles, tokens, type ButtonProps } from '@coreai-ds/react-components';
import { useLayoutWidth } from './LayoutContainer';
import { PageBody } from './PageBody';
import { ResponsivePanel } from './ResponsivePanel';
const useSidebarLayoutStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  main: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, minHeight: 0 },
  toolbar: {
    flexShrink: 0,
    padding: `${tokens.spacingVerticalM} var(--template-page-padding, ${tokens.spacingHorizontalXXL}) 0`,
  },
});
export interface SidebarLayoutProps {
  sidebarTitle: string;
  sidebar: React.ReactNode;
  header?: (trigger: React.ReactNode) => React.ReactNode;
  children: React.ReactNode | ((trigger: React.ReactNode) => React.ReactNode);
  sidebarPadding?: 'default' | 'none';
  sidebarWidth?: number;
  triggerLabel?: string;
  triggerIcon?: ButtonProps['icon'];
  triggerAppearance?: ButtonProps['appearance'];
  contentPadding?: 'default' | 'none';
  scrollable?: boolean;
}
/** Left sidebar collapses at 1024px. Render-prop children or header can place the mobile trigger in an existing toolbar. */
export function SidebarLayout({
  sidebarTitle,
  sidebar,
  header,
  children,
  sidebarPadding = 'default',
  sidebarWidth,
  triggerLabel = sidebarTitle,
  triggerIcon,
  triggerAppearance,
  contentPadding = 'default',
  scrollable = true,
}: SidebarLayoutProps) {
  const styles = useSidebarLayoutStyles();
  const overlay = useLayoutWidth() <= 1024;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();
  if (!overlay && mobileOpen) setMobileOpen(false);
  const trigger = overlay ? (
    <Button
      ref={triggerRef}
      icon={triggerIcon}
      appearance={triggerAppearance ?? (triggerIcon ? 'subtle' : 'secondary')}
      aria-label={triggerLabel}
      title={triggerIcon ? triggerLabel : undefined}
      aria-controls={mobileOpen ? panelId : undefined}
      aria-expanded={mobileOpen}
      aria-haspopup="dialog"
      onClick={() => setMobileOpen(true)}
    >
      {triggerIcon ? null : triggerLabel}
    </Button>
  ) : null;
  return (
    <>
      {header?.(trigger)}
      <div className={styles.root}>
        <ResponsivePanel
          id={panelId}
          collapseAt={1024}
          title={sidebarTitle}
          position="start"
          open={!overlay || mobileOpen}
          onOpenChange={setMobileOpen}
          returnFocusRef={triggerRef}
          showInlineHeader={false}
          padding={sidebarPadding}
          width={sidebarWidth}
        >
          {sidebar}
        </ResponsivePanel>
        <div className={styles.main}>
          {overlay && !header && typeof children !== 'function' && (
            <div className={styles.toolbar}>{trigger}</div>
          )}
          <PageBody padding={contentPadding} scrollable={scrollable}>
            {typeof children === 'function' ? children(header ? null : trigger) : children}
          </PageBody>
        </div>
      </div>
    </>
  );
}
