import type { ESTree } from 'meriyah';
import { JSX_NAME } from '@/utils/ast/constants';

type ImportsMapType = Map<
  string,
  { componentPath: string; componentModuleName: string }
>;

export default function getPrerenderUtil() {
  const allImportsWithPath = new Map() as ImportsMapType;
  let needsPrerenderImport = false;

  /**
   * This function should be used during AST traversal to analyze any node and
   * transform it if necessary.
   */
  function step1_modifyJSXToPrerenderComponents(
    this: any,
    key: string,
    value: any,
    webComponents?: Map<string, string>,
  ) {
    if (value?.type === 'ImportDeclaration') {
      for (const specifier of value.specifiers) {
        const componentPath = value.source.value;
        const componentModuleName =
          specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : specifier.imported.name;
        allImportsWithPath.set(specifier.local.name, {
          componentPath,
          componentModuleName,
        });
      }
    }

    if (isRequire(value)) {
      for (const argument of (value.init.object ?? value.init).arguments) {
        if (!value.id?.properties) {
          allImportsWithPath.set(value.id.name, {
            componentPath: argument.value,
            componentModuleName: value.init?.property?.name ?? 'default',
          });
          continue;
        }
        for (const p of value.id?.properties) {
          allImportsWithPath.set(p.value.name, {
            componentPath: argument.value,
            componentModuleName: p.key?.name ?? 'default',
          });
        }
      }
    }

    const renderOnValue = getRenderOnValue(value);

    if (renderOnValue !== 'build') {
      if (renderOnValue) {
        value.arguments[1].properties = value.arguments[1].properties.filter(
          differentThanRenderOnBuildTime,
        );
      }
      return value;
    }

    const name = value.arguments[0].name;
    const isSSRWebComponent = name === '_Brisa_SSRWebComponent';
    let { componentPath, componentModuleName } =
      allImportsWithPath.get(name) ?? {};

    needsPrerenderImport = true;

    if (isSSRWebComponent) {
      componentModuleName = 'SSRWebComponent';
      componentPath = 'brisa/server';
    }

    return {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: '__prerender__macro',
      },
      arguments: [
        {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'componentPath',
              },
              value: {
                type: 'Literal',
                value: componentPath,
              },
              kind: 'init',
              computed: false,
              method: false,
              shorthand: false,
            },
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'componentModuleName',
              },
              value: {
                type: 'Literal',
                value: componentModuleName,
              },
              kind: 'init',
              computed: false,
              method: false,
              shorthand: false,
            },
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'componentProps',
              },
              value: {
                type: 'ObjectExpression',
                properties: processPrerenderProperties(value, {
                  imports: allImportsWithPath,
                  isSSRWebComponent,
                  webComponents,
                }),
              },
              kind: 'init',
              computed: false,
              method: false,
              shorthand: false,
            },
          ],
        },
      ],
    };
  }

  /**
   * This function should be used after applying the step1_modifyJSXToPrerenderComponents
   * to the AST. It should be used to add any necessary imports to the AST.
   */
  function step2_addPrerenderImport(ast: ESTree.Program) {
    if (needsPrerenderImport) {
      ast.body.unshift({
        type: 'ImportDeclaration',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: {
              type: 'Identifier',
              name: '__prerender__macro',
            },
            local: {
              type: 'Identifier',
              name: '__prerender__macro',
            },
          },
          {
            type: 'ImportSpecifier',
            imported: {
              type: 'Identifier',
              name: '__resolveImportSync',
            },
            local: {
              type: 'Identifier',
              name: '__resolveImportSync',
            },
          },
        ],
        source: {
          type: 'Literal',
          value: 'brisa/server',
        },
        attributes: [
          {
            type: 'ImportAttribute',
            key: {
              type: 'Literal',
              value: 'type',
              // @ts-ignore
              // This astring is looking for "name", but meriyah "value"...
              name: 'type',
            },
            value: {
              type: 'Literal',
              value: 'macro',
            },
          },
        ],
      });
    }
  }

  return {
    step1_modifyJSXToPrerenderComponents,
    step2_addPrerenderImport,
  };
}

function isRequire(value: any) {
  const init = value?.init?.object ?? value?.init;
  return (
    value?.type === 'VariableDeclarator' &&
    init?.type === 'CallExpression' &&
    init.callee?.name === 'require'
  );
}

function differentThanRenderOnBuildTime(p: any) {
  return p?.key?.name !== 'renderOn';
}

function getRenderOnValue(jsxCall: ESTree.CallExpression) {
  if (
    jsxCall?.type === 'CallExpression' &&
    JSX_NAME.has(jsxCall.callee?.name) &&
    jsxCall.arguments[1]?.type === 'ObjectExpression'
  ) {
    for (const prop of jsxCall.arguments[1].properties as any) {
      if (prop?.key?.name === 'renderOn') {
        return prop?.value?.value;
      }
    }
  }
}

function processPrerenderProperties(
  jsxCall: ESTree.CallExpression,
  {
    imports,
    isSSRWebComponent,
    webComponents,
  }: {
    imports: ImportsMapType;
    isSSRWebComponent: boolean;
    webComponents?: Map<string, string>;
  },
) {
  const properties = [];
  const entries = webComponents?.entries() ?? [];
  for (const [key, value] of entries) {
    imports.set(value, { componentPath: key, componentModuleName: value });
  }

  for (const prop of (jsxCall.arguments[1] as any).properties) {
    if (isSSRWebComponent && prop?.key?.name === 'Component') {
      const component = imports.get(prop.value.name);
      if (component) {
        prop.value = {
          type: 'Literal',
          value: component.componentPath,
        };
        properties.push(prop);
        continue;
      }
    }
    if (differentThanRenderOnBuildTime(prop)) {
      properties.push(prop);
    }
  }

  return properties;
}
