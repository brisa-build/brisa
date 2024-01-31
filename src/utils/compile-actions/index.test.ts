import { describe, it, expect } from "bun:test";
import { transformToActionCode } from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "../ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const processExpected = (code: string) =>
  normalizeQuotes(generateCodeFromAST(parseCodeToAST(code)));

describe("utils", () => {
  describe("transformToActionCode", () => {
    it("should transform a simple component with 1 action", () => {
      const code = `
        export default function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = processExpected(`
        import {resolveAction} from 'brisa/server';

        function Component({text}) {
          return <div onClick={() => console.log('hello world')} data-action-onClick="a1_1" data-action>{text}</div>
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
              component: <Component text={text} />
            })
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
      const expected = processExpected(`
        import {resolveAction} from 'brisa/server';

        function Component({text}) {
          return <div onClick={function foo() { console.log('hello world')}} data-action-onClick="a1_1" data-action>{text}</div>
        }

        export async function a1_1({text}, req) {
          try {
            const __action = function foo() { console.log('hello world') };
            await __action(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: <Component text={text} />
            })
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
      const expected = processExpected(`
        import {resolveAction} from 'brisa/server';

        function Component({text}, {store}) {
          const onClick = () => console.log('hello world');
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }

        export async function a1_1({text}, req) {
          const {store} = req;
          try {
            const onClick = () => console.log('hello world');
            await onClick(req.store.get('_action_params'));
            return new Response(null);
          } catch (error) {
            return resolveAction({ 
              req, 
              error, 
              pagePath: req.store.get('_action_page'), 
              component: <Component text={text} />
            })
          }
        }
      `);

      expect(output).toEqual(expected);
    });

    it("should transform a simple component with 1 action identifier and request identifier", () => {
      const code = `
        export default function Component({text}, requestContext) {
          const onClick = () => console.log('hello world');
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
        }
      `;
      const output = normalizeQuotes(transformToActionCode(code));
      const expected = processExpected(`
        import {resolveAction} from 'brisa/server';

        function Component({text}, requestContext) {
          const onClick = () => console.log('hello world');
          return <div onClick={onClick} data-action-onClick="a1_1" data-action>{text}</div>
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
              pagePath: req.store.get('_action_page'), 
              component: <Component text={text} />
            })
          }
        }
      `);

      expect(output).toEqual(expected);
    });
  });
});
