// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import type { FluentIcon } from '@fluentui/react-icons';
import { Heart24Filled, Sparkle24Filled } from '@fluentui/react-icons';
import { renderCoreAIComponent } from '../test-utils.js';
import { Illicon } from './Illicon.js';
import { rasterizeIcon } from './illiconRasterize.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

const WideFilled: FluentIcon = () => (
  <svg viewBox="0 0 48 24">
    <path d="M0 0h48v24h-48z" />
  </svg>
);

class IlliconErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: Error } {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return <div data-testid="illicon-error">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

function getPathD(svg: Element): string {
  const path = svg.querySelector('path');
  expect(path).not.toBeNull();
  return path!.getAttribute('d') ?? '';
}

function getDotCenters(svg: Element): Array<[number, number]> {
  return [...getPathD(svg).matchAll(/M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(
    ([, left, centerY]) => [Number(left) + 1, Number(centerY)],
  );
}

test('renders a dotted Filled icon at the default size and color', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon icon={Sparkle24Filled} aria-label="Sparkle" />,
  );
  const root = screen.getByRole('img', { name: 'Sparkle' }).element();
  const svg = root.querySelector('svg')!;

  expect(svg.getAttribute('width')).toBe('100');
  expect(svg.getAttribute('height')).toBe('100');
  expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  expect(getPathD(svg)).not.toBe('');
  expect(getComputedStyle(svg.querySelector('path')!).fill).toBe('rgb(255, 255, 255)');
});

test('renders a custom SVG while preserving its aspect ratio', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon
      icon={
        <svg viewBox="0 0 40 20">
          <path d="M0 0h40v20H0z" />
        </svg>
      }
      size={96}
      aria-label="Custom SVG"
    />,
  );
  const root = screen.getByRole('img', { name: 'Custom SVG' }).element();
  const svg = root.querySelector('svg')!;

  expect(svg.getAttribute('width')).toBe('96');
  expect(svg.getAttribute('height')).toBe('48');
  expect(svg.getAttribute('viewBox')).toBe('0 0 96 48');
  expect(root.getBoundingClientRect().width).toBe(96);
  expect(root.getBoundingClientRect().height).toBe(48);
  expect(getPathD(svg)).not.toBe('');
});

test.each([20, 97, 140])('keeps 2px dots on a centered 5px grid at size %s', async (size) => {
  const screen = await renderCoreAIComponent(
    <Illicon icon={WideFilled} size={size} aria-label="Spaced dots" />,
  );
  const svg = screen.getByRole('img', { name: 'Spaced dots' }).element().querySelector('svg')!;
  const path = svg.querySelector('path')!;
  const centers = getDotCenters(svg);
  const xs = [...new Set(centers.map(([x]) => x))];
  const ys = [...new Set(centers.map(([, y]) => y))];

  expect(svg.getAttribute('viewBox')).toBe(`0 0 ${size} ${size / 2}`);
  expect(xs).toHaveLength(Math.floor(size / 5));
  expect(ys).toHaveLength(Math.floor(size / 2 / 5));
  expect((xs[0] + xs[xs.length - 1]) / 2).toBe(size / 2);
  expect((ys[0] + ys[ys.length - 1]) / 2).toBe(size / 4);
  for (const axis of [xs, ys]) {
    expect(axis.slice(1).map((center, index) => center - axis[index])).toEqual(
      Array(axis.length - 1).fill(5),
    );
  }
  const [x, y] = centers[0];
  expect(path.isPointInFill(new DOMPoint(x + 0.9, y))).toBe(true);
  expect(path.isPointInFill(new DOMPoint(x + 1.1, y))).toBe(false);
  expect(path.isPointInFill(new DOMPoint(x, y + 0.9))).toBe(true);
  expect(path.isPointInFill(new DOMPoint(x, y + 1.1))).toBe(false);
  expect(path.isPointInFill(new DOMPoint(x + 2.5, y))).toBe(false);
  const bounds = path.getBBox();
  expect(bounds.width).toBe((xs.length - 1) * 5 + 2);
  expect(bounds.height).toBe((ys.length - 1) * 5 + 2);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(size);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(size / 2);
});

