# CI/CD and Azure hosting setup

Source and pull requests: <https://github.com/microsoft/coreai-design-system>.
The [GitHub Actions overview](GITHUB-ACTIONS.md) covers CI and
dependency automation. The separate publishing process is documented in
[RELEASING.md](../packages/react-components/RELEASING.md).

## Package consumption in CI

Consumers install `@coreai-ds/react-components` from npm at
`https://registry.npmjs.org/`.
Check npm for available versions. Once enabled, publication follows successful CI
on the version-changing `main` commit; see the release guide.

For this repository, run `npm ci` with Node.js 22 at the root. The docsite and
Storybook use the local package workspace, not a separately published artifact.

## GitHub environment and OIDC

Azure remains the hosting provider. The
[deployment workflow](../.github/workflows/deploy.yml) deploys content to
**existing** Linux Azure App Services using Azure workload identity federation.
It never changes their auth/settings or provisions infrastructure.

### Explicit approval gates

Before enabling deployment, an administrator must:

1. Create the GitHub environment **`azure-production`**.
2. Restrict environment deployment branches to **`main`**. The protected
   pull-request merge is the deployment approval; do not add a second required
   reviewer or wait timer to this environment. Preserve repository review rules.
3. Verify the target hosts, identity, and auth prerequisites below.
4. Set repository Actions variable **`ENABLE_AZURE_DEPLOY` = `true`** only after
   deployment approval and disabling the old Azure DevOps deployment pipeline.
   This must be a repository variable, not just an environment variable: the
   workflow evaluates it before starting environment jobs.

Deploying these sites does not publish an npm
package or make the sites public. Keep `NPM_PUBLISH_ENABLED` absent or `false`
until the package publishing setup is complete.

The exact repository and main-ref checks also prevent a copied repository or a
manual feature-branch run from deploying. An unset/false approval variable skips
all deployment jobs, including their Azure login.

### Exact variables and secrets

Set these six **environment variables** under GitHub **Settings → Environments →
azure-production → Environment variables**. They are identifiers, not credentials;
there are deliberately no hardcoded deployment targets or tenant IDs in YAML.

| Variable                | Required value                                                   |
| ----------------------- | ---------------------------------------------------------------- |
| `AZURE_CLIENT_ID`       | Application/client ID of the deployment workload identity        |
| `AZURE_TENANT_ID`       | Entra tenant ID owning that identity and the target subscription |
| `AZURE_SUBSCRIPTION_ID` | Target Azure subscription ID                                     |
| `AZURE_RESOURCE_GROUP`  | Existing resource group containing both hosts                    |
| `DOCSITE_APP_NAME`      | Existing docsite App Service name                                |
| `STORYBOOK_APP_NAME`    | Existing Storybook/MCP App Service name                          |

Repository variables:

| Variable                | Default / effect                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `ENABLE_AZURE_DEPLOY`   | Absent/false: deployment disabled; exact `true`: allow protected main deployments      |
| `ENABLE_FLUENT_UPDATES` | Absent/false: update automation disabled; exact `true`: allow scheduled/manual updates |

**Secrets required for these workflows: none.** Azure login uses OIDC, and the
dependency workflow uses GitHub's automatically supplied `GITHUB_TOKEN`.
Do not create Azure client secrets, publish profiles, PATs, private-feed tokens,
or other long-lived credentials for these workflows. The npm publishing workflow
has its own prerequisites in the release guide.

### Federated identity and Azure permissions

Have an Azure administrator create or reuse an Entra application/service principal
or user-assigned managed identity in the subscription's tenant. Do not create a
client secret. Add this federated identity credential:

| Field    | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Issuer   | `https://token.actions.githubusercontent.com`                                         |
| Subject  | `repo:microsoft@6154722/coreai-design-system@1386129926:environment:azure-production` |
| Audience | `api://AzureADTokenExchange`                                                          |

The environment subject is required even though deployment is restricted to main;
`repo:…:ref:refs/heads/main` is not the claim emitted by an environment job.
The deploy job requests `id-token: write`; ordinary CI does not.

This repository uses GitHub's immutable subject format. Verify the current
`sub_claim_prefix` with
`gh api repos/microsoft/coreai-design-system/actions/oidc/customization/sub`
before configuring trust; do not substitute the older name-only subject.

Grant the identity **Website Contributor** on each existing App Service, including
its configuration and publishing child operations, with sufficient read access to
the resource group for Azure CLI discovery. The preflight needs
`Microsoft.Web/sites/config/list/action` to read auth/app settings. A custom role
can narrow this further subject to the tenant's deployment policy. Do not grant
subscription-wide Contributor or rights to administer Entra app registrations.
Infrastructure provisioning is outside this workflow.

The administrator must confirm the role assignment supports reading each app's
`config/authsettingsV2` resource through `az rest`,
`az webapp config appsettings list`, and `az webapp deploy` for **both** apps.
An Azure DevOps service connection's federated credential does not authenticate a
GitHub workflow: add the GitHub trust explicitly and retire old trust only after
the approved cutover.

### Deploy on merge

