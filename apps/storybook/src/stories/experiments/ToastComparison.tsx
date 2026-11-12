// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  Link as LegacyLink,
  Toast as LegacyToast,
  ToastBody as LegacyToastBody,
  ToastFooter as LegacyToastFooter,
  ToastTitle as LegacyToastTitle,
  Toaster as LegacyToaster,
} from '@coreai-ds/react-components';
import {
  Button,
  Link,
  Toast,
  ToastBody,
  ToastContainer,
  ToastFooter,
  ToastTitle,
  Toaster,
  useToastContainerContext,
  useToastController,
  type ToastBodySlots,
  type ToastChangeData,
  type ToastContainerSlots,
  type ToastFooterSlots,
  type ToastIntent,
  type ToastPosition,
  type ToastProps,
  type ToastSlots,
  type ToastTitleSlots,
  type ToasterProps,
} from '@coreai-ds/react-headless-components';
import { InfoFilled } from '@fluentui/react-icons/headless/svg/info';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import {
  captureToastStyles,
  captureToasterStyles,
  compareToastStyles,
  getPositionToaster,
  settleToastStyles,
  type ToastStyleDifference,
} from './compareToastStyles.js';
import styles from './ToastComparison.module.css';

export type ToastImplementation = 'legacy' | 'headless';
export const toastIntents = ['info', 'success', 'warning', 'error'] as const;
export const toastAppearances = [undefined, 'brand', 'inverted'] as const;
export const toastPositions = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
] as const;

export interface ToastExample {
  name: string;
  props?: ToastProps;
  intent?: ToastIntent;
  noContext?: boolean;
  media?: 'none' | 'custom';
  action?: 'none' | 'button';
  body?: 'none' | 'without-subtitle';
  footer?: 'none' | 'buttons';
  longText?: boolean;
  compact?: boolean;
  renderedSlots?: boolean;
  consumer?: boolean;
}

export const toastExamples: readonly ToastExample[] = [
  { name: 'Default composition' },
  { name: 'Explicit undefined appearance', props: { appearance: undefined } },
  ...toastIntents.flatMap((intent) => [
    { name: `Intent: ${intent}`, intent },
    {
      name: `Inverted intent: ${intent}`,
      intent,
      props: { appearance: 'inverted' as const },
    },
  ]),
  { name: 'Brand background context', props: { appearance: 'brand' } },
  { name: 'Layout without a notification context', noContext: true },
  { name: 'Title only', body: 'none', footer: 'none', action: 'none' },
  { name: 'Body without subtitle', body: 'without-subtitle', footer: 'none' },
  { name: 'No media', media: 'none' },
  { name: 'Caller media', media: 'custom', intent: 'warning' },
  { name: 'Button actions', action: 'button', footer: 'buttons' },
  { name: 'Wrapping narrow layout', compact: true, longText: true },
  { name: 'Current public slot render functions', renderedSlots: true },
];

export const toastConsumerExample: ToastExample = {
  name: 'Consumer CSS priority',
  consumer: true,
  props: { appearance: 'inverted' },
};

const noop = () => undefined;

export function ToastFixtureContainer({
  children,
  intent,
}: {
  children: React.ReactNode;
  intent?: ToastIntent;
}) {
  const toastId = React.useId();
  const imperativeRef = React.useRef(null);
  return (
    <ToastContainer
      visible
      toastId={toastId}
      toasterId={undefined}
      intent={intent}
      content={children}
      timeout={-1}
      order={0}
      priority={0}
      updateId={0}
      position="top-end"
      pauseOnHover={false}
      pauseOnWindowBlur={false}
      data={{}}
      imperativeRef={imperativeRef}
      onStatusChange={undefined}
      close={noop}
      remove={noop}
      tryRestoreFocus={noop}
    >
      {children}
    </ToastContainer>
  );
}

