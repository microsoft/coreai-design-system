// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/swatch-picker';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  SwatchPickerComparison,
  swatchGradient,
  swatchImage,
  swatchPickerConsumerExample,
  swatchPickerExamples,
  type SwatchPickerExample,
} from '../../../apps/storybook/src/stories/experiments/SwatchPickerComparison.js';
import { SwatchPickerComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/SwatchPickerComparisonReport.js';
import {
  SwatchPickerDynamicFlow,
  SwatchPickerFormFlow,
  SwatchPickerGridBoundaryFlow,
  SwatchPickerSelectionFlow,
  swatchBlueValue,
  swatchImageValue,
  swatchRedValue,
} from '../../../apps/storybook/src/stories/experiments/SwatchPickerFlows.js';
import {
  captureSwatchPickerNativeContract,
  captureSwatchPickerStyles,
  compareSwatchPickerStyles,
  getComparisonSwatchPicker,
  getFixtureSwatch,
  requireSwatchPickerHTML,
  settleSwatchPickerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareSwatchPickerStyles.js';
import {
  SwatchPicker,
  swatchPickerClassNames,
  useSwatchPickerContextValue,
  useSwatchPickerContextValues,
  type SwatchPickerOnSelectEventHandler,
  type SwatchPickerProps,
  type SwatchPickerSlots,
} from './SwatchPicker.js';
import {
  SwatchPickerRow,
  swatchPickerRowClassNames,
  type SwatchPickerRowSlots,
} from './SwatchPickerRow.js';
import { ColorSwatch, colorSwatchClassNames, type ColorSwatchSlots } from './ColorSwatch.js';
import { ImageSwatch, imageSwatchClassNames, type ImageSwatchSlots } from './ImageSwatch.js';
import { EmptySwatch, emptySwatchClassNames, type EmptySwatchSlots } from './EmptySwatch.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(locator: { element(): Element }): HTMLElement {
  return requireSwatchPickerHTML(locator.element());
}

function exampleNamed(name: string): SwatchPickerExample {
  const example = swatchPickerExamples.find((candidate) => candidate.name === name);
  if (!example) throw new Error(`Missing SwatchPicker fixture ${name}`);
  return example;
}

async function renderPair(
  example: SwatchPickerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <FocusgroupConsumer>
        <SwatchPickerComparison example={example} />
      </FocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonSwatchPicker(screen.container, 'legacy');
  const headless = getComparisonSwatchPicker(screen.container, 'headless');
  await settleSwatchPickerStyles(legacy, headless);
  return {
    screen,
    legacy,
    headless,
    differences: () =>
      compareSwatchPickerStyles(
        captureSwatchPickerStyles(legacy),
        captureSwatchPickerStyles(headless),
        example.consumer,
      ),
  };
}

function renderFlow(children: React.ReactNode, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <CoreAIFluentProvider theme={coreaiLightTheme} dir={dir}>
      {children}
    </CoreAIFluentProvider>,
  );
}

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of swatchPickerExamples) {
    test(`${themeName}: ${example.name} preserves picker/row/color/image/empty/icon styles and geometry`, async () => {
      const pair = await renderPair(example, theme);
      expect(pair.differences()).toEqual([]);
    });
  }
}

for (const name of ['Default', 'Compact grid', 'Content and icons', 'Child visual overrides']) {
  test(`RTL: ${name} retains row/grid offsets and swatch geometry`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, true, 'rtl');
    expect(pair.differences()).toEqual([]);
  });
}

for (const name of [
  'Default',
  'Circular',
  'Child visual overrides',
  'Explicit undefined visual props',
]) {
  test(`${name}: disabling CoreAI defaults preserves the installed fallback and explicit visual choices`, async () => {
    const pair = await renderPair(exampleNamed(name), coreaiLightTheme, false);
    expect(pair.differences()).toEqual([]);
    if (name === 'Default') {
      expect(getComputedStyle(getFixtureSwatch(pair.headless, 'red')).borderRadius).toBe('0px');
    }
  });
}

