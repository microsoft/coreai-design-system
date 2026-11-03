// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button as LegacyButton,
  TeachingPopover as LegacyTeachingPopover,
  TeachingPopoverBody as LegacyTeachingPopoverBody,
  TeachingPopoverCarousel as LegacyTeachingPopoverCarousel,
  TeachingPopoverCarouselCard as LegacyTeachingPopoverCarouselCard,
  TeachingPopoverCarouselFooter as LegacyTeachingPopoverCarouselFooter,
  TeachingPopoverCarouselNav as LegacyTeachingPopoverCarouselNav,
  TeachingPopoverCarouselNavButton as LegacyTeachingPopoverCarouselNavButton,
  TeachingPopoverCarouselPageCount as LegacyTeachingPopoverCarouselPageCount,
  TeachingPopoverFooter as LegacyTeachingPopoverFooter,
  TeachingPopoverHeader as LegacyTeachingPopoverHeader,
  TeachingPopoverSurface as LegacyTeachingPopoverSurface,
  TeachingPopoverTitle as LegacyTeachingPopoverTitle,
  TeachingPopoverTrigger as LegacyTeachingPopoverTrigger,
} from '@coreai-ds/react-components';
import {
  Button,
  TeachingPopover,
  TeachingPopoverBody,
  TeachingPopoverCarousel,
  TeachingPopoverCarouselCard,
  TeachingPopoverCarouselFooter,
  TeachingPopoverCarouselNav,
  TeachingPopoverCarouselNavButton,
  TeachingPopoverCarouselPageCount,
  TeachingPopoverFooter,
  TeachingPopoverHeader,
  TeachingPopoverSurface,
  TeachingPopoverTitle,
  TeachingPopoverTrigger,
  type TeachingPopoverBodySlots,
  type TeachingPopoverProps,
} from '@coreai-ds/react-headless-components';
import {
  resolvePositioningShorthand,
  type PositioningImperativeRef,
} from '@fluentui/react-headless-components-preview/positioning';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import styles from './TeachingPopoverComparison.module.css';

export interface TeachingPopoverExample {
  name: string;
  props?: Pick<TeachingPopoverProps, 'appearance' | 'size' | 'withArrow' | 'positioning'>;
  mediaLength?: 'short' | 'medium' | 'tall';
  titleDismiss?: boolean;
  footerLayout?: 'horizontal' | 'vertical';
  carousel?: boolean;
  carouselLayout?: 'centered' | 'offset';
  actionSize?: 'small' | 'medium' | 'large';
  actionAppearance?: 'secondary' | 'primary' | 'outline' | 'subtle' | 'transparent';
  consumer?: boolean;
}

export const teachingPopoverExamples: readonly TeachingPopoverExample[] = [
  { name: 'Default teaching content' },
  { name: 'Explicit undefined visual props', props: { appearance: undefined, size: undefined } },
  { name: 'Small arrow', props: { size: 'small' } },
  { name: 'Large arrow', props: { size: 'large' } },
  { name: 'Without an arrow', props: { withArrow: false } },
  { name: 'Inverted content', props: { appearance: 'inverted' } },
  { name: 'Brand content', props: { appearance: 'brand' } },
  { name: 'Medium media', mediaLength: 'medium' },
  { name: 'Tall media', mediaLength: 'tall' },
  { name: 'Title dismissal', titleDismiss: true },
  { name: 'Vertical footer', footerLayout: 'vertical' },
  { name: 'Carousel centered', carousel: true },
  { name: 'Carousel brand', carousel: true, props: { appearance: 'brand' } },
  {
    name: 'Carousel brand primary actions',
    carousel: true,
    props: { appearance: 'brand' },
    actionAppearance: 'primary',
  },
  {
    name: 'Carousel brand outline actions',
    carousel: true,
    props: { appearance: 'brand' },
    actionAppearance: 'outline',
  },
  { name: 'Carousel offset', carousel: true, carouselLayout: 'offset' },
  { name: 'Carousel small actions', carousel: true, actionSize: 'small' },
  { name: 'Carousel large actions', carousel: true, actionSize: 'large' },
];

export const teachingPopoverConsumerExample: TeachingPopoverExample = {
  name: 'Consumer CSS priority',
  carousel: true,
  consumer: true,
};

type MediaFixtureProps = ExtractSlotProps<TeachingPopoverBodySlots['media']> & {
  'data-teaching-slot': 'media';
};

const mediaImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="288" height="176" viewBox="0 0 288 176"%3E%3Crect width="288" height="176" fill="%23d5e5fb"/%3E%3Crect x="30" y="24" width="228" height="128" rx="8" fill="%23fff"/%3E%3Cpath d="M48 54h112M48 78h192M48 102h168M48 126h112" stroke="%2359657a" stroke-width="8"/%3E%3C/svg%3E';

const pages = [
  { value: 'welcome', title: 'Welcome to Atlas', text: 'Keep project updates in one workspace.' },
  {
    value: 'review',
    title: 'Review together',
    text: 'Invite a teammate to review the next release.',
  },
  { value: 'ready', title: 'Ready to publish', text: 'Publish when every reviewer is ready.' },
] as const;

function ExampleContent({
  implementation,
  example,
}: {
  implementation: 'legacy' | 'headless';
  example: TeachingPopoverExample;
}) {
  const Header = implementation === 'legacy' ? LegacyTeachingPopoverHeader : TeachingPopoverHeader;
  const Title = implementation === 'legacy' ? LegacyTeachingPopoverTitle : TeachingPopoverTitle;
  const Body = implementation === 'legacy' ? LegacyTeachingPopoverBody : TeachingPopoverBody;
  const Nav =
    implementation === 'legacy' ? LegacyTeachingPopoverCarouselNav : TeachingPopoverCarouselNav;
  const NavButton =
    implementation === 'legacy'
      ? LegacyTeachingPopoverCarouselNavButton
      : TeachingPopoverCarouselNavButton;
  const PageCount =
    implementation === 'legacy'
      ? LegacyTeachingPopoverCarouselPageCount
      : TeachingPopoverCarouselPageCount;
  const Card =
    implementation === 'legacy' ? LegacyTeachingPopoverCarouselCard : TeachingPopoverCarouselCard;
  const Control = implementation === 'legacy' ? LegacyButton : Button;
  const body = (title: string, text: string) => {
    const media: MediaFixtureProps = {
      'data-teaching-slot': 'media',
      children: (
        <img className={styles.mediaImage} src={mediaImage} alt="Atlas workspace overview" />
      ),
    };
    return (
      <>
        {!example.titleDismiss && (
          <Header
            data-teaching-slot="header"
            dismissButton={{ type: 'button', 'aria-label': 'Dismiss teaching content' }}
          >
            Project tips
          </Header>
        )}
        <Body
          data-teaching-slot="body"
          mediaLength={example.mediaLength}
          media={example.carousel ? undefined : media}
        >
          <Title
            data-teaching-slot="title"
            dismissButton={
              example.titleDismiss
                ? {
                    type: 'button',
                    'aria-label': 'Dismiss teaching content',
                    'aria-hidden': false,
                  }
                : undefined
            }
          >
            {title}
          </Title>
          <p className={styles.bodyText}>{text}</p>
        </Body>
      </>
    );
  };
  if (!example.carousel) {
    const action = {
      children: 'Continue',
      size: 'medium' as const,
      shape: 'rounded' as const,
      type: 'button' as const,
      className: styles.footerAction,
    };
    return (
      <>
        {body('Welcome to Atlas', 'Keep project updates in one workspace.')}
        {implementation === 'legacy' ? (
          <LegacyTeachingPopoverFooter
            data-teaching-slot="footer"
            footerLayout={example.footerLayout}
            primary={action}
          />
        ) : (
          <TeachingPopoverFooter data-teaching-slot="footer" footerLayout={example.footerLayout}>
            <Control {...action} appearance="primary" />
          </TeachingPopoverFooter>
        )}
      </>
    );
  }
  const previous = {
    navType: 'prev' as const,
    altText: 'Skip',
    children: 'Back',
    type: 'button' as const,
    size: example.actionSize ?? 'medium',
    shape: 'rounded' as const,
    ...(example.actionAppearance ? { appearance: example.actionAppearance } : {}),
  };
  const next = {
    navType: 'next' as const,
    altText: 'Done',
    children: 'Next',
    type: 'button' as const,
    size: example.actionSize ?? 'medium',
    shape: 'rounded' as const,
    ...(example.actionAppearance ? { appearance: example.actionAppearance } : {}),
  };
  const children = (
    <>
      {pages.map((item) => (
        <Card key={item.value} value={item.value} data-teaching-slot="card">
          {body(item.title, item.text)}
        </Card>
      ))}
      {implementation === 'legacy' ? (
        <LegacyTeachingPopoverCarouselFooter
          data-teaching-slot="carousel-footer"
          layout={example.carouselLayout}
          initialStepText="Skip"
          finalStepText="Done"
          previous={previous}
          next={next}
        >
          <div className={styles.indicators}>
            <Nav data-teaching-slot="nav" aria-label="Tour steps">
              {(value) => <NavButton as="button" aria-label={`Go to ${value}`} />}
            </Nav>
            <PageCount data-teaching-slot="page-count">
              {(current, total) => `${current} / ${total}`}
            </PageCount>
          </div>
        </LegacyTeachingPopoverCarouselFooter>
      ) : (
        <TeachingPopoverCarouselFooter
          data-teaching-slot="carousel-footer"
          layout={example.carouselLayout}
          previous={previous}
          next={next}
        >
          <div className={styles.indicators}>
            <Nav data-teaching-slot="nav" aria-label="Tour steps">
              {(value) => <NavButton as="button" aria-label={`Go to ${value}`} />}
            </Nav>
            <PageCount data-teaching-slot="page-count">
              {(current, total) => `${current} / ${total}`}
            </PageCount>
          </div>
        </TeachingPopoverCarouselFooter>
      )}
    </>
  );
  return implementation === 'legacy' ? (
    <LegacyTeachingPopoverCarousel defaultValue="welcome">{children}</LegacyTeachingPopoverCarousel>
  ) : (
    <TeachingPopoverCarousel defaultValue="welcome">{children}</TeachingPopoverCarousel>
  );
}

