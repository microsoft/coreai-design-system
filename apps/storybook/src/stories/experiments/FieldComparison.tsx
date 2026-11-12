// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Field as LegacyField } from '@coreai-ds/react-components';
import type { SlotRenderFunction } from '@fluentui/react-utilities';
import {
  Button,
  Checkbox,
  Field,
  InfoLabel,
  Input,
  Radio,
  RadioGroup,
  Select,
  Switch,
  type FieldProps,
  type LabelProps,
} from '@coreai-ds/react-headless-components';
import {
  captureFieldStyles,
  compareFieldStyles,
  getComparisonField,
  settleFieldStyles,
  type FieldStyleDifference,
} from './compareFieldStyles.js';
import styles from './FieldComparison.module.css';

export const fieldSizes = ['small', 'medium', 'large'] as const;
export const fieldValidationStates = ['error', 'warning', 'success', 'none'] as const;

export interface FieldExample {
  name: string;
  props: FieldProps;
  control?: 'input' | 'select' | 'radio' | 'checkbox' | 'switch' | 'native' | 'disabled';
}

export const fieldExamples: readonly FieldExample[] = [
  { name: 'Default', props: { label: 'Project name' } },
  {
    name: 'Explicit undefined visual defaults',
    props: { label: 'Project name', size: undefined, orientation: undefined },
  },
  ...fieldSizes.map((size) => ({
    name: `Vertical ${size} required`,
    props: { label: 'Project name', size, required: true, hint: 'Use a descriptive name.' },
  })),
  ...fieldSizes.map((size) => ({
    name: `Horizontal ${size}`,
    props: {
      label: 'Project name',
      size,
      orientation: 'horizontal' as const,
      hint: 'Use a descriptive name.',
    },
  })),
  {
    name: 'Horizontal without label',
    props: { orientation: 'horizontal', hint: 'A control with its own accessible name.' },
  },
  ...fieldValidationStates.map((validationState) => ({
    name: `Validation ${validationState}`,
    props: {
      label: 'Project name',
      validationState,
      validationMessage: 'A descriptive validation message that can wrap to a second line.',
    },
  })),
  {
    name: 'Default error from message',
    props: { label: 'Project name', validationMessage: 'This name is already in use.' },
  },
  {
    name: 'Suppressed validation icon',
    props: {
      label: 'Project name',
      validationMessage: 'This name is already in use.',
      validationMessageIcon: null,
    },
  },
  {
    name: 'Custom validation icon',
    props: {
      label: 'Project name',
      validationState: 'none',
      validationMessage: 'The service supplied this status.',
      validationMessageIcon: <span aria-hidden>!</span>,
    },
  },
  {
    name: 'Label slot size and required override',
    props: {
      label: { children: 'Project name', size: 'small', required: '(required)' },
      size: 'large',
      required: true,
    },
  },
  {
    name: 'Disabled control keeps a readable label',
    props: { label: 'Project name', required: true, hint: 'Managed by your directory.' },
    control: 'disabled',
  },
  {
    name: 'Select context',
    props: { label: 'Region', size: 'large', required: true, hint: 'Choose a region.' },
    control: 'select',
  },
  {
    name: 'RadioGroup context',
    props: { label: 'Access', required: true, validationMessage: 'Choose access.' },
    control: 'radio',
  },
  {
    name: 'Checkbox owns its label',
    props: { required: true, hint: 'Required before publishing.' },
    control: 'checkbox',
  },
  {
    name: 'Switch context',
    props: { label: 'Notifications', hint: 'Email project updates.' },
    control: 'switch',
  },
  {
    name: 'Native render-function control',
    props: { label: 'External control', required: true, hint: 'A native third-party control.' },
    control: 'native',
  },
];

export const fieldConsumerExample: FieldExample = {
  name: 'Consumer CSS Modules',
  props: {
    label: { children: 'Project name', className: styles.consumerLabel },
    className: styles.consumerField,
    validationMessage: { children: 'Consumer status.', className: styles.consumerMessage },
    validationMessageIcon: { children: '!', className: styles.consumerIcon },
    hint: { children: 'Consumer hint.', className: styles.consumerHint },
    required: true,
  },
};

function Control({ kind }: { kind: FieldExample['control'] }) {
  switch (kind) {
    case 'select':
      return (
        <Select defaultValue="west">
          <option value="west">West</option>
          <option value="east">East</option>
        </Select>
      );
    case 'radio':
      return (
        <RadioGroup>
          <Radio label="Viewer" value="viewer" />
          <Radio label="Editor" value="editor" />
        </RadioGroup>
      );
    case 'checkbox':
      return <Checkbox label="I reviewed the publishing rules" />;
    case 'switch':
      return <Switch />;
    default:
      return (
        <Input aria-label={kind ? undefined : 'Project name'} disabled={kind === 'disabled'} />
      );
  }
}

