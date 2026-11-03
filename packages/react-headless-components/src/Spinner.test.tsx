// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import {
  Spinner as LegacySpinner,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  SpinnerComparison,
  spinnerAppearances,
  spinnerConsumerExample,
  spinnerExamples,
  spinnerLabelPositions,
  spinnerSizes,
  type SpinnerExample,
} from '../../../apps/storybook/src/stories/experiments/SpinnerComparison.js';
import {
  captureSpinnerStyles,
  compareSpinnerStyles,
  getComparisonSpinner,
  settleSpinnerStyles,
  type ComparisonSpinner,
} from '../../../apps/storybook/src/stories/experiments/compareSpinnerStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/SpinnerComparison.module.css';
import { Spinner, spinnerClassNames, type SpinnerProps, type SpinnerSlots } from './Spinner.js';
import { Label, labelClassNames } from './Label.js';

type SpinnerElement = React.ComponentRef<typeof Spinner>;
type SpinnerDivProps = Extract<ExtractSlotProps<SpinnerSlots['root']>, { as?: 'div' }>;
type SpinnerKeyDownEvent = Parameters<NonNullable<SpinnerProps['onKeyDown']>>[0];

afterEach(async () => {
  await cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;
const spinnerPixels: Record<NonNullable<SpinnerProps['size']>, number> = {
  'extra-tiny': 16,
  tiny: 20,
  'extra-small': 24,
  small: 28,
  medium: 32,
  large: 36,
  'extra-large': 40,
  huge: 44,
};

async function renderPair(
  example: SpinnerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<SpinnerComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonSpinner(screen.container, 'legacy');
  const headless = getComparisonSpinner(screen.container, 'headless');
  await Promise.all([settleSpinnerStyles(legacy), settleSpinnerStyles(headless)]);
  return { screen, legacy, headless };
}

function getNativeSpinner(root: HTMLElement): ComparisonSpinner {
  const spinner = root.querySelector<HTMLSpanElement>(`:scope > .${spinnerClassNames.spinner}`);
  const label = root.querySelector<HTMLLabelElement>(`:scope > .${spinnerClassNames.label}`);
  return {
    root,
    spinner,
    spinnerTail:
      spinner?.querySelector<HTMLSpanElement>(`:scope > .${spinnerClassNames.spinnerTail}`) ?? null,
    label,
    required:
      label?.querySelector<HTMLSpanElement>(`:scope > .${labelClassNames.required}`) ?? null,
  };
}

function getAnimationFrames(root: HTMLElement, target: Element, pseudo: string | null = null) {
  const animation = root.getAnimations({ subtree: true }).find((candidate) => {
    const effect = candidate.effect;
    return (
      candidate instanceof CSSAnimation &&
      effect instanceof KeyframeEffect &&
      effect.target === target &&
      effect.pseudoElement === pseudo
    );
  });
  if (!(animation?.effect instanceof KeyframeEffect)) {
    throw new Error(`Missing Spinner animation for ${pseudo ?? 'element'}`);
  }
  return animation.effect.getKeyframes().map((frame) => ({
    offset: frame.computedOffset,
    transform: frame.transform,
  }));
}

for (const [mode, theme] of themes) {
  test.each(spinnerExamples)(
    `matches $name slots, pseudo-elements, keyframes, and dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareSpinnerStyles(captureSpinnerStyles(legacy), captureSpinnerStyles(headless)),
      ).toEqual([]);
      for (const control of [legacy, headless]) {
        expect(control.root).toHaveAttribute('role', 'progressbar');
        if (control.label) {
          expect(control.root).toHaveAttribute('aria-labelledby', control.label.id);
          expect(control.label).toHaveClass(labelClassNames.root);
        }
      }
      if (legacy.label && headless.label) expect(legacy.label.id).not.toBe(headless.label.id);
      const size = example.props.size ?? 'medium';
      expect(headless.root).toHaveAttribute('data-size', size);
      expect(headless.root).toHaveAttribute(
        'data-appearance',
        example.props.appearance ?? 'primary',
      );
      if (headless.spinner) {
        expect(headless.spinner.getBoundingClientRect().width).toBe(spinnerPixels[size]);
        expect(headless.spinner.getBoundingClientRect().height).toBe(spinnerPixels[size]);
      }
    },
  );

  test(`lets consumer CSS override the ring, tail pseudo-element, and shared Label in ${mode} mode`, async () => {
    const { headless } = await renderPair(spinnerConsumerExample, theme);
    const values = captureSpinnerStyles(headless);
    expect(values['root.gap']).toBe('14px');
    expect(values['root.justify-content']).toBe('flex-start');
    expect(values['spinner.width']).toBe('52.00');
    expect(values['spinner.height']).toBe('52.00');
    expect(values['spinner.--fui-Spinner--strokeWidth']).toBe('5px');
    expect(values['spinner.color']).toBe('rgb(20, 80, 120)');
    expect(values['spinner.background-color']).toBe('rgb(220, 230, 240)');
    expect(values['spinner.animation-duration']).toBe('2.4s');
    expect(values['spinnerTail.animation-timing-function']).toBe('linear');
    expect(values['spinnerTail::before.background-image']).toContain('90deg');
    expect(values['spinnerTail::after.background-image']).toContain('135deg');
    const forcedColors = matchMedia('(forced-colors: active)').matches;
    expect(values['label.color']).toBe(
      forcedColors ? getComputedStyle(headless.root).color : 'rgb(20, 80, 120)',
    );
    expect(values['label.font-size']).toBe('18px');
    expect(values['label.font-weight']).toBe('400');
    expect(values['label.line-height']).toBe('24px');
    expect(values['required.padding-left']).toBe('10px');
    expect(values['required.padding-right']).toBe('0px');
    expect(values['required.color']).toBe(
      forcedColors ? values['label.color'] : 'rgb(40, 110, 60)',
    );
  });
}

test.each(spinnerSizes)(
  'keeps size=%s visual typography independent of Label visual props',
  async (size) => {
    const { legacy, headless } = await renderPair({
      name: 'Shared Label typography',
      props: { size, label: { children: 'Loading projects', size: 'small', weight: 'regular' } },
    });
    const values = captureSpinnerStyles(headless);
    expect(compareSpinnerStyles(captureSpinnerStyles(legacy), values)).toEqual([]);
    const bodySize = ['extra-tiny', 'tiny', 'extra-small', 'small'].includes(size);
    expect(values['label.font-size']).toBe(bodySize ? '14px' : size === 'huge' ? '20px' : '16px');
    expect(values['label.line-height']).toBe(bodySize ? '20px' : size === 'huge' ? '28px' : '22px');
    expect(values['label.font-weight']).toBe(bodySize ? '400' : '600');
    expect(headless.label).toHaveAttribute('data-size', 'small');
    expect(headless.label).toHaveClass(labelClassNames.root, spinnerClassNames.label);
  },
);

for (const dir of ['ltr', 'rtl'] as const) {
  test.each(spinnerLabelPositions)(
    `keeps %s label order and frame-zero geometry in ${dir}`,
    async (labelPosition) => {
      const { legacy, headless } = await renderPair(
        { name: 'Label order', props: { labelPosition, label: 'Loading projects', size: 'small' } },
        coreaiLightTheme,
        true,
        dir,
      );
      expect(
        compareSpinnerStyles(captureSpinnerStyles(legacy), captureSpinnerStyles(headless)),
      ).toEqual([]);
      const labelFirst = labelPosition === 'before' || labelPosition === 'above';
      expect(headless.root.firstElementChild).toBe(labelFirst ? headless.label : headless.spinner);
      expect(headless.root).toHaveAttribute('data-label-position', labelPosition);
      expect(headless.root).toHaveAttribute('data-has-label', '');
      const vertical = labelPosition === 'above' || labelPosition === 'below';
      expect(getComputedStyle(headless.root).flexDirection).toBe(vertical ? 'column' : 'row');
      if (!vertical && headless.spinner && headless.label) {
        const ringRect = headless.spinner.getBoundingClientRect();
        const labelRect = headless.label.getBoundingClientRect();
        expect(labelRect.left < ringRect.left).toBe(labelFirst === (dir === 'ltr'));
      }
    },
  );

  test(`retains the actual rotation and both expanding-arc keyframes in ${dir}`, async () => {
    const { legacy, headless } = await renderPair(
      { name: 'Animation', props: { label: 'Loading projects' } },
      coreaiLightTheme,
      true,
      dir,
    );
    expect(
      compareSpinnerStyles(captureSpinnerStyles(legacy), captureSpinnerStyles(headless)),
    ).toEqual([]);
    const { root, spinner, spinnerTail } = headless;
    if (!spinner || !spinnerTail) throw new Error('Missing animated Spinner slots');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    expect(getComputedStyle(spinner).animationDuration).toBe(reducedMotion ? '1.8s' : '1.5s');
    expect(getComputedStyle(spinner).animationTimingFunction).toBe('linear');
    expect(getComputedStyle(spinner).animationIterationCount).toBe('infinite');
    expect(getAnimationFrames(root, spinner)).toEqual([
      { offset: 0, transform: 'rotate(0deg)' },
      { offset: 1, transform: dir === 'ltr' ? 'rotate(360deg)' : 'rotate(-360deg)' },
    ]);
    if (reducedMotion) {
      expect(getComputedStyle(spinnerTail).animationIterationCount).toBe('0');
      expect(getComputedStyle(spinnerTail).backgroundImage).toContain(
        dir === 'ltr' ? '120deg' : '240deg',
      );
      for (const pseudo of ['::before', '::after']) {
        expect(getComputedStyle(spinnerTail, pseudo).content).toBe('none');
      }
    } else {
      expect(getComputedStyle(spinnerTail).animationDuration).toBe('1.5s');
      expect(getComputedStyle(spinnerTail).animationIterationCount).toBe('infinite');
      const direction = dir === 'ltr' ? 1 : -1;
      expect(getAnimationFrames(root, spinnerTail)).toEqual([
        { offset: 0, transform: `rotate(${-135 * direction}deg)` },
        { offset: 0.5, transform: 'rotate(0deg)' },
        { offset: 1, transform: `rotate(${225 * direction}deg)` },
      ]);
      for (const [pseudo, angle] of [
        ['::before', 105],
        ['::after', 225],
      ] as const) {
        const styles = getComputedStyle(spinnerTail, pseudo);
        expect(styles.content).toBe('""');
        expect(styles.animationDuration).toBe('1.5s');
        expect(styles.animationTimingFunction).toBe(
          getComputedStyle(spinnerTail).animationTimingFunction,
        );
        expect(getAnimationFrames(root, spinnerTail, pseudo)).toEqual([
          { offset: 0, transform: 'rotate(0deg)' },
          { offset: 0.5, transform: `rotate(${angle * direction}deg)` },
          { offset: 1, transform: 'rotate(0deg)' },
        ]);
      }
    }
  });
}

test.each(spinnerAppearances)(
  'retains %s forced-color behavior when the browser media is active',
  async (appearance) => {
    const rootRef = React.createRef<SpinnerElement>();
    const probeRef = React.createRef<HTMLSpanElement>();
    const forcedColors = matchMedia('(forced-colors: active)').matches;
    await renderCoreAIComponent(
      <>
        <Spinner ref={rootRef} appearance={appearance} label="Loading projects" />
        <span
          ref={probeRef}
          aria-hidden
          style={{
            color: forcedColors
              ? 'Highlight'
              : `var(${appearance === 'inverted' ? '--colorNeutralStrokeOnBrand2' : '--colorBrandStroke1'})`,
            backgroundColor: forcedColors
              ? 'HighlightText'
              : `var(${appearance === 'inverted' ? '--colorNeutralStrokeAlpha2' : '--colorBrandStroke2Contrast'})`,
            forcedColorAdjust: 'none',
          }}
        />
      </>,
    );
    if (!rootRef.current || !probeRef.current)
      throw new Error('Missing Spinner or system-color probe');
    const control = getNativeSpinner(rootRef.current);
    if (!control.spinner) throw new Error('Missing Spinner ring');
    const ringStyles = getComputedStyle(control.spinner);
    const probeStyles = getComputedStyle(probeRef.current);
    expect(ringStyles.color).toBe(probeStyles.color);
    expect(ringStyles.backgroundColor).toBe(probeStyles.backgroundColor);
    expect(ringStyles.forcedColorAdjust).toBe(forcedColors ? 'none' : 'auto');
  },
);

test('uses the native root direction for mirrored motion even inside an LTR provider', async () => {
  const rootRef = React.createRef<SpinnerElement>();
  await renderCoreAIComponent(<Spinner ref={rootRef} dir="rtl" label="Loading projects" />, {
    providerProps: { dir: 'ltr' },
  });
  if (!rootRef.current) throw new Error('Missing native RTL Spinner root');
  const control = getNativeSpinner(rootRef.current);
  await settleSpinnerStyles(control);
  if (!control.spinner || !control.spinnerTail) throw new Error('Missing native RTL Spinner slots');
  expect(getComputedStyle(control.root).direction).toBe('rtl');
  expect(getComputedStyle(control.spinnerTail).maskImage).toContain('255deg');
  expect(getAnimationFrames(control.root, control.spinner)).toEqual([
    { offset: 0, transform: 'rotate(0deg)' },
    { offset: 1, transform: 'rotate(-360deg)' },
  ]);
});

test.each([true, false])(
  'adds no CoreAI defaults when withComponentDefaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Defaults',
        props: { label: 'Loading projects', size: undefined, appearance: undefined },
      },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(
      compareSpinnerStyles(captureSpinnerStyles(legacy), captureSpinnerStyles(headless)),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-size', 'medium');
    expect(headless.root).toHaveAttribute('data-appearance', 'primary');
  },
);

test.each([undefined, null])(
  'omits only the absent label (%s) and keeps an explicitly named progressbar',
  async (label) => {
    const rootRef = React.createRef<SpinnerElement>();
    await renderCoreAIComponent(
      <Spinner ref={rootRef} label={label} aria-label="Loading projects" />,
    );
    if (!rootRef.current) throw new Error('Missing Spinner root');
    const control = getNativeSpinner(rootRef.current);
    expect(control.root).toHaveAccessibleName('Loading projects');
    expect(control.root).not.toHaveAttribute('aria-labelledby');
    expect(control.root).not.toHaveAttribute('data-has-label');
    expect(control.root).toHaveAttribute('data-label-position', 'after');
    expect(control.label).toBeNull();
    expect(control.spinner).toHaveClass(spinnerClassNames.spinner);
    expect(control.spinnerTail).toHaveClass(spinnerClassNames.spinnerTail);
  },
);

test.each(['', 0])('retains a supplied empty/numeric label slot (%s)', async (label) => {
  const rootRef = React.createRef<SpinnerElement>();
  await renderCoreAIComponent(<Spinner ref={rootRef} label={label} />);
  if (!rootRef.current) throw new Error('Missing Spinner root');
  const control = getNativeSpinner(rootRef.current);
  expect(control.label).toHaveClass(spinnerClassNames.label, labelClassNames.root);
  expect(control.label?.textContent).toBe(String(label));
  expect(control.root).toHaveAttribute('data-has-label', '');
  expect(control.root).toHaveAttribute('aria-labelledby', control.label?.id);
});

test('preserves refs, classes, native attributes and caller content without marking arbitrary children', async () => {
  const rootRef = React.createRef<SpinnerElement>();
  const spinnerRef = React.createRef<HTMLSpanElement>();
  const tailRef = React.createRef<HTMLSpanElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  const requiredRef = React.createRef<HTMLSpanElement>();
  const events: string[] = [];
  const screen = await renderCoreAIComponent(
    <Spinner
      as="span"
      ref={rootRef}
      className="consumer-root"
      title="Loading progress"
      size="huge"
      appearance="inverted"
      role="status"
      aria-live="polite"
      aria-busy
      data-consumer-root=""
      onClick={() => events.push('root')}
      spinner={{
        ref: spinnerRef,
        className: 'consumer-spinner',
        title: 'Animated ring',
        'aria-hidden': true,
      }}
      spinnerTail={{
        ref: tailRef,
        className: 'consumer-tail',
        'aria-hidden': false,
        children: <span className="consumer-tail-child">•</span>,
        onClick: () => events.push('tail'),
      }}
      label={{
        id: 'spinner-consumer-label',
        ref: labelRef,
        className: 'consumer-label',
        size: 'large',
        weight: 'semibold',
        children: <span className="consumer-label-child">Loading projects</span>,
        required: {
          ref: requiredRef,
          className: 'consumer-required',
          children: <em className="consumer-required-child">!</em>,
        },
      }}
    />,
  );
  const root = screen.getByRole('status', { name: 'Loading projects' }).element();
  expect(root).toBeInstanceOf(HTMLSpanElement);
  expect(rootRef.current).toBe(root);
  expect(root).toHaveClass(spinnerClassNames.root, 'consumer-root');
  expect(root).toHaveAttribute('title', 'Loading progress');
  expect(root).toHaveAttribute('data-consumer-root', '');
  expect(root).toHaveAttribute('data-has-spinner', '');
  expect(root).toHaveAttribute('data-has-label', '');
  expect(root).toHaveAttribute('aria-labelledby', 'spinner-consumer-label');
  expect(root).toHaveAttribute('aria-live', 'polite');
  expect(root).toHaveAttribute('aria-busy', 'true');
  expect(spinnerRef.current).toHaveClass(spinnerClassNames.spinner, 'consumer-spinner');
  expect(spinnerRef.current).toHaveAttribute('title', 'Animated ring');
  expect(spinnerRef.current).toHaveAttribute('aria-hidden', 'true');
  expect(tailRef.current).toHaveClass(spinnerClassNames.spinnerTail, 'consumer-tail');
  expect(tailRef.current).toHaveAttribute('aria-hidden', 'false');
  expect(labelRef.current).toHaveClass(
    spinnerClassNames.label,
    labelClassNames.root,
    'consumer-label',
  );
  expect(labelRef.current).toHaveAttribute('data-size', 'large');
  expect(labelRef.current).toHaveAttribute('data-weight', 'semibold');
  expect(labelRef.current?.control).toBeNull();
  expect(requiredRef.current).toHaveClass(labelClassNames.required, 'consumer-required');
  expect(requiredRef.current).toHaveAttribute('aria-hidden', 'true');
  for (const child of [
    tailRef.current?.firstElementChild,
    labelRef.current?.firstElementChild,
    requiredRef.current?.firstElementChild,
  ]) {
    for (const marker of [...Object.values(spinnerClassNames), ...Object.values(labelClassNames)]) {
      expect(child).not.toHaveClass(marker);
    }
  }
  for (const prop of ['size', 'appearance', 'labelPosition', 'delay']) {
    expect(root).not.toHaveAttribute(prop);
  }
  if (!tailRef.current) throw new Error('Missing consumer Spinner tail');
  // Dispatch a native event without depending on an animated mask's pointer-hit geometry.
  tailRef.current.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(events).toEqual(['tail', 'root']);
});

test('preserves public root, ring, tail and label render functions with native slot metadata and local Label styling', async () => {
  const errors = vi.spyOn(console, 'error');
  const rootRef = React.createRef<HTMLDivElement>();
  const spinnerRef = React.createRef<HTMLSpanElement>();
  const tailRef = React.createRef<HTMLSpanElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  let renderedLabel: unknown;
  const renderRoot: SlotRenderFunction<SpinnerDivProps> = (Component, props) => (
    <Component {...props} data-rendered-root="">
      {props.children}
    </Component>
  );
  const renderRing: SlotRenderFunction<ExtractSlotProps<SpinnerSlots['spinner']>> = (
    Component,
    props,
  ) => (
    <Component {...props}>
      {props.children}
      <span className="consumer-ring-child" />
    </Component>
  );
  const renderTail: SlotRenderFunction<ExtractSlotProps<SpinnerSlots['spinnerTail']>> = (
    Component,
    props,
  ) => (
    <Component {...props}>
      <span className="consumer-tail-child">•</span>
    </Component>
  );
  const renderLabel: SlotRenderFunction<ExtractSlotProps<SpinnerSlots['label']>> = (
    Component,
    props,
  ) => {
    renderedLabel = Component;
    return (
      <Component {...props}>
        <span className="consumer-label-child">Rendered loading label</span>
      </Component>
    );
  };
  await renderCoreAIComponent(
    <Spinner
      as="div"
      ref={rootRef}
      spinner={{ ref: spinnerRef, className: 'consumer-ring', children: renderRing }}
      spinnerTail={{ ref: tailRef, className: 'consumer-tail', children: renderTail }}
      label={{ ref: labelRef, className: 'consumer-label', required: true, children: renderLabel }}
    >
      {renderRoot}
    </Spinner>,
  );
  if (!rootRef.current || !spinnerRef.current || !tailRef.current || !labelRef.current) {
    throw new Error('Missing rendered Spinner slots');
  }
  expect(renderedLabel).toBe(Label);
  expect(rootRef.current).toHaveAccessibleName('Rendered loading label');
  expect(rootRef.current).toHaveAttribute('data-rendered-root', '');
  expect(spinnerRef.current).toHaveClass(spinnerClassNames.spinner, 'consumer-ring');
  expect(tailRef.current).toHaveClass(spinnerClassNames.spinnerTail, 'consumer-tail');
  expect(labelRef.current).toHaveClass(
    spinnerClassNames.label,
    labelClassNames.root,
    'consumer-label',
  );
  expect(spinnerRef.current.firstElementChild).toBe(tailRef.current);
  expect(tailRef.current.firstElementChild).toHaveClass('consumer-tail-child');
  expect(labelRef.current.firstElementChild).toHaveClass('consumer-label-child');
  expect(labelRef.current.querySelector(`.${labelClassNames.required}`)).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

test('freezes owned pseudo-element animations without freezing a consumer child animation', async () => {
  const rootRef = React.createRef<SpinnerElement>();
  const childRef = React.createRef<HTMLSpanElement>();
  await renderCoreAIComponent(
    <Spinner
      ref={rootRef}
      label="Loading projects"
      spinnerTail={{
        children: (
          <span ref={childRef} className={comparisonStyles.animatedChild}>
            •
          </span>
        ),
      }}
    />,
  );
  if (!rootRef.current || !childRef.current) throw new Error('Missing Spinner animation fixture');
  const control = getNativeSpinner(rootRef.current);
  await settleSpinnerStyles(control);
  const childAnimation = childRef.current.getAnimations()[0];
  if (!childAnimation) throw new Error('Missing consumer child animation');
  expect(childAnimation).toBeInstanceOf(CSSAnimation);
  expect(childAnimation.playState).toBe('running');
  const owned = rootRef.current
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.effect instanceof KeyframeEffect &&
        (animation.effect.target === control.spinner ||
          animation.effect.target === control.spinnerTail),
    );
  expect(owned).toHaveLength(matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 4);
  for (const animation of owned) {
    expect(animation.playState).toBe('paused');
    expect(animation.currentTime).toBe(0);
  }
});

test.each([
  ['legacy', LegacySpinner],
  ['headless', Spinner],
] as const)(
  'keeps %s progressbar naming and explicit live-region/native-event overrides',
  async (_implementation, Component) => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const onFocus = vi.fn();
    const rootRef = React.createRef<SpinnerElement>();
    const screen = await renderCoreAIComponent(
      <>
        <span id="external-loading-name">External loading name</span>
        <div
          className={comparisonStyles.pointerParking}
          data-testid="pointer-parking"
          aria-hidden
        />
        <Component
          ref={rootRef}
          role="status"
          aria-labelledby="external-loading-name"
          aria-live="assertive"
          aria-atomic
          tabIndex={0}
          label={{ id: 'internal-loading-label', children: 'Visible loading label' }}
          onClick={onClick}
          onKeyDown={(event: SpinnerKeyDownEvent) => onKeyDown(event.key, event.currentTarget)}
          onFocus={onFocus}
        />
      </>,
    );
    const root = screen.getByRole('status', { name: 'External loading name' }).element();
    expect(rootRef.current).toBe(root);
    expect(root).toHaveAttribute('aria-labelledby', 'external-loading-name');
    expect(root).toHaveAttribute('aria-live', 'assertive');
    expect(root).toHaveAttribute('aria-atomic', 'true');
    await userEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.hover(screen.getByTestId('pointer-parking'));
    await userEvent.keyboard('{Escape}');
    await expect.element(root).toHaveFocus();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledExactlyOnceWith('Escape', root);
  },
);

test('keeps default progressbar semantics instead of adding an implicit live region', async () => {
  const screen = await renderCoreAIComponent(<Spinner label="Loading projects" />);
  const root = screen.getByRole('progressbar', { name: 'Loading projects' }).element();
  expect(root).not.toHaveAttribute('aria-live');
  expect(root).not.toHaveAttribute('aria-valuenow');
  expect(root).not.toHaveAttribute('tabindex');
  expect(root).not.toHaveAttribute('aria-busy');
});

test('retains the public renderer child contract: the tail supplies ring content', async () => {
  const rootRef = React.createRef<SpinnerElement>();
  await renderCoreAIComponent(
    <Spinner
      ref={rootRef}
      label="Loading projects"
      spinner={{ children: <span data-unused-ring-child="">Unused direct ring content</span> }}
      spinnerTail={{ children: <span data-tail-content="">Tail content</span> }}
    >
      Unused direct root content
    </Spinner>,
  );
  if (!rootRef.current) throw new Error('Missing Spinner root');
  expect(rootRef.current.querySelector('[data-unused-ring-child]')).toBeNull();
  expect(rootRef.current.querySelector('[data-tail-content]')).toHaveTextContent('Tail content');
  expect(rootRef.current).not.toHaveTextContent('Unused direct root content');
});

test('delays only the rendered slots while preserving the native root and resolved naming', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const rootRef = React.createRef<SpinnerElement>();
  const labelRef = React.createRef<HTMLLabelElement>();
  await renderCoreAIComponent(
    <Spinner
      ref={rootRef}
      delay={200}
      label={{ id: 'delayed-label', ref: labelRef, children: 'Loading projects' }}
    />,
  );
  if (!rootRef.current) throw new Error('Missing delayed Spinner root');
  const root = rootRef.current;
  expect(root.childElementCount).toBe(0);
  expect(labelRef.current).toBeNull();
  expect(root).toHaveAttribute('role', 'progressbar');
  expect(root).toHaveAttribute('aria-labelledby', 'delayed-label');
  expect(root).toHaveAttribute('data-has-label', '');
  expect(root).toHaveAttribute('data-has-spinner', '');
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(199);
  });
  expect(root.childElementCount).toBe(0);
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  const control = getNativeSpinner(root);
  expect(control.spinner).toHaveClass(spinnerClassNames.spinner);
  expect(control.spinnerTail).toHaveClass(spinnerClassNames.spinnerTail);
  expect(labelRef.current).toBe(control.label);
  expect(root).toHaveAccessibleName('Loading projects');
});

test('updates a pending delay and immediately reveals slots when the caller removes the delay', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const rootRef = React.createRef<SpinnerElement>();
  const screen = await renderCoreAIComponent(
    <Spinner ref={rootRef} delay={200} label="Loading projects" />,
  );
  if (!rootRef.current) throw new Error('Missing delayed Spinner root');
  const root = rootRef.current;
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  await screen.rerender(<Spinner ref={rootRef} delay={400} label="Loading projects" />);
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(root.childElementCount).toBe(0);
  await screen.rerender(<Spinner ref={rootRef} delay={0} label="Loading projects" />);
  expect(getNativeSpinner(root).label).toHaveTextContent('Loading projects');
  expect(rootRef.current).toBe(root);
  await screen.unmount();
  expect(rootRef.current).toBeNull();
});
