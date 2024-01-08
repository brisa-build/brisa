import { describe, it, expect, mock, afterEach } from "bun:test";
import { ServerWebSocket } from "bun";

import extendRequestContext from ".";
import createContext from "@/utils/create-context";
import { contextProvider } from "@/utils/context-provider/server";

describe("brisa core", () => {
  afterEach(() => {
    globalThis.sockets = undefined;
  });
  describe("extend request context", () => {
    it("should extent the request", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      expect(requestContext.route).toEqual(route);
      expect(requestContext.finalURL).toEqual(request.url);
      expect(requestContext.store).toBeInstanceOf(Map);
    });

    it("should work store", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set("foo", "bar");
      expect(requestContext.store.get("foo")).toBe("bar");
    });

    it("should work i18n", () => {
      const mockT = mock(() => "foo");
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        i18n: {
          pages: {},
          locale: "es",
          defaultLocale: "en",
          locales: ["en", "es"],
          t: mockT,
        },
      });

      expect(requestContext.i18n.locale).toBe("es");
      expect(requestContext.i18n.defaultLocale).toBe("en");
      expect(requestContext.i18n.locales).toEqual(["en", "es"]);
      expect(requestContext.i18n.t("some-key")).toBe("foo");
    });

    it("should be linked with websockets", () => {
      const requestId = "some-id";
      const mockSend = mock((m: string | BufferSource) => 1);

      globalThis.sockets = new Map();
      globalThis.sockets.set(requestId, {
        send: (m) => mockSend(m),
      } as ServerWebSocket<unknown>);

      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        id: requestId,
      });

      requestContext.ws.send("some message");

      expect(mockSend).toHaveBeenCalledWith("some message");
    });

    it("should return the default value when the context is not found", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const { useContext } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const context = createContext("foo");
      expect(useContext(context).value).toBe("foo");
    });

    it("should return the provider value when has a context", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const context = createContext("foo");
      const { useContext, store } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const ctx = contextProvider({ context, value: "bar", store });
      expect(useContext(context).value).toBe("bar");
      ctx.clearProvider();
      expect(useContext(context).value).toBe("foo");
    });

    it("should return the last provider value when has multiple providers", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const context = createContext("foo");
      const { useContext, store } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const ctxParent = contextProvider({
        context,
        value: "bar",
        store,
      });
      const ctxChild = contextProvider({
        context,
        value: "baz",
        store,
      });
      expect(useContext(context).value).toBe("baz");
      ctxChild.clearProvider();
      expect(useContext(context).value).toBe("bar");
      ctxParent.clearProvider();
      expect(useContext(context).value).toBe("foo");
    });

    it("should transferToClient works", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set("foo", "bar");
      requestContext.store.set("baz", "qux");
      requestContext.store.transferToClient(["foo"]);
      expect((requestContext as any).webStore.get("foo")).toBe("bar");
      expect((requestContext as any).webStore.get("baz")).toBe(undefined);
    });
  });
});
