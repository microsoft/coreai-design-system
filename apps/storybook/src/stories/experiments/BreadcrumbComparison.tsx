// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Breadcrumb as LegacyBreadcrumb,
  BreadcrumbButton as LegacyBreadcrumbButton,
  BreadcrumbDivider as LegacyBreadcrumbDivider,
  BreadcrumbItem as LegacyBreadcrumbItem,
} from '@coreai-ds/react-components';
import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Link,
  type BreadcrumbButtonProps,
  type BreadcrumbProps,
} from '@coreai-ds/react-headless-components';
import {
  CalendarMonthFilled,
  CalendarMonthRegular,
} from '@fluentui/react-icons/headless/svg/calendar-month';
import { MoreHorizontalRegular } from '@fluentui/react-icons/headless/svg/more-horizontal';
import styles from './BreadcrumbComparison.module.css';

export const breadcrumbSizes = ['small', 'medium', 'large'] as const;

export function BreadcrumbCalendarIcon(): React.ReactElement {
  return (
    <span className={styles.calendarGlyph} data-breadcrumb-fixture-glyph="">
      <CalendarMonthRegular className="fui-Icon-regular" aria-hidden />
      <CalendarMonthFilled className="fui-Icon-filled" aria-hidden />
    </span>
  );
}

type NativeButtonProps = Extract<BreadcrumbButtonProps, { as?: 'button' }>;
type NativeAnchorProps = Extract<BreadcrumbButtonProps, { as: 'a' }>;

interface BreadcrumbExampleBase {
  name: string;
  props?: BreadcrumbProps;
  consumer?: boolean;
}

export type BreadcrumbExample = BreadcrumbExampleBase &
  (
    | {
        content?: 'buttons' | 'text' | 'rich' | 'icon-only' | 'standalone-link';
        buttonProps?: Omit<NativeButtonProps, 'as' | 'children'>;
        currentProps?: Omit<NativeButtonProps, 'as' | 'children'>;
      }
    | {
        content: 'links';
        buttonProps?: Omit<NativeAnchorProps, 'as' | 'href' | 'children'>;
        currentProps?: Omit<NativeAnchorProps, 'as' | 'href' | 'children'>;
      }
  );

export const breadcrumbExamples: readonly BreadcrumbExample[] = [
  { name: 'Default' },
  { name: 'Explicit undefined size', props: { size: undefined } },
  ...breadcrumbSizes.map((size) => ({ name: `Size: ${size}`, props: { size } })),
  { name: 'Native anchors', content: 'links' },
  { name: 'Plain text items', content: 'text' },
  { name: 'Rich content', content: 'rich' },
  { name: 'Icon only', content: 'icon-only' },
  { name: 'Disabled button', buttonProps: { disabled: true } },
  {
    name: 'Disabled focusable',
    buttonProps: { disabled: true, disabledFocusable: true },
  },
  { name: 'Disabled anchor', content: 'links', buttonProps: { disabled: true } },
  { name: 'Current disabled', currentProps: { disabled: true } },
  {
    name: 'Current location label',
    currentProps: { 'aria-current': 'location', 'aria-label': 'Current Atlas project' },
  },
  {
    name: 'Parent owns size',
    props: { size: 'large' },
    buttonProps: { size: 'small' },
  },
];

export const breadcrumbConsumerExample: BreadcrumbExample = {
  name: 'Consumer CSS Modules',
  consumer: true,
};

function ExampleCell({
  implementation,
  example,
}: {
  implementation: 'legacy' | 'headless';
  example: BreadcrumbExample;
}): React.ReactElement {
  const Root = implementation === 'legacy' ? LegacyBreadcrumb : Breadcrumb;
  const Item = implementation === 'legacy' ? LegacyBreadcrumbItem : BreadcrumbItem;
  const Control = implementation === 'legacy' ? LegacyBreadcrumbButton : BreadcrumbButton;
  const Separator = implementation === 'legacy' ? LegacyBreadcrumbDivider : BreadcrumbDivider;
  const { name, props, consumer } = example;
  const content = example.content ?? 'buttons';
  const href = '#breadcrumb-comparison-target';
  const icon = <BreadcrumbCalendarIcon />;
  const projectIcon = {
    children: icon,
    className: consumer ? styles.consumerIcon : undefined,
  };
  let project: React.ReactNode;
  if (example.content === 'links') {
    project = (
      <Control
        as="a"
        href={href}
        icon={projectIcon}
        {...example.buttonProps}
        className={consumer ? styles.consumerButton : example.buttonProps?.className}
      >
        Projects
      </Control>
    );
  } else {
    const { buttonProps } = example;
    project = (
      <Control
        as="button"
        icon={projectIcon}
        {...buttonProps}
        aria-label={content === 'icon-only' ? 'Project overview' : buttonProps?.['aria-label']}
        className={consumer ? styles.consumerButton : buttonProps?.className}
      >
        {content === 'icon-only' ? undefined : 'Projects'}
      </Control>
    );
    if (content === 'text') project = 'Projects';
    if (content === 'rich') {
      project = (
        <Control as="button" {...buttonProps}>
          <span>
            Projects <span aria-hidden>(12)</span>
          </span>
        </Control>
      );
    }
    if (content === 'standalone-link') {
      // Composition with an independently styled Link belongs to the consumer, not BreadcrumbButton.
      project = <Link href="#breadcrumb-comparison-target">Projects</Link>;
    }
  }

  return (
    <div data-breadcrumb-implementation={implementation}>
      <Root
        {...props}
        aria-label={name}
        className={consumer ? styles.consumerRoot : props?.className}
        list={consumer ? { className: styles.consumerList } : props?.list}
      >
        <Item className={consumer ? styles.consumerItem : undefined}>
          {example.content === 'links' ? (
            <Control as="a" href={href}>
              Home
            </Control>
          ) : content === 'text' ? (
            'Home'
          ) : (
            <Control as="button">Home</Control>
          )}
        </Item>
        <Separator className={consumer ? styles.consumerDivider : undefined} />
        <Item className={consumer ? styles.consumerItem : undefined}>{project}</Item>
        <Separator className={consumer ? styles.consumerDivider : undefined} />
        <Item className={consumer ? styles.consumerItem : undefined}>
          {example.content === 'links' ? (
            <Control as="a" current href={href} icon={icon} {...example.currentProps}>
              Atlas
            </Control>
          ) : content === 'text' ? (
            <span aria-current="page">Atlas</span>
          ) : (
            <Control as="button" current icon={icon} {...example.currentProps}>
              Atlas
            </Control>
          )}
        </Item>
      </Root>
    </div>
  );
}

