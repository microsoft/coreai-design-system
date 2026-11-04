// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  DialogComparison,
  dialogExamples,
  type DialogExample,
  type DialogImplementation,
} from './DialogComparison.js';
import {
  captureDialogNativeContract,
  captureDialogStyles,
  compareDialogStyles,
  getComparisonDialog,
  settleDialogStyles,
  type DialogStyleSnapshot,
} from './compareDialogStyles.js';
import styles from './DialogComparison.module.css';

export function DialogComparisonWithReport({
  examples = dialogExamples,
  consumer = false,
}: {
  examples?: readonly DialogExample[];
  consumer?: boolean;
}) {
  const fixtureId = React.useId();
  const selectId = React.useId();
  const legacySnapshot = React.useRef<DialogStyleSnapshot>();
  const [selectedName, setSelectedName] = React.useState(examples[0].name);
  const [phase, setPhase] = React.useState<
    'legacy' | 'between' | 'headless' | 'idle' | 'preview-legacy' | 'preview-headless'
  >('legacy');
  const [report, setReport] = React.useState<{
    example: string;
    legacy?: DialogStyleSnapshot;
    headless?: DialogStyleSnapshot;
    error?: string;
  }>();
  const example = examples.find((candidate) => candidate.name === selectedName) ?? examples[0];
  const implementation: DialogImplementation | undefined =
    phase === 'legacy' || phase === 'preview-legacy'
      ? 'legacy'
      : phase === 'headless' || phase === 'preview-headless'
        ? 'headless'
        : undefined;

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
        const surface = getComparisonDialog(fixtureId, phase);
        await settleDialogStyles(surface);
        if (!active) return;
        const snapshot = {
          styles: captureDialogStyles(surface),
          native: captureDialogNativeContract(surface),
        };
        if (phase === 'legacy') {
          legacySnapshot.current = snapshot;
          setPhase('between');
        } else {
          if (!legacySnapshot.current) throw new Error('Missing sequential legacy capture');
          setReport({
            example: example.name,
            legacy: legacySnapshot.current,
            headless: snapshot,
          });
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
      ? compareDialogStyles(
          report.legacy.styles,
          report.headless.styles,
          example.longContent,
          example.modalType === 'non-modal',
        )
      : undefined;
  const unexpected = differences?.filter((difference) => difference.kind === 'unexpected');
  return (
    <div className={styles.comparison}>
      <p>
        This native migration uses DialogHeader / DialogTitle, a scrollable DialogBody, and
        DialogActions directly inside the native surface. Headless 0.3.2 has no DialogContent,
        Title.action, backdrop slot, or public DialogProvider. The old reference suppresses its
        default non-modal close glyph; the explicit header-close fixture uses the completed Button
        and public trigger in both implementations.
      </p>
      <p>
        Captures open sequentially, then close, so a real modal never makes its reference inert.
        Fonts and finite animations finish before stable-geometry capture. Selected surface,
        content, title, action, divider, and backdrop styles, dimensions, and surface-relative
        offsets are exact. For overflowing content, only the exact viewport-fit deltas caused by the
        old fixed 48px grid allowance versus actual native padding/borders are classified as
        native-viewport-sizing. Native top-layer DOM, grid owner, closed hiding, focus restoration,
        and lack of default legacy motion are intentional changes; native structure is reported
        separately. No geometry tolerance is applied. There are no Dialog size or fullscreen props;
        use consumer CSS for custom sizing.
      </p>
      <p>
        The legacy CoreAI first-div beak selector also reaches the non-modal body divider, applying
        Stroke3 instead of the intended StrokeSubtle divider color, adding a 1px top border and, on
        the mobile grid, exactly 1px to its empty divider row. Those exact legacy-beak-border
        differences are reported, not recreated on a native dialog that has no beak.
      </p>
      <p>
        The old scroll lock can retain the page scrollbar while the current native hook clips body
        overflow. Both actual available viewport widths remain visible in the report. Only exact
        surface/content/title widths and stretched-action widths derived from those viewport widths
        are classified as native-scrollbar-viewport; no scrollbar compensation or legacy scroll-lock
        behavior is added to the component.
      </p>
      <p>
        Modal/alert surfaces require native dialog support. Non-modal surfaces use the Popover API,
        with the installed hook&apos;s dialog.show() fallback when it is absent. Products supporting
        older browsers must load their platform polyfills before rendering. Dialog does not require
        a focusgroup or CSS-anchor polyfill. The default has no animation, so reduced motion needs
        no animation fallback; consumer motion must respect that preference.
      </p>
      <div className={styles.controls}>
        <label htmlFor={selectId}>Dialog visual fixture</label>
        <select
          id={selectId}
          value={selectedName}
          disabled={phase !== 'idle'}
          onChange={(event) => {
            setSelectedName(event.target.value);
            setReport(undefined);
            legacySnapshot.current = undefined;
            setPhase('legacy');
          }}
        >
          {examples.map((candidate) => (
            <option key={candidate.name}>{candidate.name}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={phase !== 'idle'}
          onClick={() => setPhase('preview-legacy')}
        >
          Inspect legacy dialog
        </button>
        <button
          type="button"
          disabled={phase !== 'idle'}
          onClick={() => setPhase('preview-headless')}
        >
          Inspect native dialog
        </button>
        <span data-testid="dialog-report-pointer-rest">Open-stable comparisons</span>
      </div>
      <DialogComparison
        key={example.name}
        fixtureId={fixtureId}
        example={example}
        openImplementation={implementation}
        onClose={() => {
          if (phase.startsWith('preview-')) setPhase('idle');
        }}
      />
      <output
        className={styles.report}
        aria-label="Dialog style report"
        data-dialog-report-state={report ? (report.error ? 'error' : 'ready') : 'comparing'}
        data-dialog-report-example={report?.example}
        data-dialog-report-phase={phase}
        data-dialog-difference-count={differences?.length}
        data-dialog-unexpected-count={unexpected?.length}
      >
        {report?.error
          ? `Comparison failed: ${report.error}`
          : !report
            ? 'Capturing sequential open dialogs…'
            : consumer
              ? 'Intentional consumer cascade example.'
              : unexpected?.length
                ? `${unexpected.length} unexpected differences.`
                : 'No unexpected differences in the selected properties.'}
        {report &&
          `\n${JSON.stringify(
            {
              differences,
              selectedPropertyCount: report.headless
                ? Object.keys(report.headless.styles).length
                : 0,
              legacy: report.legacy?.native,
              headless: report.headless?.native,
            },
            null,
            2,
          )}`}
      </output>
    </div>
  );
}
