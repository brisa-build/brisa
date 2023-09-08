import { describe, it, expect, mock } from "bun:test";
import getRootDir from "./get-root-dir";
import logTable from "./log-table";
import byteSizeToString from "./byte-size-to-string";

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
