// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  ColorSwatch,
  EmptySwatch,
  ImageSwatch,
  SwatchPicker,
  SwatchPickerRow,
  type SwatchPickerProps,
} from '@coreai-ds/react-headless-components';
import * as primitive from '@fluentui/react-headless-components-preview/swatch-picker';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { swatchImage } from './SwatchPickerComparison.js';
import styles from './SwatchPickerComparison.module.css';

export const swatchRedValue = 'paint:red / 01';
export const swatchBlueValue = 'paint:blue / 02';
export const swatchImageValue = 'texture:mountain / 03';

export function SwatchPickerGridBoundaryFlow({
  implementation,
}: {
  implementation: 'raw' | 'headless';
}) {
  const Picker = implementation === 'raw' ? primitive.SwatchPicker : SwatchPicker;
  const Row = implementation === 'raw' ? primitive.SwatchPickerRow : SwatchPickerRow;
  const Color = implementation === 'raw' ? primitive.ColorSwatch : ColorSwatch;
  const [selected, setSelected] = React.useState('A');
  const [changes, setChanges] = React.useState(0);
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <h3>{implementation}: current arrow-grid boundary</h3>
        <Picker
          aria-label={`${implementation} current arrow grid`}
          layout="grid"
          selectedValue={selected}
          className={styles.boundaryPicker}
          onSelectionChange={(_, data) => {
            setSelected(data.selectedValue);
            setChanges((count) => count + 1);
          }}
        >
          {[
            ['A', 'B'],
            ['C', 'D'],
          ].map((values, index) => (
            <Row key={index} className={styles.boundaryRow}>
              {values.map((value) => (
                <Color
                  key={value}
                  color={value === 'A' || value === 'C' ? '#0078d4' : '#107c10'}
                  value={value}
                  aria-label={`${implementation} arrow ${value}`}
                  className={styles.boundarySwatch}
                />
              ))}
            </Row>
          ))}
        </Picker>
        <output
          aria-label={`${implementation} arrow-grid events`}
          data-swatch-change-count={changes}
          data-swatch-selected={selected}
        >
          The current grid/manual tokens do not provide two-dimensional navigation in either tested
          engine. The usable grid above explicitly chooses focusMode=&quot;tab&quot;.
        </output>
      </div>
    </FocusgroupConsumer>
  );
}

export function SwatchPickerSelectionFlow({
  layout = 'row',
  focusMode = 'arrow',
}: {
  layout?: SwatchPickerProps['layout'];
  focusMode?: SwatchPickerProps['focusMode'];
}) {
  const [selected, setSelected] = React.useState(swatchRedValue);
  const [reject, setReject] = React.useState(false);
  const [change, setChange] = React.useState<{
    count: number;
    value?: string;
    swatch?: string;
    type?: 'click';
    eventType?: string;
    sameEvent?: boolean;
    target?: string | null;
  }>({ count: 0 });
  const swatches = [
    <ColorSwatch
      key="red"
      color="#d13438"
      value={swatchRedValue}
      aria-label="Red paint"
      data-flow-value="red"
    />,
    <ColorSwatch
      key="blue"
      color="#0078d4"
      value={swatchBlueValue}
      aria-label="Blue paint"
      data-flow-value="blue"
    />,
    <ColorSwatch
      key="disabled"
      color="#6b6b6b"
      value="unavailable"
      disabled
      aria-label="Unavailable paint"
      data-flow-value="disabled"
    />,
    <ImageSwatch
      key="image"
      src={swatchImage}
      value={swatchImageValue}
      aria-label="Mountain texture"
      data-flow-value="image"
    />,
    <ColorSwatch
      key="green"
      color="#107c10"
      value="paint:green / 04"
      aria-label="Green paint"
      data-flow-value="green"
    />,
    <ImageSwatch
      key="disabled-image"
      src={swatchImage}
      value="unavailable image"
      disabled
      aria-label="Unavailable texture"
      data-flow-value="disabled-image"
    />,
  ];
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div data-testid="swatch-flow-pointer-rest" className={styles.pointerRest}>
          Pointer rest
        </div>
        <label>
          <input
            type="checkbox"
            checked={reject}
            onChange={(event) => setReject(event.target.checked)}
          />{' '}
          Reject selection changes
        </label>
        <button type="button">Before swatches</button>
        <SwatchPicker
          aria-label="Document palette"
          selectedValue={selected}
          layout={layout}
          focusMode={focusMode}
          shape={layout === 'grid' ? 'square' : undefined}
          className={styles.selection}
          onSelectionChange={(event, data) => {
            const currentTarget = event.currentTarget;
            const nextChange = {
              value: data.selectedValue,
              swatch: data.selectedSwatch,
              type: data.type,
              eventType: event.type,
              sameEvent: data.event === event,
              target:
                currentTarget instanceof Element
                  ? currentTarget.getAttribute('data-flow-value')
                  : null,
            };
            setChange((previous) => ({
              count: previous.count + 1,
              ...nextChange,
            }));
            if (!reject) setSelected(data.selectedValue);
          }}
        >
          {layout === 'grid' ? (
            <>
              <SwatchPickerRow>{swatches.slice(0, 3)}</SwatchPickerRow>
              <SwatchPickerRow>{swatches.slice(3)}</SwatchPickerRow>
            </>
          ) : (
            swatches
          )}
        </SwatchPicker>
        <button type="button">After swatches</button>
        <output
          aria-label="Swatch selection events"
          data-swatch-change-count={change.count}
          data-swatch-change-value={change.value}
          data-swatch-change-color={change.swatch}
          data-swatch-change-type={change.type}
          data-swatch-event-type={change.eventType}
          data-swatch-same-event={
            change.sameEvent === undefined ? undefined : String(change.sameEvent)
          }
          data-swatch-event-target={change.target}
          data-swatch-selected={selected}
        >
          Selected: {selected}; changes: {change.count}
        </output>
      </div>
    </FocusgroupConsumer>
  );
}

