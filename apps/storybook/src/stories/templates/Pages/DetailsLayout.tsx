// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles } from '@coreai-ds/react-components';
import { PageBody } from './PageBody';
import { ResponsivePanel } from './ResponsivePanel';
const useDetailsLayoutStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
  },
});
export interface PanelDetails {
  title: string;
  content: React.ReactNode;
  headerActions?: React.ReactNode;
  padding?: 'default' | 'none';
  width?: number;
}
export interface DetailsLayoutProps {
  children: React.ReactNode;
  details?: PanelDetails;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  contentPadding?: 'default' | 'none';
}
/** Main body and optional details. Retains outgoing content during drawer dismissal. */
export function DetailsLayout({
  children,
  details,
  onClose,
  returnFocusRef,
  contentPadding = 'default',
}: DetailsLayoutProps) {
  const styles = useDetailsLayoutStyles();
  const [lastDetails, setLastDetails] = React.useState(details);
  if (details !== undefined && details !== lastDetails) setLastDetails(details);
  return (
    <div className={styles.root}>
      <PageBody padding={contentPadding} scrollable>
        {children}
      </PageBody>
      <ResponsivePanel
        title={lastDetails?.title ?? 'Details'}
        position="end"
        open={details !== undefined}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        returnFocusRef={returnFocusRef}
        headerActions={lastDetails?.headerActions}
        padding={lastDetails?.padding}
        width={lastDetails?.width}
      >
        {lastDetails?.content}
      </ResponsivePanel>
    </div>
  );
}
