import type { ESTree } from 'meriyah';
import getContentReturns from '@/utils/ast/get-content-returns';

const emptyBlockStatement = {
  type: 'BlockStatement',
  body: [],
};

export default function removeContentReturns(
  statements: ESTree.Statement[],
): ESTree.Statement[] {
  const returnNode = getContentReturns(statements);

  return JSON.parse(
    JSON.stringify(statements, function (k, v) {
      if (!returnNode.has(v)) return v;

      return this?.type === 'IfStatement' ? emptyBlockStatement : null;
    }),
    (k, v) => {
      if (Array.isArray(v)) return v.filter((v) => v !== null);
      return v;
    },
  );
}
