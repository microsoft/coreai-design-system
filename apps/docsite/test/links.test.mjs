// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const repoRoot = new URL('../../../', import.meta.url);

async function read(path) {
  return fs.readFile(new URL(path, repoRoot), 'utf8');
}

test('docsite destinations follow the repository README', async () => {
  const [
    readme,
    packageReadme,
    agentSkill,
    links,
    resources,
    faqs,
    packagePage,
    mcpPage,
    skillPage,
    homePage,
  ] = await Promise.all([
    read('README.md'),
    read('packages/react-components/README.md'),
    read('packages/react-components/agent/SKILL.md'),
    read('shared/site-links.ts'),
    read('apps/docsite/src/data/resources.ts'),
    read('apps/docsite/src/data/faqs.ts'),
    read('apps/docsite/src/pages/Package.tsx'),
    read('apps/docsite/src/pages/McpServer.tsx'),
    read('apps/docsite/src/pages/CoreAISkill.tsx'),
    read('apps/docsite/src/pages/Introduction.tsx'),
  ]);
  const skillName = agentSkill.match(/^name: ([^\r\n]+)$/m)?.[1];
  assert.ok(skillName, 'The package skill must declare a frontmatter name.');
  const installedSkillDirectory = 'coreai-ds-fluentui-react';

  assert.match(readme, /https:\/\/github\.com\/microsoft\/coreai-design-system/);
  assert.match(readme, /source code is available\s+under/);
  assert.doesNotMatch(readme, /Entra-authenticated|Entra-authed/);
  assert.match(readme, /https:\/\/coreai-ds-storybook\.azurewebsites\.net\s+\|/);

  assert.match(links, /const repo = 'https:\/\/github\.com\/microsoft\/coreai-design-system'/);
  assert.match(links, /const storybook = 'https:\/\/coreai-ds-storybook\.azurewebsites\.net\/'/);
  assert.doesNotMatch(links, /components-accordion--default/);
  assert.match(
    links,
    /packageReadme: `\$\{repo\}\/blob\/main\/packages\/react-components\/README\.md`/,
  );
  assert.match(
    links,
    /changelog: `\$\{repo\}\/blob\/main\/packages\/react-components\/CHANGELOG\.md`/,
  );

  assert.match(resources, /href: siteLinks\.repo/);
  assert.match(resources, /Install the React components from npm/);
  assert.match(resources, /title: 'Issues and support'/);
  assert.match(faqs, /Install @coreai-ds\/react-components from npm/);
  assert.match(
    faqs,
    /the package, its installed agent skill, and the CoreAI documentation MCP server/,
  );
  assert.doesNotMatch(
    faqs,
    /complete the Microsoft sign-in|requires tenant consent|both documentation servers/,
  );
  assert.match(faqs, /href: siteLinks\.storybookDocs\.mcpSetup/);
  assert.match(faqs, /href: `\$\{siteLinks\.repo\}\/blob\/main\/README\.md`/);
  assert.match(faqs, /href: `\$\{siteLinks\.repo\}\/blob\/main\/CONTRIBUTING\.md`/);
  assert.match(faqs, /label: 'Open a GitHub issue', href: siteLinks\.feedback/);
  assert.doesNotMatch(faqs, /CoreAI DS Community/);

  assert.match(
    packagePage,
    /const installPackages = `npm install @coreai-ds\/react-components\nnpm install @fluentui\/react-components @fluentui\/react-icons # peer dependencies as needed`/,
  );
  assert.doesNotMatch(packagePage, /--registry=https:\/\/registry\.npmjs\.org/);
  assert.doesNotMatch(
    packagePage,
    /const usageExample = `import '@coreai-ds\/react-components\/fonts\/fonts\.css'/,
  );
  assert.match(packagePage, /you can optionally load/);
  assert.match(packagePage, />\s*View package README\s*</);
  assert.match(mcpPage, /"url": "\$\{siteLinks\.mcp\}"/);
  assert.doesNotMatch(mcpPage, /coreai-ds-storybook\.azurewebsites\.net/);
  assert.doesNotMatch(mcpPage, /fluent-agent|chat\.fluentui\.dev|Microsoft Entra|Add both/);
  assert.match(mcpPage, /Authentication: none/);
  assert.match(mcpPage, /ask for confirmation before changing it/);
  assert.match(mcpPage, /href=\{siteLinks\.storybookDocs\.mcpSetup\}/);
  assert.match(mcpPage, /does not read your project or execute returned code/);
  for (const content of [readme, packageReadme, resources, faqs, packagePage, homePage]) {
    assert.doesNotMatch(
      content,
      /Azure Artifacts|obsolete.*registry|separate Fluent MCP connection/,
    );
  }
  assert.match(skillPage, new RegExp(`\\.github/skills/${installedSkillDirectory}/SKILL\\.md`));
  assert.match(packageReadme, new RegExp(`\\.github/skills/${installedSkillDirectory}/SKILL\\.md`));
  assert.match(packageReadme, new RegExp(`\\.claude/skills/${installedSkillDirectory}/SKILL\\.md`));
  assert.match(homePage, /<span>npm<\/span>/);
  assert.match(
    packageReadme,
    /\.\.\/\.\.\/apps\/storybook\/src\/stories\/docs\/StylingWithCssModules\.mdx/,
  );
  assert.doesNotMatch(
    packageReadme,
    /\.\.\/\.\.\/apps\/storybook\/src\/stories\/StylingWithCssModules\.mdx/,
  );
});

test('MCP documentation explains capabilities, safety, data handling, and reporting', async () => {
  const setup = await read('apps/storybook/src/stories/docs/MCPSetup.mdx');
  assert.match(setup, /Authentication: none/);
  for (const name of ['docs-list', 'docs-show', 'docs-show-story']) {
    assert.ok(setup.includes(`\`${name}\``));
  }
  assert.match(setup, /All three tools return design-system documentation/);
  assert.match(
    setup,
    /does not\s+read your project files, access customer resources, execute examples, or change data/,
  );
  assert.match(setup, /not every\s+upstream story or API/);
  assert.match(setup, /Do not include secrets, access tokens/);
  assert.match(
    setup,
    /does not collect product-usage telemetry or intentionally log request bodies/,
  );
  assert.match(setup, /Do not assume processing stays in your region/);
  assert.match(setup, /https:\/\/privacy\.microsoft\.com\/privacystatement/);
  assert.match(setup, /security_best_practices/);
  assert.match(setup, /https:\/\/github\.com\/microsoft\/coreai-design-system#legal/);
  assert.match(setup, /Report security vulnerabilities privately/);
  assert.match(setup, /blob\/main\/SECURITY\.md/);
});

test('repository legal section identifies source and hosted MCP terms separately', async () => {
  const readme = await read('README.md');
  const legal = readme.slice(readme.indexOf('## Legal'));
  assert.match(legal, /### License and hosted-service terms/);
  assert.match(legal, /\[MIT license\]\(LICENSE-CODE\)/);
  assert.match(legal, /Use of the hosted MCP endpoint is subject to the/);
  assert.match(
    legal,
    /https:\/\/learn\.microsoft\.com\/en-us\/legal\/microsoft-apis\/terms-of-use/,
  );
  assert.match(legal, /https:\/\/privacy\.microsoft\.com\/privacystatement/);
  assert.match(legal, /### Third-party materials/);
  assert.match(legal, /### Trademarks/);
});
