# Releasing

Maintainers release `@coreai-ds/react-components` from
<https://github.com/microsoft/coreai-design-system> to <https://registry.npmjs.org/>.
The `release-package` skill prepares and opens a release PR. It never merges,
publishes, creates tags, or enables publishing.

## Release contract

1. Review and merge a PR updating the package version, root lockfile, and changelog.
2. The **CI** push run must succeed for that exact `main` commit.
3. **Publish npm package** checks whether the package version differs from that
   commit's first parent. Unchanged versions do nothing, even if npm is behind.
4. When enabled, the workflow validates and publishes the exact commit and tarball.
5. After unauthenticated npm metadata confirms the artifact integrity and dist-tag,
   it creates `vVERSION` on that same commit and a GitHub release using its changelog.

For a merge commit, the first parent is the preceding `main` revision. Squash and
rebase merges are also supported; the tagged SHA is the version-changing push head.
Do not batch a release version change with later commits in one push: the workflow
compares the push head with its first parent. Merge a dedicated release PR.
Later merges cannot silently become the source of a failed release.

Stable versions use npm's `latest` dist-tag; prereleases use `next`. Version
comparisons use semantic versioning, not string ordering. Stable releases must
exceed published stable versions; prereleases must exceed all published versions.
An absent package is allowed only for the initial public **0.12.0** release.
Only a registry HTTP 404 selects that path. Authentication errors, malformed
responses, rate limits, and network failures stop the workflow.

## Required publishing setup

Keep the **repository** Actions variable `NPM_PUBLISH_ENABLED` unset or `false`
until all prerequisites are approved. The workflow only runs for successful CI
from a `push` to `main` in exactly `microsoft/coreai-design-system`. PRs, forks,
tags, and manual CI dispatches do not publish. A manual publishing recovery dispatch
on `main` may select an original successful CI push run as described below.

Before enabling publication:

1. Review the selected package's source, owners, consumers, license and access.
   Only `@coreai-ds/react-components` is selected; other workspaces are not published.
   Verify its MIT license and included license text. Repository documentation uses
   CC-BY-4.0; repository code uses MIT.
2. Verify ownership and publishing rights for the npm `@coreai-ds` scope and
   package name. Earlier versions were privately distributed under
   `@coreai/fluentui-react`; the public package starts at 0.12.0. Do not transfer
   ownership or change another package's access on assumption.
3. Protect `main` with required PR review and the **Validate** check from **CI**.
   Preserve these requirements; merging the release PR authorizes publication.
4. Create `npm-production` and restrict its deployment branches to `main`.
   Required environment reviewers add a final approval checkpoint; without them,
   the reviewed PR merge is the human approval and publication is automatic.
   Do not remove existing reviewer requirements without owner approval.
5. Configure the environment secret described below. Permit the publishing job's
   `GITHUB_TOKEN` to create tags and releases (`contents: write`); it needs no PAT.
   If tag rules prevent creation, arrange narrowly scoped permission through
   repository administrators, not a blanket bypass of main protection.
6. Set repository variable `NPM_PUBLISH_ENABLED=true` only after reviewing this
   automatic-release behavior. Limit who can change the variable, workflow,
   environment, and secrets.

Disabling publication stops new runs; it does not cancel an already queued or
running job. Inspect those separately. Runs are serialized without cancelling an
active release; GitHub concurrency is not a durable queue for rapid successive
releases. Finish one release before merging the next version bump.
The workflow must be present on the default branch for `workflow_run` to trigger.

## Publisher authentication

### First release: short-lived granular token

The checked-in workflow uses the `npm-production` **environment secret** `NPM_TOKEN`.
The npm account creating it must have permission to create packages in `@coreai-ds`.
Use short-lived granular **Packages and scopes** read/write access restricted to
`@coreai-ds` for bootstrap; organization-management permissions alone do not allow
publishing. Enable bypass 2FA for unattended direct publication only when npm
organization policy permits. Do not weaken account-wide 2FA.

Store the token only in the environment secret, never in a tracked file or chat.
It is supplied only to `npm publish`, not installation or build steps. The workflow
uses `--access public --ignore-scripts` and publishes the verified tarball, not a
newly packed working directory. No placeholder publication is needed.
Consumer installs require no authentication.

Direct publication with bypass-2FA granular tokens is being deprecated in January 2027. Treat this as bootstrap authentication and migrate promptly. A stage-only
token is not compatible with this direct-publishing workflow.
See [npm token documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens/).

### Subsequent releases: trusted publishing

