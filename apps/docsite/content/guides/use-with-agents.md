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
  route: guides/use-with-agents
  aliases: [/mcp-server/, /guides/mcp-setup/]
  legacyIds: [docs-mcp-setup--docs]
  migratedFrom:
    - apps/docsite/src/pages/MCPServer.tsx
    - apps/storybook/src/stories/docs/MCPSetup.mdx
---

## Start with a prompt

Copy the text below into your coding agent, then replace the final line with your
task. Your agent needs a web-fetch or HTTP tool. Reading the site needs no
installation, login, API key, or client configuration. Use ordinary HTTPS GET
requests to read the published files.

<!-- include: agent-prompt -->

## What the agent reads

The [documentation index](/llms.txt) lists page purposes and current package
versions. Each human page has a Markdown counterpart with the same guidance,
API summaries, and complete example source. For example, the Button page is
available as [Markdown](/components/button.md).

The [agent workflow](./agent-workflow.md) explains targeted retrieval, version
checks, templates, and validation. The [machine-readable index](/llms/index.json)
adds exact paths, source links, API members, and provenance.

## Make it reusable

For a repository that regularly uses CoreAI, install the [agent skill](./package-skill.md)
once. It teaches supported agents when and how to find this documentation.
Installation is optional; the prompt works without it.

Review the skill before saving it. Ask the agent to show the destination and
proposed changes, preserve existing local instructions, and get your approval.
Do not execute downloaded scripts to set up read-only documentation.

## Privacy and limitations

These are public, read-only static files. Fetching a page does not require sending
your source code, prompts, or credentials to this site. Your agent provider and
HTTP client have their own data policies.

The site documents the current release. Agents must compare versions with your
installed packages, report unavailable pages, and test adapted code in your app.
The skill is guidance, not an enforcement mechanism or a guarantee of correctness.
