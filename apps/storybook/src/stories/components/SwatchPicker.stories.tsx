// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  ColorSwatch,
  EmptySwatch,
  ImageSwatch,
  SwatchPicker,
  SwatchPickerRow,
  type SwatchPickerOnSelectEventHandler,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default: StoryObj = {
  render: () => {
    const [selectedValue, setSelectedValue] = React.useState('00B053');
    const [selectedColor, setSelectedColor] = React.useState('#00B053');
    const handleSelect: SwatchPickerOnSelectEventHandler = (_, data) => {
      setSelectedValue(data.selectedValue);
      setSelectedColor(data.selectedSwatch);
    };

    const styles = /* css */ `
      .swatch-picker-default-example__preview {
        width: 100px;
        height: 100px;
        border: var(--strokeWidthThin) solid var(--colorNeutralStroke1);
        margin: var(--spacingVerticalL) 0;
      }

      @media (forced-colors: active) {
        .swatch-picker-default-example__preview {
          forced-color-adjust: none;
        }
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="swatch-picker-default-example">
          <SwatchPicker
            aria-label="SwatchPicker default"
            selectedValue={selectedValue}
            onSelectionChange={handleSelect}
          >
            <ColorSwatch color="#FF1921" value="FF1921" aria-label="red" />
            <ColorSwatch color="#FF7A00" value="FF7A00" aria-label="orange" />
            <ColorSwatch color="#90D057" value="90D057" aria-label="light green" />
            <ColorSwatch color="#00B053" value="00B053" aria-label="green" />
            <ColorSwatch color="#00AFED" value="00AFED" aria-label="light blue" />
            <ColorSwatch color="#006EBD" value="006EBD" aria-label="blue" />
            <ColorSwatch disabled color="#011F5E" value="011F5E" aria-label="dark blue" />
            <ColorSwatch color="#712F9E" value="712F9E" aria-label="purple" />
          </SwatchPicker>

          <div
            className="swatch-picker-default-example__preview"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </>
    );
  },
};

/**
 * A swatch picker lets people choose a color, image, or pattern and apply it to graphics or text.
 *
 * @summary Lets people choose a color, image, or pattern swatch. Subcomponents: ColorSwatch, SwatchPickerRow, ImageSwatch, EmptySwatch.
 */
export default {
  title: 'Components/SwatchPicker',
  component: SwatchPicker,
  subcomponents: { ColorSwatch, SwatchPickerRow, ImageSwatch, EmptySwatch },
  parameters: {
    ...figmaDesign('SwatchPicker'),
  },
};
