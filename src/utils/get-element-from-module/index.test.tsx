import getConstants from "../../constants";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import renderToReadableStream from "../render-to-readable-stream";
import extendRequestContext from "../extend-request-context";
import getElementFromModule from ".";
import { toInline } from "../../helpers";

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = getConstants() ?? {};
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("get-element-from-module", () => {
    it("should return a page with the layout in production", async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
      };

      const module = {
        default: () => <div>Page</div>,
      };

      const layoutModule = {
        default: ({ children }: any) => (
          <>
            <head></head>
            <body>{children}</body>
          </>
        ),
      };

      const element = await getElementFromModule(module, { layoutModule });

      // Fragment
      expect(element.type).toBeTypeOf("function");
      expect(element.type.__isFragment).toBeTrue();

      // DOCTYPE
      expect(element.props.children[0]).toEqual({
        type: "HTML",
        props: {
          html: "<!DOCTYPE html>",
        },
      });

      // Layout
      expect(element.props.children[1].type).toBeTypeOf("function");
      expect(element.props.children[1].props.layoutModule.default).toBeTypeOf(
        "function",
      );

      // Page
      expect(element.props.children[1].props.children.type).toBeTypeOf(
        "function",
      );

      // Rendered html
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000"),
      });
      const stream = renderToReadableStream(element, req);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<!DOCTYPE html><head></head><body><div>Page</div></body>`,
      );
    });

    it("should return the page with hotreload connection in development", async () => {
      const module = {
        default: () => <div>Page</div>,
      };

      const layoutModule = {
        default: ({ children }: any) => (
          <>
            <head></head>
            <body>{children}</body>
          </>
        ),
      };

      const element = await getElementFromModule(module, { layoutModule });
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000"),
      });
      const stream = renderToReadableStream(element, req);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
          <!DOCTYPE html>
          <head></head>
          <body>
            <script>(new WebSocket(\"ws://0.0.0.0:0/__brisa_live_reload__\")).onmessage = e => e.data === \"reload\" && location.reload();</script>
            <div>Page</div>
          </body>
        `),
      );
    });
  });
});
