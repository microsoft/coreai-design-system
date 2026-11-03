---
id: slider
title: Slider
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '5874:120283'
summary: >-
  A slider lets someone set a value from a given range. Sliders can take
  immediate effect, like a volume control, or can require a submission, like in
  a form.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=12126-152884
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/slider/usage'
storybookTitles:
  - Components/Slider
reference:
  component: components-slider
  omitDecorators: >-
    Storybook-only layout decorators are omitted. Examples use the documentation
    preview spacing instead.
---

## Best practices

### Do

- Use a slider when approximate or imprecise values are acceptable.
- Use a step slider when selection must snap to discrete values.
- Provide a label, even if it is visually hidden.

### Don't

- Use a slider for extremely small or large ranges.
- Use a slider for precise numerical input; use an input.

## Behavior and states

- Default sliders let someone choose any approximate value along an unmarked range.
- Step sliders divide a track into discrete values and snap the thumb to the closest value.
- Move the thumb along the track or select a point on the track for the thumb to jump to.
- Sliders can be laid out vertically or horizontally.
- Use a slider for imprecise values.
- Don't use them for ranges that are very small or very large.
- For precise numerical inputs, like a dollar amount, try an input.
