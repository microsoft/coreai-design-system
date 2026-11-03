---
id: toolbar
title: Toolbar
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '78568:189219'
summary: >-
  A toolbar gives access to frequently used actions related to someone’s current
  view or task, like text formatting in an editor.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=78568-197710
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/toolbar/usage'
storybookTitles:
  - Components/Toolbar
reference:
  component: components-toolbar
---

## Best practices

### Do

- Group related actions with dividers and white space.
- Give each toolbar an accessible label when an app contains multiple toolbars.
- Provide icon-only buttons with tooltip text and an accessible label.

### Don't

- Place destructive or status-changing actions among unrelated options.
- Use icons that force people to guess their meaning.
- Add end punctuation to toolbar button or tooltip labels.

## Behavior and states

- A toolbar grows to fit its parent container but never wraps to a second line.
- Use an overflow menu when all options don’t fit.
- Group related actions with dividers and white space.
- Separate destructive or status-changing actions from other options.
