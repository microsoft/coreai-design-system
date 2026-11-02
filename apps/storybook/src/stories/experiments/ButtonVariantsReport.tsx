// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button } from '@coreai-ds/react-headless-components';
import type { ButtonVariantFamily } from './ButtonVariantsComparison.js';
import {
  captureButtonVariantStyles,
  compareButtonVariantStyles,
  getComparisonButtonVariant,
  settleButtonVariantStyles,
  type ButtonVariantStyleDifference,
} from './compareButtonVariantsStyles.js';
import styles from './ButtonVariantsComparison.module.css';

export function ButtonVariantsReport({
  family,
  children,
  consumer = false,
}: {
  family: ButtonVariantFamily;
  children: React.ReactNode;
  consumer?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [results, setResults] = React.useState<
    (ButtonVariantStyleDifference & { example: string })[] | null
  >(null);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-parity-case]')];
    if (!rows.length) throw new Error('Comparison contains no cases');
    const differences = [];
    for (const row of rows) {
      const legacy = getComparisonButtonVariant(row, 'legacy');
      const headless = getComparisonButtonVariant(row, 'headless');
      await Promise.all([settleButtonVariantStyles(legacy), settleButtonVariantStyles(headless)]);
      differences.push(
        ...compareButtonVariantStyles(
          captureButtonVariantStyles(legacy, family),
          captureButtonVariantStyles(headless, family),
        ).map((difference) => ({ example: row.dataset.parityCase ?? '', ...difference })),
      );
    }
    setResults(differences);
  };
  return (
    <div>
      <p>
        Shared fixtures compare selected slot properties and dimensions, not every CSS rule or
        pixel. Native focus-visible and headless behavior are authoritative.
      </p>
      {consumer && (
        <p>
          Intentional differences: unlayered consumer CSS wins over the port, setting minimum width
          to 120px, radius to 3px, and the supplied icon to 16px. All measured differences,
          including resulting geometry, remain visible below.
        </p>
      )}
      <Button onClick={compare}>Compare resting styles</Button>
      <output className={styles.report} aria-live="polite">
        {results === null
          ? 'Comparison not run.'
          : results.length
            ? JSON.stringify(results, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>{children}</div>
    </div>
  );
}
