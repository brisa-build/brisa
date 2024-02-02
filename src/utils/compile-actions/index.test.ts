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

    it("should transform a simple arrow function without block statement component with 1 action", () => {
      const code = `
        export default ({foo}) => <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{foo}</div>
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

    it("should transform an async component", () => {
      const code = `
        export default async function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        async function Component({text}) {
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

    it("should work the action with suspense", () => {
      const code = `
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        export default async function SlowComponent({}, {store}) {
          const example = store.get("example");
          await sleep(5000);

          return <div onClick={() => console.log('Vale')} data-action-onclick="a2_1" data-action>
            Slow component loaded 🐢 <b>{example}</b>
          </div>
        }

        SlowComponent.suspense = () => <>Loading slow component...</>
      `;
      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction} from "brisa/server";

        function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

        async function SlowComponent({}, {store}) {
          const example = store.get("example");
          await sleep(5000);
          return jsxDEV("div", {onClick: () => console.log('Vale'),"data-action-onclick": "a2_1","data-action": true,children: ["Slow component loaded 🐢 ", jsxDEV("b", {children: example}, undefined, false, undefined, this)]}, undefined, true, undefined, this);
        }

        SlowComponent.suspense = () => jsxDEV(Fragment, {children: "Loading slow component..."}, undefined, false, undefined, this);

        export async function a2_1({}, req) {
          try {
            const {store} = req;
            const __action = () => console.log('Vale');
            const example = store.get("example");
            await sleep(5000);
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(SlowComponent, {}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with export default in different line", () => {
      const code = `        
        function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }

        export default Component;
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

    it("should work with export default in different line and arrow function", () => {
      const code = `        
        let Component = ({text}) => {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        };

        export default Component;
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

    it("should work with export default in different line and arrow function without block statement", () => {
      const code = `        
        const Component = ({text}) => <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>;

        export default Component;
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

    it("should work with exports in different lines separated by comma", () => {
      const code = `
        function ComponentA({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
        function ComponentB({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_2" data-action>{text}</div>
        }
        export {ComponentA, ComponentB};
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        function ComponentA({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }
        function ComponentB({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
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
              component: jsxDEV(ComponentA, {text}, undefined, false, undefined, this)
            });
          }
        }
        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({
              req,
              error,
              pagePath: req.store.get('_action_page'),
              component: jsxDEV(ComponentB, {text}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a component with 2 actions", () => {
      const code = `
        export default function Component() {
          const onLoad = () => console.log('loaded');
          return (
            <body 
              onClick={() => console.log('hello world')} 
              data-action-onClick="a1_1"
              onLoad={onLoad}
              data-action-onLoad="a1_2"
              data-action 
            />
          );
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction} from 'brisa/server';

        function Component() {
          const onLoad = () => console.log('loaded');
          return jsxDEV("body", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1",onLoad,"data-action-onLoad": "a1_2","data-action": true}, undefined, false, undefined, this);
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            const onLoad = () => console.log('loaded');
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(Component, {}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({}, req) {
          try {
            const onLoad = () => console.log('loaded');
            await onLoad(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: jsxDEV(Component, {}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it.todo("should transform different components with different actions");
    it.todo("should work with an element with an action");
    it.todo("should work with an element with multiple actions");
    it.todo("should transform a simple HOC with an action");
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
    it.todo("should work an action inside a function inside the component");
  });
});
