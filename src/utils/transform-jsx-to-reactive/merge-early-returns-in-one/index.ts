import { ESTree } from "meriyah";

const CONDITIONAL_TYPES = new Set(["IfStatement", "SwitchStatement"]);
const TYPES_TO_AVOID_ANALYZE_RETURN = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
]);

/**
 * Merge early returns in one
 *
 * @description
 *  Merge early returns in one combined them inside an hyperScript array
 *
 * @example:
 *
 * transform:
 *
 *  function Component({ propName }) {
 *   if (propName) {
 *      return ['div', {}, '']
 *   }
 *
 *   return ['span', {}, '']
 *  }
 *
 * to:
 *
 *  function Component({ propName }) {
 *     return [null, {}, () => {
 *      if (propName.value) {
 *         return ['div', {}, '']
 *       }
 *
 *       return ['span', {}, '']
 *     }]
 *   }
 */
export default function mergeEarlyReturnsInOne(
  componentBranch: ESTree.FunctionDeclaration
): ESTree.FunctionDeclaration {
  const body = (componentBranch as any)?.body?.body ?? [];
  let firstEarlyReturn = -1;

  // Analyze the body to find early returns
  for (let i = 0; i < body.length; i++) {
    const bodyItem = body[i];

    if (!CONDITIONAL_TYPES.has(bodyItem.type)) continue;

    const hasReturnStatement = detectReturnStatementInside(bodyItem);

    // First conditional statement with return statement
    if (hasReturnStatement && firstEarlyReturn === -1) {
      firstEarlyReturn = i;
    }
  }

  // Function to analyze if the conditional statement has a return statement and register it
  function detectReturnStatementInside(item: ESTree.Statement): boolean {
    let hasReturnStatement = false;

    JSON.stringify(item, (key, value) => {
      // Ignore analyzing inside these types
      if (TYPES_TO_AVOID_ANALYZE_RETURN.has(value?.type)) {
        return null;
      }

      // If there is a return statement, register it
      if (key === "type" && value === "ReturnStatement") {
        hasReturnStatement = true;
        return null;
      }

      return value;
    });

    return hasReturnStatement;
  }

  // If there is no conditional statement with return statement, return the component branch
  if (firstEarlyReturn === -1) {
    return componentBranch;
  }

  const bodyWithoutReturnPaths = body.slice(0, firstEarlyReturn);
  const bodyWithReturnPaths = body.slice(firstEarlyReturn, Infinity);

  // Merge the conditional statements to only one
  return {
    ...componentBranch,
    body: {
      ...componentBranch.body,
      body: [
        ...bodyWithoutReturnPaths,
        {
          type: "ReturnStatement",
          argument: {
            type: "ArrayExpression",
            elements: [
              { type: "Literal", value: null },
              { type: "ObjectExpression", properties: [] },
              {
                type: "ArrowFunctionExpression",
                params: [],
                body: {
                  type: "BlockStatement",
                  body: bodyWithReturnPaths,
                },
              },
            ],
          },
        },
      ],
    },
  } as ESTree.FunctionDeclaration;
}
