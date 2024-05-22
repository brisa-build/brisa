import path from "node:path";
import { describe, expect, it, beforeEach, afterEach, jest } from "bun:test";
import { getConstants } from "@/constants";
import { render, userEvent } from "@/core/test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import runWebComponents from "@/core/test/run-web-components";

const ERROR_STORE_KEY = "__BRISA_ERRORS__";
const BUILD_DIR = path.join(import.meta.dir, "..");

describe("utils", () => {
  beforeEach(async () => {
    globalThis.REGISTERED_ACTIONS = [];
    if (typeof window === "undefined") {
      GlobalRegistrator.register();
    }
    globalThis.mockConstants = {
      ...getConstants(),
      BUILD_DIR,
      SRC_DIR: BUILD_DIR,
    };
    await runWebComponents();
  });
  afterEach(() => {
    GlobalRegistrator.unregister();
    globalThis.mockConstants = undefined;
    jest.restoreAllMocks();
  });
  describe("brisa-error-dialog web component", () => {
    it("should render the component", async () => {
      const { container } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const dialog = component?.querySelector("dialog");
      expect(component).toBeDefined();
      expect(dialog).toBeNull();
    });

    it("should render the component with errors", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: ["An error occurred"] },
      ]);
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const dialog = component?.querySelector("dialog");

      expect(component).toBeDefined();
      expect(dialog).toContainTextContent("Error: An error occurred");
    });

    it("should render the component with multiple errors", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error 1", details: ["An error occurred"] },
        { title: "Error 2", details: ["Another error occurred"] },
      ]);
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const dialog = component?.querySelector("dialog");
      const nextErrorBtn = component?.querySelector(
        "nav button:last-child",
      ) as Element;

      expect(dialog).toContainTextContent("Error 1: An error occurred");

      userEvent.click(nextErrorBtn);

      expect(dialog).toContainTextContent("Error 2: Another error occurred");
    });

    it("should be possible to navigation using the keyboard to see multiple errors", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error 1", details: ["An error occurred"] },
        { title: "Error 2", details: ["Another error occurred"] },
      ]);
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const dialog = component?.querySelector("dialog");

      expect(dialog).toContainTextContent("Error 1: An error occurred");

      userEvent.keyboard("ArrowRight");

      expect(dialog).toContainTextContent("Error 2: Another error occurred");
    });

    it("should close the dialog using the button", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: ["An error occurred"] },
      ]);
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const closeBtn = component?.querySelector("button.close-dialog")!;
      const dialog = component?.querySelector("dialog");

      expect(component).toBeDefined();
      expect(dialog).not.toBeNull();

      userEvent.click(closeBtn);

      expect(dialog).not.toBeNull();
    });

    it("should close the dialog using the keyboard", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: ["An error occurred"] },
      ]);
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const dialog = component?.querySelector("dialog");

      expect(component).toBeDefined();
      expect(dialog).not.toBeNull();

      userEvent.keyboard("Escape");

      expect(dialog).not.toBeNull();
    });

    it('should handle window.addEventListener("error") modifying the store', async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;

      expect(store.get(ERROR_STORE_KEY)).toBeEmpty();

      window.dispatchEvent(
        new ErrorEvent("error", {
          message: "An error occurred",
          error: new Error("An error occurred"),
        }),
      );

      expect(store.get(ERROR_STORE_KEY)).toEqual([
        {
          title: "Uncaught Error",
          details: ["An error occurred"],
          stack: expect.stringContaining("Error: An error occurred"),
        },
      ]);
    });
  });
});
