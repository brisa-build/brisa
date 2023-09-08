import { describe, it, expect, spyOn, mock } from "bun:test";
import getRootDir from "./get-root-dir";
import logTable from "./log-table";

describe("utils", () => {
  describe("getRootDir", () => {
    it("should return the root directory", () => {
      const input = "some/project/node_modules/bunrise/out/";
      const output = getRootDir(input);
      const expected = "some/project";

      expect(output).toBe(expected);
    });
  });
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
