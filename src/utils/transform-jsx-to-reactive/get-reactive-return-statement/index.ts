import { ESTree } from "meriyah";
import wrapWithArrowFn from "../wrap-with-arrow-fn";

const FRAGMENT = { type: "Literal", value: null };
const EMPTY_ATTRIBUTES = { type: "ObjectExpression", properties: [] };
const REACTIVE_VALUES = new Set([
  "Identifier",
  "ConditionalExpression",
  "MemberExpression",
]);

export default function getReactiveReturnStatement(
  componentBody: ESTree.Statement[],
  hyperScriptVarName: string
) {
  const returnStatementIndex = componentBody.findIndex(
    (node: any) => node.type === "ReturnStatement"
  );
  const returnStatement = componentBody[returnStatementIndex] as any;
  let [tagName, props, children] = returnStatement?.argument?.elements ?? [];
  let componentChildren = children;

  if (returnStatement?.argument?.type === "CallExpression") {
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
    componentBody[0]?.type === "VariableDeclaration" &&
    componentBody[0]?.declarations[0]?.init?.type ===
      "ArrowFunctionExpression" &&
    componentBody[0]?.declarations[0]?.init?.body?.type !== "BlockStatement"
  ) {
    const elements =
      componentBody[0]?.declarations[0]?.init?.body?.elements ?? [];
    tagName = {
      type: "Literal",
      value: elements[0]?.value ?? null,
    };
    props = {
      type: "ObjectExpression",
      properties: (elements[1]?.properties ?? []).map((property: any) => ({
        ...property,
        value: property.value,
      })),
    };
    componentChildren = {
      type: "Literal",
      value: elements[2]?.value ?? "",
    };
  }

  // Cases that the component return a literal, ex: return "foo" or bynary expression, ex: return "foo" + "bar"
  else if (
    !tagName &&
    !props &&
    !componentChildren &&
    (returnStatement?.argument == null ||
      returnStatement?.argument?.type === "Literal" ||
      returnStatement?.argument?.type === "BinaryExpression")
  ) {
    const children = returnStatement?.argument;

    tagName = FRAGMENT;
    props = EMPTY_ATTRIBUTES;
    componentChildren = { type: "Literal", value: children?.value ?? "" };

    // Transforming:
    //  "SomeString" + props.foo + " " + props.bar
    // to:
    //   () => "SomeString" + props.foo.value + " " + props.bar.value
    if (children?.type === "BinaryExpression" && children?.operator === "+") {
      const reactiveBinaryExpression = (item: any): any => {
        if (item?.type === "BinaryExpression") {
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

  const newReturnStatement = {
    type: "ReturnStatement",
    argument: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: hyperScriptVarName,
      },
      arguments: [tagName, props, componentChildren],
    },
  };

  return [newReturnStatement, returnStatementIndex];
}
