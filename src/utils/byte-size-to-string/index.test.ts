import { describe, it, expect } from "bun:test";
import byteSizeToString from ".";

describe("utils", () => {
  describe("byteSizeToString", () => {
    it("should return 0 B for 0", () => {
      const input = 0;
      const output = byteSizeToString(input);
      const expected = "0 B";

      expect(output).toBe(expected);
    });
    it("should return the correct kB string", () => {
      const input = 1000;
      const output = byteSizeToString(input);
      const expected = "1.00 kB";

      expect(output).toBe(expected);
    });

    it("should return the correct MB string without decimals", () => {
      const input = 1000000;
      const decimals = 0;
      const output = byteSizeToString(input, decimals);
      const expected = "1 MB";

      expect(output).toBe(expected);
    });

    it("should return the correct GB string", () => {
      const input = 1000000000;
      const output = byteSizeToString(input);
      const expected = "1.00 GB";

      expect(output).toBe(expected);
    });
  });
});
