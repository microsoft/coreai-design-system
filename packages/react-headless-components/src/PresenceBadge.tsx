// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderPresenceBadge,
  usePresenceBadge,
  type PresenceBadgeProps as HeadlessPresenceBadgeProps,
  type PresenceBadgeStatus,
} from '@fluentui/react-headless-components-preview/badge';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import {
  PresenceAvailable10Filled,
  PresenceAvailable10Regular,
  PresenceAvailable12Filled,
  PresenceAvailable12Regular,
  PresenceAvailable16Filled,
  PresenceAvailable16Regular,
  PresenceAvailable20Filled,
  PresenceAvailable20Regular,
} from '@fluentui/react-icons/headless/svg/presence-available';
import {
  PresenceAway10Filled,
  PresenceAway12Filled,
  PresenceAway16Filled,
  PresenceAway20Filled,
} from '@fluentui/react-icons/headless/svg/presence-away';
import {
  PresenceBlocked10Regular,
  PresenceBlocked12Regular,
  PresenceBlocked16Regular,
  PresenceBlocked20Regular,
} from '@fluentui/react-icons/headless/svg/presence-blocked';
import {
  PresenceBusy10Filled,
  PresenceBusy12Filled,
  PresenceBusy16Filled,
  PresenceBusy20Filled,
} from '@fluentui/react-icons/headless/svg/presence-busy';
import {
  PresenceDnd10Filled,
  PresenceDnd10Regular,
  PresenceDnd12Filled,
  PresenceDnd12Regular,
  PresenceDnd16Filled,
  PresenceDnd16Regular,
  PresenceDnd20Filled,
  PresenceDnd20Regular,
} from '@fluentui/react-icons/headless/svg/presence-dnd';
import {
  PresenceOffline10Regular,
  PresenceOffline12Regular,
  PresenceOffline16Regular,
  PresenceOffline20Regular,
} from '@fluentui/react-icons/headless/svg/presence-offline';
import {
  PresenceOof10Regular,
  PresenceOof12Regular,
  PresenceOof16Regular,
  PresenceOof20Regular,
} from '@fluentui/react-icons/headless/svg/presence-oof';
import {
  PresenceUnknown10Regular,
  PresenceUnknown12Regular,
  PresenceUnknown16Regular,
  PresenceUnknown20Regular,
} from '@fluentui/react-icons/headless/svg/presence-unknown';
import type { BadgeProps } from './Badge.js';
import styles from './PresenceBadge.module.css';
import './PresenceBadge.overrides.module.css';

export type { PresenceBadgeStatus } from '@fluentui/react-headless-components-preview/badge';

export const presenceBadgeClassNames = {
  root: 'fui-PresenceBadge',
  icon: 'fui-PresenceBadge__icon',
} as const;

export type PresenceBadgeProps = HeadlessPresenceBadgeProps & {
  /** Visual size of the status glyph. @default 'medium' */
  size?: BadgeProps['size'];
};

const availableFilled = {
  10: PresenceAvailable10Filled,
  12: PresenceAvailable12Filled,
  16: PresenceAvailable16Filled,
  20: PresenceAvailable20Filled,
};
const availableRegular = {
  10: PresenceAvailable10Regular,
  12: PresenceAvailable12Regular,
  16: PresenceAvailable16Regular,
  20: PresenceAvailable20Regular,
};
const awayFilled = {
  10: PresenceAway10Filled,
  12: PresenceAway12Filled,
  16: PresenceAway16Filled,
  20: PresenceAway20Filled,
};
const blockedRegular = {
  10: PresenceBlocked10Regular,
  12: PresenceBlocked12Regular,
  16: PresenceBlocked16Regular,
  20: PresenceBlocked20Regular,
};
const busyFilled = {
  10: PresenceBusy10Filled,
  12: PresenceBusy12Filled,
  16: PresenceBusy16Filled,
  20: PresenceBusy20Filled,
};
const dndFilled = {
  10: PresenceDnd10Filled,
  12: PresenceDnd12Filled,
  16: PresenceDnd16Filled,
  20: PresenceDnd20Filled,
};
const dndRegular = {
  10: PresenceDnd10Regular,
  12: PresenceDnd12Regular,
  16: PresenceDnd16Regular,
  20: PresenceDnd20Regular,
};
const offlineRegular = {
  10: PresenceOffline10Regular,
  12: PresenceOffline12Regular,
  16: PresenceOffline16Regular,
  20: PresenceOffline20Regular,
};
const oofRegular = {
  10: PresenceOof10Regular,
  12: PresenceOof12Regular,
  16: PresenceOof16Regular,
  20: PresenceOof20Regular,
};
const unknownRegular = {
  10: PresenceUnknown10Regular,
  12: PresenceUnknown12Regular,
  16: PresenceUnknown16Regular,
  20: PresenceUnknown20Regular,
};

const iconSizes = {
  // FIXME not all presence icon sizes are available.
  // https://github.com/microsoft/fluentui/issues/20650
  tiny: 10,
  'extra-small': 10,
  small: 12,
  medium: 16,
  large: 20,
  'extra-large': 20,
} as const;

function getPresenceIcon(
  status: PresenceBadgeStatus,
  outOfOffice: boolean,
  size: NonNullable<PresenceBadgeProps['size']>,
) {
  const icons: Record<PresenceBadgeStatus, typeof availableFilled> = {
    available: outOfOffice ? availableRegular : availableFilled,
    away: outOfOffice ? oofRegular : awayFilled,
    blocked: blockedRegular,
    busy: outOfOffice ? unknownRegular : busyFilled,
    'do-not-disturb': outOfOffice ? dndRegular : dndFilled,
    offline: outOfOffice ? oofRegular : offlineRegular,
    'out-of-office': oofRegular,
    unknown: unknownRegular,
  };
  return icons[status][iconSizes[size]];
}

export const PresenceBadge: ForwardRefComponent<PresenceBadgeProps> = React.forwardRef<
  HTMLDivElement,
  PresenceBadgeProps
>(function PresenceBadge({ size = 'medium', ...props }, ref) {
  const state = usePresenceBadge(props, ref);

  // The headless hook owns status and ARIA; only the missing visual glyph is supplied here.
  if (state.icon && state.icon.children == null) {
    const Glyph = getPresenceIcon(state.status, state.outOfOffice, size);
    state.icon.children = <Glyph className={styles.PresenceBadge__glyph} />;
  }
  Object.assign(state.root, { 'data-size': size });
  state.root.className = [presenceBadgeClassNames.root, styles.PresenceBadge, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [
      presenceBadgeClassNames.icon,
      styles.PresenceBadge__icon,
      state.icon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderPresenceBadge(state);
});

PresenceBadge.displayName = 'PresenceBadge';
