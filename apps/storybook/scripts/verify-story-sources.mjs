// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { appRoot } from './generate-component-stories.mjs';
import { createStoryInventory } from './story-inventory.mjs';
import { extractStorySource } from './story-source.mjs';

const inventory = await createStoryInventory();
const cache = new Map();
const sources = new Map();
for (const component of inventory.components) {
  for (const story of component.stories) {
    const result = await extractStorySource(story, { root: appRoot, cache });
    sources.set(
      path.join(appRoot, '.storybook', '.cache', 'snippet-check', `${story.id}.tsx`),
      result.snippet,
    );
  }
}
const configPath = path.join(appRoot, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, appRoot);
if (parsed.errors.length)
  throw new Error(
    parsed.errors
      .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
      .join('\n'),
  );
const host = ts.createCompilerHost(parsed.options);
const original = host.getSourceFile.bind(host);
host.getSourceFile = (file, language, onError, fresh) =>
  sources.has(path.resolve(file))
    ? ts.createSourceFile(file, sources.get(path.resolve(file)), language, true, ts.ScriptKind.TSX)
    : original(file, language, onError, fresh);
const program = ts.createProgram([...sources.keys()], parsed.options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const report = {
  checked: sources.size,
  problems: diagnostics.map((error) => ({
    storyId: error.file ? path.basename(error.file.fileName, '.tsx') : null,
    code: error.code,
    line:
      error.file && error.start !== undefined
        ? error.file.getLineAndCharacterOfPosition(error.start).line + 1
        : null,
    message: ts.flattenDiagnosticMessageText(error.messageText, '\n'),
  })),
};
const output = path.join(appRoot, '.storybook', '.cache', 'story-source-validation.json');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Type-checked ${sources.size} examples: ${diagnostics.length} diagnostics across ${new Set(report.problems.map((item) => item.storyId)).size} files.\n${output}`,
);
for (const error of report.problems)
  console.error(`${error.storyId}:${error.line} TS${error.code}: ${error.message.split('\n')[0]}`);
if (diagnostics.length) process.exitCode = 1;
