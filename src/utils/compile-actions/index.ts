import type { BunPlugin } from "bun";
import type { ESTree } from "meriyah";
import fs from "node:fs";

import AST from "@/utils/ast";
import { getConstants } from "@/constants";

type CompileActionsParams = {
  actionsEntrypoints: string[];
};

type ActionInfo = {
  actionId: string;
  actionIdentifierName?: string;
  actionFnExpression?:
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression;
  componentFnExpression?:
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression;
};

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const EXPORT_TYPES = new Set([
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
]);
const FN_EXPRESSION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
]);
const FN_DECLARATION_TYPES = new Set([
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

export default async function compileActions({
  actionsEntrypoints,
}: CompileActionsParams) {
  const { BUILD_DIR, IS_PRODUCTION } = getConstants();
  return Bun.build({
    entrypoints: actionsEntrypoints,
    outdir: BUILD_DIR,
    sourcemap: IS_PRODUCTION ? undefined : "inline",
    root: BUILD_DIR,
    target: "bun",
    minify: IS_PRODUCTION,
    splitting: true,
    plugins: [actionPlugin({ actionsEntrypoints })],
  });
}

function actionPlugin({ actionsEntrypoints }: CompileActionsParams) {
  const filter = new RegExp(`(${actionsEntrypoints.join("|")})$`);

  return {
    name: "action-plugin",
    setup(build) {
      build.onLoad({ filter }, async ({ path, loader }) => {
        const code = await Bun.file(path).text();
        const contents = transformToActionCode(code);

        fs.rmSync(path);

        return { contents, loader };
      });
    },
  } satisfies BunPlugin;
}

export function transformToActionCode(code: string) {
  let ast = parseCodeToAST(code);

  ast = addResolveActionImport(ast);
  ast = convertToFunctionDeclarations(ast);

  // Order matters, it needs the lastest version of the AST
  const actionsInfo = getActionsInfo(ast);

  for (const actionInfo of actionsInfo) {
    const action = createActionFn(actionInfo);
    ast.body.push(action);
  }

  return generateCodeFromAST(ast);
}

function addResolveActionImport(ast: ESTree.Program): ESTree.Program {
  return {
    ...ast,
    body: [
      {
        type: "ImportDeclaration",
        source: {
          type: "Literal",
          value: "brisa/server",
        },
        specifiers: [
          {
            type: "ImportSpecifier",
            imported: {
              type: "Identifier",
              name: "resolveAction",
            },
            local: {
              type: "Identifier",
              name: "resolveAction",
            },
          },
        ],
      },
      ...ast.body,
    ],
  };
}

function convertToFunctionDeclarations(ast: ESTree.Program): ESTree.Program {
  let count = 0;

  const isArrowFn = (node: any) => node?.type === "ArrowFunctionExpression";
  const arrowToFn = (declaration: ESTree.ArrowFunctionExpression) => ({
    type: "FunctionDeclaration",
    id: {
      type: "Identifier",
      name: `Component__${count++}__`,
    },
    params: declaration.params,
    body:
      declaration.body.type === "BlockStatement"
        ? declaration.body
        : {
            type: "BlockStatement",
            body: [
              {
                type: "ReturnStatement",
                argument: declaration.body,
              },
            ],
          },
    async: declaration.async,
    generator: false,
  });

  return {
    ...ast,
    body: ast.body.map((node) => {
      if (!EXPORT_TYPES.has(node?.type)) {
        return isArrowFn(node)
          ? arrowToFn(node as unknown as ESTree.ArrowFunctionExpression)
          : node;
      }

      const { declaration } = node as any;

      return isArrowFn(declaration) ? arrowToFn(declaration) : declaration;
    }),
  };
}

function getActionsInfo(ast: ESTree.Program): ActionInfo[] {
  const actionInfo: ActionInfo[] = [];

  JSON.stringify(ast, function (k, comp) {
    if (FN_DECLARATION_TYPES.has(comp?.type)) {
      JSON.stringify(comp, function (k, curr) {
        if (
          curr?.type === "Property" &&
          curr?.key?.value?.startsWith?.("data-action-")
        ) {
          const eventName = curr?.key?.value
            ?.replace?.("data-action-", "")
            ?.toLowerCase();

          const eventContent = this.find?.(
            (e: any) => e?.key?.name?.toLowerCase() === eventName,
          )?.value;

          actionInfo.push({
            actionId: curr?.value?.value,
            componentFnExpression: comp,
            actionFnExpression: FN_EXPRESSION_TYPES.has(eventContent?.type)
              ? eventContent
              : undefined,
            actionIdentifierName:
              eventContent?.type === "Identifier"
                ? eventContent?.name
                : undefined,
          });
        }
        return curr;
      });
    }

    return comp;
  });

  return actionInfo;
}

function createActionFn(info: ActionInfo): ESTree.ExportNamedDeclaration {
  const defaultBody = { type: "BlockStatement", body: [] };
  const { params, requestDestructuring, requestParamName } =
    getActionParams(info);
  const declareActionVar =
    !info.actionIdentifierName && info.actionFnExpression;
  const body = purgeBody(
    info.componentFnExpression?.body ?? (defaultBody as any),
  );

  if (declareActionVar) {
    body.body.unshift({
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: "__action",
          },
          init: info.actionFnExpression!,
        },
      ],
    });
  }

  if (requestDestructuring) {
    body.body.unshift(requestDestructuring);
  }

  // await __action(req.store.get('_action_params'));
  body.body.push(getActionCall(info, requestParamName));
  // return new Response(null);
  body.body.push(getResponseReturn());

  return {
    type: "ExportNamedDeclaration",
    declaration: {
      type: "FunctionDeclaration",
      id: {
        type: "Identifier",
        name: info.actionId,
      },
      params,
      body: wrapWithTypeCatch({ body, info, params, requestParamName }),
      async: true,
      generator: false,
    },
    specifiers: [],
    source: null,
  };
}

