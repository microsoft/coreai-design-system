---
id: introduction
title: Introduction
summary: Start using CoreAI for design, code, and agent-assisted work.
resources: []
reference:
  layout: compact-guidance
  hideSummary: true
---

CoreAI is a shared design system for building consistent, accessible CoreAI
experiences. It connects design guidance, reusable assets, code, and agent-ready
documentation so work can move from idea to implementation without losing intent.

## What CoreAI is

CoreAI builds on Fluent UI v9. It adds shared themes, visual defaults, CoreAI
components, templates, and UX guidance. Fluent components without CoreAI
changes remain available through the same package.

CoreAI supports designers and engineers from early design decisions through
implementation. It gives teams one place to find the shared guidance and tools
used to build CoreAI products.

## Why it matters

Design decisions can drift as work moves between guidance, Figma, code,
documentation, and teams. This can create different versions of the same
pattern and make products harder to keep consistent.

CoreAI keeps those decisions connected. Teams can adapt to product needs while
reusing the same foundations, components, behavior, and accessibility guidance.

### Shared intent

Keep the reason behind a design decision visible from design through
implementation.

### Consistent experiences

Use the same foundations, themes, and component defaults across products.

### Less repeated work

Reuse established components, templates, patterns, and guidance instead of
rebuilding them for each project.

### Reliable implementation

Carry shared behavior, accessibility, and visual decisions into working code.

## One system, multiple working surfaces

- **Figma:** Design with CoreAI components and templates.
- **Components:** Import reusable controls from
  `@coreai-ds/react-components`.
- **Templates:** Copy larger starting points into your project and adapt them.
- **Guidance:** Use foundations and patterns to make shared design decisions.
- **Agent documentation:** Give coding agents the same guidance, APIs, and
  examples through Markdown pages.

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
components, and agents. Use [Resources](./resources.md) for Figma, Storybook,
npm, fonts, source code, and support. Check the [Changelog](./changelog.md) for
new features and fixes, or [open a GitHub issue](https://github.com/microsoft/coreai-design-system/issues/new)
to ask a question or request a feature.
