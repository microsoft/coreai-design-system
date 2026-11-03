// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Field as LegacyField,
  Tag as LegacyTag,
  TagPicker as LegacyTagPicker,
  TagPickerButton as LegacyTagPickerButton,
  TagPickerControl as LegacyTagPickerControl,
  TagPickerGroup as LegacyTagPickerGroup,
  TagPickerInput as LegacyTagPickerInput,
  TagPickerList as LegacyTagPickerList,
  TagPickerOption as LegacyTagPickerOption,
  TagPickerOptionGroup as LegacyTagPickerOptionGroup,
  type PositioningImperativeRef,
} from '@coreai-ds/react-components';
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
  type FieldProps,
  type TagPickerButtonProps,
  type TagPickerInputProps,
  type TagPickerOptionSlots,
  type TagPickerProps,
  type TagSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import styles from './TagPickerComparison.module.css';

export type TagPickerImplementation = 'legacy' | 'headless';
export const tagPickerAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;
export const tagPickerSizes = ['medium', 'large', 'extra-large'] as const;

export interface TagPickerPerson {
  value: string;
  label: string;
  team: 'Research' | 'Engineering';
  initials: string;
  detail: string;
}

export const tagPickerPeople: readonly TagPickerPerson[] = [
  {
    value: 'ada',
    label: 'Ada Lovelace',
    team: 'Research',
    initials: 'AL',
    detail: 'Project reviewer',
  },
  {
    value: 'grace',
    label: 'Grace Hopper',
    team: 'Research',
    initials: 'GH',
    detail: 'Platform engineer',
  },
  {
    value: 'linus',
    label: 'Linus Torvalds',
    team: 'Engineering',
    initials: 'LT',
    detail: 'Repository owner',
  },
  {
    value: 'margaret',
    label: 'Margaret Hamilton',
    team: 'Engineering',
    initials: 'MH',
    detail: 'Currently unavailable',
  },
];

export function getTagPickerPerson(value: string): TagPickerPerson {
  const person = tagPickerPeople.find((candidate) => candidate.value === value);
  if (!person) throw new Error(`Unknown TagPicker fixture value: ${value}`);
  return person;
}

export interface TagPickerExample {
  name: string;
  props?: Pick<TagPickerProps, 'appearance' | 'size' | 'disabled' | 'open' | 'noPopover'>;
  selected?: readonly string[];
  input?: Pick<TagPickerInputProps, 'appearance' | 'clearable' | 'readOnly' | 'disabled'>;
  buttonProps?: Pick<TagPickerButtonProps, 'appearance' | 'size' | 'disabled'>;
  button?: boolean;
  media?: boolean;
  secondary?: boolean;
  secondaryAction?: boolean;
  expand?: 'custom' | 'none' | 'empty';
  grouped?: boolean;
  empty?: boolean;
  explicitTagVisuals?: boolean;
  renderedSlots?: boolean;
  consumer?: boolean;
  query?: string;
  field?: Pick<FieldProps, 'required' | 'size' | 'validationState' | 'validationMessage' | 'hint'>;
}

export const tagPickerExamples: readonly TagPickerExample[] = [
  { name: 'CoreAI default', selected: ['ada'] },
  {
    name: 'Explicit undefined visual props',
    props: { appearance: undefined, size: undefined },
    selected: ['ada'],
  },
  ...tagPickerAppearances.flatMap((appearance) =>
    tagPickerSizes.map((size): TagPickerExample => ({
      name: `${appearance}, ${size}`,
      props: { appearance, size },
      selected: ['ada'],
    })),
  ),
  ...tagPickerAppearances.map((appearance): TagPickerExample => ({
    name: `Disabled ${appearance}`,
    props: { appearance, disabled: true },
    selected: ['ada'],
  })),
  { name: 'Empty control', selected: [] },
  {
    name: 'Wrapped selected tags',
    props: { size: 'large' },
    selected: ['ada', 'grace', 'linus'],
    media: true,
  },
  {
    name: 'Explicit child visual overrides',
    props: { size: 'extra-large', appearance: 'filled-darker' },
    selected: ['ada', 'grace'],
    explicitTagVisuals: true,
  },
  { name: 'No popover', props: { noPopover: true }, selected: ['ada'] },
  {
    name: 'Read only query',
    selected: ['ada'],
    input: { readOnly: true },
    query: 'Review queue',
  },
  {
    name: 'Clearable does not invent a clear slot',
    selected: ['ada'],
    input: { clearable: true },
  },
  {
    name: 'Input appearance remains parent-owned',
    props: { appearance: 'filled-darker' },
    selected: ['ada'],
    input: { appearance: 'underline' },
  },
  { name: 'Caller expand glyph', selected: ['ada'], expand: 'custom' },
  { name: 'Null expand icon', selected: ['ada'], expand: 'none' },
  { name: 'Empty expand content', selected: ['ada'], expand: 'empty' },
  { name: 'Secondary action', selected: ['ada'], secondaryAction: true },
  {
    name: 'Required invalid Field',
    props: { appearance: 'outline' },
    field: {
      required: true,
      size: 'large',
      validationState: 'error',
      validationMessage: 'Choose a reviewer',
      hint: 'Use the suggestions or type a query',
    },
  },
  {
    name: 'Field does not change picker size',
    props: { size: undefined },
    field: { size: 'large' },
    selected: ['ada'],
  },
  ...tagPickerSizes.map((size): TagPickerExample => ({
    name: `Button trigger, ${size}`,
    props: { size },
    selected: [],
    button: true,
  })),
  { name: 'Visually hidden selected button', button: true, selected: ['ada'] },
  {
    name: 'Parent wins unused child visual props',
    props: { size: 'extra-large', appearance: 'filled-darker' },
    button: true,
    buttonProps: { appearance: 'underline', size: 'small' },
    selected: [],
  },
  {
    name: 'Open grouped options',
    props: { open: true },
    selected: ['ada'],
    grouped: true,
  },
  ...tagPickerSizes.map((size): TagPickerExample => ({
    name: `Open media and secondary content, ${size}`,
    props: { open: true, size },
    selected: ['ada'],
    media: true,
    secondary: true,
  })),
  {
    name: 'Public slot render functions',
    props: { open: true },
    selected: ['ada'],
    media: true,
    secondary: true,
    renderedSlots: true,
  },
  { name: 'Open empty results', props: { open: true }, selected: [], empty: true },
];

