import { describe, it, expect } from "bun:test";
import getContentReturns from ".";
import { ESTree } from "meriyah";

describe("utils", () => {
  describe("ast", () => {
    describe("get-content-returns", () => {
      it("should return all return statements in the given AST", () => {
        const returnStatement: ESTree.ReturnStatement = {
          type: "ReturnStatement",
          argument: { type: "Literal", value: "hello" },
        };

        const statements: ESTree.Statement[] = [
          {
            type: "FunctionDeclaration",
            id: { type: "Identifier", name: "Test" },
            params: [],
            body: {
              type: "BlockStatement",
              body: [returnStatement],
            },
          } as unknown as ESTree.Statement,
        ];

        const output = getContentReturns(statements);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([returnStatement]),
        );
      });

      it("should return all return statements in the given AST with nested structures", () => {
        const returnStatement: ESTree.ReturnStatement = {
          type: "ReturnStatement",
          argument: { type: "Literal", value: "hello" },
        };

        const statements: ESTree.Statement[] = [
          {
            type: "FunctionDeclaration",
            id: { type: "Identifier", name: "Test" },
            params: [],
            body: {
              type: "BlockStatement",
              body: [
                returnStatement,
                {
                  type: "FunctionDeclaration",
                  id: { type: "Identifier", name: "Test" },
                  params: [],
                  body: {
                    type: "BlockStatement",
                    body: [returnStatement],
                  },
                },
              ],
            },
          } as unknown as ESTree.Statement,
        ];

        const output = getContentReturns(statements);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([returnStatement, returnStatement]),
        );
      });
    });
  });
});
