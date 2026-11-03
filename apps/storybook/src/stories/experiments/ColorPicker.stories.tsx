// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { FluentProvider } from '@coreai-ds/react-components';
import {
  AlphaSlider,
  ColorArea,
  ColorPicker,
  ColorSlider,
} from '@coreai-ds/react-headless-components';
import {
  ColorPickerComparison,
  ColorPickerNativeEditor,
  colorPickerConsumerExample,
  colorPickerExamples,
  colorPickerRtlExamples,
  colorPickerShapes,
  type ColorPickerExample,
} from './ColorPickerComparison.js';
import {
  captureColorPickerStyles,
  compareColorPickerStyles,
  getComparisonColorPicker,
  settleColorPickerStyles,
  type ColorPickerStyleDifference,
} from './compareColorPickerStyles.js';
import styles from './ColorPickerComparison.module.css';

function ComparisonWithReport({
  examples = colorPickerExamples,
  rtl = false,
  consumer = false,
}: {
  examples?: readonly ColorPickerExample[];
  rtl?: boolean;
  consumer?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<{
    fixtures: number;
    roots: number;
    slots: number;
    differences: (ColorPickerStyleDifference & { example: string })[];
  } | null>(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('ColorPicker fixtures have not mounted');
    setComparing(true);
    setReport(null);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-colorpicker-case]')];
      if (rows.length !== examples.length) throw new Error('ColorPicker fixture count changed');
      const differences = [];
      let roots = 0;
      let slots = 0;
      for (const row of rows) {
        const legacy = getComparisonColorPicker(row, 'legacy');
        const headless = getComparisonColorPicker(row, 'headless');
        await Promise.all([settleColorPickerStyles(legacy), settleColorPickerStyles(headless)]);
        roots += Object.keys(legacy.roots).length + Object.keys(headless.roots).length;
        slots += Object.keys(legacy.elements).length + Object.keys(headless.elements).length;
        differences.push(
          ...compareColorPickerStyles(
            captureColorPickerStyles(legacy),
            captureColorPickerStyles(headless),
            { rtl, consumer },
          ).map((difference) => ({ example: row.dataset.colorpickerCase ?? '', ...difference })),
        );
      }
      setReport({ fixtures: rows.length, roots, slots, differences });
    } finally {
      setComparing(false);
    }
  };
  const count = (kind: ColorPickerStyleDifference['kind']) =>
    report?.differences.filter((difference) => difference.kind === kind).length ?? 0;

  return (
    <div>
      <p>Bounded ColorPicker family comparison</p>
      <p>
        The four currently published members share the same fixtures, color objects, active theme,
        and native range behavior. Only shape is restored as a visual prop. AlphaSlider composes
        ColorSlider&apos;s CSS foundation, as Fluent does; ordinary Slider has different rail
        geometry and is not substituted. CoreAI has no family defaults or style overrides.
      </p>
      <p>
        The report measures selected root/input/rail/thumb properties, pseudo-element borders,
        checkerboard gradients, dimensions, and relative slot positions. There is no color
        conversion exclusion or geometry tolerance: both implementations use the installed
        react-color-picker 9.3.3 conversion functions and their same rounded HSL strings.
      </p>
      <p>
        Native focus-visible replaces Tabster focus attributes. No overlay or focusgroup polyfill is
        needed. The alpha checkerboard retains Fluent&apos;s original external transparent-pattern
        image URL. A missing image does not remove the alpha gradient.
      </p>
      <p>
        AlphaSlider does not set a native minimum. The editor supplies supported min=0 and max=100
        props so fractional value attributes do not become the browser&apos;s step base. For
        example, alpha 0.55 otherwise reaches native value 1e-14 instead of exact zero at the start
        of the rail. The raw-current regression checks both forms exactly.
      </p>
      <p>
        A rejected controlled alpha change from 0.55 reports both the requested 0.54 and the
        restored 0.55 in this browser: its sanitized range value differs from React&apos;s
        fractional value attribute. Raw-current tests retain both callbacks. Accepting the requested
        color, as this editor does, or using an exact native value such as alpha 0.5 avoids that
        duplicate restoration event. No range normalization is added.
      </p>
      {rtl && (
        <p>
          Explicit native-axis differences remain visible: ColorArea keeps the current hook&apos;s
          physical left-to-right pointer and arrow-key axis, instead of mirroring only its thumb and
          gradient in RTL. Vertical inputs keep maximum at the top in RTL; legacy Griffel mirrors
          their input direction independently of their thumb. Raw-current regressions establish
          these boundaries without changing the public hook.
        </p>
      )}
      {consumer && (
        <p>
          Intentional cascade differences: ordinary consumer classes override the new layered
          family, including composed AlphaSlider rail/thumb styles. The report lists them rather
          than removing them from comparison.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare ColorPicker styles
      </button>
      <output
        aria-label="ColorPicker style report"
        className={styles.report}
        data-ready={String(Boolean(report))}
        data-fixture-count={report?.fixtures ?? 0}
        data-compared-roots={report?.roots ?? 0}
        data-compared-slots={report?.slots ?? 0}
        data-difference-count={report?.differences.length ?? 0}
        data-unexpected-count={count('unexpected')}
        data-native-axis-count={count('native-axis')}
        data-consumer-count={count('consumer-cascade')}
      >
        {report === null
          ? 'Comparison not run.'
          : report.differences.length
            ? `${report.differences.length} differences across ${report.fixtures} fixtures:\n${JSON.stringify(report.differences, null, 2)}`
            : `No differences in the selected properties. ${report.fixtures} fixtures ready.`}
      </output>
      <div ref={containerRef}>
        <ColorPickerComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless ColorPicker',
  component: ColorPicker,
  subcomponents: { ColorArea, ColorSlider, AlphaSlider },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Current public headless 0.3.2 ColorPicker, ColorArea, ColorSlider, and AlphaSlider hooks/renderers with CSS Modules from react-color-picker 9.3.3. Only rounded/square shape is restored, stripped before the hook, and inherited through the published ColorPicker context. There is no size or appearance API. ColorPicker is a controlled coordinator, not a second color state model. Descendant controls also support independent uncontrolled colors. Native range inputs retain labels, names, disabled state, callbacks, refs, and caller slot renderers. ColorArea has no component disabled/readOnly API; its native input disabled props do not disable its pointer surface. Readonly range inputs are not a read-only color picker. Field associations must be supplied through supported explicit native props or Field render props, not an invented Field context bridge. Input-slot event/ref precedence, controlled rejection, and native form reset remain the current public implementation contract. No legacy Tabster runtime, positioning, motion, compatibility wrapper, or production polyfill is added. The original CoreAI package stays unchanged.',
      },
    },
  },
  argTypes: {
    shape: { control: 'select', options: colorPickerShapes },
    color: { control: 'object' },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Before color controls' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare ColorPicker styles' }));
    const report = canvas.getByRole('status', { name: 'ColorPicker style report' });
    await waitFor(
      async () => {
        await expect(report).toHaveAttribute('data-ready', 'true');
        await expect(report).toHaveAttribute('data-fixture-count', '18');
        await expect(report).toHaveAttribute('data-compared-roots', '48');
        await expect(report).toHaveAttribute('data-compared-slots', '180');
        await expect(report).toHaveAttribute('data-difference-count', '0');
        await expect(report).toHaveTextContent('No differences in the selected properties.');
      },
      { timeout: 15000 },
    );
  },
};

