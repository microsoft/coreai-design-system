// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Badge,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  SearchBox,
  Text,
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
  createTableColumn,
} from '@coreai-ds/react-components';
import {
  Add16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
  ChevronLeft16Regular,
  ChevronRight16Regular,
  Code16Regular,
  Copy16Regular,
  Dismiss16Regular,
  DocumentText20Regular,
  Filter16Regular,
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

interface TemplateAgent {
  name: string;
  status: 'published' | 'draft';
  version: string;
}

const templateAgents: TemplateAgent[] = [
  { name: 'Data Analysis Assistant', status: 'published', version: '1.5.2' },
  { name: 'Code Review Bot', status: 'draft', version: '0.8.0' },
  { name: 'Document Summarizer', status: 'published', version: '1.3.0' },
];

const templateColumns = [
  createTableColumn<TemplateAgent>({
    columnId: 'name',
    renderHeaderCell: () => 'Name',
    renderCell: (item) => item.name,
    compare: (first, second) => first.name.localeCompare(second.name),
  }),
  createTableColumn<TemplateAgent>({
    columnId: 'status',
    renderHeaderCell: () => 'Status',
    renderCell: (item) => (
      <Badge
        size="small"
        appearance="tint"
        color={item.status === 'published' ? 'brand' : 'subtle'}
      >
        {item.status === 'published' ? 'Published' : 'Draft'}
      </Badge>
    ),
  }),
  createTableColumn<TemplateAgent>({
    columnId: 'version',
    renderHeaderCell: () => 'Version',
    renderCell: (item) => item.version,
  }),
];

function TemplatesScene() {
  return (
    <>
      <div className="intro-grid-reference">
        <Code16Regular /> DataGridWithFilters.tsx
        <Copy16Regular className="intro-grid-copy" />
      </div>
      <div className="intro-grid-product">
        <div className="intro-grid-heading">
          <span>Agents</span>
          <Button size="small" appearance="subtle" icon={<Add16Regular />} aria-label="New agent" />
        </div>
        <div className="intro-grid-toolbar">
          <SearchBox size="small" placeholder="Search agents" aria-label="Search agents" />
          <Button size="small" className="intro-grid-filter" icon={<Filter16Regular />}>
            <span className="intro-grid-state">
              <span className="intro-grid-all">Status</span>
              <span className="intro-grid-applied">Published</span>
            </span>
            <span className="intro-grid-state intro-grid-filter-icon">
              <ChevronDown16Regular className="intro-grid-all" />
              <Dismiss16Regular className="intro-grid-applied" />
            </span>
          </Button>
        </div>
        <div className="intro-grid-filter-menu">
          <span>All statuses</span>
          <span>
            <Checkmark16Regular /> Published
          </span>
        </div>
        <DataGrid
          className="intro-grid-table"
          items={templateAgents}
          columns={templateColumns}
          getRowId={(item) => item.name}
          selectionMode="multiselect"
          sortable
        >
          <DataGridHeader>
            <DataGridRow
              selectionCell={{ checkboxIndicator: { 'aria-label': 'Select all agents' } }}
            >
              {({ renderHeaderCell, columnId }) => (
                <DataGridHeaderCell className={`intro-grid-column-${columnId}`}>
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<TemplateAgent>>
            {({ item, rowId }) => (
              <DataGridRow<TemplateAgent>
                key={rowId}
                className={item.status === 'draft' ? 'intro-grid-row-draft' : undefined}
                selectionCell={{ checkboxIndicator: { 'aria-label': 'Select agent' } }}
              >
                {({ renderCell, columnId }) => (
                  <DataGridCell className={`intro-grid-column-${columnId}`}>
                    {renderCell(item)}
                  </DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
        <div className="intro-grid-footer">
          <span className="intro-grid-state">
            <span className="intro-grid-all">3 agents</span>
            <span className="intro-grid-applied">2 agents</span>
          </span>
          <span>
            <ChevronLeft16Regular /> <ChevronRight16Regular />
          </span>
        </div>
      </div>
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
