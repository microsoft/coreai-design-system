---
id: radio-group
title: Radio group
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '2070:49485'
summary: >-
  Radio groups let people select a single item from a short list. Use them in
  layouts that offer enough space to list up to five options or if it's
  important to view all options at once.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=219564-4609
  - label: Fluent guidance
    url: >-
      https://fluent2.microsoft.design/components/web/react/core/radiogroup/usage
storybookTitles:
  - Components/RadioGroup
reference:
  component: components-radiogroup
  aliases: [/radio/]
---

### Best practices

### Do

- Use a radio group for one selection from a short list of up to five options.
- Provide a logical default selection and place it first.
- Prefer vertical alignment for scanability and localization.

### Don't

- Use a radio group when space cannot show the options; use a dropdown.
- Use a radio group for multiple selections; use checkboxes.
- Use a radio group as an immediate on/off control; use a switch.

## Behavior and states

- Present a selected option by default.
- Place the default selection first and use the most logical response.
- When tabbing, focus falls on the selected option first, or the first option when none is selected.
- Radio groups can be aligned vertically or horizontally.
- Vertical alignment is preferred for scannability and localization.
- If there isn't enough space, try a dropdown instead.
- If you need to let people select more than one option, use checkboxes.
- To let them immediately turn a setting on or off, try a switch.
