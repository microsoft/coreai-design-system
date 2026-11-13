---
id: vertical-nav-tabs
title: Shell and navigation
navigation:
  group: Templates
  showInSidebar: true
storybookDefaultStory: Shell and Navigation
figmaPageId: '282241:4033'
summary: >-
  Nav provides access to an application’s primary destinations through
  hierarchical links and categories.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=433143-30585
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/nav/usage'
storybookTitles:
  - Templates/Shell and Navigation
reference:
  component: templates-shell-and-navigation
  aliases: [/left-nav/]
  sources:
    - src/stories/templates/ShellAndNavigation.tsx
  route: templates/ShellAndNavigation
---

## Best practices

### Do

- Keep navigation labels brief, plain, and easy to scan.
- Limit each nav node to one secondary action, using an overflow menu for additional actions.
- Use icons with nav category labels when possible.

### Don't

- Move the nav category chevron to another location.
- Use the footer slot when it could obscure other navigation content.
- Use Nav for an icon-only layout.

## Behavior and states

- Nav can contain links, category groups, and nested subitems.
- Expanded categories reveal their subitems and use a chevron to communicate state.
- Secondary actions can appear on nav nodes.
