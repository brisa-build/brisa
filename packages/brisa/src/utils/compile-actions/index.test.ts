import { describe, it, expect, afterEach } from "bun:test";
import path from "node:path";
import { transformToActionCode } from ".";
import { normalizeQuotes } from "@/helpers";
import { getConstants } from "@/constants";
import serverComponentPlugin, {
  workaroundText,
} from "@/utils/server-component-plugin";

function compileActions(code: string) {
  const modifiedCode = serverComponentPlugin(code, {
    allWebComponents: {},
    fileID: "a1",
    path: "",
  }).code.replace(workaroundText, "");

  return normalizeQuotes(transformToActionCode(modifiedCode));
}

const brisaServerFile = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "server",
  "index.js",
);

describe("utils", () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  describe("transformToActionCode", () => {
    it("should transform a simple component with 1 action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work without props in the component", () => {
      const code = `
        export default function Component() {
          return <div onClick={() => console.log('hello world')}>Hello world</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component() {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: "Hello world","data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with props identifier", () => {
      const code = `
        export default function Component(props) {
          return <div onClick={() => console.log('hello world')}>{props.text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component(props) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: props.text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1(props, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {...props, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with props destructuring", () => {
      const code = `
        export default function SomeComponent({foo, ...bar}) {
          return <div onClick={() => console.log('hello world')}>{foo}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function SomeComponent({foo, ...bar}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: foo,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        SomeComponent._hasActions = true;

        export async function a1_1({foo, ...bar}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(SomeComponent, {foo, ...bar, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action and prop default", () => {
      const code = `
        export default function Component({initialValue = 0}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({initialValue = 0}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({initialValue = 0}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1", 
              component: __props => jsxDEV(Component, {initialValue, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action and prop with destructuring with default", () => {
      const code = `
        export default function Component({ text: { value = 'foo' } }) {
          return <div onClick={() => console.log('hello world')}>{value}</div>
        }
      `;

      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text: {value = 'foo'}}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: value,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text: {value = 'foo'}}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text: {value}, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 function action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={function foo() { console.log('hello world')}}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: function foo() {console.log('hello world');},children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = function foo() {console.log('hello world');};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={onClick}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {store}) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick: (...args) => onClick(...args),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const {store} = req;
            const __action = (...args) => req._p(onClick(...args));
            const onClick = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={onClick}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";

        function SomeComponent({text}, requestContext) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick: (...args) => onClick(...args),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        SomeComponent._hasActions = true;

        export async function a1_1({text}, requestContext) {
          try {
            const __action = (...args) => requestContext._p(onClick(...args));
            const onClick = () => console.log('hello world');
            await __action(...requestContext.store.get('__params:a1_1'));
            await requestContext._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req: requestContext, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(SomeComponent, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple arrow function component with 1 action", () => {
      const code = `
        export default ({foo}) => {
          return <div onClick={() => console.log('hello world')}>{foo}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      function Component({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),children: foo,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
      }

      Component._hasActions = true;

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: __props => jsxDEV(Component, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple async arrow function component with 1 action", () => {
      const code = `
        export default async ({foo}) => {
          return <div onClick={() => console.log('hello world')}>{foo}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      async function Component({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),children: foo,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
      }

      Component._hasActions = true;

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: __props => jsxDEV(Component, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple arrow function without block statement component with 1 action", () => {
      const code = `
        export default ({foo}) => <div onClick={() => console.log('hello world')}>{foo}</div>
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      function Component({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),children: foo,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
      }

      Component._hasActions = true;

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: __props => jsxDEV(Component, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple async arrow function without block statement component with 1 action", () => {
      const code = `
        export default async ({foo}) => <div onClick={() => console.log('hello world')}>{foo}</div>
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      async function Component({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),children: foo,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
      }

      Component._hasActions = true;

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: __props => jsxDEV(Component, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform an async component with function declaration", () => {
      const code = `
        export default async function Component({text}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        async function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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

          return <div onClick={() => console.log('Vale')}>
            Slow component loaded 🐢 <b>{example}</b>
          </div>
        }

        SlowComponent.suspense = () => <>Loading slow component...</>
      `;
      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";

        function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

        async function SlowComponent({}, {store}) {
          const example = store.get("example");
          await sleep(5000);
          return jsxDEV("div", {onClick: () => console.log('Vale'),children: ["Slow component loaded 🐢 ", jsxDEV("b", {children: example}, undefined, false, undefined, this)],"data-action-onclick": "a1_1","data-action": true}, undefined, true, undefined, this);
        }

        SlowComponent.suspense = () => jsxDEV(Fragment, {children: "Loading slow component..."}, undefined, false, undefined, null);
        SlowComponent._hasActions = true;

        export async function a1_1({}, req) {
          try {
            const {store} = req;
            const __action = () => console.log('Vale');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(SlowComponent, {...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with export default in different line", () => {
      const code = `        
        function Component({text}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }

        export default Component;
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with export default in different line and arrow function", () => {
      const code = `        
        let Component = ({text}) => {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        };

        export default Component;
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with export default in different line and arrow function without block statement", () => {
      const code = `        
        const Component = ({text}) => <div onClick={() => console.log('hello world')}>{text}</div>;

        export default Component;
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with exports in different lines separated by comma", () => {
      const code = `
        function ComponentA({text}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }
        function ComponentB({text}) {
          return <div onClick={() => console.log('hello world')}>{text}</div>
        }
        export {ComponentA, ComponentB};
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function ComponentA({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }
        function ComponentB({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_2","data-action": true}, undefined, false, undefined, this);
        }

        ComponentA._hasActions = true;
        ComponentB._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentA, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(ComponentB, {text, ...__props}, undefined, false, undefined, this)
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
              onLoad={onLoad}
            />
          );
        }
      `;
      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component() {
          const onLoad = () => console.log('loaded');
          return jsxDEV("body", {onClick: () => console.log('hello world'),onLoad: (...args) => onLoad(...args),"data-action-onclick": "a1_1","data-action-onload": "a1_2","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({}, req) {
          try {
            const __action = (...args) => req._p(onLoad(...args));
            const onLoad = () => console.log('loaded');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform different components with different actions", () => {
      const code = `
        export default () => (
            <button 
              onClick={() => console.log('First action')}
            >
              Click me
            </button>
        );

        const Foo = function () {
          return (
            <input 
              type="text" 
              onInput={() => console.log('Second action')} 
              onClick={() => console.log('Third action')}
            />
          );
        }

        export {Foo};
      `;

      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component() {
          return jsxDEV("button", {onClick: () => console.log('First action'),children: "Click me","data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
        }

        function Foo() {
          return jsxDEV("input", {type: "text",onInput: () => console.log('Second action'),onClick: () => console.log('Third action'),"data-action-oninput": "a1_2","data-action-onclick": "a1_3","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;
        Foo._hasActions = true;

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('First action');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }
        
        export async function a1_2({}, req) {
          try {
            const __action = () => console.log('Second action');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Foo, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({}, req) {
          try {
            const __action = () => console.log('Third action');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: __props => jsxDEV(Foo, {...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should purge an if-ifelse-else with different retuns and actions in each one", () => {
      const code = `
        export default function Component({text}) {
          if (text === 'a') {
            return <div onClick={() => console.log('a')}>{text}</div>
          } else if (text === 'b') {
            return <div onClick={() => console.log('b')}>{text}</div>
          } else {
            return <div onClick={() => console.log('c')}>{text}</div>
          }
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          if (text === 'a') {
            return jsxDEV("div", {onClick: () => console.log('a'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
          } else if (text === 'b') {
            return jsxDEV("div", {onClick: () => console.log('b'),children: text,"data-action-onclick": "a1_2","data-action": true}, undefined, false, undefined, this);
          } else {
            return jsxDEV("div", {onClick: () => console.log('c'),children: text,"data-action-onclick": "a1_3","data-action": true}, undefined, false, undefined, this);
          }
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('a');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('b');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({text}, req) {
          try {
            const __action = () => console.log('c');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should purge a switch-case with different retuns and actions in each one", () => {
      const code = `
        export default function Component({text}) {
          switch (text) {
            case 'a':
              return <div onClick={() => console.log('a')}>{text}</div>
            case 'b':
              return <div onClick={() => console.log('b')}>{text}</div>
            default:
              return <div onClick={() => console.log('c')}>{text}</div>
          }
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          switch (text) {
            case 'a':
              return jsxDEV("div", {onClick: () => console.log('a'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
            case 'b':
              return jsxDEV("div", {onClick: () => console.log('b'),children: text,"data-action-onclick": "a1_2","data-action": true}, undefined, false, undefined, this);
            default:
              return jsxDEV("div", {onClick: () => console.log('c'),children: text,"data-action-onclick": "a1_3","data-action": true}, undefined, false, undefined, this);
          }
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('a');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('b');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({text}, req) {
          try {
            const __action = () => console.log('c');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should only remove the return statement inside a if-else statements when are doing more things than returning jsx", () => {
      const code = `
        export default function Component({text}) {
          let foo;
          if (text === 'a') {
            foo = 'a';
            return <div onClick={() => console.log('first action', foo)}>{text}</div>
          } else {
            foo = 'b';
            return <div onClick={() => console.log('second action', foo)}>{text}</div>
          }
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          let foo;
          if (text === 'a') {
            foo = 'a';
            return jsxDEV("div", {onClick: () => console.log('first action', foo),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
          } else {
            foo = 'b';
            return jsxDEV("div", {onClick: () => console.log('second action', foo),children: text,"data-action-onclick": "a1_2","data-action": true}, undefined, false, undefined, this);
          }
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('first action', foo);
            let foo;
            if (text === 'a') {
              foo = 'a';
            } else {
              foo = 'b';
            }
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('second action', foo);
            let foo;
            if (text === 'a') {
              foo = 'a';
            } else {
              foo = 'b';
            }
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should only remove the return statement inside a switch-case statements when are doing more things than returning jsx", () => {
      const code = `
        export default function Component({text}) {
          let {foo} = {};
          switch (text) {
            case 'a':
              foo = 'a';
              return <div onClick={() => console.log('first action', foo)}>{text}</div>
            default:
              foo = 'b';
              return <div onClick={() => console.log('second action', foo)}>{text}</div>
          }
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          let {foo} = {};
          switch (text) {
            case 'a':
              foo = 'a';
              return jsxDEV("div", {onClick: () => console.log('first action', foo),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
            default:
              foo = 'b';
              return jsxDEV("div", {onClick: () => console.log('second action', foo),children: text,"data-action-onclick": "a1_2","data-action": true}, undefined, false, undefined, this);
          }
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('first action', foo);
            let {foo} = {};
            switch (text) {
              case 'a':
                foo = 'a';
              default:
                foo = 'b';
            }
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('second action', foo);
            let {foo} = {};
            switch (text) {
              case 'a':
                foo = 'a';
              default:
                foo = 'b';
            }
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should generate the jsx code correctly in prod", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: true,
      };
      const code = `
        export default function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      expect(normalizeQuotes(transformToActionCode(code))).toContain(
        normalizeQuotes(
          "component: __props => jsx(Component, {text, ...__props})",
        ),
      );
    });
    it("should keep variables used inside the action but defined outside", () => {
      const code = `
        const SOME_CONSTANT = 'hello world';

        export default function Component({text}) {
          return <div onClick={() => console.log(SOME_CONSTANT)}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const SOME_CONSTANT = 'hello world';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should keep destructuring variables used inside the action but defined outside", () => {
      const code = `
        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world', FOO: 'foo'};

        export default function Component({text}) {
          return <div onClick={() => console.log(SOME_CONSTANT, FOO)}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world',FOO: 'foo'};

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT, FOO),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT, FOO);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should transform the component to function and keep the constant", () => {
      const code = `
        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world', FOO: 'foo'};

        const Component = ({text}) => {
          return <div onClick={() => console.log(SOME_CONSTANT)}>{text}</div>
        }

        export {SOME_CONSTANT, Component}
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world',FOO: 'foo'};

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, null);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should work an action inside a function inside the component", () => {
      const code = `
        export default function Component({text}) {
          const getTextEl = () => <div onClick={() => console.log('hello world')}>{text}</div>
          return getTextEl();
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const getTextEl = () => jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
          return getTextEl();
          getTextEl._hasActions = true;
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with an element with an action defined inside the Component", () => {
      const code = `
        export default function Component({text}) {
          const el = <div onClick={() => console.log('hello world')}>{text}</div>
          return el;
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";
        
        function Component({text}) {
          const el = jsxDEV("div", {onClick: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
          return el;
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with an element with multiple actions defined inside the Component", () => {
      const code = `
        export default function Component({text}) {
          const el = <div 
            onClick={() => console.log('hello world')} 
            onInput={() => console.log('hello world')} 
          >{text}</div>
          return el;
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";
        
        function Component({text}) {
          const el = jsxDEV("div", {onClick: () => console.log('hello world'),onInput: () => console.log('hello world'),children: text,"data-action-onclick": "a1_1","data-action-oninput": "a1_2","data-action": true}, undefined, false, undefined, this);
          return el;
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error, 
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should purge a call expression that is not recovered with a variable and this call has an action identifier", () => {
      const code = `
        export default function Component({text}) {
          const hello = 'hello world';
          console.log(hello); // Should purge

          const onClick = async () => {
            await foo(hello); // Should keep
            console.log(hello); // Should keep
          };

          return <div onClick={onClick}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const hello = 'hello world';
          console.log(hello);

          const onClick = async () => {
            await foo(hello);
            console.log(hello);
          };
          return jsxDEV("div", {onClick: (...args) => onClick(...args),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = (...args) => req._p(onClick(...args));
            const hello = 'hello world';
            const onClick = async () => {
              await foo(hello);
              console.log(hello);
            };
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should purge an async call expression that is not recovered with a variable and this call has an action identifier", () => {
      const code = `
        export default async function Component({text}) {
          const hello = 'hello world';
          await someMagicFunction(hello);
          return <div onClick={() => console.log(hello)}>{text}</div>
        }  
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        async function Component({text}) {
          const hello = 'hello world';
          await someMagicFunction(hello);
          return jsxDEV("div", {onClick: () => console.log(hello),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(hello);
            const hello = 'hello world';
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should keep a call expression that is recovered with a variable and this call has an action identifier", () => {
      const code = `
        export default function Component({text}) {
          const hello = 'hello world';
          const foo = someMagicFunction(hello);
          return <div onClick={() => console.log(foo)}>{text}</div>
        }  
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const hello = 'hello world';
          const foo = someMagicFunction(hello);
          return jsxDEV("div", {onClick: () => console.log(foo),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(foo);
            const hello = 'hello world';
            const foo = someMagicFunction(hello);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with action.bind(this)", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => console.log("hello"+world);
          const onClick = handleClick.bind(this, ' test');
          return <div onClick={onClick}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => console.log("hello" + world);
          const onClick = handleClick.bind(this, ' test');
          return jsxDEV("div", {onClick: (...args) => onClick(...args),children: text,"data-action-onclick": "a1_1","data-action\": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = (...args) => req._p(onClick(...args));
            const handleClick = world => console.log("hello" + world);
            const onClick = handleClick.bind(this, ' test');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with action.bind(this) defined on the attribute", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => console.log("hello"+world);
          return <div onClick={handleClick.bind(this, ' test')}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => console.log("hello" + world);
          return jsxDEV("div", {onClick: handleClick.bind(this, " test"),children: text,"data-action-onclick": "a1_1","data-action\": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => console.log("hello" + world);
            const __action = req._p(handleClick.bind(this, " test"));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with currying outside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => (world2) => console.log("hello"+world+world2);
          const curried = handleClick(' test');
          return <div onClick={curried}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => world2 => console.log("hello" + world + world2);
          const curried = handleClick(' test');
          return jsxDEV("div", {onClick: (...args) => curried(...args),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = (...args) => req._p(curried(...args));
            const handleClick = world => world2 => console.log("hello" + world + world2);
            const curried = handleClick(' test');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with currying inside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => (world2) => console.log("hello"+world+world2);
          return <div onClick={handleClick(' test')}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => world2 => console.log("hello" + world + world2);
          return jsxDEV("div", {onClick: handleClick(' test'),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => world2 => console.log("hello" + world + world2);
            const __action = req._p(handleClick(" test"));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with an object with a function inside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const obj = {
            foo: {
              onClick: () => console.log('hello world')
            }
          };
          return <div onClick={obj.foo.onClick}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const obj = {
            foo: {
              onClick: () => console.log('hello world')
            }
          };
          return jsxDEV("div", {onClick: obj.foo.onClick,children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const obj = {
              foo: {
                onClick: () => console.log('hello world')
              }
            };
            const __action = obj.foo.onClick;
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with a destructured object with a function inside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const obj = {
            onClick: () => console.log('hello world')
          };
          return <div {...obj}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const obj = {
            onClick: () => console.log('hello world')
          };
          return jsxDEV("div", {...obj,children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const obj = {
              onClick: () => console.log('hello world')
            };
            const __action = obj.onClick;
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with multiple destructured objecs with a function inside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const foo = {};
          const obj = {
            onClick: () => console.log('hello world')
          };
          return <div {...foo} {...obj}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const foo = {};
          const obj = {
            onClick: () => console.log('hello world')
          };
          return jsxDEV("div", {...foo,...obj,children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const foo = {};
            const obj = {
              onClick: () => console.log('hello world')
            };
            const __action = foo.onClick ?? obj.onClick;
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with logical expression as events", () => {
      const code = `
        export default function Component({text}) {
          const foo = {};
          return <div onClick={foo.onClick || (() => console.log('hello world'))}>{text}</div>
        }
      `;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const foo = {};
          return jsxDEV("div", {onClick: foo.onClick || (() => console.log('hello world')),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const foo = {};
            const __action = foo.onClick || (() => console.log('hello world'));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should be possible to use destructuring of req", () => {
      const code = `
        export default function Component({text}, {foo, ...req}) {
          return <div onClick={() => console.log(req.store.get('foo'))}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {foo, ...req}) {
          return jsxDEV("div", {onClick: () => console.log(req.store.get('foo')),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const {foo} = req;
            const __action = () => console.log(req.store.get('foo'));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should NOT wrap async calls inside the action with req._p", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={async () => {await foo();}}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: async () => {await foo();},children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = async () => {await foo();};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should wrap all sync calls inside the action with req._p", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => {const promise = bar(); foo(promise);}}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => {const promise = bar();foo(promise);},children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => {const promise = req._p(bar());req._p(foo(promise));};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should be possible to use destructuring of req with different name", () => {
      const code = `
        export default function Component({text}, {foo, ...req2}) {
          return <div onClick={() => console.log(req2.store.get('foo'))}>{text}</div>
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {foo, ...req2}) {
          return jsxDEV("div", {onClick: () => console.log(req2.store.get('foo')),children: text,"data-action-onclick": "a1_1","data-action": true}, undefined, false, undefined, this);
        }

        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const {foo, ...req2} = req;
            const __action = () => console.log(req._p(req2.store.get('foo')));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work rerendering a component with onSubmit and function calls", () => {
      const code = `
      import { rerenderInAction } from "brisa/server";

      export default function CounterServer(
        { value = 0 }: { value: number },
      ) {

        function increment(v: number) {
          rerenderInAction({ type: "targetComponent", props: { value: v + 1 } });
        }

        function decrement(v: number) {
          rerenderInAction({ type: "targetComponent", props: { value: v - 1 } });
        }

        return (
          <div>
            <h2>Server counter</h2>
            <form onSubmit={e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter")!);
              if (content === "-") decrement(+e.formData.get("counter")!);
            }}>
              <button>+</button>
              <input name="counter" type="number" value={value}></input>
              <button>-</button>
            </form>
          </div>
        );
      }`;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";
      import {rerenderInAction} from "${brisaServerFile}";

      function CounterServer({value = 0}) {
        function increment(v) {
          rerenderInAction({type: "targetComponent",props: {value: v + 1}});
        }

        function decrement(v) {
          rerenderInAction({type: "targetComponent",props: {value: v - 1}});
        }

        return jsxDEV("div", {
          children: [jsxDEV("h2", {children: "Server counter"}, undefined, false, undefined, this), jsxDEV(
            "form", {onSubmit: e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter"));
              if (content === "-") decrement(+e.formData.get("counter"));
            },
            children: [jsxDEV("button", {children: "+"}, undefined, false, undefined, this), jsxDEV(
              "input", {name: "counter",type: "number",value}, undefined, false, undefined, this), jsxDEV(
                "button", {children: "-"}, undefined, false, undefined, this)],"data-action-onsubmit": "a1_1","data-action": true}, undefined, true, undefined, this)]}, undefined, true, undefined, this);
        }
    
        CounterServer._hasActions = true;

    export async function a1_1({value = 0}, req) {
      try {
        const __action = e => {
          const content = e.currentTarget.innerHTML;
          if (content === "+") req._p(increment(+req._p(e.formData.get("counter"))));
          if (content === "-") req._p(decrement(+req._p(e.formData.get("counter"))));
        };
        function increment(v) {
          rerenderInAction({type: "targetComponent",props: {value: v + 1}});
        }

        function decrement(v) {
          rerenderInAction({type: "targetComponent",props: {value: v - 1}});
        }
        await __action(...req.store.get("__params:a1_1"));
        await req._waitActionCallPromises("a1_1");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_1",
          component: __props => jsxDEV(CounterServer, {value, ...__props}, undefined, false, undefined, this)
        });
      }
    }`);

      expect(output).toEqual(expected);
    });

    it("should work rerendering a component with onSubmit and function calls with variables inside", () => {
      const code = `
      import { rerenderInAction } from "brisa/server";

      export default function CounterServer(
        { value = 0 }: { value: number },
      ) {

        function increment(v: number) {
          const value = v + 1;
          rerenderInAction({ type: "targetComponent", props: { value} });
        }

        function decrement(v: number) {
          const value = v - 1;
          rerenderInAction({ type: "targetComponent", props: { value } });
        }

        return (
          <div>
            <h2>Server counter</h2>
            <form onSubmit={e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter")!);
              if (content === "-") decrement(+e.formData.get("counter")!);
            }}>
              <button>+</button>
              <input name="counter" type="number" value={value}></input>
              <button>-</button>
            </form>
          </div>
        );
      }`;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";
      import {rerenderInAction} from "${brisaServerFile}";

      function CounterServer({value = 0}) {
        function increment(v) {
          const value = v + 1;
          rerenderInAction({type: "targetComponent",props: {value}});
        }

        function decrement(v) {
          const value = v - 1;
          rerenderInAction({type: "targetComponent",props: {value}});
        }

        return jsxDEV("div", {
          children: [jsxDEV("h2", {children: "Server counter"}, undefined, false, undefined, this), jsxDEV(
            "form", {onSubmit: e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter"));
              if (content === "-") decrement(+e.formData.get("counter"));
            },
            children: [jsxDEV("button", {children: "+"}, undefined, false, undefined, this), jsxDEV(
              "input", {name: "counter",type: "number",value}, undefined, false, undefined, this), jsxDEV(
                "button", {children: "-"}, undefined, false, undefined, this)],"data-action-onsubmit": "a1_1","data-action": true}, undefined, true, undefined, this)]}, undefined, true, undefined, this);
        }

        CounterServer._hasActions = true;
    

    export async function a1_1({value = 0}, req) {
      try {
        const __action = e => {
          const content = e.currentTarget.innerHTML;
          if (content === "+") req._p(increment(+req._p(e.formData.get("counter"))));
          if (content === "-") req._p(decrement(+req._p(e.formData.get("counter"))));
        };
        function increment(v) {
          const value = v + 1;
          rerenderInAction({type: "targetComponent",props: {value}});
        }

        function decrement(v) {
          const value = v - 1;
          rerenderInAction({type: "targetComponent",props: {value}});
        }
        await __action(...req.store.get("__params:a1_1"));
        await req._waitActionCallPromises("a1_1");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_1",
          component: __props => jsxDEV(CounterServer, {value, ...__props}, undefined, false, undefined, this)
        });
      }
    }`);

      expect(output).toEqual(expected);
    });

    it("should work rerendering a component with onSubmit and arrow function calls", () => {
      const code = `
      import { rerenderInAction } from "brisa/server";

      export default function CounterServer(
        { value = 0 }: { value: number },
      ) {

        const increment = (v: number) => {
          rerenderInAction({ type: "targetComponent", props: { value: v + 1 } });
        }

        const decrement = (v: number) => {
          rerenderInAction({ type: "targetComponent", props: { value: v - 1 } });
        }

        return (
          <div>
            <h2>Server counter</h2>
            <form onSubmit={e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter")!);
              if (content === "-") decrement(+e.formData.get("counter")!);
            }}>
              <button>+</button>
              <input name="counter" type="number" value={value}></input>
              <button>-</button>
            </form>
          </div>
        );
      }`;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";
      import {rerenderInAction} from "${brisaServerFile}";

      function CounterServer({value = 0}) {
        const increment = v => {
          rerenderInAction({type: "targetComponent",props: {value: v + 1}});
        };

        const decrement = v => {
          rerenderInAction({type: "targetComponent",props: {value: v - 1}});
        };

        return jsxDEV("div", {
          children: [jsxDEV("h2", {children: "Server counter"}, undefined, false, undefined, this), jsxDEV("form"
          , {onSubmit: e => {
              const content = e.currentTarget.innerHTML;
              if (content === "+") increment(+e.formData.get("counter"));
              if (content === "-") decrement(+e.formData.get("counter"));
            },
            children: [jsxDEV("button", {children: "+"}, undefined, false, undefined, this), jsxDEV(
              "input", {name: "counter",type: "number",value}, undefined, false, undefined, this), jsxDEV(
                "button", {children: "-"}, undefined, false, undefined, this)],"data-action-onsubmit": "a1_1","data-action": true}, undefined, true, undefined, this)]}, undefined, true, undefined, this)  
        ;}

      CounterServer._hasActions = true;
    

    export async function a1_1({value = 0}, req) {
      try {
        const __action = e => {
          const content = e.currentTarget.innerHTML;
          if (content === "+") req._p(increment(+req._p(e.formData.get("counter"))));
          if (content === "-") req._p(decrement(+req._p(e.formData.get("counter"))));
        };
        const increment = v => {
          rerenderInAction({type: "targetComponent",props: {value: v + 1}});
        };

        const decrement = v => {
          rerenderInAction({type: "targetComponent",props: {value: v - 1}});
        };
        await __action(...req.store.get("__params:a1_1"));
        await req._waitActionCallPromises("a1_1");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_1",
          component: __props => jsxDEV(CounterServer, {value, ...__props}, undefined, false, undefined, this)
        });
      }
    }`);

      expect(output).toEqual(expected);
    });

    it("should work with destructuring and element generator", () => {
      const code = `
        const props = {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world'),
        };
        
        const getEl = (text) => <div {...props}>{text}</div>;

        export default function Component({ text }) {
          return getEl(text);
        }
     `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
    import {resolveAction as __resolveAction} from "brisa/server";

    const props = {
      onClick: () => console.log('hello world'),
      onInput: () => console.log('hello world')
    };

    function getEl(text) {
      return jsxDEV("div", {
        ...props,
        children: text,
        "data-action-onclick": "a1_1",
        "data-action-oninput": "a1_2",
        "data-action": true
      }, undefined, false, undefined, null);
    }

    function Component({text}) {
      return getEl(text);
    }

    getEl._hasActions = true;
    Component._hasActions = true;

    export async function a1_1({text}, req) {
      try {
        const __action = props.onClick;
        await __action(...req.store.get("__params:a1_1"));
        await req._waitActionCallPromises("a1_1");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_1",
          component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
        });
      }
    }

    export async function a1_2({text}, req) {
      try {
        const __action = props.onInput;
        await __action(...req.store.get("__params:a1_2"));
        await req._waitActionCallPromises("a1_2");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_2",
          component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
        });
      }
    }
    `);

      expect(output).toEqual(expected);
    });

    it("should work with a function jsx generator with an action", () => {
      const code = `
        const getEl = (text) => <div onClick={() => console.log('hello world')}>{text}</div>;
      
        export default function Component({ text }) {
          return getEl(text);
        }
      `;

      const output = compileActions(code);
      const expected = normalizeQuotes(`
    import {resolveAction as __resolveAction} from "brisa/server";

    function getEl(text) {
      return jsxDEV("div", {
        onClick: () => console.log("hello world"),
        children: text,
        "data-action-onclick": "a1_1",
        "data-action": true
      }, undefined, false, undefined, null);
    }

    function Component({text}) {
      return getEl(text);
    }

    getEl._hasActions = true;
    Component._hasActions = true;

    export async function a1_1({text}, req) {
      try {
        const __action = () => console.log("hello world");
        await __action(...req.store.get("__params:a1_1"));
        await req._waitActionCallPromises("a1_1");
      } catch (error) {
        return __resolveAction({
          req,
          error,
          actionId: "a1_1",
          component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
        });
      }
    }
  `);

      expect(output).toEqual(expected);
    });

    it("should work with a function jsx generator with multiple actions", () => {
      const code = `
        const getEl = (text) => (
          <div onClick={() => console.log('hello world')} onInput={() => console.log('hello world')}>
            {text}
          </div>
        );
      
        export default function Component({ text }) {
          return getEl(text);
        }
`;
      const output = compileActions(code);
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";

        function getEl(text) {
          return jsxDEV("div", {
            onClick: () => console.log("hello world"),
            onInput: () => console.log("hello world"),
            children: text,
            "data-action-onclick": "a1_1",
            "data-action-oninput": "a1_2",
            "data-action": true
          }, undefined, false, undefined, null);
        }

        function Component({text}) {
          return getEl(text);
        }

        getEl._hasActions = true;
        Component._hasActions = true;

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log("hello world");
            await __action(...req.store.get("__params:a1_1"));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log("hello world");
            await __action(...req.store.get("__params:a1_2"));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
        `);

      expect(output).toEqual(expected);
    });

    it("should work with some elements with multiple actions defined outside the Component", () => {
      const code = `
        const el = <div onClick={() => console.log('hello world')} onInput={() => console.log('hello world')}> Click me </div>;
        const el2 = <div onClick={() => console.log('hello world')} onInput={() => console.log('hello world')}> Click me </div>;

        export default function Component() {
          return <div>{el}{el2}</div>;
        }
        `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const el = jsxDEV("div", {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world'),
          children: " Click me ",
          "data-action-onclick": "a1_1",
          "data-action-oninput": "a1_2",
          "data-action": true
        }, undefined, false, undefined, null);

        const el2 = jsxDEV("div", {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world'),
          children: " Click me ",
          "data-action-onclick": "a1_3",
          "data-action-oninput": "a1_4",
          "data-action": true
        }, undefined, false, undefined, null);

        function Component() {
          return jsxDEV("div", {
            children: [el, el2]
          }, undefined, true, undefined, this);
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_3",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_4({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_4'));
            await req._waitActionCallPromises("a1_4");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_4",
              component: __props => jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toBe(expected);
    });

    it("should work with an element with multiple actions defined outside different Components", () => {
      const code = `
        const el = <div onClick={() => console.log('hello world')} onInput={() => console.log('hello world')}> Click me </div>;

        export default function Component() {
          return <div>Hello World</div>;
        }

        export const ComponentWithAction = () => el;
        `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const el = jsxDEV("div", {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world'),
          children: " Click me ",
          "data-action-onclick": "a1_1",
          "data-action-oninput": "a1_2",
          "data-action": true
        }, undefined, false, undefined, null);

       function Component() {
          return jsxDEV("div", {
            children: "Hello World"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return el;
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toBe(expected);
    });

    it("should work with element from an element with JSX used ouside a Component", () => {
      const code = `
        const el = <div onClick={() => console.log('hello world')}> Click me </div>;
        const el2 = <>{el}</>

        export function Component() {
          return <div>foo</div>;
        }

        export default function ComponentWithAction() {
          return el2;
        }
        `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const el = jsxDEV("div", {
          onClick: () => console.log('hello world'),
          children: " Click me ",
          "data-action-onclick": "a1_1",
          "data-action": true
        }, undefined, false, undefined, null);

        const el2 = jsxDEV(Fragment, {
          children: el
        }, undefined, false, undefined, null);

        function Component() {
          return jsxDEV("div", {
            children: "foo"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return el2;
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toBe(expected);
    });

    it.todo(
      "should work mixing elements with element generatos and components",
      () => {
        const code = `
        const generator = () => <div onClick={() => console.log('hello world')}> Click me </div>;
        const el = generator();

        export function Component() {
          return <div>no actions</div>;
        }

        export function ComponentWithAction() {
          return el;
        }
      `;

        const output = compileActions(code);

        const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function generator() {
          return jsxDEV("div", {
            onClick: () => console.log('hello world'),
            children: " Click me ",
            "data-action-onclick": "a1_1",
            "data-action": true,
          }, undefined, false, undefined, null);
        }

        const el = generator();

        function Component() {
          return jsxDEV("div", {
            children: "no actions"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return el;
        }

        generator._hasActions = true;
        ComponentWithAction._hasActions = true;

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

        expect(output).toBe(expected);
      },
    );
    it.todo("should work mixing element with 2 generators", () => {
      const code = `
        const generator = () => <div onClick={() => console.log('hello world')}> Click me </div>;
        const generator2 = () => <>{generator()}</>
        const el = generator2();

        export function Component() {
          return <div>no actions</div>;
        }

        export function ComponentWithAction() {
          return el;
        }
      `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function generator() {
          return jsxDEV("div", {
            onClick: () => console.log('hello world'),
            children: " Click me "
            "data-action-onclick": "a1_1",
            "data-action": true,
          }, undefined, false, undefined, this);
        }

        function generator2() {
          return jsxDEV(Fragment, {
            children: generator()
          }, undefined, false, undefined, this);
        }

        const el = generator2();

        function Component() {
          return jsxDEV("div", {
            children: "no actions"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return el;
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toBe(expected);
    });

    it.todo(
      "should work with an element with 2 generators and the 2nd one with actions",
      () => {
        const code = `
        const generator = () => <div onClick={() => console.log('hello world')}> Click me </div>;
        const generator2 = () => <>{generator()}</>

        export function Component() {
          return <div>no actions</div>;
        }

        export function ComponentWithAction() {
          return generator2();
        }
      `;

        const output = compileActions(code);

        const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function generator() {
          return jsxDEV("div", {
            onClick: () => console.log('hello world'),
            children: " Click me ",
            "data-action-onclick": "a1_1",
            "data-action": true
          }, undefined, false, undefined, this);
        }

        function generator2() {
          return jsxDEV(Fragment, {
            children: generator()
          }, undefined, false, undefined, this);
        }

        function Component() {
          return jsxDEV("div", {
            children: "no actions"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return generator2();
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

        expect(output).toBe(expected);
      },
    );

    it.todo(
      "should work el = gen1() + gen2() and the second one with actions",
      () => {
        const code = `
        const gen1 = () => <></>
        const gen2 = () => <div onClick={() => console.log('hello world')}> Click me </div>;
        const el = gen1()+gen2();

        export function Component() {
          return <div>no actions</div>;
        }

        export function ComponentWithAction() {
          return el;
        }
      `;

        const output = compileActions(code);

        const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function gen1() {
          return jsxDEV(Fragment, {}, undefined, false, undefined, this);
        }

        function gen2() {
          return jsxDEV("div", {
            onClick: () => console.log('hello world'),
            children: " Click me ",
            "data-action-onclick": "a1_1",
            "data-action": true
          }, undefined, false, undefined, this);
        }

        const el = gen1() + gen2();

        function Component() {
          return jsxDEV("div", {
            children: "no actions"
          }, undefined, false, undefined, this);
        }

        function ComponentWithAction() {
          return el;
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(ComponentWithAction, {...__props}, undefined, false, undefined, this)
            });
          }
        }`);

        expect(output).toBe(expected);
      },
    );

    it.todo("should transform simple HOC with an action", () => {
      const code = `
      export default async function AboutUs() {
        return (
          <Foo text= "Hello" />
                );
      }

      const Foo = withAction(({ onClick }) => <button onClick={ onClick } > Click me < /button>);

              function withAction(Component) {
          return function WrappedComponent({ text }) {
            return <Component onClick={ () => console.log(text) } />
          };
        }
    `;

      const output = compileActions(code);

      const expected = normalizeQuotes(`
        import { resolveAction as __resolveAction } from 'brisa/server';

        function withAction(Component) {
          return function WrappedComponent({ text }) {
            return jsxDEV(Component, { onClick: () => console.log(text) }, undefined, false, undefined, this);
          };
        }

        async function AboutUs() {
          return jsxDEV(Foo, { text: "Hello" }, undefined, false, undefined, this);
        }

        const Foo = withAction(({ onClick }) => jsxDEV("button", { onClick, children: "Click me" }, undefined, false, undefined, this));

        export async function a1_1({ text }, req) {
          try {
            const __action = () => console.log(text);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(AboutUs, { ...__props }, undefined, false, undefined, this)
            });
          }
        } `);

      expect(output).toEqual(expected);
    });

    it.todo(
      "should work with an element with an action defined outside the Component",
      () => {
        const code = `
      const el = <div onClick={() => console.log('hello world')} data - action - onClick="a1_1" data - action > Click me < /div>;

      export default function Component() {
        return el;
      }
      `;

        const output = compileActions(code);

        const expected = normalizeQuotes(`
        import { resolveAction as __resolveAction } from 'brisa/server';

        const el = jsxDEV("div", { onClick: () => console.log('hello world'), "data-action-onclick": "a1_1", "data-action": true, children: "Click me" }, undefined, false, undefined, this);

        function Component() {
          return el;
        }

        export async function a1_1({ }, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: __props => jsxDEV(Component, { ...__props }, undefined, false, undefined, this)
            });
          }
        } `);

        expect(output).toEqual(expected);
      },
    );
  });
});
