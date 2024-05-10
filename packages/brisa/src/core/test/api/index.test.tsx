import path from "node:path";
import { debug, render, serveRoute, waitFor } from "@/core/test/api";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
} from "bun:test";
import { getConstants } from "@/constants";
import { blueLog, cyanLog, greenLog } from "@/utils/log/log-color";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");

describe("test api", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });
  afterEach(() => {
    GlobalRegistrator.unregister();
    jest.restoreAllMocks();
  });
  describe("render", () => {
    it("should render the element", async () => {
      function Foo() {
        return (
          <>
            <div>Foo</div>
            <span>Bar</span>
          </>
        );
      }
      const { container } = await render(<Foo />);
      expect(container.innerHTML).toBe("<div>Foo</div><span>Bar</span>");
      expect(container).toContainTextContent("Foo");
      expect(container).toContainTextContent("Bar");
    });

    it("should render the element with children", async () => {
      function Foo({ children }: { children: string }) {
        return <div>{children}</div>;
      }
      const { container } = await render(<Foo children="Foo" />);
      expect(container.innerHTML).toBe("<div>Foo</div>");
      expect(container).toContainTextContent("Foo");
    });

    it("should render the element with props", async () => {
      function Foo({ foo }: { foo: string }) {
        return <div>{foo}</div>;
      }
      const { container } = await render(<Foo foo="Foo" />);
      expect(container.innerHTML).toBe("<div>Foo</div>");
      expect(container).toContainTextContent("Foo");
    });

    it("should append the container to the document.body by default", async () => {
      function Foo() {
        return <div>Foo</div>;
      }
      const { container } = await render(<Foo />);
      expect(document.documentElement.contains(container)).toBeTrue();
    });

    it("should append the container to a baseElement", async () => {
      function Foo() {
        return <div>Foo</div>;
      }
      const parent = document.createElement("div");
      const { container } = await render(<Foo />, parent);
      expect(parent.contains(container)).toBeTrue();
    });

    it("should work with a response", async () => {
      const response = new Response("Foo");
      const { container } = await render(response);
      expect(container.innerHTML).toBe("Foo");
      expect(container).toContainTextContent("Foo");
    });

    it("should work with a response that return HTML", async () => {
      const response = new Response('<div id="test">Foo</div>');
      const { container } = await render(response);
      const testedElement = container.querySelector("#test")!;
      expect(testedElement.innerHTML).toBe("Foo");
      expect(container).toContainTextContent("Foo");
    });

    it("should unmount the container", async () => {
      const Foo = () => <div>Foo</div>;
      const { container, unmount } = await render(<Foo />);
      unmount();
      expect(container.innerHTML).toBeEmpty();
    });

    it.todo("should render a web component", async () => {});

    it.todo("should render a web component with props", async () => {});

    it.todo(
      "should be possible to interact with a web component",
      async () => {},
    );

    it.todo(
      "should be possible to interact with a server action of a server component",
      async () => {},
    );

    it.todo(
      "should be possible to render a server component with a web component inside",
      async () => {},
    );
  });

  describe("serveRoute", () => {
    beforeEach(() => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
      };
    });

    it("should throw an error if build is not executed", async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR: "invalid",
        BUILD_DIR: "invalid",
        SRC_DIR: "invalid",
        ASSETS_DIR: "invalid",
      };
      await expect(serveRoute("/api/example")).rejects.toThrow(
        new Error(
          "Error: Unable to execute 'serveRoute'. Prior execution of 'brisa build' is required to utilize the 'serveRoute' method.",
        ),
      );
    });

    it("should serve an API endpoint", async () => {
      const response = await serveRoute("/api/example");
      const data = await response.json();

      expect(data).toEqual({ hello: "world" });
    });

    it("should serve a page", async () => {
      const response = await serveRoute("/somepage");
      const { container } = await render(response);

      expect(response.headers.get("x-test")).toBe("test");
      expect(container).toContainTextContent("Some page");
    });
  });

  describe("waitFor", () => {
    it("should wait for the content of the element", async () => {
      const element = document.createElement("div");

      setTimeout(() => {
        element.textContent = "Foo";
      }, 100);

      await waitFor(() => expect(element).toHaveTextContent("Foo"));
      expect(element).toHaveTextContent("Foo");
    });
  });

  describe("debug", () => {
    it("should log the document", () => {
      const mockLog = spyOn(console, "log");
      document.body.innerHTML = "<div>Foo</div>";
      debug();
      expect(mockLog.mock.calls[0][0]).toBe(
        blueLog("<html") +
          blueLog(">") +
          "\n  " +
          blueLog("<head") +
          blueLog(">") +
          "\n  " +
          blueLog("</head>") +
          "\n  " +
          blueLog("<body") +
          blueLog(">") +
          "\n    " +
          blueLog("<div") +
          blueLog(">") +
          "\n    " +
          "Foo\n    " +
          blueLog("</div>") +
          "\n  " +
          blueLog("</body>") +
          "\n" +
          blueLog("</html>"),
      );
    });

    it("should log the attributes in cyan (key) and green (value)", () => {
      const mockLog = spyOn(console, "log");
      document.body.innerHTML = '<div id="test" class="test">Foo</div>';
      debug();
      expect(mockLog.mock.calls[0][0]).toContain(
        cyanLog("id") +
          "=" +
          greenLog('"test"') +
          "\n        " +
          cyanLog("class") +
          "=" +
          greenLog('"test"'),
      );
    });
  });
});
