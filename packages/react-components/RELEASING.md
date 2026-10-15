# Releasing

Maintainers publish `@coreai-ds/react-components` through
<https://registry.npmjs.org/> from <https://github.com/microsoft/coreai-design-system>.
Release preparation does **not** publish the package, bump its version, or create tags.

## Package release controls and initial access review

Publishing is disabled by default. Leave `NPM_PUBLISH_ENABLED` unset (or `false`)
until the package access and publishing setup below is complete.
The repository documentation is licensed under CC-BY-4.0, and its code is licensed under MIT.

Before enabling the variable, the owners must:

1. Confirm that the package uses the MIT license and includes its license text.
2. Identify **every package selected for publication**. Review each package's source,
   files, owners, consumers, license, and existing access before explicitly selecting
   it. This workflow selects only `@coreai-ds/react-components`; other workspaces are
   not published. `private: false` and `publishConfig.access: public` configure the
   package but do not publish it.
3. Verify ownership of the npm `@coreai-ds` scope and the package name, review the npm
   organization's members/teams and publish permissions, and choose an unused public
   version after reviewing the package release history. Do not transfer
   ownership, change an existing private package's access, or publish on assumption.
4. Confirm the target is exactly `microsoft/coreai-design-system`. Protect `main`,
   require CI and code review, and create the `npm-production` GitHub environment
   **before** enabling the workflow. Configure required reviewers, prevent self-review
   and administrative bypass where supported, and restrict deployment branches to
   protected `main` only. Verify your GitHub plan supports these protections; if it
   does not, keep publishing disabled.
5. Configure publisher authentication as described below. Only then set the
   **repository** variable `NPM_PUBLISH_ENABLED=true`. Limit who can edit this
   variable, the workflow, environment, and secrets.

The workflow additionally requires a manual dispatch on `main`, the exact target
repository, and confirmation of the exact package/version. A missing or false variable
fails closed by skipping the publishing job. A missing secret or invalid license fails
the job. No merge, tag, PR, or fork automatically publishes.

## Publisher authentication

The checked-in workflow uses a **GitHub environment secret**, `NPM_TOKEN`, because
an npm trusted-publisher relationship cannot be assumed or created from this repo.
Use a short-lived, granular npm automation token with write permission limited to
this package (or the narrowly approved scope for the first publication). Review npm
2FA/bypass requirements with the organization administrator; do not relax account
security globally. Store the token **only** in the protected `npm-production`
environment, rotate/revoke it after use, and never commit it to `.npmrc` or expose it
to PR/build steps. The workflow supplies it only to the final publish step.

**Preferred follow-up: npm trusted publishing.** After the package exists and the
npm owner has verified eligibility, configure npm's trusted publisher for owner
`microsoft`, repository `coreai-design-system`, workflow `publish-package.yml`, and
environment `npm-production`. Follow [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
In a separately reviewed change, use a supported Node/npm combination (Node >=22.14
and npm >=11.5.1), grant `id-token: write` only to the publishing job, remove the
token requirement and `NODE_AUTH_TOKEN`, and verify OIDC/provenance behavior. Revoke
the token after migration. Do not enable OIDC permissions without that setup.
The current token workflow deliberately requests only `contents: read`; it cannot
push tags, create releases, or modify repository content.

## Preparing and validating a release

1. Work through a reviewed PR, not a direct push to `main`. Log user-visible changes
   under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md). Breaking entries must
   describe before → after and the consumer migration.
2. **Mandatory changelog validation:** identify the last release tag and
   examine `git log --oneline <last-tag>..HEAD`,
   `git log --merges --first-parent <last-tag>..HEAD`, and
   `git diff <last-tag>..HEAD -- packages/react-components/src`. Reconcile every
   user-visible merged change against `[Unreleased]`; add omissions/remove stale
   entries and record why documentation/test-only changes are omitted. If tags are
   missing, explicitly establish and record the release baseline rather than guessing.
   Historical release facts remain in the changelog, linked by heading anchors.
3. When preparing the package release, choose the appropriate semver version and run:

   ```bash
   npm version patch --workspace packages/react-components --no-git-tag-version
   ```

   Use `minor`, `major`, or a prerelease as appropriate. Review and commit
   both the package manifest and root lockfile. Rename `[Unreleased]` to
   `[X.Y.Z] - YYYY-MM-DD`, add a fresh `[Unreleased]`, and update heading links.
   Add comparison links only when both referenced commits/tags exist; never derive
   them from version numbers alone.

4. Run checks from the repo root:

   ```bash
   npm ci --ignore-scripts
   npm run check:public-source
   npm run test:package --workspace packages/react-components
   npm run test:tree-shaking --workspace packages/react-components
   ```

   Also require the normal CI checks. The package test cleans/builds and inspects an
   **actual npm tarball**, not just the source manifest. It verifies compiled JS and
   declaration exports, relative imports, and an allowlist excluding tests, secrets,
   source files, and all font binaries. The package manifest itself points at `dist`;
   npm does **not** rewrite arbitrary `main`/`types`/`exports` via `publishConfig`.
   `ignore-scripts=true` is deliberate: explicitly build before packing/publishing;
   do not rely on the `prepack` lifecycle.

   The publisher runs `check:public-source` before building/packing. It scans tracked
   source for known private-link, font-binary, metadata, and obvious credential
   patterns and fails publication when it reports a blocker. This is a focused
   safeguard, not an exhaustive secret, license, governance, or history audit.

5. Inspect the artifact and license as part of review. Optional local Aptos setup
   must never affect npm contents. Only the local-font registration CSS is shipped;
   licensed font binaries and generated local CSS are excluded.
6. Merge the version/changelog PR. A maintainer selects
   **Actions → Publish npm package → Run workflow**, chooses `main`, and enters
   `publish @coreai-ds/react-components@X.Y.Z`. The environment reviewer checks the exact
   commit, version, and artifact policy before approving.

The workflow builds and verifies a tarball, then publishes **that same tarball**
with `--access public --ignore-scripts`. Stable versions use `latest`; prereleases
use `next`. It never increments versions or creates/pushes tags. Tags/releases, if
desired, require a separate maintainer action after registry verification.

## After publication

Verify the package/version, public access, dist-tag, tarball contents, and an
unauthenticated clean consumer install from npm. Record the released commit and
verification result. Published versions are immutable; rerunning the same version
fails instead of overwriting it. If publication succeeds but the run reports failure,
inspect npm before retrying; do not automatically bump or delete releases.

Consumers run `npm install @coreai-ds/react-components`. See the
[package README](README.md#install) for installation and registry configuration.

This is a single-package workflow. Adding another publishable workspace requires
a new access/license review and a separately reviewed release design.
