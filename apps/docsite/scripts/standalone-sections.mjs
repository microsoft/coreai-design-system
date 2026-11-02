// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';

export function markdownTable(headers, rows) {
  const cell = (value) =>
    String(value ?? '')
      .replaceAll('|', '\\|')
      .replaceAll('\n', ' ');
  return [
    `| ${headers.map(cell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

export async function readFoundationData(appRoot) {
  async function rows(name) {
    const source = await fs.readFile(path.join(appRoot, 'content/data', `${name}.md`), 'utf8');
    const table = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(source)
      .children.find((node) => node.type === 'table');
    if (!table) throw new Error(`Missing authored data table: ${name}`);
    return table.children.map((row) => row.children.map((cell) => toString(cell)));
  }
  return {
    colors: (await rows('color-roles'))
      .slice(1)
      .map(([name, token, description]) => ({ name, token, description })),
    dataViz: (await rows('data-visualization'))
      .slice(1)
      .map(([slot, label, description, value]) => ({ slot, label, description, value })),
    typography: (await rows('typography'))
      .slice(1)
      .map(([strongPreset, strongLabel, regularPreset, regularLabel, fluent, usage]) => ({
        strongPreset,
        strongLabel,
        ...(regularPreset ? { regularPreset, regularLabel } : {}),
        fluent,
        usage,
      })),
    fonts: (await rows('fonts'))
      .slice(1)
      .map(([name, variant, sample, suffix, token, description, download]) => ({
        name,
        variant,
        sample,
        suffix,
        token,
        description,
        download,
      })),
  };
}

export async function standaloneSections({
  appRoot,
  pages,
  versions,
  providerSource,
  fence,
  foundationData,
}) {
  const data = foundationData ?? (await readFoundationData(appRoot));
  const themes = await import('@coreai-ds/react-components');
  const roles = data.colors;
  const themeNames = ['coreaiLightTheme', 'coreaiDarkTheme', 'azureLightTheme', 'azureDarkTheme'];
  const colors = [
    '### Brand ramps',
    markdownTable(
      ['Step', 'CoreAI', 'Azure'],
      Array.from({ length: 16 }, (_, i) => {
        const step = (i + 1) * 10;
        return [step, themes.coreaiBrandVariants[step], themes.azureBrandVariants[step]];
      }),
    ),
    '### Semantic surface and text colors',
    markdownTable(
      ['Role', 'Token', 'Usage', 'CoreAI light', 'CoreAI dark', 'Azure light', 'Azure dark'],
      roles.map(({ name, token, description }) => [
        name,
        `\`${token}\``,
        description,
        ...themeNames.map((theme) => {
          const value = themes[theme][token];
          if (typeof value !== 'string')
            throw new Error(`Unknown ${theme} token in color-roles.md: ${token}`);
          return value;
        }),
      ]),
    ),
  ].join('\n\n');
  const history = JSON.parse(await fs.readFile(path.join(appRoot, 'changelog.json'), 'utf8'));
  return {
    colors,
    typography: markdownTable(
      [
        'Strong preset',
        'Strong label',
        'Regular preset',
        'Regular label',
        'Fluent equivalent',
        'Usage',
      ],
      data.typography.map((row) => [
        row.strongPreset,
        row.strongLabel,
        row.regularPreset,
        row.regularLabel,
        row.fluent,
        row.usage,
      ]),
    ),
    'font-families': markdownTable(
      ['Font', 'Token', 'Usage', 'Download'],
      data.fonts.map((font) => [
        font.name,
        font.token,
        font.description,
        `[Microsoft font download](${font.download})`,
      ]),
    ),
    'data-visualization': markdownTable(
      ['Slot', 'Color', 'Usage', 'Value'],
      data.dataViz.map((row) => [row.slot, row.label, row.description, row.value]),
    ),
    install: `${fence(
      `npm install ${Object.entries(versions)
        .map(([name, version]) => `${name}@${version}`)
        .join(' ')}`,
      'sh',
    )}\n\nFluent source and package versions are also listed in the discovery index.`,
    provider: fence(providerSource),
    catalog: ['components', 'templates']
      .map(
        (kind) =>
          `### ${kind === 'components' ? 'Components' : 'Templates'}\n\n${pages
            .filter((page) => page.kind === kind)
            .sort((first, second) => first.route.localeCompare(second.route))
            .map((page) => `- [${page.title}](/${page.route}.md): ${page.summary}`)
            .join('\n')}`,
      )
      .join('\n\n'),
    'release-summaries': history.entries
      .map(
        (entry) =>
          `### ${entry.version} — ${entry.title} (${entry.date})\n\n${entry.summary}\n\n${entry.sections.map((section) => `#### ${section.title}\n\n${section.items.map((item) => `- ${item}`).join('\n')}`).join('\n\n')}`,
      )
      .join('\n\n'),
  };
}
