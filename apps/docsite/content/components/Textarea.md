---
id: textarea
title: Textarea
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '7214:127351'
summary: >-
  A textarea allows people to enter long, free-form text data, like a comment.
  If you only need someone to enter one line of information, try an input
  instead.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=62039-177849
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/textarea/usage'
storybookTitles:
  - Components/Textarea
reference:
  component: components-textarea
---

## Best practices

### Do

- Size the textarea to the approximate volume of expected content.
- Pair placeholder text with a visible label.

### Don't

- Use placeholder text for essential information.
- Put too much information in the placeholder.
- Rely on placeholder text instead of a persistent label or helper text.

## Behavior and states

- Textareas aren’t resizable by default.
- Overflow content scrolls within the textarea.
- The resize property can let people control how much information they see.
- Size the textarea for the approximate volume of expected content.
