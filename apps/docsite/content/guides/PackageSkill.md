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

The [starter prompt](./UseWithAgents.md) installs or updates this skill before UI
work. The installed skill is the persistent entry point for later CoreAI tasks.

## Install or update in a consuming repository

1. Read [version.json](/version.json). Its `version` and `skill.version` identify
   the shared docs/skill release; `packageVersion` identifies the documented
   component package independently.
2. Download and review [SKILL.md](/source/package/SKILL.md). Its description
   and `metadata.version` / `metadata.package-version` must match that manifest.
3. For clients that support GitHub workspace skills, save it at
   `.github/skills/coreai-ds-fluentui-react/SKILL.md`. Other clients can use their
   equivalent supported skill directory, such as
   `.agents/skills/coreai-ds-fluentui-react/SKILL.md` or
   `.claude/skills/coreai-ds-fluentui-react/SKILL.md`.
4. If a skill already exists, compare its `metadata.version` as a semantic
   version and refresh older or unversioned CoreAI guidance. Do not downgrade
   newer local guidance. Merge the published instructions with local rules;
   do not overwrite repository-specific adapters or conventions.
5. Review and commit the file. Follow your client's instructions to enable or
   reload skills, then ask it to fetch the index and one relevant Markdown page.

The starter prompt authorizes this skill's installation or update. When that
action is not already authorized, or conflicts with local instructions, obtain
approval before writing. No client configuration or executable installer is
needed. Follow updated instructions in the current task; a client may also need
to reload the skill for future tasks.

Before each CoreAI task, check the version manifest once for updates. If retrieval
or saving fails, report the error and ask how to proceed. The same canonical
skill source is included in future package builds;
already published npm versions may contain older instructions. Use this download
for the current workflow.

## Version policy

Docs and skill share one version. Instruction-only releases can advance it
without changing the npm component package. Package releases advance both
versions. Only the current release is hosted; no archived documentation or skills
are served. Version labels identify the documented package, not the package
installed in your project.

## Skill source

<!-- include: package-skill -->
