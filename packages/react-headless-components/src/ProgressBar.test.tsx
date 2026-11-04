// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { ProgressBar as PrimitiveProgressBar } from '@fluentui/react-headless-components-preview/progress-bar';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  ProgressBarComparison,
  ProgressBarUpload,
  progressBarColors,
  progressBarConsumerExample,
  progressBarExamples,
  progressBarRangeExamples,
  type ProgressBarExample,
} from '../../../apps/storybook/src/stories/experiments/ProgressBarComparison.js';
import {
  captureProgressBarStyles,
  compareProgressBarStyles,
  getComparisonProgressBar,
  settleProgressBarStyles,
  type ComparisonProgressBar,
} from '../../../apps/storybook/src/stories/experiments/compareProgressBarStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/ProgressBarComparison.module.css';
import {
  ProgressBar,
  progressBarClassNames,
  type ProgressBarProps,
  type ProgressBarSlots,
} from './ProgressBar.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: ProgressBarExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<ProgressBarComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonProgressBar(screen.container, 'legacy');
  const headless = getComparisonProgressBar(screen.container, 'headless');
  await Promise.all([settleProgressBarStyles(legacy), settleProgressBarStyles(headless)]);
  return { screen, legacy, headless };
}

function getNativeProgressBar(root: HTMLDivElement): ComparisonProgressBar {
  const bar = root.querySelector(`:scope > .${progressBarClassNames.bar}`);
  if (!(bar instanceof HTMLDivElement)) throw new Error('Missing ProgressBar bar slot');
  return { root, bar };
}

function expectRange(
  { root, bar }: ComparisonProgressBar,
  value: number | undefined,
  max: number,
  expectedBarWidth?: string,
) {
  expect(root).toHaveAttribute('role', 'progressbar');
  if (value === undefined) {
    expect(root).not.toHaveAttribute('aria-valuemin');
    expect(root).not.toHaveAttribute('aria-valuemax');
    expect(root).not.toHaveAttribute('aria-valuenow');
    expect(bar.style.width).toBe('');
  } else {
    expect(root).toHaveAttribute('aria-valuemin', '0');
    expect(root).toHaveAttribute('aria-valuemax', String(max));
    expect(root).toHaveAttribute('aria-valuenow', String(value));
    expect(bar.style.width).toBe(expectedBarWidth ?? `${(value / max) * 100}%`);
  }
}

test('exposes the current public native-div, slot, and ref contracts', () => {
  expectTypeOf<React.ComponentProps<typeof ProgressBar>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveProgressBar>['ref']
  >();
  expectTypeOf<ProgressBarProps['as']>().toEqualTypeOf<'div' | undefined>();
  expectTypeOf<React.ComponentRef<typeof ProgressBar>>().toEqualTypeOf<HTMLDivElement>();
});

