---
id: input
title: Input
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '33:559'
summary: >-
  An input allows people to enter short, free form text data. If you need to
  collect more than one line of information, try textarea.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=321038-7764
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/input/usage'
storybookTitles:
  - Components/Input
reference:
  component: components-input
---

## Best practices

### Do

- Size the input to the approximate length of the expected content.
- Use placeholder text only as a short supplementary hint or formatting example.
- Associate placeholder text with an accessible label.

### Don't

- Use placeholder text for essential information needed to complete the input.
- Rely on placeholder text instead of a persistent label or helper text.
- Add a period to placeholder text.

## Behavior and states

- Inputs can be masked or use custom type attributes that affect their formatting.
- Input masking can work like placeholder text to help people enter data in a specific format.
- Inputs can appear standalone, as full-width block elements, or inline with text.
- The input width should fit the approximate length of the expected content.
- Put Input into Field if you need info buttons, helper text, and validation states.
