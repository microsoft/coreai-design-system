// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Spinner,
  Text,
  Textarea,
} from '@coreai-ds/react-components';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';
import { PageBody } from './PageBody';
const meta = {
  title: 'Templates/Pages/Page Layout',
  component: PageLayout,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof PageLayout>;
/**
 * Copy-paste template — not an importable component. Copy `templates-pages-page-layout--source-code` and its required templates.
 * The host must supply a bounded height. Use PageHeader and PageBody for insets; content scrolling
 * keeps the header/footer fixed, page scrolling moves the whole page, and panes delegates scrolling.
 * See Collection Page, Sidebar Layout, and Tabbed Page Layout for composed variants.
 * @summary Page frame with content, whole-page, and independent-pane scrolling; five examples.
 */
export default meta;
/** Basic overview with a status badge and the existing Details List template. */
export const Default: StoryObj = {
  render: () => {
    const [reviewed, setReviewed] = React.useState(false);
    const styles = /* css */ `.page-overview-example { height: 100dvh; } .page-overview-example__stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--spacingVerticalL); min-width: 0; } .page-overview-example__stack h2, .page-overview-example__stack p { margin: 0; } .page-overview-example__metadata { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--spacingVerticalM) var(--spacingHorizontalXXL); } .page-overview-example__metadata dd { margin: 0; } .page-overview-example__section { display: flex; flex-direction: column; gap: var(--spacingVerticalL); width: 100%; padding-block: var(--spacingVerticalXL); border-top: var(--strokeWidthThin) solid var(--colorNeutralBackground4); }`;
    return (
      <>
        <style>{styles}</style>
        <div className="page-overview-example">
          <PageLayout
            header={
              <PageHeader
                title="Overview"
                titleBadge={
                  <Badge appearance="tint" color="success" shape="rounded" size="small">
                    Active
                  </Badge>
                }
                description="Shared collection"
                headerActions={
                  <Button appearance="primary" onClick={() => setReviewed(!reviewed)}>
                    {reviewed ? 'Reviewed' : 'Review collection'}
                  </Button>
                }
              />
            }
          >
            <PageBody>
              <div className="page-overview-example__stack">
                <Text as="h2" preset="heading4" foreground={1}>
                  Main collection
                </Text>
                <Text as="p" preset="body" foreground={2}>
                  A shared workspace for items, reviews, and updates.
                </Text>
                <dl className="page-overview-example__metadata">
                  <dt>Location</dt>
                  <dd>Seattle</dd>
                  <dt>Environment</dt>
                  <dd>Development</dd>
                  <dt>Owner</dt>
                  <dd>Alex Morgan</dd>
                </dl>
                {Array.from({ length: 3 }, (_, index) => (
                  <section className="page-overview-example__section" key={index}>
                    <Text as="h2" preset="heading4">
                      Activity {index + 1}
                    </Text>
                    <Text as="p" preset="body" foreground={2}>
                      The latest revision is ready. Details, review notes, and change history are
                      available.
                    </Text>
                  </section>
                ))}
              </div>
            </PageBody>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** Long titles wrap without colliding with actions; only the body scrolls. */
export const LongContent: StoryObj = {
  render: () => {
    const [saved, setSaved] = React.useState(false);
    const styles = /* css */ `.page-long-example { height: 100dvh; } .page-long-example__section { padding-block: var(--spacingVerticalL); border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStroke2); }`;
    return (
      <>
        <style>{styles}</style>
        <div className="page-long-example">
          <PageLayout
            header={
              <PageHeader
                title="Shared collection and detailed review of items across multiple teams and locations"
                count={128}
                headerActions={
                  <Button onClick={() => setSaved(!saved)}>{saved ? 'Saved' : 'Save'}</Button>
                }
              />
            }
          >
            <PageBody>
              {Array.from({ length: 28 }, (_, index) => (
                <section className="page-long-example__section" key={index}>
                  <Text as="h2" preset="heading4">
                    Update {index + 1}
                  </Text>
                  <Text as="p">
                    Changes have been reviewed and are ready for the next revision.
                  </Text>
                </section>
              ))}
            </PageBody>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** The header and footer scroll together with the document. */
export const PageScroll: StoryObj = {
  render: () => {
    const styles = /* css */ `.page-scroll-example { height: 100dvh; } .page-scroll-example__section { padding-block: var(--spacingVerticalXXL); }`;
    return (
      <>
        <style>{styles}</style>
        <div className="page-scroll-example">
          <PageLayout
            scrollMode="page"
            header={<PageHeader title="Activity history" />}
            footer={<Text>End of history</Text>}
          >
            <PageBody>
              {Array.from({ length: 28 }, (_, index) => (
                <section key={index} className="page-scroll-example__section">
                  <Text as="h2" preset="heading4">
                    Revision {28 - index}
                  </Text>
                  <Text as="p">The item was updated and reviewed.</Text>
                </section>
              ))}
            </PageBody>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** Caller-owned body loading; this is separate from grid loading. @summary Explicit pending and loaded body states. */
export const Loading: StoryObj = {
  render: () => {
    const [loading, setLoading] = React.useState(true);
    const styles = /* css */ `.page-loading-example { height: 100dvh; }`;
    return (
      <>
        <style>{styles}</style>
        <div className="page-loading-example">
          <PageLayout
            header={
              <PageHeader
                title="Overview"
                headerActions={
                  <Button onClick={() => setLoading(!loading)}>
                    {loading ? 'Finish loading' : 'Reload'}
                  </Button>
                }
              />
            }
          >
            <PageBody>
              {loading ? (
                <Spinner label="Loading overview" />
              ) : (
                <Text>All changes are up to date.</Text>
              )}
            </PageBody>
          </PageLayout>
        </div>
      </>
    );
  },
};
/** Persistent submit actions, native form submission, validation, and local success. @summary Creation form with a fixed footer. */
export const CreationForm: StoryObj = {
  render: () => {
    const formId = React.useId();
    const [name, setName] = React.useState('');
    const [created, setCreated] = React.useState(false);
    const styles = /* css */ `.page-create-example { height: 100dvh; } .page-create-example__form { display: flex; flex-direction: column; align-items: stretch; gap: var(--spacingVerticalL); width: 100%; max-width: 640px; } .page-create-example__footer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacingHorizontalM); }`;
    return (
      <>
        <style>{styles}</style>
        <div className="page-create-example">
          <PageLayout
            scrollMode="panes"
            header={
              <PageHeader
                title="Create item"
                titleBadge={
                  <Badge shape="rounded" appearance="tint" color="informative" size="small">
                    Draft
                  </Badge>
                }
              />
            }
            footer={
              <div className="page-create-example__footer">
                <Button
                  type="submit"
                  form={formId}
                  appearance="primary"
                  disabled={!name.trim() || created}
                >
                  Create item
                </Button>
                {created && <Text role="status">Item created locally.</Text>}
              </div>
            }
          >
            <PageBody scrollable>
              <form
                id={formId}
                className="page-create-example__form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (name.trim()) setCreated(true);
                }}
              >
                <Field label="Name" required>
                  <Input
                    value={name}
                    onChange={(_, data) => {
                      setName(data.value);
                      setCreated(false);
                    }}
                  />
                </Field>
                <Field label="Description">
                  <Textarea rows={7} />
                </Field>
                <Checkbox label="Include history" defaultChecked />
              </form>
            </PageBody>
          </PageLayout>
        </div>
      </>
    );
  },
};
