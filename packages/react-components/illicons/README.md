# Contributing illicons

This directory is the source of truth for finished Illicon SVGs packaged with
`@coreai-ds/react-components`. Storybook's **Components / Illicon / Catalog** makes
the assets searchable and copies their original SVG markup for Figma or further
editing. Its previews are 80px; original SVG artboards remain 140px.

The completed `Illicon` component accepts saved dot-grid data or custom inline SVG,
not an artwork name. See the [component guide](../src/components/Illicon.md) for
usage and sizing. Saved-data catalog integration is a separate step; the current
`illicons` registry retains artwork metadata and original image sources only.

## Add artwork

1. Check the catalog for an existing concept.
2. Export a transparent, monochrome SVG at `width="140"`, `height="140"` and
   `viewBox="0 0 140 140"`. Keep finished dot geometry unchanged. Check centering,
   visual weight, and family consistency; do not re-sample through a converter.
   When using an export scale control, select 100%, with background and
   construction-grid options disabled.
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

5. From the repository root, run:

   ```bash
   npm run storybook
   ```

6. Open **Components / Illicon / Catalog**. Check search, preview, and Copy SVG.
   Include light/dark screenshots in your PR.

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

Supported paints are `none`, `currentColor`, `black`, `white`, and hex colors.
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
