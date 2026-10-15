// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { LinkButton } from './LinkButton';

/**
 * A CoreAI LinkButton that navigates with React Router.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <LinkButton to="/new">Create item</LinkButton>
    </MemoryRouter>
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-link-button--source-code` docs entry.
 *
 * Adapts the CoreAI LinkButton root to React Router's Link component.
 *
 * @summary Button-styled adapter for React Router navigation.
 */
const meta: Meta = {
  title: 'Templates/React Router/Link Button',
  parameters: { layout: 'fullscreen' },
};

export default meta;
