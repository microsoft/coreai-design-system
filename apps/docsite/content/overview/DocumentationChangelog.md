---
id: documentation-changelog
title: Documentation changelog
summary: Changes to documentation, agent guidance, and site maintenance in each merged release.
resources: []
reference:
  standalone: true
---

Every PR merged to main publishes a new docs/skill version, including maintenance
releases. The component package has its own version and
[package changelog](./Changelog.md). Only the current documentation is hosted;
these notes are not archived documentation snapshots.

Tracking starts at 0.1.2. Earlier merges shared docs/skill 0.1.1; their individual
changes remain recorded in Git history.

## [0.1.4] - 2026-11-17

- Maintenance only: update Vite and align Storybook dependencies, and regenerate
  the workspace lockfile.

## [0.1.3] - 2026-11-16

- Add a migration guide from the retired `@coreai/fluentui-react` Azure Artifacts
  package to `@coreai-ds/react-components` on public npm.
- Link the migration guide from the package guide, READMEs, and package changelog.

## [0.1.2] - 2026-11-16

- Require a docs/skill version increase and documentation changelog entry for
  every PR to main, including maintenance-only changes.
- Add the reusable maintainer release procedure and CI validation. Package
  releases reuse the same docs increment instead of requiring a second one.