export const RightToLeft: Story = {
  render: () => (
    <FluentProvider dir="rtl">
      <ComparisonWithReport examples={colorPickerRtlExamples} rtl />
    </FluentProvider>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Before color controls' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare ColorPicker styles' }));
    const report = canvas.getByRole('status', { name: 'ColorPicker style report' });
    await waitFor(
      async () => {
        await expect(report).toHaveAttribute('data-ready', 'true');
        await expect(report).toHaveAttribute('data-fixture-count', '5');
        await expect(report).toHaveAttribute('data-compared-roots', '10');
        await expect(report).toHaveAttribute('data-compared-slots', '40');
        await expect(report).toHaveAttribute('data-unexpected-count', '0');
        await expect(Number(report.getAttribute('data-native-axis-count'))).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[colorPickerConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Before color controls' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Compare ColorPicker styles' }));
    const report = canvas.getByRole('status', { name: 'ColorPicker style report' });
    await waitFor(
      async () => {
        await expect(report).toHaveAttribute('data-ready', 'true');
        await expect(report).toHaveAttribute('data-fixture-count', '1');
        await expect(report).toHaveAttribute('data-compared-roots', '8');
        await expect(report).toHaveAttribute('data-compared-slots', '26');
        await expect(report).toHaveAttribute('data-unexpected-count', '0');
        await expect(Number(report.getAttribute('data-consumer-count'))).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );
    const selected = captureColorPickerStyles(getComparisonColorPicker(canvasElement, 'headless'));
    await expect(selected['picker.root.row-gap']).toBe('12px');
    await expect(selected['area.root.min-height']).toBe('180px');
    await expect(selected['area.root.border-top-left-radius']).toBe('3px');
    for (const part of ['slider', 'alpha']) {
      await expect(selected[`${part}.root.min-height`]).toBe('44px');
      await expect(selected[`${part}.rail.background-image`]).toBe('none');
      await expect(selected[`${part}.rail.border-top-left-radius`]).toBe('1px');
      await expect(selected[`${part}.thumb.box-shadow`]).toBe('none');
      await expect(selected[`${part}.thumb::before.border-top-style`]).toBe('dashed');
    }
  },
};