export const tagPickerConsumerExample: TagPickerExample = {
  name: 'Consumer CSS priority',
  props: { open: true },
  selected: ['ada'],
  consumer: true,
};

export const tagPickerSecondaryRenderer: SlotRenderFunction<
  ExtractSlotProps<TagPickerOptionSlots['secondaryContent']>
> = (Component, props) => <Component {...props} data-tagpicker-rendered-secondary />;

export const tagPickerMediaRenderer: SlotRenderFunction<
  ExtractSlotProps<TagPickerOptionSlots['media']>
> = (Component, props) => <Component {...props} data-tagpicker-rendered-media />;

type TagPickerPrimaryTextFixtureProps = ExtractSlotProps<TagSlots['primaryText']> & {
  'data-tag-part': 'primaryText';
};

const tagPickerPrimaryTextFixture: TagPickerPrimaryTextFixtureProps = {
  'data-tag-part': 'primaryText',
};

export function TagPickerMedia({ person }: { person: TagPickerPerson }) {
  return (
    <span aria-hidden className={styles.coin}>
      {person.initials}
    </span>
  );
}

function FixtureOptions({
  implementation,
  example,
}: {
  implementation: TagPickerImplementation;
  example: TagPickerExample;
}) {
  const Item = implementation === 'legacy' ? LegacyTagPickerOption : TagPickerOption;
  const Group = implementation === 'legacy' ? LegacyTagPickerOptionGroup : TagPickerOptionGroup;
  const option = (person: TagPickerPerson) => {
    const renderMedia: SlotRenderFunction<ExtractSlotProps<TagPickerOptionSlots['media']>> = (
      Component,
      props,
    ) =>
      tagPickerMediaRenderer(Component, {
        ...props,
        children: <TagPickerMedia person={person} />,
      });
    const renderSecondary: SlotRenderFunction<
      ExtractSlotProps<TagPickerOptionSlots['secondaryContent']>
    > = (Component, props) =>
      tagPickerSecondaryRenderer(Component, { ...props, children: person.detail });
    return (
      <Item
        key={person.value}
        value={person.value}
        text={person.label}
        aria-label={person.label}
        aria-selected={example.selected?.includes(person.value) ?? false}
        data-tagpicker-option-value={person.value}
        className={example.consumer ? styles.consumerOption : undefined}
        media={
          example.media
            ? {
                ...{ 'data-tagpicker-part': 'option-media' },
                children: example.renderedSlots ? renderMedia : <TagPickerMedia person={person} />,
              }
            : undefined
        }
        secondaryContent={
          example.secondary
            ? {
                ...{ 'data-tagpicker-part': 'secondary-content' },
                children: example.renderedSlots ? renderSecondary : person.detail,
              }
            : undefined
        }
      >
        {person.label}
      </Item>
    );
  };
  if (example.empty) {
    return (
      <Item value="no-options" aria-label="No matching reviewers">
        No matching reviewers
      </Item>
    );
  }
  if (!example.grouped) return <>{tagPickerPeople.map(option)}</>;
  return (
    <>
      {(['Research', 'Engineering'] as const).map((team) => (
        <Group key={team} label={team}>
          {tagPickerPeople.filter((person) => person.team === team).map(option)}
        </Group>
      ))}
    </>
  );
}

