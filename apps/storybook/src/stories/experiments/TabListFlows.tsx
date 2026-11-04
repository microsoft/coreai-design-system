// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Tab,
  TabList,
  useTabListContext,
  type SelectTabData,
  type SelectTabEvent,
  type TabListProps,
  type TabValue,
} from '@coreai-ds/react-headless-components';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { TabFixtureGlyph } from './TabListComparison.js';
import styles from './TabListComparison.module.css';

export function TabListContextProbe() {
  const selected = useTabListContext((context) => context.selectedValue);
  const appearance = useTabListContext((context) => context.appearance);
  const size = useTabListContext((context) => context.size);
  const reserved = useTabListContext((context) => context.reserveSelectedTabSpace);
  const automatic = useTabListContext((context) => context.selectTabOnFocus);
  return (
    <output
      aria-label="Public TabList context"
      data-context-selected={JSON.stringify(selected)}
      data-context-appearance={appearance}
      data-context-size={size}
      data-context-reserved={String(reserved)}
      data-context-automatic={String(automatic)}
    />
  );
}

const views = [
  {
    value: 'overview',
    label: 'Overview',
    title: 'Project overview',
    body: 'Review the current project summary.',
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    title: 'Unavailable view',
    body: 'This view is not available.',
  },
  {
    value: 'activity',
    label: 'Activity',
    title: 'Recent activity',
    body: 'Three changes are ready to review.',
  },
] as const;

export function TabListContentFlow({
  controlled = true,
  selectTabOnFocus = false,
  vertical = false,
  rejectSelection = false,
  disabled = false,
  appearance = 'elevated',
}: {
  controlled?: boolean;
  selectTabOnFocus?: boolean;
  vertical?: boolean;
  rejectSelection?: boolean;
  disabled?: boolean;
  appearance?: TabListProps['appearance'];
}) {
  const id = React.useId();
  const [selected, setSelected] = React.useState<TabValue>('overview');
  const [events, setEvents] = React.useState({
    count: 0,
    value: '',
    type: '',
    currentTarget: '',
  });
  const active = views.find((view) => view.value === selected) ?? views[0];
  const onSelect = (event: SelectTabEvent, data: SelectTabData) => {
    if (!rejectSelection) setSelected(data.value);
    const currentTarget = event.currentTarget.id;
    setEvents((previous) => ({
      count: previous.count + 1,
      value: String(data.value),
      type: event.type,
      currentTarget,
    }));
  };
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div className={styles.pointerRest} data-testid="tablist-flow-pointer-rest">
          Pointer rest
        </div>
        <button type="button">Before tabs</button>
        <TabList
          aria-label="Project views"
          appearance={appearance}
          className={styles.flowList}
          selectedValue={controlled ? selected : undefined}
          defaultSelectedValue={controlled ? undefined : 'overview'}
          onTabSelect={onSelect}
          selectTabOnFocus={selectTabOnFocus}
          disabled={disabled}
          vertical={vertical}
        >
          {views.map((view) => (
            <Tab
              key={view.value}
              id={`${id}-tab-${view.value}`}
              value={view.value}
              disabled={view.value === 'unavailable'}
              aria-controls={`${id}-panel-${view.value}`}
              icon={<TabFixtureGlyph />}
            >
              {view.label}
            </Tab>
          ))}
          <TabListContextProbe />
        </TabList>
        <section
          key={active.value}
          role="tabpanel"
          id={`${id}-panel-${active.value}`}
          aria-labelledby={`${id}-tab-${active.value}`}
          tabIndex={0}
          className={styles.panel}
        >
          <h3>{active.title}</h3>
          <p>{active.body}</p>
          <button type="button">Continue from {active.label}</button>
        </section>
        <button type="button">After tabs</button>
        {controlled && !rejectSelection && (
          <button type="button" onClick={() => setSelected('activity')}>
            Select activity externally
          </button>
        )}
        <output
          aria-label="Tab selection events"
          data-tablist-selection-count={events.count}
          data-tablist-selection-value={events.value}
          data-tablist-event-type={events.type}
          data-tablist-event-current-target={events.currentTarget}
          data-tablist-panel-value={String(selected)}
        >
          {events.count} selections; showing {String(selected)}
        </output>
      </div>
    </FocusgroupConsumer>
  );
}

