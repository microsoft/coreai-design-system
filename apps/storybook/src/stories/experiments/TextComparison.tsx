// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text as LegacyText } from '@coreai-ds/react-components';
import { Text as NativeText } from '@coreai-ds/react-headless-components';
import { textExamples, type TextExample } from './TextFixtures.js';
import styles from './TextComparison.module.css';

export function TextComparison({
  examples = textExamples,
}: {
  examples?: readonly TextExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Local native / CSS Modules</strong>
      </div>
      {examples.map(({ name, props, parentStyle }) => (
        <div key={name} className={styles.row} data-text-case={name}>
          <span>{name}</span>
          <div className={styles.cell} style={parentStyle} data-implementation="legacy">
            <LegacyText {...props} />
          </div>
          <div className={styles.cell} style={parentStyle} data-implementation="headless">
            <NativeText {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}
