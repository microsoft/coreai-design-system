// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  TeachingPopoverComparison,
  teachingPopoverExamples,
  type TeachingPopoverExample,
} from './TeachingPopoverComparison.js';
import {
  capturePopoverNativeContract,
  captureTeachingPopoverStyles,
  compareTeachingPopoverStyles,
  getTeachingPopoverSurface,
  getTeachingPopoverTrigger,
  prepareTeachingPopoverComparison,
  refreshTeachingPopoverPositioning,
  settleTeachingPopoverStyles,
  type TeachingPopoverStyleDifference,
} from './compareTeachingPopoverStyles.js';
import styles from './TeachingPopoverComparison.module.css';

export function TeachingPopoverComparisonWithReport({
  examples = teachingPopoverExamples,
  consumer = false,
}: {
  examples?: readonly TeachingPopoverExample[];
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
    differences: TeachingPopoverStyleDifference[];
    native: Record<string, string>;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('TeachingPopover comparison has not mounted');
        const legacy = getTeachingPopoverSurface(container, 'legacy');
        const headless = getTeachingPopoverSurface(container, 'headless');
        prepareTeachingPopoverComparison(container);
        await Promise.all([
          settleTeachingPopoverStyles(legacy),
          settleTeachingPopoverStyles(headless),
        ]);
        if (!active) return;
        if (!legacyPositioningRef.current || !headlessPositioningRef.current) {
          throw new Error('TeachingPopover public positioning handles are unavailable');
        }
        await refreshTeachingPopoverPositioning(
          legacy,
          getTeachingPopoverTrigger(container, 'legacy'),
          headless,
          getTeachingPopoverTrigger(container, 'headless'),
          legacyPositioningRef.current,
          headlessPositioningRef.current,
        );
        if (!active) return;
        const differences = compareTeachingPopoverStyles(
          captureTeachingPopoverStyles(legacy, getTeachingPopoverTrigger(container, 'legacy')),
          captureTeachingPopoverStyles(headless, getTeachingPopoverTrigger(container, 'headless')),
          example.props?.withArrow === false ? undefined : example.props?.size === 'small' ? 6 : 8,
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
  return (
    <div>
      <p>
        The 0.4.1 facade publishes the complete TeachingPopover and carousel family.
        Surfaces, title/header/body/footer slots, media ratios, action buttons, navigation, page
        count, arrow pseudo-elements and dimensions are bounded comparisons. Native top-layer and
        anchor contracts are reported separately. Arrow gap/centering differences use the completed
        Popover report&apos;s exact classifications, not broad property exclusions. A legacy-only
        cross-axis offset of exactly half a CSS pixel is classified separately when native
        positioning is exactly centered and the compared widths match; the legacy positioner rounds
        its transform to device pixels.
      </p>
      <p>
        TeachingPopover has no CoreAI wrapper defaults or registered custom style hook. Its 16px
        padding and extra-large radius override the delegated Popover foundation for every size. The
        original does not invoke CoreAI&apos;s generic Overlay border hook. The current Footer
        accepts children, not primary/secondary slots; its example actions are explicitly
        consumer-styled in both references. No legacy footer-button or carousel compatibility API is
        added.
      </p>
      <p>
        Native TeachingPopover defaults to non-modal behavior; set inertTrapFocus explicitly for a modal
        dialog. Title dismiss buttons inherit aria-hidden=true from the pinned hook: the title-only
        fixture explicitly supplies aria-hidden=false and a label. CarouselNav publishes ordinary
        tab stops, with no focusgroup or legacy arrow-navigation manager. Native Tab navigation is
        intentional. Carousel action props-object slots do not include ref; a typed slot renderer
        can use the public forward-ref FooterButton component when a native action ref is needed.
        Offset layout changes visual order only; the current previous-first DOM/Tab order remains.
        Public positioning handles refresh after report layout, and capture waits for stable
        consecutive geometry. Resting comparisons park focus on the trigger; narrow stacked columns
        scroll the native anchor into view before capture. The installed media fallback query
        selects fixed 117px/176px/288px heights even when aspect-ratio is supported.
      </p>
      <label htmlFor={selectId}>TeachingPopover visual fixture</label>{' '}
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
        <TeachingPopoverComparison
          key={example.name}
          example={example}
          legacyPositioningRef={legacyPositioningRef}
          headlessPositioningRef={headlessPositioningRef}
        />
      </div>
      <output
        className={styles.report}
        aria-label="TeachingPopover style report"
        aria-live="polite"
        data-teaching-report-example={report?.example}
        data-teaching-report-state={report ? (report.error ? 'error' : 'ready') : 'comparing'}
        data-teaching-unexpected-count={report?.error ? undefined : unexpected?.length}
      >
        {report?.error
          ? `Comparison failed: ${report.error}`
          : !report
            ? 'Comparing teaching content…'
            : consumer
              ? 'Intentional consumer cascade example.'
              : unexpected?.length
                ? `${unexpected.length} unexpected differences.`
                : 'No unexpected differences in the selected properties.'}
        {report &&
          `\n${JSON.stringify({ differences: report.differences, native: report.native }, null, 2)}`}
      </output>
    </div>
  );
}
