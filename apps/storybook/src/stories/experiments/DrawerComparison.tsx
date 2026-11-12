// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  DrawerBody as LegacyDrawerBody,
  DrawerFooter as LegacyDrawerFooter,
  DrawerHeader as LegacyDrawerHeader,
  DrawerHeaderNavigation as LegacyDrawerHeaderNavigation,
  DrawerHeaderTitle as LegacyDrawerHeaderTitle,
  InlineDrawer as LegacyInlineDrawer,
  OverlayDrawer as LegacyOverlayDrawer,
  type DialogSurfaceSlots as LegacyDialogSurfaceSlots,
} from '@coreai-ds/react-components';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  InlineDrawer,
  OverlayDrawer,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  type DrawerHeaderTitleSlots,
  type InlineDrawerProps,
  type OverlayDrawerProps,
} from '@coreai-ds/react-headless-components';
import styles from './DrawerComparison.module.css';

export type DrawerImplementation = 'legacy' | 'headless';
export interface DrawerExample {
  name: string;
  kind: 'overlay' | 'inline';
  props?: Pick<InlineDrawerProps, 'size' | 'position' | 'separator'>;
  navigation?: boolean;
  longContent?: boolean;
  consumer?: boolean;
}

export const drawerExamples: readonly DrawerExample[] = [
  { name: 'Overlay start small', kind: 'overlay' },
  { name: 'Explicit undefined visual props', kind: 'overlay', props: { size: undefined } },
  { name: 'Overlay end medium', kind: 'overlay', props: { position: 'end', size: 'medium' } },
  { name: 'Overlay start large', kind: 'overlay', props: { size: 'large' } },
  { name: 'Overlay end full', kind: 'overlay', props: { position: 'end', size: 'full' } },
  { name: 'Overlay bottom small', kind: 'overlay', props: { position: 'bottom' } },
  {
    name: 'Overlay bottom medium',
    kind: 'overlay',
    props: { position: 'bottom', size: 'medium' },
  },
  {
    name: 'Overlay bottom large',
    kind: 'overlay',
    props: { position: 'bottom', size: 'large' },
  },
  {
    name: 'Overlay bottom full',
    kind: 'overlay',
    props: { position: 'bottom', size: 'full' },
  },
  { name: 'Inline start small', kind: 'inline' },
  {
    name: 'Explicit undefined inline visual props',
    kind: 'inline',
    props: { size: undefined, position: undefined, separator: undefined },
  },
  { name: 'Inline start medium', kind: 'inline', props: { size: 'medium' } },
  {
    name: 'Inline end large',
    kind: 'inline',
    props: { position: 'end', size: 'large' },
  },
  { name: 'Inline start full', kind: 'inline', props: { size: 'full' } },
  {
    name: 'Inline end separator',
    kind: 'inline',
    props: { position: 'end', separator: true },
  },
  {
    name: 'Inline bottom small',
    kind: 'inline',
    props: { position: 'bottom' },
  },
  {
    name: 'Inline bottom medium',
    kind: 'inline',
    props: { position: 'bottom', size: 'medium', separator: true },
  },
  {
    name: 'Inline bottom large',
    kind: 'inline',
    props: { position: 'bottom', size: 'large' },
  },
  {
    name: 'Inline bottom full',
    kind: 'inline',
    props: { position: 'bottom', size: 'full' },
  },
  { name: 'With navigation', kind: 'overlay', navigation: true },
  { name: 'Scrollable overlay', kind: 'overlay', longContent: true },
  { name: 'Scrollable inline', kind: 'inline', longContent: true },
];

export const drawerConsumerExample: DrawerExample = {
  name: 'Consumer CSS priority',
  kind: 'overlay',
  navigation: true,
  consumer: true,
};

