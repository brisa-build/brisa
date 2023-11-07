import { ESTree } from "meriyah";

const JSX_NAME = new Set(["jsx", "jsxDEV"]);

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
        children,
      ],
    };
  }) as ESTree.Program;
}
