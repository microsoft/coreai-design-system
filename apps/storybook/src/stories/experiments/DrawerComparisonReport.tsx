// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DrawerComparison,
  drawerExamples,
  type DrawerExample,
  type DrawerImplementation,
} from './DrawerComparison.js';
import {
  DRAWER_COMPARISON_PROPERTY_COUNT,
  captureDrawerNativeContract,
  captureDrawerStyles,
  compareDrawerStyles,
  getComparisonDrawer,
  settleDrawerStyles,
  type DrawerStyleSnapshot,
} from './compareDrawerStyles.js';
import styles from './DrawerComparison.module.css';

export function DrawerComparisonWithReport({
  examples = drawerExamples,
}: {
  examples?: readonly DrawerExample[];
}) {
  const fixtureId = React.useId();
  const selectId = React.useId();
  const legacySnapshot = React.useRef<DrawerStyleSnapshot>();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [phase, setPhase] = React.useState<
    'legacy' | 'between' | 'headless' | 'idle' | 'preview-legacy' | 'preview-headless'
  >('legacy');
  const [report, setReport] = React.useState<{
    example: string;
    legacy?: DrawerStyleSnapshot;
    headless?: DrawerStyleSnapshot;
    error?: string;
  }>();
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const implementation: DrawerImplementation | undefined =
    phase === 'legacy' || phase === 'preview-legacy'
      ? 'legacy'
      : phase === 'headless' || phase === 'preview-headless'
        ? 'headless'
        : undefined;
  const capturing = phase === 'legacy' || phase === 'between' || phase === 'headless';

  React.useEffect(() => {
    if (phase !== 'legacy' && phase !== 'between' && phase !== 'headless') return;
    let active = true;
    const capture = async () => {
      if (phase === 'between') {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (active) setPhase('headless');
        return;
      }
      try {
        const surface = getComparisonDrawer(fixtureId, phase);
        await settleDrawerStyles(surface);
        if (!active) return;
        const snapshot = {
          styles: captureDrawerStyles(surface),
          native: captureDrawerNativeContract(surface),
        };
        if (Object.keys(snapshot.styles).length !== DRAWER_COMPARISON_PROPERTY_COUNT) {
          throw new Error('Drawer report captured an incomplete selected-property set');
        }
        if (phase === 'legacy') {
          legacySnapshot.current = snapshot;
          setPhase('between');
        } else {
          if (!legacySnapshot.current) throw new Error('Missing sequential legacy Drawer capture');
          setReport({ example: example.name, legacy: legacySnapshot.current, headless: snapshot });
          setPhase('idle');
        }
      } catch (error) {
        if (active) {
          setReport({
            example: example.name,
            error: error instanceof Error ? error.message : String(error),
          });
          setPhase('idle');
        }
      }
    };
    void capture();
    return () => {
      active = false;
    };
  }, [example, fixtureId, phase]);

  const differences =
    report?.legacy && report.headless
      ? compareDrawerStyles(report.legacy.styles, report.headless.styles, example)
      : undefined;
  const unexpected = differences?.filter((difference) => difference.kind === 'unexpected');
  return (
    <div className={styles.comparison}>
      <p>
        Drawer uses the public headless 0.4.1 facade. OverlayDrawer is a controlled native
        dialog; InlineDrawer stays in page flow. There are no Drawer CoreAI defaults or overrides.
        Size and inline separator are visual props, removed before the hooks. DrawerHeaderTitle
        retains its actual heading/action slots and composes the completed DialogTitle typography
        foundation. No legacy Drawer aliases, backdrop DOM slots, portals, mount nodes, focus
        manager, or motion compatibility controller are recreated.
      </p>
      <p>
        Captures open sequentially, then close, so a native modal never makes its reference inert.
        Fonts and finite animations settle before selected surface, body, header, title, action,
        navigation, footer, separator, backdrop, dimensions, and viewport-edge capture. The report
        reserves 384px to keep geometry stable. Exact derived viewport/scrollbar differences are
        reported separately; all remaining selected styles and offsets must match without geometry
        tolerance. Consumer CSS intentionally takes ordinary unlayered priority. Legacy bottom
        drawers keep auto inline insets; in RTL their retained page scrollbar shifts the 100vw
        surface left by exactly the measured gutter. Native bottom drawers instead anchor both
        viewport edges. This exact old positioning difference is reported, not recreated.
      </p>
      <p>
        Modal/alert drawers require native dialog support. Non-modal drawers use the Popover API;
        0.4.1 has no dialog.show() fallback. Focus trapping, inertness, restoration, native
        cancel, and top-layer nesting remain browser-owned. Drawers need neither a focusgroup nor an
        anchor-positioning polyfill; any older-browser platform polyfill is consumer-owned.
        OverlayDrawer has no defaultOpen, appearance, orientation, or backdrop props in this facade.
        Kept-mounted inline content collapses and becomes visibility-hidden; local state survives.
        For forms that close a drawer, prefer controlled onSubmit: bare method=&quot;dialog&quot;
        closes natively and reports onOpenChange(false); a still-true controlled open stays closed.
      </p>
      <div className={styles.controls}>
        <label htmlFor={selectId}>Drawer visual fixture</label>
        <select
          id={selectId}
          value={selectedName}
          disabled={capturing}
          onChange={(event) => {
            setSelectedName(event.currentTarget.value);
            setReport(undefined);
            legacySnapshot.current = undefined;
            setPhase('legacy');
          }}
        >
          {examples.map((candidate) => (
            <option key={candidate.name}>{candidate.name}</option>
          ))}
        </select>
        <button type="button" disabled={capturing} onClick={() => setPhase('preview-legacy')}>
          Inspect legacy drawer
        </button>
        <button type="button" disabled={capturing} onClick={() => setPhase('preview-headless')}>
          Inspect native drawer
        </button>
        <span data-testid="drawer-report-pointer-rest">Open-stable comparisons</span>
      </div>
      <DrawerComparison
        key={example.name}
        fixtureId={fixtureId}
        example={example}
        openImplementation={implementation}
        onClose={() => {
          if (phase.startsWith('preview-')) setPhase('idle');
        }}
      />
      <output
        aria-label="Drawer style report"
        role="status"
        className={styles.report}
        data-drawer-report-state={report?.error ? 'error' : differences ? 'ready' : 'capturing'}
        data-drawer-report-phase={phase}
        data-drawer-report-example={report?.example ?? ''}
        data-drawer-unexpected-count={unexpected?.length ?? ''}
        data-drawer-comparison-count={
          report?.headless ? Object.keys(report.headless.styles).length : ''
        }
      >
        {report?.error
          ? report.error
          : report?.legacy && report.headless
            ? JSON.stringify(
                {
                  selectedProperties: DRAWER_COMPARISON_PROPERTY_COUNT,
                  differences,
                  legacyNative: report.legacy.native,
                  headlessNative: report.headless.native,
                },
                null,
                2,
              )
            : 'Capturing the legacy and native drawers sequentially…'}
      </output>
    </div>
  );
}
