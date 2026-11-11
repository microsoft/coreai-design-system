// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import ts from 'typescript';

export function componentBindings(component) {
  const sources = [...component.sources].reverse();
  const owner = sources.find((source) => source.metadata.component);
  if (!owner) return { imports: [], properties: [], componentNames: [] };
  const fields = ['component', 'subcomponents'].map((key) => {
    const source = sources.find((item) => item.metadata[key]);
    return { key, source, expression: source?.metadata[key] };
  });
  const imports = new Map();
  const exportedNames = new Map();
  for (const { expression, source } of fields) {
    if (!expression) continue;
    const ast = ts.createSourceFile(
      'metadata.ts',
      `const value = ${expression};`,
      ts.ScriptTarget.Latest,
      true,
    );
    const names = new Set();
    function collect(node) {
      if (ts.isIdentifier(node)) names.add(node.text);
      ts.forEachChild(node, collect);
    }
    collect(ast);
    for (const item of source.imports) {
      const parsed = ts.createSourceFile('import.ts', item.source, ts.ScriptTarget.Latest, true);
      const clause = parsed.statements[0].importClause;
      if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
      for (const binding of clause.namedBindings.elements) {
        if (!names.has(binding.name.text)) continue;
        if (
          !['@fluentui/react-components', '@coreai-ds/react-components'].includes(item.specifier)
        ) {
          throw new Error(
            `Unsupported component metadata import in ${source.sourceFile}: ${item.specifier}`,
          );
        }
        const exported = binding.propertyName?.text ?? binding.name.text;
        const imported = binding.propertyName
          ? `${exported} as ${binding.name.text}`
          : binding.name.text;
        if (imports.has(binding.name.text) && imports.get(binding.name.text) !== imported) {
          throw new Error(
            `Conflicting component metadata import ${binding.name.text} in ${component.id}`,
          );
        }
        imports.set(binding.name.text, imported);
        exportedNames.set(binding.name.text, exported);
      }
    }
  }
  if (!imports.has(owner.metadata.component)) {
    throw new Error(
      `Cannot resolve component metadata for ${component.id}: ${owner.metadata.component}`,
    );
  }
  const primary = exportedNames.get(owner.metadata.component);
  return {
    imports: [`import { ${[...imports.values()].join(', ')} } from '@coreai-ds/react-components';`],
    names: [...imports.keys()],
    componentNames: [
      primary,
      ...new Set([...exportedNames.values()].filter((name) => name !== primary).sort()),
    ],
    properties: fields
      .filter(({ expression }) => expression)
      .map(({ key, expression: value }) => {
        const ast = ts.createSourceFile(
          'expression.ts',
          `const expression = ${value};`,
          ts.ScriptTarget.Latest,
          true,
        );
        const expression = ast.statements[0].declarationList.declarations[0].initializer;
        return `${key}: ${ts.createPrinter().printNode(ts.EmitHint.Expression, expression, ast)}`;
      }),
  };
}
