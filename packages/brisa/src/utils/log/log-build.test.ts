import { describe, it, expect, mock, afterEach, spyOn } from "bun:test";
import { logTable, logError } from "./log-build";
import { getConstants } from "@/constants";
import extendRequestContext from "@/utils/extend-request-context";
import type { RequestContext } from "@/types";

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

  describe("logError", () => {
    it("should log an error", () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost"),
      });
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, "log").mockImplementation((f, s) => mockLog(f, s));

      const messages = ["Error message 1", "Error message 2"];
      const docTitle = "Footer message";
      const docLink = "https://example.com";
      const stack = "Error stack";

      logError({ messages, docTitle, docLink, req, stack });

      const output = mockLog.mock.results.map((t) => t.value).join("\n");
      const store = (req as any).webStore as RequestContext["store"];

      expect(output).toContain("Error message 1");
      expect(output).toContain("Error message 2");
      expect(output).toContain("Footer message");
      expect(output).toContain("https://example.com");
      expect(output).toContain("Error stack");
      expect(store.get("__BRISA_ERRORS__")).toHaveLength(1);
      expect(store.get("__BRISA_ERRORS__")[0].title).toBe("Error message 1");
    });
  });
});
