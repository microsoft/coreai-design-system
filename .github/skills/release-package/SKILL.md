---
name: release-package
description: 'Prepare or release @coreai-ds/react-components on public npm. Read RELEASING.md first'
---

# Releasing @coreai-ds/react-components

Before any release work, read
[RELEASING.md](../../../packages/react-components/RELEASING.md), the source of
truth for versioning, packaging checks, and manual publishing.

- Preparation alone never publishes, pushes, bumps versions, or creates tags.
  Keep package publishing disabled until the package access and publishing setup
  is complete.
- Target only `microsoft/coreai-design-system`, npm, and `main`.
  The manual workflow requires the repository variable `NPM_PUBLISH_ENABLED=true`,
  a protected `npm-production` environment, and
  exact `publish @coreai-ds/react-components@VERSION` confirmation.
- Before bumping, inspect every merged PR since the last approved release baseline
  (`git log --merges --first-parent <last-tag>..HEAD`) and reconcile all user-visible
  changes with `## [Unreleased]`. Log breaking migrations explicitly.
- Validate an actual tarball with `npm run test:package --workspace
  packages/react-components`. Main/types/exports must already target compiled
  `dist`; never rely on npm rewriting them through `publishConfig`. Do not ship
  locally installed Aptos assets or any other font binaries.
- Review package selection, npm scope ownership, and access before the first npm
  publication. Consumer installs require no authentication. Publisher credentials
  belong only in the protected environment; prefer trusted publishing once explicitly
  configured and reviewed.
- Versions are immutable. The workflow publishes the checked/packed version, never
  bumps it or pushes a tag, and duplicate versions fail. Follow RELEASING exactly.
