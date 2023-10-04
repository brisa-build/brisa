import { describe, it, expect } from "bun:test";
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
      expect(requestContext.finalURL).toEqual(request.finalURL);
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
  });
});
