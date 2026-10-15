// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutput = path.join(repoRoot, '.local-fonts', 'aptos');
const faces = [
  ['Aptos.ttf', 'Aptos', '400', 'normal', true],
  ['Aptos-Italic.ttf', 'Aptos', '400', 'italic'],
  ['Aptos-SemiBold.ttf', 'Aptos', '600', 'normal', true],
  ['Aptos-SemiBold-Italic.ttf', 'Aptos', '600', 'italic'],
  ['Aptos-Mono.ttf', 'Aptos Mono', '400', 'normal', true],
  ['Aptos-Mono-Italic.ttf', 'Aptos Mono', '400', 'italic'],
  ['Aptos-Mono-Bold.ttf', 'Aptos Mono', '600 700', 'normal'],
  ['Aptos-Mono-Bold-Italic.ttf', 'Aptos Mono', '600 700', 'italic'],
];

function within(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

async function resolvedDestination(destination) {
  try {
    return await realpath(destination);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return path.join(
      await resolvedDestination(path.dirname(destination)),
      path.basename(destination),
    );
  }
}

async function findFonts(directory, found = new Map()) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Symbolic links are not accepted in the source: ${filename}`);
    if (entry.isDirectory()) await findFonts(filename, found);
    if (!entry.isFile() || !faces.some(([name]) => name.toLowerCase() === entry.name.toLowerCase()))
      continue;
    const key = entry.name.toLowerCase();
    if (found.has(key))
      throw new Error(
        `Ambiguous duplicate font: ${entry.name}. Select a more specific source directory.`,
      );
    found.set(key, filename);
  }
  return found;
}

export async function setupFonts({
  source,
  output,
  acceptLicense = false,
  allowWebHosting = false,
} = {}) {
  if (!acceptLicense)
    throw new Error(
      'Review your source license, then explicitly pass --accept-license. This does not grant redistribution rights.',
    );
  if (!source)
    throw new Error('--source must point to an extracted official/licensed font directory.');
  if (output && !allowWebHosting)
    throw new Error(
      'An explicit --output requires --allow-web-hosting and independently obtained web-hosting rights.',
    );
  if (allowWebHosting && !output)
    throw new Error(
      '--allow-web-hosting requires a consumer-owned --output outside this repository.',
    );

  const sourcePath = await realpath(path.resolve(source));
  if (!(await stat(sourcePath)).isDirectory())
    throw new Error(
      '--source must be an extracted directory, not an archive. Extract it with your OS first.',
    );
  const destination = await resolvedDestination(path.resolve(output ?? defaultOutput));
  const canonicalRepo = await realpath(repoRoot);
  if (output && within(canonicalRepo, destination))
    throw new Error(
      '--output must be outside this repository to keep fonts out of source, builds, and npm artifacts.',
    );
  if (!output && destination !== path.join(canonicalRepo, '.local-fonts', 'aptos'))
    throw new Error('The local staging directory must not redirect through a symbolic link.');
  if (within(sourcePath, destination) || within(destination, sourcePath))
    throw new Error('Source and output directories must not overlap.');
  try {
    if ((await readdir(destination)).length)
      throw new Error(
        'Output directory must be empty. Remove your previous staging directory before re-running.',
      );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const found = await findFonts(sourcePath);
  const selected = [];
  const missing = [];
  for (const [filename, family, weight, style, required] of faces) {
    const input = found.get(filename.toLowerCase());
    if (!input) {
      if (required) throw new Error(`Required font missing: ${filename}`);
      missing.push(filename);
      continue;
    }
    const bytes = await readFile(input);
    if (
      bytes.length < 12 ||
      !['00010000', '74727565'].includes(bytes.subarray(0, 4).toString('hex'))
    ) {
      throw new Error(`Not a TrueType font: ${filename}`);
    }
    selected.push({
      filename,
      family,
      weight,
      style,
      input,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }

  await mkdir(destination, { recursive: true });
  for (const font of selected) {
    await copyFile(font.input, path.join(destination, font.filename), constants.COPYFILE_EXCL);
  }
  if (allowWebHosting) {
    const css = selected
      .map(
        ({ filename, family, weight, style }) =>
          `@font-face {\n  font-family: '${family}';\n  font-weight: ${weight};\n  font-style: ${style};\n  font-display: swap;\n  src: url('./${filename}') format('truetype');\n}\n`,
      )
      .join('\n');
    await writeFile(path.join(destination, 'fonts.css'), css, { flag: 'wx' });
  }
  await writeFile(
    path.join(destination, 'setup.json'),
    `${JSON.stringify(
      {
        officialSource: 'https://www.microsoft.com/en-us/download/details.aspx?id=106087',
        mode: allowWebHosting ? 'consumer-owned-web-fonts' : 'local-installation-only',
        files: selected.map(({ filename, sha256 }) => ({ filename, sha256 })),
        missingOptionalFaces: missing,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx' },
  );
  return { destination, files: selected.map(({ filename }) => filename), missing };
}

async function main() {
  const { values } = parseArgs({
    options: {
      source: { type: 'string' },
      output: { type: 'string' },
      'accept-license': { type: 'boolean' },
      'allow-web-hosting': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    process.stdout
      .write(`Acquire Aptos from https://www.microsoft.com/en-us/download/details.aspx?id=106087
Review the accompanying license and extract it yourself. No network requests are made.
Local setup: node scripts/setup-fonts.mjs --source "<directory>" --accept-license
Then install .local-fonts/aptos/*.ttf with your OS font installer and restart your browser.
Separately licensed consumer web assets: add --output "<consumer-directory>" --allow-web-hosting
The output must be outside this repository and empty. Never commit or npm-publish font binaries.
`);
    return;
  }
  const result = await setupFonts({
    source: values.source,
    output: values.output,
    acceptLicense: values['accept-license'],
    allowWebHosting: values['allow-web-hosting'],
  });
  process.stdout.write(`Staged ${result.files.length} fonts in ${result.destination}.\n`);
  if (result.missing.length)
    process.stdout.write(`Optional faces not supplied: ${result.missing.join(', ')}\n`);
  process.stdout.write(
    values['allow-web-hosting']
      ? 'Load your consumer-owned fonts.css only under appropriate web-hosting rights; exclude these assets from GitHub and npm.\n'
      : 'Install these files with your OS font installer, then restart your browser. They are not served or bundled by this repository.\n',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
