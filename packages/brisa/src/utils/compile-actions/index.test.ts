import { describe, it, expect, afterEach } from "bun:test";
import { transformToActionCode } from ".";
import { normalizeQuotes } from "@/helpers";
import { getConstants } from "@/constants";

describe("utils", () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  describe("transformToActionCode", () => {
    it("should transform a simple component with 1 action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work without props in the component", () => {
      const code = `
        export default function Component() {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>Hello world</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component() {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: "Hello world"}, undefined, false, undefined, this);
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with props identifier", () => {
      const code = `
        export default function Component(props) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{props.text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component(props) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: props.text}, undefined, false, undefined, this);
        }

        export async function a1_1(props, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {...props, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should work with props destructuring", () => {
      const code = `
        export default function SomeComponent({foo, ...bar}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{foo}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function SomeComponent({foo, ...bar}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
        }

        export async function a1_1({foo, ...bar}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(SomeComponent, {foo, ...bar, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action and prop default", () => {
      const code = `
        export default function Component({initialValue = 0}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({initialValue = 0}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({initialValue = 0}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1", 
              component: jsxDEV(Component, {initialValue, ...__props}, undefined, false, undefined, this)
            });
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action and prop with destructuring with default", () => {
      const code = `
        export default function Component({ text: { value = 'foo' } }) {
          return <div onClick={() => console.log('hello world')} data-action-onclick="a1_1" data-action>{value}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text: {value = 'foo'}}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onclick": "a1_1","data-action": true,children: value}, undefined, false, undefined, this);
        }

        export async function a1_1({text: {value = 'foo'}}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text: {value}, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: function foo() {console.log('hello world');},"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = function foo() {console.log('hello world');};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {store}) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const {store} = req;
            const onClick = () => console.log('hello world');
            await onClick(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from "brisa/server";

        function SomeComponent({text}, requestContext) {
          const onClick = () => console.log('hello world');
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, requestContext) {
          try {
            const onClick = () => console.log('hello world');
            await onClick(...requestContext.store.get('__params:a1_1'));
            await requestContext._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req: requestContext, 
              error,
              actionId: "a1_1",
              component: jsxDEV(SomeComponent, {text, ...__props}, undefined, false, undefined, this)
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
      import {resolveAction as __resolveAction} from "brisa/server";

      function Component__0__({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
      }

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          const __props = error[Symbol.for("props")];
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: jsxDEV(Component__0__, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple async arrow function component with 1 action", () => {
      const code = `
        export default async ({foo}) => {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{foo}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      async function Component__0__({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
      };

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          const __props = error[Symbol.for("props")];
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: jsxDEV(Component__0__, {foo, ...__props}, undefined, false, undefined, this)
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
      import {resolveAction as __resolveAction} from "brisa/server";

      function Component__0__({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
      }

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          const __props = error[Symbol.for("props")];
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: jsxDEV(Component__0__, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple async arrow function without block statement component with 1 action", () => {
      const code = `
        export default async ({foo}) => <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{foo}</div>
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
      import {resolveAction as __resolveAction} from "brisa/server";

      async function Component__0__({foo}) {
        return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: foo}, undefined, false, undefined, this);
      };

      export async function a1_1({foo}, req) {
        try {
          const __action = () => console.log('hello world');
          await __action(...req.store.get('__params:a1_1'));
          await req._waitActionCallPromises("a1_1");
        } catch (error) {
          const __props = error[Symbol.for("props")];
          return __resolveAction({ 
            req, 
            error,
            actionId: "a1_1",
            component: jsxDEV(Component__0__, {foo, ...__props}, undefined, false, undefined, this)
          });
        }
      }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform an async component with function declaration", () => {
      const code = `
        export default async function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        async function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from "brisa/server";

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
            await __action(...req.store.get('__params:a2_1'));
            await req._waitActionCallPromises("a2_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a2_1",
              component: jsxDEV(SlowComponent, {...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function ComponentA({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }
        function ComponentB({text}) {
          return jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
        }
        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(ComponentA, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }
        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: jsxDEV(ComponentB, {text, ...__props}, undefined, false, undefined, this)
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
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component() {
          const onLoad = () => console.log('loaded');
          return jsxDEV("body", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1",onLoad,"data-action-onLoad": "a1_2","data-action": true}, undefined, false, undefined, this);
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({}, req) {
          try {
            const onLoad = () => console.log('loaded');
            await onLoad(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {...__props}, undefined, false, undefined, this)
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
              data-action-onClick="a1_1"
              data-action
            >
              Click me
            </button>
        );

        const Foo = function () {
          return (
            <input 
              type="text" 
              onInput={() => console.log('Second action')} 
              data-action-onInput="a1_2"
              onClick={() => console.log('Third action')}
              data-action-onClick="a1_3"
              data-action
            />
          );
        }

        export {Foo};
      `;

      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component__0__() {
          return jsxDEV("button", {onClick: () => console.log('First action'),"data-action-onClick": "a1_1","data-action": true,children: "Click me"}, undefined, false, undefined, this);
        }

        function Foo() {
          return jsxDEV("input", {type: "text",onInput: () => console.log('Second action'),"data-action-onInput": "a1_2",onClick: () => console.log('Third action'),"data-action-onClick": "a1_3","data-action": true}, undefined, false, undefined, this);
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('First action');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component__0__, {...__props}, undefined, false, undefined, this)
            });
          }
        }
        
        export async function a1_2({}, req) {
          try {
            const __action = () => console.log('Second action');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: jsxDEV(Foo, {...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({}, req) {
          try {
            const __action = () => console.log('Third action');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: jsxDEV(Foo, {...__props}, undefined, false, undefined, this)
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
            return <div onClick={() => console.log('a')} data-action-onClick="a1_1" data-action>{text}</div>
          } else if (text === 'b') {
            return <div onClick={() => console.log('b')} data-action-onClick="a1_2" data-action>{text}</div>
          } else {
            return <div onClick={() => console.log('c')} data-action-onClick="a1_3" data-action>{text}</div>
          }
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          if (text === 'a') {
            return jsxDEV("div", {onClick: () => console.log('a'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
          } else if (text === 'b') {
            return jsxDEV("div", {onClick: () => console.log('b'),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
          } else {
            return jsxDEV("div", {onClick: () => console.log('c'),"data-action-onClick": "a1_3","data-action": true,children: text}, undefined, false, undefined, this);
          }
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('a');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('b');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({text}, req) {
          try {
            const __action = () => console.log('c');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
              return <div onClick={() => console.log('a')} data-action-onClick="a1_1" data-action>{text}</div>
            case 'b':
              return <div onClick={() => console.log('b')} data-action-onClick="a1_2" data-action>{text}</div>
            default:
              return <div onClick={() => console.log('c')} data-action-onClick="a1_3" data-action>{text}</div>
          }
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          switch (text) {
            case 'a':
              return jsxDEV("div", {onClick: () => console.log('a'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
            case 'b':
              return jsxDEV("div", {onClick: () => console.log('b'),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
            default:
              return jsxDEV("div", {onClick: () => console.log('c'),"data-action-onClick": "a1_3","data-action": true,children: text}, undefined, false, undefined, this);
          }
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('a');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('b');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_3({text}, req) {
          try {
            const __action = () => console.log('c');
            await __action(...req.store.get('__params:a1_3'));
            await req._waitActionCallPromises("a1_3");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_3",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
            return <div onClick={() => console.log('first action', foo)} data-action-onClick="a1_1" data-action>{text}</div>
          } else {
            foo = 'b';
            return <div onClick={() => console.log('second action', foo)} data-action-onClick="a1_2" data-action>{text}</div>
          }
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          let foo;
          if (text === 'a') {
            foo = 'a';
            return jsxDEV("div", {onClick: () => console.log('first action', foo),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
          } else {
            foo = 'b';
            return jsxDEV("div", {onClick: () => console.log('second action', foo),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
          }
        }

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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
              return <div onClick={() => console.log('first action', foo)} data-action-onClick="a1_1" data-action>{text}</div>
            default:
              foo = 'b';
              return <div onClick={() => console.log('second action', foo)} data-action-onClick="a1_2" data-action>{text}</div>
          }
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          let {foo} = {};
          switch (text) {
            case 'a':
              foo = 'a';
              return jsxDEV("div", {onClick: () => console.log('first action', foo),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
            default:
              foo = 'b';
              return jsxDEV("div", {onClick: () => console.log('second action', foo),"data-action-onClick": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
          }
        }

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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
        normalizeQuotes("component: jsx(Component, {text, ...__props})"),
      );
    });
    it("should keep variables used inside the action but defined outside", () => {
      const code = `
        const SOME_CONSTANT = 'hello world';

        export default function Component({text}) {
          return <div onClick={() => console.log(SOME_CONSTANT)} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const SOME_CONSTANT = 'hello world';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should keep destructuring variables used inside the action but defined outside", () => {
      const code = `
        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world', FOO: 'foo'};

        export default function Component({text}) {
          return <div onClick={() => console.log(SOME_CONSTANT, FOO)} data-action-onclick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world',FOO: 'foo'};

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT, FOO),"data-action-onclick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT, FOO);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should transform the component to function and keep the constant", () => {
      const code = `
        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world', FOO: 'foo'};

        const Component = ({text}) => {
          return <div onClick={() => console.log(SOME_CONSTANT)} data-action-onClick="a1_1" data-action>{text}</div>
        }

        export {SOME_CONSTANT, Component}
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const {SOME_CONSTANT, FOO} = {SOME_CONSTANT: 'hello world',FOO: 'foo'};

        function Component({text}) {
          return jsxDEV("div", {onClick: () => console.log(SOME_CONSTANT),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(SOME_CONSTANT);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });
    it("should work an action inside a function inside the component", () => {
      const code = `
        export default function Component({text}) {
          const getTextEl = () => <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
          return getTextEl();
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const getTextEl = () => jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
          return getTextEl();
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with an element with an action defined inside the Component", () => {
      const code = `
        export default function Component({text}) {
          const el = <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
          return el;
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";
        
        function Component({text}) {
          const el = jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
          return el;
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
            data-action-onClick="a1_1" 
            onInput={() => console.log('hello world')} 
            data-action-onInput="a1_2" 
            data-action
          >{text}</div>
          return el;
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";
        
        function Component({text}) {
          const el = jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1",onInput: () => console.log('hello world'),"data-action-onInput": "a1_2","data-action": true,children: text}, undefined, false, undefined, this);
          return el;
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error, 
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }

        export async function a1_2({text}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_2'));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({ 
              req, 
              error,
              actionId: "a1_2",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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

          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const hello = 'hello world';
          console.log(hello);

          const onClick = async () => {
            await foo(hello);
            console.log(hello);
          };
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const hello = 'hello world';
            const onClick = async () => {
              await foo(hello);
              console.log(hello);
            };
            await onClick(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={() => console.log(hello)} data-action-onClick="a1_1" data-action>{text}</div>
        }  
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        async function Component({text}) {
          const hello = 'hello world';
          await someMagicFunction(hello);
          return jsxDEV("div", {onClick: () => console.log(hello),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(hello);
            const hello = 'hello world';
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={() => console.log(foo)} data-action-onClick="a1_1" data-action>{text}</div>
        }  
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const hello = 'hello world';
          const foo = someMagicFunction(hello);
          return jsxDEV("div", {onClick: () => console.log(foo),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(foo);
            const hello = 'hello world';
            const foo = someMagicFunction(hello);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => console.log("hello" + world);
          const onClick = handleClick.bind(this, ' test');
          return jsxDEV("div", {onClick,"data-action-onClick": "a1_1","data-action\": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => console.log("hello" + world);
            const onClick = handleClick.bind(this, ' test');
            await onClick(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with action.bind(this) defined on the attribute", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => console.log("hello"+world);
          return <div onClick={handleClick.bind(this, ' test')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => console.log("hello" + world);
          return jsxDEV("div", {onClick: handleClick.bind(this, " test"),"data-action-onClick": "a1_1","data-action\": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => console.log("hello" + world);
            const __action = req._p(handleClick.bind(this, " test"));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={curried} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => world2 => console.log("hello" + world + world2);
          const curried = handleClick(' test');
          return jsxDEV("div", {onClick: curried,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => world2 => console.log("hello" + world + world2);
            const curried = handleClick(' test');
            await curried(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with currying inside an attribute", () => {
      const code = `
        export default function Component({text}) {
          const handleClick = (world) => (world2) => console.log("hello"+world+world2);
          return <div onClick={handleClick(' test')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const handleClick = world => world2 => console.log("hello" + world + world2);
          return jsxDEV("div", {onClick: handleClick(' test'),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const handleClick = world => world2 => console.log("hello" + world + world2);
            const __action = req._p(handleClick(" test"));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div onClick={obj.foo.onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const obj = {
            foo: {
              onClick: () => console.log('hello world')
            }
          };
          return jsxDEV("div", {onClick: obj.foo.onClick,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div {...obj} data-action-onclick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const obj = {
            onClick: () => console.log('hello world')
          };
          return jsxDEV("div", {...obj,"data-action-onclick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const obj = {
              onClick: () => console.log('hello world')
            };
            const __action = obj.onClick;
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
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
          return <div {...foo} {...obj} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const foo = {};
          const obj = {
            onClick: () => console.log('hello world')
          };
          return jsxDEV("div", {...foo,...obj,"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

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
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should work with logical expression as events", () => {
      const code = `
        export default function Component({text}) {
          const foo = {};
          return <div onClick={foo.onClick || (() => console.log('hello world'))} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          const foo = {};
          return jsxDEV("div", {onClick: foo.onClick || (() => console.log('hello world')),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const foo = {};
            const __action = foo.onClick || (() => console.log('hello world'));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should be possible to use destructuring of req", () => {
      const code = `
        export default function Component({text}, {foo, ...req}) {
          return <div onClick={() => console.log(req.store.get('foo'))} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {foo, ...req}) {
          return jsxDEV("div", {onClick: () => console.log(req.store.get('foo')),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const {foo} = req;
            const __action = () => console.log(req.store.get('foo'));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should NOT wrap async calls inside the action with req._p", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={async () => {await foo();}} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: async () => {await foo();},"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = async () => {await foo();};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should wrap all sync calls inside the action with req._p", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => {const promise = bar(); foo(promise);}} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}) {
          return jsxDEV("div", {onClick: () => {const promise = bar();foo(promise);},"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const __action = () => {const promise = req._p(bar());req._p(foo(promise));};
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it("should be possible to use destructuring of req with different name", () => {
      const code = `
        export default function Component({text}, {foo, ...req2}) {
          return <div onClick={() => console.log(req2.store.get('foo'))} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function Component({text}, {foo, ...req2}) {
          return jsxDEV("div", {onClick: () => console.log(req2.store.get('foo')),"data-action-onClick": "a1_1","data-action": true,children: text}, undefined, false, undefined, this);
        }

        export async function a1_1({text}, req) {
          try {
            const {foo, ...req2} = req;
            const __action = () => console.log(req._p(req2.store.get('foo')));
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {text, ...__props}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it.todo("should work with destructuring and element generator", () => {
      const code = `
        const props = {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world'),
        };
        const getEl = (text) => <div
          {...props}
          data-action-onClick="a1_1"
          data-action-onInput="a1_2"
          data-action
        >{text}</div>;

        export default function Component({text}) {
          return getEl(text);
        }
        `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from "brisa/server";

        const props = {
          onClick: () => console.log('hello world'),
          onInput: () => console.log('hello world')
        };
        
        function getEl(text) {return jsxDEV("div", {
          ...props,
          "data-action-onClick": "a1_1",
          "data-action-onInput": "a1_2",
          "data-action": true,
          children: text}, undefined, false, undefined, this);}
          
        function Component({text}) {
          return getEl(text);
        }

        export async function a1_1(text, req) {
          try {
            const __action = props.onClick;
            await __action(...req.store.get("__params:a1_1"));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(getEl, {text}, undefined, false, undefined, this)});
            }
        }

        export async function a1_2(text, req) {
          try {
            const __action = props.onInput;
            await __action(...req.store.get("__params:a1_2"));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: jsxDEV(getEl, {text}, undefined, false, undefined, this)});
            }
          }
        `);

      expect(output).toEqual(expected);
    });

    it.todo("should work with a function jsx generator with an action", () => {
      // TODO: element is returned as a component, when we implement component rendering we will have to
      // figure out how to fix this
      const code = `
       const getEl = (text) => <div 
          onClick={() => console.log('hello world')} 
          data-action-onClick="a1_1" 
          data-action
        >{text}</div>;
      
        export default function Component({text}) {
          return getEl(text);
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));
      const expected = normalizeQuotes(`
          import {resolveAction as __resolveAction} from "brisa/server";
          
          function getEl(text) {return jsxDEV("div", {
            onClick: () => console.log("hello world"),
            "data-action-onClick": "a1_1",
            "data-action": true,
            children: text}, undefined, false, undefined, this);}
            
          function Component({text}) {
            return getEl(text);
          }

          export async function a1_1({text}, req) {
            try {
              const __action = () => console.log("hello world");
              await __action(...req.store.get("__params:a1_1"));
              await req._waitActionCallPromises("a1_1");
            } catch (error) {
              const __props = error[Symbol.for("props")];
              return __resolveAction({
                req,
                error,
                actionId: "a1_1",
                component: jsxDEV(getEl, {text, ...__props}, undefined, false, undefined, this)});
              }
            }
      `);

      expect(output).toEqual(expected);
    });

    it.todo(
      "should work with a function jsx generator with multiple actions",
      () => {
        // TODO: element is returned as a component, when we implement component rendering we will have to
        // figure out how to fix this
        const code = `
       const getEl = (text) => <div 
          onClick={() => console.log('hello world')} 
          data-action-onClick="a1_1" 
          onInput={() => console.log('hello world')} 
          data-action-onInput="a1_2" 
          data-action
        >{text}</div>;
      
        export default function Component({text}) {
          return getEl(text);
        }
      `;
        const output = normalizeQuotes(transformToActionCode(code));
        const expected = normalizeQuotes(`
          import {resolveAction as __resolveAction} from "brisa/server";
          
          function getEl(text) {return jsxDEV("div", {
            onClick: () => console.log("hello world"),
            "data-action-onClick": "a1_1",
            onInput: () => console.log("hello world"),
            "data-action-onInput": "a1_2",
            "data-action": true,
            children: text}, undefined, false, undefined, this);}
            
          function Component({text}) {
            return getEl(text);
          }
          
          export async function a1_1({text}, req) {
            try {
              const __action = () => console.log("hello world");
              await __action(...req.store.get("__params:a1_1"));
              await req._waitActionCallPromises("a1_1");
            } catch (error) {
              const __props = error[Symbol.for("props")];
              return __resolveAction({
                req,
                error,
                actionId: "a1_1",
                component: jsxDEV(getEl, {text}, undefined, false, undefined, this)});
              }
            }
            
          export async function a1_2({text}, req) {
            try {const __action = () => console.log("hello world");
            await __action(...req.store.get("__params:a1_2"));
            await req._waitActionCallPromises("a1_2");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_2",
              component: jsxDEV(getEl, {text}, undefined, false, undefined, this)});
            }
          }
      `);

        expect(output).toEqual(expected);
      },
    );

    it.todo("should transform simple HOC with an action", () => {
      const code = `
        export default async function AboutUs() {
          return (
            <Foo text="Hello" />
          );
        }

        const Foo = withAction(({ onClick }) => <button onClick={onClick}>Click me</button>);

        function withAction(Component) {
          return function WrappedComponent({ text }) {
            return <Component onClick={() => console.log(text)} />
          };
        }
      `;

      const output = normalizeQuotes(transformToActionCode(code));

      const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        function withAction(Component) {
          return function WrappedComponent({text}) {
            return jsxDEV(Component, {onClick: () => console.log(text)}, undefined, false, undefined, this);
          };
        }

        async function AboutUs() {
          return jsxDEV(Foo, {text: "Hello"}, undefined, false, undefined, this);
        }

        const Foo = withAction(({onClick}) => jsxDEV("button", {onClick, children: "Click me"}, undefined, false, undefined, this));

        export async function a1_1({text}, req) {
          try {
            const __action = () => console.log(text);
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(AboutUs, {}, undefined, false, undefined, this)
            });
          }
        }`);

      expect(output).toEqual(expected);
    });

    it.todo(
      "should work with an element with an action defined outside the Component",
      () => {
        const code = `
        const el = <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>Click me</div>;

        export default function Component() {
          return el;
        }
      `;

        const output = normalizeQuotes(transformToActionCode(code));

        const expected = normalizeQuotes(`
        import {resolveAction as __resolveAction} from 'brisa/server';

        const el = jsxDEV("div", {onClick: () => console.log('hello world'),"data-action-onClick": "a1_1","data-action": true,children: "Click me"}, undefined, false, undefined, this);

        function Component() {
          return el;
        }

        export async function a1_1({}, req) {
          try {
            const __action = () => console.log('hello world');
            await __action(...req.store.get('__params:a1_1'));
            await req._waitActionCallPromises("a1_1");
          } catch (error) {
            const __props = error[Symbol.for("props")];
            return __resolveAction({
              req,
              error,
              actionId: "a1_1",
              component: jsxDEV(Component, {}, undefined, false, undefined, this)
            });
          }
        }`);

        expect(output).toEqual(expected);
      },
    );

    it.todo(
      "should work with an element with multiple actions defined outside the Component",
    );
  });
});