for (const name of [
  'Default',
  'Extra small',
  'Small',
  'Selected disabled',
  'Small selected disabled',
]) {
  test(`${name}: hover preserves selected, unselected, image and disabled priorities`, async () => {
    const pair = await renderPair(exampleNamed(name));
    for (const part of ['red', 'blue', 'gradient', 'image', 'disabled', 'empty']) {
      const capture = async (picker: HTMLElement) => {
        const swatch = getFixtureSwatch(picker, part);
        await userEvent.hover(swatch);
        expect(swatch.matches(':hover')).toBe(true);
        await settleSwatchPickerStyles(picker);
        return captureSwatchPickerStyles(picker);
      };
      expect(
        compareSwatchPickerStyles(await capture(pair.legacy), await capture(pair.headless)),
      ).toEqual([]);
    }
  });
}

for (const name of ['Default', 'Small', 'Image selected']) {
  test(`${name}: keyboard focus and combined hover/focus retain visible focus rings`, async () => {
    const pair = await renderPair(exampleNamed(name));
    await userEvent.keyboard('{Tab}');
    for (const part of ['red', 'blue', 'image', 'empty']) {
      for (const hovered of [false, true]) {
        const capture = async (picker: HTMLElement) => {
          await userEvent.hover(pair.screen.getByText('Current CoreAI / Griffel', { exact: true }));
          const swatch = getFixtureSwatch(picker, part);
          swatch.focus();
          if (hovered) await userEvent.hover(swatch);
          expect(swatch.matches(':hover')).toBe(hovered);
          expect(swatch.matches(':focus-visible')).toBe(true);
          await settleSwatchPickerStyles(picker);
          return captureSwatchPickerStyles(picker);
        };
        expect(
          compareSwatchPickerStyles(await capture(pair.legacy), await capture(pair.headless)),
        ).toEqual([]);
      }
    }
  });
}

test('ordinary consumer CSS wins without hiding unrelated style differences', async () => {
  const pair = await renderPair(swatchPickerConsumerExample);
  const differences = pair.differences();
  expect(differences.length).toBeGreaterThan(0);
  expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  expect(getComputedStyle(pair.headless).gap).toBe('9px');
  expect(getComputedStyle(pair.headless).paddingTop).toBe('6px');
  expect(getComputedStyle(getFixtureSwatch(pair.headless, 'red')).width).toBe('36px');
  expect(getComputedStyle(getFixtureSwatch(pair.headless, 'red')).borderRadius).toBe('3px');
  const icon = pair.headless.querySelector('[data-swatch-slot="icon"]');
  if (!icon) throw new Error('Missing consumer icon');
  expect(getComputedStyle(icon).fontSize).toBe('14px');
});

test('a visual style change remains unexpected rather than being excluded by a property group', async () => {
  const pair = await renderPair(exampleNamed('Default'));
  getFixtureSwatch(pair.headless, 'blue').style.borderColor = 'rgb(1, 2, 3)';
  expect(pair.differences()).toContainEqual({
    property: 'swatch.blue.border-top-color',
    legacy: 'rgba(0, 0, 0, 0)',
    headless: 'rgb(1, 2, 3)',
    kind: 'unexpected',
  });
});

test('public component types retain restored visual props and current ref contracts', () => {
  expectTypeOf<typeof SwatchPicker>().toEqualTypeOf<ForwardRefComponent<SwatchPickerProps>>();
  expectTypeOf<React.ComponentProps<typeof SwatchPicker>['size']>().toEqualTypeOf<
    'extra-small' | 'small' | 'medium' | 'large' | undefined
  >();
  expectTypeOf<React.ComponentProps<typeof ImageSwatch>['shape']>().toEqualTypeOf<
    'rounded' | 'square' | 'circular' | undefined
  >();
  expect(useSwatchPickerContextValues).toBe(primitive.useSwatchPickerContextValues);
  expect(useSwatchPickerContextValue).toBe(primitive.useSwatchPickerContextValue);
});

function ContextProbe() {
  const size = useSwatchPickerContextValue((context) => context.size);
  const shape = useSwatchPickerContextValue((context) => context.shape);
  const spacing = useSwatchPickerContextValue((context) => context.spacing);
  const selected = useSwatchPickerContextValue((context) => context.selectedValue);
  return (
    <output
      aria-label="Swatch context"
      data-size={size}
      data-shape={shape}
      data-spacing={spacing}
      data-selected={selected}
    />
  );
}

