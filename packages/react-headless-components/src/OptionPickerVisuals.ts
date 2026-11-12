// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export type OptionPickerVisualProps = {
  /** Matches CoreAI, including with component defaults disabled. @default 'filled-darker' */
  appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
  /** Inherits Field size when omitted. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /** Ellipsis-clip long displayed text without changing its accessible value. */
  truncateTextOverflow?: boolean;
} & (
  | {
      /** Inline control label. */
      label: string;
      /** Allow content-sized layout. Only supported with an inline label. */
      dynamicWidth?: boolean;
    }
  | {
      label?: undefined;
      dynamicWidth?: never;
    }
);