Once the workflow is enabled and `ENABLE_AZURE_DEPLOY=true`, every push to
`main` starts **Deploy Azure apps**. The workflow validates that revision, builds
and packages both hosts, signs in with OIDC, checks existing authentication, and
deploys the docsite followed by Storybook/MCP. It checks authentication again
after deployment. There is no separate login-test workflow or second human approval.

Manual dispatch on `main` retries the same deployment path. A failed validation,
build, login, or preflight prevents subsequent deployment steps; inspect the failed
step before retrying. Set `ENABLE_AZURE_DEPLOY=false` to stop new deployments.

## App & MCP hosting (public docsite, Storybook, and MCP)

### Architecture and deployment contract

The existing shared Linux App Service plan hosts:

- Docsite: `https://<docsite-app-name>.azurewebsites.net`.
- Storybook and read-only MCP: `https://<storybook-app-name>.azurewebsites.net`,
  with the MCP endpoint at `/mcp`.

These are URL patterns, not deployment targets. Use the existing host names
provided by the hosting owners. The hosting contract requires public, unauthenticated
docsite, Storybook, and MCP access. Local edits do not change remote settings.
The Bicep source remains at [infra/main.bicep](../infra/main.bicep) for
separately approved infrastructure management. GitHub Actions does **not** apply it.
Infrastructure-only merges still trigger an application redeployment, but do not
apply infrastructure changes.

The deployment job provisions the pinned Fluent story checkout, builds Storybook
and its MCP manifests, verifies its content, then builds the docsite against that
exact Storybook index. The ZIP layouts are:

| App           | ZIP root                                                                      | Startup                                  |
| ------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Docsite       | `dist/`, `package.json`, `server.js`                                          | Existing `npm start` → `node server.js`  |
| Storybook/MCP | `storybook-static/`, `package.json`, `server.mjs`, production `node_modules/` | Existing `npm start` → `node server.mjs` |

Preserve the hosts' Node 22 runtime, existing startup command/default npm-start
behavior, Always On where supported, and `SCM_DO_BUILD_DURING_DEPLOYMENT=false`.
The host dependencies are installed into the Storybook staging directory
(`npm install --omit=dev --no-audit --no-fund`), as in the previous deployment.
The host currently has no standalone lockfile, so that staging install can
resolve compatible dependency versions anew; it is not a fully locked artifact.
Only application files are packaged: repository credentials/configuration and
Azure app settings are never copied into ZIPs or uploaded as workflow artifacts.

The docsite deploy waits for the normal ZIP deployment response. Storybook keeps
`--track-status false`, so successful submission does not guarantee successful
runtime startup. An operator must confirm docsite `/healthz` and anonymous page access,
Storybook access, and an anonymous MCP request after deployment. The two ZIP deploys are sequential,
not transactional; rerun an approved main revision if one host fails.

### Public hosting requirements

The docsite, Storybook UI, manifests, and `/mcp` require no user authentication or access tokens.
The host has no OAuth facade, JWT validation, or Entra dependency. MCP clients need only
the endpoint URL. The public endpoint limits request bodies to 64 KiB.

For approved deployments, the hosting owner must keep Easy Auth disabled on both apps
(`platform.enabled=false`, `globalValidation.requireAuthentication=false`,
`globalValidation.unauthenticatedClientAction=AllowAnonymous`) and ensure
retired `MCP_ENTRA_*`, `MCP_OAUTH_*`, and `MCP_AUTH_ENABLED` app settings are absent. Retire
Storybook-only registrations only after verifying they are not shared with the docsite
or another service. Do not remove shared deployment identities.

The workflow checks this public configuration for both apps before and after deployment. It reads settings into
memory without printing values and does not modify Azure configuration.
[infra/main.bicep](../infra/main.bicep) describes public hosting for both apps, but application
deployment does not apply Bicep. Infrastructure changes require separate approval.

GitHub Actions still uses OIDC to authorize deployment uploads. That identity is not
visitor authentication and must remain. Application deployments do not change
visitor-authentication settings.

### Troubleshooting

| Symptom                                          | Check                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Deployment jobs skipped                          | Workflow enabled, exact repository/main ref, and repository `ENABLE_AZURE_DEPLOY=true`                                       |
| Waiting for deployment                           | Earlier deployment in the concurrency group; remove unintended environment reviewer/wait gates per the merge-approval policy |
| OIDC `AADSTS70021`                               | Exact environment subject, issuer, audience, tenant, and client ID                                                           |
| Azure preflight fails                            | Identity read/list permissions and existing Easy Auth/MCP configuration; inspect securely in Azure, not workflow logs        |
| ZIP deploy forbidden                             | Both target app scopes and publishing/configuration permissions                                                              |
| Docsite/Storybook/MCP redirects or returns `401` | Both apps must have Easy Auth disabled; no client token setup is required                                                    |
| Bot PR has no CI                                 | Maintainer must close/reopen after the latest bot update; `GITHUB_TOKEN` does not trigger downstream workflows               |

Keep deployment OIDC authorization enabled; it does not control visitor access.
Do not print `az webapp config appsettings list` output or enable shell tracing in
deployment jobs.
