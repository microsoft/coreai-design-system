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

### Recommended standard: native 20px at 2x

For new Fluent-based Illicons, use the actual native **20px icon at 2x**.
This produces a **40 x 40 canvas and occupancy grid**. Prefer Filled icons;
use Regular when the illustration needs an outline. Do not resize a 16px or
24px variant to imitate the 20px source.

Keep the default radius of 1px and pitch of 5px unless the design needs a
different rendering treatment. This gives a 200 x 200px illustration with 2px
dots. Save the occupancy after preparation; applications need not run conversion
each time the illustration renders.

```ts
import { Scales20Filled } from '@fluentui/react-icons';
import { iconToDotGrid } from '@coreai-ds/react-components';

const scales = await iconToDotGrid(Scales20Filled, { multiplier: 2 });
// multiplier: 2 is the default, so omitting the options gives the same grid.
// Save as JSON or reuse the result. Pass scales to <Illicon data={scales} />.
```

Source coordinates on half-pixels become whole pixels at 2x. Curves and other
fractional geometry can still anti-alias; this is not a guarantee of sharpness
for every source.

### Other sampling settings

The converter reads source dimensions from the SVG's `viewBox`, not its component
name or display size. Without a viewBox it uses numeric/px width and height.
`multiplier` defaults to 2 and can be any whole number from 1 to 256, provided
the resulting dimensions fit the 256-cell limit. Other native sizes and
multipliers remain supported for custom needs and visual testing; they do not
replace the recommended 20px-at-2x standard:

| Native icon | 1x grid | 2x grid | 3x grid |
| ----------- | ------- | ------- | ------- |
| 16 x 16     | 16 x 16 | 32 x 32 | 48 x 48 |
| 20 x 20     | 20 x 20 | 40 x 40 | 60 x 60 |
| 24 x 24     | 24 x 24 | 48 x 48 | 72 x 72 |

```ts
import { Heart16Regular } from '@fluentui/react-icons';

const outline = await iconToDotGrid(Heart16Regular, { multiplier: 3 });
// 48 x 48 cells.
```

For arbitrary grid sizes, use explicit `columns` and/or `rows` instead of
`multiplier`. These remain supported; do not combine the two sampling modes.
With explicit columns, omitted rows follow the source aspect ratio, rounded
to whole cells. With rows alone, width still defaults to source width times 2.
Fractional source dimensions times the multiplier are rounded to the nearest
whole pixel, with a minimum of 1. Each output dimension must be 1-256.

The Storybook recreation comparison uses native 20px icons at 2x by default,
with editable 16px/20px/24px sources and 1x-4x sampling for verification.
Regular icons usually draw outlines with filled paths rather than SVG `stroke`
attributes.

Sources may be Fluent icon components, React SVG elements, `SVGSVGElement`s, or
standalone SVG markup. A positive viewBox is required, or numeric/px width and
height. Fractional dimensions and nonzero viewBox origins are supported.

For custom monochrome source artwork, pass the SVG markup directly:

```ts
const source = '<svg viewBox="0 0 20 20" fill="#000000"><path d="M4 4h12v12H4z"/></svg>';
const customGrid = await iconToDotGrid(source, { multiplier: 2 });
```

SVG defaults to black fill when no fill is specified. Explicit black fill makes
the source's monochrome intent clear. Keep the background transparent: sampling
uses alpha, so an opaque white background would also turn on dots. The comparison
story includes AI Gateway and Foundry as SVG strings, not Fluent replacements.
For a `.svg` file, load its text with the application's asset tooling and pass
that markup to the same utility; a file URL is not SVG markup.

### Raster and SVG behavior

Explicit rows use the SVG's `preserveAspectRatio` behavior to fit the artwork
into that viewport. The browser
renders directly into a canvas of `columns` by `rows` pixels, one pixel per cell:
a 20px icon at 1x uses a 20 x 20 raster; at 2x it uses 40 x 40. There is no larger
intermediate raster or center-point subsampling. A cell is occupied when its
pixel alpha reaches `alphaThreshold`, which defaults to 128 (approximately 50%
coverage/opacity) and accepts integers from 1 to 255. Anti-aliasing and source
opacity both affect alpha. This sampling is unrelated to rendering pitch or
circle diameter. The output always retains every requested row and column,
even when entirely empty.

This differs from the earlier fixed-24-cell default and supersampled center-point
approach; regenerating data can change grid dimensions and dots near edges or
thin features. Previously saved data is unchanged. Rasterizing an exported
dotted SVG is not a lossless grid-data import: small dots may cover less than
the threshold of a pixel. Reuse saved occupancy
when exact grid preservation is required.

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
