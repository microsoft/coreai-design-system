---
id: search-box
title: Search box
navigation:
  group: Components
  showInSidebar: true
figmaPageId: '212891:4'
summary: >-
  Search bars are one of the most used components in the system. It allows the
  users to access the right component with ease.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=321831-998
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/searchbox/usage'
storybookTitles:
  - Components/SearchBox
reference:
  component: components-searchbox
---

## Behavior and states

- The focus animation appears once the searchbox receives focus.
- The Close button is only present when there’s content in the searchbox.
- Recent topics appear on focus, then suggested results replace them as a query is entered.
- At smaller viewport sizes, the searchbox can be redrawn as a magnifying glass icon that activates a full-width searchbox.
- The search bar must be flexible, allow for dismissal and filtering to provide the best experience.
- Search results are populated in a combo box dropdown that changes and repopulates as the user types.
