// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  Persona as RawPersona,
  type PersonaProps as HeadlessPersonaProps,
} from '@fluentui/react-headless-components-preview/persona';
import { AvatarContextProvider } from '@fluentui/react-headless-components-preview/avatar';
import type { ExtractSlotProps, ForwardRefComponent } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  PersonaComparison,
  PersonaProfileFlow,
  personaAvatarRenderer,
  personaBrokenImage,
  personaConsumerExample,
  personaExamples,
  personaInlineImage,
  personaOutOfOfficeExample,
  personaPresenceOutOfOfficeExample,
  personaPresenceRenderer,
  personaRootRenderer,
  personaTextRenderer,
  type PersonaExample,
} from '../../../apps/storybook/src/stories/experiments/PersonaComparison.js';
import {
  capturePersonaStyles,
  comparePersonaStyles,
  getComparisonPersona,
  getPersonaSlots,
  settlePersonaStyles,
} from '../../../apps/storybook/src/stories/experiments/comparePersonaStyles.js';
import {
  Persona,
  personaClassNames,
  type PersonaProps,
  type PersonaSize,
  type PersonaSlots,
} from './Persona.js';
import { avatarClassNames } from './Avatar.js';
import { presenceBadgeClassNames } from './PresenceBadge.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: PersonaExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<PersonaComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonPersona(screen.container, 'legacy');
  const headless = getComparisonPersona(screen.container, 'headless');
  await Promise.all([settlePersonaStyles(legacy), settlePersonaStyles(headless)]);
  return { screen, legacy, headless };
}

test('reports every captured CSS string, offset, dimension and missing value exactly', () => {
  expect(
    comparePersonaStyles(
      {
        'root.width': '210.00',
        'root.height': '40.00',
        'primaryText.font-size': '14px',
        'avatar.offset-left': '0.00',
        'presence.present': 'true',
        'status.aria-label': 'available',
      },
      {
        'root.width': '210.01',
        'root.height': '40.50',
        'primaryText.font-size': '14.01px',
        'avatar.offset-left': '0.01',
        'presence.present': 'false',
      },
    ),
  ).toEqual([
    { property: 'root.width', legacy: '210.00', headless: '210.01' },
    { property: 'root.height', legacy: '40.00', headless: '40.50' },
    { property: 'primaryText.font-size', legacy: '14px', headless: '14.01px' },
    { property: 'avatar.offset-left', legacy: '0.00', headless: '0.01' },
    { property: 'presence.present', legacy: 'true', headless: 'false' },
    { property: 'status.aria-label', legacy: 'available', headless: null },
  ]);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(personaExamples)(
    `matches $name selected slot styles and geometry in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        comparePersonaStyles(capturePersonaStyles(legacy), capturePersonaStyles(headless)),
      ).toEqual(example.intentionalDifferences ?? []);
      for (const slot of [
        'primaryText',
        'secondaryText',
        'tertiaryText',
        'quaternaryText',
      ] as const) {
        expect(headless[slot]?.textContent).toBe(legacy[slot]?.textContent);
      }
      if (headless.avatar) expect(headless.avatar).toHaveClass(avatarClassNames.root);
      if (headless.presence) expect(headless.presence).toHaveClass(presenceBadgeClassNames.root);
      expect(headless.root).toHaveAttribute(
        'data-text-position',
        example.props.textPosition ?? 'after',
      );
    },
  );

  test(`lets ordinary consumer CSS override root, avatar and text slots in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(personaConsumerExample, theme);
    const values = capturePersonaStyles(headless);
    expect(values['root.display']).toBe('grid');
    expect(values['root.justify-items']).toBe('center');
    expect(values['avatar.border-radius']).toBe('3px');
    expect(values['avatar.margin-inline-end']).toBe('14px');
    expect(values['primaryText.font-size']).toBe('18px');
    expect(values['primaryText.font-weight']).toBe('700');
    expect(values['primaryText.line-height']).toBe('24px');
    expect(values['primaryText.color']).toBe('rgb(35, 95, 155)');
    expect(values['secondaryText.color']).toBe('rgb(130, 45, 80)');
    expect(values['secondaryText.margin-block-start']).toBe('2px');
    expect(comparePersonaStyles(capturePersonaStyles(legacy), values).length).toBeGreaterThan(0);
  });

  test.each([true, false])(
    `keeps actual Fluent Persona defaults and its unwrapped Avatar background in ${mode} mode with component defaults=%s`,
    async (withComponentDefaults) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'No Persona default override',
          props: {
            name: 'Ada Lovelace',
            size: undefined,
            textAlignment: undefined,
            textPosition: undefined,
            presenceOnly: undefined,
          },
        },
        theme,
        withComponentDefaults,
      );
      expect(
        comparePersonaStyles(capturePersonaStyles(legacy), capturePersonaStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute('data-size', 'medium');
      expect(headless.root).toHaveAttribute('data-text-alignment', 'start');
      expect(headless.root).not.toHaveAttribute('data-presence-only');
      expect(headless.avatar).toHaveAttribute('data-size', '32');
      if (!headless.avatar) throw new Error('Missing default Persona Avatar');
      expect(
        getComputedStyle(headless.avatar).getPropertyValue('--coreai-Avatar-background').trim(),
      ).toBe(theme.colorNeutralBackground6);
      expect(
        getComputedStyle(headless.avatar).getPropertyValue('--colorNeutralBackground4').trim(),
      ).not.toBe(theme.colorNeutralBackground6);
    },
  );
}