test.each([
  { size: 1, height: 1, dots: 0 },
  { size: 2, height: 2, dots: 1 },
  { size: 2, height: 0.5, dots: 0 },
])('fits $dots dots in a $size by $height viewport', async ({ size, height, dots }) => {
  const screen = await renderCoreAIComponent(
    <Illicon
      icon={
        <svg viewBox={`0 0 ${size * 2} ${height * 2}`}>
          <path d={`M0 0h${size * 2}v${height * 2}H0z`} />
        </svg>
      }
      size={size}
      aria-label="Tiny"
    />,
  );
  const svg = screen.getByRole('img', { name: 'Tiny' }).element().querySelector('svg')!;

  expect(svg.getAttribute('viewBox')).toBe(`0 0 ${size} ${height}`);
  expect(getDotCenters(svg)).toHaveLength(dots);
});

test.each([0, -16, NaN, Infinity, 20.5])('reports an explicit error for size %s', async (size) => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const screen = await renderCoreAIComponent(
    <IlliconErrorBoundary>
      <Illicon icon={Sparkle24Filled} size={size} />
    </IlliconErrorBoundary>,
  );

  expect(screen.getByTestId('illicon-error').element().textContent).toMatch(
    /must be a positive, finite whole number/,
  );
  expect(consoleError).toHaveBeenCalled();
});

test.each([
  { shape: 'M2.25 2.25h1.5v1.5h-1.5z', centers: [[2.5, 2.5]] },
  { shape: 'M0.5 0.5h1v1h-1z', centers: [] },
])(
  'samples dot centers rather than any overlapping geometry: $shape',
  async ({ shape, centers }) => {
    const icon = (
      <svg viewBox="0 0 10 10">
        <path d={shape} />
      </svg>
    );
    const getContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext');
    const screen = await renderCoreAIComponent(
      <Illicon icon={icon} size={10} aria-label="Sampled" />,
    );

    expect(
      getDotCenters(screen.getByRole('img', { name: 'Sampled' }).element().querySelector('svg')!),
    ).toEqual(centers);
    await screen.rerender(<Illicon icon={icon} size={10} aria-label="Sampled" />);
    expect(
      getDotCenters(screen.getByRole('img', { name: 'Sampled' }).element().querySelector('svg')!),
    ).toEqual(centers);
    expect(getContext).toHaveBeenCalledTimes(1);
  },
);

test('combines filled paths and accepts plain groups, inherited paint, and metadata', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon
      icon={
        <svg viewBox="0 0 10 10" fill="none" stroke="red" color="#aBc" style={{ opacity: '1.0' }}>
          <title>Two squares</title>
          <g fill="currentColor" stroke="none" fillOpacity="100%">
            <path d="M2 2h2v2H2z">
              <title>First square</title>
              <desc>A filled square.</desc>
            </path>
            <path d="M7 7h2v2H7z" style={{ fill: 'inherit', opacity: 1 }} />
          </g>
        </svg>
      }
      size={10}
      aria-label="Two squares"
    />,
  );

  expect(
    getDotCenters(screen.getByRole('img', { name: 'Two squares' }).element().querySelector('svg')!),
  ).toEqual([
    [2.5, 2.5],
    [7.5, 7.5],
  ]);
});

test.each([
  { rootRule: 'evenodd', pathRule: 'nonzero', opening: false },
  { rootRule: 'nonzero', pathRule: 'evenodd', opening: true },
] as const)(
  'applies root $rootRule and path $pathRule fill rules to internal openings',
  async ({ rootRule, pathRule, opening }) => {
    const screen = await renderCoreAIComponent(
      <Illicon
        icon={
          <svg viewBox="0 0 10 10" fillRule={rootRule}>
            <path d="M0 0h5v10H0z M1.5 1.5h2v2H1.5z" />
            <path d="M5 0h5v10H5z M6.5 1.5h2v2H6.5z" fillRule={pathRule} />
          </svg>
        }
        size={10}
        aria-label="Openings"
      />,
    );
    const centers = getDotCenters(
      screen.getByRole('img', { name: 'Openings' }).element().querySelector('svg')!,
    );

    expect(centers).toEqual(
      opening
        ? [
            [2.5, 2.5],
            [2.5, 7.5],
            [7.5, 7.5],
          ]
        : [
            [7.5, 2.5],
            [2.5, 7.5],
            [7.5, 7.5],
          ],
    );
  },
);

