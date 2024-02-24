import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";

import extendRequestContext from "@/utils/extend-request-context";
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from "@/utils/rerender-in-action";
import { getConstants } from "@/constants";
import resolveAction from ".";
import { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from "@/utils/ssr-web-component";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");
const headers = new Headers();

headers.set("x-s", JSON.stringify([["foo", null]]));

const getReq = () =>
  extendRequestContext({
    originalRequest: new Request("http://localhost", { headers }),
    store: undefined,
  });

describe("utils", () => {
  describe("resolve-action", () => {
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

    it("should return a response with NotFoundError redirect", async () => {
      const error = new Error("Not found");
      error.name = "NotFoundError";

      const req = getReq();
      const response = await resolveAction({ req, error, component: <div /> });

      expect(response.headers.get("X-S")).toBe(JSON.stringify([["foo", null]]));
      expect(await response.headers.get("X-Navigate")).toBe(
        "http://localhost/?_not-found=1",
      );
    });

    it("should redirect to an specific url", async () => {
      const navigationTrowable = new Error("/some-url");
      navigationTrowable.name = "navigate";

      const req = getReq();
      const response = await resolveAction({
        req,
        error: navigationTrowable,
        component: <div />,
      });

      expect(response.headers.get("X-S")).toBe(JSON.stringify([["foo", null]]));
      expect(await response.headers.get("X-Navigate")).toBe("/some-url");
    });

    it("should log an error trying to rerender a invalid page", async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: "page", mode: "reactivity" }) +
          SUFFIX_MESSAGE,
      );
      error.name = "rerender";

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost/invalid-page"),
      });
      const response = await resolveAction({ req, error, component: <div /> });

      expect(await response.status).toBe(404);
      expect(await response.text()).toBe(
        "Error rerendering page http://localhost/invalid-page. Page route not found",
      );
    });

    it("should rerender the page with reactivity", async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: "page", mode: "reactivity" }) +
          SUFFIX_MESSAGE,
      );
      error.name = "rerender";

      const req = getReq();
      const response = await resolveAction({ req, error, component: <div /> });

      expect(response.status).toBe(200);
      expect(req.store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL)).toBe(true);
      expect(response.headers.get("X-Mode")).toBe("reactivity");
      expect(response.headers.get("X-S")).toBe(JSON.stringify([["foo", null]]));
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it('should rerender the page with reactivity and "x-s" store header', async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: "page", mode: "reactivity" }) +
          SUFFIX_MESSAGE,
      );
      error.name = "rerender";

      const req = getReq();

      req.store.set("foo", "bar");

      const response = await resolveAction({ req, error, component: <div /> });

      expect(response.status).toBe(200);
      expect(req.store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL)).toBe(true);
      expect(response.headers.get("X-Mode")).toBe("reactivity");
      expect(response.headers.get("X-S")).toBe(
        JSON.stringify([["foo", "bar"]]),
      );
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it("should rerender the page with transition", async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: "page", mode: "transition" }) +
          SUFFIX_MESSAGE,
      );
      error.name = "rerender";

      const req = getReq();
      const response = await resolveAction({ req, error, component: <div /> });

      expect(response.status).toBe(200);
      expect(req.store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL)).toBe(true);
      expect(response.headers.get("X-Mode")).toBe("transition");
      expect(response.headers.get("X-S")).toBe(JSON.stringify([["foo", null]]));
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });
  });
});
