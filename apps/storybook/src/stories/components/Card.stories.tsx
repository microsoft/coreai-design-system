// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import {
  Button,
  Text,
  Checkbox,
  Radio,
  RadioGroup,
  useId,
  Card,
  CardHeader,
  CardFooter,
  CardPreview,
  type CardProps,
  type CardFloatingActionPosition,
} from '@coreai-ds/react-components';

import { MoreHorizontal20Regular, ArrowReplyRegular, ShareRegular } from '@fluentui/react-icons';
// CoreAI's `Card` defaults to `filled-alternative` and adds the
// `floatingActionPosition` prop.

// ---------- Default (canonical Fluent story) ----------

/**
 * A typical `Card` composition: a `CardHeader` with an image, title and
 * description, a `CardPreview`, and a `CardFooter` with actions.
 */
export const Default: StoryObj = {
  render: () => {
    const resolveAsset = (asset: string) => {
      const assetUrl =
        'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/src/assets/';

      return `${assetUrl}${asset}`;
    };

    const styles = /* css */ `
      .card-default-example {
        margin: auto;
        max-width: 720px;
        width: 100%;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Card className="card-default-example">
          <CardHeader
            image={<img src={resolveAsset('avatar_elvia.svg')} alt="Elvia Atkins avatar picture" />}
            header={
              <Text preset="body">
                <b>Elvia Atkins</b> mentioned you
              </Text>
            }
            description={<Text preset="bodyS">5h ago · About us - Overview</Text>}
          />

          <CardPreview logo={<img src={resolveAsset('docx.png')} alt="Microsoft Word document" />}>
            <img
              src={resolveAsset('doc_template.png')}
              alt="Preview of a Word document: About Us - Overview"
            />
          </CardPreview>

          <CardFooter>
            <Button icon={<ArrowReplyRegular fontSize={16} />}>Reply</Button>
            <Button icon={<ShareRegular fontSize={16} />}>Share</Button>
          </CardFooter>
        </Card>
      </>
    );
  },
};

// ---------- Appearance ----------

/**
 * Under the CoreAI theme, `Card` defaults `appearance` to
 * `filled-alternative` instead of Fluent's `filled`. All four appearances
 * remain available: `filled-alternative` (CoreAI default), `filled` (stock
 * Fluent default), `outline`, and `subtle`.
 */
export const Appearance: StoryObj = {
  render: () => {
    const resolveAsset = (asset: string) => {
      const assetUrl =
        'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/src/assets/';

      return `${assetUrl}${asset}`;
    };

    const ExampleHeader = ({ title, description }: Record<string, string>) => (
      <header>
        {title ? (
          <Text as="h4" preset="heading3" block className="card-appearance-example__title">
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text as="p" preset="body" block className="card-appearance-example__description">
            {description}
          </Text>
        ) : null}
      </header>
    );

    const CardExample = (props: CardProps) => {
      const onClick = React.useCallback(() => console.log('Interactive!'), []);

      return (
        <Card {...props} className="card-appearance-example__card" onClick={onClick}>
          <CardHeader
            image={
              <img
                className="card-appearance-example__logo"
                src={resolveAsset('app_logo.svg')}
                alt="App name logo"
              />
            }
            header={
              <Text as="h5" className="card-appearance-example__app-name" weight="semibold">
                App Name
              </Text>
            }
            description={
              <Text preset="bodyS" className="card-appearance-example__caption">
                Developer
              </Text>
            }
            action={
              <Button
                appearance="transparent"
                icon={<MoreHorizontal20Regular />}
                aria-label="More options"
              />
            }
          />
          <p className="card-appearance-example__text">
            Donut chocolate bar oat cake. Dragée tiramisu lollipop bear claw. Marshmallow pastry
            jujubes toffee sugar plum.
          </p>
        </Card>
      );
    };

    const styles = /* css */ `
      .card-appearance-example {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 36px;
      }

      .card-appearance-example__title,
      .card-appearance-example__description {
        margin: 0 0 var(--spacingVerticalM);
      }

      .card-appearance-example__card {
        height: fit-content;
        max-width: 480px;
        width: 100%;
      }

      .card-appearance-example__caption {
        color: var(--colorNeutralForeground3);
      }

      .card-appearance-example__logo {
        border-radius: var(--borderRadiusMedium);
        height: 48px;
        width: 48px;
      }

      .card-appearance-example__app-name,
      .card-appearance-example__text {
        margin: 0;
      }

      .card-appearance-example__filled-section {
        background-color: var(--colorNeutralBackground3);
        margin-inline: -48px;
        padding-block: var(--spacingVerticalXL);
        padding-inline: 48px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="card-appearance-example">
          <section>
            <ExampleHeader
              title="Filled Alternative (CoreAI Default)"
              description="Under the CoreAI theme, Card defaults to `filled-alternative`. Use this for most card
              designs when displayed on a lighter gray or white surface to ensure adequate contrast between the card
              surface and the application background."
            />
            <CardExample appearance="filled-alternative" />
          </section>

          <section className="card-appearance-example__filled-section">
            <ExampleHeader
              title="Filled (on colorNeutralBackground3)"
              description="The stock Fluent default style. Explicitly opt in to `filled` when you want the original
              filled treatment instead of the CoreAI default."
            />
            <CardExample appearance="filled" />
          </section>

          <section>
            <ExampleHeader
              title="Outline"
              description="Use when you don't want a filled background color but a discernable outline (border) on the
              card."
            />
            <CardExample appearance="outline" />
          </section>

          <section>
            <ExampleHeader
              title="Subtle"
              description="This variant doesn't have a background or border for the card container. However, it does include
              interaction states that display a visible footprint when interacting with the card item."
            />
            <CardExample appearance="subtle" />
          </section>
        </div>
      </>
    );
  },
};

