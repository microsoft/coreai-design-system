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
    colors: (await rows('ColorRoles'))
      .slice(1)
      .map(([name, token, description]) => ({ name, token, description })),
    dataViz: (await rows('DataVisualization'))
      .slice(1)
      .map(([slot, label, description, value]) => ({ slot, label, description, value })),
    typography: (await rows('Typography'))
      .slice(1)
      .map(([strongPreset, strongLabel, regularPreset, regularLabel, fluent, usage]) => ({
        strongPreset,
        strongLabel,
        ...(regularPreset ? { regularPreset, regularLabel } : {}),
        fluent,
        usage,
      })),
    fonts: (await rows('Fonts'))
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
  const themingSource = await fs.readFile(
    path.join(appRoot, 'content/foundations/Theming.md'),
    'utf8',
  );
  const themingTree = unified().use(remarkParse).use(remarkGfm).parse(themingSource);
  function headingCode(title) {
    let active = false;
    const blocks = [];
    for (const node of themingTree.children) {
      if (node.type === 'heading' && node.depth <= 2) {
        active = toString(node) === title;
      } else if (active && node.type === 'code') {
        blocks.push(node);
      }
    }
    if (!blocks.length) throw new Error(`Missing code under Theming heading: ${title}`);
    return blocks;
  }
  const basicThemeCode = headingCode('Basic usage');
  const coreaiThemeCode = basicThemeCode.find((block) => block.lang === 'tsx');
  const interFontCode = basicThemeCode.find((block) => block.lang === 'css');
  const azureThemeCode = headingCode('Azure theme').find((block) => block.lang === 'tsx');
  const aptosFontImport = coreaiThemeCode?.value
    .split('\n')
    .find((line) => line.includes('@coreai-ds/react-components/fonts/fonts.css'));
  if (!coreaiThemeCode || !azureThemeCode || !interFontCode || !aptosFontImport)
    throw new Error('Theming code samples are incomplete.');
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
  const [history, colorsSource, typographySource] = await Promise.all([
    fs.readFile(path.join(appRoot, 'Changelog.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(appRoot, 'src/pages/Colors.tsx'), 'utf8'),
    fs.readFile(path.join(appRoot, 'src/pages/Typography.tsx'), 'utf8'),
  ]);
  return {
    colors,
    'coreai-theme-code': fence(coreaiThemeCode.value, coreaiThemeCode.lang),
    'azure-theme-code': fence(azureThemeCode.value, azureThemeCode.lang),
    'colors-code': fence(colorsSource),
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
    'aptos-font-code': fence(aptosFontImport, 'tsx'),
    'inter-font-code': fence(interFontCode.value, interFontCode.lang),
    'typography-code': fence(typographySource),
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
