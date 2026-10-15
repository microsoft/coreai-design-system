// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const textExtensions =
  /\.(?:[cm]?[jt]sx?|json[c]?|mdx?|ya?ml|css|html|bicep|bicepparam|svg|ini|txt)$/i;
const contentRules = [
  [
    'Azure DevOps URL',
    /(?:dev\.azure\.com|pkgs\.visualstudio\.com|visualstudio\.com\/DefaultCollection)/i,
  ],
  ['legacy repository URL', /github\.com\/coreai-microsoft\/coreai-ds/i],
  [
    'internal collaboration link',
    /(?:teams\.microsoft\.com\/l\/|myaccount\.microsoft\.com\/groups\/|[\w-]+\.sharepoint\.com)/i,
  ],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub credential', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['npm credential', /\bnpm_[A-Za-z0-9]{30,}\b/],
  ['registry credential assignment', /(?:_authToken|_password|_auth)\s*=\s*(?!\$\{)[^\s#;]+/],
];

export function checkFile(filename, content) {
  const name = filename.replaceAll('\\', '/');
  const findings = [];
  if (/\.(?:ttf|otf|woff2?)$/i.test(name)) {
    findings.push('tracked font binary: fonts must be acquired separately');
  }
  if (/^(?:azure-pipelines\/|es-metadata\.yml$|\.github\/compliance\/inventory\.yml$)/.test(name)) {
    findings.push('retired pipeline or internal inventory metadata');
  }
  if (/(?:^|\/)(?:\.env(?:\..+)?|[^/]+\.(?:pem|pfx|p12|key))$/i.test(name)) {
    findings.push('credential-shaped file: review outside the public source snapshot');
  }
  if (textExtensions.test(name) || /(?:^|\/)\.npmrc$/.test(name)) {
    for (const [label, pattern] of contentRules) {
      if (pattern.test(content)) findings.push(label);
    }
  }
  return findings;
}

export function checkTrackedSource() {
  const files = execFileSync('git', ['ls-files', '-z', '--cached'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
  const findings = [];
  for (const filename of files) {
    let content;
    try {
      content = readFileSync(path.join(root, filename));
    } catch (error) {
      // A staged or unstaged deletion is absent from the prospective snapshot.
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const finding of checkFile(filename, content.toString('utf8'))) {
      findings.push(`${filename}: ${finding}`);
    }
  }
  return { count: files.length, findings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, findings } = checkTrackedSource();
  if (findings.length) {
    console.error(`Public-source checks failed:\n${findings.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Public-source checks passed (${count} tracked paths). This is not a full secret or license audit.`,
    );
  }
}
