// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@coreai-ds/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { useLayoutWidth } from './LayoutContainer';
const useResponsivePanelStyles = makeStyles({
  root: { minWidth: 0, boxSizing: 'border-box', backgroundColor: tokens.colorNeutralBackground1 },
  inline: {
    flexShrink: 0,
    width: 'var(--template-panel-width)',
    maxWidth: '40%',
    ...shorthands.borderColor(tokens.colorNeutralBackground4),
  },
  sidebar: { backgroundColor: 'transparent' },
  overlay: { width: 'var(--template-panel-width)', maxWidth: '100vw' },
  explicit: { maxWidth: '100%' },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    padding: `${tokens.spacingVerticalL} var(--template-page-padding)`,
  },
  title: { margin: 0, minWidth: 0, overflowWrap: 'anywhere' },
  actions: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  body: { overflow: 'auto', minWidth: 0, minHeight: 0, margin: 0, padding: 0 },
  padded: {
    padding: `0 var(--template-page-padding) ${tokens.spacingVerticalL}`,
    ':first-child': { paddingTop: tokens.spacingVerticalL },
  },
});
export interface ResponsivePanelProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  position: 'start' | 'end';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerActions?: React.ReactNode;
  showInlineHeader?: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  padding?: 'default' | 'none';
  width?: number;
  collapseAt?: number;
}
/** Inline complementary region or modal drawer. Keep persistent field state above the panel. Width and breakpoints are layout dimensions in pixels. */
export function ResponsivePanel({
  id,
  title,
  children,
  position,
  open,
  onOpenChange,
  headerActions,
  showInlineHeader = true,
  returnFocusRef,
  padding = 'default',
  width,
  collapseAt = 768,
}: ResponsivePanelProps) {
  const styles = useResponsivePanelStyles();
  const titleId = React.useId();
  const layoutWidth = useLayoutWidth();
  const overlay = layoutWidth <= collapseAt;
  const showHeader = overlay || showInlineHeader;
  const close = () => {
    onOpenChange(false);
    requestAnimationFrame(() => returnFocusRef?.current?.focus());
  };
  return (
    <Drawer
      id={id}
      aria-labelledby={showHeader ? titleId : undefined}
      aria-label={showHeader ? undefined : title}
      className={mergeClasses(
        styles.root,
        overlay ? styles.overlay : styles.inline,
        !overlay && position === 'start' && styles.sidebar,
        width !== undefined && styles.explicit,
      )}
      style={
        {
          '--template-panel-width': `${width ?? (overlay ? 400 : 420)}px`,
          '--template-page-padding':
            layoutWidth <= 768 ? tokens.spacingHorizontalL : tokens.spacingHorizontalXXL,
        } as React.CSSProperties
      }
      type={overlay ? 'overlay' : 'inline'}
      role={overlay ? 'dialog' : 'complementary'}
      position={position}
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) close();
      }}
      separator
    >
      {showHeader && (
        <DrawerHeader className={styles.header}>
          <Text id={titleId} as="h2" preset="heading4" className={styles.title}>
            {title}
          </Text>
          <div className={styles.actions}>
            {headerActions}
            <Tooltip content={`Close ${title}`} relationship="label">
              <Button
                appearance="subtle"
                aria-label={`Close ${title}`}
                icon={<DismissRegular />}
                onClick={close}
              />
            </Tooltip>
          </div>
        </DrawerHeader>
      )}
      <DrawerBody className={mergeClasses(styles.body, padding === 'default' && styles.padded)}>
        {children}
      </DrawerBody>
    </Drawer>
  );
}