test('the public context receives resolved visual defaults and current controlled selection', async () => {
  const screen = await renderFlow(
    <SwatchPicker size="large" spacing="small" selectedValue="identity / 01">
      <ContextProbe />
      <ColorSwatch color="#fff" value="identity / 01" aria-label="White" />
    </SwatchPicker>,
  );
  await expect
    .element(screen.getByLabelText('Swatch context'))
    .toHaveAttribute('data-size', 'large');
  await expect
    .element(screen.getByLabelText('Swatch context'))
    .toHaveAttribute('data-shape', 'rounded');
  await expect
    .element(screen.getByLabelText('Swatch context'))
    .toHaveAttribute('data-spacing', 'small');
  await expect
    .element(screen.getByLabelText('Swatch context'))
    .toHaveAttribute('data-selected', 'identity / 01');
  const picker = screen.container.querySelector('.fui-SwatchPicker');
  expect(picker?.hasAttribute('size')).toBe(false);
  expect(picker?.hasAttribute('shape')).toBe(false);
  expect(picker?.hasAttribute('spacing')).toBe(false);
});

for (const [name, Picker, Color, Image] of [
  ['raw current', primitive.SwatchPicker, primitive.ColorSwatch, primitive.ImageSwatch],
  ['styled', SwatchPicker, ColorSwatch, ImageSwatch],
] as const) {
  test(`${name}: pointer and keyboard activation preserve exact values, color/image payloads and event identity`, async () => {
    const currentTargets: HTMLButtonElement[] = [];
    const selection = vi.fn<SwatchPickerOnSelectEventHandler>((event) => {
      const currentTarget = event.currentTarget;
      if (!(currentTarget instanceof HTMLButtonElement)) {
        throw new Error('Expected the selection callback on its native swatch button');
      }
      currentTargets.push(currentTarget);
    });
    const onClick = vi.fn<React.MouseEventHandler<HTMLButtonElement>>();
    const screen = await renderFlow(
      <FocusgroupConsumer>
        <Picker
          aria-label="Exact palette"
          defaultSelectedValue={swatchRedValue}
          onSelectionChange={selection}
        >
          <Color color="#d13438" value={swatchRedValue} aria-label="Exact red" />
          <Color
            color={swatchGradient}
            value="gradient / unchanged"
            aria-label="Exact gradient"
            onClick={onClick}
          />
          <Image src={swatchImage} value={swatchImageValue} aria-label="Exact image" />
        </Picker>
      </FocusgroupConsumer>,
    );
    const gradient = screen.getByRole('radio', { name: 'Exact gradient', exact: true });
    await userEvent.click(gradient);
    expect(selection).toHaveBeenCalledTimes(1);
    const [event, data] = selection.mock.calls[0];
    expect(data.selectedValue).toBe('gradient / unchanged');
    expect(data.selectedSwatch).toBe(swatchGradient);
    expect(data.type).toBe('click');
    expect(data.event).toBe(event);
    expect(event).toBe(onClick.mock.calls[0][0]);
    expect(event.type).toBe('click');
    expect(currentTargets[0]).toBe(gradient.element());
    await expect.element(gradient).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard(' ');
    expect(selection).toHaveBeenCalledTimes(2);
    const image = screen.getByRole('radio', { name: 'Exact image', exact: true });
    html(image).focus();
    await userEvent.keyboard('{Enter}');
    expect(selection).toHaveBeenCalledTimes(3);
    expect(selection.mock.calls[2][1].selectedValue).toBe(swatchImageValue);
    expect(selection.mock.calls[2][1].selectedSwatch).toBe(swatchImage);
    await expect.element(image).toHaveAttribute('aria-checked', 'true');
  });

  test(`${name}: disabled color and image buttons block native activation without disabling the whole group`, async () => {
    const selection = vi.fn<SwatchPickerOnSelectEventHandler>();
    const screen = await renderFlow(
      <Picker aria-label="Disabled palette" onSelectionChange={selection}>
        <Color disabled color="#777" value="disabled color" aria-label="Disabled color" />
        <Image disabled src={swatchImage} value="disabled image" aria-label="Disabled image" />
        <Color color="#fff" value="enabled" aria-label="Enabled color" />
      </Picker>,
    );
    for (const label of ['Disabled color', 'Disabled image']) {
      const item = screen.getByRole('radio', { name: label, exact: true });
      await expect.element(item).toBeDisabled();
      await userEvent.click(item, { force: true });
    }
    expect(selection).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('radio', { name: 'Enabled color', exact: true }));
    expect(selection.mock.calls[0][1].selectedValue).toBe('enabled');
  });

  test(`${name}: native buttons contribute no selection field and form reset does not invent a second value model`, async () => {
    const screen = await renderFlow(
      <form aria-label="Native palette form">
        <Picker aria-label="Native palette" defaultSelectedValue={swatchRedValue}>
          <Color name="paint" color="#d13438" value={swatchRedValue} aria-label="Native red" />
          <Color name="paint" color="#0078d4" value={swatchBlueValue} aria-label="Native blue" />
        </Picker>
        <button type="reset">Native reset</button>
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Native palette form' }).element();
    if (!(form instanceof HTMLFormElement)) throw new Error('Missing native palette form');
    expect([...new FormData(form)]).toEqual([]);
    await userEvent.click(screen.getByRole('radio', { name: 'Native blue', exact: true }));
    expect([...new FormData(form)]).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Native reset', exact: true }));
    await expect
      .element(screen.getByRole('radio', { name: 'Native blue', exact: true }))
      .toHaveAttribute('aria-checked', 'true');
  });

  test(`${name}: caller preventDefault retains current selection-request ordering`, async () => {
    const selection = vi.fn<SwatchPickerOnSelectEventHandler>();
    const screen = await renderFlow(
      <Picker aria-label="Cancellation palette" onSelectionChange={selection}>
        <Color
          color="#fff"
          value="white"
          aria-label="Prevented white"
          onClick={(event) => event.preventDefault()}
        />
      </Picker>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Prevented white', exact: true }));
    expect(selection).toHaveBeenCalledTimes(1);
    expect(selection.mock.calls[0][0].defaultPrevented).toBe(true);
    await expect
      .element(screen.getByRole('radio', { name: 'Prevented white', exact: true }))
      .toHaveAttribute('aria-checked', 'true');
  });
}

for (const layout of ['row', 'grid'] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`${layout}/${dir}: supported native navigation preserves selection until activation and controlled state can reject`, async () => {
      const screen = await renderFlow(
        <SwatchPickerSelectionFlow
          layout={layout}
          focusMode={layout === 'grid' ? 'tab' : 'arrow'}
        />,
        dir,
      );
      await userEvent.hover(screen.getByTestId('swatch-flow-pointer-rest'));
      const role = layout === 'grid' ? 'gridcell' : 'radio';
      const attribute = layout === 'grid' ? 'aria-selected' : 'aria-checked';
      const red = screen.getByRole(role, { name: 'Red paint', exact: true });
      const destination = screen.getByRole(role, {
        name: layout === 'grid' ? 'Mountain texture' : 'Blue paint',
        exact: true,
      });
      html(red).focus();
      if (layout === 'grid') {
        await userEvent.keyboard('{Tab}{Tab}');
      } else {
        await userEvent.keyboard(dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}');
      }
      await expect.element(destination).toHaveFocus();
      await expect.element(red).toHaveAttribute(attribute, 'true');
      const events = screen.getByLabelText('Swatch selection events');
      await expect.element(events).toHaveAttribute('data-swatch-change-count', '0');
      await userEvent.keyboard(' ');
      await expect.element(destination).toHaveAttribute(attribute, 'true');
      await expect.element(events).toHaveAttribute('data-swatch-change-count', '1');
      await expect.element(events).toHaveAttribute('data-swatch-same-event', 'true');
      const reject = screen.getByRole('checkbox', {
        name: 'Reject selection changes',
        exact: true,
      });
      await userEvent.click(reject);
      await userEvent.click(red);
      await expect.element(destination).toHaveAttribute(attribute, 'true');
      await expect.element(events).toHaveAttribute('data-swatch-change-count', '2');
      await expect.element(events).toHaveAttribute('data-swatch-change-value', swatchRedValue);
      html(destination).focus();
      if (layout === 'grid') {
        await userEvent.keyboard('{Tab}');
        await expect
          .element(screen.getByRole('gridcell', { name: 'Green paint', exact: true }))
          .toHaveFocus();
      }
      await userEvent.keyboard('{Tab}');
      await expect
        .element(screen.getByRole('button', { name: 'After swatches', exact: true }))
        .toHaveFocus();
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      await expect
        .element(
          layout === 'grid'
            ? screen.getByRole('gridcell', { name: 'Green paint', exact: true })
            : destination,
        )
        .toHaveFocus();
    });
  }
}

