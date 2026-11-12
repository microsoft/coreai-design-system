// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
  type CoreAITheme,
} from '@coreai-ds/react-headless-components';
import {
  textAlignments,
  textConsumerExample,
  textElements,
  textFonts,
  textForegrounds,
  textInheritanceStyle,
  textPresetExpectations,
  textSizes,
  textUndefinedProps,
  textWeights,
} from '../../../apps/storybook/src/stories/experiments/TextFixtures.js';
import { Text, textClassNames, type TextProps } from './Text.js';

afterEach(cleanup);

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

const inheritedProperties = [
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'wordSpacing',
] as const;

function typography(theme: CoreAITheme) {
  return {
    100: [theme.fontSizeBase100, theme.lineHeightBase100],
    200: [theme.fontSizeBase200, theme.lineHeightBase200],
    300: [theme.fontSizeBase300, theme.lineHeightBase300],
    400: [theme.fontSizeBase400, theme.lineHeightBase400],
    500: [theme.fontSizeBase500, theme.lineHeightBase500],
    600: [theme.fontSizeBase600, theme.lineHeightBase600],
    700: [theme.fontSizeHero700, theme.lineHeightHero700],
    800: [theme.fontSizeHero800, theme.lineHeightHero800],
    900: [theme.fontSizeHero900, theme.lineHeightHero900],
    1000: [theme.fontSizeHero1000, theme.lineHeightHero1000],
  };
}

function weightTokens(theme: CoreAITheme) {
  return {
    regular: theme.fontWeightRegular,
    medium: theme.fontWeightMedium,
    semibold: theme.fontWeightSemibold,
    bold: theme.fontWeightBold,
  };
}

test('exposes native element props, element-specific event targets, and non-string refs', () => {
  expectTypeOf<React.ComponentProps<typeof Text>['ref']>().toEqualTypeOf<
    React.Ref<HTMLElement> | undefined
  >();
  const props: TextProps = {
    as: 'pre',
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onKeyDown: (event) => {
      expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLPreElement>();
    },
  };
  expect(props.as).toBe('pre');
});

