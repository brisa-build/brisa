import { type ESTree } from "meriyah";
import { JavaScriptLoader } from "bun";

import getConstants from "../../constants";
import AST from "../ast";

export default function fromNative({
  name,
  code,
  loader,
}: {
  name: string;
  code: string;
  loader: JavaScriptLoader;
}) {
  const { IS_PRODUCTION } = getConstants();
  const ASTUtil = AST(loader);
  const ast = ASTUtil.parseCodeToAST(code);
  const exportDefaultIndex = ast.body.findIndex(
    (node) => node.type === "ExportDefaultDeclaration",
  );
  const exportDefault = ast.body[exportDefaultIndex] as
    | ESTree.ExportDefaultDeclaration
    | undefined;

  if (!exportDefault) {
    if (!IS_PRODUCTION) {
      console.warn(`The web component ${name} doesn't have a default export`);
    }
    return { contents: code, loader };
  }

  if (exportDefault.declaration.type !== "ClassDeclaration") {
    if (!IS_PRODUCTION) {
      console.warn(`The web component ${name} default export is not a class`);
    }
    return { contents: code, loader };
  }

  ast.body[exportDefaultIndex] = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "customElements",
        },
        computed: false,
        property: {
          type: "Identifier",
          name: "define",
        },
      },
      arguments: [
        {
          type: "Literal",
          value: name,
        },
        exportDefault.declaration,
      ],
    },
  };

  return { contents: ASTUtil.generateCodeFromAST(ast), loader };
}
