import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import byteSizeToString from ".";

describe("utils", () => {
  beforeEach(() => {
    mock.module("@/utils/log/log-colors", () => ({
      greenLog: (v: string) => `\x1b[32m${v}\x1b[0m`,
      yellowLog: (v: string) => `\x1b[33m${v}\x1b[0m`,
      redLog: (v: string) => `\x1b[31m${v}\x1b[0m`,
    }));
  });

  afterEach(() => {
    mock.restore();
  });

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

    it("should display the green color for 0 B", () => {
      const input = 0;
      const output = byteSizeToString(input, 0, true);
      const expected = "\x1b[32m0 B\x1b[0m";

      expect(output).toBe(expected);
    });

    it("should display the yellow color for more than 70 kB", () => {
      const input = 70001;
      const output = byteSizeToString(input, 0, true);
      const expected = "\x1b[33m70 kB\x1b[0m";

      expect(output).toBe(expected);
    });

    it("should display the red color for more than 100 kB", () => {
      const input = 100001;
      const output = byteSizeToString(input, 0, true);
      const expected = "\x1b[31m100 kB\x1b[0m";

      expect(output).toBe(expected);
    });
  });
});
