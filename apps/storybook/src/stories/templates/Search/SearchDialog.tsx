// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode, RefObject } from 'react';
import {
  Button,
  Dialog,
  DialogSurface,
  Input,
  Tooltip,
  makeStyles,
  tokens,
} from '@coreai-ds/react-components';
import { Dismiss24Regular, SearchRegular } from '@fluentui/react-icons';
const useSearchDialogStyles = makeStyles({
  surface: { width: '90vw', maxWidth: '600px', padding: 0, margin: '100px auto' },
  search: {
    width: '100%',
    boxSizing: 'border-box',
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
  },
  close: { flexShrink: 0 },
  results: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    maxHeight: '60dvh',
    overflowY: 'auto',
    padding: tokens.spacingVerticalL,
  },
});
export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  children?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}
/** Minimal global search surface. The caller owns results, query state, and navigation; no service dependency. */
export function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  children,
  returnFocusRef,
}: SearchDialogProps) {
  const styles = useSearchDialogStyles();
  const close = () => {
    onOpenChange(false);
    requestAnimationFrame(() => returnFocusRef?.current?.focus());
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) close();
      }}
    >
      <DialogSurface className={styles.surface} aria-label="Search">
        <Input
          autoFocus
          type="search"
          size="large"
          appearance="filled-lighter"
          aria-label="Search all items"
          placeholder="Search"
          value={query}
          onChange={(_, data) => onQueryChange(data.value)}
          className={styles.search}
          contentBefore={<SearchRegular aria-hidden />}
          contentAfter={
            <Tooltip content="Close search" relationship="label">
              <Button
                appearance="subtle"
                aria-label="Close search"
                icon={<Dismiss24Regular />}
                onClick={close}
                className={styles.close}
                shape="rounded"
              />
            </Tooltip>
          }
        />
        {children != null && <div className={styles.results}>{children}</div>}
      </DialogSurface>
    </Dialog>
  );
}
