// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Theme-scoped global CSS for the CoreAI provider.
 *
 * Uses `makeStyles` (not `makeStaticStyles`) so the generated class lives
 * *inside* the provider subtree — which means Fluent's theme tokens
 * (`tokens.colorXxx`) resolve to the active light/dark values automatically.
 * No `data-theme` attribute required.
 *
 * The class is applied to `FluentProvider`'s root by `CoreAIFluentProvider`,
 * and the `& *` selector cascades the custom scrollbar to every descendant.
 */
import { makeStyles, tokens } from '@fluentui/react-components';

export const useCoreAIGlobalStyles = makeStyles({
  root: {
    color: tokens.colorNeutralForeground2, // not 1 - thats for headings

    // Responsive letter spacing
    // Apply to each descendant so 1em uses its own font size, not the parent's.
    '& :where(*)': {
      // Font-size threshold: at this size and above, tracking stays at 0.01em.
      '--fui-tracking-threshold': '18px',
      // Add 0.007em of tracking per pixel below the threshold.
      '--fui-tracking-ramp': '0.007',
      // Divide the font-size difference by 1px to get a unitless pixel count.
      // Scale it, add the base tracking, then multiply by 1em to make a length.
      // max() enforces the 0.01em minimum; smaller fonts have no upper limit.
      letterSpacing: `max(
        0.01em,
        calc(
          (0.01 + (var(--fui-tracking-threshold) - 1em) / 1px * var(--fui-tracking-ramp))
          * 1em
        )
      )`,
      // Approximate: 10px 0.066em, 12px 0.052em, 14px 0.038em, 16px 0.024em, 18px+ 0.01em
    },

    scrollbarWidth: 'thin',
    scrollbarColor: `${tokens.colorNeutralStroke1} transparent`,
    '& *': {
      scrollbarWidth: 'thin',
      scrollbarColor: `${tokens.colorNeutralStroke1} transparent`,
    },
  },
});
