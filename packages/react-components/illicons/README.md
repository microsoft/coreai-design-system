# Contributing illicons

This directory is the source of truth for finished Illicon SVGs packaged with
`@coreai-ds/react-components`. Storybook's **Components / Illicon / Catalog** makes
the assets searchable and copies their original SVG markup for Figma or further
editing. Its previews are 80px; original SVG artboards remain 140px.

The completed `Illicon` component accepts saved dot-grid data or custom inline SVG,
not an artwork name. See the [component guide](../src/components/Illicon.md) for
usage and sizing. Saved-data catalog integration is a separate step; the current
`illicons` registry retains artwork metadata and original image sources only.

## Standard for Fluent-based Illicons

Use the actual native **20px Fluent icon at 2x** for new generated artwork.
Prefer Filled, or Regular when an outline is intended. This produces a
40 x 40 canvas and grid. The converter's default multiplier is 2. At the
default 1px radius and 5px pitch, the grid renders at 200 x 200px with 2px dots.
See the [component guide](../src/components/Illicon.md#recommended-standard-native-20px-at-2x)
for conversion and saved-data usage.

This standard applies to new source-based generation, not to finished designer
SVGs. Keep existing artwork and custom logos unchanged unless a replacement has
been reviewed. The saved-data catalog and its generation workflow remain separate work.

## Preserve finished artwork

The existing catalog SVGs are the reviewed artwork, not inputs for another
conversion pass. Preserve their paths, circles, transforms, and artboards.
Literal circle elements are not required: paths exported by Figma are valid
finished geometry. Do not re-sample finished SVGs into dot-grid data.

## Add artwork

You can use your SVG in a consuming app without submitting it here. Follow
[Use your own SVG](../src/components/Illicon.md#use-your-own-svg) to wrap it in a
React component and pass it to `Illicon`. To share the artwork with other
consumers, contribute the original standalone SVG using these steps.

1. Check the catalog for an existing concept. Follow the
   [repository contribution policy](../../../CONTRIBUTING.md) to create a
   focused branch. Only submit artwork you have the right to contribute under
   this repository's license.
2. Export a transparent, monochrome SVG at `width="140"`, `height="140"` and
   `viewBox="0 0 140 140"`. Keep finished dot geometry unchanged. Check centering,
   visual weight, and family consistency; do not re-sample through a converter.
   When using an export scale control, select 100%, with background and
   construction-grid options disabled. For artwork from another artboard size,
   prepare a reviewed 140 x 140 version in your design tool; do not just change
   the viewBox numbers and crop or distort the drawing.
   Follow the [SVG contract](#svg-contract) below. Consumer inline SVG can use
   features that the catalog validator does not accept.
3. Save it here as a lowercase kebab-case filename, such as `trash.svg`.
4. Add an entry to `manifest.json`:

   ```json
   {
     "title": "Trash",
     "file": "trash.svg",
     "tags": ["delete", "remove"],
     "author": "your-github-handle"
   }
   ```

5. After repository setup, validate the files and regenerate the registry from
   the repository root:

   ```bash
   npm run illicons:check
   node scripts/generate-illicons.mjs
   npm run storybook
   ```

6. Open **Components / Illicon / Catalog**. Check search, preview, and Copy SVG.
   Paste the copied SVG into Figma and confirm the geometry and artboard.
   Check its consuming-app wrapper using the
   [inline SVG checklist](../src/components/Illicon.md#size-theme-accessibility-and-repeated-instances),
   including repeated instances and theme-aware paint.
7. Open a PR targeting `microsoft/coreai-design-system`. Include:
   - The illustration's purpose and any related issue.
   - The standalone SVG and matching manifest entry, with creator credit.
     Do not hand-edit the generated registry.
   - Light/dark screenshots at the intended display size and any intentional
     fixed-color or geometry decisions.
   - The validation commands run and their results. Follow the repository's
     required license, formatting, lint, build, and CI checks.
   - A completed CLA check when requested by the bot.

Maintainers review geometry, theme behavior, metadata, licensing, and family
consistency before approval. A merged SVG becomes available to package consumers
through a published release, not immediately on merge.

Storybook startup validates and generates the catalog automatically. If Storybook
is already running, regenerate after saving the SVG and manifest:

```bash
node scripts/generate-illicons.mjs
```

See the [repository contribution policy](../../../CONTRIBUTING.md) for setup and
review and CLA requirements. Assets reach consumers in a published package release.

## Manifest contract (version 1)

- `title`: unique, trimmed display title.
- `file`: unique lowercase kebab-case `.svg` filename in this directory.
- `tags`: an array of unique, trimmed, lowercase search terms; use `[]` when no
  additional keywords are useful. Do not repeat the illustration's title.
- `author`: the artwork creator's GitHub handle or credited name.

The filename determines the registry ID: `trash.svg` becomes `trash`.
Keep filenames stable so existing registry lookups continue to work.

## Suggest tags

Edit an existing entry's `tags` in `manifest.json` without changing its filename or SVG.
Use relevant search terms beyond the title, or leave the array empty. Run the
same checks and submit the update in a pull request.

## SVG contract

The validator parses XML and rejects malformed documents, executable content,
event handlers, CSS, embedded images, remote references, DOCTYPE, and processing
instructions. It accepts static SVG shapes, groups, definitions, text-only
titles/descriptions, and local `use` references directly to shapes. References
to groups or other `use` elements are not supported. Files must be regular files,
at most 1 MiB, and at most 20,000 elements.

The accepted shapes are `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`,
and `polygon`. Nested SVGs, gradients, masks, clipping paths, filters, animation,
and text elements are not supported by this catalog validator. Resolve these
effects into supported static geometry before submitting, and visually check
the result. Remove XML declarations and DOCTYPE from the exported file.

Supported paints are `none`, `currentColor`, `black`, `white`, and hex colors.
For theme-aware inline use, make the intended ink `currentColor` in the React
version. Preserve `none`, opacity, and any intentional fixed paint. A
`currentColor` inside an SVG displayed as an image does not inherit the consuming
page's CSS color; the current gallery applies its own preview treatment.
Transforms and original path/circle geometry are preserved. Export unsupported
effects as static vector shapes before submitting; the validator never rewrites
artwork. Automated checks are not a visual or accessibility review: maintainers
still verify dot spacing, size, contrast, centering, meaningful names/tags, and
consistency with the illustration family.

The manifest and all listed SVGs are validated before generating the typed
artwork registry. Missing files, duplicate filenames/titles, missing authors,
invalid tags, unsafe SVGs, and unlisted SVG files fail validation. The registry
embeds byte-identical SVGs as image sources, avoiding asset-path configuration
and keeping SVG IDs isolated when an illustration appears more than once.
