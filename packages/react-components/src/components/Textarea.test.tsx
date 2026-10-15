// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Textarea } from './Textarea.js';

afterEach(cleanup);

const getTextarea = () => document.querySelector<HTMLElement>('.fui-Textarea');

test('uses the filled-darker appearance by default and allows an explicit override', async () => {
  await renderCoreAIComponent(<Textarea aria-label="Default textarea" />);
  expect(getTextarea()).not.toBeNull();
  const defaultBackground = getComputedStyle(getTextarea()!).backgroundColor;

  await cleanup();
  await renderCoreAIComponent(
    <Textarea aria-label="Explicit default textarea" appearance="filled-darker" />,
  );
  expect(getComputedStyle(getTextarea()!).backgroundColor).toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<Textarea aria-label="Outline textarea" appearance="outline" />);
  const outlineBackground = getComputedStyle(getTextarea()!).backgroundColor;
  expect(outlineBackground).not.toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<Textarea aria-label="Stock textarea" />, {
    providerProps: { withComponentDefaults: false },
  });
  expect(getComputedStyle(getTextarea()!).backgroundColor).toBe(outlineBackground);
});
