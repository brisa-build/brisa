import { describe, expect, it } from "bun:test";
import defineBrisaElement from ".";
import getWebComponentAst from "../get-web-component-ast";
import AST from "../../ast";
import getPropsNames from "../get-props-names";
import { ESTree } from "meriyah";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');
const output = (ast: any) =>
  toInline(generateCodeFromAST(ast as unknown as ESTree.Program));

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("defineBrisaElement", () => {
      it("should wrap the web-component with brisaElement and return the import declaration", () => {
        const code = `
          export default function MyComponent({ exampleProp }) {
            return ['div', {}, () => exampleProp.value]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration,
        ];
        const propNames = getPropsNames(component);
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames,
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement} from "brisa/client";',
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent({exampleProp}, {h}) {
              return h("div", {}, () => exampleProp.value);
          }, ["exampleProp"])
        `),
        );
      });
    });
  });
});