for (const [mode, theme] of themes) {
  test.each(progressBarExamples)(
    `matches $name track/bar styles, animation effects, and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      const values = captureProgressBarStyles(headless);
      expect(compareProgressBarStyles(captureProgressBarStyles(legacy), values)).toEqual([]);
      for (const control of [legacy, headless]) {
        expectRange(control, example.props.value, example.props.max ?? 1, example.expectedBarWidth);
        expect(control.root).toHaveAccessibleName(example.field ? 'Project upload' : example.name);
      }
      expect(headless.root).toHaveClass(progressBarClassNames.root);
      expect(headless.bar).toHaveClass(progressBarClassNames.bar);
      expect(headless.root).toHaveAttribute('data-shape', example.props.shape ?? 'rounded');
      expect(headless.root).toHaveAttribute('data-thickness', example.props.thickness ?? 'medium');
      const fieldColor = example.field?.validationState;
      const color =
        example.props.color ??
        (fieldColor === 'error' || fieldColor === 'warning' || fieldColor === 'success'
          ? fieldColor
          : 'brand');
      expect(headless.root).toHaveAttribute('data-color', color);
      expect(values['root.height']).toBe(example.props.thickness === 'large' ? '4.00' : '2.00');
      expect(values['bar.height']).toBe(values['root.height']);
      if (example.props.value === undefined) {
        expect(headless.root).toHaveAttribute('data-indeterminate', '');
        expect(values['bar.animation-count']).toBe('1');
      } else {
        expect(headless.root).not.toHaveAttribute('data-indeterminate');
        expect(values['bar.animation-count']).toBe('0');
        expect(values['bar.transition-duration']).toBe(example.props.value > 0.01 ? '0.3s' : '0s');
      }
      for (const slot of ['root', 'bar']) {
        for (const pseudo of ['::before', '::after']) {
          expect(values[`${slot}${pseudo}.content`]).toBe('none');
        }
      }
    },
  );

  test(`lets ordinary consumer CSS override the track and bar in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(progressBarConsumerExample, theme);
    const values = captureProgressBarStyles(headless);
    expect(values['root.height']).toBe('10.00');
    expect(values['bar.height']).toBe('10.00');
    expect(values['root.border-top-left-radius']).toBe('1px');
    expect(values['bar.border-top-left-radius']).toBe('0px');
    expect(values['bar.transition-duration']).toBe('0.6s');
    if (!matchMedia('(forced-colors: active)').matches) {
      expect(values['root.background-color']).toBe('rgb(220, 230, 240)');
      expect(values['bar.background-color']).toBe('rgb(20, 80, 120)');
    }
    expect(
      compareProgressBarStyles(captureProgressBarStyles(legacy), values).length,
    ).toBeGreaterThan(0);
    expectRange(headless, 0.6, 1);
  });
}

test.each(progressBarRangeExamples)(
  'preserves headless range resolution for $name rather than normalizing it again',
  async (example) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { legacy, headless } = await renderPair(example);
    expect(
      compareProgressBarStyles(
        captureProgressBarStyles(legacy),
        captureProgressBarStyles(headless),
      ),
    ).toEqual([]);
    for (const control of [legacy, headless]) {
      expectRange(control, example.expectedValue, example.expectedMax);
    }
    if (example.diagnostic) {
      expect(errors.mock.calls.flat().join(' ')).toContain(example.diagnostic);
    } else {
      expect(errors).not.toHaveBeenCalled();
    }
    if (example.expectedValue === undefined) {
      expect(headless.root).toHaveAttribute('data-indeterminate', '');
      expect(headless.root).not.toHaveAttribute('data-nonzero-determinate');
    } else {
      expect(headless.root).not.toHaveAttribute('data-indeterminate');
      expect(headless.root.hasAttribute('data-nonzero-determinate')).toBe(
        example.expectedValue > 0.01,
      );
    }
  },
);

for (const dir of ['ltr', 'rtl'] as const) {
  test.each([0, 0.4, undefined])(
    `matches value=%s geometry, gradients, and physical motion in ${dir}`,
    async (value) => {
      const { legacy, headless } = await renderPair(
        { name: 'Direction', props: { value, thickness: 'large' } },
        coreaiLightTheme,
        true,
        dir,
      );
      const values = captureProgressBarStyles(headless);
      expect(compareProgressBarStyles(captureProgressBarStyles(legacy), values)).toEqual([]);
      expect(values['root.direction']).toBe(dir);
      if (value === undefined) {
        expect(values['bar.background-image']).toContain(dir === 'ltr' ? 'to right' : 'to left');
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        expect(values['bar.max-width']).toBe(reduced ? '100%' : '33%');
        expect(values['bar.animation-0.duration']).toBe('3000');
        expect(values['bar.animation-0.iterations']).toBe('Infinity');
        expect(values['bar.animation-0.easing']).toBe('linear');
        expect(values['bar.animation-0.fill']).toBe('forwards');
        expect(values['bar.animation-0.play-state']).toBe('paused');
        expect(JSON.parse(values['bar.animation-0.keyframes'])).toEqual(
          reduced
            ? [
                { offset: 0, easing: 'linear', opacity: '0.2' },
                { offset: 0.5, easing: 'linear', opacity: '1' },
                { offset: 1, easing: 'linear', opacity: '0.2' },
              ]
            : [
                { offset: 0, easing: 'linear', translate: '-100%' },
                { offset: 1, easing: 'linear', translate: '300%' },
              ],
        );
      } else {
        const rootRect = headless.root.getBoundingClientRect();
        const barRect = headless.bar.getBoundingClientRect();
        expect(Math.abs(barRect.width - rootRect.width * value)).toBeLessThan(0.02);
        expect(
          Math.abs(dir === 'ltr' ? barRect.left - rootRect.left : barRect.right - rootRect.right),
        ).toBeLessThan(0.02);
      }
    },
  );
}

