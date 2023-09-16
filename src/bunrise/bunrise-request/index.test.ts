import { describe, it, expect } from "bun:test";
import BunriseRequest from ".";

describe("bunrise core", () => {
  describe("BunriseRequest", () => {
    it("should create a new BunriseRequest", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const bunriseRequest = new BunriseRequest(request, route);
      expect(bunriseRequest.route).toEqual(route);
      expect(bunriseRequest.url).toEqual(request.url);
      expect(bunriseRequest.context).toBeInstanceOf(Map);
    });

    it("should work context", () => {
      const request = new Request("https://example.com");
      const route = {
        path: "/",
      } as any;
      const bunriseRequest = new BunriseRequest(request, route);
      bunriseRequest.context.set("foo", "bar");
      expect(bunriseRequest.context.get("foo")).toBe("bar");
    });
  });
});
