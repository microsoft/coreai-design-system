// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Surface / interaction CSS for `Card`, applied via FluentProvider's
 * `customStyleHooks_unstable` (registered as `useCardStyles_unstable`).
 *
 * Runs AFTER Card's default styles with the resolved `CardState`, and may only
 * mutate `state.root.className`. Overrides cover the shadow / pseudo-border
 * reset, size-based radii, per-appearance backgrounds (`filled`,
 * `filled-alternative`, `outline`, `subtle`), and selected / disabled states.
 *
 * Gated on `useComponentDefaults()` so consumers that set
 * `withComponentDefaults={false}` on `CoreAIFluentProvider` (Web / Teams /
 * Teams v2.1) keep stock Fluent Card behavior.
 */
import {
  getSlotClassNameProp_unstable,
  makeStyles,
  mergeClasses,
  shorthands,
} from '@fluentui/react-components';
import type { CardState } from '@fluentui/react-card';
import { useComponentDefaults } from '../contexts/ComponentDefaultsContext.js';

const useStyles = makeStyles({
  overrides: {
    textDecoration: 'none', // if as="a"
    boxShadow: 'unset',

    '&:hover': {
      boxShadow: 'unset',
    },
    '&:active': {
      boxShadow: 'unset',
    },

    // this resets the outline border so we can use a normal border
    '&::after': {
      content: 'unset',
    },
    '&::before': {
      content: 'unset !important',
    },

    border: 'var(--strokeWidthThin) solid transparent',

    '& .fui-Text': {
      // Fluent sets this selector to `color: currentColor` on interactive cards for no discernible reason.
      // This means `<Text/>` components cannot have custom colors!?
      // Setting it to 'null' gives Griffel an invalid value and removes the property entirely.
      color: 'null',
    },
  },

  interactive: {
    cursor: 'pointer',
  },

  selected: {
    backgroundColor: 'var(--colorInteractiveBackgroundSelected)',
    border: 'var(--strokeWidthThin) solid var(--colorNeutralStroke1Selected)',
  },

  disabled: {
    ...shorthands.borderColor('var(--colorNeutralStrokeDisabled)'),
  },

  small: {
    '--fui-Card--border-radius': 'var(--borderRadiusXLarge)',
  },
  medium: {
    '--fui-Card--border-radius': 'var(--borderRadiusXLarge)',
  },
  large: {
    '--fui-Card--border-radius': 'var(--borderRadius2XLarge)',
  },

  // Appearance
  filled: {
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  'filled-alternative': {
    backgroundColor: 'var(--colorNeutralBackground3)',
  },
  outline: {
    border: 'var(--strokeWidthThin) solid var(--colorNeutralStroke1)',
    backgroundColor: 'transparent',
  },
  outlineInteractive: {
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
    '&:active': {
      backgroundColor: 'var(--colorNeutralBackground1Pressed)',
    },
  },
  subtle: {
    backgroundColor: 'transparent',
  },
  subtleInteractive: {
    // matches the side nav hover color (colorNeutralBackground3Hover) instead of Fluent's default colorSubtleBackgroundHover
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground3Hover)',
    },
  },
});

export const useCardStyles = (stateUnknown: unknown): void => {
  // Hooks must run unconditionally; gate via the value, not by skipping calls.
  const enabled = useComponentDefaults();
  const styles = useStyles();

  if (!enabled) {
    return;
  }

  const state = stateUnknown as CardState;
  if (!state.root) {
    return;
  }

  const isInteractive = !state.disabled && (state.interactive || state.selectable);

  const sizeClass = styles[state.size];
  const appearanceClass = styles[state.appearance];
  const selectedClass = state.selected && styles.selected;
  const disabledClass = state.disabled && styles.disabled;

  const interactiveClass = isInteractive && styles.interactive;
  const outlineInteractiveClass =
    isInteractive && state.appearance === 'outline' && styles.outlineInteractive;
  const subtleInteractiveClass =
    isInteractive && state.appearance === 'subtle' && styles.subtleInteractive;

  state.root.className = mergeClasses(
    state.root.className,
    styles.overrides,
    sizeClass,
    appearanceClass,
    interactiveClass,
    outlineInteractiveClass,
    subtleInteractiveClass,
    selectedClass,
    disabledClass,
    getSlotClassNameProp_unstable(state.root),
  );
};
