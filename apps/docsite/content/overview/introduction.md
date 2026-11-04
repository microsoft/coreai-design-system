---
id: introduction
title: Introduction
summary: >-
  CoreAI builds on Fluent UI v9. It adds a shared visual language, themes, and
  component defaults. Components without CoreAI changes pass through from Fluent.
resources: []
reference:
  layout: compact-guidance
  aliases:
    - /overview/resources/
    - /resources/
  migratedFrom:
    - apps/docsite/src/data/resources.ts
---

## What CoreAI includes

<!-- view:includes -->

### Foundations

Color, typography, spacing, and themes provide a shared visual language for
building CoreAI interfaces.

### Components

Reusable controls in the CoreAI npm package come with usage guidance and code
examples for your project.

### Templates

Templates are larger starting points you copy and maintain in your project.
They are not package imports.

### Documentation for agents

Agents read UX guidance and complete examples through this site's Markdown
endpoints over ordinary HTTPS.

<!-- /view:includes -->

## Working with agents

<!-- view:agent-cards -->

### Start with a prompt

Paste the prompt into your coding agent and add your task. Your agent needs a
web-fetch or HTTP tool. No site setup or login is needed.

[Copy starter prompt](/agent-prompt.txt)

<!-- include: agent-prompt -->

### Read what you need

Start with the documentation index, check your installed package versions, and
fetch only the guidance and examples your task needs.

[Read the workflow](../guides/agent-workflow.md)

### Make it reusable

Add the optional skill for repeated CoreAI work. Review it before installing,
keep local instructions, and approve any changes your agent proposes.

[Download skill](/source/package/SKILL.md)

<!-- /view:agent-cards -->

## Resources

<!-- view:resources -->

- [GitHub repository](https://github.com/microsoft/coreai-design-system):
  Browse the CoreAI source, review pull requests, and check GitHub Actions.
- [Issues and support](https://github.com/microsoft/coreai-design-system/issues):
  Ask usage questions and review reported bugs and feature requests.
- [Open an issue](https://github.com/microsoft/coreai-design-system/issues/new):
  Report a bug or request a new feature for the CoreAI design system.

<!-- /view:resources -->
