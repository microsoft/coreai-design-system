---
id: card
title: Card
navigation:
  group: Components
  showInSidebar: true
figmaPageId: '1011:48412'
summary: >-
  A card is a container that holds information and actions related to a single
  concept or object, like a document or a contact. Cards can give information
  prominence and create predictable patterns.
resources:
  - label: Figma component
    url: >-
      https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-Figma-Library?node-id=432832-55273
  - label: Fluent guidance
    url: 'https://fluent2.microsoft.design/components/web/react/core/card/usage'
storybookTitles:
  - Components/Card/Card
reference:
  component: components-card-card
---

## Behavior and states

- When there are multiple available actions, a card can hold buttons and links.
- If there is one obvious action, the entire card surface can function as a button.
- Cards can also be used to let people make a selection, similar to checkboxes or radio groups.
- By default, there is no indicator on cards that signifies they are selectable, but interaction states like hover and focus can hint at selectability.
- While they’re very flexible, it’s important to use them consistently for particular use cases across experiences.

For React Router navigation, see the [Card Link template](../templates/ReactRouterCardLink.md).
Prefer an existing repository adapter when your app already provides one.
