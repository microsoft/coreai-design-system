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

### Starter prompt

Copy the prompt into your coding agent and fill in the **My task** line. It points
the agent to CoreAI guidance and example code.

[Copy starter prompt](/agent-prompt.txt)

<!-- include: agent-prompt -->

### Markdown docs

Share a component's **View .md** link with your agent to give it that page's
guidance and example code. The index lists all pages and package versions.

[View docs index](/llms.txt)

### Repository skill

Save **SKILL.md** in your project's skill folder so your agent can find CoreAI
docs on future tasks. Keep any existing project instructions.

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
