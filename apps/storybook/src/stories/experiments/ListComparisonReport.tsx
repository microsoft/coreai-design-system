// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { ListComparison, listExamples, type ListExample } from './ListComparison.js';
import {
  captureListNativeContract,
  captureListStyles,
  compareListStyles,
  getComparisonList,
  settleListStyles,
  type ListStyleDifference,
} from './compareListStyles.js';
import styles from './ListComparison.module.css';

function ReadyListReport({
  examples,
  consumer,
}: {
  examples: readonly ListExample[];
  consumer: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [captureVersion, setCaptureVersion] = React.useState(0);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: ListStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    rows: number;
    checkmarks: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        if (!containerRef.current) throw new Error('List comparison is not mounted');
        const legacy = getComparisonList(containerRef.current, 'legacy');
        const headless = getComparisonList(containerRef.current, 'headless');
        await settleListStyles(legacy, headless);
        if (!active) return;
        const rect = headless.getBoundingClientRect();
        const rows = headless.querySelectorAll('[data-list-row]').length;
        const checkmarks = headless.querySelectorAll('input[type="checkbox"]').length;
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rows !== 3 ||
          checkmarks !== (example.checkmarks ? 3 : 0)
        ) {
          throw new Error('List comparison has invalid geometry or member counts');
        }
        setReport({
          example: example.name,
          differences: compareListStyles(
            captureListStyles(legacy),
            captureListStyles(headless),
            consumer,
          ),
          native: captureListNativeContract(headless),
          width: rect.width,
          height: rect.height,
          rows,
          checkmarks,
        });
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            width: 0,
            height: 0,
            rows: 0,
            checkmarks: 0,
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
        The pinned public List family contains List and ListItem only. Both use current
        headless-preview 0.3.2 hooks and renderers, with installed react-list 9.7.0 visuals. CoreAI
        reexports the original components without List defaults or overrides. Neither installed
        contract publishes size, layout, inset or spacing props; application CSS owns those choices.
      </p>
      <p>
        List owns collection semantics and selection. Item navigation uses native focusgroup with a
        test/story-only consumer polyfill where needed. Composite row/control navigation is already
        supplied by the current public hook, including native editable controls and RTL. No old
        focus manager or compatibility selection state is restored.
      </p>
      <p>
        Selectable listboxes suppress checkmarks through their supported null slot. Composite grids
        keep native input checkmarks in the public renderer&apos;s grid cells. A CSS-only bridge
        reuses the completed Checkbox indicator foundation and its exact filled checkmark glyph
        without substituting a Checkbox component. Native refs, checked state, forms and callbacks
        remain owned by the public input slot. Disabled selection is not a general action-disable
        prop. Application flows explicitly stop nested-action propagation when selection is
        unwanted.
      </p>
      <label htmlFor={selectId}>List visual fixture</label>{' '}
      <select
        id={selectId}
        value={selectedName}
        onChange={(event) => {
          if (event.target.value === selectedName) return;
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
        data-testid="list-report-pointer-rest"
        onPointerEnter={() => setCaptureVersion((version) => version + 1)}
      >
        Pointer rest
      </div>
      <div ref={containerRef}>
        <ListComparison key={example.name} example={example} />
      </div>
      <pre
        role="status"
        aria-label="List style report"
        className={styles.report}
        data-list-report-state={
          currentReport ? (currentReport.error ? 'error' : 'ready') : 'pending'
        }
        data-list-report-example={currentReport?.example ?? ''}
        data-list-unexpected-count={unexpected?.length ?? ''}
        data-list-width={currentReport?.width ?? ''}
        data-list-height={currentReport?.height ?? ''}
        data-list-row-count={currentReport?.rows ?? ''}
        data-list-checkmark-count={currentReport?.checkmarks ?? ''}
      >
        {!currentReport
          ? 'Comparing List slots…'
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

export function ListComparisonWithReport({
  examples = listExamples,
  consumer = false,
}: {
  examples?: readonly ListExample[];
  consumer?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadyListReport examples={examples} consumer={consumer} />
    </FocusgroupConsumer>
  );
}
