// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Combobox as LegacyCombobox,
  Dropdown as LegacyDropdown,
  DropdownButton as LegacyDropdownButton,
  Field as LegacyField,
  Listbox as LegacyListbox,
  Option as LegacyOption,
  OptionGroup as LegacyOptionGroup,
  type PositioningImperativeRef,
} from '@coreai-ds/react-components';
import {
  Combobox,
  Dropdown,
  DropdownButton,
  Field,
  Listbox,
  Option,
  OptionGroup,
  useComboboxFilter,
  type ComboboxProps,
  type ComboboxSlots,
  type DropdownProps,
  type DropdownButtonProps,
  type FieldProps,
  type ListboxProps,
  type OptionOnSelectData,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import styles from './OptionPickerComparison.module.css';

export const pickerAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;
export const pickerSizes = ['small', 'medium', 'large'] as const;
export const dropdownButtonAppearances = [
  'secondary',
  'primary',
  'outline',
  'subtle',
  'transparent',
] as const;
export const dropdownButtonShapes = ['rounded', 'circular', 'square'] as const;

export type PickerKind = 'combobox' | 'dropdown' | 'dropdown-button' | 'listbox';
export type PickerImplementation = 'legacy' | 'headless';

interface PickerExampleBase {
  name: string;
  grouped?: boolean;
  complex?: boolean;
  empty?: boolean;
  consumer?: boolean;
  field?: Pick<FieldProps, 'size' | 'required' | 'validationState' | 'validationMessage' | 'hint'>;
}

export type PickerExample = PickerExampleBase &
  (
    | { kind: 'combobox'; props: ComboboxProps }
    | { kind: 'dropdown'; props: DropdownProps }
    | { kind: 'dropdown-button'; props: DropdownButtonProps }
    | { kind: 'listbox'; props: ListboxProps }
  );

export const pickerOptions = [
  { value: 'alpha', text: 'Alpha', group: 'Available' },
  { value: 'beta', text: 'Beta', group: 'Available', disabled: true },
  { value: 'gamma', text: 'Gamma', group: 'More projects' },
  { value: 'delta', text: 'Delta', group: 'More projects' },
] as const;

function fieldExamples(kind: 'combobox' | 'dropdown'): PickerExample[] {
  return [
    {
      name: 'Required invalid Field',
      kind,
      props: { appearance: 'outline', placeholder: 'Choose a project' },
      field: {
        required: true,
        validationState: 'error',
        validationMessage: 'Choose an available project',
        hint: 'Beta is unavailable',
      },
    },
    {
      name: 'Field size inheritance',
      kind,
      props: { size: undefined, defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
      field: { size: 'large' },
    },
  ];
}

export const comboboxExamples: readonly PickerExample[] = [
  { name: 'Default', kind: 'combobox', props: { placeholder: 'Choose a project' } },
  {
    name: 'Explicit undefined visual props',
    kind: 'combobox',
    props: { appearance: undefined, size: undefined },
  },
  ...pickerAppearances.flatMap((appearance) =>
    pickerSizes.map((size): PickerExample => ({
      name: `${appearance}, ${size}`,
      kind: 'combobox',
      props: { appearance, size, defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
    })),
  ),
  ...pickerAppearances.map((appearance): PickerExample => ({
    name: `Disabled ${appearance}`,
    kind: 'combobox',
    props: { appearance, disabled: true, placeholder: 'Unavailable' },
  })),
  {
    name: 'Inline label with value',
    kind: 'combobox',
    props: { label: 'Project', defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
  },
  {
    name: 'Dynamic inline label',
    kind: 'combobox',
    props: { label: 'Project', dynamicWidth: true },
  },
  {
    name: 'Truncated query',
    kind: 'combobox',
    props: {
      defaultValue: 'A project name that is deliberately wider than the control',
      freeform: true,
      truncateTextOverflow: true,
    },
  },
  {
    name: 'Clearable selection',
    kind: 'combobox',
    props: { clearable: true, defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
  },
  {
    name: 'Read only selection',
    kind: 'combobox',
    props: { readOnly: true, defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
  },
  {
    name: 'Open grouped options',
    kind: 'combobox',
    props: { open: true, value: 'Gamma', selectedOptions: ['gamma'] },
    grouped: true,
  },
  {
    name: 'Open complex options',
    kind: 'combobox',
    props: { open: true, value: 'Delta', selectedOptions: ['delta'] },
    complex: true,
  },
  {
    name: 'Open multiselect',
    kind: 'combobox',
    props: {
      open: true,
      multiselect: true,
      value: 'Alpha, Gamma',
      selectedOptions: ['alpha', 'gamma'],
    },
  },
  { name: 'Empty list', kind: 'combobox', props: { open: true }, empty: true },
  {
    name: 'Spelling is not invalid styling',
    kind: 'combobox',
    props: { appearance: 'outline', 'aria-invalid': 'spelling' },
  },
  ...fieldExamples('combobox'),
];

export const dropdownExamples: readonly PickerExample[] = [
  { name: 'Default', kind: 'dropdown', props: { placeholder: 'Choose a project' } },
  {
    name: 'Explicit undefined visual props',
    kind: 'dropdown',
    props: { appearance: undefined, size: undefined },
  },
  ...pickerAppearances.flatMap((appearance) =>
    pickerSizes.map((size): PickerExample => ({
      name: `${appearance}, ${size}`,
      kind: 'dropdown',
      props: { appearance, size, defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
    })),
  ),
  ...pickerAppearances.map((appearance): PickerExample => ({
    name: `Disabled ${appearance}`,
    kind: 'dropdown',
    props: { appearance, disabled: true, placeholder: 'Unavailable' },
  })),
  {
    name: 'Inline label with value',
    kind: 'dropdown',
    props: { label: 'Project', defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
  },
  {
    name: 'Dynamic inline label',
    kind: 'dropdown',
    props: { label: 'Project', dynamicWidth: true },
  },
  {
    name: 'Clearable inline selection',
    kind: 'dropdown',
    props: {
      clearable: true,
      label: 'Project',
      defaultValue: 'Alpha',
      defaultSelectedOptions: ['alpha'],
    },
  },
  {
    name: 'Open grouped options',
    kind: 'dropdown',
    props: { open: true, value: 'Gamma', selectedOptions: ['gamma'] },
    grouped: true,
  },
  {
    name: 'Open complex options',
    kind: 'dropdown',
    props: { open: true, value: 'Delta', selectedOptions: ['delta'] },
    complex: true,
  },
  {
    name: 'Open multiselect',
    kind: 'dropdown',
    props: {
      open: true,
      multiselect: true,
      value: 'Alpha, Gamma',
      selectedOptions: ['alpha', 'gamma'],
    },
  },
  { name: 'Empty list', kind: 'dropdown', props: { open: true }, empty: true },
  {
    name: 'Field with inline visual label',
    kind: 'dropdown',
    props: { label: 'Inline project' },
    field: { required: true, hint: 'The Field supplies the accessible name' },
  },
  ...fieldExamples('dropdown'),
];

export const dropdownButtonExamples: readonly PickerExample[] = [
  { name: 'Default labelled button', kind: 'dropdown-button', props: { label: 'Sort by' } },
  {
    name: 'Explicit undefined visual props',
    kind: 'dropdown-button',
    props: { label: 'Sort by', appearance: undefined, shape: undefined, size: undefined },
  },
  ...dropdownButtonAppearances.flatMap((appearance) =>
    pickerSizes.map((size): PickerExample => ({
      name: `${appearance}, ${size}`,
      kind: 'dropdown-button',
      props: {
        appearance,
        size,
        label: 'Sort by',
        defaultValue: 'Alpha',
        defaultSelectedOptions: ['alpha'],
      },
    })),
  ),
  ...dropdownButtonShapes.map((shape): PickerExample => ({
    name: `Shape: ${shape}`,
    kind: 'dropdown-button',
    props: { shape, label: 'Sort by', defaultValue: 'Alpha', defaultSelectedOptions: ['alpha'] },
  })),
  ...dropdownButtonAppearances.map((appearance): PickerExample => ({
    name: `Disabled ${appearance}`,
    kind: 'dropdown-button',
    props: { appearance, label: 'Sort by', disabled: true, value: 'Alpha' },
  })),
  {
    name: 'Open button options',
    kind: 'dropdown-button',
    props: { label: 'Sort by', open: true, value: 'Alpha', selectedOptions: ['alpha'] },
    grouped: true,
  },
  {
    name: 'Clearable button',
    kind: 'dropdown-button',
    props: {
      label: 'Sort by',
      clearable: true,
      defaultValue: 'Alpha',
      defaultSelectedOptions: ['alpha'],
    },
  },
  {
    name: 'Large Field with inline button label',
    kind: 'dropdown-button',
    props: { label: 'Sort by' },
    field: { size: 'large', required: true, hint: 'The Field supplies the accessible name' },
  },
];

export const listboxExamples: readonly PickerExample[] = [
  { name: 'Single selection', kind: 'listbox', props: { defaultSelectedOptions: ['alpha'] } },
  {
    name: 'Multiselect',
    kind: 'listbox',
    props: { multiselect: true, selectedOptions: ['alpha', 'gamma'] },
  },
  {
    name: 'Disabled selected multiselect',
    kind: 'listbox',
    props: { multiselect: true, selectedOptions: ['beta'] },
  },
  {
    name: 'Grouped options',
    kind: 'listbox',
    props: { defaultSelectedOptions: ['gamma'] },
    grouped: true,
  },
  {
    name: 'Complex options',
    kind: 'listbox',
    props: { defaultSelectedOptions: ['delta'] },
    complex: true,
  },
  { name: 'Empty list', kind: 'listbox', props: {}, empty: true },
];

export function pickerConsumerExample(kind: PickerKind): PickerExample {
  const shared = { name: 'Consumer CSS priority', consumer: true, grouped: true };
  if (kind === 'dropdown-button') {
    return {
      ...shared,
      kind,
      props: { label: 'Sort by', open: true, value: 'Alpha', selectedOptions: ['alpha'] },
    };
  }
  if (kind === 'listbox') {
    return { ...shared, kind, props: { defaultSelectedOptions: ['alpha'] } };
  }
  return { ...shared, kind, props: { open: true, value: 'Alpha', selectedOptions: ['alpha'] } };
}

export function PickerOptions({
  implementation = 'headless',
  grouped = false,
  complex = false,
  empty = false,
  consumer = false,
}: {
  implementation?: PickerImplementation;
  grouped?: boolean;
  complex?: boolean;
  empty?: boolean;
  consumer?: boolean;
}) {
  const Item = implementation === 'legacy' ? LegacyOption : Option;
  const Group = implementation === 'legacy' ? LegacyOptionGroup : OptionGroup;
  const option = (item: (typeof pickerOptions)[number]) => (
    <Item
      key={item.value}
      value={item.value}
      text={item.text}
      disabled={'disabled' in item && item.disabled}
      className={consumer ? styles.consumerOption : undefined}
      checkIcon={consumer ? { className: styles.consumerCheck } : undefined}
    >
      {complex ? (
        <span className={styles.complexText}>
          <strong>{item.text}</strong>
          <span className={styles.secondaryText}>Project workspace</span>
        </span>
      ) : (
        item.text
      )}
    </Item>
  );
  if (empty) return null;
  if (!grouped) return <>{pickerOptions.map(option)}</>;
  return (
    <>
      {['Available', 'More projects'].map((group) => (
        <Group
          key={group}
          label={{ children: group, className: consumer ? styles.consumerGroup : undefined }}
        >
          {pickerOptions.filter((item) => item.group === group).map(option)}
        </Group>
      ))}
    </>
  );
}

type PopupFixtureProps = ExtractSlotProps<ComboboxSlots['listbox']> & {
  'data-picker-popup': string;
  'data-picker-implementation': PickerImplementation;
};

function StandaloneListboxStage({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  const style: React.CSSProperties & { '--option-picker-anchor': string } = {
    '--option-picker-anchor': `--fui-picker-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`,
  };
  return (
    <div className={styles.standaloneStage} style={style} data-picker-listbox-stage="">
      {children}
    </div>
  );
}

function ExampleCell({
  implementation,
  example,
  fixtureId,
  positioningRef,
}: {
  implementation: PickerImplementation;
  example: PickerExample;
  fixtureId: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const generatedId = React.useId();
  const standaloneRef = React.useRef<HTMLDivElement>(null);
  const isLegacy = implementation === 'legacy';
  React.useLayoutEffect(() => {
    const listbox = standaloneRef.current;
    if (isLegacy || example.kind !== 'listbox' || !listbox) return;
    listbox.showPopover();
    return () => {
      if (listbox.isConnected && listbox.matches(':popover-open')) listbox.hidePopover();
    };
  }, [isLegacy, example.kind]);
  const popup: PopupFixtureProps = {
    'data-picker-popup': fixtureId,
    'data-picker-implementation': implementation,
    'aria-label': `${example.name} options`,
    className: example.consumer ? styles.consumerPopup : undefined,
  };
  const positioning = {
    position: 'below' as const,
    align: 'start' as const,
    offset: 0,
    matchTargetSize: 'width' as const,
    pinned: true,
    positioningRef,
  };
  const options = <PickerOptions {...example} implementation={implementation} />;
  const common = {
    id: example.field ? example.props.id : `${generatedId}-${implementation}`,
    'aria-label': example.field ? undefined : example.name,
    className: [
      example.kind !== 'dropdown-button' &&
        !('dynamicWidth' in example.props && example.props.dynamicWidth) &&
        styles.fixedControl,
      example.consumer && styles.consumerRoot,
    ]
      .filter(Boolean)
      .join(' '),
  };
  let control: React.ReactElement;
  switch (example.kind) {
    case 'combobox': {
      const Control = isLegacy ? LegacyCombobox : Combobox;
      control = (
        <Control
          {...example.props}
          {...common}
          input={example.consumer ? { className: styles.consumerTrigger } : undefined}
          listbox={popup}
          positioning={positioning}
        >
          {options}
        </Control>
      );
      break;
    }
    case 'dropdown': {
      const Control = isLegacy ? LegacyDropdown : Dropdown;
      control = (
        <Control
          {...example.props}
          {...common}
          {...(example.consumer ? { button: { className: styles.consumerTrigger } } : {})}
          listbox={popup}
          positioning={positioning}
        >
          {options}
        </Control>
      );
      break;
    }
    case 'dropdown-button': {
      const Control = isLegacy ? LegacyDropdownButton : DropdownButton;
      control = (
        <Control {...example.props} {...common} listbox={popup} positioning={positioning}>
          {options}
        </Control>
      );
      break;
    }
    case 'listbox': {
      const className = [common.className, popup.className].filter(Boolean).join(' ');
      control = isLegacy ? (
        <LegacyListbox {...example.props} {...common} {...popup} className={className}>
          {options}
        </LegacyListbox>
      ) : (
        <StandaloneListboxStage>
          <Listbox
            {...example.props}
            {...common}
            {...popup}
            ref={standaloneRef}
            className={`${className} ${styles.standalonePopover}`}
          >
            {options}
          </Listbox>
        </StandaloneListboxStage>
      );
      break;
    }
  }
  const ControlField = isLegacy ? LegacyField : Field;
  return (
    <div className={styles.cell} data-picker-implementation={implementation}>
      {example.field ? (
        <ControlField label={example.name} {...example.field}>
          {control}
        </ControlField>
      ) : (
        control
      )}
    </div>
  );
}

export function OptionPickerComparison({
  example,
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example: PickerExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  const open = example.kind === 'listbox' || ('open' in example.props && example.props.open);
  return (
    <section
      className={`${styles.comparison} ${open ? styles.popupStage : ''}`}
      data-picker-comparison={fixtureId}
      data-picker-example={example.name}
      data-picker-kind={example.kind}
    >
      <div className={`${styles.columns} ${styles.heading}`}>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Public headless / CSS Modules</strong>
      </div>
      <div className={styles.columns}>
        <ExampleCell
          implementation="legacy"
          example={example}
          fixtureId={fixtureId}
          positioningRef={legacyPositioningRef}
        />
        <ExampleCell
          implementation="headless"
          example={example}
          fixtureId={fixtureId}
          positioningRef={headlessPositioningRef}
        />
      </div>
    </section>
  );
}

export function ComboboxQueryFlow({
  freeform = false,
  onChange,
  onOptionSelect,
}: Pick<ComboboxProps, 'freeform' | 'onChange' | 'onOptionSelect'>) {
  const [query, setQuery] = React.useState('');
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const children = useComboboxFilter({
    query,
    options: pickerOptions.map((option) => option.text),
    noOptionsElement: (
      <Option disabled value="empty" text="No matching projects">
        No matching projects
      </Option>
    ),
    renderOption: (text) => {
      const option = pickerOptions.find((candidate) => candidate.text === text);
      if (!option) throw new Error(`Unknown project ${text}`);
      return (
        <Option
          key={option.value}
          value={option.value}
          disabled={'disabled' in option && option.disabled}
        >
          {text}
        </Option>
      );
    },
  });
  return (
    <div className={styles.flow}>
      <button type="button">Before project query</button>
      <Field label="Find a project" hint="Search the project catalog" required>
        <Combobox
          freeform={freeform}
          value={query}
          selectedOptions={selectedOptions}
          placeholder="Search projects"
          positioning={{ position: 'below', align: 'start', matchTargetSize: 'width' }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange?.(event);
          }}
          onOptionSelect={(event, data) => {
            setSelectedOptions(data.selectedOptions);
            setQuery(data.optionText ?? '');
            onOptionSelect?.(event, data);
          }}
        >
          {children}
        </Combobox>
      </Field>
      <button type="button">After project query</button>
      <output aria-label="Project query">{query}</output>
      <output aria-label="Selected project">{selectedOptions.join(',')}</output>
    </div>
  );
}

type DropdownSelectionFlowProps =
  | ({
      variant?: 'field';
    } & Pick<
      DropdownProps,
      'multiselect' | 'onOptionSelect' | 'button' | 'appearance' | 'size' | 'disabled' | 'label'
    >)
  | ({
      variant: 'button';
      label?: string;
    } & Pick<
      DropdownButtonProps,
      'multiselect' | 'onOptionSelect' | 'appearance' | 'shape' | 'size' | 'disabled'
    >);

export function DropdownSelectionFlow(props: DropdownSelectionFlowProps) {
  const { multiselect = false, onOptionSelect } = props;
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const [payload, setPayload] = React.useState<OptionOnSelectData | null>(null);
  const value = pickerOptions
    .filter((option) => selectedOptions.includes(option.value))
    .map((option) => option.text)
    .join(', ');
  const common = {
    multiselect,
    disabled: props.disabled,
    size: props.size,
    value,
    selectedOptions,
    'aria-label': 'Project access',
    positioning: { position: 'below' as const, align: 'start' as const },
    onOptionSelect: (
      event: Parameters<NonNullable<DropdownProps['onOptionSelect']>>[0],
      data: OptionOnSelectData,
    ) => {
      setSelectedOptions(data.selectedOptions);
      setPayload(data);
      onOptionSelect?.(event, data);
    },
  };
  return (
    <div className={styles.flow}>
      <button type="button">Before project access</button>
      {props.variant === 'button' ? (
        <DropdownButton
          {...common}
          label={props.label ?? 'Project'}
          appearance={props.appearance}
          shape={props.shape}
          clearable={!multiselect}
        >
          <PickerOptions grouped />
        </DropdownButton>
      ) : (
        <Dropdown
          {...common}
          label={props.label ?? 'Project'}
          appearance={props.appearance}
          button={props.button}
          clearable={!multiselect}
        >
          <PickerOptions grouped />
        </Dropdown>
      )}
      <button type="button">After project access</button>
      <output aria-label="Selected access">{selectedOptions.join(',')}</output>
      <output aria-label="Selection payload">{JSON.stringify(payload)}</output>
    </div>
  );
}

export function OptionPickerFormFlow() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      aria-label="Project preferences"
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(JSON.stringify([...new FormData(event.currentTarget).entries()]));
      }}
    >
      <Field label="Project name" required hint="The native input is submitted">
        <Combobox
          name="project"
          defaultValue="Alpha"
          defaultSelectedOptions={['alpha']}
          positioning={{ position: 'below', align: 'start' }}
        >
          <PickerOptions />
        </Combobox>
      </Field>
      <Field label="Access preset" required hint="A type=button trigger is not a form entry">
        <Dropdown
          name="access"
          defaultValue="Gamma"
          defaultSelectedOptions={['gamma']}
          positioning={{ position: 'below', align: 'start' }}
        >
          <PickerOptions />
        </Dropdown>
      </Field>
      <button type="submit">Save preferences</button>
      <button type="reset">Reset native form</button>
      <output aria-label="Submitted preferences">{submitted}</output>
    </form>
  );
}

export function StandaloneListboxFlow({
  multiselect = false,
  onOptionSelect,
}: Pick<ListboxProps, 'multiselect' | 'onOptionSelect'>) {
  const listboxRef = React.useRef<HTMLDivElement>(null);
  const [payload, setPayload] = React.useState<OptionOnSelectData | null>(null);
  return (
    <div className={styles.flow}>
      <button
        type="button"
        onClick={() => {
          listboxRef.current?.showPopover();
          listboxRef.current?.focus();
        }}
      >
        Open project list
      </button>
      <StandaloneListboxStage>
        <Listbox
          ref={listboxRef}
          aria-label="Project catalog"
          multiselect={multiselect}
          className={`${styles.standalone} ${styles.standalonePopover}`}
          onOptionSelect={(event, data) => {
            setPayload(data);
            onOptionSelect?.(event, data);
          }}
        >
          <PickerOptions grouped />
        </Listbox>
      </StandaloneListboxStage>
      <button type="button">After project list</button>
      <output aria-label="List selection">{JSON.stringify(payload)}</output>
    </div>
  );
}
