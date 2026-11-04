// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  ImageComparison,
  imageAlternateSrc,
  imageBrokenSrc,
  imageConsumerExample,
  imageExamples,
  imageFixtureSrc,
  type ImageExample,
} from '../../../apps/storybook/src/stories/experiments/ImageComparison.js';
import {
  captureImageStyles,
  compareImageStyles,
  getComparisonImage,
  settleImage,
} from '../../../apps/storybook/src/stories/experiments/compareImageStyles.js';
import { Image, imageClassNames, type ImageProps } from './Image.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: ImageExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<ImageComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonImage(screen.container, 'legacy');
  const headless = getComparisonImage(screen.container, 'headless');
  await Promise.all([settleImage(legacy), settleImage(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(imageExamples)(
    `matches loaded $name styles and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareImageStyles(captureImageStyles(legacy), captureImageStyles(headless))).toEqual(
        [],
      );
    },
  );

  test(`lets ordinary consumer CSS override combined visual states in ${mode} mode`, async () => {
    const { headless } = await renderPair(imageConsumerExample, theme);
    const styles = captureImageStyles(headless);
    expect(styles['root.width']).toBe('96.00');
    expect(styles['root.height']).toBe('64.00');
    expect(styles['root.border-radius']).toBe('3px');
    expect(styles['root.border-top-width']).toBe('2px');
    expect(styles['root.object-fit']).toBe('contain');
    expect(styles['root.object-position']).toBe('0% 0%');
    expect(styles['root.box-shadow']).toBe('none');
  });
}

test.each([
  { fit: 'default', objectFit: 'fill', objectPosition: '50% 50%', width: 120, height: 80 },
  { fit: 'center', objectFit: 'none', objectPosition: '50% 50%', width: 240, height: 180 },
  { fit: 'contain', objectFit: 'contain', objectPosition: '50% 50%', width: 240, height: 180 },
  { fit: 'cover', objectFit: 'cover', objectPosition: '50% 50%', width: 240, height: 180 },
  { fit: 'none', objectFit: 'none', objectPosition: '0% 0%', width: 240, height: 180 },
] as const)(
  'maps $fit to its distinct object-fit, position, and implicit sizing',
  async ({ fit, objectFit, objectPosition, width, height }) => {
    const { headless } = await renderPair({ name: fit, props: { fit } });
    const styles = getComputedStyle(headless);
    expect(styles.objectFit).toBe(objectFit);
    expect(styles.objectPosition).toBe(objectPosition);
    expect(headless.getBoundingClientRect().width).toBe(width);
    expect(headless.getBoundingClientRect().height).toBe(height);
    expect(headless.hasAttribute('data-fit-fill')).toBe(fit !== 'default');
    expect(headless).not.toHaveAttribute('width');
    expect(headless).not.toHaveAttribute('height');
    expect(headless.naturalWidth).toBe(120);
    expect(headless.naturalHeight).toBe(80);
  },
);

test.each([
  { name: 'width only', props: { fit: 'cover', width: 90 }, width: 90, height: 60, fill: false },
  {
    name: 'height only',
    props: { fit: 'contain', height: 72 },
    width: 108,
    height: 72,
    fill: false,
  },
  {
    name: 'string dimensions',
    props: { fit: 'none', width: '90', height: '60' },
    width: 90,
    height: 60,
    fill: false,
  },
  { name: 'zero width', props: { fit: 'center', width: 0 }, width: 0, height: 0, fill: false },
  {
    name: 'inline sizing',
    props: { fit: 'cover', style: { width: '90px', height: '60px' } },
    width: 90,
    height: 60,
    fill: true,
  },
  {
    name: 'block with explicit dimensions',
    props: { block: true, width: 90, height: 60 },
    width: 240,
    height: 60,
    fill: false,
  },
  {
    name: 'block with fit',
    props: { block: true, fit: 'contain' },
    width: 240,
    height: 180,
    fill: true,
  },
] as const)(
  'preserves the original sizing selection for $name',
  async ({ name, props, width, height, fill }) => {
    const { headless } = await renderPair({ name, props });
    expect(headless.getBoundingClientRect().width).toBe(width);
    expect(headless.getBoundingClientRect().height).toBe(height);
    expect(headless.hasAttribute('data-fit-fill')).toBe(fill);
    expect(getComputedStyle(headless).display).toBe('inline-block');
    if ('width' in props) expect(headless).toHaveAttribute('width', String(props.width));
    if ('height' in props) expect(headless).toHaveAttribute('height', String(props.height));
  },
);

for (const defaults of [true, false]) {
  test.each([
    { name: 'omitted', props: {}, fit: 'default', shape: 'square' },
    {
      name: 'explicit undefined',
      props: {
        block: undefined,
        bordered: undefined,
        fit: undefined,
        shadow: undefined,
        shape: undefined,
      },
      fit: 'default',
      shape: 'square',
    },
    {
      name: 'explicit visual choices',
      props: {
        fit: 'contain',
        shape: 'rounded',
        bordered: true,
        shadow: true,
        width: 80,
        height: 80,
      },
      fit: 'contain',
      shape: 'rounded',
    },
  ] as const)(
    `keeps Fluent Image defaults for $name with CoreAI defaults ${defaults ? 'enabled' : 'disabled'}`,
    async ({ name, props, fit, shape }) => {
      const { legacy, headless } = await renderPair({ name, props }, coreaiLightTheme, defaults);
      expect(headless).toHaveAttribute('data-fit', fit);
      expect(headless).toHaveAttribute('data-shape', shape);
      expect(compareImageStyles(captureImageStyles(legacy), captureImageStyles(headless))).toEqual(
        [],
      );
    },
  );
}

test.each(['ltr', 'rtl'] as const)(
  'preserves the direction-sensitive none fit position in %s',
  async (dir) => {
    const { legacy, headless } = await renderPair(
      { name: 'Direction-sensitive crop', props: { fit: 'none' } },
      coreaiLightTheme,
      true,
      dir,
    );
    expect(compareImageStyles(captureImageStyles(legacy), captureImageStyles(headless))).toEqual(
      [],
    );
    expect(getComputedStyle(headless).objectPosition).toBe(dir === 'rtl' ? '100% 0%' : '0% 0%');
    expect(getComputedStyle(headless).direction).toBe(dir);
  },
);

test('preserves the owned native img, refs, consumer classes, attributes, and events', async () => {
  const ref = React.createRef<HTMLImageElement>();
  const onLoad = vi.fn<React.ReactEventHandler<HTMLImageElement>>();
  const onError = vi.fn<React.ReactEventHandler<HTMLImageElement>>();
  const onClick = vi.fn();
  const onFocus = vi.fn();
  const screen = await renderCoreAIComponent(
    <div data-testid="image-owner">
      <Image
        as="img"
        ref={ref}
        id="project-illustration"
        alt="Blue circle and orange rectangle"
        src={imageFixtureSrc}
        className="consumer-image"
        style={{ borderRadius: '9px' }}
        width={90}
        height={60}
        block
        bordered
        fit="cover"
        shape="circular"
        shadow
        decoding="async"
        loading="eager"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        draggable={false}
        tabIndex={0}
        data-state="consumer-ready"
        onLoad={onLoad}
        onError={onError}
        onClick={onClick}
        onFocus={onFocus}
      />
    </div>,
  );
  const image = screen.getByRole('img', { name: 'Blue circle and orange rectangle' }).element();
  expect(image).toBeInstanceOf(HTMLImageElement);
  await settleImage(ref.current!);
  await expect.poll(() => onLoad.mock.calls.length).toBe(1);
  expect(ref.current).toBe(image);
  expect(image).toHaveClass(imageClassNames.root, 'consumer-image');
  expect(image.parentElement).not.toHaveClass(imageClassNames.root);
  expect(image.parentElement!.children).toHaveLength(1);
  expect(image).toHaveAttribute('id', 'project-illustration');
  expect(image).toHaveAttribute('width', '90');
  expect(image).toHaveAttribute('height', '60');
  expect(image).not.toHaveAttribute('decoding');
  expect(image).toHaveAttribute('loading', 'eager');
  expect(image).toHaveAttribute('crossorigin', 'anonymous');
  expect(image).not.toHaveAttribute('referrerpolicy');
  expect(image).toHaveAttribute('draggable', 'false');
  expect(image).toHaveAttribute('data-state', 'consumer-ready');
  expect(image).toHaveAttribute('data-block', '');
  expect(image).toHaveAttribute('data-bordered', '');
  expect(image).toHaveAttribute('data-fit', 'cover');
  expect(image).toHaveAttribute('data-shape', 'circular');
  expect(image).toHaveAttribute('data-shadow', '');
  expect(getComputedStyle(image).borderRadius).toBe('9px');
  for (const prop of ['block', 'bordered', 'fit', 'shape', 'shadow']) {
    expect(image).not.toHaveAttribute(prop);
  }
  expect(onLoad.mock.calls[0][0].target).toBe(image);
  expect(onError).not.toHaveBeenCalled();
  await userEvent.tab();
  await expect.element(image).toHaveFocus();
  await userEvent.click(image);
  expect(onFocus).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
  expect(onClick.mock.calls[0][0].target).toBe(image);
});

test('matches legacy native props and shared dependency-filter omissions', async () => {
  const srcSet = `${imageFixtureSrc} 1x, ${imageAlternateSrc} 2x`;
  const sizes = '(max-width: 480px) 120px, 240px';
  const { legacy, headless } = await renderPair({
    name: 'Responsive illustration',
    props: {
      src: imageFixtureSrc,
      srcSet,
      sizes,
      loading: 'lazy',
      decoding: 'async',
      referrerPolicy: 'no-referrer',
      crossOrigin: 'anonymous',
      width: 120,
      height: 80,
    },
  });

  // Shared Fluent utilities 9.27.0 omits decoding, sizes, and referrerPolicy from its img allowlist.
  for (const attribute of ['decoding', 'sizes', 'referrerpolicy']) {
    expect(legacy.getAttribute(attribute), attribute).toBeNull();
    expect(headless.getAttribute(attribute), attribute).toBe(legacy.getAttribute(attribute));
  }
  for (const image of [legacy, headless]) {
    expect(image).toHaveAttribute('src', imageFixtureSrc);
    expect(image).toHaveAttribute('srcset', srcSet);
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('crossorigin', 'anonymous');
    expect(image).toHaveAttribute('width', '120');
    expect(image).toHaveAttribute('height', '80');
  }
  expect(legacy.decoding).toBe('auto');
  expect(headless.decoding).toBe(legacy.decoding);
  expect(legacy.sizes).toBe('');
  expect(headless.sizes).toBe(legacy.sizes);
  expect(headless).not.toHaveAttribute('data-fit-fill');
});

test('preserves meaningful, empty, and omitted alt semantics without inventing roles', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Image alt="Project illustration" src={imageFixtureSrc} />
      <Image alt="" src={imageFixtureSrc} />
      <Image src={imageFixtureSrc} />
    </>,
  );
  const meaningful = screen.getByRole('img', { name: 'Project illustration' }).element();
  const decorative = screen.getByRole('presentation').element();
  const unlabelled = screen.getByRole('img', { name: '', exact: true }).element();
  expect(meaningful).toHaveAttribute('alt', 'Project illustration');
  expect(decorative).toHaveAttribute('alt', '');
  expect(unlabelled).not.toHaveAttribute('alt');
  for (const image of [meaningful, decorative, unlabelled]) {
    expect(image).not.toHaveAttribute('role');
    expect(image).not.toHaveAttribute('aria-hidden');
    expect(image).not.toHaveAttribute('tabindex');
  }
});

test('forwards native load and error events across source changes without a custom fallback', async () => {
  const ref = React.createRef<HTMLImageElement>();
  const onLoad = vi.fn<React.ReactEventHandler<HTMLImageElement>>();
  const onError = vi.fn<React.ReactEventHandler<HTMLImageElement>>();
  const props = { ref, alt: 'Source lifecycle', onLoad, onError };
  const screen = await renderCoreAIComponent(<Image {...props} src={imageFixtureSrc} />);
  const image = ref.current!;
  await settleImage(image);
  await expect.poll(() => onLoad.mock.calls.length).toBe(1);
  expect(onError).not.toHaveBeenCalled();

  await screen.rerender(<Image {...props} src={imageAlternateSrc} />);
  await settleImage(image);
  await expect.poll(() => onLoad.mock.calls.length).toBe(2);
  expect(ref.current).toBe(image);
  expect(image).toHaveAttribute('src', imageAlternateSrc);

  await screen.rerender(<Image {...props} src={imageBrokenSrc} />);
  await expect(image.decode()).rejects.toThrow();
  await expect.poll(() => onError.mock.calls.length).toBe(1);
  expect(onError.mock.calls[0][0].target).toBe(image);
  expect(image.complete).toBe(true);
  expect(image.naturalWidth).toBe(0);
  expect(image).toHaveAttribute('src', imageBrokenSrc);
  await expect.element(screen.getByRole('img', { name: 'Source lifecycle' })).toBeVisible();

  await screen.rerender(<Image {...props} src={imageFixtureSrc} />);
  await settleImage(image);
  await expect.poll(() => onLoad.mock.calls.length).toBe(3);
  expect(onError).toHaveBeenCalledOnce();
  expect(ref.current).toBe(image);
});

test('clears visual state and restores intrinsic sizing when props are removed', async () => {
  const ref = React.createRef<HTMLImageElement>();
  const screen = await renderCoreAIComponent(
    <Image
      ref={ref}
      alt="Changing presentation"
      src={imageFixtureSrc}
      block
      bordered
      fit="cover"
      shape="circular"
      shadow
    />,
  );
  const image = ref.current!;
  await settleImage(image);
  expect(image).toHaveAttribute('data-fit-fill', '');
  expect(getComputedStyle(image).objectFit).toBe('cover');
  await screen.rerender(<Image ref={ref} alt="Changing presentation" src={imageFixtureSrc} />);
  await settleImage(image);
  for (const prop of ['data-block', 'data-bordered', 'data-fit-fill', 'data-shadow']) {
    expect(image).not.toHaveAttribute(prop);
  }
  expect(image).toHaveAttribute('data-fit', 'default');
  expect(image).toHaveAttribute('data-shape', 'square');
  expect(getComputedStyle(image).objectFit).toBe('fill');
  expect(getComputedStyle(image).borderTopStyle).toBe('none');
  expect(getComputedStyle(image).boxShadow).toBe('none');
  expect(image.getBoundingClientRect().width).toBe(120);
  expect(image.getBoundingClientRect().height).toBe(80);
});

test('exposes an unstyled global marker only on the owned img for consumer selectors', async () => {
  const ref = React.createRef<HTMLImageElement>();
  const screen = await renderCoreAIComponent(
    <div className="image-consumer">
      <style>{`
        .image-consumer .fui-Image { width: 88px; height: 44px; border-radius: 7px; }
      `}</style>
      <Image
        ref={ref}
        alt="Targeted illustration"
        src={imageFixtureSrc}
        shape="circular"
        fit="cover"
      />
      <img alt="Caller-owned illustration" src={imageFixtureSrc} className="caller-image" />
    </div>,
  );
  const image = ref.current!;
  await settleImage(image);
  const caller = screen.getByRole('img', { name: 'Caller-owned illustration' }).element();
  expect(image).toHaveClass(imageClassNames.root);
  expect(caller).toHaveClass('caller-image');
  expect(caller).not.toHaveClass(imageClassNames.root);
  expect(screen.container.querySelectorAll(`.${imageClassNames.root}`)).toHaveLength(1);
  expect(image.getBoundingClientRect().width).toBe(88);
  expect(image.getBoundingClientRect().height).toBe(44);
  expect(getComputedStyle(image).borderRadius).toBe('7px');
});

test('keeps the current shadow prop and native void-element contract in its public type', () => {
  expectTypeOf<ImageProps['shadow']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ImageProps['as']>().toEqualTypeOf<'img' | undefined>();
  expectTypeOf<ImageProps['children']>().toEqualTypeOf<undefined>();
});
