---
id: horizontal-tab-list
title: Tabs
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '7214:136202'
summary: >-
  A tablist allows people to switch between categories of related information
  without going to different pages.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=23575-138808
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tablist/usage'
storybookTitles:
  - Components/TabList
reference:
  component: components-tablist
  aliases: [/horizontal-tab/, /vertical-tab/, /vertical-tab-list/]
---

### Best practices

### Do

- Use tabs for distinct but related content categories or a small set of closely related pages.
- Ensure one tab is active on initial render.
- Keep labels brief and grammatically and conceptually parallel.

### Don't

- Use tabs for navigation beyond closely related categories; use links.
- Use tabs to initiate actions; use buttons.
- Expect horizontal tabs to scroll or wrap.

## Behavior and states

- One tab, usually the first, should always be active on first render.
- Horizontal tabs don’t scroll or wrap to the next line.
- Use an overflow menu button when the container can’t show every tab.
- Icon-only tabs require an aria-label and a tooltip.
- Identify the current selection to screen readers using aria-current.
- Vertical tablists place tabs in a column.
- When space is limited, consider an accordion or dropdown instead.
- Use one consistent label format for every tab in the tablist.
- They’re are ideal for dividing content-heavy pages into distinct but related categories that are easier to process and require less scrolling.
- Tabs can also be used for navigation between a small set of closely related, frequently accessed pages.
- For navigation beyond closely related categories, use a link instead.
- To initiate an action, use a button instead.