test('preserves narrow connections when dotifying a filled shape at a coarse size', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon
      icon={
        <svg viewBox="0 0 100 100">
          <path d="M30 14h26L39 78c-2 8-12 11-18 5L7 58a16 16 0 0 1 0-16l14-23a11 11 0 0 1 9-5Z" />
          <path d="M58 17h3L43 83h-3Z" />
          <path d="M62 14h8a11 11 0 0 1 9 5l14 23a16 16 0 0 1 0 16L79 81a11 11 0 0 1-9 5H47l17-64c1-3 0-6-2-8Z" />
        </svg>
      }
      size={40}
      aria-label="Connected Foundry"
    />,
  );
  const path = screen
    .getByRole('img', { name: 'Connected Foundry' })
    .element()
    .querySelector('path')!;

  expect(path.isPointInFill(new DOMPoint(22.5, 7.5))).toBe(true);
  expect(path.isPointInFill(new DOMPoint(22.5, 12.5))).toBe(true);
});

test('preserves source viewBox origins and internal whitespace', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Illicon
        icon={
          <svg viewBox="10 20 16 16">
            <path d="M18 20h8v16h-8z" />
          </svg>
        }
        size={40}
        aria-label="Small source"
      />
      <Illicon
        icon={
          <svg viewBox="0 0 48 48">
            <path d="M24 0h24v48H24z" />
          </svg>
        }
        size={40}
        aria-label="Large source"
      />
    </>,
  );
  const smallSvg = screen
    .getByRole('img', { name: 'Small source' })
    .element()
    .querySelector('svg')!;
  const largeSvg = screen
    .getByRole('img', { name: 'Large source' })
    .element()
    .querySelector('svg')!;

  expect(getPathD(smallSvg)).not.toBe('');
  expect(getPathD(smallSvg)).toBe(getPathD(largeSvg));
  const path = smallSvg.querySelector('path')!;
  expect(path.isPointInFill(new DOMPoint(19, 1))).toBe(false);
  expect(path.isPointInFill(new DOMPoint(23, 3))).toBe(true);
});

test.each(['fill="#aBc"', 'fill="#12AbEf"', 'style="fill: navy"'])(
  'accepts opaque source paint: %s',
  (paint) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 10');
    svg.innerHTML = `<path d="M0 0h10v10H0z" ${paint} />`;

    expect([...rasterizeIcon({}, svg, 10).occupied]).toEqual([1, 1, 1, 1]);
  },
);

test('uses a path color override instead of a transparent ancestor color for currentColor', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('color', 'transparent');
  svg.innerHTML = '<path d="M0 0h10v10H0z" fill="currentColor" style="color: red" />';

  expect([...rasterizeIcon({}, svg, 10).occupied]).toEqual([1, 1, 1, 1]);
});

