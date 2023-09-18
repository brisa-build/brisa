import { describe, it, expect } from "bun:test";
import RequestContext from ".";

describe("bunrise core", () => {
  describe("RequestContext", () => {
    it("should create a new RequestContext", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = new RequestContext(request, route);
      expect(requestContext.route).toEqual(route);
      expect(requestContext.url).toEqual(request.url);
      expect(requestContext.context).toBeInstanceOf(Map);
    });

    it("should work context", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const requestContext = new RequestContext(request, route);
      requestContext.context.set("foo", "bar");
      expect(requestContext.context.get("foo")).toBe("bar");
    });
  });
});
