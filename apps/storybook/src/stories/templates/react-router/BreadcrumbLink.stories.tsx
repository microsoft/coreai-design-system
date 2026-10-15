// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Breadcrumb, BreadcrumbDivider, BreadcrumbItem } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { BreadcrumbLink } from './BreadcrumbLink';

/**
 * CoreAI BreadcrumbButtons that navigate with React Router.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <Breadcrumb aria-label="Project breadcrumb">
        <BreadcrumbItem>
          <BreadcrumbLink to="/projects">Projects</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbLink current to="/projects/coreai">
            CoreAI
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    </MemoryRouter>
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-breadcrumb-link--source-code` docs entry.
 *
 * Adapts CoreAI BreadcrumbButton state and styling to React Router's Link component.
 *
 * @summary CoreAI BreadcrumbButton adapter for React Router navigation.
 */
const meta: Meta = {
  title: 'Templates/React Router/Breadcrumb Link',
  parameters: { layout: 'fullscreen' },
};

export default meta;
