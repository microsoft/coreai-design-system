// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
  Tag,
  TagGroup,
  type TagGroupProps,
} from '@coreai-ds/react-headless-components';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import styles from './TagComparison.module.css';

export const initialFlowTags = [
  { value: 'plan', label: 'Plan' },
  { value: 'build', label: 'Build' },
  { value: 'ship', label: 'Ship' },
] as const;

function ReadyTagDismissFlow({ interaction, cold }: { interaction: boolean; cold: boolean }) {
  const [visible, setVisible] = React.useState<readonly { value: string; label: string }[]>(
    cold ? [] : initialFlowTags,
  );
  const [opened, setOpened] = React.useState('none');
  const [record, setRecord] = React.useState({ value: 'none', type: 'none', key: '', count: 0 });
  const resetRef = React.useRef<HTMLButtonElement>(null);
  const refs = React.useRef(new Map<string, HTMLElement>());
  const pendingFocus = React.useRef<string | null>(null);
  const onDismiss: TagGroupProps['onDismiss'] = (event, data) => {
    const index = visible.findIndex((tag) => tag.value === data.value);
    pendingFocus.current = visible[index + 1]?.value ?? visible[index - 1]?.value ?? 'restore';
    setRecord((previous) => ({
      value: data.value,
      type: event.type,
      key: 'key' in event ? event.key : '',
      count: previous.count + 1,
    }));
    setVisible((previous) => previous.filter((tag) => tag.value !== data.value));
  };
  React.useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    // Product-owned restoration after a controlled removal, not library navigation state.
    if (target === 'restore') resetRef.current?.focus();
    else refs.current.get(target)?.focus();
    pendingFocus.current = null;
  }, [visible]);
  return (
    <div
      className={styles.flow}
      data-tag-flow
      data-tag-focusgroup-mode={supportsFocusGroup() ? 'native' : 'consumer-polyfill'}
    >
      <p>
        Dismissal reports the current public value/event payload. This consumer removes the item and
        explicitly focuses its next/previous action, or Restore labels when empty. Restoring mounts
        a fresh group; the shared consumer initializes newly mounted groups.
      </p>
      <div className={styles.pointerRest} data-testid="tag-flow-pointer-rest">
        Pointer rest
      </div>
      <button type="button">Before labels</button>
      {visible.length > 0 ? (
        <TagGroup
          aria-label="Project workflow labels"
          onDismiss={onDismiss}
          className={styles.flowGroup}
        >
          {visible.map((tag) =>
            interaction ? (
              <InteractionTag key={tag.value} value={tag.value} data-tag-value={tag.value}>
                <InteractionTagPrimary
                  type="button"
                  hasSecondaryAction
                  onClick={() => setOpened(tag.value)}
                  ref={(element) => {
                    if (element) refs.current.set(tag.value, element);
                    else refs.current.delete(tag.value);
                  }}
                >
                  {tag.label}
                </InteractionTagPrimary>
                <InteractionTagSecondary
                  aria-label={`Remove ${tag.label}`}
                  aria-labelledby={undefined}
                />
              </InteractionTag>
            ) : (
              <Tag
                as="button"
                dismissible
                key={tag.value}
                value={tag.value}
                data-tag-value={tag.value}
                aria-label={`Remove ${tag.label}`}
                dismissIcon={{ role: 'presentation' }}
                ref={(element) => {
                  if (element) refs.current.set(tag.value, element);
                  else refs.current.delete(tag.value);
                }}
              >
                {tag.label}
              </Tag>
            ),
          )}
        </TagGroup>
      ) : (
        <p>No labels remain</p>
      )}
      <button
        ref={resetRef}
        type="button"
        onClick={() => {
          pendingFocus.current = initialFlowTags[0].value;
          setVisible([...initialFlowTags]);
        }}
      >
        Restore labels
      </button>
      <output
        aria-label="Tag dismissal events"
        data-tag-dismiss-value={record.value}
        data-tag-dismiss-type={record.type}
        data-tag-dismiss-key={record.key}
        data-tag-dismiss-count={record.count}
        data-tag-visible-count={visible.length}
        data-tag-opened={opened}
      >
        {JSON.stringify({ ...record, visible: visible.map((tag) => tag.value), opened })}
      </output>
    </div>
  );
}

export function TagDismissFlow({
  interaction = false,
  cold = false,
}: {
  interaction?: boolean;
  cold?: boolean;
}) {
  return (
    <FocusgroupConsumer>
      <ReadyTagDismissFlow interaction={interaction} cold={cold} />
    </FocusgroupConsumer>
  );
}

