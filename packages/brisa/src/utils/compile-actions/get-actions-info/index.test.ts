import { describe, it, expect } from "bun:test";
import getActionsInfo, { type ActionInfo } from ".";
import AST from "../../ast";

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
    });
  });
});
