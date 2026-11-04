// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { InfoLabel as LegacyInfoLabel } from '@coreai-ds/react-components';
import type { SlotRenderFunction } from '@fluentui/react-utilities';
import {
  Field,
  InfoLabel,
  Input,
  type InfoLabelProps,
  type LabelProps,
} from '@coreai-ds/react-headless-components';
import {
  captureInfoLabelStyles,
  compareInfoLabelStyles,
  getComparisonInfoLabel,
  settleInfoLabelStyles,
  type InfoLabelStyleDifference,
} from './compareInfoLabelStyles.js';
import styles from './InfoLabelComparison.module.css';

export interface InfoLabelExample {
  name: string;
  props: Pick<
    InfoLabelProps,
    'children' | 'size' | 'weight' | 'required' | 'disabled' | 'className' | 'style'
  >;
  info?: string | number | React.ReactElement;
  hideInfoButton?: boolean;
  labelSize?: LabelProps['size'];
  buttonSize?: 'small' | 'medium' | 'large';
  consumer?: boolean;
}

export const infoLabelExamples: readonly InfoLabelExample[] = [
  { name: 'Default', props: { children: 'Project name' } },
  {
    name: 'Explicit undefined visual defaults',
    props: { children: 'Project name', size: undefined, weight: undefined },
  },
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `${size} required`,
    props: { children: 'Project name', size, required: true },
  })),
  { name: 'Semibold', props: { children: 'Project name', weight: 'semibold' } },
  {
    name: 'Disabled required label',
    props: { children: 'Project name', disabled: true, required: true },
  },
  {
    name: 'Custom required indicator',
    props: { children: 'Project name', required: { children: '(required)', title: 'Required' } },
  },
  { name: 'No information', props: { children: 'Project name' }, info: undefined },
  { name: 'Zero info retains current omission', props: { children: 'Project name' }, info: 0 },
  { name: 'Explicit null button', props: { children: 'Project name' }, hideInfoButton: true },
  {
    name: 'Independent label and button sizes',
    props: { children: 'Project name', size: 'large' },
    labelSize: 'small',
    buttonSize: 'medium',
  },
  {
    name: 'Inherited label color',
    props: { children: 'Project name', style: { color: 'rgb(20, 80, 120)', cursor: 'help' } },
  },
];

export const infoLabelConsumerExample: InfoLabelExample = {
  name: 'Consumer CSS Modules',
  props: { children: 'Project name', className: styles.consumerRoot, required: true },
  consumer: true,
};

function InfoLabelCell({
  example,
  implementation,
}: {
  example: InfoLabelExample;
  implementation: 'legacy' | 'headless';
}) {
  const controlId = React.useId();
  const Component = implementation === 'legacy' ? LegacyInfoLabel : InfoLabel;
  const info = 'info' in example ? example.info : 'Use the project name your team recognizes.';
  return (
    <div className={styles.cell} data-infolabel-implementation={implementation}>
      <Component
        {...example.props}
        htmlFor={controlId}
        info={info}
        label={{
          ...(example.labelSize ? { size: example.labelSize } : {}),
          className: example.consumer ? styles.consumerLabel : undefined,
        }}
        infoButton={
          example.hideInfoButton
            ? null
            : example.buttonSize || example.consumer
              ? {
                  ...(example.buttonSize ? { size: example.buttonSize } : {}),
                  className: example.consumer ? styles.consumerButton : undefined,
                }
              : undefined
        }
      />
      <input id={controlId} className={styles.input} disabled={example.props.disabled} />
    </div>
  );
}

export function InfoLabelComparison({
  examples = infoLabelExamples,
}: {
  examples?: readonly InfoLabelExample[];
}) {
  return (
    <div className={styles.examples}>
      <span data-testid="infolabel-pointer-rest">InfoLabel fixtures</span>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>CoreAI / Griffel InfoLabel</strong>
        <strong>Headless / CSS Modules InfoLabel</strong>
      </div>
      {examples.map((example) => (
        <section key={example.name} className={styles.row} data-infolabel-case={example.name}>
          <span>{example.name}</span>
          <InfoLabelCell example={example} implementation="legacy" />
          <InfoLabelCell example={example} implementation="headless" />
        </section>
      ))}
    </div>
  );
}

export function InfoLabelComparisonWithReport({
  examples = infoLabelExamples,
  consumer = false,
}: {
  examples?: readonly InfoLabelExample[];
  consumer?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<InfoLabelStyleDifference[] | null>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        const rows = ref.current?.querySelectorAll<HTMLElement>('[data-infolabel-case]');
        if (!rows || rows.length !== examples.length)
          throw new Error('InfoLabel fixtures incomplete');
        const pairs = [...rows].map((row) => ({
          row,
          legacy: getComparisonInfoLabel(row, 'legacy'),
          headless: getComparisonInfoLabel(row, 'headless'),
        }));
        await Promise.all(
          pairs.flatMap(({ legacy, headless }) => [
            settleInfoLabelStyles(legacy),
            settleInfoLabelStyles(headless),
          ]),
        );
        if (!active) return;
        const differences: InfoLabelStyleDifference[] = [];
        for (const { row, legacy, headless } of pairs) {
          differences.push(
            ...compareInfoLabelStyles(
              captureInfoLabelStyles(legacy),
              captureInfoLabelStyles(headless),
            ).map((difference) => ({
              ...difference,
              property: `${row.dataset.infolabelCase}: ${difference.property}`,
            })),
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
        InfoLabel preserves its label ref, native association, required indicator ordering,
        generated information-button name, and current popup ownership. Label and InfoButton
        foundations are reused through typed public slot render functions that retain the actual
        headless primitive metadata. The standalone CoreAI InfoButton&apos;s stricter public naming
        contract is not imposed on InfoLabel&apos;s internally generated button.
      </p>
      <p>
        This report compares closed label/button layout and glyphs; the InfoButton report compares
        open native surfaces. Current truthy info selection means numeric zero without an explicit
        infoButton does not create a button. Disabled is a visual Label prop, not an invented
        disabled information-button API.
      </p>
      <InfoLabelComparison examples={examples} />
      <output
        className={styles.report}
        aria-label="InfoLabel style report"
        data-infolabel-report-state={error ? 'error' : report ? 'ready' : 'comparing'}
        data-infolabel-fixture-count={report ? examples.length : undefined}
        data-infolabel-unexpected-count={report?.length}
      >
        {error ||
          (report
            ? consumer
              ? 'Intentional consumer cascade example.'
              : `${report.length} selected-style differences.`
            : 'Comparing InfoLabel fixtures…')}
        {report && `\n${JSON.stringify(report, null, 2)}`}
      </output>
    </div>
  );
}

export function InfoLabelHelpFlow() {
  const [events, setEvents] = React.useState(0);
  const renderLabel: SlotRenderFunction<LabelProps> = (_Component, props) => (
    <InfoLabel
      {...props}
      info={{
        children: (
          <>
            Use a stable project name. <a href="#naming-guide">Naming guide</a>
          </>
        ),
      }}
      infoButton={{
        popover: {
          positioning: 'below-start',
          onOpenChange: () => setEvents((count) => count + 1),
        },
      }}
    >
      Project name
    </InfoLabel>
  );
  return (
    <div className={styles.flow}>
      <Field
        label={{ children: renderLabel }}
        required
        validationState="warning"
        validationMessage="Check that this project does not already exist."
        hint="Names are visible to your team."
      >
        <Input />
      </Field>
      <button type="button">After project name</button>
      <output aria-label="InfoLabel callback count">{events}</output>
    </div>
  );
}
