// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Storybook story file for the Empty State template.
 * The component and all its code live in EmptyState.tsx.
 * This file owns Storybook meta and story objects. The full source is shown
 * to humans and agents via the auto-generated EmptyState.mdx (see
 * scripts/generate-template-docs.mjs — do not hand-author that file).
 *
 * Stories:
 *   Default          — compact message, actions, and link
 *   WithIllustration — illustration, message, actions, and link
 *   WithMetrics      — value propositions between the message and actions
 *   WithChoiceCards  — selectable cards for choosing a next step
 *   WithActionCards  — cards with descriptions and individual actions
 *   WithDetailCards  — dense cards for comparing detailed options
 *   NoResults        — a search or filter returned zero matches
 *   NoPermissions    — the user lacks access to the resource
 *   ErrorState       — something went wrong loading the data
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { DetailsList } from './DetailsList';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Divider,
  Link,
  Radio,
  RadioGroup,
  Text,
  tokens,
  useId,
} from '@coreai-ds/react-components';
import {
  ArrowUpRegular,
  CodeRegular,
  ErrorCircleRegular,
  LockClosedRegular,
  SearchRegular,
  SparkleRegular,
} from '@fluentui/react-icons';

/**
 * A compact empty state with a heading, two actions, and a supporting link.
 *
 * @summary Compact heading + actions + link.
 */
export const Default: StoryObj = {
  name: 'Empty State',
  render: () => (
    <EmptyState
      header="Benefit from Action Artifact"
      actions={
        <>
          <Button appearance="primary">Action</Button>
          <Button icon={<CodeRegular />}>Action in code</Button>
        </>
      }
      links={<Link href="#">How to make the coolest artifact ever</Link>}
    />
  ),
};

/**
 * Adds an illustration and supporting description to the standard empty-state
 * actions and link.
 *
 * @summary Empty state with an illustration and supporting description.
 */
