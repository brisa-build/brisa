import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

export const rules = {
  'no-server-event-prevent': ESLintUtils.RuleCreator(
    (name) => `https://eslint.org/docs/rules/${name}`,
  )<[], 'preventUsage'>({
    name: 'no-server-event-prevent',
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow preventDefault() and stopPropagation() outside the web-components folder.',
      },
      schema: [],
      messages: {
        preventUsage:
          'Avoid using {{ method }} outside the web-components folder.',
      },
    },
    defaultOptions: [],
    create(context) {
      const filename = context.getFilename();
      const isWebComponent = filename.includes('web-components');

      return {
        CallExpression(node: TSESTree.CallExpression) {
          // Skip if the file is inside the web-components folder
          if (isWebComponent) return;

          // Check for preventDefault() or stopPropagation()
          if (
            node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            node.callee.property.type === 'Identifier' &&
            (node.callee.property.name === 'preventDefault' ||
              node.callee.property.name === 'stopPropagation')
          ) {
            context.report({
              node,
              messageId: 'preventUsage',
              data: {
                method: node.callee.property.name,
              },
            });
          }
        },
      };
    },
  }),
};

export default { rules };
