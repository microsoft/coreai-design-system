// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button as LegacyButton, Tooltip as LegacyTooltip } from '@coreai-ds/react-components';
import { Button, Tooltip, type TooltipProps } from '@coreai-ds/react-headless-components';
import {
  resolvePositioningShorthand,
  type PositioningImperativeRef,
} from '@fluentui/react-headless-components-preview/positioning';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import type { TooltipSlots } from '@fluentui/react-headless-components-preview/tooltip';
import styles from './TooltipComparison.module.css';

export interface TooltipExample {
  name: string;
  props?: Pick<TooltipProps, 'appearance' | 'positioning' | 'withArrow'>;
  text?: string;
  width?: 'wide' | 'compact';
  consumer?: boolean;
}

export const tooltipExamples: readonly TooltipExample[] = [
  { name: 'Default description' },
  { name: 'Explicitly undefined appearance', props: { appearance: undefined } },
  {
    name: 'Inverted content',
    props: { appearance: 'inverted', positioning: { position: 'below', offset: 12, pinned: true } },
  },
  {
    name: 'Long content wraps at 240px',
    width: 'wide',
    text: 'Editors can update project settings, invite reviewers, and manage the release checklist.',
    props: { positioning: { position: 'below', offset: 12, pinned: true } },
  },
  {
    name: 'Default arrow gap',
    props: { withArrow: true },
  },
  {
    name: 'Inverted arrow above',
    props: {
      appearance: 'inverted',
      withArrow: true,
      positioning: { position: 'above', offset: 12, pinned: true },
    },
  },
  {
    name: 'Arrow below',
    props: {
      withArrow: true,
      positioning: { position: 'below', offset: 12, pinned: true },
    },
  },
  {
    name: 'Arrow before',
    width: 'compact',
    text: 'Access',
    props: {
      withArrow: true,
      positioning: { position: 'before', offset: 8, pinned: true },
    },
  },
  {
    name: 'Arrow after',
    width: 'compact',
    text: 'Access',
    props: {
      withArrow: true,
      positioning: { position: 'after', offset: 8, pinned: true },
    },
  },
  {
    name: 'Start-aligned content without an arrow',
    props: { positioning: { position: 'below', align: 'start', offset: 12, pinned: true } },
  },
];

export const tooltipConsumerExample: TooltipExample = {
  name: 'Consumer CSS priority',
  text: 'Edit access',
  consumer: true,
  props: {
    withArrow: true,
    positioning: { position: 'below', offset: 12, pinned: true },
  },
};

type TooltipFixtureContentProps = ExtractSlotProps<TooltipSlots['content']> & {
  'data-tooltip-implementation': 'legacy' | 'headless';
  'data-tooltip-fixture': string;
};

function ExampleCell({
  implementation,
  example,
  fixtureId,
  positioningRef,
}: {
  implementation: 'legacy' | 'headless';
  example: TooltipExample;
  fixtureId: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const Control = implementation === 'legacy' ? LegacyButton : Button;
  const Hint = implementation === 'legacy' ? LegacyTooltip : Tooltip;
  const content: TooltipFixtureContentProps = {
    className: [
      styles.content,
      example.width === 'wide' && styles.wideContent,
      example.width === 'compact' && styles.compactContent,
      example.consumer && styles.consumerContent,
    ]
      .filter(Boolean)
      .join(' '),
    children: example.text ?? 'Review who can edit Atlas.',
    'data-tooltip-implementation': implementation,
    'data-tooltip-fixture': fixtureId,
  };
  const positioning = resolvePositioningShorthand(example.props?.positioning);
  return (
    <div className={styles.cell}>
      <strong>
        {implementation === 'legacy' ? 'Current CoreAI / Griffel' : 'Native / CSS Modules'}
      </strong>
      <div className={styles.stage}>
        <Hint
          {...example.props}
          content={content}
          relationship="description"
          visible
          positioning={{ ...positioning, positioningRef }}
        >
          <Control
            as="button"
            type="button"
            className={[styles.trigger, example.width === 'compact' && styles.compactTrigger]
              .filter(Boolean)
              .join(' ')}
            data-tooltip-trigger={implementation}
          >
            Project access
          </Control>
        </Hint>
      </div>
    </div>
  );
}

export function TooltipComparison({
  example = tooltipExamples[0],
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example?: TooltipExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <section
      className={styles.comparison}
      data-tooltip-comparison={fixtureId}
      data-tooltip-example={example.name}
    >
      <ExampleCell
        implementation="legacy"
        fixtureId={fixtureId}
        example={example}
        positioningRef={legacyPositioningRef}
      />
      <ExampleCell
        implementation="headless"
        fixtureId={fixtureId}
        example={example}
        positioningRef={headlessPositioningRef}
      />
    </section>
  );
}

export function TooltipHelpFlow() {
  const [allowed, setAllowed] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const [events, setEvents] = React.useState<string[]>([]);
  return (
    <div className={styles.flow}>
      <label>
        <input
          type="checkbox"
          checked={allowed}
          onChange={(event) => {
            setAllowed(event.currentTarget.checked);
            setVisible(false);
          }}
        />{' '}
        Allow access hints
      </label>
      <div className={styles.flowStage}>
        <Tooltip
          content={{
            children: 'Editors can invite project reviewers.',
            'aria-label': 'Project access guidance',
          }}
          relationship="description"
          withArrow
          positioning={{ position: 'below', offset: 12 }}
          showDelay={80}
          hideDelay={120}
          visible={allowed && visible}
          onVisibleChange={(event, data) => {
            setVisible(data.visible);
            setEvents((current) => [
              ...current,
              `${event?.type ?? 'native-toggle'}:${data.visible}`,
            ]);
          }}
        >
          <Button as="button" type="button">
            Access policy
          </Button>
        </Tooltip>
      </div>
      <Button as="button" type="button" onClick={() => setVisible((current) => !current)}>
        {visible ? 'Hide access hint' : 'Show access hint'}
      </Button>
      <Button as="button" type="button">
        Outside access hints
      </Button>
      <output aria-label="Tooltip visibility events">{events.join(', ') || 'No changes'}</output>
    </div>
  );
}
