// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Image,
  TeachingPopover,
  TeachingPopoverBody,
  TeachingPopoverCarousel,
  TeachingPopoverCarouselCard,
  TeachingPopoverCarouselFooter,
  TeachingPopoverCarouselNav,
  TeachingPopoverCarouselNavButton,
  TeachingPopoverCarouselPageCount,
  TeachingPopoverFooter,
  TeachingPopoverHeader,
  TeachingPopoverSurface,
  TeachingPopoverTitle,
  TeachingPopoverTrigger,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

const swapImage =
  'https://fabricweb.azureedge.net/fabric-website/assets/images/wireframe/image-square.png';

export const Default = (): JSXElement => (
  <TeachingPopover>
    <TeachingPopoverTrigger>
      <Button>TeachingPopover trigger</Button>
    </TeachingPopoverTrigger>
    <TeachingPopoverSurface>
      <TeachingPopoverHeader>Tips</TeachingPopoverHeader>
      <TeachingPopoverBody media={<Image alt="test image" fit="cover" src={swapImage} />}>
        <TeachingPopoverTitle>Teaching Bubble Title</TeachingPopoverTitle>
        <div>This is a teaching popover body</div>
      </TeachingPopoverBody>
      <TeachingPopoverFooter primary="Learn more" secondary="Got it" />
    </TeachingPopoverSurface>
  </TeachingPopover>
);

/**
 * A popover that delivers contextual, guided information — such as onboarding
 * tips or feature callouts — optionally presented as a multi-step carousel.
 *
 * @summary A popover for guided tips or feature callouts, optionally as a carousel. Subcomponents: TeachingPopoverBody, TeachingPopoverCarousel, TeachingPopoverCarouselCard, TeachingPopoverCarouselFooter, TeachingPopoverCarouselNav, TeachingPopoverCarouselNavButton, TeachingPopoverCarouselPageCount, TeachingPopoverFooter, TeachingPopoverHeader, TeachingPopoverSurface, TeachingPopoverTitle, TeachingPopoverTrigger.
 */
export default {
  title: 'Components/TeachingPopover',
  component: TeachingPopover,
  subcomponents: {
    TeachingPopoverBody,
    TeachingPopoverCarousel,
    TeachingPopoverCarouselCard,
    TeachingPopoverCarouselFooter,
    TeachingPopoverCarouselNav,
    TeachingPopoverCarouselNavButton,
    TeachingPopoverCarouselPageCount,
    TeachingPopoverFooter,
    TeachingPopoverHeader,
    TeachingPopoverSurface,
    TeachingPopoverTitle,
    TeachingPopoverTrigger,
  },
  parameters: {
    ...figmaDesign('Teaching Popover'),
  },
};
