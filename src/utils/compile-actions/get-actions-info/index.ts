import type { ESTree } from "meriyah";

export type ActionInfo = {
  actionId: string;
  actionIdentifierName?: string;
  actionFnExpression?:
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression;
  componentFnExpression?:
    | ESTree.ArrowFunctionExpression
    | ESTree.FunctionExpression;
};

const FN = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

export default function getActionsInfo(ast: ESTree.Program): ActionInfo[] {
  const actionInfo: ActionInfo[] = [];

  JSON.stringify(ast, function (k, comp) {
    if (FN.has(comp?.type)) {
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
            actionFnExpression: FN.has(eventContent?.type)
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