export function ToastVisualFixture({
  implementation,
  example,
}: {
  implementation: ToastImplementation;
  example: ToastExample;
}) {
  const Root = implementation === 'legacy' ? LegacyToast : Toast;
  const Title = implementation === 'legacy' ? LegacyToastTitle : ToastTitle;
  const Body = implementation === 'legacy' ? LegacyToastBody : ToastBody;
  const Footer = implementation === 'legacy' ? LegacyToastFooter : ToastFooter;
  const Action = implementation === 'legacy' ? LegacyLink : Link;
  const ActionButton = implementation === 'legacy' ? LegacyButton : Button;
  const title = example.longText
    ? 'A complete workspace snapshot is ready for review'
    : 'Workspace saved';
  const body = example.longText
    ? 'The workspace snapshot contains the latest document and permission changes.'
    : 'Your project changes are available.';
  const action =
    example.action === 'button' ? (
      <ActionButton
        type="button"
        size="small"
        appearance="transparent"
        aria-label="Dismiss notification"
        icon={<DismissRegular aria-hidden />}
      />
    ) : (
      <Action type="button">Undo</Action>
    );
  const titleRenderer: SlotRenderFunction<ExtractSlotProps<ToastTitleSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-title>
      {title}
    </Component>
  );
  const mediaRenderer: SlotRenderFunction<ExtractSlotProps<ToastTitleSlots['media']>> = (
    Component,
    props,
  ) => <Component {...props} data-toast-rendered-media />;
  const actionRenderer: SlotRenderFunction<ExtractSlotProps<ToastTitleSlots['action']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-action>
      {action}
    </Component>
  );
  const bodyRenderer: SlotRenderFunction<ExtractSlotProps<ToastBodySlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-body>
      {body}
    </Component>
  );
  const subtitleRenderer: SlotRenderFunction<ExtractSlotProps<ToastBodySlots['subtitle']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-subtitle>
      Just now
    </Component>
  );
  const footerContent =
    example.footer === 'buttons' ? (
      <>
        <ActionButton type="button" size="small">
          Review
        </ActionButton>
        <ActionButton type="button" size="small" appearance="transparent">
          Later
        </ActionButton>
      </>
    ) : (
      <>
        <Action href="#toast-details">Review</Action>
        <Action type="button">Later</Action>
      </>
    );
  const footerRenderer: SlotRenderFunction<ExtractSlotProps<ToastFooterSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-footer>
      {footerContent}
    </Component>
  );
  const content = (
    <>
      <Title
        className={example.consumer ? styles.consumerTitle : undefined}
        media={
          example.media === 'none'
            ? null
            : example.media === 'custom' || example.renderedSlots || example.consumer
              ? {
                  className: example.consumer ? styles.consumerMedia : undefined,
                  ...(example.media === 'custom'
                    ? { children: <InfoFilled aria-hidden data-toast-caller-glyph /> }
                    : example.renderedSlots
                      ? { children: mediaRenderer }
                      : {}),
                }
              : undefined
        }
        action={
          example.action === 'none'
            ? null
            : {
                className: example.consumer ? styles.consumerAction : undefined,
                children: example.renderedSlots ? actionRenderer : action,
              }
        }
      >
        {example.renderedSlots ? titleRenderer : title}
      </Title>
      {example.body !== 'none' ? (
        <Body
          className={example.consumer ? styles.consumerBody : undefined}
          subtitle={
            example.body === 'without-subtitle'
              ? null
              : {
                  className: example.consumer ? styles.consumerSubtitle : undefined,
                  children: example.renderedSlots ? subtitleRenderer : 'Just now',
                }
          }
        >
          {example.renderedSlots ? bodyRenderer : body}
        </Body>
      ) : null}
      {example.footer !== 'none' ? (
        <Footer className={example.consumer ? styles.consumerFooter : undefined}>
          {example.renderedSlots ? footerRenderer : footerContent}
        </Footer>
      ) : null}
    </>
  );
  const rootRenderer: SlotRenderFunction<ExtractSlotProps<ToastSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toast-rendered-root>
      {content}
    </Component>
  );
  const root = (
    <Root
      {...example.props}
      data-toast-root
      className={example.consumer ? styles.consumerRoot : undefined}
    >
      {example.renderedSlots ? rootRenderer : content}
    </Root>
  );
  return (
    <div
      className={[styles.visualWidth, example.compact && styles.compact].filter(Boolean).join(' ')}
    >
      {example.noContext ? (
        root
      ) : (
        <ToastFixtureContainer intent={example.intent}>{root}</ToastFixtureContainer>
      )}
    </div>
  );
}

