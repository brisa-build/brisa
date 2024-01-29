import { ESTree } from "meriyah";

export const NO_REACTIVE_CHILDREN_EXPRESSION = new Set([
  "Literal",
  "ArrayExpression",
]);
export const ALTERNATIVE_PREFIX = "_";
export const NATIVE_FOLDER = `${ALTERNATIVE_PREFIX}native`;
export const SUPPORTED_DEFAULT_PROPS_OPERATORS = new Set(["??", "||"]);
export const JSX_NAME = new Set(["jsx", "jsxDEV"]);
export const WEB_COMPONENT_ALTERNATIVE_REGEX = new RegExp(
  `web-components.*(/|\)${ALTERNATIVE_PREFIX}`,
);
export const BRISA_IMPORT = {
  type: "ImportDeclaration",
  specifiers: [
    {
      type: "ImportSpecifier",
      imported: {
        type: "Identifier",
        name: "brisaElement",
      },
      local: {
        type: "Identifier",
        name: "brisaElement",
      },
    },
    {
      type: "ImportSpecifier",
      imported: {
        type: "Identifier",
        name: "_on",
      },
      local: {
        type: "Identifier",
        name: "_on",
      },
    },
    {
      type: "ImportSpecifier",
      imported: {
        type: "Identifier",
        name: "_off",
      },
      local: {
        type: "Identifier",
        name: "_off",
      },
    },
  ],
  source: {
    type: "Literal",
    value: "brisa/client",
  },
} as ESTree.ImportDeclaration;

export const TRANSLATE_CORE_IMPORT = {
  type: "ImportDeclaration",
  specifiers: [
    {
      type: "ImportSpecifier",
      imported: {
        type: "Identifier",
        name: "translateCore",
      },
      local: {
        type: "Identifier",
        name: "translateCore",
      },
    },
  ],
  source: {
    type: "Literal",
    value: "brisa",
  },
} as ESTree.ImportDeclaration;
