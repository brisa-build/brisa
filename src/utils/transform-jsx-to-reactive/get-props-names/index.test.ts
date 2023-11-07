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
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected: string[] = [];

        expect(output).toEqual(expected);
      });
      it("should return the props names if the props are an object", () => {
        const [input] = inputCode(`
          export default function MyComponent({ foo, bar }) {
            return <div>foo</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["foo", "bar"];

        expect(output).toEqual(expected);
      });
      it("should return the props names if the props are an identifier", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            return <div>{props.name}</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });
      it("should return props names if the props are an identifier an are used in a conditional", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log('Hello test');
            return <div>test</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });
      it("should return props names if the props are an identifier an are used in a function", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            console.log(props.name);
            return <div>test</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });
      it("should return the unique props names if the props are an identifier an are used in different places", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log(props.name);
            return <div>{props.name}</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });
      it("should return props names if the props are destructured", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name } = props;
            return <div>{name}</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });

      it("should return props names used with desctructuring and spread", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            return <div>{name}</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name"];

        expect(output).toEqual(expected);
      });

      it("should return props names used different tecniques", () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            console.log(props.dog);
            return <div>{props.cat}</div>
          }
        `);
        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog", "cat"];

        expect(output).toEqual(expected);
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

        const output = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = ["name", "dog", "cat"];

        expect(output).toEqual(expected);
      });
    });
  });
});
