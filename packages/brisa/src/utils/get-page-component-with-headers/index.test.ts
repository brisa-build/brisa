import { getConstants } from "@/constants";
import extendRequestContext from "@/utils/extend-request-context";
import getPageComponentWithHeaders from "@/utils/get-page-component-with-headers";
import type { MatchedRoute } from "bun";
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";

const BUILD_DIR = join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = join(BUILD_DIR, "pages");
const ASSETS_DIR = join(BUILD_DIR, "public");
const req = extendRequestContext({
  originalRequest: new Request("http://localhost"),
});

req.id = "123456";

describe("utils", () => {
  describe("getPageComponentWithHeaders", () => {
    beforeEach(async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
        LOCALES_SET: new Set(["en", "es"]),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
        },
      };
    });

    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should return PageComponent, pageModule and pageHeaders", async () => {
      const route = { filePath: join(PAGES_DIR, "foo.tsx") } as MatchedRoute;
      const error = new Error("error");
      const headers = { header: "value" };
      const result = await getPageComponentWithHeaders({
        req,
        route,
        error,
        headers,
      });
      expect(result.PageComponent).toBeTypeOf("function");
      expect(result.pageModule.responseHeaders).toBeUndefined();
      expect(result.pageHeaders).toEqual(
        new Headers({
          "cache-control": "no-store, must-revalidate",
          "transfer-encoding": "chunked",
          vary: "Accept-Encoding",
          "content-type": "text/html; charset=utf-8",
          ...headers,
        }),
      );
    });

    it("should return PageComponent, pageModule and pageHeaders with x-test responseHeaders as fail", async () => {
      const exectedPageResponseHeaders = { "x-test": "fail" };
      const route = { filePath: join(PAGES_DIR, "index.tsx") } as MatchedRoute;
      const error = new Error("error");
      const status = 500;
      const headers = { header: "value" };
      const result = await getPageComponentWithHeaders({
        req,
        route,
        error,
        status,
        headers,
      });
      expect(result.PageComponent).toBeTypeOf("function");
      expect(result.pageModule.responseHeaders).toBeTypeOf("function");
      expect(result.pageHeaders).toEqual(
        new Headers({
          "cache-control": "no-store, must-revalidate",
          "transfer-encoding": "chunked",
          vary: "Accept-Encoding",
          "content-type": "text/html; charset=utf-8",
          ...headers,
          ...exectedPageResponseHeaders,
        }),
      );
    });

    it("should return PageComponent, pageModule and pageHeaders with x-test responseHeaders as success", async () => {
      const exectedPageResponseHeaders = { "x-test": "success" };
      const route = { filePath: join(PAGES_DIR, "index.tsx") } as MatchedRoute;
      const result = await getPageComponentWithHeaders({ req, route });
      expect(result.PageComponent).toBeTypeOf("function");
      expect(result.pageModule.responseHeaders).toBeTypeOf("function");
      expect(result.pageHeaders).toEqual(
        new Headers({
          "cache-control": "no-store, must-revalidate",
          "transfer-encoding": "chunked",
          vary: "Accept-Encoding",
          "content-type": "text/html; charset=utf-8",
          ...exectedPageResponseHeaders,
        }),
      );
    });
  });
});