export const WithIllustration: StoryObj = {
  name: 'Empty State with Illustration',
  render: () => {
    const styles = /* css */ `
      .empty-state-illustration-example__image {
        width: 64px;
        height: 64px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <EmptyState
          illustration={<SparkleRegular className="empty-state-illustration-example__image" />}
          header="Benefit from Action Artifact"
          description="Disambiguate with text or exclude entirely."
          actions={
            <>
              <Button appearance="primary">Create agent</Button>
              <Button icon={<CodeRegular />}>Code</Button>
            </>
          }
          links={<Link href="#">How to make the coolest artifact ever</Link>}
        />
      </>
    );
  },
};

/**
 * Adds a row of value propositions or metrics while retaining the standard
 * message, actions, and supporting link.
 *
 * @summary Empty state with three value-proposition metrics.
 */
export const WithMetrics: StoryObj = {
  render: () => {
    const metrics = ['Fast setup', 'Flexible tools', 'Built-in guidance'];

    const styles = /* css */ `
      .empty-state-metrics-example__metric {
        box-sizing: border-box;
        display: flex;
        flex: 0 0 200px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 200px;
        height: 72px;
        padding: var(--spacingVerticalM) var(--spacingHorizontalL);
        border-radius: var(--borderRadiusMedium);
        background: var(--colorNeutralBackground2);
        text-align: center;
      }

    `;

    return (
      <>
        <style>{styles}</style>
        <EmptyState
          header="Benefit from Action Artifact"
          description="Disambiguate with text or exclude entirely."
          metrics={
            <>
              {metrics.map((label) => (
                <div className="empty-state-metrics-example__metric" key={label}>
                  <Text preset="bodySStrong" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                    Value prop
                  </Text>
                  <Text preset="bodyStrong">{label}</Text>
                  <Text preset="bodyS">Metric label</Text>
                </div>
              ))}
            </>
          }
          actions={
            <>
              <Button appearance="primary">Action</Button>
              <Button icon={<CodeRegular />}>Action in code</Button>
            </>
          }
          links={<Link href="#">How to make the coolest artifact ever</Link>}
        />
      </>
    );
  },
};

/**
 * Uses the cards slot for a responsive group of selectable outcomes. The slot
 * accepts complete controls, so product teams own selection state and content.
 *
 * @summary Empty state with selectable option cards.
 */
export const WithChoiceCards: StoryObj = {
  render: () => {
    const options = [
      {
        value: 'quickstart',
        heading: 'Quickstart',
        description: 'Build from a guided starting point.',
      },
      {
        value: 'specific',
        heading: 'Specific outcome',
        description: 'Create a focused solution for one task.',
      },
      {
        value: 'advanced',
        heading: 'Advanced setup',
        description: 'Configure each part of the solution.',
      },
    ];
    const idPrefix = useId('empty-state-choice-title');
    const groupLabelId = useId('empty-state-choice-label');
    const [selectedValue, setSelectedValue] = React.useState('quickstart');
    const [submittedValue, setSubmittedValue] = React.useState('');
    const onChange = React.useCallback(
      (_: React.FormEvent<HTMLDivElement>, data: { value: string }) => setSelectedValue(data.value),
      [],
    );
    const onSelectionChange = React.useCallback(
      (value: string) => () => setSelectedValue(value),
      [],
    );
    const onSubmit = React.useCallback(
      (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmittedValue(selectedValue);
      },
      [selectedValue],
    );

    const styles = /* css */ `
      .empty-state-choice-example {
        width: 100%;
      }

      .empty-state-choice-example__choices {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacingVerticalS);
        width: 100%;
      }

      .empty-state-choice-example__group {
        display: flex;
        flex: 1 1 100%;
        justify-content: center;
        gap: var(--spacingHorizontalL);
        width: 100%;
        max-width: 800px;
      }

      .empty-state-choice-example__card {
        box-sizing: border-box;
        display: flex;
        flex: 0 0 auto;
        width: 256px;
        min-height: 84px;
        text-align: left;
      }

      .empty-state-choice-example__header {
        flex: 1;
        min-width: 0;
        row-gap: var(--spacingVerticalXXS);
      }

      @media (max-width: 848px) {
        .empty-state-choice-example__group {
          flex-direction: column;
          align-items: center;
        }
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <form className="empty-state-choice-example" onSubmit={onSubmit}>
          <EmptyState
            header="What would you like to create?"
            description="Choose the outcome that best matches your goal."
            cards={
              <div className="empty-state-choice-example__choices">
                <Text id={groupLabelId} weight="semibold">
                  Creation method
                </Text>
                <RadioGroup
                  name="creation-method"
                  value={selectedValue}
                  onChange={onChange}
                  layout="horizontal"
                  className="empty-state-choice-example__group"
                  aria-labelledby={groupLabelId}
                >
                  {options.map(({ value, heading, description }) => {
                    const titleId = `${idPrefix}-${value}`;

                    return (
                      <Card
                        key={value}
                        className="empty-state-choice-example__card"
                        floatingActionPosition="left"
                        floatingAction={<Radio value={value} aria-labelledby={titleId} />}
                        selected={selectedValue === value}
                        onSelectionChange={onSelectionChange(value)}
                      >
                        <CardHeader
                          className="empty-state-choice-example__header"
                          header={
                            <Text id={titleId} preset="heading5" foreground={1}>
                              {heading}
                            </Text>
                          }
                          description={<Text preset="bodyS">{description}</Text>}
                        />
                      </Card>
                    );
                  })}
                </RadioGroup>
              </div>
            }
            actions={
              <>
                <Button appearance="primary" type="submit">
                  Continue
                </Button>
                <Button type="button" icon={<CodeRegular />}>
                  Action in code
                </Button>
                {submittedValue ? (
                  <Text role="status">Selected method: {submittedValue}</Text>
                ) : null}
              </>
            }
            links={<Link href="#">Compare creation methods</Link>}
          />
        </form>
      </>
    );
  },
};

/**
 * Uses cards for separate onboarding paths. Each card owns its description and
 * actions, while the supporting link remains common to the empty state.
 *
 * @summary Empty state with three action cards for onboarding paths.
 */
