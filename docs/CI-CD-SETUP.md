# CI/CD and GitHub Pages hosting

The public documentation site is
<https://microsoft.github.io/coreai-design-system/>.
GitHub Pages is the only documentation hosting target. Storybook is a local
development tool; neither Storybook nor a documentation MCP service is deployed
publicly by this repository.

## Repository setup

1. Under **Settings > Pages > Build and deployment**, select **GitHub Actions**.
2. Restrict the **github-pages** environment to **main** after the cutover below.
   Keep normal pull-request review protection.
3. Allow the pinned checkout, Node setup, Pages artifact upload, and Pages
   deployment actions used by the workflows.
4. Require the **Validate** CI check and **Validate documentation** check on
   pull requests. Deployment itself is not a contribution prerequisite.

The [documentation workflow](../.github/workflows/docs.yml) builds, tests,
type-checks, and verifies static output on pull requests. Only main can deploy. The deploy job has
`pages: write` and `id-token: write`; ordinary
validation has read-only repository permissions.

No private feed, separate documentation server, or long-lived hosting credential
is needed. Site deployment uses the workflow's short-lived GitHub permissions.

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

## Recovery

Use the Actions logs to identify the failed build or deployment step. A manual
dispatch on main reruns the same validation/deployment path. Disable the
**Documentation** workflow to stop new deployments; inspect already-running work
separately.

The Pages workflow deploys only verified main output.

## Initial production cutover

1. Open the cutover PR and wait for validation and required review. Pushing the
   main-only workflow or opening the PR does not replace the live site.
2. Finish or cancel any running feature-branch documentation deployments.
3. Before merging, allow **main** in the **github-pages** environment deployment
   branch policy. The testing branch may remain allowed temporarily. Changing
   this permission does not deploy anything.
4. Merge the PR to main. The push builds, verifies, and deploys the site. Pages
   continues serving the last successful deployment until the new one succeeds.
5. Verify the public source revision, version manifest, skill, Markdown routes,
   examples, and license assets. Remove the testing-branch allowance afterward.

If main was not permitted before merging, correct the environment policy and
rerun the failed deployment or manually dispatch **Documentation** on main.

Site deployment does not publish an npm package. Package authentication,
approval, and release recovery remain documented separately in
[RELEASING.md](../packages/react-components/RELEASING.md).
