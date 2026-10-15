// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Tab } from '@fluentui/react-components';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { TabList } from './TabList.js';

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

test('does not insert invalid stylesheet rules', async () => {
  const nativeInsertRule = CSSStyleSheet.prototype.insertRule;
  const rejectedRules: string[] = [];

  vi.spyOn(CSSStyleSheet.prototype, 'insertRule').mockImplementation(function (
    this: CSSStyleSheet,
    rule,
    index,
  ) {
    try {
      return nativeInsertRule.call(this, rule, index);
    } catch {
      rejectedRules.push(rule);
      return 0;
    }
  });

  await renderCoreAIComponent(
    <TabList appearance="elevated" defaultSelectedValue="first">
      <Tab value="first">First tab</Tab>
      <Tab value="second">Second tab</Tab>
    </TabList>,
  );

  expect(rejectedRules).toEqual([]);
});
