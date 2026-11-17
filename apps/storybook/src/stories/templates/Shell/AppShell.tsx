// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
import { LayoutContainer, useLayoutWidth } from '../Pages/LayoutContainer';
import { TopNav, type TopNavProps } from './TopNav';
import { LeftNav } from './LeftNav';
import { MobileLeftNav } from './MobileLeftNav';
import type { NavigationItem } from './LeftNavLinkList';
const useAppShellStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground4,
    '@media (max-height: 480px)': { height: 'auto', overflow: 'visible' },
  },
  body: {
    display: 'flex',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    gap: tokens.spacingHorizontalXXS,
    marginTop: '-3px',
    paddingTop: '3px',
    '@media (max-height: 480px)': { overflow: 'visible' },
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 'var(--borderRadius2XLarge)',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    '@media (max-height: 480px)': { overflow: 'visible' },
  },
  skip: {
    position: 'absolute',
    zIndex: 1,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForegroundLink,
    transform: 'translateY(-200%)',
    ':focus': { transform: 'translateY(0)' },
  },
});
export interface AppShellProps extends Omit<TopNavProps, 'mobileNavigation'> {
  navigation: NavigationItem[];
  children?: React.ReactNode;
  className?: string;
}
function ShellContent({ navigation, children, ...topNav }: Omit<AppShellProps, 'className'>) {
  const styles = useAppShellStyles();
  const mobile = useLayoutWidth() <= 900;
  const mainId = React.useId();
  const mainRef = React.useRef<HTMLElement>(null);
  return (
    <>
      <a
        className={styles.skip}
        href={`#${mainId}`}
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <TopNav
        {...topNav}
        mobileNavigation={
          <MobileLeftNav items={navigation} topItems={topNav.topItems} actions={topNav.search} />
        }
      />
      <div className={styles.body}>
        {!mobile && navigation.length > 0 && <LeftNav items={navigation} />}
        <main ref={mainRef} id={mainId} tabIndex={-1} className={styles.main}>
          {children ?? <Outlet />}
        </main>
      </div>
    </>
  );
}
/** Root app layout. Mount inside a router; child routes render through Outlet unless children are supplied. */
export function AppShell({ className, ...props }: AppShellProps) {
  const styles = useAppShellStyles();
  return (
    <LayoutContainer className={mergeClasses(styles.root, className)}>
      <ShellContent {...props} />
    </LayoutContainer>
  );
}
