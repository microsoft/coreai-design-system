// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  CarouselNav,
  CarouselNavButton,
  CarouselNavImageButton,
  Field,
  Switch,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

/**
 * Switches between standard pagination buttons and image preview buttons.
 */
export const Default: StoryObj = {
  render: () => {
    const swapImage =
      'https://fabricweb.azureedge.net/fabric-website/assets/images/wireframe/image-square.png';
    const [useImageButtons, setUseImageButtons] = React.useState(false);

    const styles = /* css */ `
      .carousel-nav-default-example {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        box-shadow: var(--shadow16);
      }

      .carousel-nav-default-example__card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: end;
        border: var(--strokeWidthThicker) solid var(--colorNeutralForeground3);
        border-radius: 0 0 var(--borderRadiusMedium) var(--borderRadiusMedium);
        padding: 10px;
        min-height: 100px;
      }

      .carousel-nav-default-example__controls {
        display: flex;
        flex-direction: column;
        border: var(--strokeWidthThicker) solid var(--colorNeutralForeground3);
        border-bottom: none;
        border-radius: var(--borderRadiusMedium) var(--borderRadiusMedium) 0 0;
        padding: 10px;
      }

      .carousel-nav-default-example__field {
        flex: 1;
        grid-template-columns: max-content 1fr;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="carousel-nav-default-example">
          <div className="carousel-nav-default-example__controls">
            <Field
              className="carousel-nav-default-example__field"
              label={
                <>
                  Use <code>CarouselNavImageButton</code>
                </>
              }
              orientation="horizontal"
            >
              <Switch
                checked={useImageButtons}
                onChange={(_, data) => setUseImageButtons(data.checked)}
              />
            </Field>
          </div>
          <div className="carousel-nav-default-example__card">
            <CarouselNav totalSlides={5} appearance="brand">
              {(index) =>
                useImageButtons ? (
                  <CarouselNavImageButton
                    image={{ src: swapImage }}
                    aria-label={`Carousel Nav Button ${index}`}
                  />
                ) : (
                  <CarouselNavButton aria-label={`Carousel Nav Button ${index}`} />
                )
              }
            </CarouselNav>
          </div>
        </div>
      </>
    );
  },
};

/**
 * `CarouselNav` provides an index based pagination of the Carousel containing it.
 *
 * The render function of CarouselNav will be called based on the total number of slide breakpoints in the carousel (i.e. if groupSize is 2, there will be one CarouselNavButton for each group of slides). By passing in the index function, we connect the pagination buttons to the carousel without a need for specific values or IDs, and will be a consistent page index selected after changes such as resizing.
 *
 * Each CarouselNavButton or CarouselImageNavButton will be wrapped in a context provider, enabling the index to be passed in without manual intervention. You can also override this render with a custom component and access the index via this same context.
 *
 * @summary Index-based pagination control for a Carousel.
 */
export default {
  title: 'Components/Carousel/CarouselNav',
  component: CarouselNav,
  parameters: {
    ...figmaDesign('CarouselNav'),
  },
};