After the package exists, its npm owner should configure a trusted publisher for
GitHub owner `microsoft`, repository `coreai-design-system`, workflow
`publish-package.yml`, and environment `npm-production`.
Follow [npm's current trusted-publisher requirements](https://docs.npmjs.com/trusted-publishers/).

In a separately reviewed change, use a supported Node/npm combination (at least
Node 22.14 and npm 11.5.1), grant `id-token: write` only to the publishing job,
remove the token requirement and `NODE_AUTH_TOKEN`, and verify OIDC/provenance.
The current workflow intentionally does not request OIDC permission.
Verify the configured trust works, then revoke the bootstrap token and remove its
secret. Do not assume that a configured but untested relationship works.

## Preparing the release PR

1. Start from current `origin/main` on a release branch. Do not push directly to
   main. Confirm the intended version and check npm for existing versions.
2. Reconcile every user-visible change against `## [Unreleased]` in
   [CHANGELOG.md](CHANGELOG.md). Review:

   ```bash
   git log --oneline <last-tag>..HEAD
   git log --merges --first-parent <last-tag>..HEAD
   git diff <last-tag>..HEAD -- packages/react-components/src
   ```

   Explain omitted documentation/test-only changes in the PR. Breaking entries
   need before/after behavior and consumer migration instructions.
   Before the first public release there are no Git release tags: review available
   history and explicitly record the baseline limitation instead of guessing.
   Provider circular-dependency fix `567dc9a` was merged in PR #9 on 2026-10-01;
   the exact privately published 0.11.2 source commit is unconfirmed. Do not
   fabricate a retrospective tag.

3. Bump explicitly from the repo root:

   ```bash
   npm version 0.12.0 --workspace packages/react-components --no-git-tag-version
   ```

   Use the approved version for later releases. Commit both the package manifest
   and root lockfile. Roll `[Unreleased]` into `[VERSION] - YYYY-MM-DD`, add a fresh
   `[Unreleased]`, and update heading anchors. Add comparison links only when both
   referenced tags/commits actually exist.

4. Run focused checks from the repository root:

   ```bash
   node --test .github/workflows/scripts/release-package.test.mjs
   npm run check:public-source
   npm run license:check
   npm run test:package --workspace packages/react-components
   npm run test:tree-shaking --workspace packages/react-components
   ```

   Use existing dependencies. Run `npm ci --ignore-scripts` only when restoring
   missing dependencies or after dependency-manifest changes. Run the repository's
   formatting/lint checks for edited files and require normal PR CI before merging.

5. Inspect the actual tarball and included license. Package checks validate compiled
   JS/declaration exports, relative imports, and an allowlist excluding tests,
   secrets, unapproved source, and **all font binaries**. Manifest entry points must
   already target `dist`; do not rely on `publishConfig` to rewrite them.
   Only local-font registration CSS is shipped, never locally installed Aptos.
   Source checks screen known private-link, font, metadata and credential patterns;
   they are not exhaustive secret/license/history audits.
6. Open the PR against `main` with the version, baseline evidence, reconciled
   changelog, checks/results, and publishing readiness/blockers. Stop for review.
   A cold-start skill test opens this same PR; closing it without merging cannot
   publish the package.

## Verification and recovery

The workflow checks the exact release tarball's SHA-512 integrity against npm's
public metadata and verifies `latest`/`next` before creating the tag/release.
It rejects an existing Git tag pointing at another commit; it never moves tags.
GitHub release notes come from that version's changelog section.

After publication, also verify public access, tarball contents, and a clean
unauthenticated consumer install:

```bash
npm install @coreai-ds/react-components@0.12.0
```

Run this in a temporary consumer directory, not the monorepo. Record the
verification result in the release PR.

If publication fails, inspect npm and the failed step, then **rerun the original
Publish npm package run**. Do not merge an unrelated change to retry, dispatch
manual CI as a substitute, move tags, delete published versions, or automatically
bump the version. If npm already has this version, recovery requires identical
tarball integrity before skipping publication. A mismatched artifact fails visibly.
If verification and tag creation succeeded but GitHub release creation failed, a
rerun completes the missing release without replacing the tag.

### Recover after a publishing workflow fix

Rerunning an old run uses its original workflow definition, so it cannot pick up a
fix to that definition. After merging a workflow fix, dispatch the updated
**Publish npm package** workflow on `main`, selecting the original successful
**CI push run ID**, not the failed publishing run ID:

```bash
gh workflow run publish-package.yml --repo microsoft/coreai-design-system --ref main \
  -f ci_run_id=39469177924 \
  -f 'confirmation=publish @coreai-ds/react-components@0.12.0'
```

Those values recover the first 0.12.0 release. For later releases use their original
CI run and exact package/version confirmation. The resolver requires a successful,
completed push run of `ci.yml` for this repository's `main`. Both release checkouts
use its immutable SHA; the existing ancestry, version-change, registry, artifact,
and tag checks still apply. The corrected workflow publishes an explicit local
`./package-artifacts/...tgz` path so npm cannot interpret it as GitHub shorthand.
Dispatching recovery can publish; opening or merging a workflow-only fix does not
publish an unchanged package version.

Versions are immutable. If a newer release has advanced the channel, an old run
fails verification rather than moving `latest` or `next` backward. Have maintainers
reconcile historical release records explicitly instead of replaying publication.

This is a single-package process with plain `vVERSION` tags. Adding another
publishable workspace requires a separate release design and access review.
