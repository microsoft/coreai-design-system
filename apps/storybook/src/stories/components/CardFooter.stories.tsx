// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StoryObj } from '@storybook/react-vite';
import { Button, CardFooter } from '@coreai-ds/react-components';

import {
  ArrowReply16Regular,
  MoreHorizontal20Regular,
  Share16Regular,
} from '@fluentui/react-icons';

// Inline wrapper so RCM resolves CardFooter props and this meta owns `Default`
// (the fork-id dedup in main.ts drops the vendored duplicate).

export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .card-footer-example__footer {
        width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <CardFooter
          className="card-footer-example__footer"
          action={
            <Button
              appearance="transparent"
              icon={<MoreHorizontal20Regular />}
              aria-label="More options"
            />
          }
        >
          <Button icon={<ArrowReply16Regular />}>Reply</Button>
          <Button icon={<Share16Regular />}>Share</Button>
        </CardFooter>
      </>
    );
  },
};

/**
 * The CardFooter component, used inside of a Card, uses a flex layout to organize actions the user can take with a Card, like sharing the contents or replying to a message.
 *
 * @summary Footer region of a Card that lays out related actions.
 */
export default {
  title: 'Components/Card/CardFooter',
  component: CardFooter,
};