function ReadyTagSelectionFlow() {
  const [selected, setSelected] = React.useState<string[]>(['plan']);
  const [disabled, setDisabled] = React.useState(false);
  const [record, setRecord] = React.useState<{
    value: string;
    values: string;
    type: Parameters<NonNullable<TagGroupProps['onTagSelect']>>[1]['type'] | 'none';
    sameEvent: boolean;
    count: number;
  }>({
    value: 'none',
    values: '[]',
    type: 'none',
    sameEvent: false,
    count: 0,
  });
  const onTagSelect: TagGroupProps['onTagSelect'] = (event, data) => {
    setRecord((previous) => ({
      value: data.value,
      values: JSON.stringify(data.selectedValues),
      type: data.type,
      sameEvent: event === data.event,
      count: previous.count + 1,
    }));
    // The pinned callback contains the pre-change values; the consumer controls selection by value.
    setSelected((previous) =>
      previous.includes(data.value)
        ? previous.filter((value) => value !== data.value)
        : [...previous, data.value],
    );
  };
  return (
    <div className={styles.flow}>
      <p>
        Controlled InteractionTag selection uses the current value/event payload unchanged. No child
        onClick is installed: in the pinned primitive an explicit primary onClick takes precedence
        over its group-selection handler. A selected Tag remains visual-only.
      </p>
      <div className={styles.pointerRest} data-testid="tag-flow-pointer-rest">
        Pointer rest
      </div>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle label group disabled
      </button>
      <TagGroup
        aria-label="Selected project stages"
        selectedValues={selected}
        onTagSelect={onTagSelect}
        disabled={disabled}
      >
        {initialFlowTags.map((tag) => (
          <InteractionTag key={tag.value} value={tag.value}>
            <InteractionTagPrimary type="button">{tag.label}</InteractionTagPrimary>
          </InteractionTag>
        ))}
      </TagGroup>
      <Tag selected>Visual-only static label</Tag>
      <output
        aria-label="Tag selection events"
        data-tag-select-value={record.value}
        data-tag-select-values={record.values}
        data-tag-select-type={record.type}
        data-tag-select-same-event={String(record.sameEvent)}
        data-tag-select-count={record.count}
        data-tag-selected={JSON.stringify(selected)}
      >
        {JSON.stringify({ ...record, selected })}
      </output>
    </div>
  );
}

export function TagSelectionFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyTagSelectionFlow />
    </FocusgroupConsumer>
  );
}

function ReadyTagFormFlow() {
  const [record, setRecord] = React.useState({
    entries: '[]',
    submitter: 'none',
    submissions: 0,
    dismissals: 0,
    resets: 0,
  });
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter =
          event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
        const entries = JSON.stringify([...new FormData(event.currentTarget, submitter).entries()]);
        setRecord((previous) => ({
          ...previous,
          entries,
          submitter: submitter instanceof HTMLButtonElement ? submitter.name : '',
          submissions: previous.submissions + 1,
        }));
      }}
      onReset={() => setRecord((previous) => ({ ...previous, resets: previous.resets + 1 }))}
    >
      <p>
        The primary action keeps native button submission when type is omitted. Tag and secondary
        default to type=&quot;button&quot;; the explicit submit Tag below retains its name/value and
        submitter. No wrapper intercepts native submission/reset.
      </p>
      <div className={styles.pointerRest} data-testid="tag-flow-pointer-rest">
        Pointer rest
      </div>
      <label>
        Project
        <input name="project" defaultValue="Atlas" />
      </label>
      <TagGroup
        aria-label="Project form actions"
        onDismiss={() =>
          setRecord((previous) => ({ ...previous, dismissals: previous.dismissals + 1 }))
        }
      >
        <Tag
          as="button"
          type="submit"
          name="label"
          value="review"
          dismissible
          aria-label="Submit review tag"
          dismissIcon={{ role: 'presentation' }}
        >
          Review
        </Tag>
        <Tag
          as="button"
          dismissible
          value="draft"
          aria-label="Remove draft tag"
          dismissIcon={{ role: 'presentation' }}
        >
          Draft
        </Tag>
        <InteractionTag value="publish">
          <InteractionTagPrimary name="action" value="publish" hasSecondaryAction>
            Publish project
          </InteractionTagPrimary>
          <InteractionTagSecondary
            aria-label="Remove publish action"
            aria-labelledby={undefined}
            name="remove"
            value="publish"
          />
        </InteractionTag>
      </TagGroup>
      <button type="reset">Reset project form</button>
      <output
        aria-label="Tag form events"
        data-tag-form-entries={record.entries}
        data-tag-form-submitter={record.submitter}
        data-tag-form-submissions={record.submissions}
        data-tag-form-dismissals={record.dismissals}
        data-tag-form-resets={record.resets}
      >
        {JSON.stringify(record)}
      </output>
    </form>
  );
}

export function TagFormFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyTagFormFlow />
    </FocusgroupConsumer>
  );
}
