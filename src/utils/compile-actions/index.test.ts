import { describe, it, expect } from "bun:test";
import { transformToActionCode } from ".";
import { normalizeQuotes } from "@/helpers";

describe("utils", () => {
  describe("transformToActionCode", () => {
    it("should transform a simple component with 1 action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(Component, {text}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 function action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={function foo() { console.log('hello world')}} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: function foo() {console.log('hello world');},"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = function foo() {console.log('hello world');};
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(Component, {text}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action identifier", () => {
      const code = `
        export default function Component({text}, {store}) {
          const onClick = () => console.log('hello world');
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        function Component({text}, {store}) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const {store} = req;
            const onClick = () => console.log('hello world');
            await onClick(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(Component, {text}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action identifier and request identifier", () => {
      const code = `
        export default function SomeComponent({text}, requestContext){
          const onClick = () => console.log('hello world');
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction} from "brisa/server";

        function SomeComponent({text}, requestContext) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, requestContext) {
          try {
            const onClick = () => console.log('hello world');
            await onClick(requestContext.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req: requestContext, 
              error, 
              pagePath: requestContext.store.get('_action_page'), 
              component: jsxDEV(SomeComponent, {text}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple arrow function component with 1 action", () => {
      const code = `
        export default ({foo}) => {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{foo}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
      import {resolveAction} from "brisa/server";

      function Component__0__({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
      }

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(req.store.get('_action_params'));
          return new Response(null);
        } catch (error) {
          return resolveAction({ 
            req, 
            error, 
            pagePath: req.store.get('_action_page'), 
            component: jsxDEV(Component__0__, {foo}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it.todo("should work with export default in different line");
    it.todo("should work with exports in different lines separated by comma");
    it.todo("should transform a simple HOC with an action");
    it.todo("should transform a component with 2 actions");
    it.todo("should transform different components with different actions");
    it.todo("should work with an element with an action");
    it.todo("should work with an element with multiple actions");
    it.todo("should work with a function jsx generator with an action");
    it.todo("should work with a function jsx generator with multiple actions");
    it.todo(
      "should purge a switch-case with different retuns and actions in each one",
    );
    it.todo(
      "should purge an if-ifelse-else with different retuns and actions in each one",
    );
    it.todo("should generate the jsx code correctly in prod");
    it.todo(
      "should work without conflicts if already exists a resolveAction variable",
    );
    it.todo("should keep variables used inside the action but defined outside");
  });
});