export const NativeColorEditor: Story = {
  render: () => (
    <>
      <p>
        Storybook&apos;s synthetic keyboard events do not invoke native range stepping. This play
        uses native stepUp/stepDown and input events for the one-dimensional ranges; the color area
        handles its own arrow keys. Trusted pointer and keyboard behavior is covered by the Chromium
        tests and live follow-ups.
      </p>
      <ColorPickerNativeEditor />
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    const hue = canvas.getByRole('slider', { name: 'Editor hue' });
    const opacity = canvas.getByRole('slider', { name: 'Editor opacity' });
    const saturation = canvas.getByRole('slider', { name: 'Editor saturation' });
    if (!(hue instanceof HTMLInputElement) || !(opacity instanceof HTMLInputElement))
      throw new Error('Missing native color ranges');
    await userEvent.click(canvas.getByRole('button', { name: 'Focus hue through ref' }));
    await expect(hue).toHaveFocus();
    hue.stepUp();
    hue.dispatchEvent(new Event('input', { bubbles: true }));
    await expect(hue).toHaveValue('211');
    opacity.focus();
    opacity.stepDown();
    opacity.dispatchEvent(new Event('input', { bubbles: true }));
    await expect(opacity).toHaveValue('54');
    saturation.focus();
    await userEvent.keyboard('[ArrowRight][ArrowUp]');
    await expect(saturation).toHaveValue('66');
    await expect(canvas.getByRole('slider', { name: 'Editor brightness' })).toHaveValue('81');
    await expect(canvas.getByRole('status', { name: 'Editor change count' })).toHaveTextContent(
      '4',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Submit HSV channels' }));
    await expect(canvas.getByRole('status', { name: 'Submitted HSV channels' })).toHaveTextContent(
      '{"saturation":"66","value":"81","hue":"211","opacity":"54"}',
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Reject requested color' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Focus hue through ref' }));
    hue.stepUp();
    hue.dispatchEvent(new Event('input', { bubbles: true }));
    await expect(hue).toHaveValue('211');
    await expect(canvas.getByRole('status', { name: 'Editor change count' })).toHaveTextContent(
      '5',
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Reject requested color' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Reset color explicitly' }));
    await expect(hue).toHaveValue('210');
    await expect(opacity).toHaveValue('55');
    await expect(saturation).toHaveValue('65');
    await expect(canvas.getByRole('slider', { name: 'Editor brightness' })).toHaveValue('80');
    await expect(
      canvas.getByRole('status', { name: 'Submitted HSV channels' }),
    ).toBeEmptyDOMElement();
    canvasElement.setAttribute('data-colorpicker-editor-play', 'complete');
  },
};