export function BreadcrumbComparison({
  examples = breadcrumbExamples,
}: {
  examples?: readonly BreadcrumbExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-breadcrumb-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-breadcrumb-case={example.name}>
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}

export interface BreadcrumbNavigationFlowProps {
  onLinkClick?: NativeAnchorProps['onClick'];
  onButtonClick?: NativeButtonProps['onClick'];
}

export function BreadcrumbNavigationFlow({
  onLinkClick,
  onButtonClick,
}: BreadcrumbNavigationFlowProps): React.ReactElement {
  const [page, setPage] = React.useState('Atlas');
  const [linkClicks, setLinkClicks] = React.useState(0);
  const [buttonClicks, setButtonClicks] = React.useState(0);
  const [hashVisits, setHashVisits] = React.useState(0);
  const originalUrl = React.useRef(window.location.href);
  const targetId = `breadcrumb-projects-${React.useId().replace(/:/g, '')}`;
  const targetHash = `#${targetId}`;

  React.useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === targetHash) {
        setPage('Projects');
        setHashVisits((count) => count + 1);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [targetHash]);

  return (
    <div className={styles.flow}>
      <p data-breadcrumb-pointer-parking="">
        Native Tab visits buttons and navigable links. Current-page anchors lose their href in the
        public hook; current buttons remain focusable but block activation. The pinned hook also
        omits a link role on these href-less anchors unless the consumer supplies one. Breadcrumb
        owns no router.
      </p>
      <button type="button">Start keyboard navigation</button>
      <Breadcrumb aria-label="Project location">
        <BreadcrumbItem>
          <BreadcrumbButton
            as="button"
            current={page === 'Home'}
            onClick={(event) => {
              onButtonClick?.(event);
              setPage('Home');
              setButtonClicks((count) => count + 1);
            }}
          >
            Home
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton
            as="a"
            href={targetHash}
            current={page === 'Projects'}
            icon={<BreadcrumbCalendarIcon />}
            onClick={(event) => {
              onLinkClick?.(event);
              setLinkClicks((count) => count + 1);
            }}
          >
            Projects
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton current={page === 'Atlas'}>Atlas</BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>
      <button type="button">After breadcrumb</button>
      <output aria-label="Navigation result" aria-live="polite">
        Page: {page}. Link callbacks: {linkClicks}. Button callbacks: {buttonClicks}. Hash visits:{' '}
        {hashVisits}.
      </output>
      <span id={targetId}>Projects destination</span>
      <button
        type="button"
        onClick={() => {
          window.history.replaceState(window.history.state, '', originalUrl.current);
          setPage('Atlas');
          setLinkClicks(0);
          setButtonClicks(0);
          setHashVisits(0);
        }}
      >
        Reset navigation demo
      </button>
    </div>
  );
}

export function BreadcrumbCollapsedAncestors(): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className={styles.flow}>
      <p>
        This fixed partition and its disclosure are consumer-owned composition. Breadcrumb does not
        implement automatic overflow or a menu.
      </p>
      <Breadcrumb aria-label="Collapsed project ancestry">
        <BreadcrumbItem>
          <BreadcrumbButton href="#breadcrumb-ancestor-home">Home</BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        {expanded ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbButton href="#breadcrumb-ancestor-team">Team</BreadcrumbButton>
            </BreadcrumbItem>
            <BreadcrumbDivider />
            <BreadcrumbItem>
              <BreadcrumbButton href="#breadcrumb-ancestor-projects">Projects</BreadcrumbButton>
            </BreadcrumbItem>
            <BreadcrumbDivider />
          </>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbButton
                icon={<MoreHorizontalRegular aria-hidden />}
                aria-label="Show two hidden ancestors"
                aria-expanded={false}
                onClick={() => setExpanded(true)}
              />
            </BreadcrumbItem>
            <BreadcrumbDivider />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbButton current>Atlas</BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>
      <button type="button" onClick={() => setExpanded(false)} disabled={!expanded}>
        Collapse ancestors
      </button>
      <output aria-live="polite">
        {expanded ? 'All four breadcrumb entries shown.' : 'Two ancestors collapsed.'}
      </output>
    </div>
  );
}
