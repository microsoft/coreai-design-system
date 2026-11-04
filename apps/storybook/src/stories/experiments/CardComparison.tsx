// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  Card as LegacyCard,
  CardFooter as LegacyCardFooter,
  CardHeader as LegacyCardHeader,
  CardPreview as LegacyCardPreview,
  Image as LegacyImage,
  Text,
} from '@coreai-ds/react-components';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Image,
  type CardProps,
} from '@coreai-ds/react-headless-components';
import styles from './CardComparison.module.css';

export const cardAppearances = ['filled', 'filled-alternative', 'outline', 'subtle'] as const;
export const cardSizes = ['small', 'medium', 'large'] as const;
export const cardOrientations = ['vertical', 'horizontal'] as const;
export const cardFloatingActionPositions = ['right', 'left'] as const;

export const cardImageSource = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><rect width="320" height="120" fill="#d9e8f7"/><path d="M0 120 90 30l80 60 60-70 90 100Z" fill="#5b83b4"/></svg>',
)}`;
export const cardLogoSource = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="4" fill="#365b9d"/><path d="m8 23 8-15 8 15h-4l-4-8-4 8Z" fill="white"/></svg>',
)}`;

const noop = () => undefined;

export interface CardExample {
  name: string;
  props?: CardProps;
  preview?: 'first' | 'middle' | 'last' | 'only' | 'none';
  header?: 'full' | 'no-description' | 'no-image' | 'no-action' | 'description-only' | 'none';
  nativeLogo?: boolean;
  floating?: boolean;
  tintedText?: boolean;
  consumer?: boolean;
}

export const cardExamples: readonly CardExample[] = [
  { name: 'Default composition' },
  {
    name: 'Explicit undefined visual props',
    props: {
      appearance: undefined,
      size: undefined,
      orientation: undefined,
      floatingActionPosition: undefined,
    },
  },
  ...cardAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance },
  })),
  ...cardSizes.map((size) => ({ name: `Size: ${size}`, props: { size } })),
  { name: 'Horizontal composition', props: { orientation: 'horizontal' }, preview: 'first' },
  ...cardAppearances.map((appearance) => ({
    name: `Interactive: ${appearance}`,
    props: { appearance, onClick: noop },
  })),
  ...cardAppearances.map((appearance) => ({
    name: `Selected: ${appearance}`,
    props: { appearance, selected: true },
  })),
  ...cardAppearances.map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, disabled: true, onClick: noop },
  })),
  {
    name: 'Selected and disabled',
    props: { selected: true, disabled: true },
  },
  { name: 'Uncontrolled selected', props: { defaultSelected: true } },
  { name: 'Preview first', preview: 'first' },
  { name: 'Preview last', preview: 'last' },
  { name: 'Preview only', preview: 'only', header: 'none' },
  { name: 'No preview', preview: 'none' },
  { name: 'Header flex layout', header: 'no-description' },
  { name: 'Header without image', header: 'no-image' },
  { name: 'Header without action', header: 'no-action' },
  { name: 'Header description only', header: 'description-only' },
  { name: 'Native image logo slot', nativeLogo: true },
  { name: 'Custom Text color', tintedText: true, props: { onClick: noop } },
  ...cardFloatingActionPositions.map((floatingActionPosition) => ({
    name: `Floating action: ${floatingActionPosition}`,
    floating: true,
    preview: 'first' as const,
    props: { floatingActionPosition },
  })),
  {
    name: 'Left rail reserves space without an action',
    props: { floatingActionPosition: 'left' },
  },
];

export const cardConsumerExample: CardExample = {
  name: 'Consumer CSS Modules',
  consumer: true,
  floating: true,
};

