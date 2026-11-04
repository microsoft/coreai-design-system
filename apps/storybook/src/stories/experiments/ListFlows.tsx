// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import * as primitive from '@fluentui/react-headless-components-preview/list';
import {
  List,
  ListItem,
  type ListItemValue,
  type ListProps,
} from '@coreai-ds/react-headless-components';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import styles from './ListComparison.module.css';

export const listDesignValue = 'design::01';
export const listReviewValue = 23;
export const listArchiveValue = 'archive::03';
export const listLockedValue = 'locked::04';

type SelectionRecord = {
  count: number;
  selectedItems: ListItemValue[];
  eventType: string;
  dataType: string;
  sameEvent: boolean;
  target: string;
  currentTarget: string;
};

const initialSelectionRecord: SelectionRecord = {
  count: 0,
  selectedItems: [],
  eventType: '',
  dataType: '',
  sameEvent: false,
  target: '',
  currentTarget: '',
};

function describeEventTarget(target: EventTarget | null): string {
  if (!(target instanceof HTMLElement)) return '';
  return (
    target.getAttribute('data-list-row') ??
    target.getAttribute('aria-label') ??
    target.tagName.toLowerCase()
  );
}

export function ListSelectionFlow({
  selectionMode = 'multiselect',
}: {
  selectionMode?: ListProps['selectionMode'];
}) {
  const [selectedItems, setSelectedItems] = React.useState<ListItemValue[]>([listDesignValue]);
  const [reject, setReject] = React.useState(false);
  const [selection, setSelection] = React.useState(initialSelectionRecord);
  const [action, setAction] = React.useState({
    count: 0,
    value: '',
    eventType: '',
    dataType: '',
    sameEvent: false,
    originalType: '',
    originalTarget: '',
    originalCurrentTarget: '',
  });
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div data-testid="list-flow-pointer-rest">Pointer rest</div>
        <button type="button">Before project selection</button>
        <label>
          <input
            type="checkbox"
            checked={reject}
            onChange={(event) => setReject(event.currentTarget.checked)}
          />
          Reject selection requests
        </label>
        <List
          aria-label="Project selection"
          className={styles.flowList}
          navigationMode="items"
          selectionMode={selectionMode}
          selectedItems={selectedItems}
          onSelectionChange={(event, data) => {
            const captured = {
              selectedItems: data.selectedItems,
              eventType: event.type,
              dataType: data.type ?? '',
              sameEvent: data.event === event,
              target: describeEventTarget(event.target),
              currentTarget: describeEventTarget(event.currentTarget),
            };
            setSelection((previous) => ({ ...captured, count: previous.count + 1 }));
            if (!reject) setSelectedItems(data.selectedItems);
          }}
        >
          <ListItem
            value={listDesignValue}
            aria-label="Design review"
            data-list-row={listDesignValue}
            className={styles.flowItem}
            checkmark={null}
          >
            Design review
          </ListItem>
          <ListItem
            value={listReviewValue}
            aria-label="Accessibility audit"
            data-list-row={String(listReviewValue)}
            className={styles.flowItem}
            checkmark={null}
          >
            Accessibility audit
          </ListItem>
          <ListItem
            value={listArchiveValue}
            aria-label="Open archive"
            data-list-row={listArchiveValue}
            className={styles.flowItem}
            checkmark={null}
            onAction={(event, data) => {
              if (data.type !== 'ListItemAction') {
                throw new Error(
                  'The archive fixture requires the current typed ListItemAction payload',
                );
              }
              const original = data.event.detail.originalEvent;
              const captured = {
                value: String(data.value),
                eventType: event.type,
                dataType: data.type ?? '',
                sameEvent: data.event === event,
                originalType: original.type,
                originalTarget: describeEventTarget(original.target),
                originalCurrentTarget: describeEventTarget(original.currentTarget),
              };
              event.preventDefault();
              setAction((previous) => ({ ...captured, count: previous.count + 1 }));
            }}
          >
            Open archive
          </ListItem>
          <ListItem
            value={listLockedValue}
            aria-label="Locked project"
            data-list-row={listLockedValue}
            className={styles.flowItem}
            checkmark={null}
            disabledSelection
          >
            Locked project
          </ListItem>
        </List>
        <button type="button">After project selection</button>
        <output
          aria-label="List selection events"
          data-list-change-count={selection.count}
          data-list-change-values={JSON.stringify(selection.selectedItems)}
          data-list-selected-values={JSON.stringify(selectedItems)}
          data-list-event-type={selection.eventType}
          data-list-data-type={selection.dataType}
          data-list-same-event={String(selection.sameEvent)}
          data-list-event-target={selection.target}
          data-list-event-current-target={selection.currentTarget}
        >
          Selected: {selectedItems.join(', ') || 'none'}
        </output>
        <output
          aria-label="List primary actions"
          data-list-action-count={action.count}
          data-list-action-value={action.value}
          data-list-action-event-type={action.eventType}
          data-list-action-data-type={action.dataType}
          data-list-action-same-event={String(action.sameEvent)}
          data-list-action-original-type={action.originalType}
          data-list-action-original-target={action.originalTarget}
          data-list-action-original-current-target={action.originalCurrentTarget}
        >
          Archive actions: {action.count}
        </output>
      </div>
    </FocusgroupConsumer>
  );
}

