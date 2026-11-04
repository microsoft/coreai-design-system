// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { TagComparison, tagExamples, type TagExample } from './TagComparison.js';
import {
  InteractionTagComparison,
  interactionTagExamples,
  type InteractionTagExample,
} from './InteractionTagComparison.js';
import {
  TagGroupComparison,
  tagGroupExamples,
  type TagGroupExample,
} from './TagGroupComparison.js';
import {
  captureTagStyles,
  compareTagStyles,
  getComparisonTag,
  settleTagStyles,
  type TagStyleDifference,
} from './compareTagStyles.js';
import { captureInteractionTagStyles } from './compareInteractionTagStyles.js';
import styles from './TagComparison.module.css';

type ReportProps =
  | { family: 'tag'; examples?: readonly TagExample[]; consumer?: boolean }
  | { family: 'interaction'; examples?: readonly InteractionTagExample[]; consumer?: boolean }
  | { family: 'group'; examples?: readonly TagGroupExample[]; consumer?: boolean };

function ReadyTagReport(props: ReportProps) {
  const examples =
    props.examples ??
    (props.family === 'tag'
      ? tagExamples
      : props.family === 'interaction'
        ? interactionTagExamples
        : tagGroupExamples);
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [revision, refresh] = React.useReducer((value: number) => value + 1, 0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = React.useId();
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: TagStyleDifference[];
    width: number;
    height: number;
    slots: number;
    error?: string;
  } | null>(null);
  React.useEffect(() => {
    let active = true;
    const capture = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('Tag comparison has not mounted');
        const legacy = getComparisonTag(container, 'legacy');
        const headless = getComparisonTag(container, 'headless');
        await settleTagStyles(legacy, headless);
        if (!active) return;
        const interaction =
          props.family === 'interaction' ||
          (props.family === 'group' && 'interaction' in example && example.interaction);
        const snapshot = interaction ? captureInteractionTagStyles : captureTagStyles;
        const rect = headless.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0)
          throw new Error('Tag fixture has no visible geometry');
        setReport({
          example: example.name,
          differences: compareTagStyles(snapshot(legacy), snapshot(headless), props.consumer),
          width: rect.width,
          height: rect.height,
          slots: headless.querySelectorAll('[data-tag-part]').length,
        });
      } catch (error) {
        if (active)
          setReport({
            example: example.name,
            differences: [],
            width: 0,
            height: 0,
            slots: 0,
            error: error instanceof Error ? error.message : String(error),
          });
      }
    };
    void capture();
    return () => {
      active = false;
    };
  }, [example, props.family, props.consumer, revision]);

  const current = report?.example === example.name ? report : null;
  const unexpected = current?.differences.filter((difference) => difference.kind === 'unexpected');
  const renderFixture = () => {
    if (props.family === 'tag') {
      const fixture =
        (props.examples ?? tagExamples).find((candidate) => candidate.name === selectedName) ??
        (props.examples ?? tagExamples)[0];
      return <TagComparison example={fixture} />;
    }
    if (props.family === 'interaction') {
      const fixture =
        (props.examples ?? interactionTagExamples).find(
          (candidate) => candidate.name === selectedName,
        ) ?? (props.examples ?? interactionTagExamples)[0];
      return <InteractionTagComparison example={fixture} />;
    }
    const fixture =
      (props.examples ?? tagGroupExamples).find((candidate) => candidate.name === selectedName) ??
      (props.examples ?? tagGroupExamples)[0];
    return <TagGroupComparison example={fixture} />;
  };
  return (
    <div>
      <p>
        Shared fixtures compare selected root, group, media, Avatar/presence, icon, text, dismiss,
        primary and secondary styles, counts, dimensions and offsets. All CSS strings and geometry
        are exact. No screenshots, full-CSS dumps or broad visual exclusions are used.
      </p>
      <p>
        CoreAI changes only primary-text bottom padding and the non-outline secondary divider.
        Disabling component defaults restores Fluent styling. Interaction parts reuse Tag&apos;s
        slot CSS and the completed Avatar/PresenceBadge foundations. The current public hooks own
        disabled, selected, dismissal, callbacks and native button semantics. TagGroup uses
        focusgroup=&quot;toolbar inline wrap&quot;; the shared consumer initializes the real 1.6.0
        polyfill only when native support is absent. Post-dismiss focus restoration is explicitly
        consumer-owned. No library polyfill, Tabster fallback, selection normalization or focus
        state is added. Primary/secondary accept buttons, not anchors; use explicit
        type=&quot;button&quot; for non-submit primary actions in forms. Legacy custom style hooks
        are not called.
      </p>
      <label htmlFor={selectId}>Tag visual fixture</label>{' '}
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
      </select>{' '}
      <button
        type="button"
        onClick={() => {
          setReport(null);
          refresh();
        }}
      >
        Refresh tag report
      </button>
      <div className={styles.pointerRest} data-testid="tag-report-pointer-rest">
        Pointer rest
      </div>
      <div ref={containerRef} key={example.name}>
        {renderFixture()}
      </div>
      <pre
        role="status"
        aria-label="Tag style report"
        className={styles.report}
        data-tag-report-state={current ? (current.error ? 'error' : 'ready') : 'pending'}
        data-tag-report-example={current?.example ?? ''}
        data-tag-unexpected-count={unexpected?.length ?? ''}
        data-tag-root-width={current?.width ?? ''}
        data-tag-root-height={current?.height ?? ''}
        data-tag-slot-count={current?.slots ?? ''}
        data-tag-focusgroup-mode={supportsFocusGroup() ? 'native' : 'consumer-polyfill'}
      >
        {JSON.stringify(
          current
            ? {
                ...current,
                focusgroup: supportsFocusGroup() ? 'native' : 'consumer-polyfill',
                source: '@fluentui/react-tags 9.9.8 / headless-preview 0.3.2',
              }
            : { state: 'pending' },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

export function TagComparisonWithReport(props: ReportProps) {
  return (
    <FocusgroupConsumer>
      <ReadyTagReport {...props} />
    </FocusgroupConsumer>
  );
}
