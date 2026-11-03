---
id: rating
title: Rating
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '190351:2605'
summary: >-
  Rating is used to communicate user sentiment. It also allows customers to
  determine a sense of value of a good or a service.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=192287-25319
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/rating/usage'
storybookTitles:
  - Components/Rating
reference:
  component: components-rating
---

## Best practices

### Do

- Use interactive rating when asking someone to provide feedback.
- Use rating display for ratings that were already submitted.
- Maintain 3:1 contrast between foreground and background and between selected and unselected states.

### Don't

- Use an interactive rating to represent a previously submitted value.
- Use the contrast exception unless the numeric value is explicit and visually hidden text is supplied.

## Behavior and states

- Interactive ratings have hover, focus, and pressed states.
- Rating displays show submitted ratings and are non-interactive.
- Rating icons can be empty, partially filled, or filled.
