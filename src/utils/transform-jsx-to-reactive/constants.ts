import { ESTree } from "meriyah";

export const NO_REACTIVE_CHILDREN_EXPRESSION = new Set([
  "Literal",
  "ArrayExpression",
]);
export const JSX_NAME = new Set(["jsx", "jsxDEV"]);
export const ALTERNATIVE_FOLDER_REGEX = new RegExp(".*/web-components/@.*?/");
export const WEB_COMPONENT_REGEX = new RegExp(".*/web-components/.*");
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
