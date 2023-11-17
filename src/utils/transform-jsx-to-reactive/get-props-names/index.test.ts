import { describe, expect, it } from "bun:test";
import getPropsNames from ".";
import AST from "../../ast";
import getWebComponentAst from "../get-web-component-ast";
import { ESTree } from "meriyah";

const { parseCodeToAST } = AST("tsx");
const inputCode = (code: string) => getWebComponentAst(parseCodeToAST(code));

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("getPropsNames", () => {
      it("should return an empty array if there is no props", () => {
        const [input] = inputCode(`
          export default function MyComponent() {
            return <div>foo</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected: string[] = [];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual([]);
        expect(defaultProps).toEqual({});
      });
      it("should return the props names if the props are an object", () => {
        const [input] = inputCode(`
          export default function MyComponent({ foo, bar }) {
            return <div>foo</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["foo", "bar"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });
      it("should return the props names if the props are an identifier", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            return <div>{props.name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it("should return props names if the props are an identifier an are used in a conditional", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log('Hello test');
            return <div>test</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });
      it("should return props names if the props are an identifier an are used in a function", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            console.log(props.name);
            return <div>test</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });
      it("should return the unique props names if the props are an identifier an are used in different places", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log(props.name);
            return <div>{props.name}</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });
      it("should return props names if the props are destructured", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name } = props;
            return <div>{name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it("should return props names used with desctructuring and spread", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            return <div>{name}</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });

      it("should return props names used different tecniques", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            console.log(props.dog);
            return <div>{props.cat}</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog", "cat"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });

      it("should return propms names using variable declaration", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const renamedName = props.name;
            return <div>{renamedName}</div>
          }
        `);
        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(["renamedName", "name"]);
        expect(defaultProps).toEqual({});
      });

      it("should return props names without influence of other variables outside the component", () => {
        const [input] = inputCode(`
          function AnotherComponent(props) {
            return props.anotherComponentProp;
          }
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            console.log(props.dog);
            return <div>{props.cat}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog", "cat"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });

      it("should not return props names named children as object statement", () => {
        const [input] = inputCode(`
          function AnotherComponent(props) {
            return props.anotherComponentProp;
          }
          export default function MyComponent({ children, ...rest }) {
            const { name } = rest;
            console.log(rest.dog);
            return <div>{children}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });

      it("should not return props names named children", () => {
        const [input] = inputCode(`
          function AnotherComponent(props) {
            return props.anotherComponentProp;
          }
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            console.log(props.dog);
            return <div>{props.children}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({});
      });

      it("should return the default props values in assignment pattern", () => {
        const [input] = inputCode(`
          export default function MyComponent({ name = 'foo' }) {
            return <div>{name}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];
        const expectedDefaultProps: ESTree.Literal = {
          type: "Literal",
          value: "foo",
        };

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
        expect(defaultProps).toEqual({ name: expectedDefaultProps });
      });

      it("should not return the renamed props values as default props", () => {
        const [input] = inputCode(`
          export default function MyComponent({ name: renamedName = 'foo' }) {
            return <div>{renamedName}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];
        const expectedRenamed = ["renamedName"];
        const expectedDefaultProps: ESTree.Literal = {
          type: "Literal",
          value: "foo",
        };

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expectedRenamed);
        expect(defaultProps).toEqual({ renamedName: expectedDefaultProps });
      });

      it('should return the renamed name when a new variable is declared from a prop', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name }) {
            const renamedName = name;
            return <div>{renamedName}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];
        const expectedRenamed = ["name", "renamedName"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expectedRenamed);
        expect(defaultProps).toEqual({});
      });

      it('should return the renamed name when a new variable is declared from a prop expression', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name }) {
            const renamedName = name ?? 'foo';
            return <div>{renamedName}</div>
          }
        `);

        const [propNames, renamedOutput, defaultProps] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];
        const expectedRenamed = ["name", "renamedName"];

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expectedRenamed);
        expect(defaultProps).toEqual({});
      });
    });
  });
});
