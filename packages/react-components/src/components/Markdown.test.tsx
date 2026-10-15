// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { Markdown } from './Markdown.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

test('renders heading levels with IDs derived from their visible text', async () => {
  const screen = await renderCoreAIComponent(
    <Markdown content={'# Hello *CoreAI* & friends\n\n### API `Guide`'} />,
  );

  expect(screen.getByRole('heading', { level: 1, name: 'Hello CoreAI & friends' })).toHaveAttribute(
    'id',
    'hello-coreai-friends',
  );
  expect(screen.getByRole('heading', { level: 3, name: 'API Guide' })).toHaveAttribute(
    'id',
    'api-guide',
  );
});

test('enables GitHub Flavored Markdown content by default', async () => {
  const screen = await renderCoreAIComponent(
    <Markdown
      content={'~~Removed~~\n\n| Name | State |\n| --- | --- |\n| CoreAI | Ready |\n\n- [x] Tested'}
    />,
  );

  expect(document.querySelector('del')).toHaveTextContent('Removed');
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'CoreAI' })).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).toBeChecked();
});

test('marks external links without changing fragment links', async () => {
  const screen = await renderCoreAIComponent(
    <Markdown content={'[External](https://example.com) [Section](#details)'} />,
  );
  const externalLink = screen.getByRole('link', { name: 'External' }).element();
  const fragmentLink = screen.getByRole('link', { name: 'Section' }).element();

  expect(externalLink).toHaveAttribute('target', '_blank');
  expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  expect(externalLink.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  expect(fragmentLink).not.toHaveAttribute('target');
  expect(fragmentLink).not.toHaveAttribute('rel');
  expect(fragmentLink.querySelector('svg')).toBeNull();
});

test('renders fenced code through CodeBlock with its language and source intact', async () => {
  await renderCoreAIComponent(<Markdown content={'```typescript\nconst ready = true;\n```'} />);

  const codeBlock = document.querySelector('.fui-CodeBlock');
  const code = codeBlock?.querySelector('code');

  expect(codeBlock).not.toBeNull();
  expect(code).toHaveClass('language-typescript');
  expect(code).toHaveTextContent('const ready = true;');
  expect(codeBlock?.querySelector('[aria-label="Copy code"]')).not.toBeNull();
});

test('forwards consumer components, plugins, and wrapper class names', async () => {
  const remarkPlugin = vi.fn();
  const rehypePlugin = vi.fn();

  const screen = await renderCoreAIComponent(
    <Markdown
      className="consumer-markdown"
      content="[Custom link](/guide)"
      remarkPlugins={[remarkPlugin]}
      rehypePlugins={[rehypePlugin]}
      components={{
        a: ({ children, href }) => (
          <a href={href} data-testid="consumer-link">
            {children}
          </a>
        ),
      }}
    />,
  );
  const link = screen.getByTestId('consumer-link');

  expect(document.querySelector('.fui-Markdown')).toHaveClass('consumer-markdown');
  expect(link).toHaveAttribute('href', '/guide');
  expect(link).toHaveTextContent('Custom link');
  expect(link.element().querySelector('svg')).toBeNull();
  expect(remarkPlugin).toHaveBeenCalled();
  expect(rehypePlugin).toHaveBeenCalled();
});
