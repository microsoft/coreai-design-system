// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Carousel,
  CarouselAutoplayButton,
  CarouselButton,
  CarouselCard,
  CarouselNav,
  CarouselNavButton,
  CarouselNavContainer,
  CarouselNavImageButton,
  CarouselSlider,
  CarouselViewport,
  Image,
  type CarouselAnnouncerFunction,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

/**
 * Displays full-width image banners with overlaid content and carousel navigation controls.
 */
export const Default: StoryObj = {
  render: () => {
    const images = [
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/sea-full-img.jpg',
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/bridge-full-img.jpg',
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/park-full-img.jpg',
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/sea-full-img.jpg',
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/bridge-full-img.jpg',
      'https://fabricweb.azureedge.net/fabric-website/assets/images/swatch-picker/park-full-img.jpg',
    ];

    const getAnnouncement: CarouselAnnouncerFunction = (index, totalSlides) =>
      `Carousel slide ${index + 1} of ${totalSlides}`;

    const styles = /* css */ `
      .carousel-default-example__card {
        align-content: center;
        height: 450px;
        text-align: left;
        position: relative;
      }

      .carousel-default-example__content {
        display: flex;
        flex-direction: column;
        gap: var(--spacingHorizontalS);
        position: absolute;
        left: 10%;
        top: 25%;
        background: var(--colorNeutralBackground1);
        padding: 18px;
        max-width: 270px;
        width: 50%;
      }

      .carousel-default-example__title {
        font-family: var(--fontFamilyBase);
        font-size: var(--fontSizeBase600);
        font-weight: var(--fontWeightSemibold);
        line-height: var(--lineHeightBase600);
      }

      .carousel-default-example__subtext {
        font-family: var(--fontFamilyBase);
        font-size: var(--fontSizeBase300);
        font-weight: var(--fontWeightRegular);
        line-height: var(--lineHeightBase300);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Carousel groupSize={1} circular announcement={getAnnouncement}>
          <CarouselViewport>
            <CarouselSlider>
              {images.map((imageSrc, index) => (
                <CarouselCard
                  key={`image-${index}`}
                  className="carousel-default-example__card"
                  aria-label={`${index + 1} of ${images.length}`}
                  id={`test-${index}`}
                >
                  <Image fit="cover" src={imageSrc} role="presentation" />

                  <div className="carousel-default-example__content">
                    <div className="carousel-default-example__title">Card {index + 1}</div>
                    <div className="carousel-default-example__subtext">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                    </div>
                    <div>
                      <Button size="small" shape="square" appearance="primary">
                        Call to action
                      </Button>
                    </div>
                  </div>
                </CarouselCard>
              ))}
            </CarouselSlider>
          </CarouselViewport>
          <CarouselNavContainer
            layout="inline"
            autoplayTooltip={{ content: 'Autoplay', relationship: 'label' }}
            nextTooltip={{ content: 'Go to next', relationship: 'label' }}
            prevTooltip={{ content: 'Go to prev', relationship: 'label' }}
          >
            <CarouselNav>
              {(index) => <CarouselNavButton aria-label={`Carousel Nav Button ${index}`} />}
            </CarouselNav>
          </CarouselNavContainer>
        </Carousel>
      </>
    );
  },
};

/**
 * A `Carousel` component is a sliding window of elements controlled by previous, next, and direct pagination buttons.
 *
 * `Carousel` allows banners or a series of cards to be displayed in a way that takes up minimal screen space. It offers an accessible method of viewing content that is out of bounds via keyboard interactions.
 *
 * 'CarouselNavContainer' offers multiple layouts of the underlying controls which can be suitable for full screen banners, multiple cards within a view, or large image box previews and displays, or use the underlying controls directly for precision placement.
 *
 * A `CarouselCard` can be full screen, responsive, or partial sizes, it is recommended to enable the `cardFocus` prop on the `CarouselSlider` if the cards are not full width banners (this provided keyboard navigation and accessibility tool access). If cards are intended to be full-screen banners, we recommend relying on the tab index of the internal elements only, while the out-of-view cards will be set to aria-hidden by default to prevent unnecessary tabbing and quick control access.
 *
 * > ⚠️ For `aria-live` announcements to work correctly you should configure you application with a
 * > [AriaLiveAnnouncer](https://react.fluentui.dev/?path=/docs/utilities-aria-live-arialiveannouncer--docs)
 * > towards the top of the React tree.
 *
 * @summary Sliding window of items navigated with previous/next and pagination controls. Subcomponents: CarouselAutoplayButton, CarouselButton, CarouselCard, CarouselNav, CarouselNavButton, CarouselNavContainer, CarouselNavImageButton, CarouselSlider, CarouselViewport.
 */
export default {
  title: 'Components/Carousel/Carousel',
  component: Carousel,
  subcomponents: {
    CarouselAutoplayButton,
    CarouselButton,
    CarouselCard,
    CarouselNav,
    CarouselNavButton,
    CarouselNavContainer,
    CarouselNavImageButton,
    CarouselSlider,
    CarouselViewport,
  },
  parameters: {
    ...figmaDesign('Carousel'),
  },
};
