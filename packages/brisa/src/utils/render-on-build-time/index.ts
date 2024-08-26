import type { ESTree } from 'meriyah';

export default function renderOnBuildTime(ast: ESTree.Program): ESTree.Program {
  console.dir({ ast }, { depth: null });
  return ast;
}
