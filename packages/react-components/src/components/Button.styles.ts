// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Button-family CSS override, applied via FluentProvider's
 * `customStyleHooks_unstable`.
 *
 * Sets a smaller default `min-width` (40px) on the button root, replacing
 * Fluent's stock 96px. The native value lives in a low-priority
 * `makeResetStyles` base class, so this atomic `makeStyles` rule wins when
 * merged onto the root.
 *
 * Registered for every standalone button that renders its own button slot:
 *   - `useButtonStyles_unstable`         (also covers `CopyButton`, which
 *                                         renders the wrapped `Button`)
 *   - `useMenuButtonStyles_unstable`
 *   - `useToggleButtonStyles_unstable`
 *   - `useCompoundButtonStyles_unstable`
 *   - `useSplitButtonStyles_unstable`
 *
 * Gated on `useComponentDefaults()` so Web / Teams / Teams v2.1 (or any
 * consumer that sets `withComponentDefaults={false}` on `CoreAIFluentProvider`)
 * gets stock Fluent behavior.
 */
import {
  getSlotClassNameProp_unstable,
  makeStyles,
  mergeClasses,
  type ButtonState,
  type ToggleButtonState,
} from '@fluentui/react-components';
import { useComponentDefaults } from '../contexts/ComponentDefaultsContext.js';

const useStyles = makeStyles({
  root: {
    minWidth: '40px',
  },
});

export const useButtonStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();
  if (!enabled) {
    return;
  }

  const state = stateUnknown as ButtonState | ToggleButtonState; // could be others, but typing is fine

  // Icon-only buttons are square — the wider min-width would distort them.
  if (!state.root || state.iconOnly) {
    return;
  }

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  );
};