for (const implementation of ['raw', 'headless'] as const) {
  test(`${implementation}: current grid/manual arrow tokens share the upstream boundary while native Tab/activation remain usable`, async () => {
    const screen = await renderFlow(
      <SwatchPickerGridBoundaryFlow implementation={implementation} />,
    );
    const first = screen.getByRole('gridcell', {
      name: `${implementation} arrow A`,
      exact: true,
    });
    html(first).focus();
    for (const key of ['{ArrowDown}', '{ArrowRight}']) {
      await userEvent.keyboard(key);
      await expect.element(first).toHaveFocus();
    }
    const events = screen.getByLabelText(`${implementation} arrow-grid events`);
    await expect.element(events).toHaveAttribute('data-swatch-change-count', '0');
    await userEvent.keyboard('{Tab}');
    const second = screen.getByRole('gridcell', {
      name: `${implementation} arrow B`,
      exact: true,
    });
    await expect.element(second).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect.element(second).toHaveAttribute('aria-selected', 'true');
    await expect.element(events).toHaveAttribute('data-swatch-change-count', '1');
    await expect.element(events).toHaveAttribute('data-swatch-selected', 'B');
  });
}

test('focusMode tab keeps every enabled swatch in native tab order and skips disabled items', async () => {
  const screen = await renderFlow(<SwatchPickerSelectionFlow focusMode="tab" />);
  html(screen.getByRole('button', { name: 'Before swatches', exact: true })).focus();
  for (const label of ['Red paint', 'Blue paint', 'Mountain texture', 'Green paint']) {
    await userEvent.keyboard('{Tab}');
    await expect.element(screen.getByRole('radio', { name: label, exact: true })).toHaveFocus();
  }
  await userEvent.keyboard('{Tab}');
  await expect
    .element(screen.getByRole('button', { name: 'After swatches', exact: true }))
    .toHaveFocus();
  const picker = screen.getByRole('radiogroup', { name: 'Document palette', exact: true });
  expect(picker.element().hasAttribute('focusgroup')).toBe(false);
  await expect
    .element(screen.getByLabelText('Swatch selection events'))
    .toHaveAttribute('data-swatch-change-count', '0');
});

