import { getConstants } from "@/constants";
import AST from "@/utils/ast";
import replaceAstImportsToAbsolute from "@/utils/replace-ast-imports-to-absolute";
import { logWarning } from "@/utils/log/log-build";
import getDependenciesList from "@/utils/ast/get-dependencies-list";

type ServerComponentPluginOptions = {
  allWebComponents: Record<string, string>;
  fileID: string;
  path: string;
};

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const JSX_NAME = new Set(["jsx", "jsxDEV", "jsxs"]);
const WEB_COMPONENT_REGEX = new RegExp(".*/web-components/.*");
const FN_EXPRESSIONS = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
]);
const FN_DECLARATIONS = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
]);

// TODO: Remove this workaround when this issue will be fixed:
// https://github.com/oven-sh/bun/issues/7499
export const workaroundText = `
const Fragment = props => props.children;

function jsxDEV(type, props){ return { type, props }};
function jsx(type, props){ return { type, props }};
function jsxs(type, props){ return { type, props }};

Fragment.__isFragment = true;
`;

export default function serverComponentPlugin(
  code: string,
  { allWebComponents, fileID, path }: ServerComponentPluginOptions,
) {
  const { IS_PRODUCTION, CONFIG } = getConstants();
  const ast = parseCodeToAST(code);
  const isServerOutput = CONFIG.output === "server";
  const analyzeAction = isServerOutput || !IS_PRODUCTION;
  const isWebComponent = WEB_COMPONENT_REGEX.test(path);
  const detectedWebComponents: Record<string, string> = {};
  const usedWebComponents = new Map<string, string>();
  const declarations = new Map<string, any>();
  const imports = new Set<string>();
  let actionIdCount = 1;
  let count = 1;
  let hasActions = false;

  /**
   * The first traversal is to locate all variable declarations and store
   * them in a Map along with the identifier name, along with the value.
   *
   * This data will be useful in the second traversal, when using props
   *  in the component with the spreadOperator, we will have to look
   * (as long as they are declared in the same file), if they have events
   * inside and in this way we will be able to register these actions.
   */
  function registerDeclarationsAndImports(this: any, key: string, value: any) {
    if (value?.type === "VariableDeclarator" && value?.init) {
      declarations.set(value.id.name, value.init);
    } else if (
      value?.type === "AssignmentExpression" &&
      value?.left?.type === "Identifier"
    ) {
      declarations.set(value.left.name, value.right);
    } else if (value?.type === "FunctionDeclaration") {
      declarations.set(value.id.name, value);
    }

    // Register imports
    if (value?.type === "ImportDeclaration") {
      for (let specifier of value.specifiers) {
        imports.add(specifier.local.name);
      }
    }

    return value;
  }

  /**
   * The second traversal is useful to add the data-action field with 2 goals:
   *
   * - Client (runtime): To let the RPC know that there is a server action
   *   in the HTML.
   * - Build time: After this initial compilation, an extra compilation is done
   *   to generate the action files, where they start from the entrypoints
   *   (pages) with all the code there. This is necessary for the RPC server
   *   to know which file to call to execute the action.
   */
  function traverseB2A(this: any, key: string, value: any) {
    const isJSX =
      value?.type === "CallExpression" && JSX_NAME.has(value?.callee?.name);
    const isActionsFlag = isServerOutput && value?._hasActions;

    // Register declarations and imports again to update the _hasActions flag
    // inside the declarations.
    // This will be useful only if the declaration are upper in the tree. Otherwise,
    // it will be updated in the next iteration, after the traversal.
    registerDeclarationsAndImports.call(this, key, value);

    // Mark that the identifier has actions after using declaration with actions
    if (value?.type === "Identifier" && declarations.has(value.name)) {
      const declaration = declarations.get(value.name);
      if (declaration?._hasActions) {
        value._hasActions = true;
        value._actionPropagation = true;
      }
    }

    // JSX components should not propagate the _hasActions flag, each component
    // should have its own flag.
    if (isJSX && value?._actionPropagation) delete value._hasActions;

    if (
      isActionsFlag &&
      value?.type === "VariableDeclaration" &&
      Array.isArray(this)
    ) {
      for (let declaration of value.declarations) {
        if (
          declaration._hasActions &&
          FN_EXPRESSIONS.has(declaration.init?.type)
        ) {
          declaration = markActionsFlag({
            value,
            declaration,
            parent: this,
            declarations,
            imports,
          });
        }
      }
      return value;
    }

    if (isActionsFlag && FN_DECLARATIONS.has(value?.declaration?.type)) {
      return markActionsFlag({
        value,
        declaration: value.declaration,
        parent: this,
        declarations,
        imports,
      });
    }

    // Register each JSX action id
    if (analyzeAction && isJSX && !isWebComponent) {
      const actionProperties = [];
      const properties = value.arguments[1]?.properties ?? [];
      const spreadsIdentifiers = [];

      for (let attributeAst of properties) {
        const isAction = attributeAst?.key?.name?.startsWith("on");

        // In case it is a SpreadElement, we have to note that we want to
        // verify later after looking at all the props the content of each
        // identifier if it has actions to also add them. They will only be
        // registered as long as they are defined in the same document.
        //
        // There are other possible cases:
        //
        // 1. The spread comes from the props of the component, then it will
        //    already have the attribute data-action in the prop and it will be
        //    added together with.
        // 2. The spread comes from another file with an import. We believe
        //    that this is a remote case. For now it is not supported.
        //
        if (isServerOutput && attributeAst?.type === "SpreadElement") {
          const identifier = attributeAst.argument?.name;

          if (identifier) {
            spreadsIdentifiers.push(identifier);
            continue;
          }

          // {...foo.bar.baz} or {...foo.bar.baz()} case:
          JSON.stringify(attributeAst, (k, v) => {
            const innerIdentifier = v?.object?.name ?? v?.callee?.name;
            if (innerIdentifier) {
              spreadsIdentifiers.push(innerIdentifier);
              return null;
            }
            return v;
          });
        }

        if (isAction) {
          value._hasActions = hasActions = true;
        }

        if (isAction && isServerOutput) {
          actionProperties.push({
            type: "Property",
            key: {
              type: "Literal",
              value: `data-action-${attributeAst?.key?.name?.toLowerCase()}`,
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

      // If there are spread elements, we have to look at each one to see if
      // they have actions and add them.
      for (let identifierName of spreadsIdentifiers) {
        const declaration = declarations.get(identifierName);
        let declarationHasActions = false;

        if (!declaration) continue;

        JSON.stringify(declaration, (k, v) => {
          if (
            v?.type === "Property" &&
            v?.key?.name?.startsWith("on") &&
            isUpperCaseChar(v?.key?.name[2])
          ) {
            const eventName = v.key.name;

            declarationHasActions = hasActions = true;
            actionProperties.push({
              type: "Property",
              key: {
                type: "Literal",
                value: `data-action-${eventName.toLowerCase()}`,
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
          return v;
        });

        if (declarationHasActions) value._hasActions = true;
      }

      if (actionProperties.length) {
        const dataActionProperty = {
          type: "Property",
          key: {
            type: "Literal",
            value: "data-action",
          },
          value: {
            type: "Literal",
            value: true,
          },
          kind: "init",
          computed: false,
          method: false,
          shorthand: false,
        };

        value.arguments[1].properties = [
          ...properties,
          ...actionProperties,
          dataActionProperty,
        ];
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

    // Pass this value to the parent until we arrive at the root component
    if (value?._hasActions) this._hasActions = true;
    if (value?._actionPropagation) this._actionPropagation = true;

    return value;
  }

  let modifiedAst = JSON.parse(
    JSON.stringify(ast, registerDeclarationsAndImports),
    traverseB2A,
  );

  if (!isServerOutput && hasActions) {
    logWarning([
      `Actions are not supported with the "output": "${CONFIG.output}" option.`,
      "",
      `The warn arises in: ${path}`,
      "",
      "This limitation is due to the requirement of a server infrastructure for the proper functioning",
      "of server actions.",
      "",
      'To resolve this, ensure that the "output" option is set to "server" when using server actions.',
      "",
      "Feel free to reach out if you have any further questions or encounter challenges during this process.",
      "",
      "Documentation: https://brisa.build/building-your-application/data-fetching/server-actions#server-actions",
    ]);
    hasActions = false;
  } else if (hasActions) {
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
    dependencies: getDependenciesList(modifiedAst, path),
  };
}

function markActionsFlag({
  value,
  declaration,
  parent,
  declarations,
  imports,
}: any) {
  // Stop the propagation of the _hasActions property to the parent
  value._hasActions = false;

  if (declaration?.id) {
    markComponentHasActions(declaration?.id?.name, parent);
    return value;
  }

  // In case it is not the name of the function, we have to create a new one
  let count = 1;
  let name = "Component";

  while (declarations.has(name) || imports.has(name)) {
    name = `Component${count++}`;
  }

  markComponentHasActions(name, parent);

  if (value?.type === "ExportDefaultDeclaration") {
    parent.push({
      type: "ExportDefaultDeclaration",
      declaration: {
        type: "Identifier",
        name,
      },
    });
  }

  return {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        init: declaration,
        id: {
          type: "Identifier",
          name,
        },
      },
    ],
    kind: "const",
  };
}

function isUpperCaseChar(char: string) {
  const code = char.charCodeAt(0);
  return code >= 65 && code <= 90;
}

function markComponentHasActions(componentName: string, parent: any) {
  parent.push({
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      left: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: componentName,
        },
        computed: false,
        property: {
          type: "Identifier",
          name: "_hasActions",
        },
      },
      operator: "=",
      right: {
        type: "Literal",
        value: true,
      },
    },
  });
}
