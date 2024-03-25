import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import path from "node:path";

import extendRequestContext from "../extend-request-context";
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from "../rerender-in-action";
import { getConstants } from "../../constants";
import resolveAction from ".";
import { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from "../ssr-web-component";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");
let mockLog: ReturnType<typeof spyOn>;

const getReq = (url = "http://localhost") =>
  extendRequestContext({
    originalRequest: new Request(url, {
      headers: {
        "x-action": "some-action",
      },
    }),
    store: undefined,
  });

describe("utils", () => {
  describe("resolve-action", () => {
    beforeEach(async () => {
      mockLog = spyOn(console, "log");
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
      mockLog.mockRestore();
      globalThis.mockConstants = undefined;
    });

    it("should return a response with NotFoundError redirect", async () => {
      const error = new Error("Not found");
      error.name = "NotFoundError";

      const req = getReq();
      const response = await resolveAction({ req, error, component: <div /> });

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

    it("should rerender the page with reactivity without declarative shadow DOM", async () => {
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
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it("should rerender the page with reactivity with declarative shadow DOM if is called without JS", async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: "page", mode: "reactivity" }) +
          SUFFIX_MESSAGE,
      );
      error.name = "rerender";

      const req = getReq("http://localhost?_aid=1");
      req.headers.delete("x-action");
      const response = await resolveAction({ req, error, component: <div /> });

      expect(response.status).toBe(200);
      expect(req.store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL)).toBe(false);
      expect(response.headers.get("X-Mode")).toBe("reactivity");
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
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it("should log an error accessing to a field that does not exist in the props", async () => {
      let error = new Error('Field "foo" does not exist in props');

      const req = getReq();
      const response = await resolveAction({ req, error, component: <div /> });

      expect(await response.status).toBe(500);
      expect(await response.text()).toBe('Field "foo" does not exist in props');

      const logs = mockLog.mock.calls.toString();
      expect(logs).toContain("There was an error executing the server action");
      expect(logs).toContain('Field "foo" does not exist in props');
      expect(logs).toContain(
        "Please note that for security reasons Brisa does not automatically",
      );
      expect(logs).toContain(
        "Docs: https://brisa.build/building-your-application/data-fetching/server-actions#props-in-server-actions",
      );
    });
  });
});
