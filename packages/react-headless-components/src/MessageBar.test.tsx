// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  MessageBar as PrimitiveMessageBar,
  MessageBarActions as PrimitiveMessageBarActions,
  MessageBarBody as PrimitiveMessageBarBody,
  MessageBarTitle as PrimitiveMessageBarTitle,
  useMessageBarContext,
  type MessageBarSlots as PrimitiveMessageBarSlots,
  type MessageBarActionsSlots as PrimitiveMessageBarActionsSlots,
  type MessageBarBodySlots as PrimitiveMessageBarBodySlots,
  type MessageBarTitleSlots as PrimitiveMessageBarTitleSlots,
} from '@fluentui/react-headless-components-preview/message-bar';
import { useButtonContext } from '@fluentui/react-headless-components-preview/button';
import { useLinkContext } from '@fluentui/react-headless-components-preview/link';
import { AnnounceProvider } from '@fluentui/react-shared-contexts';
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
import {
  MessageBarComparison,
  MessageBarNotificationsFlow,
  MessageBarReflowFormFlow,
  messageBarConsumerExample,
  messageBarExamples,
  type MessageBarExample,
} from '../../../apps/storybook/src/stories/experiments/MessageBarComparison.js';
import {
  captureMessageBarStyles,
  compareMessageBarStyles,
  getComparisonMessageBar,
  getMessageBarSlots,
  settleMessageBarStyles,
} from '../../../apps/storybook/src/stories/experiments/compareMessageBarStyles.js';
import {
  MessageBar,
  messageBarClassNames,
  type MessageBarProps,
  type MessageBarSlots,
} from './MessageBar.js';
import {
  MessageBarActions,
  messageBarActionsClassNames,
  type MessageBarActionsProps,
  type MessageBarActionsSlots,
} from './MessageBarActions.js';
import {
  MessageBarBody,
  messageBarBodyClassNames,
  type MessageBarBodyProps,
  type MessageBarBodySlots,
} from './MessageBarBody.js';
import {
  MessageBarTitle,
  messageBarTitleClassNames,
  type MessageBarTitleProps,
  type MessageBarTitleSlots,
} from './MessageBarTitle.js';
import { Button } from './Button.js';
import { Link } from './Link.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: MessageBarExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <MessageBarComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('MessageBar fixtures', { exact: true }));
  const legacy = getComparisonMessageBar(screen.container, 'legacy');
  const headless = getComparisonMessageBar(screen.container, 'headless');
  await Promise.all([settleMessageBarStyles(legacy), settleMessageBarStyles(headless)]);
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  return { screen, legacy, headless };
}

