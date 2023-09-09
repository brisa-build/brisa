import { describe, it, expect, mock } from "bun:test";
import logTable from ".";

describe("utils", () => {
  describe("logTable", () => {
    it("should log a table", () => {
      const data = [
        { name: "John", age: "23" },
        { name: "Jane", age: "42" },
      ];

      const expected = [
        "name | age",
        "------------",
        "John | 23",
        "Jane | 42",
      ].join("\n");

      const mockLog = mock((v) => v);

      console.log = mockLog;

      logTable(data);
      expect(mockLog.mock.results[0].value).toBe(expected);
    });
  });
});
