import AST from "@/utils/ast";
import { JSX_NAME } from "@/utils/client-build-plugin/constants";
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

const { parseCodeToAST } = AST("tsx");
const EXPRESSION_TYPES = new Set([
  "CallExpression",
  "MemberExpression",
  "LogicalExpression",
]);
const FN = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

function isJSXDeclaration(declaration: any) {
  return JSX_NAME.has(declaration?.init?.callee?.name);
}

export default function getActionsInfo(ast: ESTree.Program): ActionInfo[] {
  const registeredActions = new Set<string>();
  const fnCallsInsideComponents = new Map<string, any>();
  const actionInfo: ActionInfo[] = [];
  const actionsFromElements: Map<string, ActionInfo[]> = new Map();

  JSON.stringify(ast, (k, comp) => {
    const element = comp?.declarations?.find(isJSXDeclaration);
    const isElement = comp?.type === "VariableDeclaration" && element;
    const isComponent = FN.has(comp?.type);

    if (isComponent || isElement) {
      JSON.stringify(comp, function (k, curr) {
        const isElementIdentifier =
          curr?.type === "Identifier" && actionsFromElements.has(curr?.name);

        // When a Component use identifiers of outside elements with JSX, register the actions
        // of the outside elements as well in the component.
        if (isComponent && isElementIdentifier) {
          const elementActions = actionsFromElements.get(
            curr?.name,
          ) as ActionInfo[];

          for (const action of elementActions) {
            actionInfo.push({ ...action, componentFnExpression: comp });
          }

          return curr;
        }

        // When a Element use identifiers of outside elements with JSX, we need to propagate
        // the registry to the element
        else if (isElement && isElementIdentifier) {
          const elementActions = actionsFromElements.get(
            curr?.name,
          ) as ActionInfo[];
          actionsFromElements.set(element.id.name, elementActions);
        }

        // When a component use element generators (functions that return JSX elements),
        // register it to replace the actionFnExpression with the real component function
        // after the analysis.
        else if (
          curr?.type === "CallExpression" &&
          curr?.callee?.type === "Identifier"
        ) {
          fnCallsInsideComponents.set(curr?.callee?.name, comp);

          // When an action is detected, register it when it is not registered yet.
        } else if (
          curr?.type === "Property" &&
          curr?.key?.value?.startsWith?.("data-action-")
        ) {
          const eventName = curr?.key?.value?.replace?.("data-action-", "");
          const eventNameLowerCase = eventName?.toLowerCase();
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

          let eventContent = this.find?.(
            (e: any) => e?.key?.name?.toLowerCase() === eventNameLowerCase,
          )?.value;

          let actionFnExpression: any | undefined;
          let actionIdentifierName: string | undefined;

          // If the eventContent is not found, it means that maybe is
          //  using destructuring from some object
          if (!eventContent) {
            const spreads =
              this.filter?.((e: any) => e.type === "SpreadElement") ?? [];

            if (spreads.length) {
              const eventNameCamelCase = `on${eventName[2].toUpperCase()}${eventName.slice(
                3,
              )}`;
              const expressionCode = spreads
                .map((e: any) => `${e.argument.name}.${eventNameCamelCase}`)
                .join(" ?? ");
              eventContent = (
                parseCodeToAST(expressionCode)
                  .body[0] as ESTree.ExpressionStatement
              )?.expression;
            }
          }

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

          if (isElement) {
            const elementActions =
              actionsFromElements.get(element.id.name) ?? [];
            actionsFromElements.set(element.id.name, [
              ...elementActions,
              {
                actionId,
                actionIdentifierName,
                actionFnExpression,
              },
            ]);
          } else {
            actionInfo.push({
              actionId,
              componentFnExpression: comp,
              actionFnExpression,
              actionIdentifierName,
            });
          }
        }

        return curr;
      });
    }

    return comp;
  });

  // Replace the componentFnExpression with the real Component function in case
  // to be element generators.
  // Ex:
  // const someElement = () => <div>...</div>;
  // consumed in JSX like this: <div>{someElement()}</div>
  for (const info of actionInfo) {
    const name = (info.componentFnExpression as any)?.id?.name;

    if (fnCallsInsideComponents.has(name)) {
      info.componentFnExpression = fnCallsInsideComponents.get(name);
    }
  }

  return actionInfo;
}
