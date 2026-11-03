// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Text,
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  ArrowDown16Regular,
  Checkmark16Regular,
  Code16Regular,
  Copy16Regular,
  Dismiss16Regular,
  DocumentText20Regular,
  WeatherMoon16Regular,
  WeatherSunny16Regular,
} from '@fluentui/react-icons';
import type { PageWidgetProps } from './FoundationViews';
import './intro-feature-cards.css';

function makeInert(element: HTMLDivElement | null) {
  element?.setAttribute('inert', '');
}

function FoundationsScene() {
  return (
    <div className="intro-foundation-board">
      <div
        className="intro-foundation-type"
        style={
          {
            '--type-light': coreaiLightTheme.colorNeutralBackground1,
            '--type-dark': coreaiDarkTheme.colorNeutralBackground1,
            '--ink-light': coreaiLightTheme.colorNeutralForeground1,
            '--ink-dark': coreaiDarkTheme.colorNeutralForeground1,
          } as React.CSSProperties
        }
      >
        <span className="intro-art-label">Typography</span>
        <span className="intro-foundation-aa">Aa</span>
        <span className="intro-foundation-type-footer">
          Heading / Body
          <span className="intro-foundation-theme">
            <WeatherSunny16Regular />
            <WeatherMoon16Regular />
          </span>
        </span>
      </div>
      <div className="intro-foundation-palette">
        <span className="intro-art-label">Color</span>
        <div className="intro-foundation-swatches">
          {[40, 60, 90, 120, 150].map((step, index) => (
            <span
              key={step}
              style={
                {
                  '--swatch-index': index - 2,
                  background: coreaiBrandVariants[step as keyof typeof coreaiBrandVariants],
                } as React.CSSProperties
              }
            >
              <i />
            </span>
          ))}
        </div>
      </div>
      <div className="intro-foundation-spacing">
        <span className="intro-art-label">Spacing</span>
        {[
          ['8', 'var(--spacingHorizontalS)'],
          ['16', 'var(--spacingHorizontalL)'],
          ['24', 'var(--spacingHorizontalXXL)'],
        ].map(([label, width], index) => (
          <span className="intro-foundation-measure" key={label}>
            <i style={{ width, '--measure-index': index } as React.CSSProperties} />
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ComponentsScene() {
  return (
    <>
      <div className="intro-component-reference intro-component-reference--back">
        Behavior &amp; states
      </div>
      <div className="intro-component-reference intro-component-reference--middle">
        Best practices
      </div>
      <div className="intro-component-doc">
        <div className="intro-art-heading">
          <span>Button</span>
          <span className="intro-art-label">Usage guidance</span>
        </div>
        <div className="intro-component-guidance">
          <div className="intro-component-do">
            <span className="intro-guidance-label">
              <Checkmark16Regular /> Do
            </span>
            <Button appearance="primary" size="small">
              Save
            </Button>
            <span>Use a verb</span>
          </div>
          <div className="intro-component-dont">
            <span className="intro-guidance-label">
              <Dismiss16Regular /> Don't
            </span>
            <Button size="small">Save!</Button>
            <span>No punctuation</span>
          </div>
        </div>
        <div className="intro-component-code">
          <Code16Regular />
          <code>
            <span>&lt;Button&gt;</span>Save
            <span className="intro-code-punctuation">!</span>
            <span>&lt;/Button&gt;</span>
          </code>
        </div>
      </div>
    </>
  );
}

function TemplatesScene() {
  return (
    <>
      <div className="intro-template-stage">
        <span>Preview</span>
      </div>
      <div className="intro-template-source">
        <div className="intro-art-heading">
          <span>
            <Code16Regular /> template.tsx
          </span>
          <Copy16Regular />
        </div>
        <div className="intro-template-code">
          {['<Card>', '  <Text>Overview</Text>', '  <Button>Open</Button>', '</Card>'].map(
            (line, index) => (
              <code key={line} style={{ '--line-index': index } as React.CSSProperties}>
                {line}
              </code>
            ),
          )}
        </div>
      </div>
      <ArrowDown16Regular className="intro-template-transfer" />
      <div className="intro-template-preview">
        <span>Overview</span>
        <Button appearance="primary" size="small">
          Open
        </Button>
      </div>
      <span className="intro-template-caption">
        <Copy16Regular /> Copy + adapt
      </span>
    </>
  );
}

function AgentsScene() {
  return (
    <>
      <div className="intro-agent-request">
        <span>GET</span> /components/button.md
        <span className="intro-agent-response">200 OK</span>
      </div>
      <div className="intro-agent-track">
        <span />
      </div>
      <div className="intro-agent-index">llms.txt</div>
      <div className="intro-agent-document">
        <div className="intro-art-heading">
          <span>
            <DocumentText20Regular /> button.md
          </span>
          <span className="intro-art-label">Markdown</span>
        </div>
        <div className="intro-agent-markdown">
          <span># Button</span>
          <span>## Best practices</span>
          <span>- Use buttons for actions.</span>
          <code>&lt;Button&gt;Save&lt;/Button&gt;</code>
        </div>
      </div>
      <span className="intro-agent-result">
        <Checkmark16Regular /> Guidance + code
      </span>
    </>
  );
}

const scenes = [
  { kind: 'foundations', Scene: FoundationsScene },
  { kind: 'components', Scene: ComponentsScene },
  { kind: 'templates', Scene: TemplatesScene },
  { kind: 'agents', Scene: AgentsScene },
];

export function IntroFeatureCards({ sourceHtml }: PageWidgetProps) {
  const items = React.useMemo(() => {
    const document = new DOMParser().parseFromString(sourceHtml, 'text/html');
    return [...document.querySelectorAll('h3')].map((heading) => ({
      id: heading.id,
      title: heading.textContent ?? '',
      description: heading.nextElementSibling?.textContent?.trim() ?? '',
    }));
  }, [sourceHtml]);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [focused, setFocused] = React.useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [pageVisible, setPageVisible] = React.useState(!document.hidden);
  const active = hovered ?? focused;

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(query.matches);
    const onVisibility = () => setPageVisible(!document.hidden);
    query.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      query.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="intro-features">
      <div className="intro-features-grid">
        {items.map((item, index) => {
          const { kind, Scene } = scenes[index];
          return (
            <article
              className={`intro-feature intro-feature--${kind}`}
              key={item.id}
              tabIndex={0}
              aria-labelledby={item.id}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch') setHovered(index);
              }}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused(null)}
              onPointerDown={(event) => {
                if (event.pointerType === 'touch') event.currentTarget.focus();
              }}
            >
              <div
                className="intro-feature-scene"
                aria-hidden="true"
                ref={makeInert}
                data-running={!reducedMotion && pageVisible && index === active}
              >
                <Scene />
              </div>
              <div className="intro-feature-copy">
                <Text as="h3" id={item.id} preset="heading4" foreground={1}>
                  {item.title}
                </Text>
                <Text as="p" size={300} foreground={2}>
                  {item.description}
                </Text>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
