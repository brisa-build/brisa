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
      const expected = {
        route,
        context: new Map<string, any>(),
      };
      expect(bunriseRequest).toEqual(expected);
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
