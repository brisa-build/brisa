import { describe, expect, it } from 'bun:test';
import mapComponentStatics from '.';
import { normalizeQuotes } from '@/helpers';
import AST from '@/utils/ast';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');
const toOutput = (ast: any) => normalizeQuotes(generateCodeFromAST(ast));

describe('utils', () => {
  describe('client-build-plugin', () => {
    describe('map-component-statics', () => {
      it('should be possible to map statics using arrow functions', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          Component.error = () => <div>Error</div>
          Component.suspense = () => <div>Suspense</div>
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'Literal',
              value: name,
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          Component.error = () => "error";
          Component.suspense = () => "suspense";
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using functions', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          Component.error = function () {return 'Error'}
          Component.suspense = function () {return 'Suspense'}
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Literal',
                    value: name,
                  },
                },
              ],
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          Component.error = function () {return "error";};
          Component.suspense = function () {return "suspense";};
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using functions identifiers', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          function Error() {return 'Error'}
          function Suspense() {return 'Suspense'}
          Component.error = Error
          Component.suspense = Suspense
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Literal',
                    value: name,
                  },
                },
              ],
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          let Error = function () {return "error";}, Suspense = function () {return "suspense";};
          export default function Component() {return "Hello";}
          Component.error = Error;
          Component.suspense = Suspense;
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using arrow functions identifiers', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          const Error = () => 'Error'
          const Suspense = () => 'Suspense'
          Component.error = Error
          Component.suspense = Suspense
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'Literal',
              value: name,
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          const Error = () => "error";
          const Suspense = () => "suspense";
          Component.error = Error;
          Component.suspense = Suspense;
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using arrow functions identifiers via Object.assign', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          const Error = () => 'Error'
          const Suspense = () => 'Suspense'
          Object.assign(Component, { error: Error, suspense: Suspense })
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'Literal',
              value: name,
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          const Error = () => "error";
          const Suspense = () => "suspense";
          Object.assign(Component, {error: Error,suspense: Suspense});
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using functions identifiers via Object.assign', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          function Error() {return 'Error'}
          function Suspense() {return 'Suspense'}
          Object.assign(Component, { error: Error, suspense: Suspense })
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Literal',
                    value: name,
                  },
                },
              ],
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          let Error = function () {return "error";}, Suspense = function () {return "suspense";};
          export default function Component() {return "Hello";}
          Object.assign(Component, {error: Error,suspense: Suspense});
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using functions via Object.assign', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          Object.assign(Component, { error: function () {return 'Error'}, suspense: function () {return 'Suspense'} })
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Literal',
                    value: name,
                  },
                },
              ],
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          Object.assign(Component, {error: function () {return "error";},suspense: function () {return "suspense";}});
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using arrow functions via Object.assign', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          Object.assign(Component, { error: () => 'Error', suspense: () => 'Suspense' })
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'Literal',
              value: name,
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          Object.assign(Component, {error: () => "error",suspense: () => "suspense"});
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to map statics using methods via Object.assign', () => {
        const ast = parseCodeToAST(`
          export default function Component() { return 'Hello' }
          Object.assign(Component, { error() {return 'Error'}, suspense() {return 'Suspense'} })
        `);

        const output = toOutput(
          mapComponentStatics(ast, 'Component', (value: any, name) => {
            value.body = {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ReturnStatement',
                  argument: {
                    type: 'Literal',
                    value: name,
                  },
                },
              ],
            };
            return value;
          }),
        );

        const expected = normalizeQuotes(`
          export default function Component() {return "Hello";}
          Object.assign(Component, {error() {return "error";},suspense() {return "suspense";}});
        `);

        expect(output).toBe(expected);
      });
    });
  });
});
