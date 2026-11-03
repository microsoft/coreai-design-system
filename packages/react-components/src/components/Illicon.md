# Illicon

`Illicon` renders saved dot-grid occupancy as SVG circles. Grid data contains only
equal-length, nonempty rows of `0`s and `1`s. Empty rows and columns, including
borders, are preserved. Height is the number of rows; width is the length of a row.

```tsx
import { Illicon, type DotGridData } from '@coreai-ds/react-components';

const plus: DotGridData = {
  rows: ['00000', '00100', '01110', '00100', '00000'],
};

<Illicon data={plus} radius={1} pitch={5} aria-label="Add" />;
```

## Pixel sizing and alignment

Radius and pitch are rendering settings in CSS pixels, not occupancy data. Pitch
is the center-to-center distance between cells. The default radius is 1 and pitch
is 5, producing 2px dots with 3px gaps. Both must be positive and finite; radius
cannot exceed half the pitch.

The SVG renders at `columns * pitch` by `rows * pitch` CSS pixels. There is no
independent `size` for grids: a 2px circle stays 2px when sampling resolution or
pitch changes. Grid SVGs do not stretch or flex-shrink to fit their wrapper.

When pitch and circle diameter are whole pixels, circle bounding edges align to
integer SVG coordinates. This works for even and odd pitches and diameters.
For example, 2px circles with pitch 5 have centers at 2, 7, 12, rather than
2.5, 7.5, 12.5. If the unused space in a cell is odd, one extra pixel remains on
the trailing side. The complete grid artboard, including empty borders, is retained.

Fractional pitch and diameter remain supported; those settings keep centered
geometry without snapping. Curves still need anti-aliasing. Pixel alignment is
local to the SVG: parent transforms, fractional positioning, zoom, and device
scale can affect the final physical pixels.

Omit accessible labels for decorative artwork; use `aria-label` or
`aria-labelledby` when the image conveys information. Ink follows the theme's
neutral foreground color and can be overridden with CSS.

## Convert an icon or SVG

Conversion is an asynchronous, browser-only preparation step, not part of rendering.
Import it from the main package alongside the renderer and SVG exporter:

```ts
import { Heart24Filled } from '@fluentui/react-icons';
import { iconToDotGrid } from '@coreai-ds/react-components';

const heart = await iconToDotGrid(Heart24Filled, { columns: 24 });
// Save as JSON or reuse the result. Pass heart to <Illicon data={heart} />.
```

For Fluent icons, prefer integer multiples of the native SVG dimensions:

| Native icon | 1x grid | 2x grid | 3x grid |
| ----------- | ------- | ------- | ------- |
| 16 x 16     | 16 x 16 | 32 x 32 | 48 x 48 |
| 24 x 24     | 24 x 24 | 48 x 48 | 72 x 72 |

A 24px icon sampled at 2x produces 48 x 48 cells. With pitch 5, it renders at
240 x 240 CSS pixels; radius 1 still produces 2px circles.

```ts
import { Heart16Regular } from '@fluentui/react-icons';

const multiplier = 2;
const outline = await iconToDotGrid(Heart16Regular, { columns: 16 * multiplier });
```

These multiples are guidance, not a restriction. The converter continues to
accept arbitrary valid grid dimensions for custom artwork or experimentation.
Use explicit columns for native sizes other than 24; the default remains 24.
The Storybook comparison offers native 16px, 20px, and 24px Filled/Regular pairs
with 1x-4x sampling. Regular icons usually draw outlines with filled paths, so
the separate stroked SVG example also tests actual SVG `stroke` geometry.

Sources may be Fluent icon components, React SVG elements, `SVGSVGElement`s, or
standalone SVG markup. A positive viewBox is required, or numeric/px width and
height. Fractional dimensions and nonzero viewBox origins are supported.

`columns` defaults to 24. `rows` defaults to the source aspect ratio, rounded to
whole cells. Both are limited to 1-256. Explicit rows use the SVG's
`preserveAspectRatio` behavior to fit the artwork into that viewport. Each cell
samples alpha at its center using an internal 5-pixel-per-cell raster. This
sampling detail is unrelated to rendering pitch or circle diameter. `alphaThreshold`
defaults to 128 (approximately 50% opacity) and accepts integers from 1 to 255.
The output always retains every requested row and column, even when entirely empty.

The browser renders static vector shapes, paths, strokes, transforms, and local
definitions such as gradients, masks, and clipping paths. External styles are not
captured. Local masks work as SVG attributes or inline CSS (`mask` or its longhands);
all mask references must resolve within the source SVG.
Scripts, event handlers, animation, stylesheets, text/fonts, images,
external references, and unsupported SVG elements/styles are rejected. Sources are
limited to 1 MiB of UTF-8 text and 10,000 elements. Conversion errors reject the promise;
callers must surface them. During server rendering, use saved grid data instead.

## Export SVG for Figma

```ts
import { dotGridToSvg } from '@coreai-ds/react-components';

const markup = dotGridToSvg(plus, { radius: 1, pitch: 5 });
```

The result is a standalone SVG document with editable circles, explicit dark ink,
and the complete artboard. It uses the same circle positions as `Illicon`. Save or
copy this markup into design tools; there is no need to maintain a second drawing
by hand.

## Preserve custom SVG artwork

Use the separate children mode for trusted inline SVG or an SVG component that
forwards SVG props. Do not pass raw markup strings to `Illicon`.

```tsx
<Illicon size={120} aria-label="Custom illustration">
  <svg viewBox="0 0 40 20" fill="currentColor">
    <circle cx="4.25" cy="5.75" r="1.25" />
    <path d="M10 2h12v10H10z" fill="none" stroke="currentColor" />
  </svg>
</Illicon>
```

Geometry is preserved, including irregular dots and hybrid illustrations.
Use `currentColor` for theme-controlled fills and strokes; explicit colors stay
unchanged. Supply either `data` or SVG children, not both. Radius and pitch apply
only to grid data. Optional `size` applies only to custom SVG and preserves its
aspect ratio; it does not apply to grids. Custom SVG is trusted React content, not a sanitized upload;
authors must handle internal IDs correctly when artwork is rendered more than once.
