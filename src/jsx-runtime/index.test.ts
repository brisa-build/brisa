import { describe, it, expect, beforeEach } from "bun:test";
import { jsx } from ".";

describe("utils", () => {
  beforeEach(() => {
    globalThis.window = undefined as any;
  });

  describe("jsx (createNode)", () => {
    it("should convert to object node in server-side", () => {
      const node = jsx("div", { id: "test", children: "Hello World" });

      expect(node).toEqual({
        type: "div",
        props: { id: "test", children: "Hello World" },
      });
    });

    it("should convert a nested node to object node in server-side", () => {
      const node = jsx("div", {
        id: "test",
        children: jsx("span", { children: "Hello World" }),
      });

      expect(node).toEqual({
        type: "div",
        props: {
          id: "test",
          children: { type: "span", props: { children: "Hello World" } },
        },
      });
    });

    it("should convert to string node in client-side", () => {
      globalThis.window = {} as any;
      const node = jsx("div", { id: "test", children: "Hello World" });

      expect(node).toBe('<div id="test">Hello World</div>');
    });

    it("should convert a nested node to string node in client-side", () => {
      globalThis.window = {} as any;
      const node = jsx("div", {
        id: "test",
        children: jsx("span", { children: "Hello World" }),
      });

      expect(node).toBe('<div id="test"><span>Hello World</span></div>');
    });
  });
});
