// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { composeStories } from '@storybook/react-vite';
import {
  Agents20Filled,
  Search20Regular,
  LockClosed20Regular,
  ErrorCircle20Regular,
} from '@fluentui/react-icons';
import { dotGridToSvg, iconToDotGrid } from '@coreai-ds/react-components';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';
import * as stories from '../stories/templates/EmptyState.stories';

const { Default, WithIllustration, NoResults, NoPermissions, ErrorState } = composeStories(stories);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

for (const { name, Story, icon, heading, actions } of [
  {
    name: 'WithIllustration',
    Story: WithIllustration,
    icon: Agents20Filled,
    heading: 'Benefit from Action Artifact',
    actions: ['Create agent', 'Code'],
  },
  {
    name: 'NoResults',
    Story: NoResults,
    icon: Search20Regular,
    heading: 'No results found',
    actions: [],
  },
  {
    name: 'NoPermissions',
    Story: NoPermissions,
    icon: LockClosed20Regular,
    heading: 'Access required',
    actions: ['Request access'],
  },
  {
    name: 'ErrorState',
    Story: ErrorState,
    icon: ErrorCircle20Regular,
    heading: 'Something went wrong',
    actions: ['Try again'],
  },
]) {
  test(`${name} uses the canonical saved 20px-at-2x grid without runtime conversion`, async () => {
    const data = await iconToDotGrid(icon, { multiplier: 2 });
    expect(data.rows).toHaveLength(40);
    expect(data.rows.every((row) => row.length === 40)).toBe(true);
    const expected = new DOMParser().parseFromString(dotGridToSvg(data), 'image/svg+xml');
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const screen = await renderCoreAIComponent(<Story />);
    const illustration = screen.container.querySelector('.fui-Illicon');
    const svg = illustration?.querySelector('svg');
    if (!svg) throw new Error(`Missing saved-data illustration in ${name}`);
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
    expect(svg.getBoundingClientRect().width).toBe(200);
    expect(svg.getBoundingClientRect().height).toBe(200);
    expect(illustration).toHaveAttribute('aria-hidden', 'true');
    const circles = (root: ParentNode) =>
      Array.from(root.querySelectorAll('circle'), (circle) => [
        circle.getAttribute('cx'),
        circle.getAttribute('cy'),
        circle.getAttribute('r'),
      ]);
    expect(circles(svg)).toEqual(circles(expected));
    expect(svg.querySelector('circle')?.getBoundingClientRect().width).toBe(2);
    expect(screen.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    for (const action of actions) {
      expect(screen.getByRole('button', { name: action, exact: true })).toBeVisible();
    }
    if (name === 'WithIllustration') {
      expect(
        screen.getByRole('link', { name: 'How to make the coolest artifact ever' }),
      ).toBeVisible();
    }
    expect(screen.container.querySelector('canvas')).toBeNull();
    expect(getContext).not.toHaveBeenCalled();
  });
}

test('the compact default stays illustration-free', async () => {
  const screen = await renderCoreAIComponent(<Default />);
  expect(screen.container.querySelector('.fui-Illicon')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Benefit from Action Artifact' })).toBeVisible();
});
