---
id: swatch-picker
title: Swatch picker
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '182179:455'
summary: >-
  A swatch picker lets people choose a color, image, or pattern in graphic and
  text editors.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=208407-2275
  - label: Fluent guidance
    url: >-
      https://github.com/microsoft/fluentui/blob/dfab5d732f028b0475663f5a945ede85e6ffc5c3/packages/react-components/react-swatch-picker/stories/src/SwatchPicker/SwatchPickerBestPractices.md
storybookTitles:
  - Components/SwatchPicker
reference:
  component: components-swatchpicker
  aliases: [/swatch/]
---

## Best practices

### Do

- Use no more than eight swatches in a row.
- Use a grid for more than four swatches, capped at an 8×8 grid.
- Show a tooltip for each color.
- Provide labels through aria-label or a tooltip.

### Don't

- Use rounded corners in grid layouts.
- Space extra-small or smaller swatches less than 4px apart.
- Display more than four disabled swatches.

## Behavior and states

- The SwatchPicker can be integrated within a popover or used as a standalone feature.
