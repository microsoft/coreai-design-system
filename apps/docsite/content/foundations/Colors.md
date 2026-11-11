---
id: colors
title: Colors
summary: 'Palette, semantic roles, and token naming conventions.'
resources: []
reference:
  renderer: colors
  route: foundations/Colors
  aliases:
    - /foundations/color/
    - /colors/
  migratedFrom:
    - apps/docsite/src/pages/Colors.tsx
    - apps/docsite/src/data/Content.ts
---

<!-- view:colors -->
<!-- generated: colors -->
<!-- /view:colors -->

<!-- view:color-accessibility -->

## Accessibility requirements

Normal text needs a contrast ratio of **4.5:1**. Large text and UI need **3:1**.

| Context                  | Pass example | Fail example |
| ------------------------ | ------------ | ------------ |
| Normal text on Grey 12   | #EDEDED      | #555555      |
| Large text/UI on Grey 12 | #808080      | #3D3D3D      |
| Normal text on white     | #242424      | #BDBDBD      |
| Large text/UI on white   | #808080      | #D4D4D4      |

Do not rely on color alone. Include labels and redundant status cues. Test the actual foreground/background pair in both themes.

See [Theming](./Theming.md) for providers and custom brand colors.
<!-- /view:color-accessibility -->

<!-- view:data-visualization -->

## Data Visualization

<!-- generated: data-visualization -->
<!-- /view:data-visualization -->

## Apply the CoreAI theme

<!-- generated: coreai-theme-code -->

## Apply the Azure theme

<!-- generated: azure-theme-code -->

## Page source

<!-- generated: colors-code -->