test('preserves all four current slot/ref contracts, restoring only shape and brand visual props', () => {
  expectTypeOf<typeof MessageBar>().toEqualTypeOf<ForwardRefComponent<MessageBarProps>>();
  expectTypeOf<typeof MessageBarActions>().toEqualTypeOf<
    ForwardRefComponent<MessageBarActionsProps>
  >();
  expectTypeOf<typeof MessageBarBody>().toEqualTypeOf<ForwardRefComponent<MessageBarBodyProps>>();
  expectTypeOf<typeof MessageBarTitle>().toEqualTypeOf<ForwardRefComponent<MessageBarTitleProps>>();
  expectTypeOf<React.ComponentProps<typeof MessageBar>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveMessageBar>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof MessageBarActions>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveMessageBarActions>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof MessageBarBody>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveMessageBarBody>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof MessageBarTitle>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveMessageBarTitle>['ref']
  >();
  expectTypeOf<MessageBarSlots>().toEqualTypeOf<PrimitiveMessageBarSlots>();
  expectTypeOf<MessageBarActionsSlots>().toEqualTypeOf<PrimitiveMessageBarActionsSlots>();
  expectTypeOf<MessageBarBodySlots>().toEqualTypeOf<PrimitiveMessageBarBodySlots>();
  expectTypeOf<MessageBarTitleSlots>().toEqualTypeOf<PrimitiveMessageBarTitleSlots>();
  expectTypeOf<MessageBarProps['shape']>().toEqualTypeOf<'rounded' | 'square' | undefined>();
  expectTypeOf<MessageBarProps['as']>().toEqualTypeOf<'div' | undefined>();
  expectTypeOf<MessageBarTitleProps['as']>().toEqualTypeOf<'span' | undefined>();
  expectTypeOf<
    Extract<keyof MessageBarProps, 'size' | 'animate' | 'defaultOpen' | 'onDismiss' | 'focusMode'>
  >().toEqualTypeOf<never>();
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(messageBarExamples)(
    `matches $name and slot geometry in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareMessageBarStyles(captureMessageBarStyles(legacy), captureMessageBarStyles(headless)),
      ).toEqual([]);
      expect(headless.tagName).toBe('DIV');
      expect(headless).toHaveAttribute('role', 'group');
      expect(headless).toHaveAttribute('data-shape', example.props?.shape ?? 'rounded');
      expect(headless).toHaveAttribute('data-intent', example.props?.intent ?? 'info');
      expect(headless).not.toHaveAttribute('shape');
      expect(headless).not.toHaveAttribute('intent');
      expect(headless).not.toHaveAttribute('aria-live');
      expect(headless.querySelector('[focusgroup]')).toBeNull();
      const { title, icon } = getMessageBarSlots(headless);
      if (example.actions === 'dismiss') {
        const { actions, containerAction } = getMessageBarSlots(headless);
        if (!actions || !containerAction) throw new Error('Dismiss-only slots are missing');
        expect(getComputedStyle(actions).display).toBe('none');
        expect(actions.getClientRects()).toHaveLength(0);
        expect(containerAction.getClientRects().length).toBeGreaterThan(0);
        expect(captureMessageBarStyles(headless)['actions.rect.present']).toBe('false');
        expect(captureMessageBarStyles(headless)['actions.rect.width']).toBe('0.00');
        expect(captureMessageBarStyles(headless)['actions.rect.top']).toBe('not laid out');
      }
      expect(title?.tagName).toBe('SPAN');
      expect(title?.id).toBe(headless.getAttribute('aria-labelledby'));
      expect(headless).toHaveAccessibleName('Workspace update');
      if (icon) {
        expect(icon.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(icon.querySelector('path')?.getAttribute('d')).toBe(
          getMessageBarSlots(legacy).icon?.querySelector('path')?.getAttribute('d'),
        );
      }
      if (example.renderedSlots) {
        for (const name of ['icon', 'body', 'title', 'container', 'spacer']) {
          expect(headless.querySelector(`[data-messagebar-rendered-${name}]`)).not.toBeNull();
        }
      }
    },
  );
}

for (const dir of ['ltr', 'rtl'] as const) {
  test.each([true, false])(
    `retains brand intent, rounded defaults, and logical spacing in ${dir} with defaults=%s`,
    async (defaults) => {
      const { legacy, headless } = await renderPair(
        { name: 'Brand defaults', props: { intent: 'brand', layout: 'multiline' } },
        coreaiLightTheme,
        dir,
        defaults,
      );
      expect(
        compareMessageBarStyles(captureMessageBarStyles(legacy), captureMessageBarStyles(headless)),
      ).toEqual([]);
      expect(headless).toHaveAttribute('data-intent', 'brand');
      expect(headless).toHaveAttribute('data-shape', 'rounded');
      const { icon, body, containerAction } = getMessageBarSlots(headless);
      if (!icon || !body || !containerAction) throw new Error('Brand slots are missing');
      expect(getComputedStyle(icon).marginInlineEnd).toBe('8px');
      expect(getComputedStyle(body).paddingInlineEnd).toBe('12px');
      expect(getComputedStyle(containerAction).paddingInlineEnd).toBe('12px');
      expect(getComputedStyle(headless).paddingInlineStart).toBe('12px');
      expect(getComputedStyle(headless).paddingInlineEnd).toBe('0px');
    },
  );
}

test('keeps bounded comparisons sensitive to an actual missing style or geometry regression', () => {
  const original = { 'root.border-radius': '4px', 'body.rect.width': '240.00' };
  expect(
    compareMessageBarStyles(original, {
      'root.border-radius': '0px',
      'body.rect.width': '241.00',
    }),
  ).toEqual([
    { property: 'root.border-radius', legacy: '4px', headless: '0px' },
    { property: 'body.rect.width', legacy: '240.00', headless: '241.00' },
  ]);
});

test('allows ordinary consumer CSS to override brand, body/title/link, and sibling action slots', async () => {
  const { legacy, headless } = await renderPair(messageBarConsumerExample);
  const slots = getMessageBarSlots(headless);
  expect(getComputedStyle(headless).backgroundColor).toBe('rgb(237, 232, 247)');
  expect(getComputedStyle(headless).borderTopWidth).toBe('3px');
  expect(getComputedStyle(headless).borderTopColor).toBe('rgb(98, 42, 139)');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(headless).paddingInlineStart).toBe('17px');
  if (!slots.icon || !slots.body || !slots.title || !slots.actions || !slots.containerAction) {
    throw new Error('Consumer fixture slots are missing');
  }
  expect(getComputedStyle(slots.icon).fontSize).toBe('18px');
  expect(getComputedStyle(slots.icon).color).toBe('rgb(80, 40, 120)');
  expect(getComputedStyle(slots.body).paddingInlineEnd).toBe('19px');
  expect(getComputedStyle(slots.body).fontSize).toBe('13px');
  expect(getComputedStyle(slots.title).fontWeight).toBe('400');
  expect(getComputedStyle(slots.actions).paddingInlineEnd).toBe('17px');
  expect(getComputedStyle(slots.containerAction).paddingInlineEnd).toBe('9px');
  expect(slots.containerAction.parentElement).toBe(headless);
  expect(slots.containerAction.parentElement).not.toBe(slots.actions);
  expect(
    compareMessageBarStyles(captureMessageBarStyles(legacy), captureMessageBarStyles(headless))
      .length,
  ).toBeGreaterThan(0);
});

test('preserves opt-in CSS truncation without inventing a MessageBar truncation prop', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Bounded single line',
    props: { layout: 'singleline' },
    longText: true,
    truncate: true,
  });
  for (const root of [legacy, headless]) root.style.width = '260px';
  await Promise.all([settleMessageBarStyles(legacy), settleMessageBarStyles(headless)]);
  const { body } = getMessageBarSlots(headless);
  if (!body) throw new Error('Truncation body is missing');
  expect(body.scrollWidth).toBeGreaterThan(body.clientWidth);
  expect(getComputedStyle(body).textOverflow).toBe('ellipsis');
  expect(getComputedStyle(body).overflow).toBe('hidden');
  expect(
    compareMessageBarStyles(captureMessageBarStyles(legacy), captureMessageBarStyles(headless)),
  ).toEqual([]);
});

test('reflows both implementations on local width changes and restores the single-line grid', async () => {
  const { legacy, headless } = await renderPair({
    name: 'ResizeObserver reflow',
    props: { layout: 'auto' },
    longText: true,
  });
  for (const width of [1100, 260, 1100]) {
    for (const root of [legacy, headless]) root.style.width = `${width}px`;
    await Promise.all([settleMessageBarStyles(legacy), settleMessageBarStyles(headless)]);
    const multiline = width === 260;
    expect(headless).toHaveAttribute('data-layout', multiline ? 'multiline' : 'singleline');
    expect(getComputedStyle(legacy).whiteSpace).toBe(multiline ? 'normal' : 'nowrap');
    expect(Boolean(getMessageBarSlots(headless).bottomReflowSpacer)).toBe(multiline);
    expect(
      compareMessageBarStyles(captureMessageBarStyles(legacy), captureMessageBarStyles(headless)),
    ).toEqual([]);
  }
});

test('keeps caller refs, slot render functions, stable markers, and click event identity through layout updates', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const bodyRef = React.createRef<HTMLDivElement>();
  const titleRef = React.createRef<HTMLSpanElement>();
  const actionsRef = React.createRef<HTMLDivElement>();
  const containerRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLDivElement>();
  const spacerRef = React.createRef<HTMLDivElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const rootCurrentTargets: HTMLDivElement[] = [];
  const actionCurrentTargets: HTMLButtonElement[] = [];
  const onRootClick = vi.fn((event: React.MouseEvent<HTMLDivElement>) => {
    rootCurrentTargets.push(event.currentTarget);
  });
  const onActionClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
    actionCurrentTargets.push(event.currentTarget);
  });
  const iconRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarSlots['icon']>> = (
    Component,
    props,
  ) => <Component {...props} data-caller-icon />;
  const spacerRenderer: SlotRenderFunction<
    ExtractSlotProps<MessageBarSlots['bottomReflowSpacer']>
  > = (Component, props) => <Component {...props} data-caller-spacer />;
  const titleRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarTitleSlots['root']>> = (
    Title,
    titleProps,
  ) => (
    <Title {...titleProps} data-caller-title>
      Caller title
    </Title>
  );
  const bodyRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarBodySlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-caller-body>
      <MessageBarTitle ref={titleRef} id="caller-message-title" className="caller-title">
        {titleRenderer}
      </MessageBarTitle>{' '}
      Caller detail
    </Component>
  );
  const containerRenderer: SlotRenderFunction<
    ExtractSlotProps<MessageBarActionsSlots['containerAction']>
  > = (Component, props) => (
    <Component {...props} data-caller-container>
      <button type="button">Dismiss caller</button>
    </Component>
  );
  const actionsRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarActionsSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-caller-actions>
      <Button ref={buttonRef} type="button" size="small" onClick={onActionClick}>
        Perform action
      </Button>
    </Component>
  );
  function SlotFlow() {
    const [layout, setLayout] = React.useState<'singleline' | 'multiline'>('multiline');
    return (
      <>
        <button type="button" onClick={() => setLayout('singleline')}>
          Change layout
        </button>
        <MessageBar
          ref={rootRef}
          layout={layout}
          aria-labelledby="caller-message-title"
          className="caller-root"
          onClick={onRootClick}
          icon={{ ref: iconRef, className: 'caller-icon', children: iconRenderer }}
          bottomReflowSpacer={{
            ref: spacerRef,
            className: 'caller-spacer',
            children: spacerRenderer,
          }}
        >
          <MessageBarBody ref={bodyRef} className="caller-body">
            {bodyRenderer}
          </MessageBarBody>
          <MessageBarActions
            ref={actionsRef}
            className="caller-actions"
            containerAction={{
              ref: containerRef,
              className: 'caller-container',
              children: containerRenderer,
            }}
          >
            {actionsRenderer}
          </MessageBarActions>
        </MessageBar>
      </>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <SlotFlow />
    </CoreAIFluentProvider>,
  );
  const root = rootRef.current;
  if (!root) throw new Error('Caller root ref is missing');
  expect(root).toHaveAccessibleName('Caller title');
  for (const [ref, marker, consumerClass, tagName] of [
    [rootRef, messageBarClassNames.root, 'caller-root', 'DIV'],
    [bodyRef, messageBarBodyClassNames.root, 'caller-body', 'DIV'],
    [titleRef, messageBarTitleClassNames.root, 'caller-title', 'SPAN'],
    [actionsRef, messageBarActionsClassNames.root, 'caller-actions', 'DIV'],
    [containerRef, messageBarActionsClassNames.containerAction, 'caller-container', 'DIV'],
    [iconRef, messageBarClassNames.icon, 'caller-icon', 'DIV'],
    [spacerRef, messageBarClassNames.bottomReflowSpacer, 'caller-spacer', 'DIV'],
  ] as const) {
    expect(ref.current?.tagName).toBe(tagName);
    expect(ref.current).toHaveClass(marker, consumerClass);
  }
  expect(iconRef.current?.querySelector('svg')).not.toBeNull();
  expect(containerRef.current?.parentElement).toBe(root);
  expect(containerRef.current?.nextElementSibling).toBe(actionsRef.current);
  const firstButton = buttonRef.current;
  await userEvent.click(screen.getByRole('button', { name: 'Perform action', exact: true }));
  expect(onActionClick).toHaveBeenCalledTimes(1);
  expect(onRootClick).toHaveBeenCalledTimes(1);
  expect(onActionClick.mock.calls[0][0]).toBe(onRootClick.mock.calls[0][0]);
  expect(onActionClick.mock.calls[0][0].target).toBe(firstButton);
  expect(rootCurrentTargets).toEqual([root]);
  expect(actionCurrentTargets).toEqual([firstButton]);
  await userEvent.click(screen.getByRole('button', { name: 'Change layout', exact: true }));
  expect(rootRef.current).toBe(root);
  expect(buttonRef.current).toBe(firstButton);
  expect(containerRef.current?.previousElementSibling).toBe(actionsRef.current);
  expect(root).toHaveAttribute('data-layout', 'singleline');
  await userEvent.click(screen.getByRole('button', { name: 'Perform action', exact: true }));
  expect(onActionClick).toHaveBeenCalledTimes(2);
  expect(onRootClick).toHaveBeenCalledTimes(2);
  expect(onActionClick.mock.calls[1][0]).toBe(onRootClick.mock.calls[1][0]);
  expect(rootCurrentTargets).toEqual([root, root]);
  expect(actionCurrentTargets).toEqual([firstButton, firstButton]);
});

test.each(['singleline', 'multiline'] as const)(
  'retains native Tab order and keyboard action identity in %s without a focusgroup polyfill',
  async (layout) => {
    const ref = React.createRef<HTMLButtonElement>();
    const currentTargets: HTMLButtonElement[] = [];
    const onReview = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      currentTargets.push(event.currentTarget);
    });
    const screen = await render(
      <CoreAIFluentProvider>
        <button type="button">Before message</button>
        <MessageBar layout={layout}>
          <MessageBarBody>
            <MessageBarTitle>Keyboard message</MessageBarTitle>{' '}
            <Link href="#keyboard-policy">Keyboard policy</Link>
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button type="button" size="small">
                Keyboard dismiss
              </Button>
            }
          >
            <Button ref={ref} type="button" size="small" onClick={onReview}>
              Keyboard review
            </Button>
          </MessageBarActions>
        </MessageBar>
        <button type="button">After message</button>
      </CoreAIFluentProvider>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Before message', exact: true }));
    await userEvent.click(screen.getByRole('button', { name: 'Before message', exact: true }));
    await userEvent.keyboard('{Tab}');
    expect(screen.getByRole('link', { name: 'Keyboard policy' })).toHaveFocus();
    const actionOrder =
      layout === 'multiline'
        ? ['Keyboard dismiss', 'Keyboard review']
        : ['Keyboard review', 'Keyboard dismiss'];
    for (const name of actionOrder) {
      await userEvent.keyboard('{Tab}');
      expect(screen.getByRole('button', { name, exact: true })).toHaveFocus();
      if (name === 'Keyboard review') await userEvent.keyboard('{Enter}');
    }
    await userEvent.keyboard('{Tab}');
    expect(screen.getByRole('button', { name: 'After message', exact: true })).toHaveFocus();
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(currentTargets).toEqual([ref.current]);
    expect(screen.container.querySelector('[focusgroup]')).toBeNull();
  },
);

test('preserves the root caller renderer and explicit null visual slots using the public renderer', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<MessageBarSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-caller-root-renderer>
      {props.children}
      <MessageBarBody>
        <MessageBarTitle>Rendered root</MessageBarTitle> Caller-owned composition
      </MessageBarBody>
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <MessageBar ref={ref} layout="multiline" icon={null} bottomReflowSpacer={null}>
        {renderRoot}
      </MessageBar>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('group', { name: 'Rendered root' }).element();
  expect(root).toBe(ref.current);
  expect(root).toHaveAttribute('data-caller-root-renderer');
  expect(root).toHaveAttribute('data-layout', 'multiline');
  expect(root).toHaveClass(messageBarClassNames.root);
  expect(getMessageBarSlots(root).icon).toBeNull();
  expect(getMessageBarSlots(root).bottomReflowSpacer).toBeNull();
});

function ContextProbe({ part }: { part: 'body' | 'actions' }) {
  const messageBar = useMessageBarContext();
  const button = useButtonContext();
  const link = useLinkContext();
  return (
    <output aria-label={`${part} context`}>
      {messageBar.layout}:{part === 'body' ? String(link.inline) : (button.size ?? 'unset')}
    </output>
  );
}

test.each(['raw current', 'styled local'] as const)(
  'retains public family and inline Link contexts, recording the installed Button-copy boundary in %s',
  async (implementation) => {
    const Root = implementation === 'raw current' ? PrimitiveMessageBar : MessageBar;
    const Body = implementation === 'raw current' ? PrimitiveMessageBarBody : MessageBarBody;
    const Actions =
      implementation === 'raw current' ? PrimitiveMessageBarActions : MessageBarActions;
    const Title = implementation === 'raw current' ? PrimitiveMessageBarTitle : MessageBarTitle;
    const screen = await render(
      <CoreAIFluentProvider>
        <Root layout="multiline">
          <Body>
            <Title>Context message</Title>
            <Link href="#context-policy">Context policy</Link>
            <ContextProbe part="body" />
          </Body>
          <Actions>
            <ContextProbe part="actions" />
            <Button type="button" size="small">
              Explicit action size
            </Button>
          </Actions>
        </Root>
      </CoreAIFluentProvider>,
    );
    expect(screen.getByRole('status', { name: 'body context' })).toHaveTextContent(
      'multiline:true',
    );
    // Both facades resolve distinct installed react-button 9.11.3 copies; no context shim is added.
    expect(screen.getByRole('status', { name: 'actions context' })).toHaveTextContent(
      'multiline:unset',
    );
    expect(screen.getByRole('button', { name: 'Explicit action size' })).toHaveAttribute(
      'data-size',
      'small',
    );
    expect(screen.getByRole('link', { name: 'Context policy' })).toHaveAttribute('data-inline');
  },
);

test.each([
  ['info', true],
  ['brand', true],
  ['warning', false],
  ['error', false],
  ['success', false],
] as const)(
  'announces the resolved %s preset through the application provider',
  async (intent, polite) => {
    const announce = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <AnnounceProvider value={{ announce }}>
          <MessageBar intent={intent}>
            <MessageBarBody>
              <MessageBarTitle>Status</MessageBarTitle> Policy saved.
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <button type="button" aria-label="Dismiss status">
                  ×
                </button>
              }
            >
              <button type="button">Review</button>
            </MessageBarActions>
          </MessageBar>
        </AnnounceProvider>
      </CoreAIFluentProvider>,
    );
    await expect
      .poll(() => announce.mock.calls)
      .toEqual([['Status Policy saved.,Review', { polite, alert: !polite }]]);
    expect(screen.getByRole('group', { name: 'Status' })).not.toHaveAttribute('aria-live');
    expect(screen.getByRole('group', { name: 'Status' })).not.toHaveAttribute('role', 'alert');
  },
);

test.each(['raw current', 'styled local'] as const)(
  'records the inherited explicit-politeness defect in %s without normalizing the native hook',
  async (implementation) => {
    const announce = vi.fn();
    const Root = implementation === 'raw current' ? PrimitiveMessageBar : MessageBar;
    const Body = implementation === 'raw current' ? PrimitiveMessageBarBody : MessageBarBody;
    const Title = implementation === 'raw current' ? PrimitiveMessageBarTitle : MessageBarTitle;
    await render(
      <CoreAIFluentProvider>
        <AnnounceProvider value={{ announce }}>
          <Root intent="error" politeness="assertive">
            <Body>
              <Title>Current boundary</Title> Error detail
            </Body>
          </Root>
        </AnnounceProvider>
      </CoreAIFluentProvider>,
    );
    // react-message-bar 9.7.9 treats a supplied string as the truthy branch of its conditional.
    await expect
      .poll(() => announce.mock.calls)
      .toEqual([['Current boundary Error detail', { polite: true, alert: false }]]);
  },
);

test.each(['raw current', 'styled local'] as const)(
  'records same-intent text update behavior and verifies safe keyed publication in %s',
  async (implementation) => {
    const announce = vi.fn();
    const Root = implementation === 'raw current' ? PrimitiveMessageBar : MessageBar;
    const Body = implementation === 'raw current' ? PrimitiveMessageBarBody : MessageBarBody;
    const Title = implementation === 'raw current' ? PrimitiveMessageBarTitle : MessageBarTitle;
    function UpdateFlow() {
      const [text, setText] = React.useState('Original detail');
      const [key, setKey] = React.useState(0);
      return (
        <>
          <button type="button" onClick={() => setText('Updated detail')}>
            Update text
          </button>
          <button type="button" onClick={() => setKey((value) => value + 1)}>
            Publish keyed update
          </button>
          <Root key={key} intent="info">
            <Body>
              <Title>Publication</Title> {text}
            </Body>
          </Root>
        </>
      );
    }
    const screen = await render(
      <CoreAIFluentProvider>
        <AnnounceProvider value={{ announce }}>
          <UpdateFlow />
        </AnnounceProvider>
      </CoreAIFluentProvider>,
    );
    await expect.poll(() => announce.mock.calls.length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Update text', exact: true }));
    expect(screen.getByRole('group', { name: 'Publication' })).toHaveTextContent('Updated detail');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    expect(announce).toHaveBeenCalledTimes(1);
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish keyed update', exact: true }),
    );
    await expect.poll(() => announce.mock.calls.length).toBe(2);
    expect(announce).toHaveBeenLastCalledWith('Publication Updated detail', {
      polite: true,
      alert: false,
    });
  },
);

test('supports consumer-controlled publication, dismissal, native links, and explicit focus restoration', async () => {
  const location = window.location.href;
  const screen = await render(
    <CoreAIFluentProvider>
      <MessageBarNotificationsFlow />
    </CoreAIFluentProvider>,
  );
  try {
    expect(screen.container.querySelector('[data-messagebar-notification]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Publish warning', exact: true }));
    expect(screen.getByRole('group', { name: 'Workspace warning' })).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>('[data-messagebar-notification]');
    if (!root) throw new Error('Published notification is missing');
    await settleMessageBarStyles(root);
    const region = screen.getByRole('region', { name: 'Workspace notifications' }).element();
    expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
      region.getBoundingClientRect().width,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Review access', exact: true }));
    expect(screen.getByRole('status', { name: 'Reviewed updates' })).toHaveTextContent(
      'Reviewed: 1',
    );
    await userEvent.click(screen.getByRole('link', { name: 'Read policy', exact: true }));
    expect(window.location.hash).toBe('#messagebar-policy');
    await userEvent.click(
      screen.getByRole('button', { name: 'Dismiss workspace update', exact: true }),
    );
    expect(screen.container.querySelector('[data-messagebar-notification]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Publish warning', exact: true })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Publish success', exact: true }));
    expect(screen.getByRole('group', { name: 'Workspace ready' })).toHaveAttribute(
      'data-intent',
      'success',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish brand update', exact: true }),
    );
    expect(screen.getByRole('group', { name: 'Workspace ready' })).toHaveAttribute(
      'data-intent',
      'brand',
    );
  } finally {
    window.history.replaceState(null, '', location);
  }
});

test('retains controlled manual layout and native submitter/FormData/reset behavior in actions', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MessageBarReflowFormFlow />
    </CoreAIFluentProvider>,
  );
  const root = screen.container.querySelector<HTMLElement>('[data-messagebar-reflow]');
  if (!root) throw new Error('Reflow form root is missing');
  await userEvent.hover(screen.getByRole('combobox', { name: 'Message layout' }));
  await settleMessageBarStyles(root);
  expect(root).toHaveAttribute('data-layout', 'singleline');
  await userEvent.click(screen.getByRole('button', { name: 'Use narrow surface', exact: true }));
  await expect.poll(() => root.dataset.layout).toBe('multiline');
  await userEvent.click(screen.getByRole('button', { name: 'Use wide surface', exact: true }));
  await expect.poll(() => root.dataset.layout).toBe('singleline');
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Message layout' }),
    'multiline',
  );
  expect(root).toHaveAttribute('data-layout', 'multiline');
  await userEvent.fill(screen.getByRole('textbox', { name: 'Workspace code' }), 'orion');
  await userEvent.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  expect(screen.getByRole('status', { name: 'Message form result' })).toHaveTextContent(
    'orion:retry',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Reset form', exact: true }));
  expect(screen.getByRole('textbox', { name: 'Workspace code' })).toHaveValue('atlas');
  expect(screen.getByRole('status', { name: 'Message form result' })).toHaveTextContent(
    'Form reset',
  );
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Message layout' }),
    'singleline',
  );
  expect(root).toHaveAttribute('data-layout', 'singleline');
  await userEvent.hover(screen.getByRole('combobox', { name: 'Message layout' }));
  await settleMessageBarStyles(root);
});