const initialProjects = [
  { value: listDesignValue, label: 'Design review', field: 'design', note: 'Design draft' },
  { value: listReviewValue, label: 'Accessibility audit', field: 'review', note: 'Audit draft' },
  { value: listArchiveValue, label: 'Release notes', field: 'release', note: 'Release draft' },
] as const;
type Project = { value: ListItemValue; label: string; field: string; note: string };

export function ListCompositeFlow({
  includeCheckmarksInNavigation = false,
}: {
  includeCheckmarksInNavigation?: boolean;
}) {
  const [projects, setProjects] = React.useState<Project[]>([...initialProjects]);
  const [selectedItems, setSelectedItems] = React.useState<ListItemValue[]>([listDesignValue]);
  const [inspected, setInspected] = React.useState('');
  const [linkEvents, setLinkEvents] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('');
  const rowRefs = React.useRef(new Map<ListItemValue, HTMLLIElement | HTMLDivElement>());
  const pendingFocus = React.useRef<ListItemValue | undefined>(undefined);
  const addRef = React.useRef<HTMLButtonElement>(null);

  React.useLayoutEffect(() => {
    const value = pendingFocus.current;
    if (value === undefined) return;
    pendingFocus.current = undefined;
    (rowRefs.current.get(value) ?? addRef.current)?.focus();
  }, [projects]);

  const removeProject = (value: ListItemValue) => {
    const index = projects.findIndex((project) => project.value === value);
    const next = projects.filter((project) => project.value !== value);
    pendingFocus.current = next[Math.min(index, next.length - 1)]?.value ?? value;
    setProjects(next);
    setSelectedItems((previous) => previous.filter((item) => item !== value));
  };
  return (
    <FocusgroupConsumer>
      <form
        className={styles.flow}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const nativeEvent = event.nativeEvent;
          const submitter = nativeEvent instanceof SubmitEvent ? nativeEvent.submitter : null;
          const data = new FormData(
            form,
            submitter instanceof HTMLButtonElement ? submitter : undefined,
          );
          setSubmitted(JSON.stringify([...data.entries()]));
        }}
        onReset={() => {
          setSelectedItems([listDesignValue]);
          setSubmitted('');
        }}
      >
        <div data-testid="list-flow-pointer-rest">Pointer rest</div>
        <button type="button">Before project grid</button>
        <List
          aria-label="Editable projects"
          navigationMode="composite"
          selectionMode="multiselect"
          selectedItems={selectedItems}
          className={styles.flowList}
          onSelectionChange={(_, data) => setSelectedItems(data.selectedItems)}
          data-list-flow="composite"
        >
          {projects.map((project) => (
            <ListItem
              key={project.value}
              value={project.value}
              aria-label={project.label}
              data-list-row={String(project.value)}
              className={styles.flowItem}
              ref={(element) => {
                if (element) rowRefs.current.set(project.value, element);
                else rowRefs.current.delete(project.value);
              }}
              checkmark={{
                'aria-label': `Select ${project.label}`,
                name: 'projects',
                value: String(project.value),
                ...(includeCheckmarksInNavigation ? { tabIndex: 0 } : {}),
              }}
            >
              <span role="gridcell" data-list-slot="content" className={styles.content}>
                {project.label}
              </span>
              <span role="gridcell">
                <input
                  aria-label={`Note for ${project.label}`}
                  name={`note-${project.field}`}
                  defaultValue={project.note}
                  onClick={(event) => event.stopPropagation()}
                />
              </span>
              <span role="gridcell" className={styles.flowControls}>
                <button
                  type="button"
                  aria-label={`Inspect ${project.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setInspected(project.label);
                  }}
                >
                  Inspect
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${project.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeProject(project.value);
                  }}
                >
                  Remove
                </button>
              </span>
              <span role="gridcell">
                <a
                  href="#list-project-preview"
                  aria-label={`Open ${project.label} details`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setLinkEvents((count) => count + 1);
                  }}
                >
                  Details
                </a>
              </span>
            </ListItem>
          ))}
        </List>
        <div className={styles.flowControls}>
          <button type="button">After project grid</button>
          <button
            ref={addRef}
            type="button"
            onClick={() => {
              if (projects.some((project) => project.value === 'new-project')) return;
              setProjects((previous) => [
                ...previous,
                {
                  value: 'new-project',
                  label: 'Release gate',
                  field: 'gate',
                  note: 'Gate draft',
                },
              ]);
            }}
          >
            Add project
          </button>
          <button type="submit" name="action" value="save-projects">
            Submit projects
          </button>
          <button type="reset">Reset projects</button>
        </div>
        <output aria-label="Inspected project">{inspected || 'none'}</output>
        <output aria-label="List project links" data-list-link-count={linkEvents}>
          Link activations: {linkEvents}
        </output>
        <output
          aria-label="Composite list state"
          data-list-project-count={projects.length}
          data-list-selected-values={JSON.stringify(selectedItems)}
        >
          {projects.length} projects
        </output>
        <output aria-label="Submitted projects">{submitted || 'Not submitted'}</output>
        <div id="list-project-preview">Project preview</div>
      </form>
    </FocusgroupConsumer>
  );
}

function ListBoundaryProbe({ raw }: { raw: boolean }) {
  const Collection = raw ? primitive.List : List;
  const Item = raw ? primitive.ListItem : ListItem;
  const name = raw ? 'Raw current' : 'Styled current';
  const [selectedItems, setSelectedItems] = React.useState<ListItemValue[]>([]);
  const [requests, setRequests] = React.useState(0);
  const [actions, setActions] = React.useState(0);
  return (
    <section aria-label={`${name} boundaries`}>
      <h3>{name}</h3>
      <Collection
        aria-label={`${name} boundary grid`}
        navigationMode="composite"
        selectionMode="multiselect"
        selectedItems={selectedItems}
        onSelectionChange={(_, data) => {
          setRequests((count) => count + 1);
          setSelectedItems(data.selectedItems);
        }}
      >
        <Item value="bubbled" aria-label={`${name} bubbling row`} checkmark={null}>
          <span role="gridcell">
            <button type="button">{name} bubbling action</button>
          </span>
        </Item>
        <Item value="stopped" aria-label={`${name} safe row`} checkmark={null}>
          <span role="gridcell">
            <button type="button" onClick={(event) => event.stopPropagation()}>
              {name} safe action
            </button>
          </span>
        </Item>
        <Item
          value="disabled-selection-action"
          aria-label={`${name} action-only row`}
          disabledSelection
          onAction={(event) => {
            event.preventDefault();
            setActions((count) => count + 1);
          }}
          checkmark={{ 'aria-label': `${name} disabled selection` }}
        >
          <span role="gridcell">Selection disabled; primary action remains available</span>
        </Item>
      </Collection>
      <output
        aria-label={`${name} boundary events`}
        data-list-boundary-requests={requests}
        data-list-boundary-actions={actions}
        data-list-boundary-selected={JSON.stringify(selectedItems)}
      >
        {requests} selection requests, {actions} actions
      </output>
    </section>
  );
}

export function ListBoundariesFlow() {
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div data-testid="list-flow-pointer-rest">Pointer rest</div>
        <p>
          Raw-current and styled components intentionally share these boundaries: bubbled nested
          clicks request selection, so independent nested actions stop propagation. Disabling
          selection does not disable a supplied primary action. No wrapper intercepts either path.
        </p>
        <ListBoundaryProbe raw />
        <ListBoundaryProbe raw={false} />
      </div>
    </FocusgroupConsumer>
  );
}