for (const [mode, theme] of themes) {
  for (const withComponentDefaults of [true, false]) {
    test(`inherits omitted and explicitly undefined typography in ${mode}, defaults ${withComponentDefaults}`, async () => {
      const screen = await render(
        <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults}>
          <div style={textInheritanceStyle}>
            <span data-testid="native">Native span</span>
            <Text data-testid="omitted">Inherited Text</Text>
            <Text {...textUndefinedProps} data-testid="undefined">
              Explicitly undefined Text
            </Text>
          </div>
        </CoreAIFluentProvider>,
      );
      const native = getComputedStyle(screen.getByTestId('native').element());
      for (const id of ['omitted', 'undefined']) {
        const root = screen.getByTestId(id).element();
        const styles = getComputedStyle(root);
        for (const property of inheritedProperties) {
          expect(styles[property], `${id}.${property}`).toBe(native[property]);
        }
        expect(styles.display).toBe('inline');
        expect(styles.textAlign).toBe('start');
        expect(styles.whiteSpace).toBe('normal');
        expect(styles.overflow).toBe('visible');
        expect(styles.textOverflow).toBe('clip');
        expect(styles.textDecorationLine).toBe('none');
      }
    });
  }

  test(`applies each supported size, font, and weight using the ${mode} theme`, async () => {
    const fontTokens = {
      base: theme.fontFamilyBase,
      monospace: theme.fontFamilyMonospace,
      numeric: theme.fontFamilyNumeric,
    };
    const screen = await render(
      <CoreAIFluentProvider theme={theme}>
        <div style={textInheritanceStyle}>
          {textSizes.map((size) => (
            <Text key={size} size={size} data-testid={`size-${size}`}>
              Sized text
            </Text>
          ))}
          {textFonts.map((font) => (
            <React.Fragment key={font}>
              <Text font={font} data-testid={`font-${font}`}>
                Font text
              </Text>
              <span style={{ fontFamily: fontTokens[font] }} data-testid={`font-ref-${font}`} />
            </React.Fragment>
          ))}
          {textWeights.map((weight) => (
            <Text key={weight} weight={weight} data-testid={`weight-${weight}`}>
              Weighted text
            </Text>
          ))}
        </div>
      </CoreAIFluentProvider>,
    );
    for (const size of textSizes) {
      const styles = getComputedStyle(screen.getByTestId(`size-${size}`).element());
      const [fontSize, lineHeight] = typography(theme)[size];
      expect(styles.fontSize).toBe(fontSize);
      expect(styles.lineHeight).toBe(lineHeight);
      expect(styles.fontWeight).toBe('500');
      expect(styles.fontFamily).toContain('Georgia');
    }
    for (const font of textFonts) {
      const styles = getComputedStyle(screen.getByTestId(`font-${font}`).element());
      const reference = getComputedStyle(screen.getByTestId(`font-ref-${font}`).element());
      expect(styles.fontFamily).toBe(reference.fontFamily);
      expect(styles.fontSize).toBe('19px');
      expect(styles.lineHeight).toBe('31px');
      expect(styles.fontWeight).toBe('500');
    }
    for (const weight of textWeights) {
      const styles = getComputedStyle(screen.getByTestId(`weight-${weight}`).element());
      expect(styles.fontWeight).toBe(String(weightTokens(theme)[weight]));
      expect(styles.fontSize).toBe('19px');
      expect(styles.lineHeight).toBe('31px');
    }
  });

  test(`maps all foreground levels to ${mode} colors without changing native semantics`, async () => {
    const colors = {
      1: theme.colorNeutralForeground1,
      2: theme.colorNeutralForeground2,
      3: theme.colorNeutralForeground3,
      4: theme.colorNeutralForeground4,
      disabled: theme.colorNeutralForegroundDisabled,
    };
    const screen = await render(
      <CoreAIFluentProvider theme={theme}>
        {textForegrounds.map((foreground) => (
          <React.Fragment key={foreground}>
            <Text foreground={foreground} data-testid={`foreground-${foreground}`}>
              Foreground text
            </Text>
            <span style={{ color: colors[foreground] }} data-testid={`color-ref-${foreground}`} />
          </React.Fragment>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const foreground of textForegrounds) {
      const root = screen.getByTestId(`foreground-${foreground}`).element();
      const reference = screen.getByTestId(`color-ref-${foreground}`).element();
      expect(getComputedStyle(root).color).toBe(getComputedStyle(reference).color);
      expect(root.tagName).toBe('SPAN');
      expect(root).not.toHaveAttribute('disabled');
      expect(root).not.toHaveAttribute('aria-disabled');
      expect(root).not.toHaveAttribute('role');
    }
  });

  test(`maps CoreAI presets and their aliases in ${mode} mode`, async () => {
    const screen = await render(
      <CoreAIFluentProvider theme={theme}>
        {textPresetExpectations.map(([preset]) => (
          <Text key={preset} preset={preset} data-testid={preset}>
            Preset text
          </Text>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const [preset, size, weight] of textPresetExpectations) {
      const styles = getComputedStyle(screen.getByTestId(preset).element());
      const [fontSize, lineHeight] = typography(theme)[size];
      expect(styles.fontSize, preset).toBe(fontSize);
      expect(styles.lineHeight, preset).toBe(lineHeight);
      expect(styles.fontWeight, preset).toBe(String(weightTokens(theme)[weight]));
    }
  });

  test(`keeps nested typography and foreground inheritance independent in ${mode} mode`, async () => {
    const screen = await render(
      <CoreAIFluentProvider theme={theme}>
        <Text as="h2" preset="heading3" foreground={1} data-testid="heading">
          Status{' '}
          <Text foreground={4} data-testid="nested">
            Date <Text data-testid="descendant">today</Text>
          </Text>{' '}
          <Text font="monospace" data-testid="code">
            report.json
          </Text>
        </Text>
      </CoreAIFluentProvider>,
    );
    const heading = getComputedStyle(screen.getByTestId('heading').element());
    const nested = getComputedStyle(screen.getByTestId('nested').element());
    const descendant = getComputedStyle(screen.getByTestId('descendant').element());
    const code = getComputedStyle(screen.getByTestId('code').element());
    for (const styles of [nested, descendant, code]) {
      expect(styles.fontSize).toBe(heading.fontSize);
      expect(styles.lineHeight).toBe(heading.lineHeight);
      expect(styles.fontWeight).toBe(heading.fontWeight);
    }
    expect(nested.fontFamily).toBe(heading.fontFamily);
    expect(nested.color).not.toBe(heading.color);
    expect(descendant.color).toBe(nested.color);
    expect(code.color).toBe(heading.color);
    expect(code.fontFamily).not.toBe(heading.fontFamily);
    await expect.element(screen.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test(`uses provider responsive tracking except for explicit uppercase in ${mode}`, async () => {
    const screen = await render(
      <CoreAIFluentProvider theme={theme}>
        {([100, 300, 500] as const).map((size) => (
          <React.Fragment key={size}>
            <Text size={size} data-testid={`normal-${size}`}>
              Mixed case
            </Text>
            <Text size={size} uppercase data-testid={`uppercase-${size}`}>
              Mixed case
            </Text>
          </React.Fragment>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const size of [100, 300, 500]) {
      const normal = getComputedStyle(screen.getByTestId(`normal-${size}`).element());
      const uppercase = getComputedStyle(screen.getByTestId(`uppercase-${size}`).element());
      const fontSize = Number.parseFloat(normal.fontSize);
      const responsiveTracking = Math.max(0.01, 0.01 + (18 - fontSize) * 0.007) * fontSize;
      expect(Number.parseFloat(normal.letterSpacing)).toBeCloseTo(responsiveTracking, 3);
      expect(uppercase.textTransform).toBe('uppercase');
      expect(Number.parseFloat(uppercase.letterSpacing)).toBeCloseTo(fontSize * 0.1, 3);
      expect(normal.textTransform).toBe('none');
    }
  });
}

test('inherits native typography outside a provider, including explicit undefined props', async () => {
  const screen = await render(
    <div style={textInheritanceStyle}>
      <span data-testid="native">Native span</span>
      <Text data-testid="omitted">Bare Text</Text>
      <Text {...textUndefinedProps} data-testid="undefined">
        Undefined Text
      </Text>
      <Text uppercase data-testid="uppercase">
        Uppercase Text
      </Text>
    </div>,
  );
  const native = getComputedStyle(screen.getByTestId('native').element());
  for (const id of ['omitted', 'undefined']) {
    const styles = getComputedStyle(screen.getByTestId(id).element());
    for (const property of inheritedProperties) {
      expect(styles[property], property).toBe(native[property]);
    }
  }
  const uppercase = getComputedStyle(screen.getByTestId('uppercase').element());
  expect(uppercase.textTransform).toBe('uppercase');
  expect(Number.parseFloat(uppercase.letterSpacing)).toBeCloseTo(1.9);
});

test.each([
  {
    name: 'undefined values retain the preset',
    props: { preset: 'heading1', size: undefined, weight: undefined },
    size: 900,
    weight: 'semibold',
  },
  {
    name: 'explicit size overrides only size and line height',
    props: { preset: 'heading1', size: 100 },
    size: 100,
    weight: 'semibold',
  },
  {
    name: 'explicit weight overrides only weight',
    props: { preset: 'heading1', weight: 'regular' },
    size: 900,
    weight: 'regular',
  },
  {
    name: 'explicit size and weight override both',
    props: { preset: 'heading1', size: 100, weight: 'regular' },
    size: 100,
    weight: 'regular',
  },
] satisfies {
  name: string;
  props: TextProps;
  size: NonNullable<TextProps['size']>;
  weight: NonNullable<TextProps['weight']>;
}[])('preset resolution: $name', async ({ props, size, weight }) => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Text {...props} data-testid="text">
        Preset text
      </Text>
    </CoreAIFluentProvider>,
  );
  const styles = getComputedStyle(screen.getByTestId('text').element());
  const [fontSize, lineHeight] = typography(coreaiLightTheme)[size];
  expect(styles.fontSize).toBe(fontSize);
  expect(styles.lineHeight).toBe(lineHeight);
  expect(styles.fontWeight).toBe(String(weightTokens(coreaiLightTheme)[weight]));
});

test.each([true, false])(
  'keeps explicit CoreAI props active with provider component defaults %s',
  async (withComponentDefaults) => {
    const screen = await render(
      <CoreAIFluentProvider withComponentDefaults={withComponentDefaults}>
        <Text preset="heading3" foreground={1} uppercase data-testid="text">
          Explicit CoreAI choices
        </Text>
        <span style={{ color: coreaiLightTheme.colorNeutralForeground1 }} data-testid="color" />
      </CoreAIFluentProvider>,
    );
    const styles = getComputedStyle(screen.getByTestId('text').element());
    const [fontSize, lineHeight] = typography(coreaiLightTheme)[500];
    expect(styles.fontSize).toBe(fontSize);
    expect(styles.lineHeight).toBe(lineHeight);
    expect(styles.fontWeight).toBe(String(coreaiLightTheme.fontWeightSemibold));
    expect(styles.color).toBe(getComputedStyle(screen.getByTestId('color').element()).color);
    expect(styles.textTransform).toBe('uppercase');
    expect(Number.parseFloat(styles.letterSpacing)).toBeCloseTo(Number.parseFloat(fontSize) * 0.1);
  },
);

test.each(['ltr', 'rtl'] as const)(
  'uses logical alignment and native direction in %s',
  async (dir) => {
    const screen = await render(
      <CoreAIFluentProvider dir={dir}>
        {textAlignments.map((align) => (
          <Text key={align} align={align} block data-testid={align}>
            Aligned text
          </Text>
        ))}
      </CoreAIFluentProvider>,
    );
    for (const align of textAlignments) {
      const styles = getComputedStyle(screen.getByTestId(align).element());
      expect(styles.textAlign).toBe(align);
      expect(styles.direction).toBe(dir);
      expect(styles.display).toBe('block');
    }
  },
);

test('keeps wrap, truncation, and block choices independent', async () => {
  const cases = [
    {
      id: 'default',
      props: {},
      display: 'inline',
      wrap: 'normal',
      overflow: 'visible',
      end: 'clip',
    },
    {
      id: 'block-wrap',
      props: { block: true, wrap: true },
      display: 'block',
      wrap: 'normal',
      overflow: 'visible',
      end: 'clip',
    },
    {
      id: 'nowrap',
      props: { block: true, wrap: false },
      display: 'block',
      wrap: 'nowrap',
      overflow: 'hidden',
      end: 'clip',
    },
    {
      id: 'truncate-only',
      props: { block: true, truncate: true },
      display: 'block',
      wrap: 'normal',
      overflow: 'visible',
      end: 'ellipsis',
    },
    {
      id: 'truncate-nowrap',
      props: { block: true, wrap: false, truncate: true },
      display: 'block',
      wrap: 'nowrap',
      overflow: 'hidden',
      end: 'ellipsis',
    },
  ];
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ width: 120 }}>
        {cases.map(({ id, props }) => (
          <Text key={id} {...props} data-testid={id}>
            A long project name that exceeds its narrow container
          </Text>
        ))}
      </div>
    </CoreAIFluentProvider>,
  );
  for (const example of cases) {
    const root = screen.getByTestId(example.id).element();
    const styles = getComputedStyle(root);
    expect(styles.display).toBe(example.display);
    expect(styles.whiteSpace).toBe(example.wrap);
    expect(styles.overflow).toBe(example.overflow);
    expect(styles.textOverflow).toBe(example.end);
  }
  const wrapped = screen.getByTestId('block-wrap').element();
  const clipped = screen.getByTestId('truncate-nowrap').element();
  expect(wrapped.getBoundingClientRect().height).toBeGreaterThan(
    clipped.getBoundingClientRect().height,
  );
  expect(clipped.scrollWidth).toBeGreaterThan(clipped.clientWidth);
});

test('combines decorations and does not erase inherited italic styling for false props', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Text italic data-testid="italic">
        Italic
      </Text>
      <Text underline data-testid="underline">
        Underlined
      </Text>
      <Text strikethrough data-testid="strike">
        Struck
      </Text>
      <Text underline strikethrough data-testid="both">
        Both
      </Text>
      <div style={{ fontStyle: 'italic' }}>
        <Text italic={false} underline={false} strikethrough={false} data-testid="false">
          Inherited italic
        </Text>
      </div>
    </CoreAIFluentProvider>,
  );
  expect(getComputedStyle(screen.getByTestId('italic').element()).fontStyle).toBe('italic');
  expect(getComputedStyle(screen.getByTestId('underline').element()).textDecorationLine).toBe(
    'underline',
  );
  expect(getComputedStyle(screen.getByTestId('strike').element()).textDecorationLine).toBe(
    'line-through',
  );
  expect(
    getComputedStyle(screen.getByTestId('both').element()).textDecorationLine.split(' ').sort(),
  ).toEqual(['line-through', 'underline']);
  const falseStyles = getComputedStyle(screen.getByTestId('false').element());
  expect(falseStyles.fontStyle).toBe('italic');
  expect(falseStyles.textDecorationLine).toBe('none');
});

test.each(textElements)(
  'preserves the native %s element, root ref, and semantic margin reset',
  async (as) => {
    const ref = React.createRef<HTMLElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '19px',
            lineHeight: '31px',
            fontWeight: 500,
          }}
        >
          <Text as={as} ref={ref} data-testid="text" title="Native text" lang="en" translate="no">
            <span data-testid="child">Caller content</span>
          </Text>
        </div>
      </CoreAIFluentProvider>,
    );
    const root = screen.getByTestId('text').element();
    expect(root.tagName).toBe(as.toUpperCase());
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('title', 'Native text');
    expect(root).toHaveAttribute('lang', 'en');
    expect(root).toHaveAttribute('translate', 'no');
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild).toBe(screen.getByTestId('child').element());
    expect(root.firstElementChild).not.toHaveClass(textClassNames.root);
    const styles = getComputedStyle(root);
    expect(styles.fontFamily).toContain('Georgia');
    expect(styles.fontSize).toBe('19px');
    expect(styles.fontWeight).toBe('500');
    expect(styles.lineHeight).toBe('31px');
    expect(styles.fontStyle).toBe(as === 'em' || as === 'i' ? 'italic' : 'normal');
    for (const margin of ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const) {
      expect(styles[margin]).toBe('0px');
    }
  },
);

