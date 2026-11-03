---
id: switch
title: Switch
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49484'
summary: >-
  A switch lets someone choose between two mutually exclusive options, like on
  or off. Activating a switch triggers an immediate change.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=6022-126541
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/switch/usage'
storybookTitles:
  - Components/Switch
reference:
  component: components-switch
---

## Best practices

### Do

- Use a switch for two mutually exclusive states whose change applies immediately.
- Use a visible label in most contexts.
- Use a noun or short noun phrase to describe the setting.

### Don't

- Use a switch when changes require submission; use a checkbox.
- Use it for an indeterminate state; use a checkbox.
- Label switches with “Turn on” or “Turn off.”

## Behavior and states

- Activating a switch triggers an immediate change.
- Use switches with labels in most cases.
- A switch without a visible label must appear in an obvious context.
- Use hidden label text to identify an icon-only switch to screen readers.
- If you need a component that requires a submission step before applying a change, or if you need to specify an indeterminate state, try a checkbox.