export function ToastComparison({
  examples = toastExamples,
}: {
  examples?: readonly ToastExample[];
}) {
  return (
    <div className={styles.examples}>
      <p>Toast fixtures</p>
      {examples.map((example) => (
        <section key={example.name} className={styles.row} data-toast-case={example.name}>
          <h3 className={styles.caseName}>{example.name}</h3>
          {(['legacy', 'headless'] as const).map((implementation) => (
            <div
              key={implementation}
              className={styles.cell}
              data-toast-implementation={implementation}
            >
              <p>{implementation === 'legacy' ? 'Existing CoreAI' : 'Headless + CSS Modules'}</p>
              <ToastVisualFixture implementation={implementation} example={example} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function ToastDismissAction() {
  const { close } = useToastContainerContext();
  return (
    <Button
      type="button"
      size="small"
      appearance="transparent"
      aria-label="Dismiss project notification"
      onClick={close}
      icon={<DismissRegular aria-hidden />}
    />
  );
}

export function ToastControllerFlow({
  timeout = 1200,
  announce,
}: {
  timeout?: number;
  announce?: ToasterProps['announce'];
}) {
  const toasterId = React.useId();
  const controller = useToastController(toasterId);
  const serial = React.useRef(0);
  const [activeId, setActiveId] = React.useState('');
  const [notifications, setNotifications] = React.useState<
    Record<string, ToastChangeData['status']>
  >({});
  const [statusLog, setStatusLog] = React.useState<
    { toastId: string; status: ToastChangeData['status']; updateId: number; eventIsNull: boolean }[]
  >([]);
  const [updated, setUpdated] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const makeContent = (number: number, isUpdated = false) => (
    <Toast appearance={isUpdated ? 'inverted' : undefined}>
      <ToastTitle action={<ToastDismissAction />}>
        Project notification {number}
        {isUpdated ? ' updated' : ''}
      </ToastTitle>
      <ToastBody subtitle="Project activity">
        {isUpdated ? 'The latest version is ready.' : 'Your project is saved.'}
      </ToastBody>
      <ToastFooter>
        <Link href="#toast-notification-history">Notification history</Link>
      </ToastFooter>
    </Toast>
  );
  const notify = (timed: boolean) => {
    const number = ++serial.current;
    const toastId = `${toasterId}-notification-${number}`;
    setActiveId(toastId);
    setUpdated(false);
    setPaused(false);
    const rootData = { 'data-toast-controller-root': '', id: toastId };
    controller.dispatchToast(makeContent(number), {
      toastId,
      intent: 'info',
      timeout: timed ? timeout : -1,
      root: rootData,
      onStatusChange: (event, data) => {
        setNotifications((previous) => ({ ...previous, [data.toastId]: data.status }));
        setStatusLog((previous) => [
          ...previous,
          {
            toastId: data.toastId,
            status: data.status,
            updateId: data.updateId,
            eventIsNull: event === null,
          },
        ]);
      },
    });
  };
  const visible = Object.values(notifications).filter((status) => status === 'visible').length;
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <p>Native Toast controller</p>
        <p>
          F6 focuses the newest toast. Tab and Shift+Tab navigate notifications and their native
          actions. Current native Chromium does not move between these opt-out Toast roots with
          arrow keys; the consumer focusgroup polyfill does. Delete dismisses one notification and
          Escape dismisses the stack.
        </p>
        <div className={styles.controls}>
          <Button type="button" onClick={() => notify(false)}>
            Dispatch persistent
          </Button>
          <Button type="button" onClick={() => notify(true)}>
            Dispatch timed
          </Button>
          <Button
            type="button"
            disabled={!activeId}
            onClick={() => {
              controller.updateToast({
                toastId: activeId,
                content: makeContent(serial.current, true),
                intent: 'success',
                timeout: -1,
                root: { id: activeId, ...{ 'data-toast-controller-root': '' } },
              });
              setUpdated(true);
            }}
          >
            Update active
          </Button>
          <Button
            type="button"
            disabled={!activeId}
            onClick={() => controller.dismissToast(activeId)}
          >
            Dismiss active
          </Button>
          <Button type="button" onClick={() => controller.dismissAllToasts()}>
            Dismiss all
          </Button>
          <Button
            type="button"
            disabled={!activeId}
            onClick={() => {
              controller.pauseToast(activeId);
              setPaused(true);
            }}
          >
            Pause active
          </Button>
          <Button
            type="button"
            disabled={!activeId}
            onClick={() => {
              controller.playToast(activeId);
              setPaused(false);
            }}
          >
            Resume active
          </Button>
        </div>
        <output
          aria-label="Toast controller result"
          data-visible-count={visible}
          data-status-count={statusLog.length}
          data-active-id={activeId}
          data-updated={String(updated)}
          data-paused={String(paused)}
        >
          {JSON.stringify(statusLog)}
        </output>
        <a id="toast-notification-history" href="#toast-notification-history">
          Permanent notification history
        </a>
        <Toaster
          toasterId={toasterId}
          position="bottom-end"
          pauseOnHover
          pauseOnWindowBlur
          shortcuts={{ focus: (event) => event.key === 'F6' }}
          announce={announce}
          data-toast-controller-toaster
        />
      </div>
    </FocusgroupConsumer>
  );
}

function ToastFormContent({ onSubmit }: { onSubmit: (value: string, submitter: string) => void }) {
  const { close } = useToastContainerContext();
  return (
    <Toast>
      <ToastTitle action={<ToastDismissAction />}>Rename project</ToastTitle>
      <ToastBody>
        <form
          id="toast-project-form"
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const submitter =
              event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
            onSubmit(
              String(new FormData(form).get('project')),
              submitter?.getAttribute('value') ?? '',
            );
            close();
          }}
        >
          <label>
            Project name
            <input
              name="project"
              required
              defaultValue="CoreAI"
              onKeyDown={(event) => {
                if (event.key === 'Delete') event.stopPropagation();
              }}
            />
          </label>
        </form>
      </ToastBody>
      <ToastFooter>
        <Button type="submit" form="toast-project-form" name="action" value="save" size="small">
          Save name
        </Button>
        <Link href="#toast-project-history">Project history</Link>
      </ToastFooter>
    </Toast>
  );
}

export function ToastNativeFormFlow() {
  const toasterId = React.useId();
  const controller = useToastController(toasterId);
  const [result, setResult] = React.useState('');
  const [status, setStatus] = React.useState('');
  return (
    <FocusgroupConsumer>
      <div className={styles.flow}>
        <p>Toast native form</p>
        <p>
          This editor owns Delete-key propagation so native text editing does not invoke the
          Toaster&apos;s notification-dismissal shortcut.
        </p>
        <Button
          type="button"
          onClick={() =>
            controller.dispatchToast(
              <ToastFormContent
                onSubmit={(value, submitter) => setResult(`${value}:${submitter}`)}
              />,
              {
                toastId: `${toasterId}-form`,
                timeout: -1,
                intent: 'info',
                root: { id: `${toasterId}-form`, ...{ 'data-toast-form-root': '' } },
                onStatusChange: (_, data) => setStatus(data.status),
              },
            )
          }
        >
          Open rename notification
        </Button>
        <output aria-label="Toast form result" data-status={status}>
          {result || 'Not submitted'}
        </output>
        <a id="toast-project-history" href="#toast-project-history">
          Permanent project history
        </a>
        <Toaster
          toasterId={toasterId}
          position="bottom-end"
          shortcuts={{ focus: (event) => event.key === 'F6' }}
          data-toast-form-toaster
        />
      </div>
    </FocusgroupConsumer>
  );
}

export function ToastPositionFlow() {
  const legacyId = React.useId();
  const headlessId = React.useId();
  const legacy = useToastController(legacyId);
  const headless = useToastController(headlessId);
  const serial = React.useRef(0);
  const [position, setPosition] = React.useState<ToastPosition>('top');
  const [horizontal, setHorizontal] = React.useState(13);
  const [vertical, setVertical] = React.useState(24);
  const [reports, setReports] = React.useState<
    {
      position: ToastPosition;
      legacy: Record<string, string>;
      headless: Record<string, string>;
      differences: ToastStyleDifference[];
    }[]
  >([]);
  const [comparing, setComparing] = React.useState(false);
  const show = () => {
    serial.current++;
    legacy.dismissAllToasts();
    headless.dismissAllToasts();
    for (const [implementation, controller, Root, Title] of [
      ['legacy', legacy, LegacyToast, LegacyToastTitle],
      ['headless', headless, Toast, ToastTitle],
    ] as const) {
      const rootAttributes: ExtractSlotProps<ToastContainerSlots['root']> & {
        'data-toast-position-item': ToastImplementation;
      } = {
        id: `${implementation}-position-${serial.current}`,
        'data-toast-position-item': implementation,
      };
      controller.dispatchToast(
        <Root data-toast-root>
          <Title>Position {position}</Title>
        </Root>,
        {
          toastId: `${implementation}-position-${serial.current}`,
          position,
          timeout: -1,
          intent: 'info',
          root: rootAttributes,
        },
      );
    }
  };
  const compare = async () => {
    setComparing(true);
    try {
      const oldRoot = getPositionToaster(document, 'legacy', position);
      const newRoot = getPositionToaster(document, 'headless', position);
      await Promise.all([settleToastStyles(oldRoot), settleToastStyles(newRoot)]);
      const oldValues = captureToasterStyles(oldRoot);
      const newValues = captureToasterStyles(newRoot);
      const oldToast = oldRoot.querySelector<HTMLElement>('[data-toast-root]');
      const newToast = newRoot.querySelector<HTMLElement>('[data-toast-root]');
      if (!oldToast || !newToast) throw new Error('Current position Toast content is missing');
      const differences = [
        ...compareToastStyles(oldValues, newValues),
        ...compareToastStyles(captureToastStyles(oldToast), captureToastStyles(newToast)),
      ];
      setReports((previous) => [
        ...previous.filter((report) => report.position !== position),
        { position, legacy: oldValues, headless: newValues, differences },
      ]);
    } finally {
      setComparing(false);
    }
  };
  const current = reports.find((report) => report.position === position);
  return (
    <FocusgroupConsumer>
      <div className={styles.positionFlow}>
        <p>Toast native positions</p>
        <div className={styles.controls}>
          <label>
            Toast position
            <select
              value={position}
              onChange={(event) => {
                const next = toastPositions.find((value) => value === event.target.value);
                if (next) setPosition(next);
              }}
            >
              {toastPositions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Horizontal offset
            <input
              type="number"
              value={horizontal}
              onChange={(event) => setHorizontal(event.target.valueAsNumber)}
            />
          </label>
          <label>
            Vertical offset
            <input
              type="number"
              value={vertical}
              onChange={(event) => setVertical(event.target.valueAsNumber)}
            />
          </label>
          <Button type="button" onClick={show}>
            Show position pair
          </Button>
          <Button type="button" onClick={compare} disabled={comparing}>
            Compare current position
          </Button>
          <Button
            type="button"
            onClick={() => {
              legacy.dismissAllToasts();
              headless.dismissAllToasts();
            }}
          >
            Dismiss position pair
          </Button>
        </div>
        <output
          aria-label="Toaster position report"
          className={styles.report}
          data-ready={String(Boolean(current) && !comparing)}
          data-position={current?.position ?? ''}
          data-comparison-count={reports.length}
          data-compared-roots={reports.length * 2}
          data-difference-count={reports.reduce(
            (total, report) => total + report.differences.length,
            0,
          )}
        >
          {JSON.stringify(reports, null, 2)}
        </output>
        <LegacyToaster
          toasterId={legacyId}
          offset={{ horizontal, vertical }}
          data-toast-position-implementation="legacy"
        />
        <Toaster
          toasterId={headlessId}
          offset={{ horizontal, vertical }}
          data-toast-position-implementation="headless"
        />
      </div>
    </FocusgroupConsumer>
  );
}
