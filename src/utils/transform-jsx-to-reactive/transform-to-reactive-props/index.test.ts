import { describe, expect, it } from "bun:test";
import transformToReactiveProps from ".";
import { ESTree } from "meriyah";
import AST from "../../ast";

const { generateCodeFromAST } = AST();

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-to-reactive-props", () => {
      it("should wrap the rendered props to signal and add the value property", () => {
        const componentParams: ESTree.Parameter[] = [
          {
            type: "Identifier",
            name: "props",
          },
        ];
        const propsNames = ["foo"];
        const children = {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "props",
          },
          property: {
            type: "Identifier",
            name: "foo",
          },
          computed: false,
        };
        const output = transformToReactiveProps(children, {
          componentParams,
          propsNames,
        });
        expect(output).toEqual({
          type: "ArrowFunctionExpression",
          expression: true,
          params: [],
          body: {
            type: "MemberExpression",
            object: {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "props",
              },
              property: {
                type: "Identifier",
                name: "foo",
              },
              computed: false,
            },
            property: {
              type: "Identifier",
              name: "value",
            },
            computed: false,
          },
        });
        expect(generateCodeFromAST(output)).toBe("() => props.foo.value");
      });

      it("should not wrap to an arrow function if the attribute applyArrowFn is false", () => {
        const componentParams: ESTree.Parameter[] = [
          {
            type: "Identifier",
            name: "props",
          },
        ];
        const propsNames = ["foo"];
        const children = {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "props",
          },
          property: {
            type: "Identifier",
            name: "foo",
          },
          computed: false,
        };
        const output = transformToReactiveProps(children, {
          componentParams,
          propsNames,
          applyArrowFn: false,
        });
        expect(output).toEqual({
          type: "MemberExpression",
          object: {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "props",
            },
            property: {
              type: "Identifier",
              name: "foo",
            },
            computed: false,
          },
          property: {
            type: "Identifier",
            name: "value",
          },
          computed: false,
        });
        expect(generateCodeFromAST(output)).toBe("props.foo.value");
      });
    });
  });
});
