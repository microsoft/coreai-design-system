// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  AvatarGroupComparison,
  avatarGroupExamples,
  getAvatarGroupPartition,
  type AvatarGroupExample,
} from './AvatarGroupComparison.js';
import {
  captureAvatarGroupNativeContract,
  captureAvatarGroupStyles,
  compareAvatarGroupStyles,
  getComparisonAvatarGroup,
  refreshAvatarGroupPositioning,
  settleAvatarGroupStyles,
  type AvatarGroupStyleDifference,
} from './compareAvatarGroupStyles.js';
import styles from './AvatarGroupComparison.module.css';

export function AvatarGroupComparisonReport({
  examples = avatarGroupExamples,
}: {
  examples?: readonly AvatarGroupExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioning = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioning = React.useRef<PositioningImperativeRef>(null);
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [revision, refresh] = React.useReducer((value: number) => value + 1, 0);
  const selectId = React.useId();
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    revision: number;
    differences: AvatarGroupStyleDifference[];
    native: Record<string, string>;
    propertyCount: number;
    inlineCount: number;
    overflowCount: number;
    width: number;
    height: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('AvatarGroup comparison has not mounted');
        await settleAvatarGroupStyles(
          getComparisonAvatarGroup(container, 'legacy'),
          getComparisonAvatarGroup(container, 'headless'),
        );
        if (!active) return;
        const legacy = getComparisonAvatarGroup(container, 'legacy');
        const headless = getComparisonAvatarGroup(container, 'headless');
        const expected = getAvatarGroupPartition(example);
        const overflowCount = example.open ? (expected.overflowItems?.length ?? 0) : 0;
        if (
          legacy.items.length !== expected.inlineItems.length ||
          headless.items.length !== expected.inlineItems.length
        ) {
          throw new Error('AvatarGroup inline fixture count does not match the partition');
        }
        if (example.open && (!legacy.surface || !headless.surface)) {
          throw new Error('AvatarGroup open fixture has no overflow surface');
        }
        await refreshAvatarGroupPositioning(
          legacy,
          headless,
          legacyPositioning.current,
          headlessPositioning.current,
        );
        if (!active) return;
        const legacyValues = captureAvatarGroupStyles(legacy);
        const headlessValues = captureAvatarGroupStyles(headless);
        if (
          Number(legacyValues['overflow.count']) !== overflowCount ||
          Number(headlessValues['overflow.count']) !== overflowCount
        ) {
          throw new Error('AvatarGroup overflow fixture count does not match the partition');
        }
        const rect = headless.root.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0)
          throw new Error('AvatarGroup comparison has no visible group geometry');
        setReport({
          example: example.name,
          revision,
          differences: compareAvatarGroupStyles(legacyValues, headlessValues, example),
          native: captureAvatarGroupNativeContract(headless),
          propertyCount: Object.keys(headlessValues).length,
          inlineCount: headless.items.length,
          overflowCount,
          width: rect.width,
          height: rect.height,
        });
      } catch (error) {
        if (active)
          setReport({
            example: example.name,
            revision,
            differences: [],
            native: {},
            propertyCount: 0,
            inlineCount: 0,
            overflowCount: 0,
            width: 0,
            height: 0,
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
  const unexpected = current?.differences.filter((difference) => difference.kind === 'unexpected');
  return (
    <div>
      <p>
        These shared fixtures compare selected group/item/Avatar styles and dimensions, logical
        spacing, two/three-slice pie geometry, count/icon triggers, overflow rows, inherited
        PresenceBadge, and the completed native PopoverSurface. The actual Fluent composition uses
        colorful Avatars; explicit neutral uses background6, not standalone CoreAI Avatar&apos;s
        background4. The only CoreAI surface override is the existing defaults-gated overlay border.
      </p>
      <p>
        Native popovers, dialogs and CSS anchors retain their current focus, dismissal and collision
        behavior. This family emits no focusgroup and needs no focusgroup polyfill. The pinned
        current facade uses trapFocus, not the newer online inertTrapFocus spelling. Legacy Portal,
        motion, Tabster and positioning props are not restored. Native placement and roles are shown
        separately, not silently equated to legacy positioning. The renderer owns the behavior-only
        Popover/Trigger; a typed native-surface slot and the completed visual boundary provide its
        styling.
      </p>
      <p>
        The pinned public Tooltip rejects triggerButton render-function children with its Fragment
        guard in both the raw facade and this port. Use ordinary trigger content. Avatar, item
        root/label, list and native surface slot renderers retain their current supported contracts;
        no trigger workaround is added.
      </p>
      <p>
        Pie uses at most three inline people and includes every person in overflow. Fragments and
        additional list actions use an explicit count. Current 16px Avatars retain both initials;
        that exact difference remains visible. Default tooltip content reuses the surface CSS
        foundation with the installed Tooltip&apos;s size/shadow adjustments, without a second
        tooltip behavior implementation.
      </p>
      <p>
        Reports reserve their layout space, settle finite Avatar/pseudo-element animations and
        refresh both public positioning handles. Refresh remounts this static controlled fixture:
        native outside dismissal can close an open=true popover without changing its owner prop. No
        compatibility synchronization is added to the library.
      </p>
      <span className={styles.pointerRest} data-testid="avatar-group-report-pointer-rest">
        Park pointer here before comparing.
      </span>
      <label htmlFor={selectId}>AvatarGroup visual fixture</label>{' '}
      <select
        id={selectId}
        value={selectedName}
        onChange={(event) => {
          if (event.currentTarget.value === selectedName) return;
          setSelectedName(event.currentTarget.value);
          setReport(null);
        }}
      >
        {examples.map((candidate) => (
          <option key={candidate.name}>{candidate.name}</option>
        ))}
      </select>{' '}
      <button
        type="button"
        onClick={() => {
          setReport(null);
          refresh();
        }}
      >
        Refresh AvatarGroup report
      </button>
      <output
        className={styles.report}
        aria-label="AvatarGroup style report"
        aria-live="polite"
        data-avatar-group-report-example={current?.example}
        data-avatar-group-report-state={current ? (current.error ? 'error' : 'ready') : 'comparing'}
        data-avatar-group-unexpected-count={current?.error ? undefined : unexpected?.length}
        data-avatar-group-difference-count={current?.differences.length}
        data-avatar-group-property-count={current?.propertyCount}
        data-avatar-group-inline-count={current?.inlineCount}
        data-avatar-group-overflow-count={current?.overflowCount}
        data-avatar-group-width={current?.width}
        data-avatar-group-height={current?.height}
      >
        {!current
          ? 'Comparing AvatarGroup…'
          : current.error
            ? `Comparison failed: ${current.error}`
            : unexpected?.length
              ? `${unexpected.length} unexpected differences.`
              : 'No unexpected differences in the selected properties.'}
        {current && `\n${JSON.stringify(current, null, 2)}`}
      </output>
      <div ref={containerRef}>
        <AvatarGroupComparison
          key={`${example.name}:${revision}`}
          example={example}
          legacyPositioningRef={legacyPositioning}
          headlessPositioningRef={headlessPositioning}
        />
      </div>
    </div>
  );
}
