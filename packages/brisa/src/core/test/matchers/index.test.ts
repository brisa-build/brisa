import { expect, describe, it, beforeEach, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import matchers from "@/core/test/matchers";
import type { BrisaTestMatchers } from "@/types";

expect.extend<BrisaTestMatchers>(matchers);

describe("matchers", () => {
  describe("toBeChecked", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
    });
    afterEach(() => {
      GlobalRegistrator.unregister();
    });

    it("should pass if the input is checked", () => {
      const input = document.createElement("input");
      input.checked = true;

      expect(input).toBeChecked();
    });

    it("should fail if the input is not checked", () => {
      const input = document.createElement("input");
      input.checked = false;

      expect(() => expect(input).toBeChecked()).toThrowError(
        "expected input element to be checked",
      );
    });
  });

  describe("toHaveAttribute", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
    });
    afterEach(() => {
      GlobalRegistrator.unregister();
    });

    it("should pass if the element has the attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("data-test", "test");

      expect(div).toHaveAttribute("data-test");
    });

    it("should fail if the element does not have the attribute", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveAttribute("data-test")).toThrowError(
        "expected element to have attribute data-test",
      );
    });
  });
});
