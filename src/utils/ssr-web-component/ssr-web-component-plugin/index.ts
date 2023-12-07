import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const JSX_NAME = new Set(["jsx", "jsxDEV"]);

// TODO: Remove this workaround when this issue will be fixed:
// https://github.com/oven-sh/bun/issues/7499
export const workaroundText = `
const Fragment = props => props.children;

function jsxDEV(type, props){ return { type, props }};
function jsx(type, props){ return { type, props }};

Fragment.__isFragment = true;
`;

export default function ssrWebComponentPlugin(
  code: string,
  allWebComponents: Record<string, string>
) {
  const ast = parseCodeToAST(code);
  const detectedWebComponents: Record<string, string> = {};
  const usedWebComponents = new Map<string, string>();
  let count = 1;

  const modifiedAst = JSON.parse(
    JSON.stringify(ast, (key, value) => {
      if (
        value?.type === "CallExpression" &&
        JSX_NAME.has(value?.callee?.name) &&
        value?.arguments?.[0]?.type === "Literal" &&
        allWebComponents[value?.arguments?.[0]?.value]
      ) {
        const selector = value?.arguments?.[0]?.value;
        const componentPath = allWebComponents[selector];

        detectedWebComponents[selector] = componentPath;

        // Avoid transformation if it has the "ssr" attribute to "false"
        if (
          value?.arguments?.[1]?.properties?.some(
            (prop: any) =>
              prop?.key?.name === "ssr" && prop?.value?.value === false
          )
        ) {
          return value;
        }

        const ComponentName =
          usedWebComponents.get(componentPath) ?? `_Brisa_WC${count++}`;

        usedWebComponents.set(componentPath, ComponentName);

        value.arguments[0] = {
          type: "Identifier",
          name: "_Brisa_SSRWebComponent",
        };
        value.arguments[1] = {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              key: {
                type: "Identifier",
                name: "Component",
              },
              value: {
                type: "Identifier",
                name: ComponentName,
              },
              kind: "init",
              computed: false,
              method: false,
              shorthand: false,
            },
            {
              type: "Property",
              key: {
                type: "Identifier",
                name: "selector",
              },
              value: {
                type: "Literal",
                value: selector,
              },
              kind: "init",
              computed: false,
              method: false,
              shorthand: false,
            },
            ...(value.arguments[1]?.properties ?? []),
          ],
        };
      }

      return value;
    })
  );

  // Add imports of web-components used for SSR
  modifiedAst.body.unshift(
    ...Array.from(usedWebComponents.entries()).map(([path, name]) => ({
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportDefaultSpecifier",
          local: { type: "Identifier", name },
        },
      ],
      source: { type: "Literal", value: path },
    }))
  );

  // Add: import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server"
  if (usedWebComponents.size) {
    modifiedAst.body.unshift({
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportSpecifier",
          imported: { type: "Identifier", name: "SSRWebComponent" },
          local: { type: "Identifier", name: "_Brisa_SSRWebComponent" },
        },
      ],
      source: { type: "Literal", value: "brisa/server" },
    });
  }

  return {
    code: generateCodeFromAST(modifiedAst) + workaroundText,
    detectedWebComponents,
  };
}