test('uses native RTL on the root for the gradient inside an LTR provider', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  await renderCoreAIComponent(<ProgressBar ref={rootRef} dir="rtl" aria-label="Upload" />, {
    providerProps: { dir: 'ltr' },
  });
  if (!rootRef.current) throw new Error('Missing ProgressBar root');
  const control = getNativeProgressBar(rootRef.current);
  await settleProgressBarStyles(control);
  expect(getComputedStyle(control.root).direction).toBe('rtl');
  expect(getComputedStyle(control.bar).backgroundImage).toContain('to left');
});

test('preserves the source identity curve without hiding non-linear effect or keyframe timing', async () => {
  const { legacy, headless } = await renderPair({ name: 'Source timing', props: {} });
  const getEffect = ({ root, bar }: ComparisonProgressBar): KeyframeEffect => {
    const animation = root.getAnimations({ subtree: true }).find((candidate) => {
      const effect = candidate.effect;
      return (
        effect instanceof KeyframeEffect && effect.target === bar && effect.pseudoElement === null
      );
    });
    if (!(animation?.effect instanceof KeyframeEffect)) {
      throw new Error('Missing ProgressBar animation effect');
    }
    return animation.effect;
  };
  const legacyEffect = getEffect(legacy);
  const headlessEffect = getEffect(headless);
  expect(legacyEffect.getTiming().easing).toBe('cubic-bezier(0, 0, 1, 1)');
  expect(getComputedStyle(headless.bar).animationTimingFunction).toBe('cubic-bezier(0, 0, 1, 1)');
  expect(headlessEffect.getTiming().easing).toBe('linear');
  expect(headlessEffect.getKeyframes()[0].easing).toBe('cubic-bezier(0, 0, 1, 1)');
  const legacyValues = captureProgressBarStyles(legacy);
  expect(compareProgressBarStyles(legacyValues, captureProgressBarStyles(headless))).toEqual([]);

  headlessEffect.updateTiming({ easing: 'ease-in' });
  expect(compareProgressBarStyles(legacyValues, captureProgressBarStyles(headless))).toContainEqual(
    {
      property: 'bar.animation-0.easing',
      legacy: 'linear',
      headless: 'ease-in',
    },
  );

  headlessEffect.updateTiming({ easing: 'linear' });
  headlessEffect.setKeyframes(
    headlessEffect.getKeyframes().map((frame) => ({ ...frame, easing: 'ease-in' })),
  );
  const keyframeDifference = compareProgressBarStyles(
    legacyValues,
    captureProgressBarStyles(headless),
  ).find((difference) => difference.property === 'bar.animation-0.keyframes');
  expect(keyframeDifference?.legacy).toContain('"easing":"linear"');
  expect(keyframeDifference?.headless).toContain('"easing":"ease-in"');
});

test.each([true, false])(
  'adds no CoreAI defaults when withComponentDefaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Undefined visual props',
        props: { value: 0.5, shape: undefined, thickness: undefined, color: undefined },
      },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(
      compareProgressBarStyles(
        captureProgressBarStyles(legacy),
        captureProgressBarStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-shape', 'rounded');
    expect(headless.root).toHaveAttribute('data-thickness', 'medium');
    expect(headless.root).toHaveAttribute('data-color', 'brand');
  },
);