function purgeBody(body: ESTree.BlockStatement): ESTree.BlockStatement {
  const NODE_TO_PURGE = new Set(["IfStatement", "ReturnStatement"]);
  return {
    ...body,
    body: body?.body?.filter((e) => !NODE_TO_PURGE.has(e?.type)),
  };
}

function getActionParams(info: ActionInfo) {
  const params = (info.componentFnExpression?.params ?? []).slice();
  let requestParamName = "req";
  let requestDestructuring;

  if (!params.length) {
    params.push({ type: "ObjectPattern", properties: [] });
  } else if (params.length === 1) {
    params.push({ type: "Identifier", name: requestParamName });
  } else {
    const currentReq = params[1];

    requestParamName =
      currentReq?.type === "Identifier" ? currentReq?.name : "req";
    params[1] = { type: "Identifier", name: requestParamName };

    if (currentReq.type === "ObjectPattern") {
      requestDestructuring = {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: currentReq,
            init: {
              type: "Identifier",
              name: requestParamName,
            },
          },
        ],
      } satisfies ESTree.VariableDeclaration;
    }
  }

  return { params, requestDestructuring, requestParamName };
}

function getActionCall(
  info: ActionInfo,
  requestParamName: string,
): ESTree.ExpressionStatement {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "AwaitExpression",
      argument: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: info.actionIdentifierName ?? "__action",
        },
        arguments: [
          {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: {
                type: "MemberExpression",
                object: {
                  type: "Identifier",
                  name: requestParamName,
                },
                computed: false,
                property: {
                  type: "Identifier",
                  name: "store",
                },
              },
              computed: false,
              property: {
                type: "Identifier",
                name: "get",
              },
            },
            arguments: [
              {
                type: "Literal",
                value: "_action_params",
              },
            ],
          },
        ],
      },
    },
  };
}

function getResponseReturn(): ESTree.ReturnStatement {
  return {
    type: "ReturnStatement",
    argument: {
      type: "NewExpression",
      callee: {
        type: "Identifier",
        name: "Response",
      },
      arguments: [
        {
          type: "Literal",
          value: null,
        },
      ],
    },
  };
}

function wrapWithTypeCatch({
  body,
  info,
  params,
  requestParamName,
}: {
  body: ESTree.BlockStatement;
  info: ActionInfo;
  params: ESTree.FunctionDeclaration["params"];
  requestParamName: string;
}): ESTree.BlockStatement {
  const { IS_PRODUCTION } = getConstants();

  return {
    ...body,
    body: [
      {
        type: "TryStatement",
        block: {
          type: "BlockStatement",
          body: body.body,
        },
        handler: {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: "error",
          },
          body: {
            type: "BlockStatement",
            body: [
              {
                type: "ReturnStatement",
                argument: {
                  type: "CallExpression",
                  callee: {
                    type: "Identifier",
                    name: "resolveAction",
                  },
                  arguments: [
                    {
                      type: "ObjectExpression",
                      properties: [
                        {
                          type: "Property",
                          key: {
                            type: "Identifier",
                            name: "req",
                          },
                          value: {
                            type: "Identifier",
                            name: requestParamName,
                          },
                          kind: "init",
                          computed: false,
                          method: false,
                          shorthand: requestParamName === "req",
                        },
                        {
                          type: "Property",
                          key: {
                            type: "Identifier",
                            name: "error",
                          },
                          value: {
                            type: "Identifier",
                            name: "error",
                          },
                          kind: "init",
                          computed: false,
                          method: false,
                          shorthand: true,
                        },
                        {
                          type: "Property",
                          key: {
                            type: "Identifier",
                            name: "pagePath",
                          },
                          value: {
                            type: "CallExpression",
                            callee: {
                              type: "MemberExpression",
                              object: {
                                type: "MemberExpression",
                                object: {
                                  type: "Identifier",
                                  name: requestParamName,
                                },
                                computed: false,
                                property: {
                                  type: "Identifier",
                                  name: "store",
                                },
                              },
                              computed: false,
                              property: {
                                type: "Identifier",
                                name: "get",
                              },
                            },
                            arguments: [
                              {
                                type: "Literal",
                                value: "_action_page",
                              },
                            ],
                          },
                          kind: "init",
                          computed: false,
                          method: false,
                          shorthand: false,
                        },
                        {
                          type: "Property",
                          key: {
                            type: "Identifier",
                            name: "component",
                          },
                          value: {
                            type: "CallExpression",
                            callee: {
                              type: "Identifier",
                              name: IS_PRODUCTION ? "jsx" : "jsxDEV",
                            },
                            arguments: [
                              {
                                type: "Identifier",
                                name:
                                  (
                                    info.componentFnExpression as ESTree.FunctionExpression
                                  )?.id?.name ??
                                  // TODO: Support arrow function names
                                  "Component",
                              },
                              params[0],
                              ...((IS_PRODUCTION
                                ? []
                                : [
                                    {
                                      type: "Identifier",
                                      name: "undefined",
                                    },
                                    {
                                      type: "Literal",
                                      value: false,
                                    },
                                    {
                                      type: "Identifier",
                                      name: "undefined",
                                    },
                                    {
                                      type: "ThisExpression",
                                    },
                                  ]) as any),
                            ],
                          },
                          kind: "init",
                          computed: false,
                          method: false,
                          shorthand: false,
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        finalizer: null,
      },
    ],
  };
}
