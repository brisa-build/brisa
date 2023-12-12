import { describe, expect, it } from "bun:test";
import { ESTree } from "meriyah";
import defineBrisaElement from ".";
import * as BRISA_CLIENT from "../../../core/client";
import { normalizeQuotes } from "../../../helpers";
import AST from "../../ast";
import getPropsNames from "../get-props-names";
import getWebComponentAst from "../get-web-component-ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const output = (ast: any) =>
  normalizeQuotes(generateCodeFromAST(ast as unknown as ESTree.Program));

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("defineBrisaElement", () => {
      it("should exist all the import declarations from brisa/client", () => {
        const code = `
          export default function MyComponent({ exampleProp }) {
            return ['div', {}, () => exampleProp.value]
          }
        `;

        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration] = defineBrisaElement(component, propNames);

        (importDeclaration as ESTree.ImportDeclaration).specifiers.forEach(
          (specifier) => {
            expect((BRISA_CLIENT as any)[specifier.local.name]).toBeDefined();
          }
        );
      });
      it("should wrap the web-component with brisaElement and return the import declaration", () => {
        const code = `
          export default function MyComponent({ exampleProp }) {
            return ['div', {}, () => exampleProp.value]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration, brisaElement, wrappedComponent] =
          defineBrisaElement(component, propNames);
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(brisaElement)).toBe(
          `brisaElement(MyComponent, ["exampleProp"])`
        );
        expect(output(wrappedComponent)).toBe(
          normalizeQuotes(`
          function MyComponent({exampleProp}) {
            return ["div", {}, () => exampleProp.value];
          }
        `)
        );
      });

      it("should work with fragments and props", () => {
        const code = `
          export default function MyComponent(props) {
            return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration, brisaElement, wrappedComponent] =
          defineBrisaElement(component, propNames);
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(brisaElement)).toBe(
          `brisaElement(MyComponent, ["foo", "bar"])`
        );
        expect(output(wrappedComponent)).toBe(
          normalizeQuotes(`
          function MyComponent(props) {
              return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]];
          }
        `)
        );
      });

      it("should declare the effect", () => {
        const code = `
          export default function MyComponent(props) {
            return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration, brisaElement, wrappedComponent] =
          defineBrisaElement(component, propNames, new Set(), true);
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(brisaElement)).toBe(
          `brisaElement(MyComponent, ["foo", "bar"])`
        );
        expect(output(wrappedComponent)).toBe(
          normalizeQuotes(`
          function MyComponent(props, {effect}) {
              return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]];
          }
        `)
        );
      });

      it("should not declare the effect argument if it is already declared", () => {
        const code = `
          export default function MyComponent(props, { effect }) {
            return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration, brisaElement, wrappedComponent] =
          defineBrisaElement(component, propNames, new Set(), true);
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(brisaElement)).toBe(
          `brisaElement(MyComponent, ["foo", "bar"])`
        );
        expect(output(wrappedComponent)).toBe(
          normalizeQuotes(`
          function MyComponent(props, {effect}) {
              return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]];
          }
        `)
        );
      });
    });
  });
});
