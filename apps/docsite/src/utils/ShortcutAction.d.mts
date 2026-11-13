// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export type ShortcutAction =
  | 'cycle-theme'
  | 'toggle-navigation'
  | 'collapse-navigation'
  | 'expand-navigation'
  | 'previous-page'
  | 'next-page'
  | 'focus-search';

export interface ShortcutEvent {
  key: string;
  code?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean;
  isComposing?: boolean;
  defaultPrevented?: boolean;
  getModifierState?: (key: string) => boolean;
}

export function getShortcutAction(
  event: ShortcutEvent,
  options: {
    editable: boolean;
    isApplePlatform: boolean;
  },
): ShortcutAction | null;
