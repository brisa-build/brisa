import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

export const rules = {
  "no-server-event-prevent": ESLintUtils.RuleCreator(
    (name) => `https://eslint.org/docs/rules/${name}`,
  )<[], "preventUsage">({
    name: "no-server-event-prevent",
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow preventDefault() and stopPropagation() on server events",
      },
      schema: [],
      messages: {
        preventUsage: "Avoid using {{ method }} on server events.",
      },
    },
    defaultOptions: [],
    create(context) {
      const SERVER_EVENTS = new Set([
        "load",
        "DOMContentLoaded",
        "beforeunload",
        "unload",
      ]);

      return {
        CallExpression(node: TSESTree.CallExpression) {
          if (
            node.callee.type === "MemberExpression" &&
            node.callee.object.type === "Identifier" &&
            node.callee.property.type === "Identifier" &&
            (node.callee.property.name === "preventDefault" ||
              node.callee.property.name === "stopPropagation")
          ) {
            const parent = node.parent;
            if (
              parent &&
              parent.type === "CallExpression" &&
              parent.callee.type === "MemberExpression" &&
              parent.callee.object.type === "Identifier" &&
              parent.callee.property.type === "Identifier" &&
              parent.callee.property.name === "addEventListener"
            ) {
              const args = parent.arguments;
              if (args.length >= 2 && args[0].type === "Literal") {
                const eventType = args[0].value;
                if (
                  typeof eventType === "string" &&
                  SERVER_EVENTS.has(eventType)
                ) {
                  context.report({
                    node,
                    messageId: "preventUsage",
                    data: {
                      method: node.callee.property.name,
                    },
                  });
                }
              }
            }
          }
        },
      };
    },
  }),
};

export default { rules };