export const WithActionCards: StoryObj = {
  render: () => {
    const actions = [
      {
        heading: 'Connect data sources',
        description:
          'Integrate with your enterprise data from supported sources like Fabric, Cosmos, Blob storage, and more.',
        action: 'Connect',
      },
      {
        heading: 'Upload files',
        description: 'Add files that can provide context for any agent in your project.',
        action: 'Upload',
      },
      {
        heading: 'Integrate Microsoft IQ',
        description: (
          <>
            Set up IQ integration for full business intelligence in your agents.{' '}
            <Link href="#">What can Work IQ do?</Link>
          </>
        ),
        action: 'Integrate',
      },
    ];

    const styles = /* css */ `
      .empty-state-actions-example__card {
        box-sizing: border-box;
        display: flex;
        flex: 0 0 auto;
        width: 256px;
        height: 148px;
        text-align: left;
      }

      .empty-state-actions-example__header {
        flex: 1;
        align-content: start;
        row-gap: var(--spacingVerticalXS);
      }

      .empty-state-actions-example__footer {
        gap: var(--spacingHorizontalXS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <EmptyState
          header="Benefit from Action Artifact"
          cards={
            <>
              {actions.map(({ heading, description, action }) => (
                <Card className="empty-state-actions-example__card" key={heading}>
                  <CardHeader
                    className="empty-state-actions-example__header"
                    header={
                      <Text preset="heading5" foreground={1}>
                        {heading}
                      </Text>
                    }
                    description={<Text preset="bodyS">{description}</Text>}
                  />
                  <CardFooter className="empty-state-actions-example__footer">
                    <Button>{action}</Button>
                    <Button appearance="transparent" icon={<CodeRegular />}>
                      Use code
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </>
          }
          links={<Link href="#">How to make the coolest artifact ever</Link>}
        />
      </>
    );
  },
};

/**
 * Uses two equal-width cards with the Details List template for comparing
 * Before and Upsell options, including improvement indicators, before taking action.
 *
 * @summary Empty state with two equal-width detail cards, actions, and a link.
 */
export const WithDetailCards: StoryObj = {
  render: () => {
    const options = [
      { label: 'Before', isUpsell: false },
      { label: 'Upsell', isUpsell: true },
    ].map((option) => ({
      ...option,
      items: ['first', 'second', 'third'].map((key) => ({
        key,
        label: <Text preset="bodyS">Primary text slot</Text>,
        value: (
          <span className="empty-state-details-example__value">
            <Text preset="bodyS" foreground={3}>
              00:00 AM
            </Text>
            {option.isUpsell && (
              <Text
                preset="bodyS"
                className="empty-state-details-example__improvement"
                aria-label="97% increase"
              >
                <ArrowUpRegular aria-hidden="true" />
                97%
              </Text>
            )}
          </span>
        ),
      })),
    }));

    const styles = /* css */ `
      .empty-state-details-example__card {
        box-sizing: border-box;
        flex: 0 0 auto;
        width: 392px;
        max-width: 100%;
        height: 197px;
        gap: var(--spacingVerticalS);
        padding: var(--spacingVerticalL) var(--spacingHorizontalL);
        text-align: left;
      }

      .empty-state-details-example__list {
        row-gap: var(--spacingVerticalS);
        line-height: var(--lineHeightBase200);
      }

      .empty-state-details-example__card--upsell {
        border-color: var(--colorBrandStroke1);
      }

      .empty-state-details-example__value {
        display: flex;
        align-items: center;
        gap: var(--spacingHorizontalM);
      }

      .empty-state-details-example__improvement {
        display: inline-flex;
        align-items: center;
        gap: var(--spacingHorizontalXXS);
        color: var(--colorStatusSuccessForeground1);
      }

      .empty-state-details-example__row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacingHorizontalM);
      }

      .empty-state-details-example__header {
        row-gap: var(--spacingVerticalXXS);
      }

      .empty-state-details-example__option {
        white-space: nowrap;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <EmptyState
          header="Benefit from Action Artifact"
          cards={
            <>
              {options.map(({ label, isUpsell, items }) => (
                <Card
                  className={`empty-state-details-example__card${isUpsell ? ' empty-state-details-example__card--upsell' : ''}`}
                  key={label}
                >
                  <CardHeader
                    className="empty-state-details-example__header"
                    header={
                      <Text preset="heading5" foreground={1}>
                        Card title
                      </Text>
                    }
                    description={<Text preset="bodyS">Additional metadata</Text>}
                    action={
                      <Badge
                        appearance="tint"
                        color={isUpsell ? 'brand' : 'subtle'}
                        shape="rounded"
                        className="empty-state-details-example__option"
                      >
                        {label}
                      </Badge>
                    }
                  />
                  <Divider />
                  <DetailsList
                    items={items}
                    className="empty-state-details-example__list"
                    itemClassName="empty-state-details-example__row"
                  />
                </Card>
              ))}
            </>
          }
          actions={
            <>
              <Button appearance="primary">Action</Button>
              <Button icon={<CodeRegular />}>Action in code</Button>
            </>
          }
          links={<Link href="#">How to make the coolest artifact ever</Link>}
        />
      </>
    );
  },
};

/**
 * No results: a search or filter returned zero matches. Inform the user what
 * was searched and suggest how to recover without adding an unnecessary CTA.
 *
 * @summary Search or filter returned zero matches with guidance text only.
 */
export const NoResults: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<SearchRegular />}
      header="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  ),
};

/**
 * No permissions: the signed-in user lacks access to this resource. Offer a
 * secondary request-access action rather than a primary creation action.
 *
 * @summary User lacks access with a secondary request-access action.
 */
export const NoPermissions: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<LockClosedRegular />}
      header="Access required"
      description="You don't have permission to view this content."
      actions={<Button appearance="secondary">Request access</Button>}
    />
  ),
};

/**
 * Error state: data failed to load. Provide a primary retry action so the user
 * can recover in place without reloading the full page.
 *
 * @summary Data failed to load with a primary in-place retry action.
 */
export const ErrorState: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<ErrorCircleRegular />}
      header="Something went wrong"
      description="An error occurred while loading this content."
      actions={<Button appearance="primary">Try again</Button>}
    />
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-empty-state--source-code` docs entry.
 *
 * Composable empty-state layout with optional illustration, description,
 * metrics, cards, actions, and links.
 *
 * @summary Slot-based empty-state layout with 9 composition examples.
 */
const meta: Meta = {
  title: 'Templates/Empty State',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
