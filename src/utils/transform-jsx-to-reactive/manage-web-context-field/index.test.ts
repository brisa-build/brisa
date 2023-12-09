import { describe, expect, it } from "bun:test";
import manageWebContextField from ".";

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("manage-web-context-field", () => {
      it("should not add the 'h' variable if it already exists", () => {
        const componentAST = {
          type: "FunctionExpression",
          params: [
            {
              type: "ObjectPattern",
              properties: [],
            },
            {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: {
                    type: "Identifier",
                    name: "h",
                  },
                  value: {
                    type: "Identifier",
                    name: "h",
                  },
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          body: {
            type: "BlockStatement",
            body: [],
          },
        } as any;

        manageWebContextField(componentAST, "h", "h");

        const expected = {
          type: "FunctionExpression",
          params: [
            {
              type: "ObjectPattern",
              properties: [],
            },
            {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: {
                    type: "Identifier",
                    name: "h",
                  },
                  value: {
                    type: "Identifier",
                    name: "h",
                  },
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          body: {
            type: "BlockStatement",
            body: [],
          },
        };

        expect(componentAST).toEqual(expected);
      });

      it("should add the 'effect' variable", () => {
        const componentAST = {
          type: "FunctionExpression",
          params: [],
          body: {
            type: "BlockStatement",
            body: [],
          },
        } as any;

        manageWebContextField(componentAST, "effect", "effect");

        const expected = {
          type: "FunctionExpression",
          params: [
            {
              type: "ObjectPattern",
              properties: [],
            },
            {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: {
                    type: "Identifier",
                    name: "effect",
                  },
                  value: {
                    type: "Identifier",
                    name: "effect",
                  },
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          body: {
            type: "BlockStatement",
            body: [],
          },
        };

        expect(componentAST).toEqual(expected);
      });

      it("should not add the 'effect' variable if it already exists", () => {
        const componentAST = {
          type: "FunctionExpression",
          params: [
            {
              type: "ObjectPattern",
              properties: [],
            },
            {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: {
                    type: "Identifier",
                    name: "effect",
                  },
                  value: {
                    type: "Identifier",
                    name: "effect",
                  },
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          body: {
            type: "BlockStatement",
            body: [],
          },
        } as any;

        manageWebContextField(componentAST, "effect", "effect");

        const expected = {
          type: "FunctionExpression",
          params: [
            {
              type: "ObjectPattern",
              properties: [],
            },
            {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: {
                    type: "Identifier",
                    name: "effect",
                  },
                  value: {
                    type: "Identifier",
                    name: "effect",
                  },
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          body: {
            type: "BlockStatement",
            body: [],
          },
        };

        expect(componentAST).toEqual(expected);
      });
    });
  });
});
