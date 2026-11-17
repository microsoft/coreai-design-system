---
id: documentation-changelog
title: Documentation changelog
summary: Dated changes to documentation, agent guidance, and site maintenance.
resources: []
reference:
  standalone: true
---

Each merge to main publishes current documentation. The component package has its own version and
[package changelog](./Changelog.md). Only the current documentation is hosted;
these notes are not archived documentation snapshots.

Earlier changes remain recorded in Git history. These dated notes describe
meaningful changes, not documentation snapshots or npm package releases.

## Build timestamps and dated documentation notes - 2026-11-17

- Replace documentation semantic versions and per-PR bump checks with one UTC
  build timestamp shared by metadata, the footer, and published agent guidance.
- Link the footer and skill to these notes. Agents check timestamps, review
  dated changes, and verify the hash of the published skill before updating.
- Keep component npm versions independent and unchanged.

## Public npm migration guide - 2026-11-16

- Add a migration guide from the retired `@coreai/fluentui-react` Azure Artifacts
  package to `@coreai-ds/react-components` on public npm.
- Link the migration guide from the package guide, READMEs, and package changelog.

## Documentation maintenance workflow - 2026-11-16

- Introduce documentation changelog notes for PRs to main, including maintenance.
- Add reusable maintainer guidance and CI validation for documentation changes.