function ExampleCell({
  implementation,
  example,
  fixtureId,
  positioningRef,
}: {
  implementation: 'legacy' | 'headless';
  example: TeachingPopoverExample;
  fixtureId: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const Trigger =
    implementation === 'legacy' ? LegacyTeachingPopoverTrigger : TeachingPopoverTrigger;
  const Control = implementation === 'legacy' ? LegacyButton : Button;
  const position = resolvePositioningShorthand(example.props?.positioning);
  const positioning = {
    position: 'below' as const,
    offset: 10,
    pinned: true,
    ...position,
    positioningRef,
  };
  const trigger = (
    <Trigger disableButtonEnhancement>
      <Control
        as="button"
        size="medium"
        type="button"
        className={styles.trigger}
        data-teaching-trigger={implementation}
      >
        Project tips
      </Control>
    </Trigger>
  );
  const content = (
    <div data-popover-content="">
      <ExampleContent implementation={implementation} example={example} />
    </div>
  );
  const className = [styles.surface, example.consumer && styles.consumerSurface]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.cell}>
      <strong>
        {implementation === 'legacy' ? 'Current CoreAI / Griffel' : 'Native / CSS Modules'}
      </strong>
      <div className={styles.stage}>
        {implementation === 'legacy' ? (
          <LegacyTeachingPopover
            {...example.props}
            open
            trapFocus={false}
            unstable_disableAutoFocus
            surfaceMotion={null}
            positioning={positioning}
          >
            {trigger}
            <LegacyTeachingPopoverSurface
              className={className}
              aria-label={`${example.name} ${implementation}`}
              data-teaching-implementation={implementation}
              data-teaching-fixture={fixtureId}
            >
              {content}
            </LegacyTeachingPopoverSurface>
          </LegacyTeachingPopover>
        ) : (
          <TeachingPopover {...example.props} open positioning={positioning}>
            {trigger}
            <TeachingPopoverSurface
              className={className}
              aria-label={`${example.name} ${implementation}`}
              data-teaching-implementation={implementation}
              data-teaching-fixture={fixtureId}
            >
              {content}
            </TeachingPopoverSurface>
          </TeachingPopover>
        )}
      </div>
    </div>
  );
}

export function TeachingPopoverComparison({
  example = teachingPopoverExamples[0],
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example?: TeachingPopoverExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <section
      className={styles.comparison}
      data-teaching-comparison={fixtureId}
      data-teaching-example={example.name}
    >
      <div className={styles.columns}>
        <ExampleCell
          implementation="legacy"
          example={example}
          fixtureId={fixtureId}
          positioningRef={legacyPositioningRef}
        />
        <ExampleCell
          implementation="headless"
          example={example}
          fixtureId={fixtureId}
          positioningRef={headlessPositioningRef}
        />
      </div>
    </section>
  );
}

