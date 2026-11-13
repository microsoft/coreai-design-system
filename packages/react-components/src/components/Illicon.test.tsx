// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { CoreAIFluentProvider } from '../contexts/CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from '../theme/theme.js';
import { dotGridToSvg } from '../illicons/dotGridToSvg.js';
import { Illicon } from './Illicon.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

const grid = { rows: ['00000', '00100', '01110', '00100', '00000'] };

function circles(svg: Element) {
  return Array.from(svg.querySelectorAll('circle'), (circle) => ({
    cx: circle.getAttribute('cx'),
    cy: circle.getAttribute('cy'),
    r: circle.getAttribute('r'),
  }));
}

test('renders occupancy as circles and preserves the complete artboard without a canvas', async () => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  const screen = await renderCoreAIComponent(<Illicon data={grid} aria-label="Plus" />);
  const root = screen.getByRole('img', { name: 'Plus' }).element();
  const svg = root.querySelector('svg')!;

  expect(svg.getAttribute('viewBox')).toBe('0 0 25 25');
  expect(root.getBoundingClientRect().width).toBe(25);
  expect(root.getBoundingClientRect().height).toBe(25);
  expect(circles(svg)).toEqual([
    { cx: '12', cy: '7', r: '1' },
    { cx: '7', cy: '12', r: '1' },
    { cx: '12', cy: '12', r: '1' },
    { cx: '17', cy: '12', r: '1' },
    { cx: '12', cy: '17', r: '1' },
  ]);
  expect(svg.querySelector('path')).toBeNull();
  expect(getContext).not.toHaveBeenCalled();
});

test('uses exactly the same geometry as the standalone SVG exporter', async () => {
  const screen = await renderCoreAIComponent(<Illicon data={grid} radius={1.5} pitch={6} />);
  const exported = new DOMParser().parseFromString(
    dotGridToSvg(grid, { radius: 1.5, pitch: 6 }),
    'image/svg+xml',
  ).documentElement;
  const svg = screen.container.querySelector('svg')!;
  expect(svg.getAttribute('viewBox')).toBe(exported.getAttribute('viewBox'));
  expect(circles(svg)).toEqual(circles(exported));
});

test('changes radius and pitch without resampling or changing occupancy', async () => {
  const screen = await renderCoreAIComponent(<Illicon data={grid} />);
  await screen.rerender(<Illicon data={grid} radius={2} pitch={8} />);
  const svg = screen.container.querySelector('svg')!;
  expect(svg.getAttribute('viewBox')).toBe('0 0 40 40');
  expect(circles(svg)).toHaveLength(5);
  expect(circles(svg)[0]).toEqual({ cx: '20', cy: '12', r: '2' });
  expect(grid.rows).toEqual(['00000', '00100', '01110', '00100', '00000']);
});

test('renders a rectangular grid at cells times pitch in actual CSS pixels', async () => {
  const screen = await renderCoreAIComponent(<Illicon data={{ rows: ['0010', '0000'] }} />);
  const svg = screen.container.querySelector('svg')!;
  expect(svg.getAttribute('viewBox')).toBe('0 0 20 10');
  expect(svg.getBoundingClientRect().width).toBe(20);
  expect(svg.getBoundingClientRect().height).toBe(10);
  expect(circles(svg)).toEqual([{ cx: '12', cy: '2', r: '1' }]);
});

test.each([
  { pitch: 4, radius: 0.5 },
  { pitch: 4, radius: 1 },
  { pitch: 4, radius: 1.5 },
  { pitch: 5, radius: 0.5 },
  { pitch: 5, radius: 1 },
  { pitch: 5, radius: 1.5 },
  { pitch: 6, radius: 1 },
  { pitch: 6, radius: 1.5 },
])('aligns whole-pixel bounds at pitch $pitch and radius $radius', async ({ pitch, radius }) => {
  const screen = await renderCoreAIComponent(
    <Illicon data={{ rows: ['111', '111'] }} pitch={pitch} radius={radius} />,
  );
  const svg = screen.container.querySelector('svg')!;
  expect(svg.getBoundingClientRect().width).toBe(3 * pitch);
  expect(svg.getBoundingClientRect().height).toBe(2 * pitch);
  const dots = Array.from(svg.querySelectorAll('circle'));
  for (const dot of dots) {
    const bounds = dot.getBBox();
    expect(Number.isInteger(bounds.x)).toBe(true);
    expect(Number.isInteger(bounds.y)).toBe(true);
    expect(dot.getBoundingClientRect().width).toBe(radius * 2);
    expect(dot.getBoundingClientRect().height).toBe(radius * 2);
  }
  expect(Number(dots[1].getAttribute('cx')) - Number(dots[0].getAttribute('cx'))).toBe(pitch);
  expect(Number(dots[3].getAttribute('cy')) - Number(dots[0].getAttribute('cy'))).toBe(pitch);
});

