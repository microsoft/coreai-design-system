// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { ToolbarComparison, toolbarExamples, type ToolbarExample } from './ToolbarComparison.js';
import {
  captureToolbarNativeContract,
  captureToolbarStyles,
  compareToolbarStyles,
  getComparisonToolbar,
  settleToolbarStyles,
  type ToolbarStyleDifference,
} from './compareToolbarStyles.js';
import styles from './ToolbarComparison.module.css';

function ReadyToolbarComparisonReport({
  examples,
  consumer,
}: {
  examples: readonly ToolbarExample[];
  consumer: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [captureVersion, setCaptureVersion] = React.useState(0);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: ToolbarStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        if (!containerRef.current) throw new Error('Toolbar comparison is not mounted');
        const legacy = getComparisonToolbar(containerRef.current, 'legacy');
        const headless = getComparisonToolbar(containerRef.current, 'headless');
        await settleToolbarStyles(legacy, headless);
        if (!active) return;
        const rect = headless.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) throw new Error('Toolbar has no valid geometry');
        setReport({
          example: example.name,
          differences: compareToolbarStyles(
            captureToolbarStyles(legacy),
            captureToolbarStyles(headless),
            consumer,
          ),
          native: captureToolbarNativeContract(headless),
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
  }, [example, consumer, captureVersion]);

  const currentReport = report?.example === example.name ? report : null;
  const unexpected = currentReport?.differences.filter(
    (difference) => difference.kind === 'unexpected',
  );
  return (
    <div>
      <p>
        The same fixtures compare bounded Toolbar, button/icon, toggle/radio, divider/pseudo-line
        and group styles and exact rectangles/offsets. CoreAI has no Toolbar-family wrapper, prop
        defaults or style overrides. The existing Button/ToggleButton/Divider CSS foundations are
        reused without standalone Button defaults.
      </p>
      <p>
        Toolbar size controls its padding and toggle/radio size. The actual plain ToolbarButton
        remains medium; its vertical prop controls icon/text layout, independently of Toolbar
        orientation. ToolbarRadioGroup shares ToolbarGroup styles. Selection stays in the public
        hook/context; these wrappers add no selection or focus state.
      </p>
      <p>
        The pinned raw ToolbarRadioButton click handler replaces its disabled-focusable guard.
        Native disabled radios remain blocked; a controlled checkedValues owner can reject the
        inherited disabled-focusable notification. Caller click cancellation also runs after Toolbar
        selection notification. These boundaries are retained, not patched in the library.
      </p>
      <p>
        Arrow/Home/End navigation uses native focusgroup when available. This experimental
        story/test-only FocusgroupConsumer initializes the documented @microsoft/focusgroup-polyfill
        1.6.0 API before mounting children and initializes dynamically added groups. The library
        imports no polyfill or legacy focus manager. The polyfill documents visibility-only
        limitations; the interactive examples unmount/remount additional groups instead of
        implementing a new navigation fallback.
      </p>
      <label htmlFor={selectId}>Toolbar visual fixture</label>{' '}
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
      <div
        className={styles.pointerRest}
        data-testid="toolbar-report-pointer-rest"
        onPointerEnter={() => setCaptureVersion((version) => version + 1)}
      >
        Pointer rest
      </div>
      <div ref={containerRef}>
        <ToolbarComparison key={example.name} example={example} />
      </div>
      <pre
        role="status"
        aria-label="Toolbar style report"
        className={styles.report}
        data-toolbar-report-state={
          currentReport ? (currentReport.error ? 'error' : 'ready') : 'pending'
        }
        data-toolbar-report-example={currentReport?.example ?? ''}
        data-toolbar-unexpected-count={unexpected?.length ?? ''}
        data-toolbar-width={currentReport?.width ?? ''}
        data-toolbar-height={currentReport?.height ?? ''}
      >
        {!currentReport
          ? 'Comparing Toolbar slots…'
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

export function ToolbarComparisonWithReport({
  examples = toolbarExamples,
  consumer = false,
}: {
  examples?: readonly ToolbarExample[];
  consumer?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadyToolbarComparisonReport examples={examples} consumer={consumer} />
    </FocusgroupConsumer>
  );
}