test('EmptySwatch actions add/remove consumer-owned swatches and restore current focus without selection callbacks', async () => {
  const screen = await renderFlow(<SwatchPickerDynamicFlow />);
  await userEvent.click(screen.getByRole('radio', { name: 'Add purple', exact: true }));
  await expect
    .element(screen.getByRole('radio', { name: 'Added purple', exact: true }))
    .toHaveFocus();
  const events = screen.getByLabelText('Editable palette events');
  await expect.element(events).toHaveAttribute('data-swatch-selected', 'custom:purple / 01');
  await expect.element(events).toHaveAttribute('data-swatch-action-count', '1');
  await expect.element(events).toHaveAttribute('data-swatch-change-count', '0');
  await userEvent.click(screen.getByRole('radio', { name: 'Saved red', exact: true }));
  await expect.element(events).toHaveAttribute('data-swatch-change-count', '1');
  await userEvent.click(screen.getByRole('button', { name: 'Remove custom color', exact: true }));
  await expect.element(screen.getByRole('radio', { name: 'Saved red', exact: true })).toHaveFocus();
  await expect.element(events).toHaveAttribute('data-swatch-selected', swatchRedValue);
  await expect.element(events).toHaveAttribute('data-swatch-action-count', '2');
  await expect
    .element(screen.getByRole('radio', { name: 'Added purple', exact: true }))
    .not.toBeInTheDocument();
});

