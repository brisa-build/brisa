import type { ESTree } from "meriyah";
import type { ActionInfo } from "@/utils/compile-actions/get-actions-info";
import removeAllReturns from "@/utils/ast/remove-all-returns";
import containsIdentifiers from "@/utils/ast/contains-identifiers";
import getAllIdentifiers from "@/utils/ast/get-all-identifiers";
import getVarDeclarationIdentifiers from "@/utils/ast/get-var-declaration-identifiers";

/**
 * This process of purging the body is necessary to remove all the code
 * that is not necessary for the action to work. The action in a next
 * process is injected into the body and executed.
 *
 * The action needs the dependencies that only the action has, so the
 * rest of the code is purged.
 */
export function getPurgedBody(info: ActionInfo): ESTree.BlockStatement {
  const defaultBody = { type: "BlockStatement", body: [] };
  const body = (info.componentFnExpression?.body ??
    defaultBody) as ESTree.BlockStatement;
  const bodyIdentifiers = getVarDeclarationIdentifiers(body);
  const actionIdentifiers = getAllIdentifiers(
    info.actionFnExpression ?? getActionFnFromActionIdentifier(info),
  );
  const intersectionSet = new Set(
    [...actionIdentifiers].filter((value) => bodyIdentifiers.has(value)),
  );

  return {
    ...body,
    body: removeAllReturns(body.body).filter((node) =>
      containsIdentifiers(node, intersectionSet),
    ),
  };
}

function getActionFnFromActionIdentifier(info: ActionInfo) {
  let actionFn:
    | ESTree.FunctionExpression
    | ESTree.ArrowFunctionExpression
    | undefined;

  JSON.stringify(info.componentFnExpression, (k, v) => {
    if (info.actionIdentifierName === v?.id?.name) {
      actionFn = v;
    }
    return v;
  });

  return actionFn;
}
