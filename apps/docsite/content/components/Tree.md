---
id: tree-item
title: Tree
reference:
  component: components-tree
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '139584:9'
summary: >-
  A tree is used to display a hierarchical view of nested data. It's useful for
  representing a menu structure, folder hierarchy, or nested categories at a
  glance.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=166093-119814
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/tree/usage'
storybookTitles:
  - Components/Tree
---

## Best practices

### Do

- Use branches to group related items into hierarchical categories and subcategories.
- Use simple, easily recognizable icons.
- Keep item labels short, clear, and grammatically consistent.

### Don't

- Use complex or abstract icons that might confuse people.
- Provide more than one or two quick actions per item.

## Behavior and states

- Branches expand and collapse to show or hide child nodes.
- Navigation mode lets people select an item to open a detailed view.
- Multiselect mode supports batch operations across multiple items.
- Tree item content wraps by default within the container width.
- Each tree has a parent node and one or more levels of child nodes that can expand or collapse.
- To show or hide information without regard to hierarchy, use an accordion instead.
- For information that's organized in a simpler structure, consider using a list or table instead.
