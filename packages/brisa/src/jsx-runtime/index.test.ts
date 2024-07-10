import { describe, it, expect } from "bun:test";
import { jsx } from ".";

describe("utils", () => {
  describe("jsx (createNode) SERVER", () => {
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
        children: jsx("span", { children: "Hello World" }) as any,
      });

      expect(node).toEqual({
        type: "div",
        props: {
          id: "test",
          children: { type: "span", props: { children: "Hello World" } },
        },
      });
    });

    it('should append the "key" attribute to the props', () => {
      const node = jsx("div", { id: "test", children: "Hello World" }, "key");

      expect(node).toEqual({
        type: "div",
        props: { id: "test", children: "Hello World", key: "key" },
      });
    });
  });
});
