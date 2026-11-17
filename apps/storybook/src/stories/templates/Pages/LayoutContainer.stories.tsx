// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutContainer } from './LayoutContainer';
import { SidebarLayout } from './SidebarLayout';
const meta = {
  title: 'Templates/Pages/Layout Container',
  component: LayoutContainer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LayoutContainer>;
/** Copy-paste template — not an importable component. Copy `templates-pages-layout-container--source-code`. Page Layout and App Shell create this boundary automatically. @summary Container-width responsiveness for embedded layouts and drawers. */
export default meta;
/** A constrained embed uses a drawer even on a wide desktop. */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `.layout-container-example { display: flex; height: 70dvh; width: min(100%, 600px); }`;
    return (
      <>
        <style>{styles}</style>
        <LayoutContainer className="layout-container-example">
          <SidebarLayout sidebarTitle="Filters" sidebar="No filters applied">
            All items
          </SidebarLayout>
        </LayoutContainer>
      </>
    );
  },
};
