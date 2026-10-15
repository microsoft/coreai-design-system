// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  AlphaSlider,
  ColorArea,
  ColorPicker,
  ColorSlider,
  Input,
  Label,
  SpinButton,
  useId,
  type ColorPickerProps,
  type SpinButtonChangeEvent,
  type SpinButtonOnChangeData,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';
import { tinycolor } from '@ctrl/tinycolor';

/**
 * Selects a color and keeps HSV, RGB, hexadecimal, and alpha inputs synchronized.
 */
export const Default: StoryObj = {
  render: () => {
    type RgbKey = 'r' | 'g' | 'b';

    const hexColorRegex = /^#?([0-9A-Fa-f]{0,8})$/;
    const numberRegex = /^\d+$/;
    const defaultColorHsv = { h: 109, s: 1, v: 0.9, a: 1 };
    const hexId = useId('hex-input');
    const redId = useId('red-input');
    const greenId = useId('green-input');
    const blueId = useId('blue-input');
    const alphaId = useId('alpha-input');
    const [color, setColor] = React.useState(defaultColorHsv);
    const [hex, setHex] = React.useState(tinycolor(color).toHexString());
    const [rgb, setRgb] = React.useState(tinycolor(color).toRgb());
    const [alpha, setAlpha] = React.useState(color.a);
    const [namedColor, setNamedColor] = React.useState('');

    const handleChange: ColorPickerProps['onColorChange'] = (_, data) => {
      setColor({ ...data.color, a: data.color.a ?? 1 });
      setHex(tinycolor(data.color).toHexString());
      setRgb(tinycolor(data.color).toRgb());
      setAlpha(data.color.a ?? 1);
      const nextNamedColor = tinycolor(`hsl(${data.color.h},100%,50%)`).toName();
      if (nextNamedColor) {
        setNamedColor(nextNamedColor);
      }
    };

    const onRgbChange = (name: RgbKey, data: SpinButtonOnChangeData) => {
      const value = data.value ?? parseFloat(data.displayValue ?? '');

      if (value === null || Number.isNaN(value) || !numberRegex.test(value.toString())) {
        return;
      }

      const newColor = tinycolor({ ...rgb, [name]: value });
      if (newColor.isValid) {
        setColor(newColor.toHsv());
        setHex(newColor.toHex());
        setRgb(newColor.toRgb());
      }
    };

    const onAlphaChange = React.useCallback(
      (_event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
        const value = data.value ?? parseFloat(data.displayValue ?? '');

        if (Number.isNaN(value) || value < 0 || value > 1) {
          return;
        }

        const newColor = tinycolor({ ...color, a: value });

        if (newColor.isValid) {
          setColor(newColor.toHsv());
          setHex(newColor.toHex());
          setRgb(newColor.toRgb());
          setAlpha(newColor.a);
        }
      },
      [color],
    );

    const handleOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      const value = tinycolor(event.target.value);
      if (!value.isValid) {
        event.target.setAttribute('aria-invalid', 'true');
      } else {
        event.target.removeAttribute('aria-invalid');
      }
    };

    const colorAriaAttributes = {
      'aria-roledescription': '2D slider',
      'aria-valuetext': `Saturation ${color.s * 100}, Brightness: ${color.v * 100}, ${namedColor}`,
    };
    const rgbFields: Array<{ id: string; label: string; name: RgbKey; value: number }> = [
      { id: redId, label: 'Red', name: 'r', value: rgb.r },
      { id: greenId, label: 'Green', name: 'g', value: rgb.g },
      { id: blueId, label: 'Blue', name: 'b', value: rgb.b },
    ];

    const styles = /* css */ `
      .color-picker-default-example {
        width: 300px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .color-picker-default-example__preview {
        width: 50px;
        height: 50px;
        border-radius: var(--borderRadiusMedium);
        border: 1px solid #ccc;
      }

      .color-picker-default-example__fields {
        display: flex;
        align-items: flex-end;
        flex-direction: row;
        gap: 10px;
      }

      .color-picker-default-example__field {
        display: flex;
        flex-direction: column;
        gap: var(--spacingHorizontalSNudge);
      }

      .color-picker-default-example__hex-input {
        width: 96px;
      }

      .color-picker-default-example__spin-button {
        min-width: 60px;
      }

      @media (forced-colors: active) {
        .color-picker-default-example__preview {
          forced-color-adjust: none;
        }
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="color-picker-default-example">
          <ColorPicker color={color} onColorChange={handleChange}>
            <ColorArea
              inputX={{ 'aria-label': 'Saturation', ...colorAriaAttributes }}
              inputY={{ 'aria-label': 'Brightness', ...colorAriaAttributes }}
            />
            <ColorSlider aria-label="Hue" aria-valuetext={`${color.h}°, ${namedColor}`} />
            <AlphaSlider aria-label="Alpha" aria-valuetext={`${color.a * 100}%`} />
          </ColorPicker>
          <div className="color-picker-default-example__fields">
            <div className="color-picker-default-example__field">
              <Label htmlFor={hexId}>Hex</Label>
              <Input
                className="color-picker-default-example__hex-input"
                value={hex}
                id={hexId}
                onChange={(event) => {
                  const value = event.target.value;
                  const newColor = tinycolor(value);
                  if (newColor.isValid) {
                    setColor(newColor.toHsv());
                    setRgb(newColor.toRgb());
                    setAlpha(newColor.a);
                  }
                  setHex((oldValue) => (hexColorRegex.test(value) ? value : oldValue));
                }}
                onBlur={handleOnBlur}
              />
            </div>
            {rgbFields.map((field) => (
              <div className="color-picker-default-example__field" key={field.name}>
                <Label htmlFor={field.id}>{field.label}</Label>
                <SpinButton
                  className="color-picker-default-example__spin-button"
                  min={0}
                  max={255}
                  value={field.value}
                  id={field.id}
                  onChange={(_, data) => onRgbChange(field.name, data)}
                  name={field.name}
                />
              </div>
            ))}
            <div className="color-picker-default-example__field">
              <Label htmlFor={alphaId}>Alpha</Label>
              <SpinButton
                min={0}
                max={1}
                className="color-picker-default-example__spin-button"
                value={alpha}
                step={0.01}
                onChange={onAlphaChange}
                id={alphaId}
              />
            </div>
          </div>
          <div
            className="color-picker-default-example__preview"
            style={{ backgroundColor: tinycolor(color).toRgbString() }}
          />
        </div>
      </>
    );
  },
};

/**
 * The ColorPicker allows users to browse and select colors.
 * By default, it enables navigation through a color spectrum and operates in HSV/HSL format.
 * However, it is also possible to specify a color using Red-Green-Blue (RGB), an alpha color code, or hexadecimal values in the text boxes.
 *
 * @summary Lets users browse and select a color across a spectrum. Subcomponents: ColorArea, ColorSlider, AlphaSlider.
 */
export default {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  subcomponents: { ColorArea, ColorSlider, AlphaSlider },
  parameters: {
    ...figmaDesign('Color picker'),
  },
};
