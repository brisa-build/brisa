import { describe, it, expect } from "bun:test";
import getVarDeclarationIdentifiers from ".";
import type { ESTree } from "meriyah";

describe("utils", () => {
  describe("ast", () => {
    describe("get-var-declaration-identifiers", () => {
      it("should not return any identifier if the given AST is not a VariableDeclaration", () => {
        const node = {
          type: "CallExpression",
          callee: { type: "Identifier", name: "a" },
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        expect(output).toEqual(new Map<string, Set<string>>());
      });

      it("should return all identifiers in the given AST", () => {
        const node = {
          type: "VariableDeclaration",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "a" },
              init: { type: "Literal", value: 1 },
            },
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "b" },
              init: { type: "Literal", value: 2 },
            },
          ],
          kind: "const",
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ["a", new Set()],
          ["b", new Set()],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it("should return identifiers inside an ObjectPattern", () => {
        const node = {
          type: "VariableDeclaration",
          declarations: [
            {
              type: "VariableDeclarator",
              id: {
                type: "ObjectPattern",
                properties: [
                  {
                    type: "Property",
                    key: { type: "Identifier", name: "a" },
                    value: { type: "Identifier", name: "b" },
                  },
                  {
                    type: "Property",
                    key: { type: "Identifier", name: "c" },
                    value: { type: "Identifier", name: "d" },
                  },
                ],
              },
              init: { type: "Literal", value: 1 },
            },
          ],
          kind: "const",
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ["a", new Set(["b"])],
          ["c", new Set(["d"])],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it("should return all identifiers in the given AST with nested structures", () => {
        const node = {
          type: "VariableDeclaration",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "a" },
              init: { type: "Literal", value: 1 },
            },
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "b" },
              init: { type: "Literal", value: 2 },
            },
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "c" },
              init: {
                type: "BinaryExpression",
                left: { type: "Identifier", name: "a" },
                operator: "+",
                right: { type: "Identifier", name: "b" },
              },
            },
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "d" },
              init: {
                type: "ArrowFunctionExpression",
                params: [],
                body: {
                  type: "BlockStatement",
                  body: [
                    {
                      type: "VariableDeclaration",
                      declarations: [
                        {
                          type: "VariableDeclarator",
                          id: { type: "Identifier", name: "e" },
                          init: { type: "Literal", value: 3 },
                        },
                        {
                          type: "VariableDeclarator",
                          id: { type: "Identifier", name: "f" },
                          init: { type: "Literal", value: 4 },
                        },
                        {
                          type: "VariableDeclarator",
                          id: { type: "Identifier", name: "g" },
                          init: {
                            type: "BinaryExpression",
                            left: { type: "Identifier", name: "e" },
                            operator: "+",
                            right: { type: "Identifier", name: "f" },
                          },
                        },
                      ],
                      kind: "const",
                    },
                  ],
                },
              },
            },
          ],
          kind: "const",
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ["a", new Set()],
          ["b", new Set()],
          ["c", new Set(["a", "b"])],
          ["d", new Set(["e", "f", "g"])],
          ["e", new Set()],
          ["f", new Set()],
          ["g", new Set(["e", "f"])],
        ]);
        expect(output).toEqual(expectedMap);
      });
    });
  });
});
