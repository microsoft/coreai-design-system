---
id: label
title: Label
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49486'
summary: Labels give a name to a component or group of components.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=7062-121104
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/label/usage'
storybookTitles:
  - Components/Label
reference:
  component: components-label
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Pair the label with the component or group it names.
- Use an asterisk to identify required information.
- Keep label text brief and use sentence-style capitalization.

### Don't

- Use placeholder text in place of a label.
- Truncate long labels; allow them to wrap.
- Add end punctuation unless the label is a question.
- Put a colon after a label.

## Behavior and states

- A label can display a disabled state if the component it names is also disabled.
- If a label is longer than its container, the text wraps onto the next line.
- Labels never truncate.
- Pair them with components like checkboxes and inputs to prompt someone to enter certain information, or with plaintext to categorize information.
- If you need a label with an info button, consider InfoLabel.
- If you are are combining Label, any form component and need helper text and validation, consider Field.
