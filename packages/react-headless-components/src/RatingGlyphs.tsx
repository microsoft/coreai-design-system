// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { StarFilled, StarRegular } from '@fluentui/react-icons/headless/svg/star';
import styles from './RatingItem.module.css';

export function RatingFilledIcon() {
  return <StarFilled className={styles.RatingItem__glyph} />;
}

export function RatingOutlineIcon() {
  return <StarRegular className={styles.RatingItem__glyph} />;
}
