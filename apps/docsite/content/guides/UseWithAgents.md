---
id: use-with-agents
title: Build with your agent
summary: Give your coding agent CoreAI guidance, working examples, and accurate APIs with one prompt.
navigation:
  showInSidebar: false
resources:
  - label: Agent documentation index
    url: /llms.txt
  - label: Download reusable skill
    url: /source/package/SKILL.md
reference:
  route: guides/UseWithAgents
  aliases: [/mcp-server/, /guides/mcp-setup/]
  legacyIds: [docs-mcp-setup--docs]
  migratedFrom:
    - apps/docsite/src/pages/MCPServer.tsx
    - apps/storybook/src/stories/docs/MCPSetup.mdx
---

## Start with a prompt

Copy the text below into your coding agent, then replace the final line with your
task. Your agent needs a web-fetch or HTTP tool. Reading the site needs no
login, API key, or client connection. The prompt directs your agent to review
and install the current skill, or update the one already in your repository,
before implementing your task. No executable installer is needed.

<!-- include: agent-prompt -->

## What the agent reads

The [documentation index](/llms.txt) lists page purposes and current package
versions. The small [version manifest](/version.json) identifies the shared
docs/skill version and the documented package version independently.
Each human page has a Markdown counterpart with the same guidance,
API summaries, and complete example source. For example, the Button page is
available as [Markdown](/components/Button.md).

The [agent workflow](./AgentWorkflow.md) explains targeted retrieval, version
checks, templates, and validation. The [machine-readable index](/llms/index.json)
adds exact paths, source links, API members, and provenance.

## Keep the repository skill current

The [agent skill](./PackageSkill.md) is the persistent entry point for CoreAI
tasks. Its description and metadata carry its docs/skill version and the
documented package version. Before each task it checks whether newer published
guidance is available; an older npm package may contain an older skill.

Review the skill before saving it. The starter prompt authorizes that skill's
installation or update, not changes to unrelated repository instructions.
Preserve local rules and adapters; ask before resolving conflicts or when the
client requires approval. If fetching or saving fails, the agent must report it
and ask how to proceed instead of silently skipping setup.

## Privacy and limitations

These are public, read-only static files. Fetching a page does not require sending
your source code, prompts, or credentials to this site. Your agent provider and
HTTP client have their own data policies.

The site hosts only the current docs/skill release and its documented package
version. Agents must compare that package version with your
installed packages, report unavailable pages, and test adapted code in your app.
The skill is guidance, not an enforcement mechanism or a guarantee of correctness.
