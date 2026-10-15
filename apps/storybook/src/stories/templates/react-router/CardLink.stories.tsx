// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { CardLink } from './CardLink';

/**
 * A CardLink that navigates with React Router and exposes link semantics.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <CardLink to="/projects/coreai">CoreAI project</CardLink>
    </MemoryRouter>
  ),
};

const meta: Meta = {
  title: 'Templates/React Router/Card Link',
  parameters: { layout: 'fullscreen' },
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-card-link--source-code` docs entry.
 *
 * Adapts the CoreAI Card root to React Router's Link component with a default
 * link role while preserving explicit role overrides and both components' prop APIs.
 *
 * @summary CardLink adapter for accessible React Router navigation.
 */
export default meta;
