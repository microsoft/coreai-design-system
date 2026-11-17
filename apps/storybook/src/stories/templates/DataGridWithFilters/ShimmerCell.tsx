// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Skeleton, SkeletonItem, makeStyles, tokens } from '@coreai-ds/react-components';

const useShimmerCellStyles = makeStyles({
  root: {
    display: 'inline-block',
    width: '80%',
    height: '16px',
    borderRadius: tokens.borderRadiusSmall,
  },
});

/** Cell-level loading; the containing grid or region supplies the accessible loading status. */
export function ShimmerCell() {
  const styles = useShimmerCellStyles();
  return (
    <Skeleton className={styles.root} animation="wave" appearance="translucent" aria-hidden>
      <SkeletonItem size={16} />
    </Skeleton>
  );
}
