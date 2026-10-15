// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { getShortcutAction } from '../src/utils/shortcut-action.mjs';

const event = {
  key: 's',
  code: 'KeyS',
  metaKey: false,
  ctrlKey: false,
  altKey: true,
  shiftKey: false,
  repeat: false,
  isComposing: false,
  defaultPrevented: false,
};

test('Option/Alt shortcuts map to navigation, theme, and adjacent pages', () => {
  for (const isApplePlatform of [true, false]) {
    const options = { editable: false, isApplePlatform };
    for (const [code, key, action] of [
      ['KeyS', 's', 'toggle-navigation'],
      ['KeyS', 'ß', 'toggle-navigation'],
      ['KeyM', 'µ', 'cycle-theme'],
      ['ArrowUp', 'ArrowUp', 'previous-page'],
      ['ArrowDown', 'ArrowDown', 'next-page'],
    ]) {
      assert.equal(getShortcutAction({ ...event, code, key }, options), action);
    }
    for (const key of ['n', 'N', 'm', 'M', 's']) {
      assert.equal(getShortcutAction({ ...event, code: '', key, altKey: false }, options), null);
    }
    for (const code of ['ArrowLeft', 'ArrowRight', 'KeyT', 'KeyA']) {
      assert.equal(getShortcutAction({ ...event, code }, options), null);
    }
  }
});

test('collapse-all and search use Command on Mac and Control on Windows', () => {
  for (const isApplePlatform of [true, false]) {
    const options = { editable: false, isApplePlatform };
    const primaryEvent = {
      ...event,
      altKey: false,
      metaKey: isApplePlatform,
      ctrlKey: !isApplePlatform,
    };
    const collapse = { ...primaryEvent, key: 'ArrowUp', code: 'ArrowUp', shiftKey: true };
    assert.equal(getShortcutAction(collapse, options), 'collapse-navigation');
    assert.equal(getShortcutAction(collapse, { ...options, editable: true }), null);
    const expand = { ...primaryEvent, key: 'ArrowDown', code: 'ArrowDown', shiftKey: true };
    assert.equal(getShortcutAction(expand, options), 'expand-navigation');
    assert.equal(getShortcutAction(expand, { ...options, editable: true }), null);
    const search = { ...primaryEvent, key: 'k', code: 'KeyK' };
    assert.equal(getShortcutAction(search, options), 'focus-search');
    assert.equal(getShortcutAction(search, { ...options, editable: true }), 'focus-search');
    for (const shortcut of [collapse, expand, search]) {
      assert.equal(
        getShortcutAction(shortcut, { ...options, isApplePlatform: !isApplePlatform }),
        null,
      );
      assert.equal(getShortcutAction({ ...shortcut, altKey: true }, options), null);
    }
  }
});

test('shortcuts ignore editing, extra modifiers, repeats, composition, and handled events', () => {
  const options = { editable: false, isApplePlatform: true };
  assert.equal(getShortcutAction(event, { ...options, editable: true }), null);
  for (const flag of [
    'metaKey',
    'ctrlKey',
    'shiftKey',
    'repeat',
    'isComposing',
    'defaultPrevented',
  ]) {
    assert.equal(getShortcutAction({ ...event, [flag]: true }, options), null, flag);
  }
  assert.equal(
    getShortcutAction({ ...event, getModifierState: (key) => key === 'AltGraph' }, options),
    null,
  );
});
