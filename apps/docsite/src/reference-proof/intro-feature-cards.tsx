// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Badge, Button, Checkbox, Input, Switch, Text } from '@coreai-ds/react-components';
import {
  ArrowRight16Regular,
  ArrowUndo16Regular,
  Checkmark16Regular,
  Copy16Regular,
  Cursor20Filled,
  DocumentText20Regular,
  Pause16Regular,
  Play16Regular,
} from '@fluentui/react-icons';
import type { PageWidgetProps } from './FoundationViews';
import './intro-feature-cards.css';

const kinds = ['components', 'templates', 'samples', 'agents'] as const;
const beats = [0, 800, 1800, 3400, 4400, 7000, 8000];
const duration = 9200;

interface SceneProps {
  beat: number;
  running: boolean;
}

function makeInert(element: HTMLDivElement | null) {
  element?.setAttribute('inert', '');
}

function DemoCursor({ target, pressed }: { target: string; pressed: boolean }) {
  const cursor = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const element = cursor.current;
    const scene = element?.parentElement;
    const targetElement = scene?.querySelector<HTMLElement>(`[data-demo-target="${target}"]`);
    const control = targetElement?.querySelector('input') ?? targetElement;
    if (!element || !scene || !control) return;
    function measure() {
      if (!element || !scene || !control) return;
      const bounds = scene.getBoundingClientRect();
      const destination = control.getBoundingClientRect();
      element.style.left = `${destination.right - bounds.left - 10}px`;
      element.style.top = `${destination.top - bounds.top + destination.height * 0.65}px`;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    observer.observe(control);
    return () => observer.disconnect();
  }, [target]);
  return (
    <span ref={cursor} className="intro-demo-cursor" data-pressed={pressed}>
      <Cursor20Filled />
    </span>
  );
}

function ComponentsScene({ beat }: SceneProps) {
  return (
    <>
      <div className="intro-component-button">
        <Button appearance="primary">Continue</Button>
      </div>
      <div className="intro-component-checkbox">
        <Checkbox checked label="Selected" />
      </div>
      <div className="intro-component-badge">
        <Badge appearance="tint" color="brand" size="large">
          CoreAI
        </Badge>
      </div>
      <div className="intro-component-switch" data-demo-target="switch">
        <Switch checked={beat >= 2 && beat < 6} label="Enable preview" />
      </div>
      <DemoCursor target="switch" pressed={beat === 2 || beat === 6} />
    </>
  );
}

function TemplatesScene({ beat }: SceneProps) {
  return (
    <>
      <div className="intro-template" data-assembled={beat >= 2 && beat < 5}>
        <div className="intro-template-header">
          <span>Workspace</span>
          <Button
            size="small"
            appearance="subtle"
            icon={<Copy16Regular />}
            aria-label="Copy template"
            data-demo-target="copy"
          />
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowUndo16Regular />}
            aria-label="Reset template"
            data-demo-target="reset"
          />
        </div>
        <div className="intro-template-sidebar">
          <i />
          <i />
          <i />
        </div>
        <div className="intro-template-main">
          <span>Overview</span>
          <div className="intro-template-blocks">
            <i />
            <i />
          </div>
          <div className="intro-template-lines">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <span className="intro-template-caption">Shell + navigation</span>
      <DemoCursor target={beat >= 4 ? 'reset' : 'copy'} pressed={beat === 2 || beat === 5} />
    </>
  );
}

function SamplesScene({ beat, running }: SceneProps) {
  const [name, setName] = React.useState('');
  React.useEffect(() => {
    if (beat !== 2) {
      setName(beat >= 3 && beat < 6 ? 'Prototype' : '');
      return;
    }
    if (!running || name === 'Prototype') return;
    const timer = window.setTimeout(() => setName('Prototype'.slice(0, name.length + 1)), 100);
    return () => window.clearTimeout(timer);
  }, [beat, name, running]);
  return (
    <>
      <div className="intro-sample-form">
        <div className="intro-sample-heading">
          <span>New project</span>
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowUndo16Regular />}
            aria-label="Reset form"
            data-demo-target="reset"
          />
        </div>
        <span className="intro-sample-label">Project name</span>
        <Input size="small" value={name} placeholder="Enter a name" data-demo-target="name" />
        <div className="intro-sample-footer">
          <span className="intro-sample-success" data-visible={beat >= 4 && beat < 6}>
            <Checkmark16Regular /> Project created
          </span>
          <Button size="small" appearance="primary" disabled={!name} data-demo-target="create">
            Create
          </Button>
        </div>
      </div>
      <DemoCursor
        target={beat >= 5 ? 'reset' : beat >= 3 ? 'create' : 'name'}
        pressed={beat === 1 || beat === 4 || beat === 6}
      />
    </>
  );
}