export function FieldComparison({
  examples = fieldExamples,
}: {
  examples?: readonly FieldExample[];
}) {
  return (
    <div className={styles.examples}>
      <span data-testid="field-pointer-rest">Field fixtures</span>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>CoreAI / Griffel Field</strong>
        <strong>Headless / CSS Modules Field</strong>
      </div>
      {examples.map((example) => (
        <section key={example.name} className={styles.row} data-field-case={example.name}>
          <span>{example.name}</span>
          {(['legacy', 'headless'] as const).map((implementation) => {
            const Component = implementation === 'legacy' ? LegacyField : Field;
            return (
              <div
                key={implementation}
                className={styles.cell}
                data-field-implementation={implementation}
              >
                <Component {...example.props}>
                  {example.control === 'native' ? (
                    (controlProps) => <input {...controlProps} type="text" />
                  ) : (
                    <Control kind={example.control} />
                  )}
                </Component>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export function FieldComparisonWithReport({
  examples = fieldExamples,
  consumer = false,
}: {
  examples?: readonly FieldExample[];
  consumer?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<FieldStyleDifference[] | null>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const rows = ref.current?.querySelectorAll<HTMLElement>('[data-field-case]');
        if (!rows || rows.length !== examples.length) throw new Error('Field fixtures incomplete');
        const pairs = [...rows].map((row) => ({
          row,
          legacy: getComparisonField(row, 'legacy'),
          headless: getComparisonField(row, 'headless'),
        }));
        await Promise.all(
          pairs.flatMap(({ legacy, headless }) => [
            settleFieldStyles(legacy),
            settleFieldStyles(headless),
          ]),
        );
        if (!active) return;
        const differences: FieldStyleDifference[] = [];
        for (const { row, legacy, headless } of pairs) {
          differences.push(
            ...compareFieldStyles(captureFieldStyles(legacy), captureFieldStyles(headless)).map(
              (difference) => ({
                ...difference,
                property: `${row.dataset.fieldCase}: ${difference.property}`,
              }),
            ),
          );
        }
        if (active) setReport(differences);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      }
    };
    void compare();
    return () => {
      active = false;
    };
  }, [examples]);
  return (
    <div ref={ref}>
      <p>
        Both columns use the completed headless controls; only Field changes. The report compares
        bounded layout, typography, required indicators, validation glyphs, and slot dimensions.
        There are no CoreAI Field defaults or style overrides.
      </p>
      <FieldComparison examples={examples} />
      <output
        className={styles.report}
        aria-label="Field style report"
        data-field-report-state={error ? 'error' : report ? 'ready' : 'comparing'}
        data-field-fixture-count={report ? examples.length : undefined}
        data-field-unexpected-count={report?.length}
      >
        {error ||
          (report
            ? consumer
              ? 'Intentional consumer cascade example.'
              : `${report.length} selected-style differences.`
            : 'Comparing Field fixtures…')}
        {report && `\n${JSON.stringify(report, null, 2)}`}
      </output>
    </div>
  );
}

export function FieldFormFlow() {
  const [name, setName] = React.useState('');
  const [attempted, setAttempted] = React.useState(false);
  const [changes, setChanges] = React.useState(0);
  const [submission, setSubmission] = React.useState('No submissions');
  const invalid = attempted && name.length === 0;
  const renderLabel: SlotRenderFunction<LabelProps> = (_Component, props) => (
    <InfoLabel {...props} info="Use the project name your team recognizes.">
      Project name
    </InfoLabel>
  );
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        const form = event.currentTarget;
        if (form.checkValidity()) {
          setSubmission(JSON.stringify(Object.fromEntries(new FormData(form))));
        } else {
          setSubmission('Please complete the required project name.');
        }
      }}
    >
      <Field
        size="large"
        required
        label={{ children: renderLabel }}
        validationState={invalid ? 'error' : 'none'}
        validationMessage={invalid ? 'Enter a project name.' : undefined}
        hint={invalid ? undefined : 'Use a shared, descriptive name.'}
      >
        <Input
          name="project"
          value={name}
          onChange={(_, data) => {
            setName(data.value);
            setChanges((count) => count + 1);
          }}
        />
      </Field>
      <Field label="Region" required>
        <Select name="region" defaultValue="west">
          <option value="west">West</option>
          <option value="east">East</option>
        </Select>
      </Field>
      <Field label="Access" required hint="RadioGroup needs explicit required for native validity.">
        <RadioGroup name="access" required defaultValue="viewer">
          <Radio value="viewer" label="Viewer" />
          <Radio value="editor" label="Editor" />
        </RadioGroup>
      </Field>
      <Field hint="Check this after reviewing the project.">
        <Checkbox name="reviewed" value="yes" label="Reviewed" />
      </Field>
      <Field label="Notifications" hint="Send email updates.">
        <Switch name="notifications" value="yes" />
      </Field>
      <Field label="Directory identifier">
        <Input name="directory" disabled defaultValue="Managed by directory" />
      </Field>
      <Button as="button" type="submit">
        Save project
      </Button>
      <output aria-label="Project change count">{changes}</output>
      <output aria-label="Project submission">{submission}</output>
    </form>
  );
}
