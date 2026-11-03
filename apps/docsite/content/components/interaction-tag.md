---
id: interaction-tag
title: Interaction tag
summary: >-
  A tag is a representation of a value that someone has picked, like recipients
  for an email or categories on a planner task.
status: complete
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=175028-86039
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tag/usage'
reference:
  component: components-tag-interactiontag
---

## Behavior and states

- Interaction tags can include one primary action in addition to dismissal.
- The primary action should directly relate to the represented object.
- The secondary action is always dismiss.
- Interaction states are always enabled because interaction tags always have actions.
- Tags create a visual pattern that lets people know they can change or remove the selection.
- To show system-generated data that people can’t change, use a badge instead.
