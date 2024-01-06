import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import path from "node:path";
import { MatchedRoute } from "bun";

import getConstants from "../../constants";
import renderToReadableStream from "../render-to-readable-stream";
import extendRequestContext from "../extend-request-context";
import processPageRoute from ".";
import { toInline } from "../../helpers";

const request = extendRequestContext({
  originalRequest: new Request("http://localhost:3000"),
});

const testOptions = {
  request,
};

const HOMEPAGE = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "pages",
  "index.tsx",
);

const routeHomepage = { filePath: HOMEPAGE } as unknown as MatchedRoute;

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = getConstants() ?? {};
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("processPageRoute", () => {
    it("should return a page with the layout in production", async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
      };

      const { pageElement } = await processPageRoute(routeHomepage);

      // Rendered html
      const stream = renderToReadableStream(pageElement, testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
          <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <meta name="theme-color" content="#317EFB"></meta>
                <title>Brisa</title>
              </head>
              <body>
                <div id="S:1"><div>Loading...</div></div>
              </body>
            </html>
            <template id="U:1"><div>Hello world</div></template><script id="R:1">u$('1')</script>
          `),
      );
    });

    it("should return the page with hotreload connection in development", async () => {
      const { pageElement } = await processPageRoute(routeHomepage);
      const stream = renderToReadableStream(pageElement, testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
          <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <meta name="theme-color" content="#317EFB"></meta>
                <title>Brisa</title>
              </head>
              <body>
                <script>
                (new WebSocket("ws://0.0.0.0:0/__brisa_live_reload__")).onmessage = e => e.data === "reload" && location.reload();
                </script>
                <div id="S:1"><div>Loading...</div></div>
              </body>
            </html>
            <template id="U:1"><div>Hello world</div></template><script id="R:1">u$('1')</script>
        `),
      );
    });
  });
});