test.each(['after', 'before', 'below'] as const)(
  'preserves RTL %s layout, logical coin spacing and native initials order',
  async (textPosition) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'RTL',
        props: {
          name: 'Ada Lovelace',
          textPosition,
          textAlignment: 'center',
          presence: { status: 'away' },
          secondaryText: 'Design systems',
          tertiaryText: 'Seattle',
        },
      },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(
      comparePersonaStyles(capturePersonaStyles(legacy), capturePersonaStyles(headless)),
    ).toEqual([]);
    expect(headless.avatar?.querySelector('.fui-Avatar__initials')).toHaveTextContent('LA');
    expect(getComputedStyle(headless.root).direction).toBe('rtl');
  },
);

test('retains the current raw name-to-text, text-position, native event and root ref contract', async () => {
  const styledRef = React.createRef<HTMLDivElement>();
  const rawRef = React.createRef<HTMLDivElement>();
  const click = vi.fn();
  const screen = await renderCoreAIComponent(
    <>
      <Persona
        ref={styledRef}
        name="Ada Lovelace"
        textPosition="before"
        role="group"
        aria-label="Styled identity"
        onClick={click}
      />
      <RawPersona ref={rawRef} name="Ada Lovelace" textPosition="before" />
    </>,
  );
  const styled = styledRef.current;
  const raw = rawRef.current;
  if (!styled || !raw) throw new Error('Missing current Persona fixtures');
  expect(styled.tagName).toBe(raw.tagName);
  expect(styled.getAttribute('data-text-position')).toBe(raw.getAttribute('data-text-position'));
  expect(getPersonaSlots(styled).primaryText?.textContent).toBe(raw.children[0]?.textContent);
  expect(styled.lastElementChild).toBe(getPersonaSlots(styled).avatar);
  expect(raw.lastElementChild?.getAttribute('role')).toBe('img');
  await userEvent.click(screen.getByRole('group', { name: 'Styled identity' }));
  expect(click).toHaveBeenCalledOnce();
});

