// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@coreai-ds/react-components';
import { OptionPickerComparison, type PickerExample } from './OptionPickerComparison.js';
import {
  captureOptionPickerNativeContract,
  captureOptionPickerStyles,
  compareOptionPickerStyles,
  getComparisonPicker,
  getComparisonPickerPopup,
  refreshOptionPickerPositioning,
  settleOptionPickerStyles,
  type OptionPickerStyleDifference,
} from './compareOptionPickerStyles.js';
import styles from './OptionPickerComparison.module.css';

export function OptionPickerComparisonReport({
  examples,
  consumer = false,
}: {
  examples: readonly PickerExample[];
  consumer?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: OptionPickerStyleDifference[];
    native: Record<string, string>;
    error?: string;
  } | null>(null);
  const selectId = React.useId();

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('Option-picker comparison has not mounted');
        const legacy = getComparisonPicker(container, 'legacy');
        const headless = getComparisonPicker(container, 'headless');
        const legacyPopup = getComparisonPickerPopup(container, 'legacy');
        const headlessPopup = getComparisonPickerPopup(container, 'headless');
        await settleOptionPickerStyles(legacy, headless);
        if (!active) return;
        if (legacyPopup && headlessPopup) {
          // Keep the full popup in view before comparing the legacy viewport-size middleware.
          container.scrollIntoView({ block: 'start', inline: 'nearest' });
        }
        if (example.kind !== 'listbox' && legacyPopup && headlessPopup) {
          if (!legacyPositioningRef.current || !headlessPositioningRef.current) {
            throw new Error('Option-picker positioning handles are unavailable');
          }
          await refreshOptionPickerPositioning(
            legacyPopup,
            legacy,
            headlessPopup,
            headless,
            legacyPositioningRef.current,
            headlessPositioningRef.current,
          );
        } else if (headlessPopup) {
          await settleOptionPickerStyles(legacy, headless);
        }
        if (!active) return;
        setReport({
          example: example.name,
          differences: compareOptionPickerStyles(
            captureOptionPickerStyles(legacy, legacyPopup),
            captureOptionPickerStyles(headless, headlessPopup),
          ),
          native: captureOptionPickerNativeContract(headless, headlessPopup),
        });
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
    void compare();
    return () => {
      active = false;
    };
  }, [example]);

  const unexpected = report?.differences.filter((difference) => difference.kind === 'unexpected');
  const nativeSizing = report?.differences.filter(
    (difference) => difference.kind === 'native-sizing',
  );

  return (
    <div>
      <p>
        One shared fixture at a time compares selected root, input/button, expand/clear, popup,
        option, group, checkmark styles and dimensions. CSS values and geometry offsets are exact.
        Popup comparisons explicitly use below/start, matching target width, and zero offset; the
        component itself keeps the facade&apos;s native positioning defaults. Width matching
        respects Listbox&apos;s 160px minimum, including narrower DropdownButton triggers.
      </p>
      <p>
        Legacy positioning 9.23.4 replaces the authored 80vh maximum with available viewport space.
        That exact native-sizing difference stays in the report only when native CSS remains 80vh
        and both popup rectangle dimensions match. Clipping, offsets, other styles, and larger
        geometry differences remain unexpected.
      </p>
      <p>
        Popover API and CSS anchors replace Portal/Popper behavior. Closed native popovers stay
        hidden; the browser owns top-layer placement, collision handling, scrolling, and dismissal.
        No focusgroup polyfill is needed for this family&apos;s active-descendant keyboard model.
        The published standalone Listbox has no popover prop. Its visible fixtures open through
        native showPopover() refs, with fixture-owned CSS anchors and reserved layout space.
      </p>
      <p>
        Combobox/Dropdown keep filled-darker even when component defaults are disabled. The native
        input slot reserves children for ordinary content, so inline Combobox labels use the public
        root renderer. DropdownButton reuses the completed Button CSS foundation on its original
        outer chrome; it keeps all five Button appearances and its circular default. The report
        reserves space and refreshes both public positioning handles after layout. A Field&apos;s
        native label association keeps its accessible name; Dropdown&apos;s inline visual label does
        not replace it.
      </p>
      <label htmlFor={selectId}>Option-picker visual fixture</label>{' '}
      <select
        id={selectId}
        value={selectedName}
        onChange={(event) => {
          if (event.target.value === selectedName) return;
          setSelectedName(event.target.value);
          setReport(null);
        }}
      >
        {examples.map((candidate) => (
          <option key={candidate.name}>{candidate.name}</option>
        ))}
      </select>
      <output
        className={styles.report}
        aria-label="Option-picker style report"
        aria-live="polite"
        data-picker-report-example={report?.example}
        data-picker-report-state={report ? (report.error ? 'error' : 'ready') : 'comparing'}
        data-picker-difference-count={report?.error ? undefined : report?.differences.length}
        data-picker-unexpected-count={report?.error ? undefined : unexpected?.length}
        data-picker-native-sizing-count={report?.error ? undefined : nativeSizing?.length}
      >
        {report?.error
          ? `Comparison failed: ${report.error}`
          : !report
            ? 'Comparing selected styles…'
            : consumer
              ? 'Intentional consumer cascade example.'
              : unexpected?.length
                ? `${unexpected.length} unexpected differences.`
                : `No unexpected differences in the selected properties. ${nativeSizing?.length ?? 0} native-sizing differences.`}
        {report && `\n${JSON.stringify(report, null, 2)}`}
      </output>
      <div ref={containerRef}>
        <OptionPickerComparison
          key={example.name}
          example={example}
          legacyPositioningRef={legacyPositioningRef}
          headlessPositioningRef={headlessPositioningRef}
        />
      </div>
    </div>
  );
}
