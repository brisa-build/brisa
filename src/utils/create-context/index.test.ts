import { describe, expect, it } from "bun:test";
import createContext from ".";

describe("utils", () => {
  describe("createContext", () => {
    it("should create a context", () => {
      const context = createContext("foo");
      expect(context.defaultValue).toBe("foo");
      expect(context.id).toBeUndefined();
    });

    it('should create a context with an id of "bar"', () => {
      const context = createContext("foo", "bar");
      expect(context.id).toBe("bar");
    });
  });
});
