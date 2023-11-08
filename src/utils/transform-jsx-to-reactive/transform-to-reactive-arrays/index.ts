import { ESTree } from "meriyah";
import { JSX_NAME, NO_REACTIVE_CHILDREN_EXPRESSION } from "../constants";
import wrapWithArrowFn from "../wrap-with-arrow-fn";
import getConstants from "../../../constants";

export default function transformToReactiveArrays(ast: ESTree.Program) {
  const { LOG_PREFIX } = getConstants();

  return JSON.parse(JSON.stringify(ast), (key, value) => {
    if (
      value?.type !== "CallExpression" ||
      !JSX_NAME.has(value?.callee?.name ?? "")
    ) {
      return value;
    }

    if (
      value.arguments[0].type === "Identifier" &&
      value.arguments[0].name !== "Fragment"
    ) {
      console.log(LOG_PREFIX.ERROR, `Ops! Error:`);
      console.log(LOG_PREFIX.ERROR, `--------------------------`);
      console.log(
        LOG_PREFIX.ERROR,
        `You can't use "${value.arguments[0].name}" variable as a tag name.`,
      );
      console.log(
        LOG_PREFIX.ERROR,
        `Please use a string instead. You cannot use server-components inside web-components directly.`,
      );
      console.log(
        LOG_PREFIX.ERROR,
        `You must use the "children" or slots in conjunction with the events to communicate with the server-components.`,
      );
      console.log(LOG_PREFIX.ERROR, `--------------------------`);
      console.log(
        LOG_PREFIX.ERROR,
        `Docs: https://brisa.dev/docs/component-details/web-components`,
      );
    }

    const tagName = value.arguments[0].value ?? null;
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
          value: tagName,
        },
        {
          type: "ObjectExpression",
          properties: tagName == null ? {} : restOfProps,
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