function DrawerCopy({ long = false }: { long?: boolean }) {
  return long ? (
    <div className={styles.longCopy}>
      {Array.from({ length: 40 }, (_, index) => (
        <p className={styles.copy} key={index}>
          Section {index + 1}. Review the Atlas project before sharing it with your team.
        </p>
      ))}
    </div>
  ) : (
    <p className={styles.copy}>Review access to the Atlas project.</p>
  );
}

type DrawerFixtureData = {
  'data-drawer-fixture': string;
  'data-drawer-implementation': DrawerImplementation;
  'data-drawer-kind': DrawerExample['kind'];
};
type BackdropFixtureProps = ExtractSlotProps<LegacyDialogSurfaceSlots['backdrop']> & {
  'data-drawer-backdrop': string;
};
type HeadingFixtureProps = ExtractSlotProps<DrawerHeaderTitleSlots['heading']> & {
  'data-drawer-heading': string;
};
type ActionFixtureProps = ExtractSlotProps<DrawerHeaderTitleSlots['action']> & {
  'data-drawer-action': string;
};

export function DrawerComparison({
  example = drawerExamples[0],
  fixtureId,
  openImplementation,
  onClose,
}: {
  example?: DrawerExample;
  fixtureId: string;
  openImplementation?: DrawerImplementation;
  onClose?: () => void;
}) {
  const content = (implementation: DrawerImplementation) => {
    const Header = implementation === 'legacy' ? LegacyDrawerHeader : DrawerHeader;
    const Title = implementation === 'legacy' ? LegacyDrawerHeaderTitle : DrawerHeaderTitle;
    const Navigation =
      implementation === 'legacy' ? LegacyDrawerHeaderNavigation : DrawerHeaderNavigation;
    const Body = implementation === 'legacy' ? LegacyDrawerBody : DrawerBody;
    const Footer = implementation === 'legacy' ? LegacyDrawerFooter : DrawerFooter;
    const Action = implementation === 'legacy' ? LegacyButton : Button;
    const heading: HeadingFixtureProps = {
      as: 'h2',
      'data-drawer-heading': '',
      className: example.consumer ? styles.consumerTitle : undefined,
    };
    const action: ActionFixtureProps = {
      'data-drawer-action': '',
      children: (
        <Action as="button" type="button" appearance="subtle" size="small" onClick={onClose}>
          Close
        </Action>
      ),
    };
    return (
      <>
        <Header
          data-drawer-header=""
          className={example.consumer ? styles.consumerHeader : undefined}
        >
          {example.navigation && (
            <Navigation
              aria-label="Project navigation"
              data-drawer-navigation=""
              className={example.consumer ? styles.consumerNavigation : undefined}
            >
              <a href="#drawer-overview">Overview</a> <a href="#drawer-activity">Activity</a>
            </Navigation>
          )}
          <Title data-drawer-title="" heading={heading} action={action}>
            Project access
          </Title>
        </Header>
        <Body
          id={`${fixtureId}-${implementation}-description`}
          data-drawer-body=""
          className={example.consumer ? styles.consumerBody : undefined}
        >
          <DrawerCopy long={example.longContent} />
        </Body>
        <Footer
          data-drawer-footer=""
          className={example.consumer ? styles.consumerFooter : undefined}
        >
          <Action as="button" type="button" onClick={onClose}>
            Cancel
          </Action>
          <Action as="button" type="button" appearance="primary" onClick={onClose}>
            Share
          </Action>
        </Footer>
      </>
    );
  };
  const rootProps = (implementation: DrawerImplementation): DrawerFixtureData => ({
    'data-drawer-fixture': fixtureId,
    'data-drawer-implementation': implementation,
    'data-drawer-kind': example.kind,
  });
  const backdrop: BackdropFixtureProps = { 'data-drawer-backdrop': fixtureId };
  const commonProps = {
    position: example.props?.position,
    size: example.props?.size,
    className: example.consumer ? styles.consumerSurface : undefined,
  };
  const overlay = (
    <>
      <LegacyOverlayDrawer
        {...commonProps}
        {...rootProps('legacy')}
        open={openImplementation === 'legacy'}
        aria-describedby={`${fixtureId}-legacy-description`}
        surfaceMotion={null}
        backdropMotion={null}
        backdrop={backdrop}
        onOpenChange={(_, data) => {
          if (!data.open) onClose?.();
        }}
      >
        {content('legacy')}
      </LegacyOverlayDrawer>
      <OverlayDrawer
        {...commonProps}
        {...rootProps('headless')}
        open={openImplementation === 'headless'}
        aria-describedby={`${fixtureId}-headless-description`}
        onOpenChange={(_, data) => {
          if (!data.open) onClose?.();
        }}
      >
        {content('headless')}
      </OverlayDrawer>
    </>
  );
  return (
    <section
      className={styles.comparison}
      data-drawer-comparison={fixtureId}
      data-drawer-example={example.name}
    >
      {example.kind === 'overlay' ? (
        overlay
      ) : (
        <div
          className={[
            styles.inlineFrame,
            example.props?.position === 'bottom' && styles.bottomFrame,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <LegacyInlineDrawer
            {...commonProps}
            {...rootProps('legacy')}
            open={openImplementation === 'legacy'}
            separator={example.props?.separator}
            surfaceMotion={null}
          >
            {content('legacy')}
          </LegacyInlineDrawer>
          <InlineDrawer
            {...commonProps}
            {...rootProps('headless')}
            open={openImplementation === 'headless'}
            separator={example.props?.separator}
          >
            {content('headless')}
          </InlineDrawer>
          <main className={styles.main}>Main content remains interactive.</main>
        </div>
      )}
    </section>
  );
}

export function OverlayDrawerFlow({
  modalType = 'modal',
  position,
  size,
  keepMounted = false,
}: Pick<OverlayDrawerProps, 'modalType' | 'position' | 'size'> & { keepMounted?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [veto, setVeto] = React.useState(false);
  const [changes, setChanges] = React.useState('');
  const descriptionId = React.useId();
  return (
    <div className={styles.flow}>
      <div className={styles.controls}>
        <Button as="button" type="button" onClick={() => setOpen(true)}>
          Open project drawer
        </Button>
        <button
          type="button"
          aria-label="Outside drawer action"
          className={modalType === 'non-modal' ? styles.nonModalOutsideAction : undefined}
        >
          {modalType === 'non-modal' ? 'Page' : 'Outside drawer action'}
        </button>
        <span data-testid="drawer-pointer-rest">Native drawer focus and dismissal</span>
      </div>
      <OverlayDrawer
        open={open}
        modalType={modalType}
        position={position}
        size={size}
        unmountOnClose={!keepMounted}
        aria-describedby={descriptionId}
        onOpenChange={(event, data) => {
          setChanges(`${data.type}:${data.open}:${data.event.type}`);
          if (veto) event.preventDefault();
          else setOpen(data.open);
        }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button as="button" type="button" onClick={() => setOpen(false)}>
                Close drawer
              </Button>
            }
          >
            Project drawer
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.bodyContent}>
            <p className={styles.copy} id={descriptionId}>
              Review native drawer focus and dismissal.
            </p>
            <button type="button">First drawer action</button>
            <label>
              Drawer note <input name="note" />
            </label>
            <label>
              <input
                type="checkbox"
                checked={veto}
                onChange={(event) => setVeto(event.currentTarget.checked)}
              />
              Prevent dismissal
            </label>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button as="button" type="button" onClick={() => setOpen(false)}>
            Last drawer action
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
      <output aria-label="Drawer changes">{changes}</output>
    </div>
  );
}

export function InlineDrawerFlow() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState('Overview');
  const [refreshes, setRefreshes] = React.useState(0);
  return (
    <div className={styles.flow}>
      <Button as="button" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide navigation' : 'Show navigation'}
      </Button>
      <div className={styles.inlineFrame}>
        <InlineDrawer
          open={open}
          unmountOnClose={false}
          separator
          as="aside"
          aria-label="Projects"
          className={styles.navigationDrawer}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation aria-label="Project sections">
              <div className={styles.navigation}>
                {['Overview', 'Activity'].map((name) => (
                  <a
                    key={name}
                    href={`#drawer-${name.toLowerCase()}`}
                    aria-current={page === name ? 'page' : undefined}
                    onClick={() => setPage(name)}
                  >
                    {name}
                  </a>
                ))}
              </div>
            </DrawerHeaderNavigation>
            <DrawerHeaderTitle>Projects</DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody>
            <label>
              Filter projects <input name="filter" />
            </label>
          </DrawerBody>
          <DrawerFooter>Two project sections</DrawerFooter>
        </InlineDrawer>
        <main className={styles.main}>
          <h2>{page} page</h2>
          <button type="button" onClick={() => setRefreshes((value) => value + 1)}>
            Refresh main content
          </button>
          <output aria-label="Refresh count">{refreshes}</output>
        </main>
      </div>
    </div>
  );
}

export function DrawerFormFlow() {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState('');
  const formId = React.useId();
  return (
    <div className={styles.flow}>
      <Button as="button" type="button" onClick={() => setOpen(true)}>
        Open sharing form
      </Button>
      <OverlayDrawer open={open} onOpenChange={(_, data) => setOpen(data.open)} position="end">
        <DrawerHeader>
          <DrawerHeaderTitle>Share project</DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <form
            id={formId}
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              const submitter =
                event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
              if (!(submitter instanceof HTMLButtonElement)) {
                throw new Error('Drawer form requires its real native submit button');
              }
              const data = new FormData(event.currentTarget, submitter);
              setResult(
                `${String(data.get('project'))}|${String(data.get('decision'))}|${event.nativeEvent.constructor.name}`,
              );
              setOpen(false);
            }}
          >
            <label>
              Project name <input name="project" required defaultValue="Atlas" />
            </label>
            <p className={styles.copy}>The footer submits this form by its native form ID.</p>
          </form>
        </DrawerBody>
        <DrawerFooter>
          <Button as="button" type="button" onClick={() => setOpen(false)}>
            Cancel sharing
          </Button>
          <Button
            as="button"
            type="submit"
            form={formId}
            name="decision"
            value="share"
            appearance="primary"
          >
            Share project
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
      <output className={styles.formResult} aria-label="Drawer form result">
        {result}
      </output>
    </div>
  );
}

