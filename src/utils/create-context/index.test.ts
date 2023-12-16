import { describe, expect, it } from "bun:test";
import createContext from ".";

describe("utils", () => {
  describe("createContext", () => {
    it("should create a context", () => {
      const context = createContext("foo");
      expect(context.defaultValue).toBe("foo");
      expect(context.id).toBeTypeOf("symbol");
    });
  });
});
