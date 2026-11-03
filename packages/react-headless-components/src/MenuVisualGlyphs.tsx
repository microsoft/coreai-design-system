// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// @fluentui/react-menu 9.25.8 useMenuItem.js default chevrons, with style-free icons 2.0.343.
// Visibility source: [useMenuItemStyles.styles.raw.js](../../../node_modules/@fluentui/react-menu/lib/components/MenuItem/useMenuItemStyles.styles.raw.js).

import * as React from 'react';
import {
  ChevronLeftFilled,
  ChevronLeftRegular,
} from '@fluentui/react-icons/headless/svg/chevron-left';
import {
  ChevronRightFilled,
  ChevronRightRegular,
} from '@fluentui/react-icons/headless/svg/chevron-right';
import styles from './MenuItem.module.css';

export function MenuSubmenuGlyph({ dir }: { dir: 'ltr' | 'rtl' }): React.ReactElement {
  const Regular = dir === 'rtl' ? ChevronLeftRegular : ChevronRightRegular;
  const Filled = dir === 'rtl' ? ChevronLeftFilled : ChevronRightFilled;
  return (
    <>
      <Regular className={styles.MenuItem__glyph} data-menu-icon-kind="regular" />
      <Filled className={styles.MenuItem__glyph} data-menu-icon-kind="filled" />
    </>
  );
}
