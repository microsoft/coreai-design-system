---
name: release-docs
description: 'Prepare the documentation release for every PR targeting main, including maintenance-only PRs. Update the shared docs/skill version and documentation changelog once per PR; reconcile them when updating an existing PR.'
---

# Prepare a documentation release

Every PR merged to `main` deploys the documentation site. This is a per-PR
procedure, not a separately staged release. Follow it before opening or updating
any PR targeting `main`, regardless of which files changed. Do not open or merge
a PR, create tags, or deploy as part of this skill.

1. Fetch current `origin/main` and inspect the whole proposed PR, including
   staged, unstaged, and relevant untracked changes. Preserve unrelated edits.
   Compare the docsite version with the target branch, not the last local commit.
2. Use one shared docs/skill version higher than current `origin/main`.
   Normally use the next patch; use a larger semantic increment when warranted.
   If this PR already has an appropriate increment, keep it: do not bump per
   commit, review update, check, or deployment retry.

   From the repository root, when a bump is needed:

   ```powershell
   npm version patch --workspace apps/docsite --no-git-tag-version
   ```

   If the branch is behind main, choose an explicit version above main instead
   of repeatedly incrementing the stale local version.
3. Package releases retain their independent package version. Change that first
   where possible, then apply this same docs procedure. If the PR already has
   its docs increment, keep it and synchronize the labels:

   ```powershell
   npm --workspace apps/docsite run sync:versions
   ```

   npm's version lifecycle normally runs synchronization automatically. Commit
   the docsite manifest, root lockfile, and canonical consumer skill together.
   Do not bump the component package for a docs-only or maintenance-only PR.
4. Add or update the first release section in
   [DocumentationChangelog.md](../../../apps/docsite/content/overview/DocumentationChangelog.md):
   `## [VERSION] - YYYY-MM-DD`, with today's preparation date and concise,
   meaningful notes describing the whole PR. State when a release only changes
   maintenance/infrastructure; do not imply product changes. Keep earlier release
   entries. This is separate from the component-package changelog.
5. Run from the repository root:

   ```powershell
   npm --workspace apps/docsite run check:release -- --base=origin/main
   ```

   This validates the version increase, docs changelog, lockfile, and consumer
   skill labels without rewriting them. Run the existing focused tests/build
   appropriate for the actual changes, plus the create-pr quality checks.
6. Report the docs/skill version, changelog summary, comparison base, and validation
   results in the PR description. Before merging, update the branch with current
   main and rerun the check. If another PR used the same version, reconcile the
   manifest/lockfile/skill and keep both changelog entries under distinct versions.

The Documentation workflow checks every PR and push to main, not a path filter.
Manual redeployments do not create a release or bump versions. CI only validates;
it never silently changes source. Required checks and an up-to-date branch (or
an equivalent merge queue) are needed to prevent two previously green PRs from
merging with the same version. Do not change repository protections yourself.
