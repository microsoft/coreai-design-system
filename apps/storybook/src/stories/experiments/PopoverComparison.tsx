// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  Popover as LegacyPopover,
  PopoverSurface as LegacyPopoverSurface,
  PopoverTrigger as LegacyPopoverTrigger,
  resolvePositioningShorthand,
  type PositioningImperativeRef,
} from '@coreai-ds/react-components';
import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  usePopoverContext,
  type PopoverProps,
  type PopoverSurfaceProps,
} from '@coreai-ds/react-headless-components';
import styles from './PopoverComparison.module.css';

export const popoverSizes = ['small', 'medium', 'large'] as const;
export const popoverAppearances = ['brand', 'inverted'] as const;

export interface PopoverExample {
  name: string;
  props?: Pick<PopoverProps, 'appearance' | 'size' | 'withArrow' | 'positioning'>;
  consumer?: boolean;
}

export const popoverExamples: readonly PopoverExample[] = [
  { name: 'Default surface' },
  { name: 'Explicit undefined visual props', props: { size: undefined, appearance: undefined } },
  ...popoverSizes.map((size) => ({ name: `Size: ${size}`, props: { size } })),
  ...popoverAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance },
  })),
  ...popoverSizes.map((size) => ({
    name: `Arrow: ${size}`,
    props: {
      size,
      withArrow: true,
      positioning: { position: 'below' as const, offset: 10, pinned: true },
    },
  })),
  {
    name: 'Inverted arrow above',
    props: {
      appearance: 'inverted',
      withArrow: true,
      positioning: { position: 'above', offset: 10, pinned: true },
    },
  },
  {
    name: 'Brand arrow below',
    props: {
      appearance: 'brand',
      withArrow: true,
      positioning: { position: 'below', offset: 10, pinned: true },
    },
  },
];

export const popoverConsumerExample: PopoverExample = {
  name: 'Consumer CSS priority',
  consumer: true,
  props: {
    withArrow: true,
    positioning: { position: 'below', offset: 10, pinned: true },
  },
};

type PopoverFixtureSurfaceProps = Pick<PopoverSurfaceProps, 'className' | 'aria-label'> & {
  'data-popover-implementation': 'legacy' | 'headless';
  'data-popover-fixture': string;
};

type PopoverFixtureTriggerProps = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'type'
> & {
  as: 'button';
  'data-popover-trigger': 'legacy' | 'headless';
};

function ExampleCell({
  implementation,
  example,
  fixtureId,
  positioningRef,
}: {
  implementation: 'legacy' | 'headless';
  example: PopoverExample;
  fixtureId: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}): React.ReactElement {
  const Trigger = implementation === 'legacy' ? LegacyPopoverTrigger : PopoverTrigger;
  const Surface = implementation === 'legacy' ? LegacyPopoverSurface : PopoverSurface;
  const Control = implementation === 'legacy' ? LegacyButton : Button;
  const surfaceProps: PopoverFixtureSurfaceProps = {
    className: [styles.surface, example.consumer && styles.consumerSurface]
      .filter(Boolean)
      .join(' '),
    'aria-label': `${example.name} ${implementation} surface`,
    'data-popover-implementation': implementation,
    'data-popover-fixture': fixtureId,
  };
  const triggerProps: PopoverFixtureTriggerProps = {
    as: 'button',
    type: 'button',
    className: styles.trigger,
    'data-popover-trigger': implementation,
  };
  const resolvedPositioning = resolvePositioningShorthand(example.props?.positioning);
  const positioning = positioningRef
    ? { ...resolvedPositioning, positioningRef }
    : resolvedPositioning;

  const trigger = (
    <Trigger disableButtonEnhancement>
      <Control {...triggerProps}>{implementation} trigger</Control>
    </Trigger>
  );
  const surface = (
    <Surface {...surfaceProps}>
      <div className={styles.content} data-popover-content="">
        <h3 className={styles.title}>Project access</h3>
        <p className={styles.text}>Review who can edit Atlas.</p>
        <Control as="button" type="button">
          Manage access
        </Control>
      </div>
    </Surface>
  );
  return (
    <div className={styles.cell}>
      {implementation === 'legacy' ? (
        <LegacyPopover {...example.props} open surfaceMotion={null} positioning={positioning}>
          {trigger}
          {surface}
        </LegacyPopover>
      ) : (
        <Popover {...example.props} open positioning={positioning}>
          {trigger}
          {surface}
        </Popover>
      )}
    </div>
  );
}