test('preserves caller render functions, classes, owned slot markers, refs, ARIA and native events', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const avatarRef = React.createRef<HTMLSpanElement>();
  const primaryRef = React.createRef<HTMLSpanElement>();
  const secondaryRef = React.createRef<HTMLSpanElement>();
  const tertiaryRef = React.createRef<HTMLSpanElement>();
  const quaternaryRef = React.createRef<HTMLSpanElement>();
  const click = vi.fn();
  const keydown = vi.fn();
  const avatarClick = vi.fn();
  const avatar: ExtractSlotProps<PersonaSlots['avatar']> & {
    'data-persona-caller': string;
  } = {
    ref: avatarRef,
    className: 'caller-avatar',
    'data-persona-caller': 'avatar',
    children: personaAvatarRenderer,
    onClick: avatarClick,
    'aria-label': 'Caller identity',
  };
  const screen = await renderCoreAIComponent(
    <Persona
      ref={rootRef}
      id="caller-persona"
      title="Identity details"
      name="Ada Lovelace"
      role="group"
      aria-label="Caller profile"
      tabIndex={0}
      className="caller-root"
      style={{ opacity: 0.75 }}
      size="large"
      textAlignment="center"
      avatar={avatar}
      primaryText={{
        ref: primaryRef,
        className: 'caller-primary',
        children: personaTextRenderer,
      }}
      secondaryText={{ ref: secondaryRef, className: 'caller-secondary', children: 'Designer' }}
      tertiaryText={{ ref: tertiaryRef, className: 'caller-tertiary', children: 'Design systems' }}
      quaternaryText={{ ref: quaternaryRef, className: 'caller-quaternary', children: 'Seattle' }}
      onClick={click}
      onKeyDown={keydown}
      children={personaRootRenderer}
    />,
  );
  const root = rootRef.current;
  if (!root) throw new Error('Missing caller Persona');
  const slots = getPersonaSlots(root);
  expect(root).toHaveClass(personaClassNames.root, 'caller-root');
  expect(root).toHaveAttribute('data-rendered-persona-root', '');
  expect(root).toHaveAttribute('id', 'caller-persona');
  expect(root).toHaveAttribute('title', 'Identity details');
  expect(root).toHaveAttribute('data-size', 'large');
  expect(root).toHaveAttribute('data-text-alignment', 'center');
  expect(root).toHaveAttribute('data-text-lines', '4');
  expect(root).not.toHaveAttribute('size');
  expect(root).not.toHaveAttribute('textAlignment');
  expect(root).not.toHaveAttribute('presenceOnly');
  expect(getComputedStyle(root).opacity).toBe('0.75');
  for (const [name, reference, callerClass] of [
    ['avatar', avatarRef, 'caller-avatar'],
    ['primaryText', primaryRef, 'caller-primary'],
    ['secondaryText', secondaryRef, 'caller-secondary'],
    ['tertiaryText', tertiaryRef, 'caller-tertiary'],
    ['quaternaryText', quaternaryRef, 'caller-quaternary'],
  ] as const) {
    expect(slots[name]).toBe(reference.current);
    expect(reference.current).toHaveClass(personaClassNames[name], callerClass);
  }
  expect(avatarRef.current).toHaveClass(avatarClassNames.root);
  expect(avatarRef.current).toHaveAttribute('data-rendered-persona-avatar', '');
  expect(avatarRef.current).toHaveAttribute('data-persona-caller', 'avatar');
  expect(primaryRef.current).toHaveAttribute('data-rendered-persona-text', '');
  expect(primaryRef.current).toHaveTextContent('Ada Lovelace');
  await userEvent.click(screen.getByRole('img', { name: 'Caller identity', exact: true }));
  expect(avatarClick).toHaveBeenCalledOnce();
  expect(click).toHaveBeenCalledOnce();
  root.focus();
  await userEvent.keyboard('{Enter}');
  expect(keydown).toHaveBeenCalledOnce();
  expect(keydown.mock.calls[0][0].key).toBe('Enter');
  expect(click).toHaveBeenCalledOnce();
});

test('composes a caller-rendered PresenceBadge with its exact status, ref and native event', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const presenceRef = React.createRef<HTMLDivElement>();
  const click = vi.fn();
  const presence: ExtractSlotProps<PersonaSlots['presence']> & {
    'data-persona-caller': string;
  } = {
    ref: presenceRef,
    status: 'away',
    size: 'large',
    className: 'caller-presence',
    'data-persona-caller': 'presence',
    children: personaPresenceRenderer,
    onClick: click,
  };
  const screen = await renderCoreAIComponent(
    <Persona ref={rootRef} name="Ada Lovelace" presenceOnly presence={presence} />,
  );
  if (!rootRef.current) throw new Error('Missing presence-only Persona');
  const slots = getPersonaSlots(rootRef.current);
  expect(slots.avatar).toBeNull();
  expect(slots.presence).toBe(presenceRef.current);
  expect(slots.presence).toHaveClass(
    personaClassNames.presence,
    presenceBadgeClassNames.root,
    'caller-presence',
  );
  expect(slots.presence).toHaveAttribute('data-size', 'large');
  expect(slots.presence).toHaveAttribute('data-status', 'away');
  expect(slots.presence).toHaveAttribute('data-persona-caller', 'presence');
  expect(slots.presence).toHaveAttribute('data-rendered-persona-presence', '');
  await userEvent.click(screen.getByRole('img', { name: 'away', exact: true }));
  expect(click).toHaveBeenCalledOnce();
});

