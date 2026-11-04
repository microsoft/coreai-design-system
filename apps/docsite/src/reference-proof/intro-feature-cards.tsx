// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  Combobox,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Option,
  SearchBox,
  Text,
  coreaiDarkTheme,
  coreaiLightTheme,
  createTableColumn,
} from '@coreai-ds/react-components';
import {
  Checkmark16Regular,
  ChevronLeft16Regular,
  ChevronRight16Regular,
  Code16Regular,
  Copy16Regular,
  Cursor20Filled,
  Dismiss16Regular,
  DocumentText20Regular,
  WeatherMoon16Regular,
  WeatherSunny16Regular,
} from '@fluentui/react-icons';
import type { PageWidgetProps } from './FoundationViews';
import { useThemeMode } from '../theme/ThemeProvider';
import './intro-feature-cards.css';

function makeInert(element: HTMLDivElement | null) {
  element?.setAttribute('inert', '');
}

function SceneCursor({ kind }: { kind: string }) {
  return (
    <span className={`intro-scene-cursor intro-cursor--${kind}`} aria-hidden="true">
      <Cursor20Filled />
    </span>
  );
}

function FoundationsScene() {
  const { brandVariants } = useThemeMode();
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
          <SceneCursor kind="foundations" />
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
                  background: brandVariants[step as keyof typeof brandVariants],
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
        <div className="intro-foundation-space-demo">
          <span className="intro-foundation-space-block" />
          {[
            ['8', 'var(--spacingHorizontalS)', '24', 'var(--spacingHorizontalXXL)'],
            ['16', 'var(--spacingHorizontalL)', '32', 'var(--spacingHorizontalXXXL)'],
            ['24', 'var(--spacingHorizontalXXL)', '48', 'calc(var(--spacingHorizontalXXL) * 2)'],
          ].map(([label, width, expandedLabel, expandedWidth]) => (
            <React.Fragment key={label}>
              <span
                className="intro-foundation-measure"
                style={
                  {
                    '--space-base': width,
                    '--space-expanded': expandedWidth,
                  } as React.CSSProperties
                }
              >
                <i />
                <span className="intro-foundation-space-label">
                  <span>{label}</span>
                  <span>{expandedLabel}</span>
                  <span>4</span>
                </span>
              </span>
              <span className="intro-foundation-space-block" />
            </React.Fragment>
          ))}
        </div>
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
        <SceneCursor kind="components" />
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
    renderCell: (item) => item.status,
  }),
  createTableColumn<TemplateAgent>({
    columnId: 'version',
    renderHeaderCell: () => 'Version',
    renderCell: (item) => item.version,
  }),
];

type FilterPhase = 'idle' | 'open' | 'selecting' | 'filtered' | 'clearing';

function TemplatesScene({ running }: { running: boolean }) {
  const [phase, setPhase] = React.useState<FilterPhase>('idle');
  const filtered = phase === 'filtered' || phase === 'clearing';
  const items = filtered
    ? templateAgents.filter((item) => item.status === 'published')
    : templateAgents;

  React.useEffect(() => {
    if (!running) {
      setPhase('idle');
      return;
    }

    let timers: number[] = [];
    const cycle = () => {
      setPhase('open');
      timers = [
        window.setTimeout(() => setPhase('selecting'), 700),
        window.setTimeout(() => setPhase('filtered'), 1100),
        window.setTimeout(() => setPhase('clearing'), 4100),
        window.setTimeout(() => setPhase('idle'), 4400),
        window.setTimeout(cycle, 6000),
      ];
    };
    cycle();
    return () => timers.forEach(window.clearTimeout);
  }, [running]);

  return (
    <>
      <div className="intro-grid-reference">
        <Code16Regular /> DataGridWithFilters.tsx
        <Copy16Regular className="intro-grid-copy" />
      </div>
      <div className="intro-grid-product" data-phase={phase}>
        <div className="intro-grid-toolbar">
          <SearchBox placeholder="Search agents" aria-label="Search agents" />
          <Combobox
            className="intro-grid-filter"
            label="Status"
            aria-label="Filter by status"
            dynamicWidth
            clearable
            inlinePopup
            positioning={{ position: 'below', align: 'end' }}
            open={phase === 'open' || phase === 'selecting'}
            value={filtered ? 'Published' : ''}
            selectedOptions={filtered ? ['published'] : []}
          >
            <Option value="draft">Draft</Option>
            <Option value="published" className="intro-grid-published-option">
              Published
            </Option>
            <Option value="deployed">Deployed</Option>
          </Combobox>
        </div>
        <DataGrid
          className="intro-grid-table"
          items={items}
          columns={templateColumns}
          columnFlexOptions={{
            name: { minWidth: 208, flexBasis: 208, flexGrow: 0 },
            status: { minWidth: 112, flexBasis: 112, flexGrow: 0 },
            version: { minWidth: 88, flexBasis: 88, flexGrow: 1 },
          }}
          getRowId={(item) => item.name}
          selectionMode="multiselect"
          sortable
        >
          <DataGridHeader>
            <DataGridRow
              selectionCell={{ checkboxIndicator: { 'aria-label': 'Select all agents' } }}
            >
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<TemplateAgent>>
            {({ item, rowId }) => (
              <DataGridRow<TemplateAgent>
                key={rowId}
                className={
                  item.name === templateAgents[0].name ? undefined : 'intro-grid-row-secondary'
                }
                selectionCell={{ checkboxIndicator: { 'aria-label': 'Select agent' } }}
              >
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
        <div className="intro-grid-footer">
          <span>
            1-{items.length} of {items.length}
          </span>
          <span>
            <Button
              appearance="subtle"
              icon={<ChevronLeft16Regular />}
              aria-label="Previous page"
            />
            <Button appearance="subtle" icon={<ChevronRight16Regular />} aria-label="Next page" />
          </span>
        </div>
        <SceneCursor kind="templates" />
      </div>
    </>
  );
}

function AgentsScene() {
  const code = '<Button appearance="primary">Save</Button>';
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
          <code
            className="intro-agent-code"
            style={{ '--code-length': code.length } as React.CSSProperties}
          >
            <span>{code}</span>
          </code>
        </div>
        <SceneCursor kind="agents" />
      </div>
      <span className="intro-agent-result">
        <Checkmark16Regular /> Guidance + code
      </span>
    </>
  );
}

const scenes: { kind: string; Scene: React.ComponentType<{ running: boolean }> }[] = [
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
          const running = !reducedMotion && pageVisible && index === active;
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
                data-running={running}
              >
                <div className="intro-feature-artwork">
                  <Scene running={running} />
                </div>
              </div>
              <div className="intro-feature-copy">
                <Text as="h3" id={item.id} preset="heading4" foreground={1}>
                  {item.title}
                </Text>
                <Text as="p" size={300} foreground={3}>
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
