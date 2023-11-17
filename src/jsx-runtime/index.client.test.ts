import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { jsx, jsxDEV, Fragment } from ".";

describe("utils", () => {
  describe("jsx (createNode) CLIENT", () => {
    beforeAll(() => {
      GlobalRegistrator.register();
    });
    afterAll(() => {
      GlobalRegistrator.unregister();
    });

    it("should convert to string node in client-side", () => {
      const node = jsx("div", { id: "test", children: "Hello World" });

      expect(typeof node).toBe("object");
      expect(node?.toString?.()).toBe('<div id="test">Hello World</div>');
    });

    it("should convert a nested node to string node in client-side", () => {
      const node = jsx("div", {
        id: "test",
        children: jsx("span", { children: "Hello World" }) as any,
      });
      expect(typeof node).toBe("object");
      expect(node?.toString?.()).toBe(
        '<div id="test"><span>Hello World</span></div>'
      );
    });

    it("should convert a nested fragment to string node in client-side", () => {
      const node = jsxDEV(Fragment as any, {
        children: [
          jsxDEV("h1", {
            children: "Hello",
          }) as any,
          "World",
        ],
      });

      expect(node).toBe("<h1>Hello</h1>World");
    });
  });
});
