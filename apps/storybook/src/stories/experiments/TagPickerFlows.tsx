// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Field,
  Tag,
  TagPicker,
  TagPickerButton,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerOptionGroup,
  useTagPickerFilter,
  type TagPickerInputProps,
  type TagPickerProps,
} from '@coreai-ds/react-headless-components';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import {
  getTagPickerPerson,
  tagPickerPeople,
  TagPickerMedia,
  type TagPickerPerson,
} from './TagPickerComparison.js';
import styles from './TagPickerComparison.module.css';

export interface TagPickerFlowProps {
  single?: boolean;
  button?: boolean;
  grouped?: boolean;
  initialSelected?: string[];
  onOptionSelect?: TagPickerProps['onOptionSelect'];
  onOpenChange?: TagPickerProps['onOpenChange'];
  onChange?: TagPickerInputProps['onChange'];
}

interface TagPickerFlowRecord {
  value: string;
  values: string;
  previous: string;
  type?: Parameters<NonNullable<TagPickerProps['onOptionSelect']>>[1]['type'];
  sameEvent: boolean;
  count: number;
  keys: string;
  open: boolean;
  openCount: number;
  openSameEvent: boolean;
  queryCount: number;
  dismissCount: number;
}

function FlowOption({ value }: { value: string }) {
  const person = getTagPickerPerson(value);
  return (
    <TagPickerOption
      value={value}
      text={person.label}
      aria-label={person.label}
      aria-selected={false}
      media={<TagPickerMedia person={person} />}
      secondaryContent={person.detail}
      disabled={value === 'margaret'}
    >
      {person.label}
    </TagPickerOption>
  );
}

