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

    if (!isJSXCallToPrerender(value)) return value;

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

function differentThanRenderOnBuildTime(p: any) {
  return p?.key?.name !== 'renderOn';
}

function isJSXCallToPrerender(jsxCall: ESTree.CallExpression) {
  return (
    jsxCall?.type === 'CallExpression' &&
    JSX_IDENTIFIERS.has(jsxCall.callee?.name) &&
    jsxCall.arguments[1]?.type === 'ObjectExpression' &&
    jsxCall.arguments[1]?.properties?.some?.(
      (p: any) =>
        p?.type === 'Property' &&
        p?.key?.type === 'Identifier' &&
        p?.key?.name === 'renderOn' &&
        p?.value?.value === 'build',
    )
  );
}
