// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { CodeBlock } from './CodeBlock.js';

afterEach(cleanup);

test('renders fallback content without a copy action when code is empty', async () => {
  await renderCoreAIComponent(
    <CodeBlock code="" fallbackContent={<span>Loading code</span>} header="Example.tsx" />,
  );

  expect(document.querySelector('.fui-CodeBlock__fallbackContent')).toHaveTextContent(
    'Loading code',
  );
  expect(document.querySelector('[aria-label="Copy code"]')).toBeNull();
});

test('renders code instead of fallback content when code is truthy', async () => {
  await renderCoreAIComponent(
    <CodeBlock code="const ready = true;" fallbackContent={<span>Loading code</span>} />,
  );

  expect(document.querySelector('.fui-CodeBlock__pre')).toHaveTextContent('const ready = true;');
  expect(document.querySelector('.fui-CodeBlock__fallbackContent')).toBeNull();
  expect(document.querySelector('[aria-label="Copy code"]')).not.toBeNull();
});

test('scrolls long code within the pre element when height is restricted', async () => {
  const code = Array.from({ length: 40 }, (_, index) => `const line${index} = ${index};`).join(
    '\n',
  );

  await renderCoreAIComponent(
    <CodeBlock code={code} header="Example.tsx" footer="End of example" style={{ height: 200 }} />,
  );

  const root = document.querySelector<HTMLElement>('.fui-CodeBlock');
  const pre = document.querySelector<HTMLElement>('.fui-CodeBlock__pre');

  expect(root).not.toBeNull();
  expect(pre).not.toBeNull();
  expect(root!.scrollHeight).toBeLessThanOrEqual(root!.clientHeight);
  expect(pre!.scrollHeight).toBeGreaterThan(pre!.clientHeight);
  expect(getComputedStyle(pre!).overflowY).toBe('auto');
});
