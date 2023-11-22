import { describe, expect, it } from "bun:test";
import { ESTree } from "meriyah";
import defineBrisaElement from ".";
import * as BRISA_CLIENT from "../../../core/client";
import AST from "../../ast";
import getPropsNames from "../get-props-names";
import getWebComponentAst from "../get-web-component-ast";
import transformToReactiveArrays from "../transform-to-reactive-arrays";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');
const output = (ast: any) =>
  toInline(generateCodeFromAST(ast as unknown as ESTree.Program));

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
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent({exampleProp}, {h}) {
              return h("div", {}, () => exampleProp.value);
          }, ["exampleProp"])
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
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]);
          }, ["foo", "bar"])
        `)
        );
      });

      it("should not declare the h argument if it is already declared", () => {
        const code = `
          export default function MyComponent(props, { h }) {
            return [null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]]
          }
        `;
        const ast = parseCodeToAST(code);
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];
        const [propNames] = getPropsNames(component);
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]);
          }, ["foo", "bar"])
        `)
        );
      });

      it("should declare the effect and h argument", () => {
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
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames,
          "h",
          "effect"
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent(props, {h, effect}) {
              return h(null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]);
          }, ["foo", "bar"])
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
        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames,
          "h",
          "effect"
        );
        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );
        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function MyComponent(props, {effect, h}) {
              return h(null, {}, [["div", {}, () => props.foo.value], ["span", {}, () => props.bar.value]]);
          }, ["foo", "bar"])
        `)
        );
      });
      it("should wrap with a fragment hyperscript when the return is an array different than a reactive array", () => {
        const code = `export default function Test() {
          return ['Hello', ' ', 'World'];
        }`;

        const ast = transformToReactiveArrays(parseCodeToAST(code));
        const [component] = getWebComponentAst(ast) as [
          ESTree.FunctionDeclaration
        ];

        const [propNames] = getPropsNames(component);

        const [importDeclaration, wrappedComponent] = defineBrisaElement(
          component,
          propNames
        );

        expect(output(importDeclaration)).toBe(
          'import {brisaElement, _on, _off} from "brisa/client";'
        );

        expect(output(wrappedComponent)).toBe(
          toInline(`
          brisaElement(function Test({}, {h}) {
              return h(null, {}, ["Hello", " ", "World"]);
          })
        `)
        );
      });
    });
  });
});
