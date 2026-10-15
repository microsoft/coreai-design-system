// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const copyright = 'Copyright (c) Microsoft Corporation.';
const license = 'Licensed under the MIT license.';
const slashCommentExtensions = new Set([
  '.bicep',
  '.bicepparam',
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);
const hashCommentExtensions = new Set(['.sh']);
const blockCommentExtensions = new Set(['.css', '.scss']);
const htmlCommentExtensions = new Set(['.html']);
const excludedPaths = [
  /(?:^|\/)(?:dist|node_modules|storybook-static|build|\.react-router)(?:\/|$)/,
  /^apps\/docsite\/src\/assets\/vendor\//,
  /^apps\/storybook\/fluent-stories\//,
];

function normalizePath(filename) {
  return filename.replaceAll('\\', '/');
}

function getCommentStyle(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (slashCommentExtensions.has(extension)) return 'slash';
  if (hashCommentExtensions.has(extension)) return 'hash';
  if (blockCommentExtensions.has(extension)) return 'block';
  if (htmlCommentExtensions.has(extension)) return 'html';
  return undefined;
}

function getHeader(style, newline = '\n') {
  if (style === 'slash') {
    return `// ${copyright}${newline}// ${license}${newline}${newline}`;
  }
  if (style === 'hash') {
    return `# ${copyright}${newline}# ${license}${newline}${newline}`;
  }
  if (style === 'block') {
    return ['/*', ` * ${copyright}`, ` * ${license}`, ' */', '', ''].join(newline);
  }
  return ['<!--', `  ${copyright}`, `  ${license}`, '-->', '', ''].join(newline);
}

function getInsertionOffset(filename, content) {
  let offset = content.startsWith('\uFEFF') ? 1 : 0;
  const style = getCommentStyle(filename);
  if ((style === 'slash' || style === 'hash') && content.startsWith('#!', offset)) {
    const lineEnd = content.indexOf('\n', offset);
    return lineEnd === -1 ? content.length : lineEnd + 1;
  }
  if (style === 'html') {
    const doctype = content.slice(offset).match(/^<!doctype html>[^\S\r\n]*(?:\r?\n|$)/i);
    if (doctype) offset += doctype[0].length;
  }
  return offset;
}

export function isEligibleSource(filename) {
  const normalized = normalizePath(filename);
  return (
    Boolean(getCommentStyle(normalized)) && !excludedPaths.some((rule) => rule.test(normalized))
  );
}

export function getLicenseHeaderStatus(filename, content) {
  if (!isEligibleSource(filename)) return 'excluded';
  const normalizedContent = content.replaceAll('\r\n', '\n');
  const offset = getInsertionOffset(filename, normalizedContent);
  const style = getCommentStyle(filename);
  if (normalizedContent.startsWith(getHeader(style), offset)) return 'valid';
  const preamble = normalizedContent.slice(offset, offset + 500);
  const startsWithComment =
    (style === 'slash' && preamble.startsWith('//')) ||
    (style === 'hash' && preamble.startsWith('#')) ||
    (style === 'block' && preamble.startsWith('/*')) ||
    (style === 'html' && preamble.startsWith('<!--'));
  if (startsWithComment && (preamble.includes(copyright) || preamble.includes(license))) {
    return 'malformed';
  }
  return 'missing';
}

export function addLicenseHeader(filename, content) {
  const status = getLicenseHeaderStatus(filename, content);
  if (status === 'valid' || status === 'excluded') return content;
  if (status === 'malformed') {
    throw new Error(`${normalizePath(filename)} has a malformed or misplaced license header`);
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const offset = getInsertionOffset(filename, content);
  return `${content.slice(0, offset)}${getHeader(getCommentStyle(filename), newline)}${content.slice(offset)}`;
}

function listSourceFiles() {
  return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((filename) => filename && isEligibleSource(filename));
}

export function processLicenseHeaders({ fix = false } = {}) {
  const missing = [];
  const malformed = [];
  const fixed = [];
  const files = listSourceFiles();

  for (const filename of files) {
    const absolutePath = path.join(root, filename);
    let content;
    try {
      content = readFileSync(absolutePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const status = getLicenseHeaderStatus(filename, content);
    if (status === 'valid') continue;
    if (status === 'malformed') {
      malformed.push(normalizePath(filename));
      continue;
    }
    if (!fix) {
      missing.push(normalizePath(filename));
      continue;
    }
    writeFileSync(absolutePath, addLicenseHeader(filename, content));
    fixed.push(normalizePath(filename));
  }

  return { checked: files.length, fixed, malformed, missing };
}

function printFailures({ malformed, missing }) {
  if (missing.length) {
    console.error(`Missing license header:\n${missing.join('\n')}`);
  }
  if (malformed.length) {
    console.error(`Malformed or misplaced license header:\n${malformed.join('\n')}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...extraArguments] = process.argv.slice(2);
  if (!['--check', '--fix'].includes(mode) || extraArguments.length) {
    console.error('Usage: node scripts/license-headers.mjs <--check|--fix>');
    process.exitCode = 2;
  } else {
    const result = processLicenseHeaders({ fix: mode === '--fix' });
    printFailures(result);
    if (result.missing.length || result.malformed.length) {
      process.exitCode = 1;
    } else if (mode === '--fix') {
      console.log(
        `Added license headers to ${result.fixed.length} of ${result.checked} source files.`,
      );
    } else {
      console.log(`License headers verified in ${result.checked} source files.`);
    }
  }
}
