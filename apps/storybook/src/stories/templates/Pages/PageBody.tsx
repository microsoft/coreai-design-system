// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import { makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
const usePageBodyStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, minHeight: 0 },
  padded: {
    padding: `${tokens.spacingVerticalL} var(--template-page-padding, ${tokens.spacingHorizontalXXL}) ${tokens.spacingVerticalXXXL}`,
  },
  scroll: { overflow: 'auto' },
});
export interface PageBodyProps {
  children: ReactNode;
  padding?: 'default' | 'none';
  scrollable?: boolean;
  className?: string;
}
/** Owns body insets. Disable padding when a nested grid or pane layout already supplies it. */
export function PageBody({
  children,
  padding = 'default',
  scrollable = false,
  className,
}: PageBodyProps) {
  const styles = usePageBodyStyles();
  return (
    <div
      className={mergeClasses(
        styles.root,
        padding === 'default' && styles.padded,
        scrollable && styles.scroll,
        className,
      )}
    >
      {children}
    </div>
  );
}
