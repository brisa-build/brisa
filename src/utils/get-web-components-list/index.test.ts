import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import path from "node:path";
import getWebComponentsList from ".";
import getConstants from "../../constants";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");
const { LOG_PREFIX } = getConstants();
const originalConsoleLog = console.log;
const mockConsoleLog = mock((v) => v) as any;

describe("utils", () => {
  describe("getWebComponentsList", () => {
    beforeEach(() => {
      console.log = mockConsoleLog;
    });
    afterEach(() => {
      console.log = originalConsoleLog;
    });

    it("should return a list of web components", async () => {
      const result = await getWebComponentsList(fixturesDir);

      expect(result).toEqual({
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "@native",
          "some-example.tsx"
        ),
        "web-component": path.join(
          fixturesDir,
          "web-components",
          "web",
          "component.tsx"
        ),
      });
    });

    it("should alert if there is a web component with the same name, taking one the first one", async () => {
      await getWebComponentsList(fixturesDir);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        "Ops! Error:",
      ]);
      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);
      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        'You have more than one web-component with the same name: "web-component"',
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        "Please, rename one of them to avoid conflicts.",
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);
    });
  });
});
