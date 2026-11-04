// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  AriaLiveAnnouncer,
  Button as LegacyButton,
  Link as LegacyLink,
  MessageBar as LegacyMessageBar,
  MessageBarActions as LegacyMessageBarActions,
  MessageBarBody as LegacyMessageBarBody,
  MessageBarTitle as LegacyMessageBarTitle,
} from '@coreai-ds/react-components';
import {
  Button,
  Link,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  type ButtonProps,
  type MessageBarProps,
  type MessageBarSlots,
  type MessageBarActionsSlots,
  type MessageBarBodySlots,
  type MessageBarTitleSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import { InfoFilled } from '@fluentui/react-icons/headless/svg/info';
import styles from './MessageBarComparison.module.css';

export type MessageBarImplementation = 'legacy' | 'headless';
export const messageBarIntents = ['info', 'success', 'warning', 'error', 'brand'] as const;
export const messageBarLayouts = ['auto', 'singleline', 'multiline'] as const;
export const messageBarShapes = ['rounded', 'square'] as const;

export interface MessageBarExample {
  name: string;
  props?: MessageBarProps;
  actions?: 'both' | 'primary' | 'dismiss' | 'none';
  actionSize?: ButtonProps['size'];
  icon?: 'default' | 'custom' | 'none';
  renderedSlots?: boolean;
  longText?: boolean;
  truncate?: boolean;
  consumer?: boolean;
}

export const messageBarExamples: readonly MessageBarExample[] = [
  { name: 'Default composition' },
  { name: 'Explicit undefined visual props', props: { shape: undefined, intent: undefined } },
  ...messageBarIntents.map((intent) => ({ name: `Intent: ${intent}`, props: { intent } })),
  ...messageBarShapes.map((shape) => ({ name: `Shape: ${shape}`, props: { shape } })),
  ...messageBarLayouts.map((layout) => ({
    name: `Layout: ${layout}`,
    props: { layout },
    longText: true,
  })),
  { name: 'Dismiss action only', actions: 'dismiss', props: { layout: 'multiline' } },
  { name: 'Primary action only', actions: 'primary' },
  { name: 'No actions with reflow spacer', actions: 'none', props: { layout: 'multiline' } },
  { name: 'No icon', icon: 'none' },
  { name: 'Caller icon content', icon: 'custom', props: { intent: 'warning' } },
  { name: 'Public slot render functions', renderedSlots: true, props: { layout: 'multiline' } },
  { name: 'Large action buttons', actionSize: 'large', props: { layout: 'multiline' } },
  { name: 'Consumer truncation', truncate: true, longText: true, props: { layout: 'singleline' } },
];

export const messageBarConsumerExample: MessageBarExample = {
  name: 'Consumer CSS priority',
  consumer: true,
  props: { intent: 'brand', layout: 'multiline' },
};

const iconRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarSlots['icon']>> = (
  Component,
  props,
) => <Component {...props} data-messagebar-rendered-icon />;

const spacerRenderer: SlotRenderFunction<
  ExtractSlotProps<MessageBarSlots['bottomReflowSpacer']>
> = (Component, props) => <Component {...props} data-messagebar-rendered-spacer />;

export function MessageBarVisualFixture({
  implementation,
  example,
}: {
  implementation: MessageBarImplementation;
  example: MessageBarExample;
}) {
  const Root = implementation === 'legacy' ? LegacyMessageBar : MessageBar;
  const Body = implementation === 'legacy' ? LegacyMessageBarBody : MessageBarBody;
  const Title = implementation === 'legacy' ? LegacyMessageBarTitle : MessageBarTitle;
  const Actions = implementation === 'legacy' ? LegacyMessageBarActions : MessageBarActions;
  const Action = implementation === 'legacy' ? LegacyButton : Button;
  const InlineLink = implementation === 'legacy' ? LegacyLink : Link;
  const actionKind = example.actions ?? 'both';
  const dismiss = (
    <Action
      type="button"
      size={example.actionSize ?? 'small'}
      appearance="transparent"
      aria-label="Dismiss update"
      icon={<DismissRegular aria-hidden />}
    />
  );
  const containerRenderer: SlotRenderFunction<
    ExtractSlotProps<MessageBarActionsSlots['containerAction']>
  > = (Component, props) => (
    <Component {...props} data-messagebar-rendered-container>
      {dismiss}
    </Component>
  );
  const titleRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarTitleSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-messagebar-rendered-title>
      Workspace update
    </Component>
  );
  const bodyContent = (
    <>
      <Title className={example.consumer ? styles.consumerTitle : undefined}>
        {example.renderedSlots ? titleRenderer : 'Workspace update'}
      </Title>{' '}
      {example.longText
        ? 'The latest workspace permissions are ready for a complete project review.'
        : 'Your changes are saved.'}{' '}
      <InlineLink
        href="#messagebar-details"
        className={example.consumer ? styles.consumerLink : undefined}
      >
        Learn more
      </InlineLink>
    </>
  );
  const bodyRenderer: SlotRenderFunction<ExtractSlotProps<MessageBarBodySlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-messagebar-rendered-body>
      {bodyContent}
    </Component>
  );

  return (
    <Root
      {...example.props}
      data-messagebar-root
      className={[styles.fixture, example.consumer && styles.consumerRoot]
        .filter(Boolean)
        .join(' ')}
      icon={
        example.icon === 'none'
          ? null
          : {
              className: example.consumer ? styles.consumerIcon : undefined,
              ...(example.renderedSlots
                ? { children: iconRenderer }
                : example.icon === 'custom'
                  ? { children: <InfoFilled aria-hidden data-messagebar-caller-glyph /> }
                  : {}),
            }
      }
      bottomReflowSpacer={
        example.renderedSlots ? { children: spacerRenderer } : example.props?.bottomReflowSpacer
      }
    >
      <Body
        className={[
          example.truncate && styles.truncatedBody,
          example.consumer && styles.consumerBody,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {example.renderedSlots ? bodyRenderer : bodyContent}
      </Body>
      {actionKind !== 'none' && (
        <Actions
          className={example.consumer ? styles.consumerActions : undefined}
          containerAction={
            actionKind === 'both' || actionKind === 'dismiss'
              ? {
                  className: example.consumer ? styles.consumerContainer : undefined,
                  children: example.renderedSlots ? containerRenderer : dismiss,
                }
              : null
          }
        >
          {(actionKind === 'both' || actionKind === 'primary') && (
            <Action type="button" size={example.actionSize ?? 'small'}>
              Review
            </Action>
          )}
        </Actions>
      )}
    </Root>
  );
}

export function MessageBarComparison({
  examples = messageBarExamples,
}: {
  examples?: readonly MessageBarExample[];
}) {
  return (
    <div className={styles.examples}>
      <p>MessageBar fixtures</p>
      {examples.map((example) => (
        <section
          className={styles.row}
          data-messagebar-case={example.name}
          key={example.name}
          aria-label={example.name}
        >
          <h3 className={styles.caseName}>{example.name}</h3>
          {(['legacy', 'headless'] as const).map((implementation) => (
            <div
              className={styles.cell}
              data-messagebar-implementation={implementation}
              key={implementation}
            >
              <p>{implementation === 'legacy' ? 'Existing CoreAI' : 'Headless + CSS Modules'}</p>
              <MessageBarVisualFixture implementation={implementation} example={example} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function MessageBarNotificationsFlow() {
  const [message, setMessage] = React.useState<{
    id: number;
    intent: 'warning' | 'success' | 'brand';
    title: string;
    text: string;
  } | null>(null);
  const nextId = React.useRef(0);
  const publishRef = React.useRef<HTMLButtonElement>(null);
  const [reviewed, setReviewed] = React.useState(0);
  const publish = (intent: 'warning' | 'success' | 'brand') => {
    setMessage({
      id: nextId.current++,
      intent,
      title: intent === 'warning' ? 'Workspace warning' : 'Workspace ready',
      text: intent === 'warning' ? 'Review the latest access policy.' : 'Access has been restored.',
    });
  };

  return (
    <AriaLiveAnnouncer>
      <div className={styles.flow}>
        <p>
          The current facade has no MessageBarGroup, animation, or automatic dismissal API.
          Consumers own visibility, keys, and focus restoration. Publish an update as a new keyed
          message to announce it; changing same-intent text alone does not retrigger the pinned
          announcement effect. Default intent presets avoid its explicit-politeness defect.
        </p>
        <div className={styles.controls}>
          <Button ref={publishRef} type="button" onClick={() => publish('warning')}>
            Publish warning
          </Button>
          <Button type="button" onClick={() => publish('success')}>
            Publish success
          </Button>
          <Button type="button" onClick={() => publish('brand')}>
            Publish brand update
          </Button>
        </div>
        <section aria-label="Workspace notifications" className={styles.notifications}>
          {message && (
            <MessageBar key={message.id} intent={message.intent} data-messagebar-notification>
              <MessageBarBody>
                <MessageBarTitle>{message.title}</MessageBarTitle> {message.text}{' '}
                <Link href="#messagebar-policy">Read policy</Link>
              </MessageBarBody>
              <MessageBarActions
                containerAction={
                  <Button
                    type="button"
                    size="small"
                    appearance="transparent"
                    aria-label="Dismiss workspace update"
                    icon={<DismissRegular aria-hidden />}
                    onClick={() => {
                      setMessage(null);
                      publishRef.current?.focus();
                    }}
                  />
                }
              >
                <Button
                  type="button"
                  size="small"
                  onClick={() => setReviewed((count) => count + 1)}
                >
                  Review access
                </Button>
              </MessageBarActions>
            </MessageBar>
          )}
        </section>
        <output aria-label="Reviewed updates">Reviewed: {reviewed}</output>
      </div>
    </AriaLiveAnnouncer>
  );
}

export function MessageBarReflowFormFlow() {
  const [compact, setCompact] = React.useState(false);
  const [layout, setLayout] = React.useState<NonNullable<MessageBarProps['layout']>>('auto');
  const [result, setResult] = React.useState('No submission');
  return (
    <div className={styles.flow}>
      <p>
        ResizeObserver owns automatic reflow. Action buttons pass their supported size explicitly:
        the installed MessageBar and headless Button resolve separate react-button copies.
        MessageBar itself has no size prop, focusgroup, overlay, or form state.
      </p>
      <div className={styles.controls}>
        <Button type="button" onClick={() => setCompact((value) => !value)}>
          {compact ? 'Use wide surface' : 'Use narrow surface'}
        </Button>
        <label>
          Message layout
          <select
            value={layout}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (next === 'auto' || next === 'singleline' || next === 'multiline') {
                setLayout(next);
              }
            }}
          >
            <option value="auto">Automatic</option>
            <option value="singleline">Single line</option>
            <option value="multiline">Multiple lines</option>
          </select>
        </label>
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const submitter =
            event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
          const data = new FormData(event.currentTarget, submitter);
          setResult(`${data.get('workspace')}:${data.get('action')}`);
        }}
        onReset={() => setResult('Form reset')}
      >
        <label>
          Workspace code
          <input name="workspace" defaultValue="atlas" />
        </label>
        <div className={styles.reflowViewport}>
          <div className={styles.resizeArea} data-compact={compact ? '' : undefined}>
            <MessageBar layout={layout} intent="warning" data-messagebar-reflow>
              <MessageBarBody>
                <MessageBarTitle>Access review</MessageBarTitle> Review the latest workspace
                permissions before retrying. <Link href="#messagebar-review">Review policy</Link>
              </MessageBarBody>
              <MessageBarActions>
                <Button type="submit" name="action" value="retry" size="small">
                  Retry
                </Button>
                <Button type="reset" size="small">
                  Reset form
                </Button>
              </MessageBarActions>
            </MessageBar>
          </div>
        </div>
      </form>
      <output aria-label="Message form result">{result}</output>
    </div>
  );
}
