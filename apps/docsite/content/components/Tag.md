---
id: tag
title: Tag
navigation:
  group: Components
  showInSidebar: true
status: complete
storybookTitles:
  - Components/Tag/Tag
  - Components/Tag/InteractionTag
figmaPageId: '133557:2279'
summary: >-
  A tag is a representation of a value that someone has picked, like recipients
  for an email or categories on a planner task.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=174111-15541
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tag/usage'
reference:
  component: components-tag-tag
---

## Best practices

### Do

- Enable dismissal when people need to undo their choices.
- Make an interaction tag’s primary action directly relate to the object it represents.
- Allow tags to wrap when people need to see, edit, or remove every tag.

### Don't

- Include actions that are irrelevant or disruptive to the current task.
- Truncate tag content.

## Behavior and states

- Tags are optionally dismissible.
- Non-dismissible tags communicate that a selection isn’t editable in the current context.
- Tags reflow onto the next line by default when they can’t fit the container.
- Static tags have no interaction states; dismissible tags enable hover and focus states.
- Tags create a visual pattern that lets people know they can change or remove the selection.
- To show system-generated data that people can’t change, use a badge instead.