export function PopoverComparison({
  example = popoverExamples[0],
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example?: PopoverExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <section
      className={styles.comparison}
      data-popover-comparison={fixtureId}
      data-popover-example={example.name}
    >
      <div className={styles.columns}>
        <strong>Legacy Portal / Popper</strong>
        <strong>Native top layer / CSS anchors</strong>
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

function CloseFromContext() {
  const setOpen = usePopoverContext((context) => context.setOpen);
  return (
    <Button as="button" type="button" onClick={(event) => setOpen(event, false)}>
      Close access details
    </Button>
  );
}

export function PopoverControlledFlow({
  trapFocus = false,
  onOpenChange,
}: {
  trapFocus?: boolean;
  onOpenChange?: PopoverProps['onOpenChange'];
}) {
  const [open, setOpen] = React.useState(false);
  const [events, setEvents] = React.useState<string[]>([]);
  return (
    <div className={styles.flow}>
      <button type="button">Before access details</button>
      <Popover
        open={open}
        trapFocus={trapFocus}
        withArrow
        positioning={{ position: 'below', offset: 10 }}
        id={trapFocus ? 'modal-access-details' : 'access-details'}
        onOpenChange={(event, data) => {
          setOpen(data.open);
          setEvents((previous) => [...previous, `${data.type}:${data.open ? 'open' : 'closed'}`]);
          onOpenChange?.(event, data);
        }}
      >
        <PopoverTrigger disableButtonEnhancement>
          <Button as="button" type="button">
            {trapFocus ? 'Open modal access details' : 'Open access details'}
          </Button>
        </PopoverTrigger>
        <PopoverSurface
          className={styles.surface}
          aria-label="Atlas access details"
          aria-describedby={trapFocus ? 'modal-access-description' : 'access-description'}
        >
          <div className={styles.content}>
            <p
              className={styles.text}
              id={trapFocus ? 'modal-access-description' : 'access-description'}
            >
              Editors can update the Atlas project.
            </p>
            <Button as="button" type="button">
              Review editors
            </Button>
            <CloseFromContext />
          </div>
        </PopoverSurface>
      </Popover>
      <button className={styles.outsideAction} type="button">
        Outside access details
      </button>
      <output aria-label="Access details state">{open ? 'Open' : 'Closed'}</output>
      <output aria-label="Access details events">{events.join(', ') || 'No changes'}</output>
    </div>
  );
}

function NestedAccessPopover() {
  return (
    <Popover positioning={{ position: 'after', offset: 10 }}>
      <PopoverTrigger disableButtonEnhancement>
        <Button as="button" type="button">
          Open editor permissions
        </Button>
      </PopoverTrigger>
      <PopoverSurface className={styles.surface} aria-label="Editor permissions">
        <div className={styles.content}>
          <p className={styles.text}>Editors can publish project updates.</p>
          <Button as="button" type="button">
            Edit permissions
          </Button>
        </div>
      </PopoverSurface>
    </Popover>
  );
}

export function PopoverNestedFlow() {
  return (
    <div className={styles.anchorStage}>
      <Popover positioning={{ position: 'below', offset: 10 }}>
        <PopoverTrigger disableButtonEnhancement>
          <Button as="button" type="button">
            Open project permissions
          </Button>
        </PopoverTrigger>
        <PopoverSurface className={styles.surface} aria-label="Project permissions">
          <div className={styles.content}>
            <p className={styles.text}>Review access before publishing.</p>
            <NestedAccessPopover />
          </div>
        </PopoverSurface>
      </Popover>
      <button type="button">Outside permissions</button>
    </div>
  );
}

export function PopoverAnchorFlow() {
  const [target, setTarget] = React.useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const setAnchor = React.useCallback((node: HTMLElement | null) => {
    if (node !== null && !(node instanceof HTMLButtonElement)) {
      throw new Error('Popover anchor must remain a native button');
    }

    setTarget(node);
  }, []);
  return (
    <div className={styles.flow}>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        Toggle custom anchor
      </button>
      <div className={styles.anchorStage}>
        <Button as="button" ref={setAnchor} type="button">
          Atlas anchor
        </Button>
      </div>
      <Popover
        open={open}
        onOpenChange={(_, data) => setOpen(data.open)}
        positioning={{ target, position: 'below', offset: 10, matchTargetSize: 'width' }}
      >
        <PopoverSurface
          aria-label="Custom anchored information"
          style={{ boxSizing: 'border-box' }}
        >
          Anchored to Atlas, not the toggle.
        </PopoverSurface>
      </Popover>
    </div>
  );
}

export function PopoverContextFlow({
  onOpenChange,
}: {
  onOpenChange?: PopoverProps['onOpenChange'];
}) {
  const [target, setTarget] = React.useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        ref={setTarget}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-details={open ? 'project-context-actions' : undefined}
        onContextMenu={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        Right-click project actions
      </button>
      <Popover
        id="project-context-actions"
        open={open}
        onOpenChange={(event, data) => {
          setOpen(data.open);
          onOpenChange?.(event, data);
        }}
        positioning={{ target, position: 'below', offset: 10 }}
      >
        <PopoverSurface as="div" aria-label="Project context actions">
          <button type="button">Copy project link</button>
        </PopoverSurface>
      </Popover>
    </>
  );
}