export function SwatchPickerDynamicFlow() {
  const [added, setAdded] = React.useState(false);
  const [selected, setSelected] = React.useState(swatchRedValue);
  const [actions, setActions] = React.useState(0);
  const [changes, setChanges] = React.useState(0);
  const focusRef = React.useRef<HTMLButtonElement>(null);
  const shouldFocus = React.useRef(false);
  React.useEffect(() => {
    if (shouldFocus.current) focusRef.current?.focus();
  }, [added]);
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <div data-testid="swatch-flow-pointer-rest" className={styles.pointerRest}>
          Pointer rest
        </div>
        <button type="button">Before dynamic swatches</button>
        <SwatchPicker
          key={String(added)}
          aria-label="Editable palette"
          selectedValue={selected}
          onSelectionChange={(_, data) => {
            setSelected(data.selectedValue);
            setChanges((count) => count + 1);
          }}
        >
          <ColorSwatch
            ref={added ? undefined : focusRef}
            color="#d13438"
            value={swatchRedValue}
            aria-label="Saved red"
          />
          {added ? (
            <ColorSwatch
              ref={focusRef}
              color="#9333ea"
              value="custom:purple / 01"
              aria-label="Added purple"
            />
          ) : (
            <EmptySwatch
              aria-label="Add purple"
              onClick={() => {
                shouldFocus.current = true;
                setAdded(true);
                setSelected('custom:purple / 01');
                setActions((count) => count + 1);
              }}
            >
              +
            </EmptySwatch>
          )}
        </SwatchPicker>
        <button
          type="button"
          disabled={!added}
          onClick={() => {
            shouldFocus.current = true;
            setAdded(false);
            setSelected(swatchRedValue);
            setActions((count) => count + 1);
          }}
        >
          Remove custom color
        </button>
        <button type="button">After dynamic swatches</button>
        <output
          aria-label="Editable palette events"
          data-swatch-action-count={actions}
          data-swatch-change-count={changes}
          data-swatch-selected={selected}
          data-swatch-added={String(added)}
        >
          The application adds/removes swatches, supplies selection, and restores focus.
        </output>
      </div>
    </FocusgroupConsumer>
  );
}

export function SwatchPickerFormFlow() {
  const [selected, setSelected] = React.useState(swatchRedValue);
  const [submission, setSubmission] = React.useState('');
  const [submits, setSubmits] = React.useState(0);
  const [resets, setResets] = React.useState(0);
  const headingId = React.useId();
  return (
    <FocusgroupConsumer>
      <form
        className={styles.flow}
        onSubmit={(event) => {
          event.preventDefault();
          const submitter =
            event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
          setSubmission(JSON.stringify([...new FormData(event.currentTarget, submitter)]));
          setSubmits((count) => count + 1);
        }}
        onReset={() => {
          setSelected(swatchRedValue);
          setResets((count) => count + 1);
        }}
      >
        <div data-testid="swatch-flow-pointer-rest" className={styles.pointerRest}>
          Pointer rest
        </div>
        <h3 id={headingId}>Publication palette</h3>
        <input type="hidden" name="paint" value={selected} />
        <SwatchPicker
          aria-labelledby={headingId}
          selectedValue={selected}
          onSelectionChange={(_, data) => setSelected(data.selectedValue)}
        >
          <ColorSwatch color="#d13438" value={swatchRedValue} aria-label="Publication red" />
          <ColorSwatch color="#0078d4" value={swatchBlueValue} aria-label="Publication blue" />
          <EmptySwatch
            type="submit"
            name="action"
            value="reserve-slot"
            aria-label="Reserve color slot"
          >
            +
          </EmptySwatch>
        </SwatchPicker>
        <button type="submit" name="action" value="publish">
          Publish palette
        </button>
        <button type="reset">Reset palette</button>
        <output
          aria-label="Palette form events"
          data-swatch-form-data={submission}
          data-swatch-submit-count={submits}
          data-swatch-reset-count={resets}
          data-swatch-selected={selected}
        >
          {submission || 'No submission'}
        </output>
        <p>The hidden paint field and reset handler belong to this example, not to SwatchPicker.</p>
      </form>
    </FocusgroupConsumer>
  );
}
