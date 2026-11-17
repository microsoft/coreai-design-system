// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text, Tooltip, makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
import {
  AppsListFilled,
  AppsListRegular,
  bundleIcon,
  iconFilledClassName,
  iconRegularClassName,
} from '@fluentui/react-icons';
import { useMatch, useResolvedPath } from 'react-router-dom';
import { Link } from '../react-router/Link';
const AppsListIcon = bundleIcon(AppsListFilled, AppsListRegular);
const useLeftNavLinkListStyles = makeStyles({
  groups: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  group: { display: 'flex', flexDirection: 'column', flexShrink: 0, gap: tokens.spacingVerticalXS },
  list: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: tokens.spacingVerticalXS,
  },
  section: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: '32px',
    boxSizing: 'border-box',
    margin: 0,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalMNudge}`,
    '& > span': { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  },
  collapsedSection: {
    justifyContent: 'flex-start',
    '& > span': { position: 'absolute', width: '1px', height: '1px', clipPath: 'inset(50%)' },
    '::after': {
      content: '""',
      marginInlineStart: tokens.spacingHorizontalS,
      width: '4px',
      height: '4px',
      borderRadius: tokens.borderRadiusCircular,
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalMNudge}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    textDecorationLine: 'none',
    transition: 'background-color 0.2s',
    [`& .${iconFilledClassName}`]: { display: 'none' },
    [`& .${iconRegularClassName}`]: { display: 'inline' },
    ':hover': {
      color: tokens.colorNeutralForeground2,
      backgroundColor: tokens.colorNeutralBackground3Hover,
      textDecorationLine: 'none',
      '& > span:first-child': { color: tokens.colorBrandForeground1 },
    },
    ':active': { color: tokens.colorNeutralForeground2, textDecorationLine: 'none' },
    ':focus': { color: tokens.colorNeutralForeground2, textDecorationLine: 'none' },
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: tokens.strokeWidthThin,
    },
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    [`& .${iconFilledClassName}`]: { display: 'inline' },
    [`& .${iconRegularClassName}`]: { display: 'none' },
    '& > span:first-child': { color: tokens.colorBrandForeground1 },
    ':hover': { color: tokens.colorNeutralForeground1 },
    ':active': { color: tokens.colorNeutralForeground1 },
    ':focus': { color: tokens.colorNeutralForeground1 },
  },
  icon: { display: 'flex', flexShrink: 0, fontSize: tokens.fontSizeBase500 },
  label: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
});
export interface NavigationItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
  selectedIcon?: React.ReactNode;
  sectionTitle?: string;
  placement?: 'bottom';
  end?: boolean;
}
export interface LeftNavLinkListProps {
  items: NavigationItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}
function NavigationLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const styles = useLeftNavLinkListStyles();
  const destination = useResolvedPath(item.to);
  const match = useMatch({
    path: destination.pathname,
    end: item.end ?? destination.pathname === '/',
  });
  const link = (
    <Link
      to={item.to}
      aria-current={match ? 'page' : undefined}
      aria-label={item.label}
      className={mergeClasses(styles.link, !!match && styles.selected)}
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        )
          onNavigate?.();
      }}
    >
      <span className={styles.icon} aria-hidden>
        {(match ? (item.selectedIcon ?? item.icon) : item.icon) ?? <AppsListIcon />}
      </span>
      <span className={styles.label}>{item.label}</span>
    </Link>
  );
  return collapsed ? (
    <Tooltip content={item.label} relationship="label" positioning="after">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
/** Shared route-aware desktop/mobile link content. sectionTitle begins a new labelled group. */
export function LeftNavLinkList({ items, collapsed = false, onNavigate }: LeftNavLinkListProps) {
  const styles = useLeftNavLinkListStyles();
  const prefix = React.useId();
  const groups: { title?: string; items: NavigationItem[] }[] = [];
  for (const item of items) {
    if (item.sectionTitle || groups.length === 0)
      groups.push({ title: item.sectionTitle, items: [] });
    groups[groups.length - 1].items.push(item);
  }
  return (
    <div className={styles.groups}>
      {groups.map((group, index) => (
        <div key={group.items[0].to} className={styles.group}>
          {group.title && (
            <Text
              as="h2"
              id={`${prefix}-${index}`}
              preset="bodySStrong"
              foreground={3}
              className={mergeClasses(styles.section, collapsed && styles.collapsedSection)}
            >
              <span>{group.title}</span>
            </Text>
          )}
          <ul
            className={styles.list}
            aria-labelledby={group.title ? `${prefix}-${index}` : undefined}
          >
            {group.items.map((item) => (
              <li key={item.to}>
                <NavigationLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
