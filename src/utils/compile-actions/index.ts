import type { BunPlugin } from "bun";
import type { ESTree } from "meriyah";

import AST from "@/utils/ast";
import { getConstants } from "@/constants";

type CompileActionsParams = {
  actionsEntrypoints: string[];
};

type ActionContent =
  | { actionIdentifierName: string }
  | {
      actionFnExpression:
        | ESTree.ArrowFunctionExpression
        | ESTree.FunctionExpression;
    };

type ActionInfo = {
  actionId: string;
  componentFnExpression?:
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression;
} & ActionContent;

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const { BUILD_DIR, SRC_DIR, IS_PRODUCTION } = getConstants();
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
  return Bun.build({
    entrypoints: actionsEntrypoints,
    outdir: BUILD_DIR,
    sourcemap: IS_PRODUCTION ? undefined : "inline",
    root: SRC_DIR,
    target: "bun",
    minify: IS_PRODUCTION,
    splitting: true,
    plugins: [actionPlugin()],
  });
}

function actionPlugin() {
  return {
    name: "action-plugin",
    setup(build) {
      build.onLoad({ filter: /.*/ }, async ({ path, loader }) => {
        const code = await Bun.file(path).text();
        return { contents: transformToActionCode(code), loader };
      });
    },
  } satisfies BunPlugin;
}

export function transformToActionCode(code: string) {
  let ast = parseCodeToAST(code);
  const actionsInfo = getActionsInfo(ast);

  ast = addResolveActionImport(ast);
  ast = unexportAll(ast);

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

function unexportAll(ast: ESTree.Program): ESTree.Program {
  return {
    ...ast,
    body: ast.body.map((node) =>
      EXPORT_TYPES.has(node.type) ? (node as any).declaration : node,
    ),
  };
}

function isPascalCase(str: string) {
  if (typeof str !== "string") return false;
  return str[0] === str[0].toUpperCase();
}

function getActionsInfo(ast: ESTree.Program): ActionInfo[] {
  const actionInfo: ActionInfo[] = [];

  JSON.stringify(ast, function (k, comp) {
    if (FN_DECLARATION_TYPES.has(comp?.type) && isPascalCase(comp?.id?.name)) {
      JSON.stringify(comp, function (k, curr) {
        if (
          curr?.type === "Property" &&
          curr?.key?.value?.startsWith?.("data-action-")
        ) {
          const eventName = curr?.key?.value?.replace?.("data-action-", "");
          const eventContent = this.find?.(
            (e: any) => e?.key?.name === eventName,
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
  const body = info.componentFnExpression?.body ?? (defaultBody as any);
  const { params, requestDestructuring } = getActionParams(info);

  if (requestDestructuring) {
    body.body.unshift(requestDestructuring);
  }

  return {
    type: "ExportNamedDeclaration",
    declaration: {
      type: "FunctionDeclaration",
      id: {
        type: "Identifier",
        name: info.actionId,
      },
      params,
      body,
      async: true,
      generator: false,
    },
    specifiers: [],
    source: null,
  };
}

function getActionParams(info: ActionInfo) {
  const params = info.componentFnExpression?.params ?? [];
  let requestParamName = "req";
  let requestDestructuring;

  if (!params.length) {
    params.push({ type: "ObjectPattern", properties: [] });
  } else if (params.length === 1) {
    params.push({ type: "Identifier", name: requestParamName });
  } else {
    const currentReq = params[1];

    requestParamName =
      currentReq.type === "Identifier" ? currentReq.name : "req";
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
      };
    }
  }

  return { params, requestDestructuring, requestParamName };
}
