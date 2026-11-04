// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  Dialog as LegacyDialog,
  DialogActions as LegacyDialogActions,
  DialogBody as LegacyDialogBody,
  DialogContent as LegacyDialogContent,
  DialogSurface as LegacyDialogSurface,
  DialogTitle as LegacyDialogTitle,
  DialogTrigger as LegacyDialogTrigger,
  type DialogSurfaceSlots as LegacyDialogSurfaceSlots,
} from '@coreai-ds/react-components';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  useDialogContext,
  useDialogSurfaceContext,
  type DialogActionsProps,
  type DialogModalType,
  type DialogProps,
  type DialogSurfaceProps,
} from '@coreai-ds/react-headless-components';
import styles from './DialogComparison.module.css';

export type DialogImplementation = 'legacy' | 'headless';

export interface DialogExample {
  name: string;
  modalType?: DialogModalType;
  actions?: Pick<DialogActionsProps, 'position' | 'fluid'>;
  longContent?: boolean;
  headerClose?: boolean;
  consumer?: boolean;
}

export const dialogExamples: readonly DialogExample[] = [
  { name: 'Modal' },
  { name: 'Non-modal', modalType: 'non-modal' },
  { name: 'Alert', modalType: 'alert' },
  { name: 'Explicit undefined visual props', actions: { position: undefined, fluid: undefined } },
  { name: 'Start actions', actions: { position: 'start' } },
  { name: 'Fluid end actions', actions: { fluid: true } },
  { name: 'Fluid start actions', actions: { position: 'start', fluid: true } },
  { name: 'Explicit header close', headerClose: true },
  { name: 'Scrollable content', longContent: true },
];

export const dialogConsumerExample: DialogExample = {
  name: 'Consumer CSS priority',
  consumer: true,
};

function DialogCopy({ long = false }: { long?: boolean }) {
  const copy = (
    <p className={styles.copy}>Review project access before sharing Atlas with your team.</p>
  );
  return long ? (
    <div className={styles.longCopy}>
      {Array.from({ length: 28 }, (_, index) => (
        <p className={styles.copy} key={index}>
          Section {index + 1}. Review project access before sharing Atlas with your team.
        </p>
      ))}
    </div>
  ) : (
    copy
  );
}

type SurfaceFixtureProps = Pick<DialogSurfaceProps, 'className' | 'aria-describedby'> & {
  'data-dialog-fixture': string;
  'data-dialog-implementation': DialogImplementation;
};

type LegacyBackdropFixtureProps = ExtractSlotProps<LegacyDialogSurfaceSlots['backdrop']> & {
  'data-dialog-backdrop': string;
};

