import path from "node:path";
import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  jest,
  mock,
} from "bun:test";
import { getConstants } from "@/constants";
import { render, userEvent } from "@/core/test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import runWebComponents from "@/core/test/run-web-components";

const ERROR_STORE_KEY = "__BRISA_ERRORS__";
const BUILD_DIR = path.join(import.meta.dir, "..");

class ErrorEvent extends Event {
  readonly error: Error;
  constructor(type: string, error: Error) {
    super(type);
    this.error = error;
  }
}

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
      const prevErrorBtn = component?.querySelector(
        "nav button:first-child",
      ) as Element;

      expect(dialog).toContainTextContent("Error 2: Another error occurred");

      userEvent.click(prevErrorBtn);

      expect(dialog).toContainTextContent("Error 1: An error occurred");
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

      // Always start with the last error
      expect(dialog).toContainTextContent("Error 2: Another error occurred");

      userEvent.keyboard("ArrowLeft");

      // Go to the first error
      expect(dialog).toContainTextContent("Error 1: An error occurred");
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

    it("should close the dialog using the Escape on the keyboard", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: ["An error occurred"] },
      ]);
      const getDialog = () =>
        container
          .querySelector("brisa-error-dialog")
          ?.shadowRoot?.querySelector("dialog");

      expect(getDialog()).not.toBeNull();

      userEvent.keyboard("Escape");

      expect(getDialog()).toBeNull();
    });

    it("should close the dialog using the Enter on the keyboard and preventDefault", async () => {
      const mockExternalButtonClick = mock();
      const { container, store } = await render(
        // @ts-ignore
        <>
          <brisa-error-dialog></brisa-error-dialog>
          <button>Click</button>
        </>,
      );
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: ["An error occurred"] },
      ]);
      const button = container.querySelector("button")!;
      const getDialog = () =>
        container
          .querySelector("brisa-error-dialog")
          ?.shadowRoot?.querySelector("dialog");

      button.addEventListener("click", (event) =>
        mockExternalButtonClick(event),
      );
      button.focus();

      expect(getDialog()).not.toBeNull();

      userEvent.keyboard("Enter");

      expect(mockExternalButtonClick).not.toHaveBeenCalled();
      expect(getDialog()).toBeNull();
    });

    it('should handle window.addEventListener("error") modifying the store', async () => {
      const { store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );

      expect(store.get(ERROR_STORE_KEY)).toBeEmpty();

      window.dispatchEvent(
        new ErrorEvent("error", new Error("An error occurred")),
      );

      const dialog = document.querySelector("brisa-error-dialog")?.shadowRoot;

      expect(dialog).not.toBeNull();
      expect(store.get(ERROR_STORE_KEY)).toEqual([
        {
          title: "Uncaught Error",
          details: ["An error occurred"],
          stack: expect.stringContaining("Error: An error occurred"),
        },
      ]);
    });

    it("should add URL link to the error stack", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      error.stack =
        "Error: An error occurred\n    at someFunction (http://localhost:3000/somefile.js:1:2)";
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: [error.message], stack: error.stack },
      ]);
      const dialog = component?.querySelector("dialog");
      const hyperlink = dialog?.querySelector("a");

      expect(dialog).toContainTextContent("Error: An error occurred");
      expect(hyperlink).toContainTextContent(
        "http://localhost:3000/somefile.js:1:2",
      );
      expect(hyperlink).toHaveAttribute(
        "ping",
        encodeLink("/somefile.js", 1, 2),
      );
    });

    it("should add file link to the error stack", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      error.stack =
        "Error: An error occurred\n    at someFunction (/Users/someuser/somefile.js:1:2)";
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: [error.message], stack: error.stack },
      ]);
      const dialog = component?.querySelector("dialog");
      const hyperlink = dialog?.querySelector("a");

      expect(dialog).toContainTextContent("Error: An error occurred");
      expect(hyperlink).toContainTextContent("/Users/someuser/somefile.js:1:2");
      expect(hyperlink).toHaveAttribute(
        "ping",
        encodeLink("/Users/someuser/somefile.js", 1, 2),
      );
    });

    it("should not display throwable navigation error", async () => {
      const { container } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );

      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("https://example.com");
      error.name = "navigate:reactivity";

      window.dispatchEvent(new ErrorEvent("error", error));

      const dialog = component?.querySelector("dialog");

      expect(dialog).toBeNull();
    });

    it("should work with windows paths in the error stack", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      error.stack =
        "Error: An error occurred\n    at someFunction (C:\\Users\\someuser\\somefile.js:1:2)";
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: [error.message], stack: error.stack },
      ]);
      const dialog = component?.querySelector("dialog");
      const hyperlink = dialog?.querySelector("a");

      expect(dialog).toContainTextContent("Error: An error occurred");
      expect(hyperlink).toContainTextContent(
        "C:\\Users\\someuser\\somefile.js:1:2",
      );
      expect(hyperlink).toHaveAttribute(
        "ping",
        encodeLink(`C:\\Users\\someuser\\somefile.js`, 1, 2),
      );
    });

    it("should include the documentation link", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      const docLink = "https://brisa.dev/docs/error-handling";
      store.set(ERROR_STORE_KEY, [
        { title: "Error", details: [error.message], docLink },
      ]);
      const dialog = component?.querySelector("dialog");
      const hyperlink = dialog?.querySelector("a");

      expect(hyperlink).toContainTextContent(`📄 Documentation`);
      expect(hyperlink).toHaveAttribute("href", docLink);
      expect(hyperlink).toHaveAttribute("target", "_blank");
    });

    it("should include the documentation link with a title", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      const docLink = "https://brisa.dev/docs/error-handling";
      store.set(ERROR_STORE_KEY, [
        {
          title: "Error",
          details: [error.message],
          docLink,
          docTitle: "Some docs",
        },
      ]);
      const dialog = component?.querySelector("dialog");
      const hyperlink = dialog?.querySelector("a");

      expect(hyperlink).toContainTextContent(`📄 Some docs`);
      expect(hyperlink).toHaveAttribute("href", docLink);
      expect(hyperlink).toHaveAttribute("target", "_blank");
    });

    it("should title be in bold", async () => {
      const { container, store } = await render(
        // @ts-ignore
        <brisa-error-dialog></brisa-error-dialog>,
      );
      const component =
        container.querySelector("brisa-error-dialog")?.shadowRoot;
      const error = new Error("An error occurred");
      store.set(ERROR_STORE_KEY, [
        { title: "Error title", details: [error.message] },
      ]);
      const dialog = component?.querySelector("dialog");
      const titles = dialog?.querySelectorAll("b")!;

      expect(titles).toHaveLength(1);
      expect(titles[0]).toContainTextContent("Error title");
    });
  });
});

function encodeLink(link: string, line: number, column: number) {
  const [pathname] = (URL.canParse(link) ? new URL(link).pathname : link).split(
    ":",
  );
  return `/__brisa_dev_file__?file=${encodeURIComponent(
    pathname,
  )}&line=${line}&column=${column}`;
}
