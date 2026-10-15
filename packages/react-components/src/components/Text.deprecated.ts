// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Deprecated Fluent `Text` preset components (e.g. `Body1`, `Caption1`).
 *
 * The CoreAI design system standardizes on the `Text` component with
 * explicit `size` and `weight` props rather than the fixed typography-ramp
 * presets Fluent ships (one component per ramp step). The presets are kept
 * available here — re-exported as-is and flagged `@deprecated` — for
 * advanced or legacy scenarios that still need them.
 *
 * All presets share the same `TextPresetProps` type (`TextProps` minus
 * `font`, `size`, and `weight`, which the preset fixes), so only one type
 * re-export is needed.
 *
 * Imported from `@fluentui/react-components` (the same surface the barrel
 * re-exports) so there is a single upstream source.
 */

// --- Components (deprecated) -------------------------------------------------
export {
  /** @deprecated Use the CoreAI `Text` component with `preset="body"` instead. */
  Body1,
  /** @deprecated Use the CoreAI `Text` component with `preset="bodyStrong"` instead. */
  Body1Strong,
  /** @deprecated Use the CoreAI `Text` component with `size={300}` and `weight="bold"` instead. */
  Body1Stronger,
  /** @deprecated Use the CoreAI `Text` component with `size={400}` and `weight="regular"` instead. */
  Body2,
  /** @deprecated Use the CoreAI `Text` component with `preset="bodyS"` instead. */
  Caption1,
  /** @deprecated Use the CoreAI `Text` component with `preset="bodySStrong"` instead. */
  Caption1Strong,
  /** @deprecated Use the CoreAI `Text` component with `size={200}` and `weight="bold"` instead. */
  Caption1Stronger,
  /** @deprecated Use the CoreAI `Text` component with `preset="bodyXS"` instead. */
  Caption2,
  /** @deprecated Use the CoreAI `Text` component with `preset="bodyXSStrong"` instead. */
  Caption2Strong,
  /** @deprecated Use the CoreAI `Text` component with `size={1000}` and `weight="semibold"` instead. */
  Display,
  /** @deprecated Use the CoreAI `Text` component with `preset="heading1"` instead. */
  LargeTitle,
  /** @deprecated Use the CoreAI `Text` component with `preset="heading3"` instead. */
  Subtitle1,
  /** @deprecated Use the CoreAI `Text` component with `preset="heading4"` instead. */
  Subtitle2,
  /** @deprecated Use the CoreAI `Text` component with `size={400}` and `weight="bold"` instead. */
  Subtitle2Stronger,
  /** @deprecated Use the CoreAI `Text` component with `size={800}` and `weight="semibold"` instead. */
  Title1,
  /** @deprecated Use the CoreAI `Text` component with `preset="heading2"` instead. */
  Title2,
  /** @deprecated Use the CoreAI `Text` component with `size={600}` and `weight="semibold"` instead. */
  Title3,
} from '@fluentui/react-components';

// --- Shared preset type (not deprecated) -------------------------------------
export type { TextPresetProps } from '@fluentui/react-components';
