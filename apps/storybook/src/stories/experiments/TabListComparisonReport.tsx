// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { TabListComparison, tabListExamples, type TabListExample } from './TabListComparison.js';
import {
  captureTabListNativeContract,
  captureTabListStyles,
  compareTabListStyles,
  getComparisonTabList,
  settleTabListStyles,
  type TabListStyleDifference,
} from './compareTabListStyles.js';
import styles from './TabListComparison.module.css';

function ReadyTabListReport({
  examples,
  consumer,
}: {
  examples: readonly TabListExample[];
  consumer: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [captureVersion, setCaptureVersion] = React.useState(0);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: TabListStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    tabs: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        if (!containerRef.current) throw new Error('TabList comparison is not mounted');
        const legacy = getComparisonTabList(containerRef.current, 'legacy');
        const headless = getComparisonTabList(containerRef.current, 'headless');
        await settleTabListStyles(legacy, headless);
        if (!active) return;
        const rect = headless.getBoundingClientRect();
        const tabs = headless.querySelectorAll('[data-tablist-fixture-tab]').length;
        if (rect.width <= 0 || rect.height <= 0 || tabs !== 3) {
          throw new Error('TabList comparison has invalid geometry or tab count');
        }
        setReport({
          example: example.name,
          differences: compareTabListStyles(
            captureTabListStyles(legacy),
            captureTabListStyles(headless),
            consumer,
          ),
          native: captureTabListNativeContract(headless),
          width: rect.width,
          height: rect.height,
          tabs,
        });
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            width: 0,
            height: 0,
            tabs: 0,
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
        Shared fixtures compare bounded list/tab/content/icon/reserved-text and before/after
        indicator styles, exact dimensions, and relative offsets. CoreAI&apos;s elevated appearance
        actually delegates to filled-circular, with a grouped surface; it has no extra shadow or
        default-prop factory. It remains available when CoreAI component defaults are disabled.
      </p>
      <p>
        Current public hook/render/context APIs own selection, disabled state, callbacks, refs and
        ARIA. The existing public context carries stock appearance, size and reserved-space choices.
        A private visual-only boolean carries CoreAI&apos;s elevated appearance. Reserved selected
        text is appended through the public native-button root renderer, not an internal slot. As in
        the Fluent source, an explicit content slot also supplies explicit hidden visual space, even
        when default reservation is disabled. The old JavaScript indicator slide is not recreated;
        the local CSS indicator matches at rest. Arbitrary legacy custom style hooks are not
        invoked.
      </p>
      <p>
        The actual elevated enabled-hover/pressed selectors have greater specificity than its
        selected selectors, so interaction tokens win while hovered or pressed. The port retains
        that source behavior rather than silently changing the production reference.
      </p>
      <p>
        Directional navigation uses native focusgroup when feature detection succeeds. This shared
        experimental consumer initializes focusgroup-polyfill 1.6.0 before children and on new
        subtree groups. The component library imports no polyfill or focus manager. Visibility-only
        limitations stay consumer-owned; dynamic examples unmount/remount groups. Native panels and
        their associations belong to the author; the pinned facade exports neither TabPanel nor
        TabListProvider. Tab&apos;s supported native element is button; no anchor prop union is
        invented.
      </p>
      <label htmlFor={selectId}>TabList visual fixture</label>{' '}
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
        data-testid="tablist-report-pointer-rest"
        onPointerEnter={() => setCaptureVersion((version) => version + 1)}
      >
        Pointer rest
      </div>
      <div ref={containerRef}>
        <TabListComparison key={example.name} example={example} />
      </div>
      <pre
        role="status"
        aria-label="TabList style report"
        className={styles.report}
        data-tablist-report-state={
          currentReport ? (currentReport.error ? 'error' : 'ready') : 'pending'
        }
        data-tablist-report-example={currentReport?.example ?? ''}
        data-tablist-unexpected-count={unexpected?.length ?? ''}
        data-tablist-width={currentReport?.width ?? ''}
        data-tablist-height={currentReport?.height ?? ''}
        data-tablist-tab-count={currentReport?.tabs ?? ''}
      >
        {!currentReport
          ? 'Comparing TabList slots…'
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

export function TabListComparisonWithReport({
  examples = tabListExamples,
  consumer = false,
}: {
  examples?: readonly TabListExample[];
  consumer?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadyTabListReport examples={examples} consumer={consumer} />
    </FocusgroupConsumer>
  );
}
