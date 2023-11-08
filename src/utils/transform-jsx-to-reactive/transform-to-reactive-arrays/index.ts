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
      const isPropAnEvent = prop.key.name.startsWith("on");

      value =
        isPropAnEvent || !hasNodeASignal(prop.value)
          ? prop.value
          : wrapWithArrowFn(prop.value);

      restOfProps.push({ ...prop, value });
    }

    let childrenNode = hasNodeASignal(children)
      ? wrapWithArrowFn(children)
      : children;

    // <span></span> -> ["span", {}, ""]
    if (Array.isArray(childrenNode) && childrenNode.length === 0) {
      childrenNode = {
        type: "Literal",
        value: "",
      };
    }

    return {
      type: "ArrayExpression",
      elements: [
        {
          type: "Literal",
          value: tagName ?? null,
        },
        {
          type: "ObjectExpression",
          properties: restOfProps,
        },
        childrenNode,
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