test('preserves Field names and description order alongside caller ARIA', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Field association',
    props: {
      value: 0.5,
      'aria-describedby': 'caller-progress-hint',
      'aria-valuetext': '2 of 4 files',
    },
    field: {
      label: 'Project upload',
      hint: 'Keep this page open.',
      validationState: 'warning',
      validationMessage: 'Upload may take a few minutes.',
    },
  });
  for (const { root } of [legacy, headless]) {
    expect(root).toHaveAccessibleName('Project upload');
    expect(root).toHaveAttribute('aria-valuetext', '2 of 4 files');
    const labelId = root.getAttribute('aria-labelledby');
    expect(labelId && document.getElementById(labelId)?.textContent).toBe('Project upload');
    const descriptions = root.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(descriptions).toHaveLength(3);
    expect(document.getElementById(descriptions[0])?.textContent).toContain(
      'Upload may take a few minutes.',
    );
    expect(document.getElementById(descriptions[1])?.textContent).toBe('Keep this page open.');
    expect(descriptions[2]).toBe('caller-progress-hint');
  }
  expect(headless.root).toHaveAttribute('data-color', 'warning');
});

test('preserves refs, native events, caller ARIA, slots, and classes without leaking visual props', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const barRef = React.createRef<HTMLDivElement>();
  const events: string[] = [];
  const onKeyDown = vi.fn<NonNullable<ProgressBarProps['onKeyDown']>>();
  await renderCoreAIComponent(
    <ProgressBar
      ref={rootRef}
      className="consumer-root"
      title="Project upload"
      tabIndex={0}
      role="status"
      aria-label="Upload progress"
      aria-live="polite"
      aria-valuetext="Three files uploaded"
      data-consumer-root=""
      value={0.6}
      shape="square"
      thickness="large"
      color="warning"
      onClick={() => events.push('root')}
      onKeyDown={onKeyDown}
      bar={{
        ref: barRef,
        className: 'consumer-bar',
        title: 'Filled portion',
        style: { width: '37%' },
        onClick: () => events.push('bar'),
        children: <span className="consumer-child">•</span>,
      }}
    />,
  );
  if (!rootRef.current || !barRef.current) throw new Error('Missing ProgressBar refs');
  const { root, bar } = getNativeProgressBar(rootRef.current);
  expect(bar).toBe(barRef.current);
  expect(root).toHaveClass(progressBarClassNames.root, 'consumer-root');
  expect(bar).toHaveClass(progressBarClassNames.bar, 'consumer-bar');
  expect(root).toHaveAttribute('data-consumer-root', '');
  expect(root).toHaveAttribute('title', 'Project upload');
  expect(bar).toHaveAttribute('title', 'Filled portion');
  expect(root).toHaveAttribute('role', 'status');
  expect(root).toHaveAttribute('aria-live', 'polite');
  expect(root).toHaveAttribute('aria-valuetext', 'Three files uploaded');
  expect(root).toHaveAttribute('aria-valuenow', '0.6');
  expect(bar.style.width).toBe('37%');
  expect(root.querySelector('.consumer-child')).not.toHaveClass(progressBarClassNames.bar);
  for (const prop of ['shape', 'thickness', 'color', 'value', 'max']) {
    expect(root).not.toHaveAttribute(prop);
  }
  await userEvent.click(bar);
  expect(events).toEqual(['bar', 'root']);
  root.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowRight');
  expect(root).toHaveAttribute('aria-valuenow', '0.6');
});

