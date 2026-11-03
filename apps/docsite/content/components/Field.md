---
id: field
title: Field
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '32182:95313'
summary: >-
  A field is a combination of a label and any form component, like an input,
  text area, or dropdown.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=32182-95336
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/field/usage'
storybookTitles:
  - Components/Field
reference:
  component: components-field
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Use one Field per input.
- Use a short sentence-case label with optional one-line help.
- Use required for mandatory fields.
- Put plain-language errors in validationMessage.
- Pick the right state: success, warning, or error.

### Don't

- Put multiple inputs in one Field, except checkbox or radio groups.
- Treat placeholder text as the label.
- Show errors before the user interacts.
- Use red for anything other than errors or required marks.
- Show success and error on the same Field.

## Behavior and states

- Validation states change the visual presentation of the field and can display a validation message.
- Use the required prop to display a red asterisk and announce the field as required to screen readers.
- When a field is disabled, only the form component appears disabled; its label remains enabled.
- Helper text and validation text that appeared before the field was disabled also remain enabled.
- Optionally, fields can also have info buttons, helper text, and validation states to give people clues about the information they need to enter.
