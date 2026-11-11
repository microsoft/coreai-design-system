---
id: tab-elevated
title: TabList Elevated
navigation:
  group: Components
  showInSidebar: true
storybookDefaultStory: Elevated Appearance
figmaPageId: '432771:25521'
summary: >-
  A tablist allows people to switch between categories of related information
  without going to different pages.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=432771-25797
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tablist/usage'
storybookTitles:
  - Components/TabList
reference:
  standalone: true
  route: components/TabElevated
  aliases: [/tab-elevated/]
---

## Preview

<!-- example: components-tablist--elevated-appearance -->

## Best practices

### Do

- Always have one tab active on initial render.
- Use a consistent label format across every tab.
- Keep labels brief and parallel.

### Don't

- Use a tablist when constrained space makes the options hard to find; consider an accordion or dropdown.
- Use tabs for unrelated navigation or actions.

## Behavior and states

- One tab, usually the first, should always be active on first render.
- Use one consistent label format for every tab in the tablist.
- Keep tab labels brief and parallel.
- When space is limited, consider an accordion or dropdown instead.
