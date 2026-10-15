// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import { type JSXElement, CardPreview } from '@coreai-ds/react-components';

// Inline wrapper — see CardFooter.stories.tsx.

const resolveAsset = (asset: string) => {
  const ASSET_URL =
    'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/src/assets/';

  return `${ASSET_URL}${asset}`;
};

export const Default = (): JSXElement => (
  <CardPreview logo={<img src={resolveAsset('docx.png')} alt="Microsoft Word logo" />}>
    <img src={resolveAsset('doc_template.png')} alt="Preview of a Word document" />
  </CardPreview>
);

/**
 * The CardPreview component, used inside of a Card, allows the user to better visualize what the card's contents are.
 *
 * @summary Preview region of a Card for prominent media or content.
 */
export default {
  title: 'Components/Card/CardPreview',
  component: CardPreview,
  parameters: { ...figmaDesign('CardPreview') },
};
