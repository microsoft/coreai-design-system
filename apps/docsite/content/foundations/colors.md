---
id: colors
title: Colors
summary: 'Palette, semantic roles, token naming, and accessible color use.'
resources: []
reference:
  renderer: colors
  route: foundations/colors
  aliases:
    - /foundations/color/
    - /colors/
  migratedFrom:
    - apps/docsite/src/pages/Colors.tsx
    - apps/docsite/src/data/content.ts
---

## Brand color

CoreAI and Azure themes share a neutral palette and use different brand ramps. Prefer semantic tokens over hard-coded colors.

<!-- generated: colors -->

## Data visualization

<!-- generated: data-visualization -->

## Color usage balance

Use approximately **95% neutral** and **5% brand** color. Neutral colors support backgrounds, controls, and containers. They provide clarity, accessibility, and reduce visual fatigue. Brand colors emphasize primary actions, key highlights, links, and visual anchors. They create recognition and reinforce the brand voice.

## Accessibility

Normal text needs a contrast ratio of **4.5:1**. Large text and UI need **3:1**.

| Context                  | Pass example | Fail example |
| ------------------------ | ------------ | ------------ |
| Normal text on Grey 12   | #EDEDED      | #555555      |
| Large text/UI on Grey 12 | #808080      | #3D3D3D      |
| Normal text on white     | #242424      | #BDBDBD      |
| Large text/UI on white   | #808080      | #D4D4D4      |

Do not rely on color alone. Include labels and redundant status cues. Test the actual foreground/background pair in both themes.

See [Theming](./theming.md) for providers and custom brand colors.