export function TabListDynamicFlow() {
  const [open, setOpen] = React.useState(false);
  const [extra, setExtra] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  const [selected, setSelected] = React.useState<TabValue>('summary');
  const [generation, setGeneration] = React.useState(0);
  const firstRef = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div className={styles.pointerRest} data-testid="tablist-dynamic-pointer-rest">
          Pointer rest
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            if (!open) {
              setSelected('summary');
              setDisabled(false);
              setGeneration((value) => value + 1);
            }
          }}
        >
          {open ? 'Close tabs' : 'Open tabs'}
        </button>
        {open && (
          <>
            <button type="button" onClick={() => setExtra(true)} disabled={extra}>
              Add review tab
            </button>
            <button type="button" onClick={() => setDisabled((value) => !value)}>
              {disabled ? 'Enable details' : 'Disable details'}
            </button>
            {extra && (
              <button
                type="button"
                onClick={() => {
                  setSelected('summary');
                  setExtra(false);
                  firstRef.current?.focus();
                }}
              >
                Remove review tab
              </button>
            )}
            <TabList
              aria-label="Dynamic project views"
              appearance="subtle"
              selectedValue={selected}
              onTabSelect={(_, data) => setSelected(data.value)}
              className={styles.flowList}
              data-tablist-generation={generation}
            >
              <Tab
                ref={firstRef}
                value="summary"
                id={`${id}-summary`}
                aria-controls={`${id}-dynamic-panel`}
              >
                Summary
              </Tab>
              <Tab
                value="details"
                id={`${id}-details`}
                aria-controls={`${id}-dynamic-panel`}
                disabled={disabled}
              >
                Details
              </Tab>
              {extra && (
                <Tab value="review" id={`${id}-review`} aria-controls={`${id}-dynamic-panel`}>
                  Review
                </Tab>
              )}
            </TabList>
            <section
              role="tabpanel"
              id={`${id}-dynamic-panel`}
              aria-labelledby={`${id}-${String(selected)}`}
              className={styles.panel}
              tabIndex={0}
            >
              Dynamic {String(selected)} content
            </section>
          </>
        )}
        <button type="button">After dynamic tabs</button>
        <output
          aria-label="Dynamic tab state"
          data-tablist-dynamic-open={String(open)}
          data-tablist-dynamic-count={open ? (extra ? 3 : 2) : 0}
          data-tablist-dynamic-selected={String(selected)}
          data-tablist-dynamic-generation={generation}
        />
      </div>
    </FocusgroupConsumer>
  );
}

export function TabListFormFlow() {
  const [selected, setSelected] = React.useState<TabValue>('overview');
  const [events, setEvents] = React.useState({ selections: 0, submits: 0, title: '', tab: '' });
  const [linkVisits, setLinkVisits] = React.useState(0);
  return (
    <FocusgroupConsumer>
      <form
        aria-label="Tab form"
        className={styles.flow}
        onSubmit={(event) => {
          event.preventDefault();
          const native = event.nativeEvent;
          if (!(native instanceof SubmitEvent)) throw new Error('Expected native submit event');
          const data = new FormData(event.currentTarget, native.submitter);
          setEvents((previous) => ({
            ...previous,
            submits: previous.submits + 1,
            title: String(data.get('title')),
            tab: String(data.get('tabAction')),
          }));
        }}
      >
        <label>
          Project title <input name="title" defaultValue="Draft" />
        </label>
        <TabList
          aria-label="Form views"
          selectedValue={selected}
          onTabSelect={(_, data) => {
            setSelected(data.value);
            setEvents((previous) => ({ ...previous, selections: previous.selections + 1 }));
          }}
        >
          <Tab value="overview">Inspect only</Tab>
          <Tab value="submit" name="tabAction" type="submit">
            Submit current view
          </Tab>
          <Tab value="reset" type="reset">
            Reset form fields
          </Tab>
          <Tab value="disabled" type="submit" disabled>
            Disabled submit view
          </Tab>
        </TabList>
        <div role="tabpanel" aria-label="Current form view" className={styles.panel}>
          Showing {String(selected)}.
          <a
            href="#tablist-authored-resource"
            onClick={(event) => {
              event.preventDefault();
              setLinkVisits((value) => value + 1);
            }}
          >
            Author-owned panel resource
          </a>
        </div>
        <output
          aria-label="Tab form results"
          data-tablist-form-selected={String(selected)}
          data-tablist-form-selections={events.selections}
          data-tablist-form-submits={events.submits}
          data-tablist-form-title={events.title}
          data-tablist-form-submitter={events.tab}
          data-tablist-form-links={linkVisits}
        />
      </form>
    </FocusgroupConsumer>
  );
}
