// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * CoreAI Design System uses Fluent UI v9 as its foundation. Fluent provides
 * the components and their behavior, such as buttons, inputs, and menus.
 * CoreAI adds the visual theme and preferred design choices that make those
 * components consistent with CoreAI, such as colors, styles, shapes, and
 * default appearances. A product team can still change those choices when a
 * specific experience needs something different.
 *
 * Our test helper places components in that CoreAI design environment. These
 * tests make sure the environment stays active when a test updates a component
 * and that a test can choose different CoreAI settings when needed.
 */
import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { useComponentDefaults } from './contexts/ComponentDefaultsContext.js';
import { renderCoreAIComponent } from './test-utils.js';

afterEach(cleanup);

function ComponentDefaultsStatus({ label }: { label: string }) {
  const withComponentDefaults = useComponentDefaults();

  return <div>{`${label}: ${withComponentDefaults}`}</div>;
}

// Rerender replaces the component under test. Reading `true` afterward proves
// that the component remains inside the CoreAI provider wrapper.
test('preserves the CoreAI provider when rerendering', async () => {
  const screen = await renderCoreAIComponent(<ComponentDefaultsStatus label="Initial" />);

  await expect.element(screen.getByText('Initial: true')).toBeVisible();

  await screen.rerender(<ComponentDefaultsStatus label="Updated" />);

  await expect.element(screen.getByText('Updated: true')).toBeVisible();
});

// The context changes to `false` only if the helper passes providerProps to
// CoreAIFluentProvider.
test('forwards provider props', async () => {
  const screen = await renderCoreAIComponent(<ComponentDefaultsStatus label="Defaults" />, {
    providerProps: { withComponentDefaults: false },
  });

  await expect.element(screen.getByText('Defaults: false')).toBeVisible();
});