test.each([5, 100])(
  'does not scale or flex-shrink grid dots inside a %spx wrapper',
  async (width) => {
    const screen = await renderCoreAIComponent(
      <Illicon data={{ rows: ['11', '11'] }} style={{ width }} />,
    );
    const svg = screen.container.querySelector('svg')!;
    expect(svg.getBoundingClientRect().width).toBe(10);
    expect(svg.getBoundingClientRect().height).toBe(10);
    expect(svg.querySelector('circle')!.getBoundingClientRect().width).toBe(2);
  },
);

test('rejects independent display sizing for grid data', () => {
  // @ts-expect-error Grid size is derived from occupancy and pitch.
  const artwork = <Illicon data={grid} size={100} />;
  expect(() => renderToStaticMarkup(artwork)).toThrow(/size applies only to custom SVG/);
});

test('preserves the dimensions of an entirely empty grid', async () => {
  const screen = await renderCoreAIComponent(<Illicon data={{ rows: ['000', '000'] }} />);
  const svg = screen.container.querySelector('svg')!;
  expect(svg.getAttribute('viewBox')).toBe('0 0 15 10');
  expect(circles(svg)).toEqual([]);
});

test('updates immediately when saved data changes', async () => {
  const screen = await renderCoreAIComponent(<Illicon data={{ rows: ['10'] }} />);
  await screen.rerender(<Illicon data={{ rows: ['01'] }} />);
  expect(circles(screen.container.querySelector('svg')!)).toEqual([{ cx: '7', cy: '2', r: '1' }]);
});

test.each(['aria-label', 'aria-labelledby'] as const)(
  'exposes one named image through %s and hides the inner SVG',
  async (attribute) => {
    const screen = await renderCoreAIComponent(
      <>
        <span id="illicon-label">Favourite</span>
        <Illicon
          data={grid}
          {...(attribute === 'aria-label'
            ? { 'aria-label': 'Favourite' }
            : { 'aria-labelledby': 'illicon-label' })}
        />
      </>,
    );
    const root = screen.getByRole('img', { name: 'Favourite' }).element();
    expect(root.getAttribute('aria-hidden')).toBeNull();
    expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('svg')?.getAttribute('focusable')).toBe('false');
  },
);

test('is decorative when unlabelled and forwards native props, styles, and its ref', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await renderCoreAIComponent(
    <Illicon
      data={grid}
      ref={ref}
      id="illustration"
      className="consumer-illicon"
      style={{ color: 'rgb(10, 20, 30)' }}
    />,
  );
  const root = screen.container.querySelector('#illustration')!;
  expect(root.getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByRole('img').query()).toBeNull();
  expect(root.classList).toContain('consumer-illicon');
  expect(getComputedStyle(root.querySelector('circle')!).fill).toBe('rgb(10, 20, 30)');
  expect(ref.current).toBe(root);
});

test('follows theme changes without remounting or changing the grid', async () => {
  const artwork = <Illicon data={grid} />;
  const screen = await renderCoreAIComponent(
    <CoreAIFluentProvider theme={coreaiDarkTheme}>{artwork}</CoreAIFluentProvider>,
  );
  const circle = screen.container.querySelector('circle')!;
  const darkColor = getComputedStyle(circle).fill;
  await screen.rerender(
    <CoreAIFluentProvider theme={coreaiLightTheme}>{artwork}</CoreAIFluentProvider>,
  );
  expect(getComputedStyle(circle).fill).not.toBe(darkColor);
  expect(screen.container.querySelector('circle')).toBe(circle);
});

test('preserves custom hybrid SVG geometry and theme-controlled paint', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon size={120} style={{ color: 'rgb(10, 20, 30)' }} aria-label="Hybrid">
      <svg viewBox="0 0 40 20" fill="currentColor">
        <g transform="translate(2 1)">
          <circle cx="4.25" cy="5.75" r="1.25" />
          <path d="M10 2h12v10H10z" fill="none" stroke="currentColor" />
          <rect x="26" y="2" width="4" height="10" fill="#ff0000" />
        </g>
      </svg>
    </Illicon>,
  );
  const svg = screen.getByRole('img', { name: 'Hybrid' }).element().querySelector('svg')!;
  expect(svg.getBoundingClientRect().width).toBe(120);
  expect(svg.getBoundingClientRect().height).toBe(60);
  expect(svg.querySelector('g')?.getAttribute('transform')).toBe('translate(2 1)');
  expect(circles(svg)).toEqual([{ cx: '4.25', cy: '5.75', r: '1.25' }]);
  expect(getComputedStyle(svg.querySelector('circle')!).fill).toBe('rgb(10, 20, 30)');
  expect(getComputedStyle(svg.querySelector('path')!).stroke).toBe('rgb(10, 20, 30)');
  expect(svg.querySelector('path')?.getAttribute('fill')).toBe('none');
  expect(getComputedStyle(svg.querySelector('rect')!).fill).toBe('rgb(255, 0, 0)');
});

test('server rendering includes the circles immediately, without a source icon or canvas', () => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  const markup = renderToStaticMarkup(<Illicon data={grid} />);
  expect(markup.match(/<circle /g)).toHaveLength(5);
  expect(markup).toContain('viewBox="0 0 25 25"');
  expect(markup).not.toContain('<canvas');
  expect(getContext).not.toHaveBeenCalled();
});
