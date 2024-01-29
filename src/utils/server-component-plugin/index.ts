import AST from "@/utils/ast";
import replaceAstImportsToAbsolute from "@/utils/replace-ast-imports-to-absolute";

type ServerComponentPluginOptions = {
  allWebComponents: Record<string, string>;
  fileID: string;
  path: string;
};

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const JSX_NAME = new Set(["jsx", "jsxDEV"]);
const WEB_COMPONENT_REGEX = new RegExp(".*/web-components/.*");

// TODO: Remove this workaround when this issue will be fixed:
// https://github.com/oven-sh/bun/issues/7499
export const workaroundText = `
const Fragment = props => props.children;

function jsxDEV(type, props){ return { type, props }};
function jsx(type, props){ return { type, props }};

Fragment.__isFragment = true;
`;

export default function serverComponentPlugin(
  code: string,
  { allWebComponents, fileID, path }: ServerComponentPluginOptions,
) {
  const ast = parseCodeToAST(code);
  const isWebComponent = WEB_COMPONENT_REGEX.test(path);
  const detectedWebComponents: Record<string, string> = {};
  const usedWebComponents = new Map<string, string>();
  let actionIdCount = 1;
  let count = 1;
  let hasActions = false;

  let modifiedAst = JSON.parse(
    JSON.stringify(ast, (key, value) => {
      const isJSX =
        value?.type === "CallExpression" && JSX_NAME.has(value?.callee?.name);

      // Register each JSX action id
      if (isJSX && !isWebComponent) {
        const actionProperties = [];
        const properties = value.arguments[1]?.properties ?? [];

        for (let attributeAst of properties) {
          if (attributeAst?.key?.name?.startsWith("on")) {
            hasActions = true;
            actionProperties.push({
              type: "Property",
              key: {
                type: "Literal",
                value: `actionId-${attributeAst?.key?.name}`,
              },
              value: {
                type: "Literal",
                value: `${fileID}_${actionIdCount++}`,
              },
              kind: "init",
              computed: false,
              method: false,
              shorthand: false,
            });
          }
        }

        if (actionProperties.length) {
          value.arguments[1].properties = [...properties, ...actionProperties];
        }
      }

      if (
        isJSX &&
        value?.arguments?.[0]?.type === "Literal" &&
        allWebComponents[value?.arguments?.[0]?.value]
      ) {
        const selector = value?.arguments?.[0]?.value;
        const componentPath = allWebComponents[selector];

        detectedWebComponents[selector] = componentPath;

        // Avoid transformation if it is a native web-component
        if (selector?.startsWith("native-")) return value;

        // Avoid transformation if it has the "skipSSR" attribute
        if (
          value?.arguments?.[1]?.properties?.some(
            (prop: any) =>
              prop?.key?.name === "skipSSR" && prop?.value?.value !== false,
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
    }),
  );

  if (hasActions) {
    modifiedAst = replaceAstImportsToAbsolute(modifiedAst, path);
  }

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
    })),
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
    hasActions,
  };
}
