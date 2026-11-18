# Documentation changelog

Each merge to main publishes current documentation. The component package has its own version and
[package changelog](../../packages/react-components/CHANGELOG.md). Only the current documentation is hosted;
these notes are not archived documentation snapshots.

Earlier changes remain recorded in Git history. These dated notes describe
meaningful changes, not documentation snapshots or npm package releases.

## Documentation experience and agent guidance - 2026-11-18

- Improve navigation, search, theme settings, content guidance, and live examples
  across the documentation site.
- Combine site updates and package releases in one chronological changelog.
- Use the current Markdown agent guidance and skill download in onboarding links.
- Keep publishing link updates within the docsite without changing Storybook or package sources.

## Native pull request stacking workflow - 2026-11-17

- Maintenance only: add a reusable skill for ordering existing PRs, resolving
  shared-file conflicts before review, validating native GitHub stack membership,
  and handing off an approved tranche for an ordered atomic merge.
- Preserve existing PR changes and review requirements; do not merge automatically
  or bump documentation or component package versions.

## Build timestamps and dated documentation notes - 2026-11-17

- Replace documentation semantic versions and per-PR bump checks with one UTC
  build timestamp shared by metadata, the footer, and published agent guidance.
- Link the footer and skill to these notes. Agents check timestamps, review
  dated changes, and verify the hash of the published skill before updating.
- Consolidate dated documentation notes in `apps/docsite/CHANGELOG.md`, included
  in the published documentation changelog without copying the notes.
- Remove duplicate curated package summaries and their legacy presentation and
  data files. Keep the separate canonical package changelog and public history.
  Preserve the unique 0.1.x historical notes in the canonical package changelog.
- Keep component npm versions independent and unchanged.

## Dependency maintenance - 2026-11-17

- Maintenance only: update Vite and align Storybook dependencies, and regenerate
  the workspace lockfile.

## Public npm migration guide - 2026-11-16

- Add a migration guide from the retired `@coreai/fluentui-react` Azure Artifacts
  package to `@coreai-ds/react-components` on public npm.
- Link the migration guide from the package guide, READMEs, and package changelog.

## Documentation maintenance workflow - 2026-11-16

- Introduce documentation changelog notes for PRs to main, including maintenance.
- Add reusable maintainer guidance and CI validation for documentation changes.
