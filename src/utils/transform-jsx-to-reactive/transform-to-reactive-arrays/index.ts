import { ESTree } from "meriyah";
import { JSX_NAME, NO_REACTIVE_CHILDREN_EXPRESSION } from "../constants";
import wrapWithArrowFn from "../wrap-with-arrow-fn";

export default function transformToReactiveArrays(ast: ESTree.Program) {
  return JSON.parse(JSON.stringify(ast), (key, value) => {
    if (
      value?.type !== "CallExpression" ||
      !JSX_NAME.has(value?.callee?.name ?? "")
    ) {
      return value;
    }

    const tagName = value.arguments[0].value;
    const props = value.arguments[1].properties;
    const restOfProps = [];
    let children: any = [];

    for (const prop of props) {
      if (prop.key.name === "children" || prop.key.value === "children") {
        children = prop.key.value ?? prop.value;
        continue;
      }

      restOfProps.push(prop);
    }

    return {
      type: "ArrayExpression",
      elements: [
        {
          type: "Literal",
          value: tagName,
        },
        {
          type: "ObjectExpression",
          properties: restOfProps,
        },
        hasNodeASignal(children) ? wrapWithArrowFn(children) : children,
      ],
    };
  }) as ESTree.Program;
}

function hasNodeASignal(node: ESTree.Node) {
  let hasSignal = false;

  if (NO_REACTIVE_CHILDREN_EXPRESSION.has(node.type)) return hasSignal;

  JSON.stringify(node, (key, value) => {
    hasSignal ||=
      value?.type === "MemberExpression" &&
      value?.object?.type === "Identifier" &&
      value?.property?.type === "Identifier" &&
      value?.property?.name === "value";

    return value;
  });

  return hasSignal;
}