test('delegates current out-of-office names to the completed status and avatar foundations', async () => {
  for (const example of [personaOutOfOfficeExample, personaPresenceOutOfOfficeExample]) {
    const { screen, legacy, headless } = await renderPair(example);
    expect(
      comparePersonaStyles(capturePersonaStyles(legacy), capturePersonaStyles(headless)),
    ).toEqual(example.intentionalDifferences);
    if (headless.avatar) {
      expect(legacy.avatar).toHaveAccessibleName('Ada Lovelace available');
      expect(headless.avatar).toHaveAccessibleName('Ada Lovelace available out of office');
    } else {
      expect(legacy.presence).toHaveAccessibleName('available');
      expect(headless.presence).toHaveAccessibleName('available out of office');
    }
    await screen.unmount();
  }
});

test('preserves decorative avatar usage while leaving visible identity text accessible', async () => {
  const screen = await renderCoreAIComponent(
    <Persona
      name="Ada Lovelace"
      avatar={{ role: 'presentation', 'aria-hidden': true }}
      secondaryText="Designer"
    />,
  );
  await expect.element(screen.getByRole('img')).not.toBeInTheDocument();
  await expect.element(screen.getByText('Ada Lovelace', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Designer', { exact: true })).toBeVisible();
  const avatar = screen.container.querySelector('.fui-Avatar');
  expect(avatar).toHaveAttribute('role', 'presentation');
  expect(avatar).toHaveAttribute('aria-hidden', 'true');
});

test('keeps Persona size precedence and the current Avatar shape/explicit-undefined context contract', async () => {
  const reference = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <AvatarContextProvider value={{ size: 64, shape: 'square' }}>
      <Persona ref={reference} name="Ada Lovelace" size="large" />
    </AvatarContextProvider>,
  );
  if (!reference.current) throw new Error('Missing context Persona');
  expect(getPersonaSlots(reference.current).avatar).toHaveAttribute('data-size', '36');
  expect(getPersonaSlots(reference.current).avatar).toHaveAttribute('data-shape', 'square');
  await screen.rerender(
    <AvatarContextProvider value={{ size: 64, shape: 'square' }}>
      <Persona ref={reference} name="Ada Lovelace" size="large" avatar={{ size: undefined }} />
    </AvatarContextProvider>,
  );
  expect(getPersonaSlots(reference.current).avatar).toHaveAttribute('data-size', '64');
});

test('retains actual native wrapping and caller-requested ellipsis rather than inventing text props', async () => {
  for (const name of ['Native text wrapping', 'Native text ellipsis']) {
    const example = personaExamples.find((value) => value.name === name);
    if (!example) throw new Error(`Missing ${name} fixture`);
    const { screen, headless } = await renderPair(example);
    const primary = headless.primaryText;
    if (!primary) throw new Error('Missing native text fixture');
    if (name === 'Native text wrapping') {
      expect(primary.getBoundingClientRect().height).toBeGreaterThan(
        Number.parseFloat(getComputedStyle(primary).lineHeight),
      );
      expect(getComputedStyle(primary).whiteSpace).toBe('normal');
    } else {
      expect(primary.scrollWidth).toBeGreaterThan(primary.clientWidth);
      expect(getComputedStyle(primary).textOverflow).toBe('ellipsis');
      expect(getComputedStyle(primary).whiteSpace).toBe('nowrap');
    }
    await screen.unmount();
  }
});

test('keeps native image callbacks, refs, failure fallback and recovery in the Avatar primitive', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const imageRef = React.createRef<HTMLImageElement>();
  const error = vi.fn();
  const load = vi.fn();
  const render = (src: string) => (
    <Persona
      ref={rootRef}
      name="Ada Lovelace"
      presence={{ status: 'available' }}
      avatar={{ image: { ref: imageRef, src, onError: error, onLoad: load } }}
    />
  );
  const screen = await renderCoreAIComponent(render(personaBrokenImage));
  await expect.poll(() => error.mock.calls.length).toBe(1);
  expect(load).not.toHaveBeenCalled();
  expect(imageRef.current).toBeInstanceOf(HTMLImageElement);
  expect(imageRef.current?.hidden).toBe(true);
  expect(rootRef.current?.querySelector('.fui-Avatar__initials')).toHaveTextContent('AL');
  expect(rootRef.current?.querySelector('.fui-Avatar')).toHaveAccessibleName(
    'Ada Lovelace available',
  );
  const image = imageRef.current;
  await screen.rerender(render(personaInlineImage));
  await expect.poll(() => load.mock.calls.length).toBe(1);
  expect(imageRef.current).toBe(image);
  expect(imageRef.current?.hidden).toBe(false);
  expect(imageRef.current).toHaveAttribute('role', 'presentation');
  expect(imageRef.current).toHaveAttribute('aria-hidden', 'true');
  expect(error).toHaveBeenCalledOnce();
});