test('forwards callbacks, focus, native attributes, caller classes, and visual-only disabled color', async () => {
  const ref = React.createRef<HTMLHeadingElement>();
  const clickTargets: EventTarget[] = [];
  const onKeyDown = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Text
        as="h2"
        ref={ref}
        tabIndex={0}
        id="native-heading"
        className="consumer-heading"
        aria-describedby="hint"
        data-consumer="root"
        foreground="disabled"
        onClick={(event) => clickTargets.push(event.currentTarget)}
        onKeyDown={onKeyDown}
      >
        Accessible heading
      </Text>
      <span id="hint">Native heading description</span>
    </CoreAIFluentProvider>,
  );
  const heading = screen.getByRole('heading', { level: 2, name: 'Accessible heading' });
  const root = heading.element();
  expect(ref.current).toBe(root);
  expect(root).toHaveClass(textClassNames.root, 'consumer-heading');
  expect(root).toHaveAttribute('id', 'native-heading');
  expect(root).toHaveAttribute('aria-describedby', 'hint');
  expect(root).toHaveAttribute('data-consumer', 'root');
  expect(root).not.toHaveAttribute('aria-disabled');
  await userEvent.click(heading);
  expect(clickTargets).toEqual([root]);
  await expect.element(heading).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(clickTargets).toEqual([root]);
});

