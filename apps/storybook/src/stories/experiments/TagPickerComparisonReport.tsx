// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { PositioningImperativeRef } from '@coreai-ds/react-components';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import {
  TagPickerComparison,
  tagPickerExamples,
  type TagPickerExample,
} from './TagPickerComparison.js';
import {
  captureTagPickerNativeContract,
  captureTagPickerStyles,
  compareTagPickerStyles,
  getComparisonTagPicker,
  getTagPickerPopup,
  refreshTagPickerPositioning,
  settleTagPickerStyles,
  type TagPickerStyleDifference,
} from './compareTagPickerStyles.js';
import styles from './TagPickerComparison.module.css';

function ReadyTagPickerReport({
  examples = tagPickerExamples,
  consumer = false,
}: {
  examples?: readonly TagPickerExample[];
  consumer?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const legacyPositioning = React.useRef<PositioningImperativeRef>(null);
  const headlessPositioning = React.useRef<PositioningImperativeRef>(null);
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [fixtureRevision, resetFixture] = React.useReducer((value: number) => value + 1, 0);
  const [revision, refresh] = React.useReducer((value: number) => value + 1, 0);
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const selectId = React.useId();
  const [report, setReport] = React.useState<{
    example: string;
    differences: TagPickerStyleDifference[];
    native: Record<string, string>;
    width: number;
    height: number;
    tagCount: number;
    optionCount: number;
    error?: string;
  } | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setReport(null);
      refresh();
    });
    for (const element of container.querySelectorAll(
      '.fui-TagPickerControl, .fui-TagPickerGroup, .fui-TagPickerInput, .fui-TagPickerButton, .fui-TagPickerControl__aside',
    )) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [example, fixtureRevision]);

  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const container = containerRef.current;
        if (!container) throw new Error('TagPicker comparison has not mounted');
        const legacy = getComparisonTagPicker(container, 'legacy');
        const headless = getComparisonTagPicker(container, 'headless');
        const legacyPopup = getTagPickerPopup(container, 'legacy');
        const headlessPopup = getTagPickerPopup(container, 'headless');
        await settleTagPickerStyles(legacy, headless);
        if (!active) return;
        if (legacyPopup && headlessPopup) {
          container.scrollIntoView({ block: 'start', inline: 'nearest' });
          if (!legacyPositioning.current || !headlessPositioning.current) {
            throw new Error('TagPicker public positioning handles are unavailable');
          }
          await refreshTagPickerPositioning(
            legacyPopup,
            legacy,
            headlessPopup,
            headless,
            legacyPositioning.current,
            headlessPositioning.current,
          );
        }
        if (!active) return;
        const box = headless.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0)
          throw new Error('TagPicker fixture has no visible control geometry');
        setReport({
          example: example.name,
          differences: compareTagPickerStyles(
            captureTagPickerStyles(legacy, legacyPopup),
            captureTagPickerStyles(headless, headlessPopup),
            consumer,
          ),
          native: captureTagPickerNativeContract(headless, headlessPopup),
          width: box.width,
          height: box.height,
          tagCount: headless.querySelectorAll('[data-tagpicker-part="tag"]').length,
          optionCount: headlessPopup?.querySelectorAll('.fui-TagPickerOption').length ?? 0,
        });
      } catch (error) {
        if (active)
          setReport({
            example: example.name,
            differences: [],
            native: {},
            width: 0,
            height: 0,
            tagCount: 0,
            optionCount: 0,
            error: error instanceof Error ? error.message : String(error),
          });
      }
    };
    void compare();
    return () => {
      active = false;
    };
  }, [example, consumer, revision, fixtureRevision]);

  const current = report?.example === example.name ? report : null;
  const unexpected = current?.differences.filter((difference) => difference.kind === 'unexpected');
  return (
    <div data-tagpicker-focusgroup-mode={supportsFocusGroup() ? 'native' : 'consumer-polyfill'}>
      <p>
        Shared fixtures compare the selected control, group, completed Tag slots, input/button,
        aside/expand/secondary action, list, options, option groups, media and secondary text.
        Bounded CSS strings, slot counts, dimensions and offsets are exact. The native 80vh maximum
        is reported separately only when both popup rectangles match exactly.
      </p>
      <p>
        This uses the current public 0.3.2 hook/render/context facade, with react-tag-picker 9.10.5
        as the visual reference. The root has no DOM, ref, inline or public provider alias. CoreAI
        defaults omitted appearance to filled-darker only while component defaults are on; explicit
        undefined and defaults opt-out resolve to outline. Picker size does not inherit Field.
        Selected tags reuse the completed TagGroup visual context and Tag components.
      </p>
      <p>
        Native popovers/CSS anchors own placement, closed-state hiding, top-layer dismissal and
        current active-descendant behavior. Only selected-tag focusgroup navigation needs the
        consumer polyfill. The shared consumer loads the real 1.6.0 polyfill when necessary. Current
        selected groups are toolbars, rather than legacy listboxes. TagPickerOption has no public
        checkIcon slot and its renderer emits no selection glyph. Input clearable and child
        input/button appearance/size do not select additional visual rules upstream. Single
        selection, filtering, clearing and restoration belong to the consumer flows.
      </p>
      <p>
        Two pinned primitive boundaries remain explicit: TagPickerOption replaces the checkbox
        role/ARIA without automatically adding aria-selected, so these consumer fixtures supply that
        native attribute. TagPickerButton only consumes its own disabled prop; the button flow
        passes disabled explicitly alongside the disabled root. Neither boundary is patched in the
        component library.
      </p>
      <p>
        Refresh resets this static fixture through its React key. A trusted outside click can
        dismiss a native popover even when a visual fixture holds open=true; resetting restores the
        requested visual case without changing component behavior or native attributes.
      </p>
      <label htmlFor={selectId}>TagPicker visual fixture</label>{' '}
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
          resetFixture();
        }}
      >
        Refresh TagPicker report
      </button>
      <div className={styles.pointerRest} data-testid="tagpicker-report-pointer-rest">
        Pointer rest
      </div>
      <div ref={containerRef}>
        <TagPickerComparison
          key={`${example.name}-${fixtureRevision}`}
          example={example}
          legacyPositioningRef={legacyPositioning}
          headlessPositioningRef={headlessPositioning}
        />
      </div>
      <output
        className={styles.report}
        aria-label="TagPicker style report"
        aria-live="polite"
        data-tagpicker-report-state={current ? (current.error ? 'error' : 'ready') : 'pending'}
        data-tagpicker-report-example={current?.example ?? ''}
        data-tagpicker-unexpected-count={current?.error ? undefined : (unexpected?.length ?? '')}
        data-tagpicker-tag-count={current?.tagCount ?? ''}
        data-tagpicker-option-count={current?.optionCount ?? ''}
        data-tagpicker-control-width={current?.width ?? ''}
        data-tagpicker-control-height={current?.height ?? ''}
      >
        {current?.error
          ? `Comparison failed: ${current.error}`
          : current
            ? `${unexpected?.length ?? 0} unexpected differences.\n${JSON.stringify(current, null, 2)}`
            : 'Comparing selected TagPicker styles…'}
      </output>
    </div>
  );
}

export function TagPickerComparisonReport(props: {
  examples?: readonly TagPickerExample[];
  consumer?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadyTagPickerReport {...props} />
    </FocusgroupConsumer>
  );
}
