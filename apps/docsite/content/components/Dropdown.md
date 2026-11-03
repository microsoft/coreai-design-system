---
id: dropdown
title: Dropdown
reference:
  component: components-dropdown
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49483'
summary: >-
  A dropdown lets people choose one or more options from a list. It can be used
  in forms where the options require custom styling [or as a component to filter
  or sort information].
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=324567-6252
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/dropdown/usage'
storybookTitles:
  - Components/Dropdown
---

## Best practices

### Do

- Use placeholder text as an extra hint about the available options.
- Use the text prop to define a string value for complex options, especially options containing JSX.
- Set inlinePopup when possible for better VoiceOver support.

### Don't

- Use placeholder text as the dropdown label.
- Repeat the same word or phrase at the beginning of every option.

## Behavior and states

- If placeholder text is not set, dropdowns show as empty until a selection is made.
- Selecting a closed single-select field opens the list of options. Choosing an option closes the field.
- For multi-select interactions, each list item is accompanied by a checkbox.
- A multi-select list stays open until someone dismisses it by clicking off the list or pressing Esc.
- Put Dropdown in a Field if you need a label, info button, and validation.
