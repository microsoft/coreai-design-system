---
id: menu
title: Menu
navigation:
  group: Components
  showInSidebar: true
figmaPageId: '1011:48416'
summary: >-
  A menu is a hidden list of options that is shown when someone interacts with a
  trigger component, like a button, an avatar, or an icon.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=301778-9076
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/menu/usage'
storybookTitles:
  - Components/Menu/Menu
reference:
  component: components-menu-menu
  aliases: [/menu-item/, /menu-section/, /menu-split-item/]
---

## Best practices

### Do

- Use menus for immediate actions or navigation.
- Order options logically, such as frequent actions first and dangerous actions last.
- Use brief, verb-led labels for actions.

### Don't

- Use a menu to collect information.
- Use long menu-item labels.
- Create deeply nested menu structures.

## Behavior and states

- The default menu treats each item as a button that initiates an action.
- Checkbox menus let people select multiple items.
- Radio menus let people select one item that turns a setting on or off.
- Menus have a maximum width of 300 pixels.
- Menu items with long labels wrap onto the next line.
- An option can open related options in a submenu.
- Add an aria-label to submenu trigger components.
