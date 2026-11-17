// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import { makeStyles, tokens } from '@coreai-ds/react-components';
import { AppsRegular, SlashForward12Regular } from '@fluentui/react-icons';
import { Link } from '../react-router/Link';
import { useMatch, useResolvedPath } from 'react-router-dom';
import { useLayoutWidth } from '../Pages/LayoutContainer';
import type { NavigationItem } from './LeftNavLinkList';
const useTopNavStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'minmax(auto, 1fr) auto minmax(auto, 1fr)',
    flexShrink: 0,
    alignItems: 'center',
    height: '48px',
    gap: tokens.spacingHorizontalS,
    padding: `0 ${tokens.spacingHorizontalXL}`,
    minWidth: 0,
    '@container app (max-width: 1470px)': { display: 'flex', justifyContent: 'space-between' },
    '@container app (max-width: 481px)': {
      columnGap: tokens.spacingHorizontalXS,
      padding: `0 0 0 ${tokens.spacingHorizontalXS}`,
    },
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    minWidth: 0,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightRegular,
    textDecorationLine: 'none',
    ':hover': { color: tokens.colorNeutralForeground2, textDecorationLine: 'none' },
    ':active': { color: tokens.colorNeutralForeground3, textDecorationLine: 'none' },
  },
  logo: {
    display: 'flex',
    flexShrink: 0,
    fontSize: tokens.fontSizeBase400,
    padding: tokens.spacingHorizontalXS,
    marginRight: tokens.spacingHorizontalXS,
    marginLeft: `calc(-1 * ${tokens.spacingHorizontalXS})`,
  },
  title: {
    minWidth: 0,
    marginRight: tokens.spacingHorizontalS,
    whiteSpace: 'nowrap',
    '@container app (max-width: 970px)': { display: 'none' },
  },
  left: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  center: { display: 'flex', alignItems: 'center' },
  divider: { flexShrink: 0, color: tokens.colorNeutralForegroundDisabled },
  right: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXL,
    justifySelf: 'end',
  },
  nav: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    margin: `calc(-1 * ${tokens.spacingHorizontalXS})`,
    whiteSpace: 'nowrap',
  },
  navLink: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXS}`,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    textDecorationLine: 'none',
    ':hover': { color: tokens.colorNeutralForeground1, textDecorationLine: 'none' },
    ':active': { color: tokens.colorNeutralForeground3, textDecorationLine: 'none' },
    '&[aria-current="page"]': {
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground2LinkSelected,
      ':active': { color: tokens.colorNeutralForeground3, textDecorationLine: 'none' },
    },
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: `calc(-1 * ${tokens.spacingHorizontalS})`,
    flexShrink: 0,
  },
});
function TopNavLink({ item }: { item: NavigationItem }) {
  const styles = useTopNavStyles();
  const resolved = useResolvedPath(item.to);
  const active = useMatch({ path: resolved.pathname, end: item.end ?? resolved.pathname === '/' });
  return (
    <Link to={item.to} className={styles.navLink} aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  );
}
export interface TopNavProps {
  brand: string;
  brandIcon?: ReactNode;
  brandBadge?: ReactNode;
  contextSwitcher?: ReactNode;
  homeTo?: string;
  topItems?: NavigationItem[];
  search?: ReactNode;
  wideSearch?: ReactNode;
  profile?: ReactNode;
  actions?: ReactNode;
  mobileNavigation?: ReactNode;
}
/** Shared app chrome with route-backed top navigation and explicit search/profile/action slots. */
export function TopNav({
  brand,
  brandIcon,
  brandBadge,
  contextSwitcher,
  homeTo = '/',
  topItems = [],
  search,
  wideSearch,
  profile,
  actions,
  mobileNavigation,
}: TopNavProps) {
  const styles = useTopNavStyles();
  const width = useLayoutWidth();
  const compact = width <= 900;
  return (
    <header className={styles.root}>
      <div className={styles.left}>
        <Link to={homeTo} className={styles.brand} aria-label={brand}>
          <span className={styles.logo} aria-hidden>
            {brandIcon ?? <AppsRegular />}
          </span>
          <span className={styles.title}>{brand}</span>
        </Link>
        {brandBadge}
        {contextSwitcher != null && (
          <>
            <SlashForward12Regular className={styles.divider} aria-hidden />
            {contextSwitcher}
          </>
        )}
      </div>
      <div className={styles.center}>{width > 1280 && (wideSearch ?? search)}</div>
      <div className={styles.right}>
        {!compact && topItems.length > 0 && (
          <nav aria-label="Top navigation" className={styles.nav}>
            {topItems.map((item) => (
              <TopNavLink key={item.to} item={item} />
            ))}
          </nav>
        )}
        <div className={styles.actions}>
          {width <= 1280 && width > 620 && search}
          {actions}
          {profile}
          {compact && mobileNavigation}
        </div>
      </div>
    </header>
  );
}