test('preserves callback refs through unmount and native children without adding wrappers', async () => {
  const ref = vi.fn();
  const child = <em data-testid="child">Caller child</em>;
  const screen = await render(
    <Text ref={ref}>
      {0} {child}
    </Text>,
  );
  const root = screen.container.firstElementChild;
  expect(root?.tagName).toBe('SPAN');
  expect(root?.textContent).toBe('0 Caller child');
  expect(root?.children).toHaveLength(1);
  expect(root?.firstElementChild).toBe(screen.getByTestId('child').element());
  expect(ref).toHaveBeenLastCalledWith(root);
  await screen.unmount();
  expect(ref).toHaveBeenLastCalledWith(null);
});

test('keeps visual props off the DOM and supports ordinary CSS Modules and inline overrides', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Text {...textConsumerExample.props} data-testid="consumer" />
      <Text
        {...textConsumerExample.props}
        data-testid="inline"
        style={{ color: 'rgb(100, 30, 60)', letterSpacing: '3px', fontSize: '24px' }}
      />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByTestId('consumer').element();
  const styles = getComputedStyle(root);
  expect(styles.color).toBe('rgb(20, 90, 160)');
  expect(styles.fontFamily).toContain('Georgia');
  expect(styles.fontSize).toBe('22px');
  expect(styles.fontWeight).toBe('400');
  expect(styles.fontStyle).toBe('normal');
  expect(styles.lineHeight).toBe('30px');
  expect(styles.letterSpacing).toBe('2px');
  expect(styles.textTransform).toBe('lowercase');
  expect(styles.textDecorationLine).toBe('none');
  expect(styles.textAlign).toBe('center');
  expect(styles.whiteSpace).toBe('normal');
  expect(styles.overflow).toBe('visible');
  expect(styles.textOverflow).toBe('clip');
  const inline = getComputedStyle(screen.getByTestId('inline').element());
  expect(inline.color).toBe('rgb(100, 30, 60)');
  expect(inline.letterSpacing).toBe('3px');
  expect(inline.fontSize).toBe('24px');
  for (const prop of [
    'as',
    'align',
    'block',
    'font',
    'italic',
    'size',
    'strikethrough',
    'truncate',
    'underline',
    'weight',
    'wrap',
    'foreground',
    'uppercase',
    'preset',
  ]) {
    expect(root, prop).not.toHaveAttribute(prop);
  }
});
