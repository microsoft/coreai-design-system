// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';
import type { StoryDocsProvider } from 'storybook/internal/types';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateTemplateDocs } from '../scripts/generate-template-docs.mjs';
import { generateSkillDoc } from '../scripts/generate-skill-doc.mjs';
import { componentStoryDocsProvider } from '../scripts/component-story-docs.mjs';
import { publicMarkdown } from '../scripts/public-markdown.mjs';
import { generatedStoryIndexer } from '../scripts/generate-component-stories.mjs';

// Storybook 10 loads config files as native ESM, where `__dirname` doesn't
// exist. Recreate it from `import.meta.url` for the path math below.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!fs.existsSync(path.resolve(__dirname, '.cache/component-stories/inventory.json'))) {
  throw new Error(
    'Generated component stories are missing. Run `npm --workspace apps/storybook run stories:generate`.',
  );
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/stories/templates/**/*.stories.@(ts|tsx)',
    './.cache/component-stories/*.stories.js',
  ],

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    // Adds a "Design" tab to each story that embeds the linked Figma frame.
    // Per-story wiring lives in `parameters.design` (see src/utils/figma.ts).
    '@storybook/addon-designs',
    // Exposes an MCP server at /mcp so AI agents can read this design system's
    // component docs/manifests, generate stories, and (with the optional
    // Vitest addon) run story tests. Authoring docs: apps/storybook/README.md
    // ("MCP for AI agents"); hosting/auth: docs/CI-CD-SETUP.md.
    '@storybook/addon-mcp',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  experimental_indexers: async (indexers) => {
    if (!indexers) throw new Error('Generated component stories require the built-in indexers');
    return indexers.map(generatedStoryIndexer);
  },

  experimental_storyDocsProvider: (next: StoryDocsProvider | undefined) =>
    componentStoryDocsProvider(next),

  core: {
    disableTelemetry: true,
  },

  features: {
    // Generates the component and docs manifests consumed by Storybook's MCP
    // docs toolset in both development and production.
    componentsManifest: true,
    // Extracts component APIs and static snippets on the server, with
    // per-component manifest snapshots for the public MCP docs tools.
    experimentalDocgenServer: true,
  },

  typescript: {
    // The docgen server supplies metadata without preview-bundle extraction.
    reactDocgen: false,
  },

  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');

    // Reroute every bare `@fluentui/react-components` import to the CoreAI
    // theme barrel, so canonical Fluent story files under fluent-stories/ —
    // which we don't own and which would be wiped on any sparse-checkout
    // pull — automatically pick up our wrapped components (e.g. <Button>
    // with shape="circular" default). Subpath imports like
    // `@fluentui/react-components/foo` are intentionally NOT touched.
    //
    // The barrel itself does `export * from '@fluentui/react-components'`,
    // so we MUST skip the rewrite when the importer lives inside the
    // package's own src/ — otherwise we'd create an infinite self-loop.
    //
    // Storybook develops against package source so a clean checkout does not
    // need a package build and source edits are never hidden by stale dist output.
    const themeBarrel = path.resolve(__dirname, '../../../packages/react-components/src/index.ts');
    const themeDir = path.dirname(themeBarrel);
    // npm workspaces symlinks the package into node_modules; Vite importer
    // paths may surface either the symlinked path or the real path. Match the
    // package's real source dir to be safe.
    const themeSrcDir = path.resolve(__dirname, '../../../packages/react-components/src');
    const barrelRedirectRe = /^@fluentui\/(react-components)$/;
    // Normalize path separators: `path.resolve` yields backslashes on Windows,
    // but Vite/Rollup module ids (and file-watcher paths) always use forward
    // slashes, so an un-normalized `includes`/`startsWith` never matches on
    // Windows.
    const toPosix = (p: string) => p.replace(/\\/g, '/');
    const themeSrcDirPosix = toPosix(themeSrcDir);

    const coreaiBarrelAlias: Plugin = {
      name: 'coreai:fluent-barrel-alias',
      enforce: 'pre',
      async resolveId(source, importer, options) {
        if (!barrelRedirectRe.test(source)) {
          return null;
        }
        // Skip the rewrite for imports originating inside the barrel's own
        // package so its `export * from '@fluentui/react-components'` resolves
        // to the real package instead of looping back onto itself.
        // self-loops (makeStyles/mergeClasses come back undefined at build).
        const from = toPosix(importer ?? '');
        if (from.includes(toPosix(themeDir)) || from.includes(themeSrcDirPosix)) {
          return null;
        }
        // Resolve to the CoreAI barrel by its package specifier (not the raw
        // source path) so Vite serves the *pre-bundled* copy — see the
        // `optimizeDeps.include` entry below. esbuild flattens the barrel's
        // `export *` chains into concrete named exports (makeStyles, tokens,
        // …); serving the raw source module would leave those names invisible
        // to Vite's import analysis and they'd resolve to `undefined`.
        const resolved = await this.resolve('@coreai-ds/react-components', importer, {
          ...options,
          skipSelf: true,
        });
        return resolved ?? themeBarrel;
      },
    };

    // `@coreai-ds/react-components` is force-pre-bundled by esbuild (see
    // `optimizeDeps.include` below) so its `export *` chains resolve to real
    // named bindings. That pre-bundle is a single frozen snapshot cached on
    // disk — Vite's normal per-file watcher/HMR graph doesn't cover the
    // source files baked into it, so editing anything under the package's
    // src/ (e.g. Table.styles.ts) silently has NO EFFECT until something
    // forces a re-optimization. (Previously not an issue on webpack5, which
    // has no equivalent pre-bundle-freeze step.) Watch the package's source
    // directory directly and force a full dev-server restart with a fresh
    // dependency re-bundle (`restart(true)`, equivalent to `--force`) so
    // edits actually show up without a manual cache wipe.
    const coreaiThemeWatcher: Plugin = {
      name: 'coreai:theme-restart-on-change',
      configureServer(server) {
        server.watcher.add(themeSrcDir);
        let restarting = false;
        let debounceTimer: NodeJS.Timeout | undefined;
        const scheduleRestart = (file: string) => {
          clearTimeout(debounceTimer);
          // Debounce: editors/save-atomicity can fire several change events
          // for one logical save (temp-file rename, chmod, ...), and the
          // forced restart itself briefly disconnects the browser's HMR
          // websocket, which can otherwise cascade into a reconnect-retry
          // storm layered on top of a second restart. Coalesce to one.
          debounceTimer = setTimeout(() => {
            if (restarting) {
              return;
            }
            restarting = true;
            server.config.logger.info(
              `\ncoreai theme source changed (${path.basename(file)}) — restarting Vite with a forced dependency re-bundle...\n`,
            );
            server
              .restart(true)
              .catch((err) => server.config.logger.error(String(err)))
              .finally(() => {
                restarting = false;
              });
          }, 300);
        };
        server.watcher.on('change', (file) => {
          if (!toPosix(file).startsWith(themeSrcDirPosix) || restarting) {
            return;
          }
          scheduleRestart(file);
        });
      },
    };

    // Many Fluent stories do `import description from './Foo.md'` to embed
    // markdown documentation in story metadata. Vite has no built-in loader
    // for bare `.md` imports, so expose the file source as the default export.
    // (`?raw` for .ts/.tsx and font assets are handled natively by Vite.)
    const rawMarkdown: Plugin = {
      name: 'coreai:raw-markdown',
      enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0].endsWith('.md')) {
          return { code: `export default ${JSON.stringify(publicMarkdown(code, id))};`, map: null };
        }
        return null;
      },
    };

    // Templates/{Name}.tsx is the single source of truth for its copy-paste
    // component; Templates/{Name}.mdx is a generated doc page that shows the
    // real source (see scripts/generate-template-docs.mjs for why — MCP's
    // docs endpoint returns MDX pages as raw text, so this is how agents see
    // the actual component code instead of reconstructed/fabricated usage).
    // `predev`/`prebuild` already regenerate it once; this watcher keeps it
    // live while `storybook dev` keeps running, so editing a template's .tsx
    // and saving immediately refreshes its .mdx without a server restart.
    const templateDocsWatcher: Plugin = {
      name: 'coreai:template-docs-watcher',
      configureServer(server) {
        const templatesDir = path.resolve(__dirname, '../src/stories/templates');
        const templatesDirNormalized = templatesDir.replace(/\\/g, '/') + '/';
        generateTemplateDocs();
        server.watcher.add(templatesDir);
        const updateTemplateDocs = (file: string) => {
          const normalized = file.replace(/\\/g, '/');
          // `server.watcher` covers the whole project (not just templatesDir,
          // which is only an extra watch root), so this fires for every
          // changed .tsx anywhere — filter to templatesDir itself or the
          // generator would resolve unrelated files (e.g. .storybook/preview.tsx)
          // into a bogus templatesDir/{basename}.mdx.
          if (
            normalized.startsWith(templatesDirNormalized) &&
            normalized.endsWith('.tsx') &&
            !normalized.endsWith('.stories.tsx')
          ) {
            generateTemplateDocs(fs.existsSync(file) ? file : undefined);
          }
        };
        server.watcher.on('add', updateTemplateDocs);
        server.watcher.on('change', updateTemplateDocs);
        server.watcher.on('unlink', updateTemplateDocs);
      },
    };

    // agent/SKILL.md (in the theme package) is the single source of truth for
    // Docs/Agent Skill; mirrors it into a generated .mdx on every save so
    // editing the shipped skill doc doesn't require a dev-server restart to
    // see it reflected in Storybook/MCP (see scripts/generate-skill-doc.mjs).
    const skillDocWatcher: Plugin = {
      name: 'coreai:skill-doc-watcher',
      configureServer(server) {
        const skillPath = path.resolve(
          __dirname,
          '../../../packages/react-components/agent/SKILL.md',
        );
        generateSkillDoc();
        server.watcher.add(skillPath);
        server.watcher.on('change', (file) => {
          if (file.replace(/\\/g, '/') === skillPath.replace(/\\/g, '/')) {
            generateSkillDoc();
          }
        });
      },
    };

    return mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^@coreai-ds\/react-components$/,
            replacement: themeBarrel,
          },
          {
            find: /^@coreai-ds\/react-components\/fonts\/(.*)$/,
            replacement: `${themeSrcDir}/fonts/$1`,
          },
        ],
      },
      plugins: [
        coreaiBarrelAlias,
        coreaiThemeWatcher,
        rawMarkdown,
        templateDocsWatcher,
        skillDocWatcher,
      ],
      // The vendored fluent-stories packages each ship a `stories/tsconfig.json`
      // that `extends` a base tsconfig which isn't part of our sparse checkout.
      // Vite's esbuild transform auto-discovers the nearest tsconfig.json per
      // file and throws on the unresolvable `extends`. Passing `tsconfigRaw` as
      // a *string* makes Vite skip the on-disk tsconfig lookup entirely and use
      // these options for every file (an object value would NOT skip the lookup
      // — Vite still reads the file to merge "meaningful" compiler fields).
      esbuild: {
        tsconfigRaw: '{"compilerOptions":{"jsx":"react-jsx","useDefineForClassFields":false}}',
      },
      // Pre-bundle CommonJS + `export *` re-export chains so their named
      // exports become real ESM bindings that Vite's import analysis can see:
      //  - `@coreai-ds/react-components` (the barrel) does `export * from
      //    '@fluentui/react-components'`; esbuild must flatten it so aliased
      //    imports of makeStyles/tokens/etc. resolve (see the alias plugin).
      //  - `scheduler` / `use-sync-external-store` are CommonJS; several
      //    Fluent / React-Router packages import named exports from them
      //    (`unstable_NormalPriority`, `useSyncExternalStore`).
      optimizeDeps: {
        // The CoreAI barrel is workspace source, so Vite's persistent cache
        // can otherwise reuse a pre-bundle created before a new export was
        // added. Rebuild it whenever Storybook starts; the source watcher
        // above handles subsequent edits during the same dev session.
        force: true,
        include: [
          '@coreai-ds/react-components',
          'scheduler',
          'use-sync-external-store',
          'use-sync-external-store/shim',
          'use-sync-external-store/shim/with-selector',
          'react-is',
        ],
      },
    });
  },
};

export default config;