function FilteredTeam({
  team,
  query,
  selected,
}: {
  team: TagPickerPerson['team'];
  query: string;
  selected: string[];
}) {
  const available = tagPickerPeople.filter(
    (person) =>
      person.team === team &&
      !selected.includes(person.value) &&
      person.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const children = useTagPickerFilter({
    query,
    options: available.map((person) => person.value),
    filter: () => true,
    noOptionsElement: (
      <TagPickerOption value={`empty-${team}`} aria-selected={false} disabled>
        No matching reviewers
      </TagPickerOption>
    ),
    renderOption: (value) => <FlowOption key={value} value={value} />,
  });
  if (available.length === 0) return null;
  return <TagPickerOptionGroup label={team}>{children}</TagPickerOptionGroup>;
}

function ReadyTagPickerSelectionFlow({
  single = false,
  button = false,
  grouped = false,
  initialSelected = [],
  onOptionSelect,
  onOpenChange,
  onChange,
}: TagPickerFlowProps) {
  const [selected, setSelected] = React.useState<string[]>(initialSelected);
  const [query, setQuery] = React.useState('');
  const [locked, setLocked] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  const [record, setRecord] = React.useState<TagPickerFlowRecord>({
    value: 'none',
    values: '[]',
    previous: '[]',
    sameEvent: false,
    count: 0,
    keys: '',
    open: false,
    openCount: 0,
    openSameEvent: false,
    queryCount: 0,
    dismissCount: 0,
  });
  const groupRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const tagRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    // Controlled removal and restoration are product-owned, not a component focus controller.
    if (target === 'trigger') (button ? buttonRef.current : inputRef.current)?.focus();
    else tagRefs.current.get(target)?.focus();
    pendingFocus.current = null;
  }, [selected, button]);
  const select: TagPickerProps['onOptionSelect'] = (event, data) => {
    onOptionSelect?.(event, data);
    setRecord((previous) => ({
      ...previous,
      value: data.value,
      values: JSON.stringify(data.selectedOptions),
      previous: JSON.stringify(selected),
      type: data.type,
      sameEvent: event === data.event,
      count: previous.count + 1,
      keys: Object.keys(data).sort().join(','),
    }));
    if (locked) return;
    const removing =
      event.target instanceof Node && groupRef.current?.contains(event.target) === true;
    if (removing) {
      const index = selected.indexOf(data.value);
      pendingFocus.current = selected[index + 1] ?? selected[index - 1] ?? 'trigger';
    }
    setSelected(
      single
        ? data.selectedOptions.includes(data.value)
          ? [data.value]
          : []
        : data.selectedOptions,
    );
    setQuery('');
  };
  const children = useTagPickerFilter({
    query,
    options: tagPickerPeople.map((person) => person.value),
    filter: (value) =>
      !selected.includes(value) &&
      getTagPickerPerson(value).label.toLowerCase().includes(query.trim().toLowerCase()),
    noOptionsElement: (
      <TagPickerOption value="no-options" aria-selected={false} disabled>
        No matching reviewers
      </TagPickerOption>
    ),
    renderOption: (value) => <FlowOption key={value} value={value} />,
  });
  const noMatches = !tagPickerPeople.some(
    (person) =>
      !selected.includes(person.value) &&
      person.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div
      className={styles.flow}
      data-tagpicker-flow
      data-tagpicker-focusgroup-mode={supportsFocusGroup() ? 'native' : 'consumer-polyfill'}
    >
      <p>
        Type a name, select a suggestion, then remove a tag. Filtering, single selection, controlled
        acceptance/rejection, clearing and post-dismiss restoration are this consumer&apos;s state.
        TagPicker callbacks retain their original event and arrays. ArrowLeft or Backspace at the
        start of an empty input moves into the tags; Delete or Backspace on a tag dismisses it.
        ArrowRight from the last tag returns to the trigger. The component does not add a second
        keyboard or selection model.
      </p>
      <div className={styles.pointerRest} data-testid="tagpicker-flow-pointer-rest">
        Pointer rest
      </div>
      <div className={styles.flowControls}>
        <button type="button">Before reviewers</button>
        <button
          type="button"
          onClick={() => {
            pendingFocus.current = 'trigger';
            setSelected(['ada', 'grace', 'linus']);
            setQuery('');
          }}
        >
          Restore sample reviewers
        </button>
        <button type="button" onClick={() => setLocked((value) => !value)}>
          {locked ? 'Accept selection changes' : 'Reject selection changes'}
        </button>
        <button type="button" onClick={() => setDisabled((value) => !value)}>
          {disabled ? 'Enable reviewers' : 'Disable reviewers'}
        </button>
      </div>
      <Field
        label={button ? 'Choose reviewers' : 'Find reviewers'}
        hint="Margaret is unavailable. The input and selected tags have separate keyboard roles."
        className={styles.flowField}
      >
        <TagPicker
          selectedOptions={selected}
          disabled={disabled}
          disableAutoFocus={query.length === 0}
          onOptionSelect={select}
          onOpenChange={(event, data) => {
            onOpenChange?.(event, data);
            setRecord((previous) => ({
              ...previous,
              open: data.open,
              openCount: previous.openCount + 1,
              openSameEvent: event === data.event,
            }));
          }}
          positioning={{ position: 'below', align: 'start', offset: 2, matchTargetSize: 'width' }}
        >
          <TagPickerControl
            className={styles.control}
            secondaryAction={
              <button
                type="button"
                className={styles.secondaryButton}
                aria-label="Clear reviewers"
                disabled={disabled}
                onClick={() => {
                  pendingFocus.current = 'trigger';
                  setSelected([]);
                  setQuery('');
                }}
              >
                Clear
              </button>
            }
          >
            <TagPickerGroup
              ref={groupRef}
              aria-label="Selected reviewers"
              onDismiss={() =>
                setRecord((previous) => ({
                  ...previous,
                  dismissCount: previous.dismissCount + 1,
                }))
              }
            >
              {selected.map((value) => {
                const person = getTagPickerPerson(value);
                return (
                  <Tag
                    as="button"
                    key={value}
                    value={value}
                    aria-label={`Remove ${person.label}`}
                    dismissIcon={{ role: 'presentation' }}
                    ref={(element) => {
                      if (element instanceof HTMLButtonElement) tagRefs.current.set(value, element);
                      else tagRefs.current.delete(value);
                    }}
                  >
                    {person.label}
                  </Tag>
                );
              })}
            </TagPickerGroup>
            {button ? (
              <TagPickerButton ref={buttonRef} disabled={disabled} aria-label="Choose reviewers">
                Choose reviewers
              </TagPickerButton>
            ) : (
              <TagPickerInput
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  onChange?.(event);
                  setQuery(event.target.value);
                  setRecord((previous) => ({
                    ...previous,
                    queryCount: previous.queryCount + 1,
                  }));
                }}
              />
            )}
          </TagPickerControl>
          <TagPickerList aria-label="Suggested reviewers">
            {grouped ? (
              noMatches ? (
                <TagPickerOption value="no-options" aria-selected={false} disabled>
                  No matching reviewers
                </TagPickerOption>
              ) : (
                <>
                  <FilteredTeam team="Research" query={query} selected={selected} />
                  <FilteredTeam team="Engineering" query={query} selected={selected} />
                </>
              )
            ) : (
              children
            )}
          </TagPickerList>
        </TagPicker>
      </Field>
      <button type="button">After reviewers</button>
      <output
        aria-label="Reviewer selection"
        data-tagpicker-selected={JSON.stringify(selected)}
        data-tagpicker-query={query}
        data-tagpicker-event-value={record.value}
        data-tagpicker-event-values={record.values}
        data-tagpicker-event-previous={record.previous}
        data-tagpicker-event-type={record.type}
        data-tagpicker-event-same={String(record.sameEvent)}
        data-tagpicker-event-count={record.count}
        data-tagpicker-event-keys={record.keys}
        data-tagpicker-open-count={record.openCount}
        data-tagpicker-open-same={String(record.openSameEvent)}
        data-tagpicker-query-count={record.queryCount}
        data-tagpicker-dismiss-count={record.dismissCount}
      >
        {JSON.stringify({ selected, query, locked, disabled, ...record })}
      </output>
      <p>
        Native focusgroup remembers the last tag after ArrowRight returns to the input. The real
        1.6.0 polyfill wraps to the first tag before React handles that boundary, so backward Tab
        re-enters the first tag instead. Both paths remain keyboard navigable; no component shim
        changes this current primitive/polyfill ordering.
      </p>
    </div>
  );
}

