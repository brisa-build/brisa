import type { ESTree } from 'meriyah';
import { getConstants } from '@/constants';
import wrapWithArrowFn from '@/utils/client-build-plugin/wrap-with-arrow-fn';

const FRAGMENT = { type: 'Literal', value: null };
const EMPTY_ATTRIBUTES = { type: 'ObjectExpression', properties: [] };
const REACTIVE_VALUES = new Set([
  'Identifier',
  'ConditionalExpression',
  'MemberExpression',
  'LogicalExpression',
]);

export default function getReactiveReturnStatement(
  component: ESTree.FunctionDeclaration,
  componentName: string,
) {
  const componentBody = (component.body?.body ?? [
    wrapWithReturnStatement(component.body as ESTree.Statement),
  ]) as ESTree.Statement[];

  const { LOG_PREFIX } = getConstants();
  const returnStatementIndex = componentBody.findIndex(
    (node: any) => node.type === 'ReturnStatement',
  );
  const returnStatement = componentBody[returnStatementIndex] as any;
  let [tagName, props, children] = returnStatement?.argument?.elements ?? [];
  let componentChildren = children;

  if (returnStatement?.argument?.type === 'CallExpression') {
    tagName = FRAGMENT;
    props = EMPTY_ATTRIBUTES;
    componentChildren = wrapWithArrowFn(returnStatement.argument);
  }

  // Transforming:
  //  "return conditional ? ['div', {}, ''] : ['span', {}, '']"
  // to:
  //  "return [null, {}, () => conditional ? ['div', {}, ''] : ['span', {}, '']]"
  if (REACTIVE_VALUES.has(returnStatement?.argument?.type)) {
    tagName = FRAGMENT;
    props = EMPTY_ATTRIBUTES;
    componentChildren = wrapWithArrowFn(returnStatement?.argument);
  }

  // Transforming:
  //  "(props) => ['div', { foo: props.bar }, '']"
  // to
  //  "return ['div', { foo: () => props.bar.value }, '']"
  else if (
    !returnStatement &&
    componentBody.length === 1 &&
    componentBody[0]?.type === 'VariableDeclaration' &&
    componentBody[0]?.declarations[0]?.init?.type === 'ArrowFunctionExpression' &&
    componentBody[0]?.declarations[0]?.init?.body?.type !== 'BlockStatement'
  ) {
    const elements = (componentBody[0] as any)?.declarations[0]?.init?.body?.elements ?? [];
    tagName = {
      type: 'Literal',
      value: elements[0]?.value ?? null,
    };
    props = {
      type: 'ObjectExpression',
      properties: (elements[1]?.properties ?? []).map((property: any) => ({
        ...property,
        value: property.value,
      })),
    };
    componentChildren = {
      type: 'Literal',
      value: elements[2]?.value ?? '',
    };
  }

  // Cases that the component return a literal, ex: return "foo" or bynary expression, ex: return "foo" + "bar"
  else if (
    !tagName &&
    !props &&
    !componentChildren &&
    (returnStatement?.argument == null ||
      returnStatement?.argument?.type === 'Literal' ||
      returnStatement?.argument?.type === 'BinaryExpression')
  ) {
    const children = returnStatement?.argument;

    tagName = FRAGMENT;
    props = EMPTY_ATTRIBUTES;
    componentChildren = { type: 'Literal', value: children?.value ?? '' };

    // Transforming:
    //  "SomeString" + props.foo + " " + props.bar
    // to:
    //   () => "SomeString" + props.foo.value + " " + props.bar.value
    if (children?.type === 'BinaryExpression' && children?.operator === '+') {
      const reactiveBinaryExpression = (item: any): any => {
        if (item?.type === 'BinaryExpression') {
          return {
            ...item,
            left: reactiveBinaryExpression(item.left),
            right: reactiveBinaryExpression(item.right),
          };
        }

        return item;
      };

      componentChildren = wrapWithArrowFn(reactiveBinaryExpression(children));
    }
  }

  if (!componentChildren) {
    console.log(LOG_PREFIX.ERROR, 'Error Code: 5001');
    console.log(LOG_PREFIX.ERROR);
    console.log(
      LOG_PREFIX.ERROR,
      'Description: An unexpected error occurred while processing your component.',
    );
    console.log(
      LOG_PREFIX.ERROR,
      'Details: The server encountered an internal error and was unable to build your component.',
    );
    console.log(LOG_PREFIX.ERROR);
    console.log(
      LOG_PREFIX.ERROR,
      'Please provide the following error code when reporting the problem: 5001.',
    );
    console.log(LOG_PREFIX.ERROR);
  }

  const newReturnStatement =
    tagName === FRAGMENT
      ? { type: 'ReturnStatement', argument: componentChildren }
      : {
          type: 'ReturnStatement',
          argument: {
            type: 'ArrayExpression',
            elements: [tagName, props, componentChildren],
          },
        };

  const newComponentBody = componentBody.map((node, index) =>
    index === returnStatementIndex ? newReturnStatement : node,
  );

  return {
    type: 'FunctionExpression',
    id: {
      type: 'Identifier',
      name: componentName,
    },
    params: component.params,
    body: {
      type: 'BlockStatement',
      body: newComponentBody,
    },
    generator: component.generator,
    async: component.async,
  };
}

function wrapWithReturnStatement(statement: ESTree.Statement) {
  return {
    type: 'ReturnStatement',
    argument: statement,
  };
}
