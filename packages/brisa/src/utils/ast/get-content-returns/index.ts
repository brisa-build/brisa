import type { ESTree } from 'meriyah';
import { FN } from '@/utils/ast/constants';

export default function getContentReturns(
  statements: ESTree.Statement[],
): Set<ESTree.Node> {
  const returns = new Set<ESTree.Node>();

  JSON.stringify(statements, (k, v) => {
    if (FN.has(v?.type)) return null;
    if (v?.type === 'ReturnStatement') {
      returns.add(v);
    }
    return v;
  });

  return returns;
}
