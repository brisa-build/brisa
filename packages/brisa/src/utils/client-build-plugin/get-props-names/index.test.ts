import { describe, expect, it } from 'bun:test';
import type { ESTree } from 'meriyah';
import getPropsNames, { getPropNamesFromExport } from '.';
import AST from '@/utils/ast';
import getWebComponentAst from '@/utils/client-build-plugin/get-web-component-ast';

const { parseCodeToAST } = AST('tsx');
const inputCode = (code: string) => getWebComponentAst(parseCodeToAST(code));

describe('utils', () => {
  describe('client-build-plugin', () => {
    describe('getPropsNames', () => {
      it('should return an empty array if there is no props', () => {
        const [input] = inputCode(`
          export default function MyComponent() {
            return <div>foo</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );

        expect(propNames).toBeEmpty();
        expect(renamedOutput).toBeEmpty();
      });
      it('should return the props names if the props are an object', () => {
        const [input] = inputCode(`
          export default function MyComponent({ foo, bar }) {
            return <div>foo</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['foo', 'bar']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return the props names if the props are an identifier', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            return <div>{props.name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return the props names if the props are an identifier with default props', () => {
        const [input] = inputCode(`
          export default function MyComponent(props = { name: 'foo' }) {
            return <div>{props.name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return props names if the props are an identifier an are used in a conditional', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log('Hello test');
            return <div>test</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return props names if the props are an identifier an are used in a function', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            console.log(props.name);
            return <div>test</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return the unique props names if the props are an identifier an are used in different places', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            if(props.name) console.log(props.name);
            return <div>{props.name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });
      it('should return props names if the props are destructured', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name } = props;
            return <div>{name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return props names used with desctructuring and spread', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            return <div>{name}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return props names used different tecniques', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { name, ...rest } = props;
            console.log(props.dog);
            return <div>{props.cat}</div>
          }
        `);
        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name', 'dog', 'cat']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return props names without influence of other variables outside the component', () => {
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

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name', 'dog', 'cat']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should not return props names named children as object statement', () => {
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

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name', 'dog']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should not return props names named children', () => {
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

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name', 'dog']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return the default props values in assignment pattern', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name = 'foo' }) {
            return <div>{name}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return the renamed props if is renamed inside the arguments', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name: renamedName = 'foo' }) {
            return <div>{renamedName}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);
        const expectedRenamed = new Set(['renamedName']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expectedRenamed);
      });

      it('should NOT return the renamed name when lose the reactivity without a derived', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name }) {
            const notDerivedName = name;
            return <div>{notDerivedName}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should NOT return the renamed name when lose the reactivity without a derived from props object', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const notDerivedName = props.name;
            return <div>{notDerivedName}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should NOT return the renamed name when lose the reactivity without a derived from default props', () => {
        const [input] = inputCode(`
          export default function MyComponent({ name }) {
            const notDerivedName = name ?? 'foo';
            return <div>{notDerivedName}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['name']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return the prop name when a new rest variable is declared and used to consume props', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const { foo, ...rest } = props;
            console.log(foo);
            return <div>{rest.bar}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['foo', 'bar']);
        const expectedRenamed = new Set(['foo', 'bar']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expectedRenamed);
      });

      it('should extend the props defined via "export const props = []" to the props names', () => {
        const code = `
          export const props = ['foo', 'baz'];
          export default function MyComponent({ foo, bar }) {
            return <div>{foo} {bar}</div>
          }
        `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );
        const expected = new Set(['foo', 'bar', 'baz']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      // baz is not a renamed prop, stops reactivity to get this calculation
      it('should not return the renamed name using a logical expression that is not for default props using destructuring', () => {
        const [input] = inputCode(`
          export default function MyComponent({ foo, bar }) {
            const baz = foo && bar;
            return <div>{baz}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['foo', 'bar']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should not return the renamed name using a logical expression that is not for default props using "props"', () => {
        const [input] = inputCode(`
          export default function MyComponent(props) {
            const baz = props.foo && props.bar;
            return <div>{baz}</div>
          }
        `);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
        );
        const expected = new Set(['foo', 'bar']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should take "value" as prop name', () => {
        const code = `
        export default function Component(props, { state }) {
          const inputs = state(props.value ?? []);
          
          return (
            <>
              {inputs.value.map(input => (<div key={input}>{input}</div>))}
            </>
          )
        }
      `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [propNames, renamedOutput] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );
        const expected = new Set(['value']);

        expect(propNames).toEqual(expected);
        expect(renamedOutput).toEqual(expected);
      });

      it('should return as 3th argument the standalone props names from function params', () => {
        const code = `
          export default function Component({ foo, bar }) {
            return <div>{foo} {bar}</div>
          }
        `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [, , propNames] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );
        const expected = new Set(['foo', 'bar']);

        expect(propNames).toEqual(expected);
      });

      it('should return empty array as 3th argument if there are no standalone props names from function params', () => {
        const code = `
          export default function Component(props) {
            return <div>{props.foo} {props.bar}</div>
          }
        `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [, , propNames] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );

        expect(propNames).toBeEmpty();
      });

      it('should return array as 3th argument if there are one standalone props names inside fn body', () => {
        const code = `
          export default function Component(props) {
            const foo = props.foo;
            return <div>{props.foo} {props.bar}</div>
          }
        `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [, , propNames] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );
        const expected = new Set(['foo']);

        expect(propNames).toEqual(expected);
      });

      it('should 3th argument work with renamed props', () => {
        const code = `
          export default function Component({ foo, bar: renamedBar }) {
            return <div>{foo} {renamedBar}</div>
          }
        `;
        const ast = parseCodeToAST(code);
        const input = getWebComponentAst(ast)[0] as ESTree.FunctionDeclaration;
        const propsFromExport = getPropNamesFromExport(ast);

        const [, , propNames] = getPropsNames(
          input as unknown as ESTree.FunctionDeclaration,
          propsFromExport,
        );
        const expected = new Set(['foo', 'renamedBar']);

        expect(propNames).toEqual(expected);
      });
    });
  });
});
