// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Tag CSS override, applied via FluentProvider's `customStyleHooks_unstable`.
 *
 * Resets the `primaryText` slot's `padding-bottom` to 0. Both `Tag` and
 * `InteractionTagPrimary` render a `.fui-Tag__primaryText` span whose stock
 * styles add bottom padding; this trims it so the text sits flush.
 *
 * Wired into the matching slot hooks in `../contexts/styleHooks.ts`:
 *   - useTagStyles_unstable
 *   - useInteractionTagPrimaryStyles_unstable
 *   - useInteractionTagSecondaryStyles_unstable
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
  primaryText: {
    paddingBottom: 0,
  },
  secondaryRoot: {
    borderLeft: 'unset',
    marginLeft: '1px',
  },
});

export const useTagStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();

  if (!enabled) {
    return;
  }

  // Both `TagState` and `InteractionTagPrimaryState` expose a `primaryText`
  // slot rendered as `.fui-Tag__primaryText`.
  const state = stateUnknown as {
    primaryText?: { className?: string };
  };
  if (!state.primaryText) {
    return;
  }

  state.primaryText.className = mergeClasses(
    state.primaryText.className,
    styles.primaryText,
    getSlotClassNameProp_unstable(state.primaryText),
  );
};

export const useInteractionTagSecondaryStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();

  if (!enabled) {
    return;
  }

  // `InteractionTagSecondaryState` renders a single `root` button slot.
  const state = stateUnknown as {
    root?: { className?: string };
    appearance?: string;
  };
  // The outline appearance keeps its full border — skip the reset there.
  if (!state.root || state.appearance === 'outline') {
    return;
  }

  state.root.className = mergeClasses(
    state.root.className,
    styles.secondaryRoot,
    getSlotClassNameProp_unstable(state.root),
  );
};
