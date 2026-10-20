---
name: release-package
description: 'Prepare a release of @coreai-ds/react-components: reconcile the changelog, bump the version, validate the package, and open a release PR. Use when asked to release or publish the npm package.'
---

# Prepare a package release PR

Read [RELEASING.md](../../../packages/react-components/RELEASING.md) first.
The deliverable is an open pull request against `microsoft/coreai-design-system:main`,
not a local plan. Do not merge it, create tags/releases, publish locally, or change
repository variables, environment protections, or credentials. Once enabled, Actions
publishes the version-changing main commit after CI succeeds and tags it `vVERSION`.

1. Check the remote, worktree, GitHub account, and existing release PRs. Follow the
   `github-accounts` skill before using `gh`. Use `arniebradfo` for this repository.
   Preserve unrelated edits; do not include them in the release. Start from current
   `origin/main` on `release/vVERSION`. If unrelated work prevents a clean release,
   use a separate worktree or ask the user rather than resetting their work.
2. Read the manifest, root lockfile, changelog, publishing workflow, Git tags, and
   public npm version metadata. Confirm the requested version; if unspecified,
   propose the appropriate semver increment and ask before bumping. The first public
   release is **0.12.0**, not the manifest's historical 0.11.1 plus a patch.
3. Establish the last released source baseline. Review every merged PR and commit
   since it, including first-parent merges and package source differences. Reconcile
   user-visible changes with `[Unreleased]` and give explicit consumer migrations for
   breaking changes. No tags exist before the first public release: document that
   limitation and review the available history rather than inventing a baseline/tag.
   Historical 0.11.2 includes provider circular-dependency fix `567dc9a`, merged in
   PR #9; its exact privately published source baseline is unconfirmed.
4. Run `npm version VERSION --workspace packages/react-components --no-git-tag-version`.
   Update the package manifest and root lockfile together. Roll `[Unreleased]` into
   `[VERSION] - YYYY-MM-DD`, add a fresh `[Unreleased]`, and update heading anchors.
   For 0.12.0, retain the first-public-npm-release statement and historical fixes.
   Do not add comparison links to tags that do not exist yet.
5. Run the release guide's local checks with existing dependencies. Install/restore
   dependencies only if needed after a dependency change or missing-dependency error.
   Verify an actual tarball; never ship font binaries or rely on `publishConfig` to
   rewrite exports. Do not claim checks passed unless they ran successfully.
6. Check release readiness without reading secret values: the repository's
   `NPM_PUBLISH_ENABLED` variable, main review/CI rules, `npm-production` main-only
   environment, npm trusted-publisher readiness, and Actions tag/release permissions.
   npm trust must name `microsoft/coreai-design-system`, `publish-package.yml`, and
   `npm-production`. Do not treat an old `NPM_TOKEN` secret as OIDC readiness.
   Require owner confirmation if npm settings cannot be inspected; never claim that
   an untested or expired relationship works. Finish incomplete prior release records
   before the next release; completion recovery must not republish.
   Missing publishing setup must be reported in the PR; never enable it yourself.
   Distinguish a confirmed npm package 404 from an authentication/network failure.
7. Commit only release-scoped changes, including the required Copilot co-author
   trailer, push the release branch, and use `gh pr create` targeting `main`.
   Follow the `create-pr` skill. Include version, baseline evidence/limitations,
   changelog reconciliation, checks and results, and publishing readiness blockers.
   Explain that merging authorizes automatic publication when enabled. Never use
   `--admin` or bypass checks. Report the PR URL and stop; the user reviews/merges.

For a cold-start test, perform this same PR-opening workflow. Do not stop after
describing what you would do. An incorrect test PR can be closed without publishing.
If blocked, report the exact blocker rather than claiming the release is ready.