// ---------- FloatingActionPosition ----------

/**
 * The CoreAI `Card` adds a `floatingActionPosition` prop that re-pins the
 * `floatingAction` slot. Stock Fluent only supports the right placement;
 * this wrapper adds a `"left"` placement too.
 */
export const FloatingActionPosition: StoryObj = {
  render: () => {
    const positions: { value: CardFloatingActionPosition; label: string }[] = [
      { value: 'right', label: 'Right (default)' },
      { value: 'left', label: 'Left' },
    ];

    const PositionCard = ({
      position,
      label,
    }: {
      position: CardFloatingActionPosition;
      label: string;
    }) => {
      const [selected, setSelected] = React.useState(false);

      return (
        <Card
          className="card-floating-action-example__card"
          floatingActionPosition={position}
          floatingAction={
            <Checkbox
              checked={selected}
              aria-label={`Select ${label}`}
              onChange={(_, data) => setSelected(!!data.checked)}
            />
          }
          selected={selected}
          onSelectionChange={(_, data) => setSelected(data.selected)}
        >
          <CardHeader
            header={<Text weight="semibold">{label}</Text>}
            description={
              <Text preset="bodyS" className="card-floating-action-example__caption">
                floatingActionPosition="{position}"
              </Text>
            }
          />
        </Card>
      );
    };

    const styles = /* css */ `
      .card-floating-action-example {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 36px;
      }

      .card-floating-action-example__title {
        margin: 0 0 var(--spacingVerticalM);
      }

      .card-floating-action-example__grid {
        display: flex;
        gap: var(--spacingHorizontalL);
      }

      .card-floating-action-example__card {
        height: fit-content;
      }

      .card-floating-action-example__caption {
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="card-floating-action-example">
          <header>
            <Text as="h4" preset="heading3" block className="card-floating-action-example__title">
              Floating action position
            </Text>
            <Text as="p" preset="body" block>
              The CoreAI <code>Card</code> adds a <code>floatingActionPosition</code> prop that
              re-pins the <code>floatingAction</code> slot. Stock Fluent only supports the right
              placement; the wrapper adds a left placement.
            </Text>
          </header>

          <div className="card-floating-action-example__grid">
            {positions.map(({ value, label }) => (
              <PositionCard key={value} position={value} label={label} />
            ))}
          </div>
        </div>
      </>
    );
  },
};

// ---------- SelectableIndicatorRadio ----------

/**
 * Combines `floatingActionPosition="left"` with a `Radio` in the
 * `floatingAction` slot to build a selectable card group driven by a single
 * `RadioGroup`.
 */
export const SelectableIndicatorRadio: StoryObj = {
  render: () => {
    const options = [
      { value: 'option-1', label: 'Option 1', description: 'The recommended default' },
      { value: 'option-2', label: 'Option 2', description: 'A balanced choice' },
      { value: 'option-3', label: 'Option 3', description: 'For advanced needs' },
      { value: 'option-4', label: 'Option 4', description: 'Maximum flexibility' },
    ];
    const idPrefix = useId('card-title');
    const groupLabelId = useId('card-radio-group-label');
    const [selectedValue, setSelectedValue] = React.useState<string>('');
    const onChange = React.useCallback(
      (_: React.FormEvent<HTMLDivElement>, data: { value: string }) => setSelectedValue(data.value),
      [],
    );
    const onSelectionChange = React.useCallback(
      (value: string) => () => setSelectedValue(value),
      [],
    );

    const styles = /* css */ `
      .card-selectable-radio-example {
        display: flex;
        flex-direction: column;
        gap: var(--spacingVerticalL);
      }

      .card-selectable-radio-example__row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalL);
      }

      .card-selectable-radio-example__card {
        height: fit-content;
        max-width: 400px;
        width: 100%;
      }

      .card-selectable-radio-example__caption {
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <RadioGroup aria-labelledby={groupLabelId} value={selectedValue} onChange={onChange}>
          <div className="card-selectable-radio-example">
            <Text id={groupLabelId} weight="semibold">
              Select an option
            </Text>
            <div className="card-selectable-radio-example__row">
              {options.map(({ value, label, description }) => {
                const titleId = `${idPrefix}-${value}`;

                return (
                  <Card
                    key={value}
                    className="card-selectable-radio-example__card"
                    floatingActionPosition="left"
                    floatingAction={<Radio value={value} aria-labelledby={titleId} />}
                    selected={selectedValue === value}
                    onSelectionChange={onSelectionChange(value)}
                  >
                    <CardHeader
                      header={
                        <Text id={titleId} weight="semibold">
                          {label}
                        </Text>
                      }
                      description={
                        <Text preset="bodyS" className="card-selectable-radio-example__caption">
                          {description}
                        </Text>
                      }
                    />
                  </Card>
                );
              })}
            </div>
          </div>
        </RadioGroup>
      </>
    );
  },
};

/**
 * A card is a container that holds information and actions related to a single concept or object, like a document or a contact.
 *
 * Cards can give information prominence and create predictable patterns. While they're very flexible, it's important to use them consistently for particular use cases across experiences.
 *
 * @summary Container that groups information and actions about a single concept or object.
 */
export default {
  title: 'Components/Card/Card',
  component: Card,
  parameters: { ...figmaDesign('Card') },
};
