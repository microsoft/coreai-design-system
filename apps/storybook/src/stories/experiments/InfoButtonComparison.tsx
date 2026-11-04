// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { InfoButton as LegacyInfoButton } from '@coreai-ds/react-components';
import {
  InfoButton,
  type InfoButtonProps,
  type PopoverAppearance,
  type PopoverSize,
} from '@coreai-ds/react-headless-components';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  captureInfoButtonStyles,
  compareInfoButtonStyles,
  getComparisonInfoButton,
  refreshInformationPositioning,
  settleInfoButtonStyles,
  type InfoButtonStyleDifference,
} from './compareInfoButtonStyles.js';
import { capturePopoverNativeContract } from './comparePopoverStyles.js';
import styles from './InfoButtonComparison.module.css';

export const infoButtonSizes = ['small', 'medium', 'large'] as const;

export interface InfoButtonExample {
  name: string;
  size?: InfoButtonProps['size'];
  children?: React.ReactNode;
  customChildren?: boolean;
  content?: React.ReactNode;
  appearance?: PopoverAppearance;
  popoverSize?: PopoverSize;
  consumer?: boolean;
}

export const infoButtonExamples: readonly InfoButtonExample[] = [
  { name: 'Medium information' },
  { name: 'Small information', size: 'small' },
  { name: 'Large information', size: 'large' },
  { name: 'Explicit undefined size', size: undefined },
  {
    name: 'Rich content',
    content: (
      <>
        Editors can update project settings. <a href="#access-guide">Read the access guide</a>.
      </>
    ),
  },
  {
    name: 'Custom button content',
    children: (
      <span className={styles.customGlyph} aria-hidden>
        ?
      </span>
    ),
    customChildren: true,
  },
  { name: 'Explicit null button content', children: null, customChildren: true },
  { name: 'Inverted surface', appearance: 'inverted' },
  { name: 'Explicit large surface padding', popoverSize: 'large' },
];

export const infoButtonConsumerExample: InfoButtonExample = {
  name: 'Consumer CSS Modules',
  consumer: true,
};

interface FixtureSurfaceProps {
  children: React.ReactNode;
  'aria-label': string;
  className: string;
  'data-information-fixture': string;
  'data-information-implementation': 'legacy' | 'headless';
}

