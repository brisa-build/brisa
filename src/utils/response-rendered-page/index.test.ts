import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { MatchedRoute } from "bun";
import path from "node:path";

import type { Translate } from "@/types";
import extendRequestContext from "@/utils/extend-request-context";
import responseRenderedPage from ".";
import { getConstants } from "@/constants";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");

describe("utils", () => {
  describe("response-rendered-page", () => {
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

    it("should return 200 page with client page code", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(
          "http://localhost:1234/es/page-with-web-component",
        ),
        i18n: {
          locale: "es",
          defaultLocale: "es",
          locales: ["es", "en"],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, "page-with-web-component.tsx"),
        } as MatchedRoute,
        headers: {
          "X-Mode": "reactivity",
        },
      });
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Mode")).toBe("reactivity");
      expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
      expect(html).toContain("<web-component></web-component>");
    });

    it("should return a page with layout and i18n", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/es/somepage"),
        i18n: {
          locale: "es",
          defaultLocale: "es",
          locales: ["es", "en"],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, "somepage.tsx"),
        } as MatchedRoute,
      });
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toStartWith("<!DOCTYPE html>");
      expect(html).toContain('<html lang="es" dir="ltr">');
      expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
      expect(html).toContain("<h1>Some page</h1>");
    });
  });
});