test.each([
  ['unsupported geometry', '<rect width="10" height="10" />', /unsupported SVG element <rect>/],
  ['path transforms', '<path d="M0 0h10v10H0z" transform="translate(1)" />', /transform/],
  ['group transforms', '<g transform="scale(2)"><path d="M0 0h10v10H0z" /></g>', /transform/],
  ['inline transforms', '<path d="M0 0h10v10H0z" style="transform: scale(2)" />', /transform/],
  ['inherited unfilled paths', '<g fill="none"><path d="M0 0h10v10H0z" /></g>', /unfilled paths/],
  ['inherited strokes', '<g stroke="red"><path d="M0 0h10v10H0z" /></g>', /strokes/],
  ['mask references', '<path d="M0 0h10v10H0z" mask="url(#mask)" />', /mask/],
  ['inline clipping', '<path d="M0 0h10v10H0z" style="clip-path: inset(1px)" />', /clip-path/],
  ['filter references', '<path d="M0 0h10v10H0z" filter="url(#blur)" />', /filter/],
  [
    'inline animation',
    '<path d="M0 0h10v10H0z" style="animation: pulse 1s infinite" />',
    /animation/,
  ],
  ['paint references', '<path d="M0 0h10v10H0z" fill="url(#gradient)" />', /paint references/],
  ['group fill rules', '<g fill-rule="evenodd"><path d="M0 0h10v10H0z" /></g>', /fill-rule/],
  ['inline fill rules', '<path d="M0 0h10v10H0z" style="fill-rule: evenodd" />', /fill-rule/],
  ['transparent fill opacity', '<path d="M0 0h10v10H0z" fill-opacity="0" />', /fill-opacity/],
  ['transparent named fill', '<path d="M0 0h10v10H0z" fill="transparent" />', /fill/],
  ['alpha hex fill', '<path d="M0 0h10v10H0z" fill="#0000" />', /fill/],
  ['normalized inline hex fill', '<path d="M0 0h10v10H0z" style="fill: #abc" />', /fill/],
  ['functional fill', '<path d="M0 0h10v10H0z" fill="rgba(0,0,0,0)" />', /fill/],
  ['variable fill', '<path d="M0 0h10v10H0z" style="fill: var(--paint)" />', /fill/],
  [
    'invalid fill overriding inherited none',
    '<g fill="none"><path d="M0 0h10v10H0z" fill="notacolor" /></g>',
    /fill/,
  ],
  [
    'discarded invalid inline fill with inherited none',
    '<g fill="none"><path d="M0 0h10v10H0z" style="fill: notacolor" /></g>',
    /unfilled paths/,
  ],
  [
    'inherited transparent currentColor',
    '<g color="transparent"><path d="M0 0h10v10H0z" fill="currentColor" /></g>',
    /currentColor/,
  ],
  [
    'normalized inline hex currentColor',
    '<path d="M0 0h10v10H0z" fill="currentColor" style="color: #abc" />',
    /currentColor/,
  ],
  ['partial group opacity', '<g opacity=".5"><path d="M0 0h10v10H0z" /></g>', /opacity/],
  ['invalid numeric opacity', '<path d="M0 0h10v10H0z" opacity="0x1" />', /opacity/],
  ['nested path geometry', '<path d="M0 0h10v10H0z"><path d="M0 0h10v10H0z" /></path>', /children/],
  [
    'HTML geometry inside metadata',
    '<title><path d="M0 0h10v10H0z" /></title>',
    /unsupported SVG element <path>/,
  ],
  ['empty path data', '<path d="   " />', /usable filled path data/],
])('rejects %s before sampling', (_, markup, message) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.innerHTML = markup;
  const getContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext');

  expect(() => rasterizeIcon({}, svg, 10)).toThrow(message);
  expect(getContext).not.toHaveBeenCalled();
});

test.each(['aria-label', 'aria-labelledby'] as const)(
  'exposes one named image through %s and hides the inner SVG',
  async (attribute) => {
    const screen = await renderCoreAIComponent(
      <>
        <span id="illicon-label">Favourite</span>
        <Illicon
          icon={Heart24Filled}
          {...(attribute === 'aria-label'
            ? { 'aria-label': 'Favourite' }
            : { 'aria-labelledby': 'illicon-label' })}
        />
      </>,
    );
    const root = screen.getByRole('img', { name: 'Favourite' }).element();
    const svg = root.querySelector('svg')!;

    expect(root.getAttribute('aria-hidden')).toBeNull();
    expect(root.getAttribute(attribute)).toBe(
      attribute === 'aria-label' ? 'Favourite' : 'illicon-label',
    );
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  },
);

test('is decorative and hidden from assistive technology when unlabelled', async () => {
  const screen = await renderCoreAIComponent(
    <Illicon icon={Sparkle24Filled} data-testid="decorative" />,
  );
  const root = screen.getByTestId('decorative').element();

  expect(root.getAttribute('role')).toBeNull();
  expect(root.getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByRole('img').query()).toBeNull();
});