export function TeachingPopoverNativeFlow() {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState('No submission');
  const [changes, setChanges] = React.useState<string[]>([]);
  return (
    <div className={styles.flow}>
      <button type="button">Before teaching content</button>
      <TeachingPopover
        open={open}
        trapFocus
        positioning={{ position: 'below', offset: 12 }}
        onOpenChange={(event, data) => {
          const type = data.type ?? event.type;
          setOpen(data.open);
          setChanges((previous) => [...previous, `${type}:${data.open}`]);
        }}
      >
        <TeachingPopoverTrigger>
          <Button as="button" type="button" size="medium">
            Open project guide
          </Button>
        </TeachingPopoverTrigger>
        <TeachingPopoverSurface aria-label="Project guide" className={styles.flowSurface}>
          <TeachingPopoverHeader dismissButton={{ type: 'button', 'aria-label': 'Close guide' }}>
            Project setup
          </TeachingPopoverHeader>
          <TeachingPopoverBody>
            <TeachingPopoverTitle>Invite a reviewer</TeachingPopoverTitle>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const submitter =
                  event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
                const data = new FormData(form, submitter);
                setResult(`${data.get('reviewer')}:${data.get('action')}`);
              }}
            >
              <label>
                Reviewer
                <input name="reviewer" defaultValue="Morgan" required />
              </label>
              <Button as="button" size="medium" type="submit" name="action" value="invite">
                Invite reviewer
              </Button>
              <a href="#atlas-reviewer-help">Reviewer help</a>
            </form>
          </TeachingPopoverBody>
          <TeachingPopoverFooter>
            <Button as="button" size="medium" type="button" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </TeachingPopoverFooter>
        </TeachingPopoverSurface>
      </TeachingPopover>
      <button type="button">After teaching content</button>
      <output aria-label="Guide submission">{result}</output>
      <output aria-label="Guide open changes">{changes.join('|')}</output>
      <div id="atlas-reviewer-help">Reviewer help destination</div>
    </div>
  );
}

export function TeachingPopoverTourFlow() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>('welcome');
  const [locked, setLocked] = React.useState(false);
  const [changes, setChanges] = React.useState<string[]>([]);
  const [finished, setFinished] = React.useState(0);
  return (
    <div className={styles.flow}>
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />
        Keep current step
      </label>
      <TeachingPopover
        open={open}
        appearance="brand"
        positioning={{ position: 'below', offset: 12 }}
        onOpenChange={(_event, data) => setOpen(data.open)}
      >
        <TeachingPopoverTrigger>
          <Button as="button" size="medium" type="button">
            Start Atlas tour
          </Button>
        </TeachingPopoverTrigger>
        <TeachingPopoverSurface aria-label="Atlas tour" className={styles.flowSurface}>
          <TeachingPopoverCarousel
            value={value}
            announcement={(next) => `Tour step: ${next}`}
            onValueChange={(event, data) => {
              const currentTarget = event.currentTarget;
              const target =
                currentTarget instanceof Element
                  ? currentTarget.tagName.toLowerCase()
                  : 'no-element';
              const requested = data.value;
              setChanges((previous) => [
                ...previous,
                `${data.type ?? event.type}:${requested}:${target}`,
              ]);
              if (!locked && requested) setValue(requested);
            }}
            onFinish={() => setFinished((previous) => previous + 1)}
          >
            {pages.map((item) => (
              <TeachingPopoverCarouselCard key={item.value} value={item.value}>
                <TeachingPopoverHeader
                  dismissButton={{ type: 'button', 'aria-label': 'Close Atlas tour' }}
                >
                  Atlas tour
                </TeachingPopoverHeader>
                <TeachingPopoverBody>
                  <TeachingPopoverTitle>{item.title}</TeachingPopoverTitle>
                  <p className={styles.bodyText}>{item.text}</p>
                </TeachingPopoverBody>
              </TeachingPopoverCarouselCard>
            ))}
            <TeachingPopoverCarouselFooter
              previous={{
                navType: 'prev',
                altText: 'Skip tour',
                children: 'Previous',
                size: 'medium',
                type: 'button',
              }}
              next={{
                navType: 'next',
                altText: 'Finish tour',
                children: 'Next',
                size: 'medium',
                type: 'button',
              }}
            >
              <div className={styles.indicators}>
                <TeachingPopoverCarouselNav aria-label="Atlas tour steps">
                  {(page) => (
                    <TeachingPopoverCarouselNavButton as="button" aria-label={`Step ${page}`} />
                  )}
                </TeachingPopoverCarouselNav>
                <TeachingPopoverCarouselPageCount aria-label="Tour page count">
                  {(current, total) => `${current} of ${total}`}
                </TeachingPopoverCarouselPageCount>
              </div>
            </TeachingPopoverCarouselFooter>
          </TeachingPopoverCarousel>
        </TeachingPopoverSurface>
      </TeachingPopover>
      <button type="button" onClick={() => setValue('welcome')}>
        Reset tour
      </button>
      <output aria-label="Tour selected step">{value}</output>
      <output aria-label="Tour value changes">{changes.join('|')}</output>
      <output aria-label="Tour finish count">{finished}</output>
    </div>
  );
}
