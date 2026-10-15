// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { SearchBox } from './SearchBox.js';

afterEach(cleanup);

const getSearchBox = () => document.querySelector<HTMLElement>('.fui-SearchBox');

test('uses the filled-darker appearance by default and allows an explicit override', async () => {
  await renderCoreAIComponent(<SearchBox aria-label="Default search" />);
  expect(getSearchBox()).not.toBeNull();
  const defaultBackground = getComputedStyle(getSearchBox()!).backgroundColor;

  await cleanup();
  await renderCoreAIComponent(
    <SearchBox aria-label="Explicit default search" appearance="filled-darker" />,
  );
  expect(getComputedStyle(getSearchBox()!).backgroundColor).toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<SearchBox aria-label="Outline search" appearance="outline" />);
  const outlineBackground = getComputedStyle(getSearchBox()!).backgroundColor;
  expect(outlineBackground).not.toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(<SearchBox aria-label="Stock search" />, {
    providerProps: { withComponentDefaults: false },
  });
  expect(getComputedStyle(getSearchBox()!).backgroundColor).toBe(outlineBackground);
});
