import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import getProviderId from ".";

describe("utils", () => {
  beforeEach(async () => {
    GlobalRegistrator.register();
  });
  afterEach(async () => {
    if (typeof window !== "undefined") GlobalRegistrator.unregister();
  });
  describe("get-provider-id", () => {
    it("should return the provider ID", () => {
      const code = `
        <context-provider pid="foo" cid="bar"><div /></context-provider>
      `;

      document.body.innerHTML = code;

      const div = document.querySelector("div")!;
      const pid = getProviderId(div, "bar");

      expect(pid).toBe("foo");
    });

    it("should return null if the provider ID is not found", async () => {
      const code = `
        <context-provider pid="foo" cid="bar"><div /></context-provider>
      `;

      document.body.innerHTML = code;

      const div = document.querySelector("div")!;
      const pid = getProviderId(div, "baz");

      expect(pid).toBeNull();
      await Bun.sleep(0); // Workaround to fix flaky test in the next test
    });

    it("should return null if there is a provider in another tree", async () => {
      const code = `
        <div />
        <context-provider pid="foo" cid="bar">Test<span /></context-provider>
      `;

      document.body.innerHTML = code;

      const div = document.querySelector("div")!;
      const pid = getProviderId(div, "bar");

      expect(pid).toBeNull();
      await Bun.sleep(0); // Workaround to fix flaky test in the next test
    });

    it("should return the immediate provider ID", () => {
      const code = `
        <context-provider pid="0" cid="0:0">
          <context-provider pid="1" cid="0:0"><div /></context-provider>
        </context-provider>
      `;

      document.body.innerHTML = code;

      const div = document.querySelector("div")!;
      const pid = getProviderId(div, "0:0");

      expect(pid).toBe("1");
    });
  });
});