function ExampleCell({
  implementation,
  example,
}: {
  implementation: 'legacy' | 'headless';
  example: CardExample;
}): React.ReactElement {
  const Root = implementation === 'legacy' ? LegacyCard : Card;
  const Header = implementation === 'legacy' ? LegacyCardHeader : CardHeader;
  const Preview = implementation === 'legacy' ? LegacyCardPreview : CardPreview;
  const Footer = implementation === 'legacy' ? LegacyCardFooter : CardFooter;
  const Control = implementation === 'legacy' ? LegacyButton : Button;
  const Media = implementation === 'legacy' ? LegacyImage : Image;
  const { consumer, props, nativeLogo, floating, tintedText } = example;
  const previewPosition = example.preview ?? 'middle';
  const headerKind = example.header ?? 'full';
  const disabled = props?.disabled;

  const preview = (
    <Preview
      className={[
        styles.preview,
        props?.orientation === 'horizontal' && styles.horizontalPreview,
        consumer && styles.consumerPreview,
      ]
        .filter(Boolean)
        .join(' ')}
      logo={
        nativeLogo
          ? {
              as: 'img',
              src: cardLogoSource,
              alt: 'Atlas document',
              className: consumer ? styles.consumerLogo : undefined,
            }
          : {
              children: <img src={cardLogoSource} alt="Atlas document" width={32} height={32} />,
              className: consumer ? styles.consumerLogo : undefined,
            }
      }
    >
      <Media src={cardImageSource} alt="Mountain project preview" fit="cover" />
    </Preview>
  );

  return (
    <div data-card-implementation={implementation}>
      <Root
        {...props}
        aria-label={example.name}
        className={[styles.card, consumer && styles.consumerCard, props?.className]
          .filter(Boolean)
          .join(' ')}
        floatingAction={
          floating
            ? {
                className: consumer ? styles.consumerFloating : undefined,
                children: (
                  <button
                    className={styles.railButton}
                    type="button"
                    aria-label="Pin Atlas"
                    disabled={disabled}
                  >
                    +
                  </button>
                ),
              }
            : props?.floatingAction
        }
      >
        {(previewPosition === 'first' || previewPosition === 'only') && preview}
        {previewPosition !== 'only' && (
          <>
            {headerKind !== 'none' && (
              <Header
                className={consumer ? styles.consumerHeader : undefined}
                image={
                  headerKind === 'no-image' || headerKind === 'description-only'
                    ? null
                    : {
                        as: 'img',
                        src: cardLogoSource,
                        alt: 'Atlas logo',
                        width: 32,
                        height: 32,
                        className: consumer ? styles.consumerHeaderImage : undefined,
                      }
                }
                header={
                  headerKind === 'description-only'
                    ? null
                    : {
                        children: 'Project Atlas',
                        className: consumer ? styles.consumerTitle : undefined,
                      }
                }
                description={
                  headerKind === 'no-description'
                    ? null
                    : {
                        children: 'Updated today',
                        className: consumer ? styles.consumerDescription : undefined,
                      }
                }
                action={
                  headerKind === 'no-action' || headerKind === 'description-only'
                    ? null
                    : {
                        className: consumer ? styles.consumerHeaderAction : undefined,
                        children: (
                          <Control
                            as="button"
                            type="button"
                            appearance="transparent"
                            size="small"
                            disabled={disabled}
                          >
                            More
                          </Control>
                        ),
                      }
                }
              />
            )}
            {props?.orientation !== 'horizontal' && (
              <div data-card-fixture-content="">
                {tintedText ? (
                  <Text foreground={3}>A shared place for project notes.</Text>
                ) : (
                  'A shared place for project notes.'
                )}
              </div>
            )}
            {previewPosition === 'middle' && preview}
            {props?.orientation !== 'horizontal' && (
              <Footer
                className={consumer ? styles.consumerFooter : undefined}
                action={{
                  className: consumer ? styles.consumerFooterAction : undefined,
                  children: (
                    <Control
                      as="button"
                      type="button"
                      size="small"
                      appearance="transparent"
                      disabled={disabled}
                    >
                      Details
                    </Control>
                  ),
                }}
              >
                <Control as="button" type="button" size="small" disabled={disabled}>
                  Open
                </Control>
              </Footer>
            )}
            {previewPosition === 'last' && preview}
          </>
        )}
      </Root>
    </div>
  );
}

