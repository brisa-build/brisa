import type { ESTree } from 'meriyah';

const JSX_IDENTIFIERS = new Set(['jsxDEV', 'jsx', 'jsxs']);

export default function renderOnBuildTime() {
  const allImportsWithPath = new Map<string, string>();
  let needsPrerenderImport = false;

  /**
   * This function should be used during AST traversal to analyze any node and
   * transform it if necessary.
   */
  function step1_modifyJSXToPrerenderComponents(
    this: any,
    key: string,
    value: any,
  ) {
    if (value?.type === 'ImportDeclaration') {
      for (const specifier of value.specifiers) {
        allImportsWithPath.set(specifier.local.name, value.source.value);
      }
    }

    if (isRequire(value)) {
      for (const argument of (value.init.object ?? value.init).arguments) {
        if (value.id?.properties) {
          for (const p of value.id?.properties) {
            allImportsWithPath.set(p.value.name, argument.value);
          }
        } else {
          allImportsWithPath.set(value.id.name, argument.value);
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

    needsPrerenderImport = true;

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
                value: allImportsWithPath.get(value.arguments[0].name),
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
                value: 'default',
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
                properties: value.arguments[1].properties.filter(
                  differentThanRenderOnBuildTime,
                ),
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
        ],
        source: {
          type: 'Literal',
          value: 'brisa/server',
        },
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
    JSX_IDENTIFIERS.has(jsxCall.callee?.name) &&
    jsxCall.arguments[1]?.type === 'ObjectExpression'
  ) {
    for (const prop of jsxCall.arguments[1].properties as any) {
      if (prop?.key?.name === 'renderOn') {
        return prop?.value?.value;
      }
    }
  }
}
