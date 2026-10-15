// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  TagPickerControl,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { TagPicker } from './TagPicker.js';

afterEach(cleanup);

const getControl = () => document.querySelector<HTMLElement>('.fui-TagPickerControl');
const tagPicker = (appearance?: 'filled-darker' | 'outline') => (
  <TagPicker selectedOptions={[]} {...(appearance ? { appearance } : {})}>
    <TagPickerControl>
      <TagPickerInput aria-label="Select tags" />
    </TagPickerControl>
    <TagPickerList>
      <TagPickerOption value="one">One</TagPickerOption>
    </TagPickerList>
  </TagPicker>
);

test('uses the filled-darker appearance by default and allows an explicit override', async () => {
  await renderCoreAIComponent(tagPicker());
  expect(getControl()).not.toBeNull();
  const defaultBackground = getComputedStyle(getControl()!).backgroundColor;

  await cleanup();
  await renderCoreAIComponent(tagPicker('filled-darker'));
  expect(getComputedStyle(getControl()!).backgroundColor).toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(tagPicker('outline'));
  const outlineBackground = getComputedStyle(getControl()!).backgroundColor;
  expect(outlineBackground).not.toBe(defaultBackground);

  await cleanup();
  await renderCoreAIComponent(tagPicker(), {
    providerProps: { withComponentDefaults: false },
  });
  expect(getComputedStyle(getControl()!).backgroundColor).toBe(outlineBackground);
});
