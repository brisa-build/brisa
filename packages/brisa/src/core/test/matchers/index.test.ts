import { expect, describe, it, beforeEach, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import matchers from "@/core/test/matchers";
import type { BrisaTestMatchers } from "@/types";

expect.extend<BrisaTestMatchers>(matchers);

describe("test matchers", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });
  afterEach(() => {
    GlobalRegistrator.unregister();
  });

  describe("toBeChecked", () => {
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

  describe("toHaveTagName", () => {
    it("should pass if the element has the tag name", () => {
      const div = document.createElement("div");

      expect(div).toHaveTagName("div");
    });

    it("should pass if the element has the tag name in uppercase", () => {
      const div = document.createElement("div");

      expect(div).toHaveTagName("DIV");
    });

    it("should fail if the element does not have the tag name", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveTagName("span")).toThrowError(
        "expected element to have tag name span",
      );
    });
  });

  describe("toHaveRenderedText", () => {
    it("should pass if the element has the rendered text", () => {
      const div = document.createElement("div");
      div.textContent = "test";

      expect(div).toHaveRenderedText("test");
    });

    it("should pass if the element contains the rendered text in a nested element", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "test";
      div.appendChild(span);

      expect(div).toContainRenderedText("test");
    });

    it("should fail if the element does not have the rendered text", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveRenderedText("test")).toThrowError(
        "expected element to have rendered text test",
      );
    });
  });

  describe("toContainRenderedText", () => {
    it("should pass if the element contains the rendered text", () => {
      const div = document.createElement("div");
      div.textContent = "test";

      expect(div).toContainRenderedText("test");
    });

    it("should pass if the element contains the rendered text in a long phrase", () => {
      const div = document.createElement("div");
      div.textContent = "this is a long phrase with test in it";

      expect(div).toContainRenderedText("test");
    });

    it("should pass if the element contains the rendered text in a nested element", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "test";
      div.appendChild(span);

      expect(div).toContainRenderedText("test");
    });

    it("should pass if the element contains the rendered text in a nested element in a long phrase", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "this is a long phrase with test in it";
      div.appendChild(span);

      expect(div).toContainRenderedText("test");
    });

    it("should fail if the element does not contain the rendered text", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toContainRenderedText("test")).toThrowError(
        "expected element to contain rendered text test",
      );
    });
  });

  describe("toHaveStyle", () => {
    it("should pass if the element has the style", () => {
      const div = document.createElement("div");
      div.style.color = "red";

      expect(div).toHaveStyle("color", "red");
    });

    it("should fail if the element does not have the style", () => {
      const div = document.createElement("div");
      div.style.color = "red";

      expect(() => expect(div).toHaveStyle("color", "blue")).toThrowError(
        "expected element to have style color with value blue",
      );
    });
  });
});