export function DialogComparison({
  example = dialogExamples[0],
  fixtureId,
  openImplementation,
  onClose,
}: {
  example?: DialogExample;
  fixtureId: string;
  openImplementation?: DialogImplementation;
  onClose?: () => void;
}) {
  const makeSurfaceProps = (implementation: DialogImplementation): SurfaceFixtureProps => ({
    className: example.consumer ? styles.consumerSurface : undefined,
    'aria-describedby': `${fixtureId}-${implementation}-description`,
    'data-dialog-fixture': fixtureId,
    'data-dialog-implementation': implementation,
  });
  const handleOpenChange: DialogProps['onOpenChange'] = (_, data) => {
    if (!data.open) onClose?.();
  };
  const legacyBackdrop: LegacyBackdropFixtureProps | undefined =
    example.modalType === 'non-modal' ? undefined : { 'data-dialog-backdrop': fixtureId };
  const legacyClose = (
    <LegacyDialogTrigger disableButtonEnhancement>
      <LegacyButton as="button" type="button" appearance="subtle" size="small">
        Close header
      </LegacyButton>
    </LegacyDialogTrigger>
  );

  return (
    <section
      className={styles.comparison}
      data-dialog-comparison={fixtureId}
      data-dialog-example={example.name}
    >
      <LegacyDialog
        open={openImplementation === 'legacy'}
        modalType={example.modalType}
        surfaceMotion={null}
        onOpenChange={(_, data) => {
          if (!data.open) onClose?.();
        }}
      >
        <LegacyDialogSurface
          {...makeSurfaceProps('legacy')}
          backdropMotion={null}
          backdrop={legacyBackdrop}
        >
          <LegacyDialogBody data-dialog-layout="">
            <LegacyDialogTitle
              data-dialog-title=""
              className={example.consumer ? styles.consumerTitle : undefined}
              action={example.headerClose ? { children: legacyClose } : null}
            >
              Project access
            </LegacyDialogTitle>
            <LegacyDialogContent
              id={`${fixtureId}-legacy-description`}
              data-dialog-content=""
              className={example.consumer ? styles.consumerBody : undefined}
            >
              <DialogCopy long={example.longContent} />
            </LegacyDialogContent>
            <LegacyDialogActions
              {...example.actions}
              data-dialog-actions=""
              className={example.consumer ? styles.consumerActions : undefined}
            >
              <LegacyDialogTrigger disableButtonEnhancement>
                <LegacyButton as="button" type="button">
                  Cancel
                </LegacyButton>
              </LegacyDialogTrigger>
              <LegacyDialogTrigger disableButtonEnhancement>
                <LegacyButton as="button" type="button" appearance="primary">
                  Share project
                </LegacyButton>
              </LegacyDialogTrigger>
            </LegacyDialogActions>
          </LegacyDialogBody>
        </LegacyDialogSurface>
      </LegacyDialog>
      <Dialog
        open={openImplementation === 'headless'}
        modalType={example.modalType}
        onOpenChange={handleOpenChange}
      >
        <DialogSurface {...makeSurfaceProps('headless')}>
          <DialogHeader data-dialog-header="">
            <DialogTitle
              data-dialog-title=""
              className={example.consumer ? styles.consumerTitle : undefined}
            >
              Project access
            </DialogTitle>
            {example.headerClose && (
              <DialogTrigger>
                <Button as="button" type="button" appearance="subtle" size="small">
                  Close header
                </Button>
              </DialogTrigger>
            )}
          </DialogHeader>
          <DialogBody
            id={`${fixtureId}-headless-description`}
            data-dialog-content=""
            className={example.consumer ? styles.consumerBody : undefined}
          >
            <DialogCopy long={example.longContent} />
          </DialogBody>
          <DialogActions
            {...example.actions}
            data-dialog-actions=""
            className={example.consumer ? styles.consumerActions : undefined}
          >
            <DialogTrigger>
              <Button as="button" type="button">
                Cancel
              </Button>
            </DialogTrigger>
            <DialogTrigger>
              <Button as="button" type="button" appearance="primary">
                Share project
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export function DialogControlledFlow({
  modalType = 'modal',
  onOpenChange,
  defaultOpen = false,
  vetoClose = false,
}: {
  modalType?: DialogModalType;
  onOpenChange?: DialogProps['onOpenChange'];
  defaultOpen?: boolean;
  vetoClose?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [preventClose, setPreventClose] = React.useState(vetoClose);
  const [outside, setOutside] = React.useState(0);
  const [events, setEvents] = React.useState<string[]>([]);
  const descriptionId = React.useId();
  return (
    <div className={styles.flow}>
      <button type="button" data-testid="dialog-pointer-rest">
        Before project dialog
      </button>
      <Dialog
        modalType={modalType}
        open={open}
        unmountOnClose={false}
        onOpenChange={(event, data) => {
          setEvents((previous) => [...previous, `${data.type}:${String(data.open)}`]);
          onOpenChange?.(event, data);
          if (!data.open && preventClose) event.preventDefault();
          if (!event.defaultPrevented) setOpen(data.open);
        }}
      >
        <DialogTrigger>
          <Button as="button" type="button">
            Open project dialog
          </Button>
        </DialogTrigger>
        <DialogSurface aria-describedby={descriptionId} data-testid="project-dialog">
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className={styles.copy} id={descriptionId}>
              Update the project note before saving.
            </p>
            {vetoClose && (
              <Checkbox
                label="Keep dialog open"
                checked={preventClose}
                onChange={(_, data) => setPreventClose(data.checked === true)}
              />
            )}
            <label>
              Project note <input name="note" defaultValue="Initial note" />
            </label>
            <Button as="button" type="button">
              Preview note
            </Button>
          </DialogBody>
          <DialogActions>
            <DialogTrigger>
              <Button as="button" type="button">
                Close project dialog
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>
      <div
        className={[styles.controls, modalType === 'non-modal' && styles.outsideControls]
          .filter(Boolean)
          .join(' ')}
      >
        <button type="button" onClick={() => setOutside((count) => count + 1)}>
          Outside project action
        </button>
        <output aria-label="Outside project count">{outside}</output>
      </div>
      <output aria-label="Dialog event log">{events.join('|')}</output>
    </div>
  );
}

export function DialogConfirmationFlow({ alert = false }: { alert?: boolean }) {
  const [reviewed, setReviewed] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  return (
    <div className={styles.flow}>
      <Dialog modalType={alert ? 'alert' : 'modal'}>
        <DialogTrigger>
          <Button as="button" type="button">
            Review sharing
          </Button>
        </DialogTrigger>
        <DialogSurface aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Share Atlas?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Checkbox
              checked={reviewed}
              onChange={(_, data) => setReviewed(data.checked === true)}
              label="I reviewed access"
            />
          </DialogBody>
          <DialogActions>
            <DialogTrigger>
              <Button as="button" type="button">
                Cancel sharing
              </Button>
            </DialogTrigger>
            <DialogTrigger>
              <Button
                as="button"
                type="button"
                appearance="primary"
                disabled={!reviewed}
                onClick={() => setConfirmed(true)}
              >
                Confirm sharing
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>
      <output aria-label="Sharing result">{confirmed ? 'Atlas shared' : 'Not shared'}</output>
    </div>
  );
}

export function DialogFormFlow() {
  const [open, setOpen] = React.useState(false);
  const [submission, setSubmission] = React.useState('');
  const [submitter, setSubmitter] = React.useState('');
  const formId = React.useId();
  return (
    <div className={styles.flow}>
      <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DialogTrigger>
          <Button as="button" type="button">
            Edit project
          </Button>
        </DialogTrigger>
        <DialogSurface aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Atlas</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form
              className={styles.form}
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                const native = event.nativeEvent;
                if (!(native instanceof SubmitEvent))
                  throw new Error('Expected native SubmitEvent');
                const action = native.submitter;
                if (!(action instanceof HTMLButtonElement)) {
                  throw new Error('Expected the native Save project submitter');
                }
                setSubmission(
                  JSON.stringify(Object.fromEntries(new FormData(event.currentTarget, action))),
                );
                setSubmitter(`${native.type}:${action.name}:${action.value}`);
                setOpen(false);
              }}
            >
              <Field label="Project name" required>
                <Input name="project" required defaultValue="Atlas" />
              </Field>
            </form>
          </DialogBody>
          <DialogActions>
            <DialogTrigger>
              <Button as="button" type="button">
                Cancel edit
              </Button>
            </DialogTrigger>
            <Button
              as="button"
              type="submit"
              form={formId}
              name="intent"
              value="save"
              appearance="primary"
            >
              Save project
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
      <output className={styles.formResult} aria-label="Project submission">
        {submission}
      </output>
      <output aria-label="Project submitter">{submitter}</output>
    </div>
  );
}

function DialogContextSummary({ label }: { label: string }) {
  const context = useDialogContext();
  const inside = useDialogSurfaceContext();
  return (
    <output aria-label={label}>
      {`${String(context.open)}:${context.modalType}:${String(context.isNestedDialog)}:${String(inside)}`}
    </output>
  );
}

export function DialogNestedFlow() {
  const [helpOpen, setHelpOpen] = React.useState(false);
  return (
    <Dialog>
      <DialogTrigger>
        <Button as="button" type="button">
          Open outer dialog
        </Button>
      </DialogTrigger>
      <DialogSurface aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Outer project dialog</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogContextSummary label="Outer dialog context" />
          <Dialog>
            <DialogTrigger>
              <Button as="button" type="button">
                Open inner dialog
              </Button>
            </DialogTrigger>
            <DialogSurface aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Inner project dialog</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <DialogContextSummary label="Inner dialog context" />
              </DialogBody>
              <DialogActions>
                <DialogTrigger>
                  <Button as="button" type="button">
                    Close inner dialog
                  </Button>
                </DialogTrigger>
              </DialogActions>
            </DialogSurface>
          </Dialog>
          <Popover
            positioning="below"
            open={helpOpen}
            onOpenChange={(_, data) => setHelpOpen(data.open)}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Button as="button" type="button">
                Open project help
              </Button>
            </PopoverTrigger>
            <PopoverSurface
              aria-label="Project help"
              role="note"
              tabIndex={0}
              onKeyDown={(event) => {
                // Leave native Escape dismissal to the popover, not the parent dialog.
                if (event.key === 'Escape') event.stopPropagation();
              }}
            >
              <p className={styles.copy}>Help remains in the native top layer above the dialog.</p>
              <button type="button" onClick={() => setHelpOpen(false)}>
                Close project help
              </button>
            </PopoverSurface>
          </Popover>
        </DialogBody>
        <DialogActions>
          <DialogTrigger>
            <Button as="button" type="button">
              Close outer dialog
            </Button>
          </DialogTrigger>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
