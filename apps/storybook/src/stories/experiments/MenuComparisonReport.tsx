// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { FocusgroupConsumer as MenuFocusgroupConsumer } from './FocusgroupConsumer.js';
import { MenuComparison, menuExamples, type MenuExample } from './MenuComparison.js';
import {
  captureMenuNativeContract,
  captureMenuStyles,
  compareMenuStyles,
  getComparisonMenu,
  getComparisonMenuTrigger,
  refreshMenuComparisonPositioning,
  settleMenuStyles,
  type MenuStyleDifference,
} from './compareMenuStyles.js';
import styles from './MenuComparison.module.css';

function ReadyMenuComparisonReport({
  examples,
  consumer,
}: {
  examples: readonly MenuExample[];
  consumer: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: MenuStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('Menu comparison has not mounted');
        const legacy = getComparisonMenu(container, 'legacy');
        const headless = getComparisonMenu(container, 'headless');
        await settleMenuStyles(legacy, headless);
        if (!active) return;
        if (!legacyPositioningRef.current || !headlessPositioningRef.current) {
          throw new Error('Menu comparison positioning handles are unavailable');
        }
        await refreshMenuComparisonPositioning(
          legacy,
          getComparisonMenuTrigger(container, 'legacy'),
          headless,
          getComparisonMenuTrigger(container, 'headless'),
          legacyPositioningRef.current,
          headlessPositioningRef.current,
        );
        if (!active) return;
        if (!headless.matches(':popover-open')) throw new Error('Native Menu is not open');
        const rect = headless.getBoundingClientRect();
        if (rect.width < 138 || rect.height <= 0) throw new Error('Menu has no valid geometry');
        setReport({
          example: example.name,
          differences: compareMenuStyles(
            captureMenuStyles(legacy),
            captureMenuStyles(headless),
            consumer,
          ),
          native: captureMenuNativeContract(headless),
          width: rect.width,
          height: rect.height,
        });
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            width: 0,
            height: 0,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
    void capture();
    return () => {
      active = false;
    };
  }, [example, consumer]);

  const currentReport = report?.example === example.name ? report : null;
  const unexpected = currentReport?.differences.filter(
    (difference) => difference.kind === 'unexpected',
  );
  return (
    <div>
      <p>
        Shared fixtures compare bounded MenuPopover, list, item, icon, check, shortcut, multiline,
        group/header, divider, split separator and switch styles and dimensions. CSS values, offsets
        and rectangles are exact; there is no geometry tolerance. Native top-layer and CSS-anchor
        properties are reported separately from the legacy Portal and positioner. The report
        reserves 320px and refreshes both public positioning handles after layout.
      </p>
      <p>
        Menu and MenuTrigger add no DOM or visual props. The installed public API has no size or
        inset prop. All selection and submenu context comes from the current public hooks.
        CoreAI&apos;s only Menu deviation is its defaults-gated surface border.
      </p>
      <p>
        Arrow/Home/End navigation uses native focusgroup when available. Other browsers require a
        consumer-supplied polyfill. This experimental consumer initializes
        @microsoft/focusgroup-polyfill 1.6.0 before Menu mounts and initializes new groups in its
        own subtree. It no-ops on native engines. Nothing is imported by library components. The
        polyfill documents visibility-only nested-group/Tab limitations; the current native
        MenuPopover re-stamps its focusgroup attribute on open. The interaction stories exercise
        first-open, reopen and submenus instead of adding a legacy focus manager. Synthetic plays
        prepare focus explicitly on native engines; trusted acceptance checks real keys with native
        support both enabled and disabled.
      </p>
      <label htmlFor={selectId}>Menu visual fixture</label>{' '}
      <select
        id={selectId}
        value={selectedName}
        onChange={(event) => {
          setReport(null);
          setSelectedName(event.target.value);
        }}
      >
        {examples.map((candidate) => (
          <option key={candidate.name}>{candidate.name}</option>
        ))}
      </select>
      <div className={styles.pointerRest} data-testid="menu-report-pointer-rest">
        Pointer rest
      </div>
      <div ref={containerRef}>
        <MenuComparison
          key={example.name}
          example={example}
          legacyPositioningRef={legacyPositioningRef}
          headlessPositioningRef={headlessPositioningRef}
        />
      </div>
      <pre
        role="status"
        aria-label="Menu style report"
        className={styles.report}
        data-menu-report-state={
          currentReport ? (currentReport.error ? 'error' : 'ready') : 'pending'
        }
        data-menu-report-example={currentReport?.example ?? ''}
        data-menu-unexpected-count={unexpected?.length ?? ''}
        data-menu-surface-width={currentReport?.width ?? ''}
        data-menu-surface-height={currentReport?.height ?? ''}
      >
        {!currentReport
          ? 'Comparing Menu slots…'
          : currentReport.error
            ? `Comparison failed: ${currentReport.error}`
            : JSON.stringify(
                {
                  summary: consumer
                    ? 'Intentional ordinary consumer cascade.'
                    : unexpected?.length
                      ? `${unexpected.length} unexpected differences.`
                      : 'No unexpected differences in selected properties.',
                  differences: currentReport.differences,
                  native: currentReport.native,
                },
                null,
                2,
              )}
      </pre>
    </div>
  );
}

export function MenuComparisonWithReport({
  examples = menuExamples,
  consumer = false,
}: {
  examples?: readonly MenuExample[];
  consumer?: boolean;
}) {
  return (
    <MenuFocusgroupConsumer>
      <ReadyMenuComparisonReport examples={examples} consumer={consumer} />
    </MenuFocusgroupConsumer>
  );
}
