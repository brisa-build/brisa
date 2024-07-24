import type { ESTree } from 'meriyah';
import { BRISA_IMPORT } from '@/utils/client-build-plugin/constants';
import getReactiveReturnStatement from '@/utils/client-build-plugin/get-reactive-return-statement';

export default function defineBrisaElement(
  component: ESTree.FunctionDeclaration,
  componentPropsNames: Set<string>,
  componentName: string,
) {
  const newComponentAst = getReactiveReturnStatement(component, componentName);

  // Add an identifier to the component
  const args = [{ type: 'Identifier', name: componentName }] as ESTree.Expression[];

  if (componentPropsNames?.size) {
    args.push({
      type: 'ArrayExpression',
      elements: Array.from(componentPropsNames).map((propName: string) => ({
        type: 'Literal',
        value: propName,
      })),
    });
  }

  // Wrapping: default export with brisaElement
  const brisaElement = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'brisaElement',
    },
    arguments: args,
  };

  return [BRISA_IMPORT, brisaElement, newComponentAst];
}
