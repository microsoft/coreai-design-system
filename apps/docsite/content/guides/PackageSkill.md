---
id: package-skill
title: Reusable agent skill
summary: Teach your agent to find CoreAI Markdown guidance quickly in any consuming repository.
resources: []
navigation:
  showInSidebar: false
reference:
  renderer: package-skill
  legacyIds: [docs-agent-skill--docs]
  aliases: [/coreai-skill/, /agent-skill/, /foundational-skill/, /design-md/]
  migratedFrom:
    - apps/docsite/src/pages/CoreAISkill.tsx
    - apps/storybook/src/stories/docs/AgentSkill.mdx
    - packages/react-components/agent/SKILL.md
---

## What it does

The skill tells an agent when to use CoreAI documentation, where to find the
index, how to fetch only the relevant Markdown, and how to check versions and
package imports. Detailed component guidance stays on this site instead of being
duplicated in repository instructions.

You can [start with a prompt](./UseWithAgents.md) without installing anything.
Skills are useful for repeated work in repositories that consume CoreAI.

## Install in a consuming repository

1. Download and review [SKILL.md](/source/package/SKILL.md).
2. For clients that support GitHub workspace skills, save it at
   `.github/skills/coreai-ds-fluentui-react/SKILL.md`. Other clients can use their
   equivalent supported skill directory, such as
   `.agents/skills/coreai-ds-fluentui-react/SKILL.md` or
   `.claude/skills/coreai-ds-fluentui-react/SKILL.md`.
3. If a skill already exists, merge the retrieval instructions with local rules;
   do not overwrite repository-specific adapters or conventions.
4. Review and commit the file. Follow your client's instructions to enable or
   reload skills, then ask it to fetch the index and one relevant Markdown page.

If an agent installs the skill, it should first show the proposed destination and
changes and ask for approval. No client configuration or executable installer is
needed. The same canonical skill source is included in future package builds;
already published npm versions may contain older instructions. Use this download
for the current workflow.

## Skill source

<!-- include: package-skill -->
