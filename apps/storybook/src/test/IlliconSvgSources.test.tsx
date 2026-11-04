// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { composeStories } from '@storybook/react-vite';
import { iconToDotGrid, dotGridToSvg } from '@coreai-ds/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';
import * as stories from '../stories/components/Illicon.stories';

const { OriginalVsIllicon } = composeStories(stories);

afterEach(cleanup);

for (const icon of ['AiGatewayLogo20', 'FoundryLogo20'] as const) {
  test(`${icon} samples the authored monochrome SVG, not a Fluent replacement`, async () => {
    const screen = await renderCoreAIComponent(<OriginalVsIllicon icon={icon} />);
    const original = screen.getByRole('img', { name: `Original ${icon}`, exact: true }).element();
    if (!(original instanceof HTMLImageElement)) throw new Error('Expected the original SVG image');
    await original.decode();
    const markup = await fetch(original.src).then((response) => response.text());
    const source = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(source.documentElement.getAttribute('viewBox')).toBe('0 0 20 20');
    expect(source.documentElement.getAttribute('fill')).toBe('#000000');
    expect(source.querySelectorAll('path')).toHaveLength(icon === 'AiGatewayLogo20' ? 3 : 1);
    const data = await iconToDotGrid(markup, { multiplier: 2 });
    expect(data.rows).toHaveLength(40);
    expect(data.rows.every((row) => row.length === 40)).toBe(true);
    expect(data.rows.some((row) => row.includes('1'))).toBe(true);
    const expected = new DOMParser().parseFromString(dotGridToSvg(data), 'image/svg+xml');
    const image = screen.getByRole('img', { name: `Illicon ${icon}`, exact: true });
    await expect.element(image).toBeVisible();
    const svg = image.element().querySelector('svg');
    if (!svg) throw new Error('Expected the converted grid SVG');
    const circles = (root: ParentNode) =>
      Array.from(root.querySelectorAll('circle'), (circle) => [
        circle.getAttribute('cx'),
        circle.getAttribute('cy'),
        circle.getAttribute('r'),
      ]);
    expect(circles(svg)).toEqual(circles(expected));
    expect(svg).toHaveAttribute('width', '200');
    expect(svg.querySelector('circle')?.getBoundingClientRect().width).toBe(2);
    await screen.rerender(<OriginalVsIllicon icon={icon} variant="Regular" multiplier={1} />);
    await expect.element(image).toBeVisible();
    expect(svg.isConnected).toBe(false);
    expect(image.element().querySelector('svg')).toHaveAttribute('width', '100');
    const unchanged = screen.getByRole('img', { name: `Original ${icon}`, exact: true }).element();
    expect(unchanged).toHaveAttribute('src', original.src);
    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  });
}
