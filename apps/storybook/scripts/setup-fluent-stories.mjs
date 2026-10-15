// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Provisions `fluent-stories/` — a pinned, shallow, sparse checkout of
// microsoft/fluentui whose canonical Fluent UI v9 stories the Storybook
// playground previews against. This is the single source of truth for the
// upstream ref; bump `config.ref` deliberately and re-run `stories:update`.
//
// Cross-platform (no shell-isms) so it behaves identically locally and in CI.
//
//   node scripts/setup-fluent-stories.mjs              # (re)provision from scratch
//   node scripts/setup-fluent-stories.mjs --if-missing # provision only if absent

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { assertFluentStoryVersion } from './fluent-story-version.mjs';

const config = {
  repo: 'https://github.com/microsoft/fluentui.git',
  // Pinned upstream commit — keeps Storybook builds reproducible. Bump
  // deliberately, then run `npm run stories:update`.
  // Verified release tag: @fluentui/react-components_v9.74.9.
  version: '9.74.9',
  ref: 'ee856ea115d3a1c7b7a81cfd5b42613ff4bf9a06',
  // No coreai equivalent is offered for these compat packages (superseded by
  // the native `DateTimePicker`) — excluded so they're not fetched at all.
  sparsePaths: [
    'packages/react-components/*/stories',
    // We replaced this functionality with our own `DateTimePicker` component
    '!packages/react-components/react-calendar-compat/stories',
    '!packages/react-components/react-datepicker-compat/stories',
    '!packages/react-components/react-timepicker-compat/stories',
    // Not worth the effort to support; excluded so it's not fetched at all.
    '!packages/react-components/react-menu-grid-preview/stories',
  ],
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'fluent-stories');
const temporaryDir = `${dir}.tmp-${process.pid}`;
const backupDir = `${dir}.backup-${process.pid}`;
const require = createRequire(import.meta.url);
const installedVersion = JSON.parse(
  fs.readFileSync(require.resolve('@fluentui/react-components/package.json'), 'utf8'),
).version;
assertFluentStoryVersion(config.version, installedVersion);

function verifySourceVersion(checkoutDir) {
  const source = JSON.parse(
    git(
      ['show', 'HEAD:packages/react-components/react-components/package.json'],
      checkoutDir,
      true,
    ),
  );
  assertFluentStoryVersion(config.version, installedVersion, source.version);
}

function git(args, cwd, capture = false) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.status !== 0) {
    const details = capture ? result.stderr.trim() : '';
    throw new Error(`git ${args.join(' ')} failed${details ? `: ${details}` : ''}`);
  }
  return capture ? result.stdout.trim() : '';
}

function containsCanonicalStory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && containsCanonicalStory(entryPath)) {
      return true;
    }
    if (entry.isFile() && /^index\.stories\.(ts|tsx)$/.test(entry.name)) {
      return true;
    }
  }
  return false;
}

function renameWithRetries(source, destination) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      fs.renameSync(source, destination);
      return;
    } catch (error) {
      const retryable = error.code === 'EBUSY' || error.code === 'EPERM';
      if (!retryable || attempt === 5) {
        throw error;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
    }
  }
}

function activateCheckout() {
  if (process.platform === 'win32') {
    if (fs.existsSync(dir)) {
      fs.cpSync(dir, backupDir, { recursive: true });
    }

    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      fs.cpSync(temporaryDir, dir, { recursive: true });
    } catch (error) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      if (fs.existsSync(backupDir)) {
        fs.cpSync(backupDir, dir, { recursive: true });
      }
      throw error;
    }

    fs.rmSync(temporaryDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    fs.rmSync(backupDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    return;
  }

  if (fs.existsSync(dir)) {
    renameWithRetries(dir, backupDir);
  }

  try {
    renameWithRetries(temporaryDir, dir);
  } catch (error) {
    if (fs.existsSync(backupDir)) {
      renameWithRetries(backupDir, dir);
    }
    throw error;
  }

  fs.rmSync(backupDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

function isExpectedCheckout(checkoutDir) {
  if (!fs.existsSync(path.join(checkoutDir, '.git'))) {
    return false;
  }

  try {
    if (git(['rev-parse', 'HEAD'], checkoutDir, true) !== config.ref) {
      return false;
    }

    const packagesDir = path.join(checkoutDir, 'packages/react-components');
    return fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .some((entry) => {
        const storiesDir = path.join(packagesDir, entry.name, 'stories/src');
        return fs.existsSync(storiesDir) && containsCanonicalStory(storiesDir);
      });
  } catch {
    return false;
  }
}

if (process.argv.includes('--if-missing') && isExpectedCheckout(dir)) {
  verifySourceVersion(dir);
  process.exit(0);
}

fs.rmSync(temporaryDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
fs.rmSync(backupDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

try {
  const temporaryName = path.basename(temporaryDir);
  git(['init', '-q', temporaryName], root);
  git(['remote', 'add', 'origin', config.repo], temporaryDir);
  git(['sparse-checkout', 'init', '--no-cone'], temporaryDir);
  git(['sparse-checkout', 'set', ...config.sparsePaths], temporaryDir);
  git(['fetch', '-q', '--depth=1', '--filter=blob:none', 'origin', config.ref], temporaryDir);
  git(['checkout', '-q', 'FETCH_HEAD'], temporaryDir);

  if (!isExpectedCheckout(temporaryDir)) {
    throw new Error(`Fluent stories checkout did not contain canonical stories at ${config.ref}`);
  }
  verifySourceVersion(temporaryDir);

  activateCheckout();
  console.log(
    `Fluent stories match installed @fluentui/react-components ${installedVersion} at ${config.ref}`,
  );
} catch (error) {
  fs.rmSync(temporaryDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  throw error;
}
