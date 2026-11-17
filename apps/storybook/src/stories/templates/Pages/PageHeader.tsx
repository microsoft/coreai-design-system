// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';
import { Text, makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
import { PageBackLink } from './PageBackLink';
const usePageHeaderStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0,
    flexShrink: 0,
    padding: `${tokens.spacingVerticalXL} var(--template-page-padding, ${tokens.spacingHorizontalXXL}) ${tokens.spacingVerticalM}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground4}`,
  },
  withNavigation: { paddingBottom: 0 },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    '@container app (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  group: {
    display: 'flex',
    flex: '1 1 240px',
    alignItems: 'center',
    minWidth: 0,
    gap: tokens.spacingHorizontalS,
    '@container app (max-width: 480px)': { flexBasis: 'auto' },
    '& > a': { flexShrink: 0 },
  },
  title: { minWidth: 0, margin: 0, overflowWrap: 'anywhere' },
  badge: { verticalAlign: 'middle', '& > .fui-Badge': { verticalAlign: 'middle' } },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    minWidth: 0,
    gap: tokens.spacingHorizontalS,
  },
  slot: { minWidth: 0, overflowWrap: 'anywhere' },
  navigation: { minWidth: 0, overflowX: 'auto' },
});
export interface PageHeaderProps {
  title: string;
  titleBadge?: ReactNode;
  count?: number;
  description?: ReactNode;
  headerActions?: ReactNode;
  toolbar?: ReactNode;
  navigation?: ReactNode;
  backTo?: To;
  backLabel?: string;
}
/** Page heading and named slots. Counts are explicit, including zero; callers own status, actions, and banners. */
export function PageHeader({
  title,
  titleBadge,
  count,
  description,
  headerActions,
  toolbar,
  navigation,
  backTo,
  backLabel = 'Back',
}: PageHeaderProps) {
  const styles = usePageHeaderStyles();
  return (
    <header className={mergeClasses(styles.root, navigation != null && styles.withNavigation)}>
      <div className={styles.row}>
        <div className={styles.group}>
          {backTo !== undefined && <PageBackLink to={backTo} label={backLabel} />}
          <Text as="h1" preset="heading3" foreground={1} className={styles.title}>
            {title}
            {count !== undefined && (
              <Text foreground={3} weight="regular">
                {' '}
                ({count})
              </Text>
            )}
            {titleBadge != null && <span className={styles.badge}> {titleBadge}</span>}
          </Text>
        </div>
        {headerActions != null && <div className={styles.actions}>{headerActions}</div>}
      </div>
      {description != null && <div className={styles.slot}>{description}</div>}
      {toolbar != null && <div className={styles.slot}>{toolbar}</div>}
      {navigation != null && <div className={styles.navigation}>{navigation}</div>}
    </header>
  );
}
