# Legacy documentation retirement host

This small Node service keeps the old public entry points useful without hosting
Storybook or fetching documentation on behalf of clients. GitHub Pages remains
the only documentation host.

## Behavior

- Website GET/HEAD requests return a fixed-root `302` to
  <https://microsoft.github.io/coreai-design-system/>. Old paths and query strings
  are not forwarded. `Cache-Control: no-store` keeps the cutover reversible.
- `/healthz` returns service/version/mode metadata for health probes.
- With `--mcp`, `/mcp` retains Streamable HTTP and the old GET event stream.
  The three public tool names and input schemas were captured from the legacy
  production endpoint on 2026-11-13.
- Every old tool returns the same explicit retirement result (`isError: true`);
  it does not pretend to retrieve documentation or create a preview.
- The notice directs agents to the current version manifest, repository skill,
  and targeted Markdown index. Instruction/configuration changes require user
  permission. The service never fetches docs, executes tool arguments, or logs
  request bodies.

The local Storybook MCP and its development tools are unchanged. This app is only
for the legacy public domains.

## Build and test

From the repository root:

```powershell
npm --workspace apps/legacy-docs test
```

Tests build and exercise the deployable bundle with a real MCP client, cached
legacy calls, event streams, redirects, and bounded invalid requests.
The bundle uses the MCP SDK but has no external runtime dependencies.

Deploy only `dist/server.mjs` and `dist/package.json`, not the monorepo or its
`node_modules`. The package start script runs redirect-only mode. For the legacy
Storybook/MCP host, set the App Service startup command to:

```text
node /home/site/wwwroot/server.mjs --mcp
```

For the old docsite, use:

```text
node /home/site/wwwroot/server.mjs
```

Both use the existing Node.js 22 runtime and `PORT`. No client secrets, npm
installation, Storybook build, or documentation snapshots are needed at startup.

## Rollout and rollback

1. Verify the Pages homepage, version manifest, skill hash, discovery, and a
   component Markdown page.
2. Before changing either app, save its current startup/health configuration and
   a valid ZIP backup of its deployed files outside the repository. Never publish
   credentials or backups.
3. Deploy the tested bundle only to the two authorized legacy apps. Keep the
   existing shared App Service plan and collateral applications unchanged.
4. Verify fixed-root redirects, health metadata, initialization/discovery, every
   old tool call, and GET event-stream compatibility on the public host.
5. If verification fails, restore that app's ZIP and original startup/health
   configuration before retrying.

There is no automatic Azure deployment workflow. Keeping these endpoints is an
operational choice; App Service plan billing and runtime maintenance still apply.
