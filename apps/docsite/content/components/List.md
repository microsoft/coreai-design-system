---
id: list-item
title: List
navigation:
  group: Components
  showInSidebar: true
figmaPageId: '285738:557'
summary: >-
  A list is a collection of items or information repeated in a vertical stack.
  Use lists to make information easy to scan and access.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=287954-86982
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/list/usage'
storybookTitles:
  - Components/List
reference:
  component: components-list
  aliases: [/list-content/]
  singlePreview: List examples reuse selection values as DOM IDs. Run one example at a time to keep IDs unique.
---

## Best practices

### Do

- Use a list for independent, vertically stacked, scannable items.
- Keep item structures and line lengths parallel.
- Visually group a list with related content.

### Don't

- Use a list for nested hierarchy; use a tree.
- Use a list for related columns; use a data grid or table.
- Include empty or disabled list items.

## Behavior and states

- For a single action, clicking a list item or pressing Enter or Space while it has focus initiates the action.
- For secondary actions, use the Right Arrow key to navigate into the list item.
- Use the Left Arrow key or Esc to return to the parent container.
- If selection is the only action, clicking the item or pressing Space or Enter triggers selection.
- For multi-select interactions, each list item is accompanied by a checkbox.
- The list of options stays open until someone dismisses it by clicking off the list or pressing Esc.
- If selections exceed the width of the container, the field shows how many options are selected.
- Items in a list are independent of one another.
- If you need a way to display information in columns that relate to each other, try a DataGrid or Table.
- If you need nested hierarchy in your list, try Tree.