function FixtureCell({
  implementation,
  example,
  identity,
  positioningRef,
}: {
  implementation: TagPickerImplementation;
  example: TagPickerExample;
  identity: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const isLegacy = implementation === 'legacy';
  const Picker = isLegacy ? LegacyTagPicker : TagPicker;
  const Control = isLegacy ? LegacyTagPickerControl : TagPickerControl;
  const Group = isLegacy ? LegacyTagPickerGroup : TagPickerGroup;
  const Input = isLegacy ? LegacyTagPickerInput : TagPickerInput;
  const Button = isLegacy ? LegacyTagPickerButton : TagPickerButton;
  const List = isLegacy ? LegacyTagPickerList : TagPickerList;
  const SelectedTag = isLegacy ? LegacyTag : Tag;
  const ControlField = isLegacy ? LegacyField : Field;
  // Report updates must not re-trigger the primitive's selection-dependent input measurement.
  const selected = React.useMemo(() => [...(example.selected ?? [])], [example.selected]);
  const picker = (
    <Picker
      {...example.props}
      selectedOptions={selected}
      positioning={{
        position: 'below',
        align: 'start',
        offset: 0,
        matchTargetSize: 'width',
        pinned: true,
        positioningRef,
      }}
    >
      <Control
        data-tagpicker-control
        className={[styles.control, example.consumer && styles.consumerRoot]
          .filter(Boolean)
          .join(' ')}
        expandIcon={
          example.expand === 'none'
            ? null
            : example.expand === 'empty'
              ? { children: '' }
              : example.expand === 'custom'
                ? {
                    children: (
                      <ChevronDownRegular
                        aria-hidden
                        className={styles.customGlyph}
                        data-tagpicker-custom-glyph
                      />
                    ),
                  }
                : undefined
        }
        secondaryAction={
          example.secondaryAction ? (
            <button type="button" className={styles.secondaryButton} aria-label="Clear reviewers">
              Clear
            </button>
          ) : undefined
        }
      >
        <Group aria-label="Selected reviewers">
          {selected.map((value, index) => {
            const person = getTagPickerPerson(value);
            return (
              <SelectedTag
                key={value}
                value={value}
                as="button"
                data-tagpicker-part="tag"
                aria-label={`Remove ${person.label}`}
                primaryText={tagPickerPrimaryTextFixture}
                media={
                  example.media
                    ? {
                        ...{ 'data-tag-part': 'media' },
                        children: <TagPickerMedia person={person} />,
                      }
                    : undefined
                }
                dismissIcon={{
                  ...{ 'data-tag-part': 'dismissIcon' },
                  role: 'presentation',
                }}
                {...(example.explicitTagVisuals &&
                  index === 1 && { size: 'small', appearance: 'brand' })}
              >
                {person.label}
              </SelectedTag>
            );
          })}
        </Group>
        {example.button ? (
          <Button
            {...example.buttonProps}
            aria-label={example.field ? undefined : example.name}
            data-tagpicker-trigger
          >
            Choose reviewers
          </Button>
        ) : (
          <Input
            {...example.input}
            value={example.query ?? ''}
            placeholder="Find reviewers"
            aria-label={example.field ? undefined : example.name}
            data-tagpicker-trigger
            className={example.consumer ? styles.consumerInput : undefined}
          />
        )}
      </Control>
      {!example.props?.noPopover && (
        <List
          aria-label="Suggested reviewers"
          data-tagpicker-popup={identity}
          data-tagpicker-implementation={implementation}
        >
          <FixtureOptions implementation={implementation} example={example} />
        </List>
      )}
    </Picker>
  );
  return (
    <section className={styles.cell} data-tagpicker-implementation={implementation}>
      <h3>{isLegacy ? 'Current CoreAI / Griffel' : 'Headless / CSS Modules'}</h3>
      <div
        className={styles.stage}
        data-tagpicker-stage-open={example.props?.open ? '' : undefined}
      >
        {example.field ? (
          <ControlField label={example.name} {...example.field}>
            {picker}
          </ControlField>
        ) : (
          picker
        )}
      </div>
    </section>
  );
}

export function TagPickerComparison({
  example,
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example: TagPickerExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const identity = React.useId();
  return (
    <div className={styles.pair} data-tagpicker-comparison={identity}>
      <FixtureCell
        implementation="legacy"
        example={example}
        identity={identity}
        positioningRef={legacyPositioningRef}
      />
      <FixtureCell
        implementation="headless"
        example={example}
        identity={identity}
        positioningRef={headlessPositioningRef}
      />
    </div>
  );
}