function AgentsScene({ beat }: SceneProps) {
  return (
    <>
      <div className="intro-agent-request">
        <span>GET</span> /components/button.md <ArrowRight16Regular />
      </div>
      <div className="intro-agent-track">
        <span data-travelling={beat >= 1 && beat < 5} />
      </div>
      <div className="intro-agent-document" data-loaded={beat >= 2 && beat < 5}>
        <div className="intro-agent-file">
          <DocumentText20Regular /> button.md
          <Checkmark16Regular className="intro-agent-check" />
        </div>
        <div className="intro-agent-markdown">
          <span># Button</span>
          <span>## Best practices</span>
          <span>- Use buttons for actions.</span>
          <span>## Behavior and states</span>
        </div>
      </div>
    </>
  );
}

const scenes = [ComponentsScene, TemplatesScene, SamplesScene, AgentsScene];

export function IntroFeatureCards({ sourceHtml }: PageWidgetProps) {
  const items = React.useMemo(() => {
    const document = new DOMParser().parseFromString(sourceHtml, 'text/html');
    return [...document.querySelectorAll('h3')].map((heading) => ({
      id: heading.id,
      title: heading.textContent ?? '',
      description: heading.nextElementSibling?.textContent?.trim() ?? '',
    }));
  }, [sourceHtml]);
  const grid = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState<number[]>([]);
  const [reducedMotion, setReducedMotion] = React.useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [playing, setPlaying] = React.useState(true);
  const [pageVisible, setPageVisible] = React.useState(!document.hidden);
  const [active, setActive] = React.useState(0);
  const [beat, setBeat] = React.useState(0);
  const [replay, setReplay] = React.useState(0);
  const running = playing && !reducedMotion && pageVisible && visible.includes(active);

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

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        setVisible((previous) => {
          const next = new Set(previous);
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (entry.isIntersecting) next.add(index);
            else next.delete(index);
          }
          return [...next].sort();
        }),
      { threshold: 0.5 },
    );
    grid.current?.querySelectorAll('[data-index]').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (visible.length && !visible.includes(active)) setActive(visible[0]);
  }, [active, visible]);

  React.useEffect(() => {
    if (!running) return;
    setBeat(0);
    const timers = beats.map((delay, index) => window.setTimeout(() => setBeat(index), delay));
    timers.push(
      window.setTimeout(() => {
        const index = visible.indexOf(active);
        setActive(visible[(index + 1) % visible.length]);
        setReplay((value) => value + 1);
      }, duration),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [active, replay, running, visible]);

  return (
    <div className="intro-features" data-playing={playing}>
      <div className="intro-features-toolbar">
        <Button
          size="small"
          appearance="subtle"
          disabled={reducedMotion}
          icon={playing && !reducedMotion ? <Pause16Regular /> : <Play16Regular />}
          onClick={() => setPlaying((value) => !value)}
        >
          {reducedMotion ? 'Reduced motion' : playing ? 'Pause animations' : 'Play animations'}
        </Button>
      </div>
      <div className="intro-features-grid" ref={grid}>
        {items.map((item, index) => {
          const Scene = scenes[index];
          return (
            <article
              className={`intro-feature intro-feature--${kinds[index]}`}
              key={item.id}
              data-index={index}
              onMouseEnter={() => {
                if (!playing || reducedMotion) return;
                setActive(index);
                setReplay((value) => value + 1);
              }}
            >
              <div
                className="intro-feature-scene"
                aria-hidden="true"
                ref={makeInert}
                data-running={running && index === active}
              >
                <Scene
                  beat={reducedMotion ? 4 : index === active ? beat : 0}
                  running={running && index === active}
                />
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
