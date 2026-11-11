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

## Use your own SVG

Pass finished artwork as one SVG child. This uses the same inline-SVG rendering
mode for your own artwork and artwork copied from the shared catalog. You do not
need to contribute an SVG to this repository before using it in your application.
Do not pass finished artwork through `iconToDotGrid`: that would sample it again
and could change its geometry.

### Prepare the artwork

- Keep a `viewBox` with positive width and height. Preserve its aspect ratio,
  empty borders, paths, circles, transforms, and intentional opacity.
- Use a transparent background. Remove any artboard-sized background rectangle
  unless it is part of the illustration.
- Circles are not required. Figma-exported paths and hybrid geometry are valid.
- For theme-aware ink, use `fill="currentColor"` and/or `stroke="currentColor"`.
  Check child shapes for hardcoded paints that override inherited paint.
  Preserve `fill="none"` on outlines and intentional fixed colors. `Illicon`
  does not replace colors automatically.
- Keep the SVG self-contained. Do not depend on external fonts, images, styles,
  or remote references. Convert text to paths when needed.
- Only use trusted artwork reviewed with your application code. Inline SVG is
  React content, not a sanitized file-upload feature. Do not inject untrusted
  strings with `dangerouslySetInnerHTML`.

Consumer artwork can have its own artboard size. The shared catalog has a
stricter [SVG contribution contract](../../illicons/README.md#svg-contract),
including a 140 x 140 artboard.

### Wrap SVG markup in a React component

This works without an SVG loader. Keep your original `.svg` file for editing.
Copy its geometry into a `.tsx` component and use React attribute names, such as
`className`, `fillRule`, `clipPath`, and `strokeWidth`, instead of `class`,
`fill-rule`, `clip-path`, and `stroke-width`.

```tsx
import * as React from 'react';
import { Illicon } from '@coreai-ds/react-components';

function MyIllustrationSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" fill="currentColor" {...props}>
      <circle cx="4.25" cy="5.75" r="1.25" />
      <path d="M10 2h12v10H10z" fill="none" stroke="currentColor" />
    </svg>
  );
}

<Illicon size={120} aria-label="Custom illustration">
  <MyIllustrationSvg />
</Illicon>;
```

The child component must forward SVG props to its root `svg`, including
`className`, `aria-hidden`, and `focusable`. Keep the forwarded props after the
root defaults so `Illicon` can apply its sizing and accessibility treatment.
Do not wrap the root SVG in another HTML element.

Alternatively, pass a literal `<svg>...</svg>` child directly. Both forms use
the same renderer.

### Import an SVG file as a React component

If your app already has an SVG-to-React transform, such as SVGR, import the file
using that tool's syntax and use the resulting component in the same child slot.
Configure it to retain the `viewBox`, forward root SVG props, and preserve
geometry and theme-aware paint. Check that optimization does not remove small
dots or change their spacing.

SVG import syntax depends on the application's build tooling. A normal asset
import may return a URL, not a React component. `Illicon` does not load file paths,
URLs, or raw SVG strings. No special loader is required if you use the `.tsx`
approach above.

### Size, theme, accessibility, and repeated instances

- Supply either `data` or one SVG child, not both. `radius` and `pitch` apply
  only to grid data.
- For SVG children, set a positive `size` for the display width in CSS pixels.
  Height follows the SVG aspect ratio. The example above renders at 120 x 60px.
  Size scales finished geometry; it does not change the stored SVG or re-sample it.
- Ink using `currentColor` follows the theme's neutral foreground. To override
  it, set CSS `color` on `Illicon`, for example `style={{ color: 'var(--illustration-ink)' }}`.
  Hardcoded fills and strokes stay unchanged.
- Put `aria-label` or `aria-labelledby` on `Illicon` for meaningful artwork.
  Omit both for decorative artwork, such as an illustration beside an equivalent
  empty-state heading. `Illicon` hides the inner SVG from assistive technology.
- For SVG definitions referenced by ID, use unique IDs per rendered instance.
  In a hand-authored component, create an ID with `React.useId()` and use it in
  both `id` and the matching `href` or `url(#...)` reference. A fixed prefix
  shared by every instance does not prevent collisions between repeated copies.

Before shipping, render two copies together, check light and dark themes, and
check the intended display sizes. Confirm the shape, gaps, transparency, and
accessible name. This inline-SVG path works during server rendering and needs
no canvas.

### Contribute your SVG to the shared catalog

Use the [artwork contribution guide](../../illicons/README.md#add-artwork)
for the accepted SVG subset, filename and metadata requirements, validation
commands, and PR checklist. Submit the standalone SVG and its manifest entry,
not just the consuming app's React wrapper. Keep finished geometry intact.