export function CardComparison({
  examples = cardExamples,
}: {
  examples?: readonly CardExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div className={styles.row} key={example.name} data-card-case={example.name}>
          <span>
            {example.name}
            {example.tintedText && (
              <span className={styles.tintedText} data-card-color-reference="">
                {' '}
                (foreground 3)
              </span>
            )}
          </span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}

export interface CardSelectionFlowProps {
  onSelectionChange?: CardProps['onSelectionChange'];
  onAction?: React.MouseEventHandler<HTMLButtonElement>;
}

export function CardSelectionFlow({
  onSelectionChange,
  onAction,
}: CardSelectionFlowProps): React.ReactElement {
  const [selected, setSelected] = React.useState(false);
  const [changes, setChanges] = React.useState(0);
  const [actions, setActions] = React.useState(0);
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState(true);

  return (
    <div className={styles.flow}>
      <p>
        Native Tab reaches the hidden selection checkbox, then the nested actions. Space selects
        from the checkbox. The supplied checkbox click handler stops bubbling to avoid the current
        primitive reporting both click and change for one native checkbox activation. A public
        restriction predicate keeps nested actions from selecting the card; the primitive does not
        add the legacy focus-aware predicate. The nested button stops Enter bubbling because the
        primitive otherwise cancels its native Enter activation before checking that predicate.
      </p>
      <button type="button">Start keyboard selection</button>
      <Card
        className={styles.card}
        aria-label="Selectable Atlas"
        selected={selected}
        checkbox={{ onClick: (event) => event.stopPropagation() }}
        shouldRestrictTriggerAction={(event) =>
          event.target instanceof Element && Boolean(event.target.closest('button, a, input'))
        }
        onSelectionChange={(event, data) => {
          setSelected(data.selected);
          setChanges((count) => count + 1);
          onSelectionChange?.(event, data);
        }}
      >
        <CardHeader
          header={<h3 className={styles.flowTitle}>Project Atlas</h3>}
          description="Shared project"
          action={
            <Button
              as="button"
              type="button"
              size="small"
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.stopPropagation();
              }}
              onClick={(event) => {
                setActions((count) => count + 1);
                onAction?.(event);
              }}
            >
              Open Atlas actions
            </Button>
          }
        />
        <p className={styles.flowText}>Select the Atlas card body.</p>
      </Card>
      <output aria-label="Atlas selection" aria-live="polite">
        {selected ? 'Selected' : 'Not selected'}; changes: {changes}; actions: {actions}
      </output>
      <Card
        className={styles.card}
        aria-label="Initially selected Borealis"
        defaultSelected
        checkbox={{ onClick: (event) => event.stopPropagation() }}
        onSelectionChange={(_event, data) => setUncontrolledSelected(data.selected)}
      >
        <CardHeader header="Project Borealis" description="Uncontrolled default selection" />
      </Card>
      <output aria-label="Borealis selection">
        {uncontrolledSelected ? 'Selected' : 'Not selected'}
      </output>
    </div>
  );
}

export function CardNativeActionsFlow(): React.ReactElement {
  const [submitted, setSubmitted] = React.useState('No submission');
  const [submissions, setSubmissions] = React.useState(0);
  const [pins, setPins] = React.useState(0);
  const [visits, setVisits] = React.useState(0);
  const targetId = `card-project-${React.useId().replace(/:/g, '')}`;
  const originalUrl = React.useRef(window.location.href);

  React.useEffect(() => {
    const original = originalUrl.current;
    const onHashChange = () => {
      if (window.location.hash === `#${targetId}`) setVisits((count) => count + 1);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.history.replaceState(null, '', original);
    };
  }, [targetId]);

  return (
    <div className={styles.flow}>
      <p>
        Card is a noninteractive group. Its children keep native button, link, and form semantics.
      </p>
      <button type="button">Start keyboard actions</button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const submitter =
            event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
          const data = new FormData(event.currentTarget, submitter);
          setSubmitted(`${data.get('project')}:${data.get('action')}`);
          setSubmissions((count) => count + 1);
        }}
      >
        <input type="hidden" name="project" value="Atlas" />
        <Card
          className={styles.card}
          aria-label="Atlas actions"
          floatingActionPosition="left"
          floatingAction={
            <button
              className={styles.railButton}
              type="button"
              aria-label="Pin project"
              onClick={() => setPins((count) => count + 1)}
            >
              +
            </button>
          }
        >
          <CardHeader header="Project Atlas" description="Native form actions" />
          <CardPreview className={styles.preview}>
            <Image src={cardImageSource} alt="Atlas mountain preview" fit="cover" />
          </CardPreview>
          <CardFooter action={<a href={`#${targetId}`}>Project details</a>}>
            <Button as="button" type="submit" name="action" value="open">
              Open project
            </Button>
          </CardFooter>
        </Card>
      </form>
      <output aria-label="Project submission" aria-live="polite">
        {submitted}; submissions: {submissions}
      </output>
      <output aria-label="Project pins">Pins: {pins}</output>
      <output aria-label="Project visits">Visits: {visits}</output>
      <p id={targetId}>Atlas project destination</p>
    </div>
  );
}
