import { normalizeQuotes } from '@/helpers';
import AST from '@/utils/ast';
import { describe, it, expect } from 'bun:test';
import { getPurgedBody } from '.';
import getActionsInfo from '@/utils/compile-actions/get-actions-info';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

function expectCodeToPurge(code: string, actionId = 'a1_1') {
  const ast = parseCodeToAST(code) as any;
  const actionInfo = getActionsInfo(ast).find((info) => info.actionId === actionId);

  if (ast.body[0].async) {
    ast.body[0].body = getPurgedBody(actionInfo!);
  } else {
    ast.body[0].declarations[0].init.body = getPurgedBody(actionInfo!);
  }

  return {
    toBe: (expectedCode: string) =>
      expect(normalizeQuotes(generateCodeFromAST(ast))).toBe(normalizeQuotes(expectedCode)),
  };
}

describe('utils', () => {
  describe('compile-actions -> purge-body', () => {
    it('should purge everything from the body when there are not action dependencies', () => {
      const codeToPurge = `
        function Test() {
          if (true) {
            console.log('true');
          } else {
            console.log('false');
          }
        
          return <div onClick={() => console.log('purge')} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = 'let Test = function () {};';
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge everything except a defined variable that an action uses when using if-else', () => {
      const codeToPurge = `
        function Test() {
          let foo = 'bar';
          if (true) {
            console.log('true');
          } else {
            console.log('false');
          }
        
          return <div onClick={() => console.log(foo)} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = 'let Test = function () {let foo = "bar";};';
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge everything except a defined variable that an action uses when using switch-case', () => {
      const codeToPurge = `
        function Test() {
          let foo = 'bar';
          switch (true) {
            case true:
              console.log('true');
              break;
            case false:
              return <div>hello</div>;
          }
        
          return <div onClick={() => console.log(foo)} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = 'let Test = function () {let foo = "bar";};';
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the return when the defined variable that an action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            foo = 'qux';
          }
        
          return <div onClick={() => console.log(foo)} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            foo = 'qux';
          }
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the returns when the defined variable that an action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            return foo
          }
        
          return <div onClick={() => console.log(foo)} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {}
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the return when the defined variable that an external variable action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            return foo
          }

          const onClick = () => console.log(foo);
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {}
        
        const onClick = () => console.log(foo);
      };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the return when the defined function that an external function action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            return foo
          }

          function onClick() {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {}
        
          function onClick() {
              console.log(foo);
          }
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge the call expression with used variable when these call expression is not setting any variable', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';

          someMagicFunction(foo);

          function onClick() {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
        
          function onClick() {
            console.log(foo);
          }
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge the call expression with used variable when these call expression is not setting any variable', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';

          console.log(foo);

          function onClick() {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
        
          function onClick() {
            console.log(foo);
          }
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge the ASYNC call expression with used variable when these call expression is not setting any variable', () => {
      const codeToPurge = `
        async function Test({ someProp }) {
          let foo = 'bar';

          await someMagicFunction(foo);

          function onClick() {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        async function Test({someProp}) {
          let foo = 'bar';
        
          function onClick() {
            console.log(foo);
          }
        }
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should purge the ASYNC call expression with used variable when these call expression is setted by an unused variable', () => {
      const codeToPurge = `
        async function Test({ someProp }) {
          let foo = 'bar';

          const res = await someMagicFunction(foo);

          function onClick() {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        async function Test({someProp}) {
          let foo = 'bar';
        
          function onClick() {
            console.log(foo);
          }
        }
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should keep the ASYNC call expression with used variable when these call expression is setted by used variable by the action', () => {
      const codeToPurge = `
        async function Test({ someProp }) {
          let foo = 'bar';

          const res = await someMagicFunction(foo);

          function onClick() {
             console.log(res);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        async function Test({someProp}) {
          let foo = 'bar';

          const res = await someMagicFunction(foo);
        
          function onClick() {
            console.log(res);
          }
        }
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the return when the defined function that an external arrow fn action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            return foo
          }

          const onClick = () => {
             console.log(foo);
          }
        
          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {}
        
          const onClick = () => {
            console.log(foo);
          };
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should only purge the return when the defined function that an external arrow fn without block statement action uses is used everywhere', () => {
      const codeToPurge = `
        function Test({ someProp }) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {
            return foo
          }

          const onClick = () => console.log(foo);

          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function ({someProp}) {
          let foo = 'bar';
          if (someProp) {
            foo = 'baz';
          } else {}
        
          const onClick = () => console.log(foo);
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });

    it('should keep if some variables are with destructuring', () => {
      const codeToPurge = `
        function Test() {
          let {foo} = {foo: 'bar'};
          const onClick = () => console.log(foo);

          return <div onClick={onClick} data-action-onClick="a1_1">hello</div>;
        }
      `;
      const expectedCode = `
        let Test = function () {
          let {foo} = {foo: 'bar'};
          const onClick = () => console.log(foo);
        };
      `;
      expectCodeToPurge(codeToPurge).toBe(expectedCode);
    });
  });
});