test('passes resolved root and bar props and refs through current slot render functions', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const barRef = React.createRef<HTMLDivElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<ProgressBarSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-root="">
      {props.children}
      <span data-consumer-root-child="" />
    </Component>
  );
  const renderBar: SlotRenderFunction<ExtractSlotProps<ProgressBarSlots['bar']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-bar="">
      <span data-consumer-bar-child="" />
    </Component>
  );
  await renderCoreAIComponent(
    <ProgressBar
      ref={rootRef}
      value={0.75}
      aria-label="Rendered upload"
      className="consumer-root"
      bar={{ ref: barRef, className: 'consumer-bar', children: renderBar }}
    >
      {renderRoot}
    </ProgressBar>,
  );
  if (!rootRef.current || !barRef.current) throw new Error('Missing renderer refs');
  const { root, bar } = getNativeProgressBar(rootRef.current);
  expect(bar).toBe(barRef.current);
  expect(root).toHaveClass(progressBarClassNames.root, 'consumer-root');
  expect(bar).toHaveClass(progressBarClassNames.bar, 'consumer-bar');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(bar).toHaveAttribute('data-rendered-bar', '');
  expectRange({ root, bar }, 0.75, 1);
  expect(root.querySelector('[data-consumer-root-child]')).not.toHaveClass(
    progressBarClassNames.root,
    progressBarClassNames.bar,
  );
  expect(bar.querySelector('[data-consumer-bar-child]')).not.toHaveClass(
    progressBarClassNames.root,
    progressBarClassNames.bar,
  );
});

test('updates max and value without stale widths, ARIA, animation, or reset transitions', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <ProgressBar ref={rootRef} value={25} max={50} aria-label="Upload" />,
  );
  if (!rootRef.current) throw new Error('Missing ProgressBar root');
  const control = getNativeProgressBar(rootRef.current);
  expectRange(control, 25, 50);
  expect(control.root).toHaveAttribute('data-nonzero-determinate', '');
  await screen.rerender(<ProgressBar ref={rootRef} value={25} max={100} aria-label="Upload" />);
  await settleProgressBarStyles(control);
  expectRange(control, 25, 100);
  await screen.rerender(<ProgressBar ref={rootRef} value={0} max={100} aria-label="Upload" />);
  expectRange(control, 0, 100);
  expect(control.root).not.toHaveAttribute('data-nonzero-determinate');
  expect(getComputedStyle(control.bar).transitionDuration).toBe('0s');
  await screen.rerender(
    <ProgressBar ref={rootRef} value={undefined} max={100} aria-label="Upload" />,
  );
  await settleProgressBarStyles(control);
  expectRange(control, undefined, 100);
  expect(control.root).toHaveAttribute('data-indeterminate', '');
  expect(captureProgressBarStyles(control)['bar.animation-count']).toBe('1');
  await screen.rerender(<ProgressBar ref={rootRef} value={100} max={100} aria-label="Upload" />);
  await settleProgressBarStyles(control);
  expectRange(control, 100, 100);
  expect(control.root).not.toHaveAttribute('data-indeterminate');
  expect(captureProgressBarStyles(control)['bar.animation-count']).toBe('0');
  expect(getComputedStyle(control.bar).backgroundImage).toBe('none');
});

