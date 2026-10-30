# GitHub Actions

Source, pull requests, and automation live in
<https://github.com/microsoft/coreai-design-system>.

| Workflow                | Definition                                                                | Trigger                                                            |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| CI / Validate           | [ci.yml](../.github/workflows/ci.yml)                                     | Pull requests and pushes to `main`; manual; reusable               |
| Deploy Azure apps       | [deploy.yml](../.github/workflows/deploy.yml)                             | Every push to `main`; manual; disabled until enabled               |
| Check Fluent UI updates | [check-fluent-updates.yml](../.github/workflows/check-fluent-updates.yml) | Monday 09:00 UTC; manual; disabled until enabled                   |
| Publish package         | [publish-package.yml](../.github/workflows/publish-package.yml)           | See the [release guide](../packages/react-components/RELEASING.md) |

Site deployment and npm publication are independent. Merging to main can deploy
the sites; npm publication additionally requires a package version change,
successful push CI for that exact commit, and the publishing opt-in.

## Running and troubleshooting workflows

Open [Actions](https://github.com/microsoft/coreai-design-system/actions), select
the workflow, and inspect the failed job and step. For a manual run, select
**Run workflow** and choose `main`; deployment rejects other branches.
Automatic publishing follows successful **CI** push runs on `main`, not manual CI dispatches.
Retry publication by rerunning its original failed **Publish npm package** run;
do not merge an unrelated change to retry a release.
If the workflow itself needed a fix, use the release guide's
[manual recovery](../packages/react-components/RELEASING.md#recover-after-a-publishing-workflow-fix)
on `main` with the original successful CI run ID and exact package/version confirmation.
Disabled workflows must be enabled before they can run. Enabling a workflow alone
does not satisfy its repository-variable gates.

- [Environment configuration](https://github.com/microsoft/coreai-design-system/settings/environments):
  Azure identity/target variables belong to `azure-production`; npm credentials
  and protected publishing controls belong to `npm-production`.
- [Repository variables](https://github.com/microsoft/coreai-design-system/settings/variables/actions):
  `ENABLE_AZURE_DEPLOY`, `ENABLE_FLUENT_UPDATES`, and `NPM_PUBLISH_ENABLED`.
- Set `ENABLE_AZURE_DEPLOY=false` or disable **Deploy Azure apps** to stop new
  deployments. This does not cancel queued or running work; inspect those runs
  separately before switching deployment systems or rolling back.

Only one deployment system should write to the Azure apps. Keep the retired
deployer disabled, even while its validation pipeline remains available for
outstanding PRs. A manual deployment rerun uploads application content again;
it is not a login-only check.

## Validation

CI uses Node.js 22 and npm dependencies; it needs **no secrets, Azure
connection, private feed, or write token**. In-repository apps resolve
`@coreai-ds/react-components` through npm workspaces.

Validation preserves formatting, zero-warning lint, workspace type checks,
guidance-generation tests, Storybook build/content verification, docsite tests
against the same built Storybook index, anonymous MCP host tests, Chromium installation,
and browser component tests.
Fork contributions use `pull_request`, not privileged `pull_request_target`.

Before dependency installation, CI runs `npm run check:public-source` and the
public-source check's Node tests. Deployment repeats the source check before
building, packaging, or logging into Azure. This screens tracked source for
disallowed links, metadata, font binaries, and obvious credential patterns; it
is not an exhaustive secret, license, artifact, or Git-history audit.

After the first successful run, configure a `main` ruleset requiring the
**Validate** job from **CI**, pull-request reviews, and resolution of review
conversations. Do not require a deployment or publishing check for contributions.
If enabling merge queues, add and validate a `merge_group` trigger first.

## Azure deployment approval and identity

See [CI/CD setup](CI-CD-SETUP.md#github-environment-and-oidc) for the exact variables,
OIDC subject, Azure permissions, and existing-host prerequisites.

The deployment workflow requires all of:

1. Repository is exactly `microsoft/coreai-design-system`.
2. Ref is exactly `refs/heads/main`, including for manual runs.
3. Repository Actions variable `ENABLE_AZURE_DEPLOY` is exactly `true`.
   Site deployment is independent of npm publishing.
4. The reusable CI validation succeeds for the same source revision.
5. The `azure-production` environment permits only the `main` branch.

Leave the deployment variable absent or `false` in a clean repository. Before
enabling it, create the environment with main-only deployment branches and no
additional required reviewer or wait timer. The protected PR merge is approval:
every push to main automatically validates and deploys that revision. No Azure
credentials are available to ordinary PR CI.

Only ZIP application content is deployed. The workflow **does not run Bicep,
create resources, reset app settings, alter Easy Auth, or change Entra
registrations**. Existing infrastructure must be prepared separately by its
owners. The preflight reads the current access configuration and
requires public, anonymous docsite, Storybook, and MCP access with Easy Auth
disabled on both App Services. Changing Azure access policy remains a separate
operator task; application deployments preserve it. The check
reads the explicit V2 auth endpoint and runs again after deployment. Responses,
app settings, and credentials are not printed or uploaded as artifacts.

The docsite ZIP retains `dist/`, `package.json`, and `server.js` at its root.
The Storybook ZIP retains `storybook-static/`, `server.mjs`,
the host `package.json`, and production dependencies installed in the staging
directory. Both preserve `npm start` behavior. Storybook deploy retains
`--track-status false` for its existing App Service behavior.

Deployment runs are serialized without cancelling an in-progress deployment.
The two apps are deployed sequentially, not atomically. An operator must verify
both hosts after a run; the Storybook CLI invocation deliberately does not wait
for runtime startup.

## Fluent dependency automation

Set repository variable `ENABLE_FLUENT_UPDATES=true` to opt in, only after:

- Actions is allowed to create and approve pull requests in repository settings
  (the workflow creates PRs; it does not approve them).
- The `dependencies` and `fluent-ui` labels exist.
- Repository/organization policy permits `GITHUB_TOKEN` to write contents and
  pull requests and maintain the bot-owned `chore/fluent-ui-updates` branch.
  Do not grant the bot bypass privileges on `main`.

The workflow runs only in the target repository on `main`. It updates the exact
Fluent **development** versions and root lockfile while preserving peer floors.
It installs Chromium, tests latest versions, then installs and verifies the exact
minimum peer versions and repeats package type/build/browser/tree-shaking checks.
Storybook type checks run against the latest versions. Failed validation creates
no PR. The same branch/PR is updated rather than creating a new PR every week.
If dependencies are current, the workflow makes no changes.

The workflow uses only the short-lived `GITHUB_TOKEN`; no PAT or GitHub App secret
is needed. **GitHub suppresses workflows triggered by that token.** A maintainer
must close and reopen the generated PR (after each automated update) to trigger
normal required pull-request CI, then review and merge normally. A manual CI run
on `main` is not a substitute for PR-head checks. Do not bypass branch protection.

## Repository setup

1. Permit the pinned `actions/checkout`, `actions/setup-node`, `azure/login`,
   and `peter-evans/create-pull-request` actions in organization policy.
2. Run secretless PR CI and configure the `main` ruleset.
3. Configure the main-only Azure environment and OIDC trust, verify the existing
   hosting settings, and only then opt in to deployment.
4. Configure dependency-update permissions/labels and opt in separately.
5. Complete the separate npm publishing approval and authentication setup in
   [RELEASING.md](../packages/react-components/RELEASING.md).