export function TagPickerSelectionFlow(props: TagPickerFlowProps) {
  return (
    <FocusgroupConsumer>
      <ReadyTagPickerSelectionFlow {...props} />
    </FocusgroupConsumer>
  );
}

function ReadyTagPickerNativeFormFlow() {
  const [selected, setSelected] = React.useState(['ada']);
  const [query, setQuery] = React.useState('Approval');
  const [entries, setEntries] = React.useState<[string, string][]>([]);
  const [submissions, setSubmissions] = React.useState(0);
  const [resets, setResets] = React.useState(0);
  return (
    <form
      aria-label="Reviewer approval form"
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        setEntries(
          [...new FormData(event.currentTarget).entries()].map(([key, value]) => [
            key,
            String(value),
          ]),
        );
        setSubmissions((count) => count + 1);
      }}
      onReset={() => setResets((count) => count + 1)}
    >
      <p>
        Field labels, required, invalid and description state apply to the native query input.
        Selected tags are not automatically form entries and do not satisfy input required. The
        named hidden reviewer values below are consumer-owned. Native reset does not reset
        controlled query/selection state; Reset reviewer state does so explicitly.
      </p>
      <Field
        label="Approval note"
        required
        validationState="error"
        validationMessage="Enter an approval note"
        hint="This name belongs to the query input, not to the selected tags"
        className={styles.flowField}
      >
        <TagPicker
          noPopover
          selectedOptions={selected}
          onOptionSelect={(_event, data) => setSelected(data.selectedOptions)}
        >
          <TagPickerControl className={styles.control}>
            <TagPickerGroup aria-label="Approval reviewers">
              {selected.map((value) => (
                <Tag
                  as="button"
                  key={value}
                  value={value}
                  aria-label={`Remove ${getTagPickerPerson(value).label}`}
                  dismissIcon={{ role: 'presentation' }}
                >
                  {getTagPickerPerson(value).label}
                </Tag>
              ))}
            </TagPickerGroup>
            <TagPickerInput
              name="approvalNote"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </TagPickerControl>
        </TagPicker>
      </Field>
      {selected.map((value) => (
        <input key={value} type="hidden" name="reviewer" value={value} />
      ))}
      <div className={styles.flowControls}>
        <button type="submit">Submit reviewer form</button>
        <button type="reset">Native reviewer reset</button>
        <button
          type="button"
          onClick={() => {
            setSelected(['ada']);
            setQuery('');
          }}
        >
          Reset reviewer state
        </button>
      </div>
      <output
        aria-label="Reviewer form result"
        data-tagpicker-form-submits={submissions}
        data-tagpicker-form-resets={resets}
        data-tagpicker-form-entries={JSON.stringify(entries)}
      >
        {JSON.stringify({ entries, submissions, resets, selected, query })}
      </output>
    </form>
  );
}

export function TagPickerNativeFormFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyTagPickerNativeFormFlow />
    </FocusgroupConsumer>
  );
}

function ReadyTagPickerCustomValuesFlow() {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  return (
    <div className={styles.flow}>
      <p>No-popover creation is consumer-owned; the root exposes no freeform/value aliases.</p>
      <Field label="Add review label" className={styles.flowField}>
        <TagPicker
          noPopover
          selectedOptions={selected}
          onOptionSelect={(_event, data) => setSelected(data.selectedOptions)}
        >
          <TagPickerControl className={styles.control}>
            <TagPickerGroup aria-label="Custom review labels">
              {selected.map((value) => (
                <Tag
                  as="button"
                  key={value}
                  value={value}
                  aria-label={`Remove ${value}`}
                  dismissIcon={{ role: 'presentation' }}
                >
                  {value}
                </Tag>
              ))}
            </TagPickerGroup>
            <TagPickerInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || !query.trim()) return;
                event.preventDefault();
                setSelected((previous) =>
                  previous.includes(query.trim()) ? previous : [...previous, query.trim()],
                );
                setQuery('');
              }}
            />
          </TagPickerControl>
        </TagPicker>
      </Field>
      <output aria-label="Custom review labels result">{JSON.stringify(selected)}</output>
    </div>
  );
}

export function TagPickerCustomValuesFlow() {
  return (
    <FocusgroupConsumer>
      <ReadyTagPickerCustomValuesFlow />
    </FocusgroupConsumer>
  );
}
