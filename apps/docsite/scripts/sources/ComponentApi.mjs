// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { Parser } from 'react-docgen-typescript';
import { componentBindings } from './ComponentBindings.mjs';
import { codeFence } from '../PageTemplate.mjs';

const appRoot = fileURLToPath(new URL('../../', import.meta.url));
const repositoryRoot = path.resolve(appRoot, '../..');
const typeFlags =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const commonProps = new Set(['as', 'children', 'className', 'style', 'ref']);

function includeProp(prop) {
  return (
    commonProps.has(prop.name) ||
    !prop.declarations?.length ||
    !prop.declarations.every(
      (declaration) =>
        /[/\\]@types[/\\]react[/\\]/.test(declaration.fileName) &&
        /^(?:AriaAttributes|DOMAttributes|.*HTMLAttributes|SVGAttributes|Attributes|RefAttributes|ClassAttributes)$/.test(
          declaration.name,
        ),
    )
  );
}

function deprecated(tags) {
  return tags && Object.hasOwn(tags, 'deprecated') ? tags.deprecated || 'Deprecated.' : undefined;
}

export function createComponentApiReader({
  entry = path.join(repositoryRoot, 'packages/react-components/src/index.ts'),
  tsconfig = path.join(appRoot, 'tsconfig.json'),
} = {}) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      },
    },
  );
  if (!parsed || parsed.errors.length)
    throw new Error(`Cannot read API TypeScript configuration: ${tsconfig}`);
  const require = createRequire(path.join(appRoot, 'package.json'));
  const fluentManifest = require.resolve('@fluentui/react-components/package.json');
  const fluentPackage = JSON.parse(ts.sys.readFile(fluentManifest));
  const fluentTypes = fluentPackage.types ?? fluentPackage.typings;
  if (!fluentTypes) throw new Error('Fluent package has no TypeScript declarations.');
  const fluentEntry = path.join(path.dirname(fluentManifest), fluentTypes);
  const program = ts.createProgram([entry], {
    ...parsed.options,
    paths: { ...parsed.options.paths, '@fluentui/react-components': [fluentEntry] },
    noEmit: true,
    noErrorTruncation: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const module = source && checker.getSymbolAtLocation(source);
  if (!module) throw new Error(`Missing public API module: ${entry}`);
  const exports = new Map(
    checker.getExportsOfModule(module).map((symbol) => [symbol.name, symbol]),
  );
  const cache = new Map();
  const resolve = (symbol) =>
    symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const portable = (text) => {
    if (/import\(["'](?:[A-Za-z]:|\/)/.test(text)) throw new Error(`Nonportable API type: ${text}`);
    return text;
  };

  function read(name) {
    if (cache.has(name)) return cache.get(name);
    const exported = exports.get(name);
    if (!exported) throw new Error(`Unknown CoreAI API export: ${name}`);
    const symbol = resolve(exported);
    const valueType = checker.getTypeOfSymbolAtLocation(symbol, source);
    const signatures = checker.getSignaturesOfType(valueType, ts.SignatureKind.Call);
    if (!signatures.length) throw new Error(`API export is not callable: ${name}`);
    if (/^[a-z]/.test(name)) {
      const api = {
        name,
        kind: 'function',
        description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
        signatures: signatures.map((signature) =>
          portable(checker.signatureToString(signature, source, typeFlags)),
        ),
      };
      cache.set(name, api);
      return api;
    }
    // Resolve the public barrel alias before docgen so wrappers retain their CoreAI prop docs.
    // Keep docgen's generic-prop cache component-local while sharing the TypeScript program.
    const parser = new Parser(program, {
      shouldIncludePropTagMap: true,
      skipChildrenPropWithoutDoc: false,
      shouldRemoveUndefinedFromOptional: true,
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: includeProp,
    });
    const doc = parser.getComponentInfo(symbol, source, () => name);
    if (!doc) throw new Error(`react-docgen-typescript could not extract ${name}`);
    const parameter = signatures[0].parameters[0];
    const propsType =
      parameter &&
      checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? source);
    const props = Object.values(doc.props)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((prop) => {
        const defaultValue =
          prop.defaultValue?.value === undefined ? undefined : String(prop.defaultValue.value);
        const defaultNote = defaultValue?.match(/^([^\r\n]+)\r?\n\s*\r?\n(Note:[\s\S]+)$/);
        const conditional =
          prop.required && propsType && !checker.getPropertyOfType(propsType, prop.name);
        return {
          name: prop.name,
          type: portable(
            prop.type.name === 'enum'
              ? prop.type.value.map((option) => option.value).join(' | ')
              : prop.type.name,
          ),
          required: prop.required && !conditional,
          conditional: conditional ? true : undefined,
          description: [prop.description, defaultNote?.[2]].filter(Boolean).join('\n\n'),
          defaultValue: defaultNote?.[1] ?? defaultValue,
          deprecated: deprecated(prop.tags),
        };
      });
    if (!props.length) throw new Error(`Empty props API for ${name}`);
    const api = {
      name,
      kind: 'component',
      propsType: exports.has(`${name}Props`) ? `${name}Props` : undefined,
      description: doc.description,
      deprecated: deprecated(doc.tags),
      props,
    };
    cache.set(name, api);
    return api;
  }

  return {
    read,
    readComponent(component, names) {
      const selected = names ?? componentBindings(component).componentNames;
      if (!selected.length)
        throw new Error(
          `${component.id}: missing component API metadata; declare reference.api exports.`,
        );
      return selected.map(read);
    },
  };
}

export function componentApiSource(api) {
  if (api.kind === 'function') {
    return api.signatures
      .map((signature) => `declare function ${api.name}${signature};`)
      .join('\n');
  }
  const props = api.props.map((prop) => {
    const comment = [
      prop.description,
      prop.conditional ? '@remarks Required in some prop variants.' : '',
      prop.defaultValue === undefined ? '' : `@default ${prop.defaultValue}`,
      prop.deprecated ? `@deprecated ${prop.deprecated}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const jsdoc = comment
      ? `  /**\n${comment
          .replaceAll('*/', '* /')
          .split(/\r?\n/)
          .map((line) => `   *${line ? ` ${line}` : ''}`)
          .join('\n')}\n   */\n`
      : '';
    const name = /^[$A-Z_a-z][$\w]*$/.test(prop.name) ? prop.name : JSON.stringify(prop.name);
    return `${jsdoc}  ${name}${prop.required ? '' : '?'}: ${prop.type};`;
  });
  return `interface ${api.propsType ?? `${api.name}Props`} {\n${props.join('\n\n')}\n}`;
}

export function componentApiMarkdown(apis = []) {
  if (!apis.length) return '';
  return [
    '## API',
    'Generated CoreAI prop summaries, not replacement type declarations. Most native DOM/event and ARIA props are omitted. `?` means optional; JSDoc shows defaults, deprecations, and conditional requirements. Defaults assume the standard CoreAI provider.',
    ...apis.flatMap((api) => [
      `### ${api.name} API`,
      api.description,
      api.deprecated ? `**Deprecated:** ${api.deprecated}` : '',
      codeFence(componentApiSource(api), 'ts'),
    ]),
  ]
    .filter(Boolean)
    .join('\n\n');
}
