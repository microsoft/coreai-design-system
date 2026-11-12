// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { PopoverComparison, popoverExamples, type PopoverExample } from './PopoverComparison.js';
import {
  capturePopoverNativeContract,
  capturePopoverStyles,
  comparePopoverStyles,
  getComparisonPopover,
  getComparisonPopoverTrigger,
  refreshPopoverComparisonPositioning,
  settlePopoverStyles,
  type PopoverStyleDifference,
} from './comparePopoverStyles.js';
import styles from './PopoverComparison.module.css';

export function ComparisonWithReport({
  examples = popoverExamples,
  consumer = false,
}: {
  examples?: readonly PopoverExample[];
  consumer?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioningRef = React.useRef<PositioningImperativeRef>(null);
  const selectId = React.useId();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: PopoverStyleDifference[];
    native: Record<string, string>;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('Popover comparison has not mounted');
        const legacy = getComparisonPopover(container, 'legacy');
        const headless = getComparisonPopover(container, 'headless');
        await Promise.all([settlePopoverStyles(legacy), settlePopoverStyles(headless)]);
        if (!active) return;
        if (!legacyPositioningRef.current || !headlessPositioningRef.current) {
          throw new Error('Popover comparison positioning handles are unavailable');
        }
        await refreshPopoverComparisonPositioning(
          legacy,
          getComparisonPopoverTrigger(container, 'legacy'),
          headless,
          getComparisonPopoverTrigger(container, 'headless'),
          legacyPositioningRef.current,
          headlessPositioningRef.current,
        );
        if (!active) return;
        const differences = comparePopoverStyles(
          capturePopoverStyles(legacy, getComparisonPopoverTrigger(container, 'legacy')),
          capturePopoverStyles(headless, getComparisonPopoverTrigger(container, 'headless')),
          example.props?.withArrow ? (example.props.size === 'small' ? 6 : 8) : undefined,
        );
        setReport({
          example: example.name,
          differences,
          native: capturePopoverNativeContract(headless),
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
  const summary = report?.error
    ? `Comparison failed: ${report.error}`
    : !report
      ? 'Comparing open surfaces…'
      : consumer
        ? 'Intentional consumer cascade example.'
        : unexpected?.length
          ? `${unexpected.length} unexpected differences.`
          : 'No unexpected differences in the selected properties.';

  return (
    <div>
      <p>
        Only one native popover is compared at a time: auto popover peers dismiss one another.
        Surface/trigger dimensions, typography, borders, padding, colors, filter, arrow and
        arrow::before styles, and anchor-relative placement are bounded comparisons. Native
        structure/backdrop/anchor properties are reported separately, not silently equated to the
        legacy Portal. The current withArrow prop does not add positioning offset; the documented
        6px/8px legacy-only arrow gap is explicitly classified. Only rotated arrow rectangle
        width/height permits up to 0.5 CSS px of capture noise; computed CSS values and placement
        offsets stay exact.
      </p>
      <p>
        Centered pointers use the surface center with the exact native-arrow-centering translate
        rule, instead of legacy measured coordinates. Edge-aligned pointers use an 8px corner
        padding, adjustable with --fui-PopoverSurface--arrow-padding; the public arrow has no
        measured trigger-center slot. The pinned observer prefers a start label when both edges
        align, including equal-width centered boxes. The positioning hook clears inline width unless
        matching the target; use CSS classes or min/max sizing for custom widths.
      </p>
      <p>
        Native inline placement follows its containing block&apos;s writing direction. Set dir on
        the document for viewport-level RTL anchoring; a nested RTL provider only changes local
        inheritance, not the viewport&apos;s axes.
      </p>
      <p>
        The legacy reference uses its supported surfaceMotion=null option so reports cannot sample
        an old enter frame; the headless component gains no motion compatibility API. Chromium
        quantizes anchor box positions to 1/64 CSS px. With a fractional target width, the centered
        surface and its pointer can sit 1/128 CSS px from the target midpoint. The pointer stays
        exactly centered on the native surface; offsets are not normalized.
      </p>
      <p>
        The report reserves its layout space. After layout settles, both public positioning handles
        refresh, and capture waits for the reference&apos;s positioning-completion event.
      </p>
      <label htmlFor={selectId}>Popover visual fixture</label>{' '}
      <select
        id={selectId}
        value={selectedName}
        onChange={(event) => {
          setSelectedName(event.target.value);
          setReport(null);
        }}
      >
        {examples.map((candidate) => (
          <option key={candidate.name}>{candidate.name}</option>
        ))}
      </select>
      <div ref={containerRef}>
        <PopoverComparison
          key={example.name}
          example={example}
          legacyPositioningRef={legacyPositioningRef}
          headlessPositioningRef={headlessPositioningRef}
        />
      </div>
      <output
        className={styles.report}
        aria-label="Popover style report"
        aria-live="polite"
        data-popover-report-example={report?.example}
        data-popover-report-state={report ? (report.error ? 'error' : 'ready') : 'comparing'}
        data-popover-unexpected-count={report?.error ? undefined : unexpected?.length}
      >
        {summary}
        {report &&
          `\n${JSON.stringify(
            { differences: report.differences, native: report.native },
            null,
            2,
          )}`}
      </output>
    </div>
  );
}
