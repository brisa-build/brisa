import type { ESTree } from 'meriyah';

/**
 * It check if there is some "await" in the node
 */
export default function isAsyncContent(node: ESTree.Node) {
  let isAsync = false;

  JSON.stringify(node, (key, value) => {
    if (value?.type === 'ArrowFunctionExpression') {
      return null;
    }

    isAsync ||= value === 'AwaitExpression';

    return value;
  });

  return isAsync;
}
