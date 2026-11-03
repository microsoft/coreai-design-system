---
id: drawer
title: Drawer
navigation:
  group: Components
  showInSidebar: true
status: complete
figmaPageId: '134794:2279'
summary: >-
  A drawer is a secondary content surface that slides in from one edge of a
  layout. Use drawers for supplemental info and simple actions related to the
  main content.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=145579-770
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/drawer/usage'
storybookTitles:
  - Components/Drawer
reference:
  component: components-drawer
---

## Best practices

### Do

- Reserve modal drawers for important tasks that are clear and quick to complete.
- Use non-modal overlay drawers for at-a-glance information that can be easily dismissed.
- Use a dialog to confirm actions that might cause data loss.

### Don't

- Open multiple overlay drawers at the same time.
- Break established placement conventions, such as navigation on the left and notifications on the right.
- Use drawers for long blocks of text.

## Behavior and states

- Overlay drawers are elevated above main page content and are modal by default.
- Drawers can be closed by interacting with the button that opened them or an included dismiss icon.
- If a drawer gathers information, alert people if they might lose progress when they close it.
- Keep multi-step tasks in drawers to two or three steps.
- Wrap body content in DrawerBody to enable scrolling when content exceeds the drawer height.
- An overlay drawer is an intrusive surface that obscures all or part of the main page content.
- Use overlay drawers to draw more attention to the content in the drawer.
- An inline drawer is a passive surface that sits side-by-side with main page content.
- Use inline drawers when it’s helpful to view and interact with page content and drawer content at the same time.
- For short information that’s related to a specific part of the main layout, a drawer may be overwhelming.
- Try a tooltip or a popover instead.
- If you need people to confirm an action they’re trying to take, use a dialog.
