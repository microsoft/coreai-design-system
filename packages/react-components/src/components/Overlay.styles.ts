// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Shared CSS overrides for floating surfaces — `Dialog`, `Popover`,
 * `Tooltip`, and `Menu` — applied via FluentProvider's
 * `customStyleHooks_unstable`.
 *
 * Wired into the matching slot hooks in `../contexts/styleHooks.ts`:
 *   - useDialogSurfaceStyles_unstable
 *   - usePopoverSurfaceStyles_unstable
 *   - useTooltipStyles_unstable
 *   - useMenuPopoverStyles_unstable
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

const useStyles = makeStyles({
  overlay: {
    border: 'var(--strokeWidthThin) solid var(--colorNeutralStroke3)',

    // this element is the "beak" or "pointer" from popper.js
    '& > div:first-child::before': {
      border: 'var(--strokeWidthThin) solid var(--colorNeutralStroke3)',
    },
  },
});

export const useOverlayStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();

  if (!enabled) {
    return;
  }

  // Dialog / Popover / Menu expose their visible surface as `root`; Tooltip
  // only has a `content` slot (it has no `root`). Apply to whichever the
  // component renders so the same hook covers all four.
  const state = stateUnknown as {
    root?: { className?: string };
    content?: { className?: string };
  };
  const slot = state.root ?? state.content;
  if (!slot) {
    return;
  }

  slot.className = mergeClasses(
    slot.className,
    styles.overlay,
    getSlotClassNameProp_unstable(slot),
  );
};