test('updates identity, presence and optional content through real native controls', async () => {
  const screen = await renderCoreAIComponent(<PersonaProfileFlow />);
  await expect
    .element(screen.getByRole('img', { name: 'Ada Lovelace available', exact: true }))
    .toBeVisible();
  const input = screen.getByRole('textbox', { name: 'Display name' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Grace Hopper');
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Availability' }), 'busy');
  await expect
    .element(screen.getByRole('img', { name: 'Grace Hopper busy', exact: true }))
    .toBeVisible();
  expect(screen.container.querySelector('.fui-Avatar__initials')).toHaveTextContent('GH');
  await userEvent.click(screen.getByRole('button', { name: 'Show more details' }));
  await expect.element(screen.getByText('Design systems', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Seattle · UTC−8', { exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('status', { name: 'Profile changes' }))
    .toHaveTextContent('Grace Hopper · busy · 4 lines');
  await userEvent.click(screen.getByRole('button', { name: 'Show presence only' }));
  expect(screen.container.querySelector('.fui-Persona__avatar')).toBeNull();
  await expect.element(screen.getByRole('img', { name: 'busy', exact: true })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Show presence only' }));
  await userEvent.click(screen.getByRole('button', { name: 'Show more details' }));
  expect(screen.container.querySelector('.fui-Persona__tertiaryText')).toBeNull();
  expect(screen.container.querySelector('.fui-Persona__quaternaryText')).toBeNull();
  await expect
    .element(screen.getByRole('img', { name: 'Grace Hopper busy', exact: true }))
    .toBeVisible();
  await userEvent.clear(input);
  await expect
    .element(screen.getByRole('img', { name: 'Guest avatar', exact: true }))
    .toBeVisible();
  expect(screen.container.querySelector('.fui-Avatar__icon svg')).not.toBeNull();
});

test('exposes current public component, native ref and visual prop types without legacy state APIs', () => {
  expectTypeOf(Persona).toEqualTypeOf<ForwardRefComponent<PersonaProps>>();
  expectTypeOf<PersonaProps['primaryText']>().toEqualTypeOf<HeadlessPersonaProps['primaryText']>();
  expectTypeOf<PersonaProps['secondaryText']>().toEqualTypeOf<
    HeadlessPersonaProps['secondaryText']
  >();
  expectTypeOf<PersonaProps['tertiaryText']>().toEqualTypeOf<
    HeadlessPersonaProps['tertiaryText']
  >();
  expectTypeOf<PersonaProps['quaternaryText']>().toEqualTypeOf<
    HeadlessPersonaProps['quaternaryText']
  >();
  expectTypeOf<PersonaProps['textPosition']>().toEqualTypeOf<
    HeadlessPersonaProps['textPosition']
  >();
  expectTypeOf<PersonaProps['onClick']>().toEqualTypeOf<HeadlessPersonaProps['onClick']>();
  expectTypeOf<PersonaSize>().toEqualTypeOf<NonNullable<PersonaProps['size']>>();
  expectTypeOf<React.ComponentProps<typeof Persona>['ref']>().toEqualTypeOf<
    React.Ref<HTMLDivElement> | undefined
  >();
});
