// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function getShortcutAction(event, options) {
  // Option changes event.key on macOS (for example, Option+S produces "ß").
  const key = event.code || event.key.toLowerCase();
  if (
    event.repeat ||
    event.isComposing ||
    event.defaultPrevented ||
    event.getModifierState?.('AltGraph')
  ) {
    return null;
  }
  const primaryModifier = options.isApplePlatform
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  if (primaryModifier && !event.altKey && !event.shiftKey && (key === 'KeyK' || key === 'k')) {
    return 'focus-search';
  }
  if (options.editable) {
    return null;
  }
  if (
    primaryModifier &&
    event.shiftKey &&
    !event.altKey &&
    (key === 'ArrowUp' || key === 'arrowup')
  ) {
    return 'collapse-navigation';
  }
  if (
    primaryModifier &&
    event.shiftKey &&
    !event.altKey &&
    (key === 'ArrowDown' || key === 'arrowdown')
  ) {
    return 'expand-navigation';
  }
  if (event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    switch (key) {
      case 'KeyS':
      case 's':
        return 'toggle-navigation';
      case 'KeyM':
      case 'm':
        return 'cycle-theme';
      case 'ArrowUp':
      case 'arrowup':
        return 'previous-page';
      case 'ArrowDown':
      case 'arrowdown':
        return 'next-page';
    }
  }
  return null;
}
