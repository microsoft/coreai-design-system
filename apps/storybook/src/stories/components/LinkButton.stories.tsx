// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { type JSXElement, LinkButton } from '@coreai-ds/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons';
import { StoryObj } from '@storybook/react-vite';

/**
 * `LinkButton` renders a native `<a>` — not a `<button>` — so it's a real,
 * navigable, keyboard- and screen-reader-friendly link (works with
 * ctrl/cmd-click, "open in new tab", `rel`, crawlers, …) while preserving the
 * complete Fluent `Button` content and visual API.
 */
export const Default: StoryObj = {
  render: (): JSXElement => (
    <LinkButton href="/get-started" icon={<ArrowRightRegular />} iconPosition="after">
      Get started
    </LinkButton>
  ),
};

/**
 * Set `external` to append an external-link icon and default the native anchor
 * to `target="_blank"` with `rel="noopener noreferrer"`.
 */
export const External: StoryObj = {
  render: (): JSXElement => (
    <LinkButton external href="https://example.com">
      Visit external site
    </LinkButton>
  ),
};

/**
 * A native `<a>` anchor styled with the same visual chrome as Fluent's
 * `Button`, including its icon, appearance, shape, size, and disabled APIs, for
 * when button styling is needed but the control must be a real, navigable
 * link. The `external` prop adds an external-link indicator and safe new-tab
 * defaults.
 *
 * @summary A native anchor styled with Fluent Button chrome for a real, navigable link.
 */
export default {
  title: 'Components/Button/LinkButton',
  component: LinkButton,
};
