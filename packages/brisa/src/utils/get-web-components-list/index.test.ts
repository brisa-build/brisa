import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
  type Mock,
} from "bun:test";
import path from "node:path";
import getWebComponentsList from ".";
import { getConstants } from "@/constants";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");
const reservedNamesDir = path.join(fixturesDir, "reserved-names");
const { LOG_PREFIX } = getConstants();
let mockConsoleLog: Mock<typeof console.log>;

describe("utils", () => {
  describe("getWebComponentsList", () => {
    beforeEach(() => {
      mockConsoleLog = spyOn(console, "log");
    });
    afterEach(() => {
      mockConsoleLog.mockClear();
    });

    it("should return a list of web components", async () => {
      const result = await getWebComponentsList(fixturesDir);

      expect(result).toEqual({
        "custom-counter": path.join(
          fixturesDir,
          "web-components",
          "custom-counter.tsx",
        ),
        "custom-slot": path.join(
          fixturesDir,
          "web-components",
          "custom-slot.tsx",
        ),
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "_native",
          "some-example.tsx",
        ),
        "web-component": path.join(
          fixturesDir,
          "web-components",
          "web",
          "component.tsx",
        ),
        "with-context": path.join(
          fixturesDir,
          "web-components",
          "with-context.tsx",
        ),
        "with-link": path.join(fixturesDir, "web-components", "with-link.tsx"),
      });
    });

    it("should return a list of web components with integrations", async () => {
      const integrationsPath = path.join(
        fixturesDir,
        "web-components",
        "_integrations.tsx",
      );
      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        "custom-counter": path.join(
          fixturesDir,
          "web-components",
          "custom-counter.tsx",
        ),
        "custom-slot": path.join(
          fixturesDir,
          "web-components",
          "custom-slot.tsx",
        ),
        "foo-component": path.join(fixturesDir, "lib", "foo.tsx"),
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "_native",
          "some-example.tsx",
        ),
        "web-component": path.join(
          fixturesDir,
          "web-components",
          "web",
          "component.tsx",
        ),
        "with-context": path.join(
          fixturesDir,
          "web-components",
          "with-context.tsx",
        ),
        "with-link": path.join(fixturesDir, "web-components", "with-link.tsx"),
      });
    });

    it("should return a list of web components without integrations because the integrationsPath does not have an export default", async () => {
      const integrationsPath = path.join(
        fixturesDir,
        "web-components",
        "_integrations2.tsx",
      );
      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        "custom-counter": path.join(
          fixturesDir,
          "web-components",
          "custom-counter.tsx",
        ),
        "custom-slot": path.join(
          fixturesDir,
          "web-components",
          "custom-slot.tsx",
        ),
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "_native",
          "some-example.tsx",
        ),
        "web-component": path.join(
          fixturesDir,
          "web-components",
          "web",
          "component.tsx",
        ),
        "with-context": path.join(
          fixturesDir,
          "web-components",
          "with-context.tsx",
        ),
        "with-link": path.join(fixturesDir, "web-components", "with-link.tsx"),
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

    it("should alert if there is a web component with the same name as a reserved name", async () => {
      await getWebComponentsList(reservedNamesDir);

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
        `You can't use the reserved name "context-provider"`,
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        "Please, rename it to avoid conflicts.",
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);
    });
  });
});
