---
id: spin-button
title: Spin button
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '36789:211140'
summary: >-
  A spin button is a specialized input that lets someone easily increase or
  decrease a value within a set range, like dates in a month. Spin buttons are
  good for precise increments in small ranges.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=324095-17400
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/spin/usage'
storybookTitles:
  - Components/SpinButton
reference:
  component: components-spinbutton
---

## Best practices

### Do

- Use spin buttons for precise increments within small ranges.
- Choose increments that are reasonable for the represented value.
- Keep the input enabled when a boundary disables an increment button.

### Don't

- Use a spin button for very large ranges; use an input.
- Use it for fewer than three values; use an input.
- Use it when values may be imprecise and visual position matters; use a slider.

## Behavior and states

- Use spin buttons for precise increments in small ranges.
- Use an input instead when the range is very large or has fewer than three values.
- Use a slider when values can be imprecise and a visual representation of the range is helpful.
- If the range is very large or very small (less than three values), use an input instead.
- If the values can be imprecise and a visual representation of the value on the range is helpful, try a slider.
