import { describe, expect, it } from "bun:test";
import navigate from ".";

describe("utils", () => {
  describe("navigate", () => {
    it("should throw a navigation", () => {
      expect(() => navigate("/some")).toThrow("/some");
    });
  });
});
