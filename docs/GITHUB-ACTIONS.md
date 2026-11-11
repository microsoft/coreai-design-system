# GitHub Actions

Source and automation live at
<https://github.com/microsoft/coreai-design-system>.

| Workflow                | Definition                                                                | Trigger                                                                   |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| CI / Validate           | [ci.yml](../.github/workflows/ci.yml)                                     | Pull requests and pushes to main; manual; reusable                        |
| Documentation preview   | [docs.yml](../.github/workflows/docs.yml)                                 | Pushes to `feat/static-storybook-markdown`; pull requests to main; manual |
| Check Fluent UI updates | [check-fluent-updates.yml](../.github/workflows/check-fluent-updates.yml) | Monday 09:00 UTC; manual; opt-in                                          |
| Publish package         | [publish-package.yml](../.github/workflows/publish-package.yml)           | See the release guide                                                     |

## Validation and documentation

CI uses Node.js 22, locked npm dependencies, and local workspaces. It needs no
Azure connection, private feed, write token, or hosting secret. It retains source
safeguards, license headers, formatting, zero-warning lint, workspace type checks,
release-decision tests, local Storybook source-tool tests, and browser component
tests.

Documentation validation builds the static site directly from canonical
Markdown, pinned source examples, and package types. It runs content/regression
tests, a type check, packed-consumer compilation, static artifact checks, and
representative Chromium interactions. It does not require a Storybook build or
public MCP service.

Pull requests validate without deploying. Testing-branch runs upload the verified
`apps/docsite/dist/` artifact and publish it to
<https://microsoft.github.io/coreai-design-system/>. The final smoke check verifies
the deployed source revision and public HTML/Markdown/discovery/license assets.
Fork contributions use `pull_request`, not privileged `pull_request_target`.

Configure Pages and the feature-branch-only `github-pages` environment through
[CI/CD setup](CI-CD-SETUP.md). Require **Validate** and **Validate documentation**
on main pull requests. Do not require deployment or publishing for contributions.
If introducing a merge queue, add and validate its trigger separately.

The Azure deployment is retired. The only public site is the docsite testing
preview; Storybook remains local. Main deployment will be enabled separately
when the team is ready to merge.

## Running and troubleshooting workflows

Open [Actions](https://github.com/microsoft/coreai-design-system/actions), select
the workflow, and inspect its failed job/step. Documentation manual deployment
accepts the testing branch only. A deployment retry reruns validation before publishing.

Site deployment and npm publication are independent. Automatic npm publishing
follows successful CI **push** runs on main, not manual CI dispatches. Retry
publication by rerunning its original failed **Publish npm package** run; do not
merge an unrelated change just to retry a release.

If publishing workflow code needed a fix, use the release guide's
[manual recovery](../packages/react-components/RELEASING.md#recover-after-a-publishing-workflow-fix)
with the original successful CI run and exact package/version confirmation.

## Fluent dependency automation

Set repository variable `ENABLE_FLUENT_UPDATES=true` only after:

- Actions is permitted to create pull requests.
- The `dependencies` and `fluent-ui` labels exist.
- Policy permits the short-lived `GITHUB_TOKEN` to maintain the bot-owned
  `chore/fluent-ui-updates` branch without bypassing main protection.

The workflow updates exact Fluent development versions and the root lockfile
while preserving peer minimums. It tests latest and minimum supported peers,
including package type/build/browser/tree-shaking checks, and type-checks local
Storybook against latest versions. Failed validation creates no PR.

GitHub suppresses workflows triggered by `GITHUB_TOKEN`. A maintainer must close
and reopen the generated PR after updates to trigger required pull-request CI,
then review and merge normally.

## Package publishing

Keep package publishing opt-in and credentials in the protected `npm-production`
environment. Complete its separate setup and recovery process in
[RELEASING.md](../packages/react-components/RELEASING.md).
