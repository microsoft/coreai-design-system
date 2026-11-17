// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import { makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
import { LayoutContainer, useHasLayoutContainer } from './LayoutContainer';

const usePageLayoutStyles = makeStyles({
  frame: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  page: { overflow: 'auto' },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 0,
  },
  pageContent: { flexBasis: 'auto', flexShrink: 0 },
  scroll: { overflow: 'auto' },
  panes: { overflow: 'hidden' },
  footer: {
    flexShrink: 0,
    padding: `${tokens.spacingVerticalL} var(--template-page-padding, ${tokens.spacingHorizontalXXL})`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground4}`,
  },
});

export interface PageLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scrollMode?: 'page' | 'content' | 'panes';
  className?: string;
}

/** Unpadded bounded frame. The host supplies height; descendants own padding and, in panes mode, scrolling. */
export function PageLayout({
  header,
  footer,
  children,
  scrollMode = 'content',
  className,
}: PageLayoutProps) {
  const styles = usePageLayoutStyles();
  const hasContainer = useHasLayoutContainer();
  const Frame = hasContainer ? 'div' : LayoutContainer;
  return (
    <Frame className={mergeClasses(styles.frame, scrollMode === 'page' && styles.page, className)}>
      {header}
      <div
        className={mergeClasses(
          styles.content,
          scrollMode === 'page'
            ? styles.pageContent
            : scrollMode === 'content'
              ? styles.scroll
              : styles.panes,
        )}
      >
        {children}
      </div>
      {footer != null && <footer className={styles.footer}>{footer}</footer>}
    </Frame>
  );
}
