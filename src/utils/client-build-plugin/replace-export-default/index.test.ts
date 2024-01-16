import { describe, expect, it } from "bun:test";
import replaceExportDefault from ".";
import { ESTree } from "meriyah";

describe("client-build-plugin", () => {
  describe("utils", () => {
    describe("replace-export-default", () => {
      it("should replace the default export of the AST to a variable name", () => {
        const ast = {
          type: "Program",
          body: [
            {
              type: "ExportDefaultDeclaration",
              declaration: {
                type: "FunctionDeclaration",
                id: {
                  type: "Identifier",
                  name: "Component",
                },
                params: [],
                body: {
                  type: "BlockStatement",
                  body: [],
                },
                generator: false,
                async: false,
              },
            },
          ],
          sourceType: "module",
        } as ESTree.Program;
        const expected = {
          type: "Program",
          body: [
            {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: "Component",
                  },
                  init: {
                    type: "FunctionDeclaration",
                    id: {
                      type: "Identifier",
                      name: "Component",
                    },
                    params: [],
                    body: {
                      type: "BlockStatement",
                      body: [],
                    },
                    generator: false,
                    async: false,
                  },
                },
              ],
            },
          ],
          sourceType: "module",
        } as unknown as ESTree.Program;

        const result = replaceExportDefault(ast, "Component");
        expect(result).toEqual(expected);
      });
    });
  });
});
