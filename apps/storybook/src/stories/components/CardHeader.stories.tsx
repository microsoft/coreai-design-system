// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import { Button, Text, CardHeader } from '@coreai-ds/react-components';

import { MoreHorizontal20Regular } from '@fluentui/react-icons';

// Inline wrapper — see CardFooter.stories.tsx.

export const Default: StoryObj = {
  render: () => {
    const assetUrl =
      'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/src/assets/';
    const powerpointLogoURL = `${assetUrl}pptx.png`;
    const styles = /* css */ `
      .card-header-example__header {
        width: 300px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <CardHeader
          className="card-header-example__header"
          image={{ as: 'img', src: powerpointLogoURL, alt: 'Microsoft PowerPoint logo' }}
          header={
            <Text preset="body">
              <b>App Name</b>
            </Text>
          }
          description={<Text preset="bodyS">Developer</Text>}
          action={
            <Button
              appearance="transparent"
              icon={<MoreHorizontal20Regular />}
              aria-label="More options"
            />
          }
        />
      </>
    );
  },
};

/**
 * The CardHeader component, used inside of a Card, represents a Fluent UI compliant card header.
 *
 * @summary Header region of a Card for a title, subtitle, image, and actions.
 */
export default {
  title: 'Components/Card/CardHeader',
  component: CardHeader,
  parameters: { ...figmaDesign('CardHeader') },
};
