// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Image, type ImageProps, type JSXElement } from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: ImageProps): JSXElement => {
  return (
    <Image
      {...props}
      alt="Allan's avatar"
      src="https://fabricweb.azureedge.net/fabric-website/assets/images/avatar/AllanMunger.jpg"
    />
  );
};

Default.argTypes = {
  alt: {
    control: 'text',
    defaultValue: 'Image placeholder',
    description: `description of the image, which isn't mandatory but is incredibly useful for accessibility`,
  },
  src: {
    control: 'text',
    defaultValue: 'https://fabricweb.azureedge.net/fabric-website/placeholders/300x300.png',
    description: 'path to the image you want to display',
  },
  as: { table: { disable: true } },
};
Default.parameters = {
  controls: {
    disable: false,
  },
};

/**
 * An image displays graphical content such as a photo or illustration.
 *
 * @summary Displays graphical content such as a photo or illustration.
 */
export default {
  title: 'Components/Image',
  component: Image,
  parameters: {
    ...figmaDesign('Image'),
  },
};
