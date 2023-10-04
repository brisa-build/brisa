import { describe, it, expect, mock } from "bun:test";
import extendRequestContext from ".";

describe("brisa core", () => {
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
      expect(requestContext.context).toBeInstanceOf(Map);
    });

    it("should work context", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.context.set("foo", "bar");
      expect(requestContext.context.get("foo")).toBe("bar");
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
      globalThis.ws = { send: mock(() => "some message") } as any;
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });

      expect(requestContext.ws.send()).toBe("some message");
    });
  });
});
