// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { TooltipComparison, tooltipExamples, type TooltipExample } from './TooltipComparison.js';
import {
  captureTooltipNativeContract,
  captureTooltipStyles,
  compareTooltipStyles,
  getComparisonTooltip,
  getComparisonTooltipTrigger,
  refreshTooltipComparisonPositioning,
  settleTooltipStyles,
  type TooltipStyleDifference,
} from './compareTooltipStyles.js';
import styles from './TooltipComparison.module.css';

type TooltipReport =
  | {
      state: 'ready';
      example: string;
      revision: number;
      differences: TooltipStyleDifference[];
      native: Record<string, string>;
      propertyCount: number;
      width: number;
      height: number;
    }
  | { state: 'error'; example: string; revision: number; error: string };

export function TooltipComparisonReport({
  examples = tooltipExamples,
}: {
  examples?: readonly TooltipExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioning = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioning = React.useRef<PositioningImperativeRef>(null);
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [revision, refresh] = React.useReducer((value: number) => value + 1, 0);
  const [report, setReport] = React.useState<TooltipReport | null>(null);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const selectId = React.useId();

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('Tooltip comparison has not mounted');
        const legacy = getComparisonTooltip(container, 'legacy');
        const headless = getComparisonTooltip(container, 'headless');
        const legacyTrigger = getComparisonTooltipTrigger(container, 'legacy');
        const headlessTrigger = getComparisonTooltipTrigger(container, 'headless');
        await Promise.all([settleTooltipStyles(legacy), settleTooltipStyles(headless)]);
        if (!active) return;
        if (!legacyPositioning.current || !headlessPositioning.current)
          throw new Error('Tooltip comparison positioning handles are unavailable');
        await refreshTooltipComparisonPositioning(
          legacy,
          legacyTrigger,
          headless,
          headlessTrigger,
          legacyPositioning.current,
          headlessPositioning.current,
        );
        if (!active) return;
        const rect = headless.getBoundingClientRect();
        if (
          !headless.matches(':popover-open') ||
          rect.width <= 0 ||
          rect.height <= 0 ||
          legacy.getBoundingClientRect().width <= 0
        )
          throw new Error('Tooltip comparison does not have two visible content fixtures');
        const legacyValues = captureTooltipStyles(legacy, legacyTrigger);
        const headlessValues = captureTooltipStyles(headless, headlessTrigger);
        setReport({
          state: 'ready',
          example: example.name,
          revision,
          differences: compareTooltipStyles(legacyValues, headlessValues, example),
          native: captureTooltipNativeContract(headless, headlessTrigger),
          propertyCount: Object.keys(headlessValues).length,
          width: rect.width,
          height: rect.height,
        });
      } catch (error) {
        if (active)
          setReport({
            state: 'error',
            example: example.name,
            revision,
            error: error instanceof Error ? error.message : String(error),
          });
      }
    };
    void compare();
    return () => {
      active = false;
    };
  }, [example, revision]);

  const current = report?.example === example.name && report.revision === revision ? report : null;
  const ready = current?.state === 'ready' ? current : null;
  const unexpected = ready?.differences.filter((difference) => difference.kind === 'unexpected');
  return (
    <div>
      <p>
        Shared fixtures compare selected content typography, wrapping, border, padding, colors,
        shadow, dimensions and arrow/pseudo-element styles. Tooltip and AvatarGroupPopover use the
        same visual slot adapter, composing the completed native PopoverSurface foundation. Only the
        actual CoreAI defaults-gated surface/arrow border is added.
      </p>
      <p>
        Current native hint popovers and CSS anchors own hiding, top-layer placement, collision and
        dismissal. The facade has no Portal, mountNode, defaultVisible, legacy positioner or
        focusgroup requirement. The native default offset is zero rather than the old 4px; withArrow
        adds no positioning offset, while the old reference adds 6px. These exact differences and
        centered-arrow translation are reported, not normalized. Explicit offsets remain
        caller-owned.
      </p>
      <p>
        Surface-centered arrows share the completed Popover geometry. Edge-aligned arrows use its
        8px corner padding rather than a legacy measured trigger-center position. The reference
        positioning handles refresh after layout settles. Refresh remounts this controlled example
        after native light dismissal; the library does not patch controlled/native visibility. The
        pinned observer labels edges within 2px as start/end aligned, even for a requested centered
        placement. Horizontal fixtures use a taller target to distinguish actual centered arrows;
        focused raw/current regressions retain the near-equal-edge boundary. Bounded, even-sized
        stages avoid the old positioner rounding fractional control-line coordinates to device
        pixels. Captured placement gaps remain exact.
      </p>
      <div className={styles.controls}>
        <span className={styles.pointerRest} data-testid="tooltip-report-pointer-rest">
          Park pointer here before comparing.
        </span>
        <label htmlFor={selectId}>Tooltip visual fixture</label>
        <select
          id={selectId}
          value={selectedName}
          onChange={(event) => setSelectedName(event.target.value)}
        >
          {examples.map((candidate) => (
            <option key={candidate.name}>{candidate.name}</option>
          ))}
        </select>
        <button type="button" onClick={refresh}>
          Refresh Tooltip report
        </button>
      </div>
      <div ref={containerRef}>
        <TooltipComparison
          key={`${example.name}-${revision}`}
          example={example}
          legacyPositioningRef={legacyPositioning}
          headlessPositioningRef={headlessPositioning}
        />
      </div>
      <output
        className={styles.report}
        aria-label="Tooltip style report"
        aria-live="polite"
        data-tooltip-report-example={current?.example}
        data-tooltip-report-state={current?.state ?? 'comparing'}
        data-tooltip-property-count={ready?.propertyCount}
        data-tooltip-fixture-count={ready ? 2 : undefined}
        data-tooltip-content-width={ready?.width}
        data-tooltip-content-height={ready?.height}
        data-tooltip-unexpected-count={unexpected?.length}
      >
        {current?.state === 'error'
          ? `Comparison failed: ${current.error}`
          : !ready
            ? 'Comparing visible tooltip content…'
            : example.consumer
              ? 'Intentional consumer cascade example.'
              : unexpected?.length
                ? `${unexpected.length} unexpected differences.`
                : 'No unexpected differences in the selected properties.'}
        {ready &&
          `\n${JSON.stringify({ differences: ready.differences, native: ready.native }, null, 2)}`}
      </output>
    </div>
  );
}