test('forwards native props and ref, and allows consumer styles and accessibility overrides', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await renderCoreAIComponent(
    <Illicon
      icon={Sparkle24Filled}
      ref={ref}
      id="illicon-instance"
      className="consumer-illicon"
      style={{ color: 'rgb(10, 20, 30)', width: 120, height: 80 }}
      role="presentation"
      aria-hidden={false}
      data-testid="illicon-root"
    />,
  );
  const root = screen.getByTestId('illicon-root').element();

  expect(root.id).toBe('illicon-instance');
  expect(root.classList).toContain('consumer-illicon');
  expect(root.getAttribute('role')).toBe('presentation');
  expect(root.getAttribute('aria-hidden')).toBe('false');
  expect(getComputedStyle(root).width).toBe('120px');
  expect(getComputedStyle(root).height).toBe('80px');
  expect(getComputedStyle(root.querySelector('path')!).fill).toBe('rgb(10, 20, 30)');
  expect(ref.current).toBe(root);
});

test('renders the new icon, not stale cached output, when the icon prop changes', async () => {
  const screen = await renderCoreAIComponent(<Illicon icon={Sparkle24Filled} aria-label="Icon" />);
  const root = screen.getByRole('img', { name: 'Icon' });
  const firstPath = getPathD(root.element().querySelector('svg')!);
  expect(firstPath).not.toBe('');

  await screen.rerender(<Illicon icon={Heart24Filled} aria-label="Icon" />);
  const nextPath = getPathD(root.element().querySelector('svg')!);
  expect(nextPath).not.toBe('');
  expect(nextPath).not.toBe(firstPath);
});

test('samples shared icons once per size in Strict Mode and reuses previous sizes', async () => {
  const SharedFilled: FluentIcon = () => (
    <svg viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" />
    </svg>
  );
  const getContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext');
  const renderIcons = (size: number) => (
    <React.StrictMode>
      <Illicon icon={SharedFilled} size={size} aria-label="First" />
      <Illicon icon={SharedFilled} size={size} aria-label="Second" />
    </React.StrictMode>
  );
  const screen = await renderCoreAIComponent(renderIcons(100));
  const first = screen.getByRole('img', { name: 'First' });
  const second = screen.getByRole('img', { name: 'Second' });
  const initialPath = getPathD(first.element().querySelector('svg')!);

  expect(initialPath).not.toBe('');
  expect(getPathD(second.element().querySelector('svg')!)).toBe(initialPath);
  expect(getContext).toHaveBeenCalledTimes(1);

  await screen.rerender(renderIcons(100));
  expect(getPathD(first.element().querySelector('svg')!)).toBe(initialPath);
  expect(getContext).toHaveBeenCalledTimes(1);

  await screen.rerender(renderIcons(140));
  expect(first.element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 140 140');
  expect(getPathD(first.element().querySelector('svg')!)).not.toBe(initialPath);
  expect(getPathD(second.element().querySelector('svg')!)).toBe(
    getPathD(first.element().querySelector('svg')!),
  );
  expect(getContext).toHaveBeenCalledTimes(2);

  await screen.rerender(renderIcons(100));
  expect(first.element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 100 100');
  expect(getPathD(first.element().querySelector('svg')!)).toBe(initialPath);
  expect(getContext).toHaveBeenCalledTimes(2);
});

test('fails explicitly when the source SVG has a malformed viewBox', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const screen = await renderCoreAIComponent(
    <IlliconErrorBoundary>
      <Illicon
        icon={
          <svg viewBox="0 0 24.5 24">
            <path d="M0 0h24.5v24h-24.5z" />
          </svg>
        }
      />
    </IlliconErrorBoundary>,
  );

  expect(screen.getByTestId('illicon-error').element().textContent).toMatch(
    /the source SVG must have a positive, whole-pixel viewBox/,
  );
  expect(consoleError).toHaveBeenCalled();
});

test('fails explicitly when no 2D canvas context is available', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockImplementation(() => null);
  const screen = await renderCoreAIComponent(
    <IlliconErrorBoundary>
      <Illicon
        icon={
          <svg viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" />
          </svg>
        }
      />
    </IlliconErrorBoundary>,
  );

  expect(screen.getByTestId('illicon-error').element().textContent).toMatch(
    /2D canvas context is unavailable/,
  );
  expect(consoleError).toHaveBeenCalled();
});