export function DrawerNestedFlow() {
  const [open, setOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  return (
    <div className={styles.flow}>
      <Button as="button" type="button" onClick={() => setOpen(true)}>
        Open nested drawer
      </Button>
      <OverlayDrawer open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DrawerHeader>
          <DrawerHeaderTitle>Nested drawer</DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.bodyContent}>
            <Popover open={helpOpen} onOpenChange={(_, data) => setHelpOpen(data.open)}>
              <PopoverTrigger>
                <Button as="button" type="button">
                  Open drawer help
                </Button>
              </PopoverTrigger>
              <PopoverSurface
                aria-label="Drawer help"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') event.stopPropagation();
                }}
              >
                <p>Native popover above a native drawer.</p>
                <Button as="button" type="button" onClick={() => setHelpOpen(false)}>
                  Close drawer help
                </Button>
              </PopoverSurface>
            </Popover>
            <Dialog>
              <DialogTrigger>
                <Button as="button" type="button">
                  Open drawer confirmation
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogHeader>
                  <DialogTitle>Drawer confirmation</DialogTitle>
                </DialogHeader>
                <DialogBody>Confirm access without closing the parent drawer.</DialogBody>
                <DialogActions>
                  <DialogTrigger>
                    <Button as="button" type="button">
                      Close drawer confirmation
                    </Button>
                  </DialogTrigger>
                </DialogActions>
              </DialogSurface>
            </Dialog>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button as="button" type="button" onClick={() => setOpen(false)}>
            Close nested drawer
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </div>
  );
}