test('native form submitters, labeling and application-owned hidden selection/reset remain usable', async () => {
  const screen = await renderFlow(<SwatchPickerFormFlow />);
  await expect
    .element(screen.getByRole('radiogroup', { name: 'Publication palette', exact: true }))
    .toBeVisible();
  await userEvent.click(screen.getByRole('radio', { name: 'Publication blue', exact: true }));
  const events = screen.getByLabelText('Palette form events');
  await expect.element(events).toHaveAttribute('data-swatch-submit-count', '0');
  await userEvent.click(screen.getByRole('radio', { name: 'Reserve color slot', exact: true }));
  await expect.element(events).toHaveAttribute(
    'data-swatch-form-data',
    JSON.stringify([
      ['paint', swatchBlueValue],
      ['action', 'reserve-slot'],
    ]),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Reset palette', exact: true }));
  await expect.element(events).toHaveAttribute('data-swatch-reset-count', '1');
  await expect
    .element(screen.getByRole('radio', { name: 'Publication red', exact: true }))
    .toHaveAttribute('aria-checked', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Publish palette', exact: true }));
  await expect.element(events).toHaveAttribute(
    'data-swatch-form-data',
    JSON.stringify([
      ['paint', swatchRedValue],
      ['action', 'publish'],
    ]),
  );
});

test('public root/icon/disabledIcon render functions preserve native elements, caller classes and refs', async () => {
  const pickerRef = React.createRef<HTMLDivElement>();
  const rowRef = React.createRef<HTMLDivElement>();
  const colorRef = React.createRef<HTMLButtonElement>();
  const imageRef = React.createRef<HTMLButtonElement>();
  const emptyRef = React.createRef<HTMLButtonElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const disabledIconRef = React.createRef<HTMLSpanElement>();
  const pickerRender: SlotRenderFunction<ExtractSlotProps<SwatchPickerSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-swatch-render="picker" />;
  const rowRender: SlotRenderFunction<ExtractSlotProps<SwatchPickerRowSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-swatch-render="row" />;
  const colorRender: SlotRenderFunction<ExtractSlotProps<ColorSwatchSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-swatch-render="color" />;
  const imageRender: SlotRenderFunction<ExtractSlotProps<ImageSwatchSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-swatch-render="image" />;
  const emptyRender: SlotRenderFunction<ExtractSlotProps<EmptySwatchSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-swatch-render="empty" />;
  const iconRender: SlotRenderFunction<ExtractSlotProps<ColorSwatchSlots['icon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-swatch-render="icon">
      +
    </Component>
  );
  const disabledIconRender: SlotRenderFunction<
    ExtractSlotProps<ColorSwatchSlots['disabledIcon']>
  > = (Component, props) => (
    <Component {...props} data-swatch-render="disabled-icon">
      {props.children}
    </Component>
  );
  await renderFlow(
    <>
      <SwatchPicker ref={pickerRef} aria-label="Rendered picker" className="caller-picker">
        {pickerRender}
      </SwatchPicker>
      <SwatchPicker aria-label="Rendered grid" layout="grid">
        <SwatchPickerRow ref={rowRef} className="caller-row">
          {rowRender}
        </SwatchPickerRow>
        <SwatchPickerRow>
          <ColorSwatch
            ref={colorRef}
            as="button"
            color="#fff"
            value="white"
            aria-label="Rendered white"
            disabled
            className="caller-color"
            icon={{ as: 'span', ref: iconRef, className: 'caller-icon', children: iconRender }}
            disabledIcon={{
              as: 'span',
              ref: disabledIconRef,
              className: 'caller-disabled-icon',
              children: disabledIconRender,
            }}
          >
            {colorRender}
          </ColorSwatch>
          <ImageSwatch
            ref={imageRef}
            as="button"
            src={swatchImage}
            value="image"
            aria-label="Rendered image"
            className="caller-image"
          >
            {imageRender}
          </ImageSwatch>
          <EmptySwatch
            ref={emptyRef}
            as="button"
            aria-label="Rendered empty"
            className="caller-empty"
          >
            {emptyRender}
          </EmptySwatch>
        </SwatchPickerRow>
      </SwatchPicker>
    </>,
  );
  for (const [element, marker, caller, tag] of [
    [pickerRef.current, swatchPickerClassNames.root, 'caller-picker', 'DIV'],
    [rowRef.current, swatchPickerRowClassNames.root, 'caller-row', 'DIV'],
    [colorRef.current, colorSwatchClassNames.root, 'caller-color', 'BUTTON'],
    [imageRef.current, imageSwatchClassNames.root, 'caller-image', 'BUTTON'],
    [emptyRef.current, emptySwatchClassNames.root, 'caller-empty', 'BUTTON'],
    [iconRef.current, colorSwatchClassNames.icon, 'caller-icon', 'SPAN'],
    [disabledIconRef.current, colorSwatchClassNames.disabledIcon, 'caller-disabled-icon', 'SPAN'],
  ] as const) {
    expect(element).not.toBeNull();
    expect(element?.tagName).toBe(tag);
    expect(element?.classList.contains(marker)).toBe(true);
    expect(element?.classList.contains(caller)).toBe(true);
  }
  expect(pickerRef.current?.dataset.swatchRender).toBe('picker');
  expect(rowRef.current?.dataset.swatchRender).toBe('row');
  expect(colorRef.current?.dataset.swatchRender).toBe('color');
  expect(imageRef.current?.dataset.swatchRender).toBe('image');
  expect(emptyRef.current?.dataset.swatchRender).toBe('empty');
  expect(iconRef.current?.dataset.swatchRender).toBe('icon');
  expect(disabledIconRef.current?.dataset.swatchRender).toBe('disabled-icon');
  expect(disabledIconRef.current?.querySelector('svg')).not.toBeNull();
  expect(colorRef.current?.getAttribute('type')).toBe('button');
  expect(colorRef.current?.getAttribute('aria-selected')).toBe('false');
});

test('null disabledIcon suppresses the owned glyph while ordinary icon content remains intact', async () => {
  const screen = await renderFlow(
    <ColorSwatch
      color="#fff"
      value="white"
      disabled
      aria-label="No prohibited glyph"
      disabledIcon={null}
      icon={<span>Kept icon</span>}
    />,
  );
  await expect.element(screen.getByText('Kept icon', { exact: true })).toBeVisible();
  expect(screen.container.querySelector('.fui-ColorSwatch__disabledIcon')).toBeNull();
  expect(screen.container.querySelector('.fui-ColorSwatch__icon')).not.toBeNull();
});

test('comparison reports publish current fixture readiness, counts and stable final geometry', async () => {
  const screen = await renderFlow(<SwatchPickerComparisonWithReport />);
  await userEvent.hover(screen.getByTestId('swatch-report-pointer-rest'));
  const report = screen.getByRole('status', { name: 'SwatchPicker style report', exact: true });
  await expect.element(report).toHaveAttribute('data-swatch-report-state', 'ready');
  await settleSwatchPickerStyles();
  screen
    .getByLabelText('SwatchPicker visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleSwatchPickerStyles();
  await expect.element(report).toHaveAttribute('data-swatch-report-state', 'ready');
  for (const name of ['Default', 'Grid', 'Explicit undefined visual props']) {
    await userEvent.selectOptions(screen.getByLabelText('SwatchPicker visual fixture'), name);
    await expect.element(report).toHaveAttribute('data-swatch-report-state', 'ready');
    await expect.element(report).toHaveAttribute('data-swatch-report-example', name);
    await expect.element(report).toHaveAttribute('data-swatch-unexpected-count', '0');
    await expect.element(report).toHaveAttribute('data-swatch-count', '6');
    await expect
      .element(report)
      .toHaveAttribute('data-swatch-row-count', name === 'Grid' ? '2' : '0');
    const picker = getComparisonSwatchPicker(screen.container, 'headless');
    const rect = picker.getBoundingClientRect();
    expect(rect.width).toBe(Number(report.element().getAttribute('data-swatch-width')));
    expect(rect.height).toBe(Number(report.element().getAttribute('data-swatch-height')));
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
    expect(captureSwatchPickerNativeContract(picker).focusgroup).toContain(
      name === 'Grid' ? 'grid' : 'radiogroup',
    );
  }
});