test('advances and restarts the shared deterministic upload flow without a progress-change API', async () => {
  const screen = await renderCoreAIComponent(<ProgressBarUpload thickness="large" />);
  const root = screen.getByRole('progressbar', { name: 'Files uploaded' });
  const region = screen.getByRole('region', { name: 'Project upload' });
  await expect.element(root).not.toHaveAttribute('aria-valuenow');
  await expect.element(region).toHaveAttribute('aria-busy', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Discover upload size' }));
  await expect.element(root).toHaveAttribute('aria-valuenow', '0');
  await expect.element(root).toHaveAttribute('aria-valuemax', '4');
  await expect.element(root).not.toHaveAttribute('data-indeterminate');
  for (let value = 1; value <= 4; value++) {
    await userEvent.click(screen.getByRole('button', { name: 'Upload next file' }));
    await expect.element(root).toHaveAttribute('aria-valuenow', String(value));
  }
  await expect.element(region).toHaveAttribute('aria-busy', 'false');
  await expect
    .element(screen.getByRole('status', { name: 'Upload status' }))
    .toHaveTextContent('Upload complete');
  await expect.element(screen.getByRole('button', { name: 'Upload next file' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Restart upload' }));
  await expect.element(region).toHaveAttribute('aria-busy', 'true');
  for (const attribute of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow']) {
    await expect.element(root).not.toHaveAttribute(attribute);
  }
  await expect.element(root).toHaveAttribute('data-indeterminate', '');
});

test('does not make the display-only progressbar a tab stop', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before progress</button>
      <ProgressBar aria-label="Upload" value={0.5} />
      <button type="button">After progress</button>
    </>,
  );
  screen.getByRole('button', { name: 'Before progress' }).element().focus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After progress' })).toHaveFocus();
  await expect
    .element(screen.getByRole('progressbar', { name: 'Upload' }))
    .not.toHaveAttribute('tabindex');
});

test('settles only bar-slot animation and leaves infinite consumer child animation running', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const childRef = React.createRef<HTMLSpanElement>();
  await renderCoreAIComponent(
    <ProgressBar
      ref={rootRef}
      aria-label="Upload"
      bar={{
        children: <span ref={childRef} className={comparisonStyles.animatedChild} />,
      }}
    />,
  );
  if (!rootRef.current || !childRef.current) throw new Error('Missing animated fixture refs');
  const control = getNativeProgressBar(rootRef.current);
  await settleProgressBarStyles(control);
  expect(captureProgressBarStyles(control)['bar.animation-0.play-state']).toBe('paused');
  const childAnimations = childRef.current.getAnimations();
  expect(childAnimations).toHaveLength(1);
  expect(childAnimations[0].playState).toBe('running');
  expect(childAnimations[0].effect?.getTiming().duration).toBe(800);
  expect(childAnimations[0].effect?.getTiming().iterations).toBe(Infinity);
});

test.each(progressBarColors)(
  'preserves %s system-color rules when forced-colors media is active',
  async (color) => {
    const rootRef = React.createRef<HTMLDivElement>();
    const trackProbeRef = React.createRef<HTMLSpanElement>();
    const barProbeRef = React.createRef<HTMLSpanElement>();
    const forcedColors = matchMedia('(forced-colors: active)').matches;
    const colorTokens = {
      brand: '--colorCompoundBrandBackground',
      error: '--colorPaletteRedBackground3',
      warning: '--colorPaletteDarkOrangeBackground3',
      success: '--colorPaletteGreenBackground3',
    };
    await renderCoreAIComponent(
      <>
        <ProgressBar ref={rootRef} color={color} value={0.5} aria-label="Upload" />
        <span
          ref={trackProbeRef}
          aria-hidden
          style={{
            backgroundColor: forcedColors ? 'CanvasText' : 'var(--colorNeutralBackground6)',
            forcedColorAdjust: 'none',
          }}
        />
        <span
          ref={barProbeRef}
          aria-hidden
          style={{
            backgroundColor: forcedColors ? 'Highlight' : `var(${colorTokens[color]})`,
            forcedColorAdjust: 'none',
          }}
        />
      </>,
    );
    if (!rootRef.current || !trackProbeRef.current || !barProbeRef.current) {
      throw new Error('Missing ProgressBar or system-color probes');
    }
    const { root, bar } = getNativeProgressBar(rootRef.current);
    expect(getComputedStyle(root).backgroundColor).toBe(
      getComputedStyle(trackProbeRef.current).backgroundColor,
    );
    expect(getComputedStyle(bar).backgroundColor).toBe(
      getComputedStyle(barProbeRef.current).backgroundColor,
    );
    expect(getComputedStyle(root).forcedColorAdjust).toBe('auto');
    expect(getComputedStyle(bar).forcedColorAdjust).toBe('auto');
  },
);
