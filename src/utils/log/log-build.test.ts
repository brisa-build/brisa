import { describe, it, expect, mock, afterEach, spyOn } from "bun:test";
import { logTable } from "./log-build";
import { getConstants } from "@/constants";

describe("utils", () => {
  describe("logTable", () => {
    afterEach(() => {
      mock.restore();
    });

    it("should log a table", () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, "log").mockImplementation((f, s) => mockLog(f, s));

      const info = getConstants().LOG_PREFIX.INFO;
      const data = [
        { name: "John", age: "23" },
        { name: "Jane", age: "42" },
      ];

      const expected =
        `${info}\n` +
        [" name | age", " -------------", " John | 23 ", " Jane | 42 "]
          .map((t) => info + t)
          .join("\n");

      logTable(data);

      const output = mockLog.mock.results.map((t) => t.value).join("\n");

      expect(output).toBe(expected);
    });
  });
});
