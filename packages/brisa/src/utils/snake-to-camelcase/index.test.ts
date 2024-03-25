import { describe, expect, it } from "bun:test";
import snakeToCamelCase from ".";

describe("utils", () => {
  describe("snakeToCamelcase", () => {
    it("should convert snake case to camel case", () => {
      expect(snakeToCamelCase("some-example")).toBe("someExample");
    });

    it('should remove "-" when there is a number after it', () => {
      expect(snakeToCamelCase("some-example-1")).toBe("someExample1");
    });

    it("should work with upper case letters", () => {
      expect(snakeToCamelCase("some-EXAMPLE-1")).toBe("someExample1");
    });
  });
});
