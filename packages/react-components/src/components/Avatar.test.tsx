// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Avatar } from './Avatar.js';

afterEach(cleanup);

const testInitialsClassName = 'coreai-test-avatar-initials';
const testInitialsProps = { className: testInitialsClassName };

const getInitialsBackground = (avatar: Element) => {
  const initials = avatar.querySelector(`.${testInitialsClassName}`);

  expect(initials).not.toBeNull();

  return getComputedStyle(initials!).backgroundColor;
};

test('uses the neutral background by default', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Avatar name="Default avatar" initials={testInitialsProps} />
      <Avatar name="Neutral avatar" color="neutral" initials={testInitialsProps} />
    </>,
  );

  expect(getInitialsBackground(screen.getByLabelText('Default avatar').element())).toBe(
    getInitialsBackground(screen.getByLabelText('Neutral avatar').element()),
  );
});

test('uses a distinct neutral-alt background', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Avatar name="Neutral avatar" color="neutral" initials={testInitialsProps} />
      <Avatar name="Alternate neutral avatar" color="neutral-alt" initials={testInitialsProps} />
    </>,
  );

  expect(
    getInitialsBackground(
      screen.getByLabelText('Alternate neutral avatar', { exact: true }).element(),
    ),
  ).not.toBe(
    getInitialsBackground(screen.getByLabelText('Neutral avatar', { exact: true }).element()),
  );
});

test('allows consumer background styles to override the neutral background', async () => {
  const screen = await renderCoreAIComponent(
    <Avatar
      name="Custom avatar"
      initials={{
        ...testInitialsProps,
        style: { backgroundColor: 'rgb(255, 0, 0)' },
      }}
    />,
  );

  expect(getInitialsBackground(screen.getByLabelText('Custom avatar').element())).toBe(
    'rgb(255, 0, 0)',
  );
});
