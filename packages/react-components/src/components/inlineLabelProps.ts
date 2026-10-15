// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Shared prop surface for the input-family wrappers (`Input`, `Combobox`,
 * `Dropdown`): an inline `label` rendered inside the control plus the
 * `dynamicWidth` / `truncateTextOverflow` sizing knobs.
 *
 * `dynamicWidth` is only valid alongside `label` — the discriminated union
 * enforces this at the type level (`dynamicWidth?: never` without a `label`).
 */
export type InlineLabelProps = {
  /** Controls text overflow behavior for the value. When true, long text is truncated with an ellipsis. */
  truncateTextOverflow?: boolean;
} & (
  | {
      /** Optional inline label rendered inside the control, before the value. */
      label: string;
      /**
       * Collapse the control to its content width when nothing is selected and
       * grow it with the typed/selected content. Only available when `label` is set.
       */
      dynamicWidth?: boolean;
    }
  | {
      /** Optional inline label rendered inside the control, before the value. */
      label?: undefined;
      dynamicWidth?: never;
    }
);
