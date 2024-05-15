import { expect, describe, it, beforeEach, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

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

    it("should pass if the element has the attribute specifing the attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("data-test", "test");

      expect(div).toHaveAttribute("data-test", "test");
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

  describe("toHaveTextContent", () => {
    it("should pass if the element has the rendered text", () => {
      const div = document.createElement("div");
      div.textContent = "test";

      expect(div).toHaveTextContent("test");
    });

    it("should pass if the element contains the rendered text in a nested element", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "test";
      div.appendChild(span);

      expect(div).toContainTextContent("test");
    });

    it("should pass if the element is a documentFragment", () => {
      const fragment = document.createDocumentFragment();
      const div = document.createElement("div");
      div.textContent = "test";
      fragment.appendChild(div);

      expect(fragment).toHaveTextContent("test");
    });

    it("should pass if the element is ShadowRoot", () => {
      const div = document.createElement("div");
      const shadowRoot = div.attachShadow({ mode: "open" });
      const span = document.createElement("span");
      span.textContent = "test";
      shadowRoot.appendChild(span);

      expect(shadowRoot).toHaveTextContent("test");
    });

    it("should fail if the element does not have the rendered text", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveTextContent("test")).toThrowError(
        "expected element to have rendered text test",
      );
    });
  });

  describe("toContainTextContent", () => {
    it("should pass if the element contains the rendered text", () => {
      const div = document.createElement("div");
      div.textContent = "test";

      expect(div).toContainTextContent("test");
    });

    it("should pass if the element contains the rendered text in a long phrase", () => {
      const div = document.createElement("div");
      div.textContent = "this is a long phrase with test in it";

      expect(div).toContainTextContent("test");
    });

    it("should pass if the element is ShadowRoot", () => {
      const div = document.createElement("div");
      const shadowRoot = div.attachShadow({ mode: "open" });
      const span = document.createElement("span");
      span.textContent = "test";
      shadowRoot.appendChild(span);

      expect(shadowRoot).toContainTextContent("test");
    });

    it("should pass if the element is a documentFragment", () => {
      const fragment = document.createDocumentFragment();
      const div = document.createElement("div");
      div.textContent = "test";
      fragment.appendChild(div);

      expect(fragment).toContainTextContent("test");
    });

    it("should pass if the element contains the rendered text in a nested element", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "test";
      div.appendChild(span);

      expect(div).toContainTextContent("test");
    });

    it("should pass if the element contains the rendered text in a nested element in a long phrase", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.textContent = "this is a long phrase with test in it";
      div.appendChild(span);

      expect(div).toContainTextContent("test");
    });

    it("should fail if the element does not contain the rendered text", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toContainTextContent("test")).toThrowError(
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

  describe("toHaveClass", () => {
    it("should pass if the element has the class", () => {
      const div = document.createElement("div");
      div.classList.add("test");

      expect(true).toBe(true);
      expect(div).toHaveClass("test");
    });

    it("should fail if the element does not have the class", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveClass("test")).toThrowError(
        "expected element to have class test",
      );
    });
  });

  describe("toHaveValue", () => {
    it("should pass if the input has the value", () => {
      const input = document.createElement("input");
      input.value = "test";

      expect(input).toHaveValue("test");
    });

    it("should fail if the input does not have the value", () => {
      const input = document.createElement("input");

      expect(() => expect(input).toHaveValue("test")).toThrowError(
        "expected input element to have value test",
      );
    });

    it("should fail when the received is not an input element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveValue("test")).toThrowError(
        "Invalid usage of toHaveValue(received, value). The argument received should be an HTMLInputElement",
      );
    });
  });

  describe("toHaveFocus", () => {
    it("should pass if the element has focus", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      expect(input).toHaveFocus();
    });

    it("should fail if the element does not have focus", () => {
      const input = document.createElement("input");

      expect(() => expect(input).toHaveFocus()).toThrowError(
        "expected element to have focus",
      );
    });

    it("should fail when the received is not an element", () => {
      expect(() => expect("foo").toHaveFocus()).toThrowError(
        "Invalid usage of toHaveFocus(received). The argument received should be an HTMLElement",
      );
    });
  });

  describe("toBeVisible", () => {
    it("should pass if the element is visible", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      expect(div).toBeVisible();
    });

    it("should fail if the element offsetParent is null", () => {
      const div = document.createElement("div");
      // @ts-ignore offsetParent is readonly but we need to set
      // it to null for the test
      div.offsetParent = null;

      expect(() => expect(div).toBeVisible()).toThrowError(
        "expected element to be visible",
      );
    });

    it("should fail if the element is not visible", () => {
      const div = document.createElement("div");
      div.style.display = "none";
      document.body.appendChild(div);

      expect(() => expect(div).toBeVisible()).toThrowError(
        "expected element to be visible",
      );
    });

    it("should fail when the received is not an element", () => {
      expect(() => expect("foo").toBeVisible()).toThrowError(
        "Invalid usage of toBeVisible(received). The argument received should be an HTMLElement",
      );
    });
  });

  describe("toBeEnabled", () => {
    it("should pass if the element is enabled", () => {
      const button = document.createElement("button");

      expect(button).toBeEnabled();
    });

    it("should fail if the element is disabled", () => {
      const button = document.createElement("button");
      button.setAttribute("disabled", "");

      expect(() => expect(button).toBeEnabled()).toThrowError(
        "expected element to be enabled",
      );
    });

    it("should fail when the received is not an element", () => {
      expect(() => expect("foo").toBeEnabled()).toThrowError(
        "Invalid usage of toBeEnabled(received). The argument received should be an HTMLElement",
      );
    });
  });

  describe("toBeDisabled", () => {
    it("should pass if the element is disabled", () => {
      const button = document.createElement("button");
      button.setAttribute("disabled", "");

      expect(button).toBeDisabled();
    });

    it("should fail if the element is enabled", () => {
      const button = document.createElement("button");

      expect(() => expect(button).toBeDisabled()).toThrowError(
        "expected element to be disabled",
      );
    });

    it("should fail when the received is not an element", () => {
      expect(() => expect("foo").toBeDisabled()).toThrowError(
        "Invalid usage of toBeDisabled(received). The argument received should be an HTMLElement",
      );
    });
  });

  describe("toBeSelected", () => {
    it("should pass if the element is selected", () => {
      const option = document.createElement("option");
      option.selected = true;

      expect(option).toBeSelected();
    });

    it("should fail if the element is not selected", () => {
      const option = document.createElement("option");

      expect(() => expect(option).toBeSelected()).toThrowError(
        "expected element to be selected",
      );
    });

    it("should fail when the received is not an option element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeSelected()).toThrowError(
        "Invalid usage of toBeSelected(received). The argument received should be an HTMLOptionElement",
      );
    });
  });

  describe("toBeRequired", () => {
    it("should pass if the element is required", () => {
      const input = document.createElement("input");
      input.required = true;

      expect(input).toBeRequired();
    });

    it("should fail if the element is not required", () => {
      const input = document.createElement("input");

      expect(() => expect(input).toBeRequired()).toThrowError(
        "expected input element to be required",
      );
    });

    it("should fail when the received is not an input element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeRequired()).toThrowError(
        "Invalid usage of toBeRequired(received). The argument received should be an HTMLInputElement",
      );
    });
  });

  describe("toBeValid", () => {
    it("should pass if the element is valid", () => {
      const input = document.createElement("input");

      expect(input).toBeValid();
    });

    it("should fail if the element is not valid", () => {
      const input = document.createElement("input");
      input.setCustomValidity("test");

      expect(() => expect(input).toBeValid()).toThrowError(
        "expected input element to be valid",
      );
    });

    it("should fail when the received is not an input element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeValid()).toThrowError(
        "Invalid usage of toBeValid(received). The argument received should be an HTMLInputElement",
      );
    });
  });

  describe("toBeInvalid", () => {
    it("should pass if the element is invalid", () => {
      const input = document.createElement("input");
      input.setCustomValidity("test");

      expect(input).toBeInvalid();
    });

    it("should fail if the element is valid", () => {
      const input = document.createElement("input");

      expect(() => expect(input).toBeInvalid()).toThrowError(
        "expected input element to be invalid",
      );
    });

    it("should fail when the received is not an input element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeInvalid()).toThrowError(
        "Invalid usage of toBeInvalid(received). The argument received should be an HTMLInputElement",
      );
    });
  });

  describe("toBeInputTypeOf", () => {
    it("should pass if the element is of the given type as text", () => {
      const input = document.createElement("input");
      input.type = "text";

      expect(input).toBeInputTypeOf("text");
    });

    it("should pass if the element is of the given type as number", () => {
      const input = document.createElement("input");
      input.type = "number";

      expect(input).toBeInputTypeOf("number");
    });

    it("should pass if the element is of the given type as email", () => {
      const input = document.createElement("input");
      input.type = "email";

      expect(input).toBeInputTypeOf("email");
    });

    it("should fail if the element is not of the given type", () => {
      const input = document.createElement("input");
      input.type = "text";

      expect(() => expect(input).toBeInputTypeOf("number")).toThrowError(
        "expected input element to be of type number",
      );
    });

    it("should fail when the received is not an input element", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeInputTypeOf("text")).toThrowError(
        "Invalid usage of toBeInputType(received, type). The argument received should be an HTMLInputElement",
      );
    });
  });

  describe("toBeInTheDocument", () => {
    it("should pass if the element is in the document body", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      expect(div).toBeInTheDocument();
    });

    it("should pass if the element is in the document head", () => {
      const link = document.createElement("link");
      document.head.appendChild(link);

      expect(link).toBeInTheDocument();
    });

    it("should fail if the element is not in the document", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toBeInTheDocument()).toThrowError(
        "expected element to be in the document",
      );
    });

    it("should fail when the received is not an element", () => {
      expect(() => expect("foo").toBeInTheDocument()).toThrowError(
        "Invalid usage of toBeInTheDocument(received). The argument received should be an HTMLElement",
      );
    });
  });

  describe("toHaveElementByNodeName", () => {
    it("should pass if the element has an element with the given node name", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      div.appendChild(span);

      expect(div).toHaveElementByNodeName("span");
    });

    it("should fail if the element does not have an element with the given node name", () => {
      const div = document.createElement("div");

      expect(() => expect(div).toHaveElementByNodeName("span")).toThrowError(
        "expected element to have span",
      );
    });
  });
});
