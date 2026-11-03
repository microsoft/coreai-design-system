---
id: checkbox
title: Checkbox
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '116:46757'
summary: >-
  Checkboxes let people select multiple options from a group or switch a single
  option on or off. To restrict someone to picking one option, try a radio group
  or dropdown.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=116-46830
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/checkbox/usage'
storybookTitles:
  - Components/Checkbox
reference:
  component: components-checkbox
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Use checkboxes to allow users to select any number of options, including zero, one, or several.
- Use a radio group if only one option can be selected from a group.
- Use a multiselect if the group of non-mutually exclusive options is higher than seven.
- Use checkboxes for options that turn a group of elements on or off.
- When providing a default selection state, consider the recommended or most likely choice for a user.

### Don't

- Use checkboxes for options that require descriptions to understand the implications of both the on and off states. Use a radio group instead.
- Use checkboxes for options that take immediate effect. Use a toggle instead.
- Label a checkbox as optional.

## Behavior and states

- If one checkbox controls a subset of options, selecting or clearing the parent checkbox selects or clears all of the children.
- Use an indeterminate state to show when some, but not all, of the options are selected.
- Create a visual separation between parent and child checkboxes to increase scannability.
- Checkboxes don’t trigger an immediate change and require a submission step, like selecting a button.
- If you need a component that has immediate effect, try a switch.
