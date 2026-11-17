---
id: pages-collection-details-page
title: Collection Details Page
summary: >-
  Standalone collection with row-driven responsive details and focus
  restoration.
resources: []
reference:
  component: templates-pages-collection-details-page
  sources:
    - src/stories/templates/Pages/CollectionDetailsPage.tsx
    - src/stories/templates/Pages/PageLayout.tsx
    - src/stories/templates/Pages/LayoutContainer.tsx
    - src/stories/templates/Pages/PageHeader.tsx
    - src/stories/templates/Pages/PageBackLink.tsx
    - src/stories/templates/react-router/LinkButton.tsx
    - src/stories/templates/react-router/RouterLinkSlots.tsx
    - src/stories/templates/Pages/GridDetailsContent.tsx
    - src/stories/templates/DataGridWithFilters/DataGridWithFilters.tsx
    - src/stories/templates/EmptyState.tsx
    - src/stories/templates/Pages/DetailsLayout.tsx
    - src/stories/templates/Pages/PageBody.tsx
    - src/stories/templates/Pages/ResponsivePanel.tsx
  route: templates/PagesCollectionDetailsPage
---

These are copy-and-adapt templates, not package exports. Set `dataGridProps.getRowId` to return
a stable, unique ID for each item. Copy the files below into your app, preserving their
relative paths:

- `Pages/CollectionDetailsPage.tsx`
- `Pages/PageLayout.tsx`
- `Pages/LayoutContainer.tsx`
- `Pages/PageHeader.tsx`
- `Pages/PageBackLink.tsx`
- `react-router/LinkButton.tsx`
- `react-router/RouterLinkSlots.tsx`
- `Pages/GridDetailsContent.tsx`
- `DataGridWithFilters/DataGridWithFilters.tsx`
- `EmptyState.tsx`
- `Pages/DetailsLayout.tsx`
- `Pages/PageBody.tsx`
- `Pages/ResponsivePanel.tsx`

Router-aware templates require `react-router-dom` v7 and an application router.