export function InfoButtonComparison({
  example = infoButtonExamples[0],
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example?: InfoButtonExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <section
      className={styles.comparison}
      data-information-comparison={fixtureId}
      data-information-example={example.name}
    >
      <div className={styles.columns}>
        <strong>CoreAI custom InfoButton / Griffel</strong>
        <strong>CoreAI custom InfoButton / native headless</strong>
      </div>
      <div className={styles.columns}>
        {(['legacy', 'headless'] as const).map((implementation) => {
          const positioningRef =
            implementation === 'legacy' ? legacyPositioningRef : headlessPositioningRef;
          const info: FixtureSurfaceProps = {
            children: example.content ?? 'Editors can update project settings.',
            'aria-label': 'Project access information',
            className: [styles.surface, example.consumer && styles.consumerSurface]
              .filter(Boolean)
              .join(' '),
            'data-information-fixture': fixtureId,
            'data-information-implementation': implementation,
          };
          const buttonProps = {
            size: example.size,
            className: example.consumer ? styles.consumerButton : '',
            ...(example.customChildren ? { children: example.children } : {}),
          };
          const popover = {
            open: true,
            appearance: example.appearance,
            size: example.popoverSize ?? (example.size === 'large' ? 'medium' : 'small'),
            positioning: {
              position: 'above' as const,
              align: 'center' as const,
              positioningRef,
            },
          };
          return (
            <div
              key={implementation}
              className={styles.cell}
              data-information-cell={implementation}
            >
              <span>Project access</span>{' '}
              {implementation === 'legacy' ? (
                <LegacyInfoButton
                  {...buttonProps}
                  aria-label="About project access"
                  info={info}
                  popover={{ ...popover, surfaceMotion: null }}
                />
              ) : (
                <InfoButton
                  {...buttonProps}
                  aria-label="About project access"
                  info={info}
                  popover={popover}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function InfoButtonComparisonWithReport({
  examples = infoButtonExamples,
  consumer = false,
}: {
  examples?: readonly InfoButtonExample[];
  consumer?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const legacyRef = React.useRef<PositioningImperativeRef>(null);
  const headlessRef = React.useRef<PositioningImperativeRef>(null);
  const selectId = React.useId();
  const [selected, setSelected] = React.useState(examples[0].name);
  const example = examples.find((candidate) => candidate.name === selected) ?? examples[0];
  const [report, setReport] = React.useState<{
    example: string;
    differences: InfoButtonStyleDifference[];
    native: Record<string, string>;
    error?: string;
  } | null>(null);
  React.useEffect(() => {
    let active = true;
    const compare = async () => {
      try {
        if (!ref.current) throw new Error('Information comparison is not mounted');
        const legacy = getComparisonInfoButton(ref.current, 'legacy');
        const headless = getComparisonInfoButton(ref.current, 'headless');
        await Promise.all([settleInfoButtonStyles(legacy), settleInfoButtonStyles(headless)]);
        if (!legacyRef.current || !headlessRef.current) {
          throw new Error('Information positioning handles are unavailable');
        }
        await refreshInformationPositioning(
          legacy,
          headless,
          legacyRef.current,
          headlessRef.current,
        );
        if (!active) return;
        setReport({
          example: example.name,
          differences: compareInfoButtonStyles(
            captureInfoButtonStyles(legacy),
            captureInfoButtonStyles(headless),
            example.popoverSize ?? (example.size === 'large' ? 'medium' : 'small'),
          ),
          native: capturePopoverNativeContract(headless.surface),
        });
      } catch (reason) {
        if (active) {
          setReport({
            example: example.name,
            differences: [],
            native: {},
            error: reason instanceof Error ? reason.message : String(reason),
          });
        }
      }
    };
    void compare();
    return () => {
      active = false;
    };
  }, [example]);
  const unexpected = report?.differences.filter((difference) => difference.kind === 'unexpected');
  return (
    <div>
      <p>
        CoreAI&apos;s required accessible-name union and primitive-content naming are preserved.
        InfoLabel uses a private current-base adapter, not this stricter standalone wrapper. Only
        one native information popup is compared at a time. Both public positioning handles refresh
        after layout changes; capture awaits stable live geometry.
      </p>
      <p>
        The current native Popover keeps its dialog, top-layer hiding, and CSS anchors. The
        completed PopoverSurface supplies its defaults-gated CoreAI border and visual context.
        Legacy-only arrow gap is explicitly classified using the existing Popover comparator;
        offsets and computed strings remain exact. Glyphs are style-free public SVG entries. No
        legacy inline/Portal or motion API is added.
      </p>
      <p>
        Like the completed Popover report, these visual fixtures use a centered 240px surface and
        integer-sized anchors. This avoids legacy Floating UI rounding and its arrow
        middleware&apos;s extra shift for narrow start-aligned targets. The component&apos;s actual
        above-start default is unchanged; native default-edge alignment is checked separately, not
        emulated.
      </p>
      <label htmlFor={selectId}>InfoButton visual fixture</label>{' '}
      <select
        id={selectId}
        value={selected}
        onChange={(event) => {
          setReport(null);
          setSelected(event.target.value);
        }}
      >
        {examples.map((candidate) => (
          <option key={candidate.name}>{candidate.name}</option>
        ))}
      </select>
      <span className={styles.pointerRest} data-testid="information-pointer-rest">
        Rest pointer here
      </span>
      <div ref={ref}>
        <InfoButtonComparison
          key={example.name}
          example={example}
          legacyPositioningRef={legacyRef}
          headlessPositioningRef={headlessRef}
        />
      </div>
      <output
        className={styles.report}
        aria-label="InfoButton style report"
        data-infobutton-report-state={report ? (report.error ? 'error' : 'ready') : 'comparing'}
        data-infobutton-report-example={report?.example}
        data-infobutton-fixture-count={report && !report.error ? 1 : undefined}
        data-infobutton-unexpected-count={report?.error ? undefined : unexpected?.length}
      >
        {report?.error ||
          (report
            ? consumer
              ? 'Intentional consumer cascade example.'
              : `${unexpected?.length} unexpected selected-style differences.`
            : 'Comparing information surfaces…')}
        {report &&
          `\n${JSON.stringify({ differences: report.differences, native: report.native }, null, 2)}`}
      </output>
    </div>
  );
}

export function InfoButtonHelpFlow() {
  const [events, setEvents] = React.useState<string[]>([]);
  const [actions, setActions] = React.useState(0);
  return (
    <div className={styles.flow}>
      <button type="button">Before project information</button>
      <InfoButton
        aria-label="About project access"
        info={{
          'aria-label': 'Project access details',
          children: (
            <>
              Editors can update project settings.
              <button type="button" onClick={() => setActions((count) => count + 1)}>
                Review project access
              </button>
            </>
          ),
        }}
        popover={{
          positioning: 'below-start',
          onOpenChange: (_, data) => {
            setEvents((previous) => [...previous, `${data.type}:${data.open ? 'open' : 'closed'}`]);
          },
        }}
      />
      <button type="button">Outside project information</button>
      <output aria-label="Information events">{events.join(', ') || 'No overlay events'}</output>
      <output aria-label="Information action count">{actions}</output>
    </div>
  );
}
