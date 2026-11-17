// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { To } from 'react-router-dom';
import { Tooltip, makeStyles } from '@coreai-ds/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';
import { LinkButton } from '../react-router/LinkButton';
const usePageBackLinkStyles = makeStyles({ root: { marginLeft: '-5px', marginRight: '-5px' } });
/** Destination navigation with native modified-click behavior, relative routing, and basename support. */
export function PageBackLink({ to, label = 'Back' }: { to: To; label?: string }) {
  const styles = usePageBackLinkStyles();
  return (
    <Tooltip content={label} relationship="label">
      <LinkButton
        className={styles.root}
        to={to}
        aria-label={label}
        appearance="subtle"
        icon={<ArrowLeftRegular />}
      />
    </Tooltip>
  );
}
