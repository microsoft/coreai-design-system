// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Storybook story file for the Shell and Navigation template.
 * The component and all its code live in ShellAndNavigation.tsx.
 * This file owns Storybook meta and story objects. The full source is shown
 * to humans and agents via the auto-generated ShellAndNavigation.mdx (see
 * scripts/generate-template-docs.mjs — do not hand-author that file).
 *
 * Stories:
 *   Default — full-page app shell with header, sidebar nav, and main content area
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShellAndNavigation } from './ShellAndNavigation';

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Full-page app shell: transparent header, collapsible sidebar nav, and a
 * main content area.
 *
 * @summary Header + collapsible sidebar nav + main content shell.
 */
export const Default: StoryObj = {
  name: 'Shell and Navigation',
  parameters: {
    // Opt out of the global centered+padded canvas decorator so the shell
    // fills the viewport edge-to-edge (see .storybook/preview.tsx).
    fullBleed: true,
  },
  render: () => <ShellAndNavigation />,
};

// ─── Storybook meta ───────────────────────────────────────────────────────────

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-shell-and-navigation--source-code` docs entry.
 *
 * Full-page app shell with a transparent header, collapsible sidebar nav, and
 * main content area.
 *
 * @summary Header + collapsible sidebar nav + main content shell for full-page apps.
 */
const meta: Meta = {
  title: 'Templates/Shell and Navigation',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
