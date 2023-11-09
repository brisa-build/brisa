import { ESTree } from "meriyah";
import { NO_REACTIVE_CHILDREN_EXPRESSION } from "../constants";
import wrapWithArrowFn from "../wrap-with-arrow-fn";

type TransformToReactiveProps = {
  componentParams: ESTree.Parameter[];
  propsNames: string[];
  applyArrowFn?: boolean;
};

export default function transformToReactiveProps(
  children: any,
  {
    componentParams,
    propsNames,
    applyArrowFn = true,
  }: TransformToReactiveProps,
) {
  if (
    !children ||
    !propsNames.length ||
    NO_REACTIVE_CHILDREN_EXPRESSION.has(children.type)
  ) {
    return children;
  }

  const wrap = (node: any) => (applyArrowFn ? wrapWithArrowFn(node) : node);

  if (propsNames.includes(children?.name)) {
    return wrap({
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: children?.name,
      },
      property: {
        type: "Identifier",
        name: "value",
      },
      computed: false,
    });
  }

  const props = componentParams[0];

  if (props.type === "ObjectPattern" && children.type === "Identifier") {
    for (const prop of props.properties) {
      if (prop.value.name === children.name) {
        return wrap({
          type: "MemberExpression",
          object: children,
          property: {
            type: "Identifier",
            name: "value",
          },
          computed: false,
        });
      }
    }
  }

  if (
    props.type === "Identifier" &&
    children.object?.type === "Identifier" &&
    props.name === children.object?.name
  ) {
    return wrap({
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: props,
        property: {
          type: "Identifier",
          name: children.property?.name,
        },
        computed: false,
      },
      property: {
        type: "Identifier",
        name: "value",
      },
      computed: false,
    });
  }

  return children;
}

export function transformToReactivePropsForInnerTags(
  children: any,
  { componentParams, propsNames, applyArrowFn }: TransformToReactiveProps,
) {
  if (!children) return children;

  return JSON.parse(JSON.stringify(children), (key, value) => {
    if (
      value?.type === "ArrayExpression" &&
      value?.elements?.length === 3 &&
      !Array.isArray(value?.elements[0])
    ) {
      value.elements[2] = transformToReactiveProps(value.elements[2], {
        componentParams,
        propsNames,
        applyArrowFn,
      });
    }
    return value;
  });
}
