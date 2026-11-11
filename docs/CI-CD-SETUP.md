# CI/CD and GitHub Pages hosting

The public documentation site is
<https://microsoft.github.io/coreai-design-system/>.
GitHub Pages is the only documentation hosting target. Storybook is a local
development tool; neither Storybook nor MCP is deployed publicly by this repository.

## Repository setup

1. Under **Settings > Pages > Build and deployment**, select **GitHub Actions**.
2. During testing, keep the **github-pages** environment restricted to
   **feat/static-storybook-markdown**. Keep normal pull-request review protection.
3. Allow the pinned checkout, Node setup, Pages artifact upload, and Pages
   deployment actions used by the workflows.
4. Require the **Validate** CI check and **Validate documentation** check on
   pull requests. Deployment itself is not a contribution prerequisite.

The [documentation workflow](../.github/workflows/docs.yml) builds, tests,
type-checks, and verifies static output on pull requests. Only the testing branch can deploy. The deploy job has
`pages: write` and `id-token: write`; ordinary
validation has read-only repository permissions.

No Azure configuration, private feed, publish profile, or long-lived credential
is needed for site hosting. The workflow does not modify existing Azure hosts.
Their owners can redirect old hostnames to the Pages root after the new site is
available. Precise old-page mappings are not required.

## Build and verification

Use Node.js 22 and `npm ci` at the repository root. In-repository apps consume the
local `@coreai-ds/react-components` workspace.

```powershell
npm --workspace apps/docsite run build -- --base=/coreai-design-system/
npm --workspace apps/docsite test
npm --workspace apps/docsite run type-check
npm --workspace apps/docsite run verify
```

The static artifact is `apps/docsite/dist/`. The deployment smoke check verifies
the published source revision, HTML, case-sensitive Markdown routes, discovery,
and bundled license material. Source checks are not a complete secret, license,
or security audit.

For local source ownership and authoring, see the [docsite README](../apps/docsite/README.md).

## Recovery and retirement

Use the Actions logs to identify the failed build or deployment step. A manual
dispatch on the testing branch reruns the same validation/deployment path. Disable the
**Documentation preview** workflow to stop new deployments; inspect already-running work
separately.

The old Azure workflow is retired. The replacement Pages workflow remains
feature-branch-only while the site is being tested.

When the team is ready to merge to main, update the workflow's push/deployment
branch guards and the environment's permitted branch together. Do not enable
main deployment before that cutover decision.

Site deployment does not publish an npm package. Package authentication,
approval, and release recovery remain documented separately in
[RELEASING.md](../packages/react-components/RELEASING.md).
