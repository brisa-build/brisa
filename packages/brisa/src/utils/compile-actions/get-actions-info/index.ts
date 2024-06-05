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

const EXPRESSION_TYPES = new Set(["CallExpression", "MemberExpression"]);
const FN = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

export default function getActionsInfo(ast: ESTree.Program): ActionInfo[] {
  const registeredActions = new Set<string>();
  const actionInfo: ActionInfo[] = [];

  JSON.stringify(ast, (k, comp) => {
    if (FN.has(comp?.type)) {
      JSON.stringify(comp, function (k, curr) {
        if (
          curr?.type === "Property" &&
          curr?.key?.value?.startsWith?.("data-action-")
        ) {
          const eventName = curr?.key?.value
            ?.replace?.("data-action-", "")
            ?.toLowerCase();

          const actionId = curr?.value?.value;

          /**
           * This is important in cases like this:
           *
           * export default function Component({text}) {
           *  const getTextEl = () => (
           *    <div
           *      onClick={() => console.log('hello world')}
           *      data-action-onClick="a1_1"
           *      data-action
           *    >
           *      {text}
           *    </div>
           *  );
           *  return getTextEl();
           * }
           *
           * In these cases, the first registered action would be
           * from the Component (the one we are interested in),
           * and the second would be from the getTextEl, which
           * we are no longer interested in for some reasons:
           *
           * - We already have the action registered
           * - The action inside this arrow function would not
           *   work well; it would not take into account the
           *   real dependencies that the component has.
           * - we need the whole component to rerender it if
           *   we want to perform this action after proceeding
           *   with the server action.
           */
          if (registeredActions.has(actionId)) return curr;

          const eventContent = this.find?.(
            (e: any) => e?.key?.name?.toLowerCase() === eventName,
          )?.value;

          let actionFnExpression: any | undefined;
          let actionIdentifierName: string | undefined;

          if (EXPRESSION_TYPES.has(eventContent?.type)) {
            actionFnExpression = eventContent;
            JSON.stringify(eventContent, (k, v) => {
              if (actionIdentifierName) return null;
              const name = v?.callee?.name ?? v?.object?.name;
              if (name) {
                actionIdentifierName = name;
                return null;
              }
              return v;
            });
          } else if (eventContent?.type === "Identifier") {
            actionIdentifierName = eventContent?.name;
          } else if (FN.has(eventContent?.type)) {
            actionFnExpression = eventContent;
          }

          registeredActions.add(actionId);
          actionInfo.push({
            actionId,
            componentFnExpression: comp,
            actionFnExpression,
            actionIdentifierName,
          });
        }
        return curr;
      });
    }

    return comp;
  });

  return actionInfo;
}
