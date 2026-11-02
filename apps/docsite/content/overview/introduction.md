---
id: introduction
title: Introduction
summary: Start using CoreAI for design, code, and agent-assisted work.
resources: []
reference:
  layout: compact-guidance
  hideSummary: true
---

CoreAI builds on Fluent UI v9. It adds a shared visual language, themes, and
component defaults. Components without CoreAI changes pass through from Fluent.

## Why CoreAI has a shared design system

CoreAI gives teams one Fluent UI v9 design system for shared components, themes,
guidance, and tools. This helps apps stay consistent without each team
maintaining its own version of the same patterns.

## What CoreAI includes

### Components

Components are reusable controls maintained in the npm package.

### Templates

Templates are larger starting points that you copy into your project and
maintain yourself. They are not package imports.

### Samples

Samples show how components work together in a form, layout, or workflow.

### Design and code resources

The [Figma library](https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-DS?node-id=0-1)
contains CoreAI components and templates for designs.
[Storybook](https://coreai-ds-storybook.azurewebsites.net/) contains component
states and working examples. The
[npm package](https://www.npmjs.com/package/@coreai-ds/react-components)
contains the React components.

### Documentation for agents

Agents can read the same UX guidance and complete examples as people through
this site's Markdown endpoints with ordinary HTTPS.

## Choose your starting point

### Design an experience

Use the [Figma library](https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-DS?node-id=0-1)
for components and templates. Use the foundations and patterns in this site to
make shared decisions about [color](../foundations/colors.md),
[typography](../foundations/typography.md), [content](../foundations/content.md),
and [web UI](../patterns/web-ui-guidelines.md).

### Build an application

[Install the npm package](../guides/package.md), then follow
[Using components](../guides/setup.md) for provider setup and working examples.
Import from `@coreai-ds/react-components` so your app receives CoreAI themes,
defaults, and extensions.

Use [templates](../templates/using-templates.md) as copy-and-adapt starting
points. Check [Variations from Fluent](../guides/variations-from-fluent.md)
before adapting a stock Fluent UI example.

### Build with an agent

Give your coding agent the [starter prompt](../guides/use-with-agents.md). It can
read the same guidance and example source as people through the site's Markdown
pages. For repeated work, use the [agent workflow](../guides/agent-workflow.md)
or add the optional [reusable skill](../guides/package-skill.md).

### Find answers and resources

Use the [FAQ](./faqs.md) for common questions about CoreAI, Fluent UI, setup,
components, and agents. Use [Resources](./resources.md) for design libraries,
package resources, fonts, and support. Use
[GitHub Issues](https://github.com/microsoft/coreai-design-system/issues) to ask
usage questions or review bugs and feature requests.
