// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import {
  SwatchPickerComparison,
  swatchPickerExamples,
  type SwatchPickerExample,
} from './SwatchPickerComparison.js';
import {
  captureSwatchPickerNativeContract,
  captureSwatchPickerStyles,
  compareSwatchPickerStyles,
  getComparisonSwatchPicker,
  settleSwatchPickerStyles,
  type SwatchPickerStyleDifference,
} from './compareSwatchPickerStyles.js';
import styles from './SwatchPickerComparison.module.css';

function ReadySwatchPickerReport({
  examples,
  consumer,
}: {
  examples: readonly SwatchPickerExample[];
  consumer: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [captureVersion, setCaptureVersion] = React.useState(0);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: SwatchPickerStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    swatches: number;
    rows: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        if (!containerRef.current) throw new Error('SwatchPicker comparison is not mounted');
        const legacy = getComparisonSwatchPicker(containerRef.current, 'legacy');
        const headless = getComparisonSwatchPicker(containerRef.current, 'headless');
        await settleSwatchPickerStyles(legacy, headless);
        if (!active) return;
        const rect = headless.getBoundingClientRect();
        const swatches = headless.querySelectorAll('[data-swatch-part]').length;
        const rows = headless.querySelectorAll('[data-swatch-row]').length;
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          swatches !== 6 ||
          rows !== (example.layout === 'grid' ? 2 : 0)
        ) {
          throw new Error('SwatchPicker comparison has invalid geometry or member counts');
        }
        setReport({
          example: example.name,
          differences: compareSwatchPickerStyles(
            captureSwatchPickerStyles(legacy),
            captureSwatchPickerStyles(headless),
            consumer,
          ),
          native: captureSwatchPickerNativeContract(headless),
          width: rect.width,
          height: rect.height,
          swatches,
          rows,
        });
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            width: 0,
            height: 0,
            swatches: 0,
            rows: 0,
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
        All five current members use public headless-preview 0.3.2 hooks/renderers and
        react-swatch-picker 9.6.3 raw styles. Public context carries size, shape and spacing; there
        is no separate selection state or private provider. CoreAI only changes the omitted shape
        default to rounded. Explicit undefined shape and disabled component defaults restore square.
      </p>
      <p>
        Native focusgroup owns row navigation; this experimental consumer supplies the actual
        focusgroup polyfill where needed. Row arrows move focus, not selection. Space/Enter activate
        native buttons. Grid rows supply current grid semantics, but the pinned grid/manual tokens
        do not navigate in either tested engine. The grid example explicitly uses the supported
        focusMode=&quot;tab&quot; path and proves the same boundary with raw current hooks. The
        library imports no polyfill, Tabster or legacy focus manager. Native keyboard focus uses
        :focus-visible.
      </p>
      <p>
        As in the installed visual source, ImageSwatch takes its parent size/shape even when child
        props are supplied. ColorSwatch and EmptySwatch allow child overrides. EmptySwatch is an
        author-owned action, not an automatic selection. Swatches are native buttons, not form radio
        inputs: applications own submitted selection values and reset state. No anchor overload or
        obsolete grid factory is invented. Ordinary unlayered consumer CSS intentionally wins.
      </p>
      <label htmlFor={selectId}>SwatchPicker visual fixture</label>{' '}
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
        data-testid="swatch-report-pointer-rest"
        onPointerEnter={() => setCaptureVersion((version) => version + 1)}
      >
        Pointer rest
      </div>
      <div ref={containerRef}>
        <SwatchPickerComparison key={example.name} example={example} />
      </div>
      <pre
        role="status"
        aria-label="SwatchPicker style report"
        className={styles.report}
        data-swatch-report-state={
          currentReport ? (currentReport.error ? 'error' : 'ready') : 'pending'
        }
        data-swatch-report-example={currentReport?.example ?? ''}
        data-swatch-unexpected-count={unexpected?.length ?? ''}
        data-swatch-width={currentReport?.width ?? ''}
        data-swatch-height={currentReport?.height ?? ''}
        data-swatch-count={currentReport?.swatches ?? ''}
        data-swatch-row-count={currentReport?.rows ?? ''}
      >
        {!currentReport
          ? 'Comparing SwatchPicker slots…'
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

export function SwatchPickerComparisonWithReport({
  examples = swatchPickerExamples,
  consumer = false,
}: {
  examples?: readonly SwatchPickerExample[];
  consumer?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadySwatchPickerReport examples={examples} consumer={consumer} />
    </FocusgroupConsumer>
  );
}
