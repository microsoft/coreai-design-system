// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Dialog-specific CSS overrides, applied via FluentProvider's
 * `customStyleHooks_unstable`. Each Fluent Dialog sub-component gets its
 * own slot hook so the rules sit on the slot they're styling instead of
 * being chained off descendant selectors on the surface.
 *
 * - `useDialogStyles`        → `useDialogSurfaceStyles_unstable`
 * - `useDialogBodyStyles`    → `useDialogBodyStyles_unstable`
 * - `useDialogContentStyles` → `useDialogContentStyles_unstable`
 *
 * `useDialogStyles` also composes the shared `useOverlayStyles` so the
 * Dialog surface keeps the floating-surface border used by Popover /
 * Tooltip / Menu.
 *
 * The `--fui-Dialog--spacing` CSS variable is declared on the surface and
 * inherits down to DialogBody / DialogContent via the normal cascade.
 *
 * Gated on `useComponentDefaults()` so Web / Teams / Teams v2.1 (or any
 * consumer that sets `withComponentDefaults={false}` on `CoreAIFluentProvider`)
 * gets stock Fluent behavior.
 */
import {
  getSlotClassNameProp_unstable,
  makeStyles,
  mergeClasses,
} from '@fluentui/react-components';
import { useComponentDefaults } from '../contexts/ComponentDefaultsContext.js';
import { useOverlayStyles } from './Overlay.styles.js';

const useStyles = makeStyles({
  // mimic the way card spacing is handled — if adding a `size` prop, update this
  surface: {
    '--fui-Dialog--spacing': 'var(--spacingHorizontalL)',
    padding: 'var(--fui-Dialog--spacing)',
  },

  body: {
    gap: 'var(--fui-Dialog--spacing)',

    // a divider between the DialogBody and DialogActions
    '&::before': {
      content: '""',
      gridArea: '-2 / 1 / -2 / -1',
      alignSelf: 'end',
      marginRight: 'calc(-1 * var(--fui-Dialog--spacing))',
      marginLeft: 'calc(-1 * var(--fui-Dialog--spacing))',
      height: '0',
      borderBottom: 'var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle)',
      pointerEvents: 'none',
    },
  },

  content: {
    // puts scrollbar on the right edge
    margin: '0 calc(-1 * var(--fui-Dialog--spacing))',
    padding: 'var(--fui-Dialog--spacing)',
    paddingTop: '0',
  },
});

type RootState = { root?: { className?: string } };

const applyToRoot = (stateUnknown: unknown, className: string): void => {
  const state = stateUnknown as RootState;
  if (!state.root) {
    return;
  }
  // 3-tier priority: stock default < CoreAI theme < instance className.
  // See Table.styles.ts for the detailed rationale.
  state.root.className = mergeClasses(
    state.root.className,
    className,
    getSlotClassNameProp_unstable(state.root),
  );
};

export const useDialogStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();

  // Always layer the shared overlay treatment first.
  useOverlayStyles(stateUnknown);

  if (!enabled) {
    return;
  }
  applyToRoot(stateUnknown, styles.surface);
};

export const useDialogBodyStyles = (stateUnknown: unknown): void => {
  const enabled = useComponentDefaults();
  const styles = useStyles();
  if (!enabled) {
    return;
  }
  applyToRoot(stateUnknown, styles.body);
};

export const useDialogContentStyles = (stateUnknown: unknown): void => {
  const enabled = useComponentDefaults();
  const styles = useStyles();
  if (!enabled) {
    return;
  }
  applyToRoot(stateUnknown, styles.content);
};
