import { describe, it, expect } from "bun:test";
import getActionsInfo, { type ActionInfo } from ".";
import AST from "@/utils/ast";

const { parseCodeToAST } = AST("tsx");

describe("utils", () => {
  describe("compile-actions", () => {
    describe("get-actions-info", () => {
      it("should return an array of action info", () => {
        const ast = parseCodeToAST(`
          function App() {
            return <div onClick={() => console.log('click')} data-action-onClick="1" />;
          }
        `) as any;
        const fn = ast.body[0]?.declarations[0].init;
        const props = fn.body.body[0].argument.arguments[1].properties;

        const expected: ActionInfo[] = [
          {
            actionId: "1",
            componentFnExpression: fn,
            actionFnExpression: props[0].value,
            actionIdentifierName: undefined,
          },
        ];

        const actionsInfo = getActionsInfo(ast);

        expect(actionsInfo).toEqual(expected);
      });

      it("should return an array of action info with the action identifier name", () => {
        const ast = parseCodeToAST(`
          function App() {
            const onClick = () => console.log('click');
            return <div onClick={onClick} data-action-onClick="1" />;
          }
        `) as any;
        const fn = ast.body[0]?.declarations[0].init;

        const expected: ActionInfo[] = [
          {
            actionId: "1",
            componentFnExpression: fn,
            actionFnExpression: undefined,
            actionIdentifierName: "onClick",
          },
        ];

        const actionsInfo = getActionsInfo(ast);

        expect(actionsInfo).toEqual(expected);
      });

      it("should return an array of 2 action info", () => {
        const ast = parseCodeToAST(`
          function App() {
            const onLoad = () => console.log('load');
            return (
              <div 
                onClick={() => console.log('click')}
                data-action-onClick="1"
                onLoad={onLoad}
                data-action-onLoad="2"
              />
            );
          }
        `) as any;

        const fn = ast.body[0]?.declarations[0].init;
        const props = fn.body.body[1].argument.arguments[1].properties;
        const expected: ActionInfo[] = [
          {
            actionId: "1",
            componentFnExpression: fn,
            actionFnExpression: props[0].value,
            actionIdentifierName: undefined,
          },
          {
            actionId: "2",
            componentFnExpression: fn,
            actionFnExpression: undefined,
            actionIdentifierName: "onLoad",
          },
        ];

        const actionsInfo = getActionsInfo(ast);

        expect(actionsInfo).toEqual(expected);
      });

      it("should work with reassigned function with .bind", () => {
        const ast = parseCodeToAST(`
        function App() {
          const onLoad = (foo) => console.log('hello '+foo);
          const onLoadReassigned = onLoad.bind(null, 'world');
          return (
            <div 
              onClick={() => console.log('click')}
              data-action-onClick="1"
              onLoad={onLoadReassigned}
              data-action-onLoad="2"
            />
          );
        }
      `) as any;

        const fn = ast.body[0]?.declarations[0].init;
        const props = fn.body.body[2].argument.arguments[1].properties;
        const expected: ActionInfo[] = [
          {
            actionId: "1",
            componentFnExpression: fn,
            actionFnExpression: props[0].value,
            actionIdentifierName: undefined,
          },
          {
            actionId: "2",
            componentFnExpression: fn,
            actionFnExpression: undefined,
            actionIdentifierName: "onLoadReassigned",
          },
        ];

        const actionsInfo = getActionsInfo(ast);

        expect(actionsInfo).toEqual(expected);
      });
    });

    it("should work with reassigned function with .bind inside the attribute", () => {
      const ast = parseCodeToAST(`
      function App() {
        const onLoad = (foo) => console.log('hello '+foo);
        return (
          <div 
            onClick={() => console.log('click')}
            data-action-onClick="1"
            onLoad={onLoad.bind(null, 'world')}
            data-action-onLoad="2"
          />
        );
      }
    `) as any;

      const fn = ast.body[0]?.declarations[0].init;
      const props = fn.body.body[1].argument.arguments[1].properties;
      const expected: ActionInfo[] = [
        {
          actionId: "1",
          componentFnExpression: fn,
          actionFnExpression: props[0].value,
          actionIdentifierName: undefined,
        },
        {
          actionId: "2",
          componentFnExpression: fn,
          actionFnExpression: props[2].value,
          actionIdentifierName: "onLoad",
        },
      ];

      const actionsInfo = getActionsInfo(ast);

      expect(actionsInfo).toEqual(expected);
    });
  });
});
