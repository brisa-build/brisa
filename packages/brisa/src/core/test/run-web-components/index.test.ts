import { expect, describe, it, beforeEach, afterEach, spyOn } from "bun:test";
import constants, { getConstants } from "@/constants";
import { join } from "node:path";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import runWebComponents from "@/core/test/run-web-components";

const BUILD_DIR = join(import.meta.dir, "..", "..", "..", "__fixtures__");

describe("runWebComponents", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
    globalThis.mockConstants = {
      ...getConstants(),
      SRC_DIR: BUILD_DIR,
      BUILD_DIR: BUILD_DIR,
    };
  });
  afterEach(() => {
    globalThis.mockConstants = undefined;
    GlobalRegistrator.unregister();
  });

  it("should transform JSX to web components and define them to the document", async () => {
    expect(customElements.get("custom-counter")).not.toBeDefined();
    expect(customElements.get("custom-slot")).not.toBeDefined();
    expect(customElements.get("web-component")).not.toBeDefined();
    expect(customElements.get("native-some-example")).not.toBeDefined();
    expect(customElements.get("with-context")).not.toBeDefined();
    expect(customElements.get("with-link")).not.toBeDefined();
    expect(customElements.get("foo-component")).not.toBeDefined();
    await runWebComponents();
    expect(customElements.get("custom-counter")).toBeDefined();
    expect(customElements.get("custom-slot")).toBeDefined();
    expect(customElements.get("web-component")).toBeDefined();
    expect(customElements.get("native-some-example")).toBeDefined();
    expect(customElements.get("with-context")).toBeDefined();
    expect(customElements.get("with-link")).toBeDefined();
    expect(customElements.get("foo-component")).toBeDefined();
  });

  it("should NOT log and early return if there is no web components", async () => {
    const logSpy = spyOn(console, "log");
    globalThis.mockConstants = {
      ...getConstants(),
      SRC_DIR: join(BUILD_DIR, "no-web-components"),
      BUILD_DIR: join(BUILD_DIR, "no-web-components"),
    };
    await runWebComponents();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
