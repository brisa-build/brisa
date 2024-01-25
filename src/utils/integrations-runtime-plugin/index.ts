import type { BunPlugin } from "bun";
import AST from "@/utils/ast";
import type { ESTree } from "meriyah";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function integrationsRuntimePlugin(integrationsPath: string) {
  return {
    name: "integrations-plugin",
    setup(build) {
      build.onLoad(
        { filter: new RegExp(`${integrationsPath}$`) },
        async ({ path, loader }) => ({
          contents: convertPathsToAbsolute(await Bun.file(path).text()),
          loader,
        }),
      );
    },
  } satisfies BunPlugin;
}

/**
 * Convert this:
 *
 * export default {
 *  'foo-component': '@/lib/foo',
 * }
 *
 * To this:
 *
 * export default Object.fromEntries(Object.entries({
 *  'foo-component': '@/lib/foo',
 * }).map(([key, value]) => [key, import.meta.resolveSync(value)]))
 *
 */
export function convertPathsToAbsolute(code: string) {
  const ast = parseCodeToAST(code);
  const defaultExportIndex = ast.body.findIndex(
    (node) => node.type === "ExportDefaultDeclaration",
  );

  if (defaultExportIndex === -1) return code;

  const { declaration } = ast.body[
    defaultExportIndex
  ] as ESTree.ExportDefaultDeclaration;

  ast.body[defaultExportIndex] = {
    type: "ExportDefaultDeclaration",
    declaration: {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "Object",
        },
        computed: false,
        property: {
          type: "Identifier",
          name: "fromEntries",
        },
      },
      arguments: [
        {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                object: {
                  type: "Identifier",
                  name: "Object",
                },
                computed: false,
                property: {
                  type: "Identifier",
                  name: "entries",
                },
              },
              arguments: [declaration],
            },
            computed: false,
            property: {
              type: "Identifier",
              name: "map",
            },
          },
          arguments: [
            {
              type: "ArrowFunctionExpression",
              params: [
                {
                  type: "ArrayPattern",
                  elements: [
                    {
                      type: "Identifier",
                      name: "key",
                    },
                    {
                      type: "Identifier",
                      name: "value",
                    },
                  ],
                },
              ],
              body: {
                type: "ArrayExpression",
                elements: [
                  {
                    type: "Identifier",
                    name: "key",
                  },
                  {
                    type: "CallExpression",
                    callee: {
                      type: "MemberExpression",
                      object: {
                        type: "MetaProperty",
                        meta: {
                          type: "Identifier",
                          name: "import",
                        },
                        property: {
                          type: "Identifier",
                          name: "meta",
                        },
                      },
                      computed: false,
                      property: {
                        type: "Identifier",
                        name: "resolveSync",
                      },
                    },
                    arguments: [
                      {
                        type: "Identifier",
                        name: "value",
                      },
                    ],
                  },
                ],
              },
              async: false,
              expression: true,
            },
          ],
        },
      ],
    },
  };

  return generateCodeFromAST(ast);
}
