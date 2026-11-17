// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  InfoButton,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from '@coreai-ds/react-components';
import { LockClosedRegular } from '@fluentui/react-icons';
import { useId, type ReactNode } from 'react';
import type { TableColumnDefinition } from './DataGridWithFilters';

const useCreateColumnStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 0,
    ...shorthands.borderWidth(0),
    textAlign: 'left',
    gap: tokens.spacingHorizontalXS,
    minWidth: 0,
    '& > span': { minWidth: 0, overflowWrap: 'break-word' },
  },
  icon: { flexShrink: 0, fontSize: tokens.fontSizeBase400 },
});

function ColumnHeader({
  children,
  disabled,
  tooltip,
}: {
  children: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}) {
  const styles = useCreateColumnStyles();
  const labelId = useId();
  if (!disabled)
    return (
      <span className={styles.header}>
        <span id={labelId}>{children}</span>
        <InfoButton aria-labelledby={labelId} info={tooltip} size="small" inline={false} />
      </span>
    );
  const content = (
    <Button appearance="subtle" disabledFocusable className={styles.header}>
      <span>{children}</span>
      <LockClosedRegular className={styles.icon} aria-hidden />
    </Button>
  );
  return tooltip ? (
    <Tooltip content={tooltip} relationship="description">
      {content}
    </Tooltip>
  ) : (
    content
  );
}

/** Enhances a grid column with a descriptive tooltip or an unavailable-value header. */
export function createColumn<T>(
  column: TableColumnDefinition<T>,
  options?: {
    disabled?: { isDisabled: boolean; tooltip?: string };
    infoTooltip?: { content: string };
  },
): TableColumnDefinition<T> {
  if (options?.disabled?.isDisabled)
    return {
      ...column,
      compare: () => 0,
      headerTooltip: undefined,
      interactiveHeaderChildren: 'single',
      renderHeaderCell: () => (
        <ColumnHeader disabled tooltip={options.disabled?.tooltip}>
          {column.renderHeaderCell()}
        </ColumnHeader>
      ),
    };
  if (options?.infoTooltip)
    return {
      ...column,
      headerTooltip: undefined,
      interactiveHeaderChildren: 'single',
      renderHeaderCell: () => (
        <ColumnHeader tooltip={options.infoTooltip?.content}>
          {column.renderHeaderCell()}
        </ColumnHeader>
      ),
    };
  return column;
}
