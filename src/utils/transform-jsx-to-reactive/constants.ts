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
  ],
  source: {
    type: "Literal",
    value: "brisa/client",
  },
} as ESTree.ImportDeclaration;
