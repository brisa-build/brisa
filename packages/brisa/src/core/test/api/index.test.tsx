import path from "node:path";
import { debug, render, serveRoute, waitFor, userEvent } from "@/core/test/api";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
  mock,
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

  describe("userEvent", () => {
    describe("click", () => {
      it("should click the element", async () => {
        const mockClick = mock(() => {});
        const element = document.createElement("button");

        element.textContent = "Click me";
        document.body.appendChild(element);
        element.addEventListener("click", mockClick);
        userEvent.click(element);

        expect(mockClick).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <button onClick={mockFn}>Click me</button>,
        );
        const button = container.querySelector("button");

        userEvent.click(button!);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("dblClick", () => {
      it("should double click the element", async () => {
        const mockDblClick = mock(() => {});
        const element = document.createElement("button");

        element.textContent = "Click me";
        document.body.appendChild(element);
        element.addEventListener("dblclick", mockDblClick);

        userEvent.dblClick(element);
        expect(mockDblClick).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <button onDblClick={mockFn}>Click me</button>,
        );
        const button = container.querySelector("button");

        userEvent.dblClick(button!);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("type", () => {
      it("should type the element", async () => {
        const element = document.createElement("input");
        document.body.appendChild(element);

        userEvent.type(element, "Foo");

        expect(element).toHaveValue("Foo");

        userEvent.type(element, "Bar");

        expect(element).toHaveValue("FooBar");
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input onInput={mockFn} type="text" />,
        );
        const input = container.querySelector("input")!;

        userEvent.type(input, "Hello World");
        expect(input.value).toBe("Hello World");
        expect(mockFn).toHaveBeenCalledTimes(11);
      });
    });
    describe("clear", () => {
      it("should clear the element", async () => {
        const element = document.createElement("input");
        element.value = "Foo";
        document.body.appendChild(element);

        userEvent.clear(element);

        expect(element).toHaveValue("");
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input onInput={mockFn} type="text" />,
        );
        const input = container.querySelector("input")!;

        userEvent.type(input, "Hello World");
        userEvent.clear(input);
        expect(input.value).toBeEmpty();
        expect(mockFn).toHaveBeenCalledTimes(12);
      });
    });
    describe("hover", () => {
      it("should hover the element", async () => {
        const mockHover = mock(() => {});
        const element = document.createElement("button");

        element.textContent = "Hover me";
        document.body.appendChild(element);
        element.addEventListener("mouseover", mockHover);

        userEvent.hover(element);
        expect(mockHover).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <button onMouseOver={mockFn}>Hover me</button>,
        );
        const button = container.querySelector("button");

        userEvent.hover(button!);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("unhover", () => {
      it("should unhover the element", async () => {
        const mockUnhover = mock(() => {});
        const element = document.createElement("button");

        element.textContent = "Unhover me";
        document.body.appendChild(element);
        element.addEventListener("mouseout", mockUnhover);

        userEvent.unhover(element);
        expect(mockUnhover).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <button onMouseOut={mockFn}>Unhover me</button>,
        );
        const button = container.querySelector("button");

        userEvent.unhover(button!);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("focus", () => {
      it("should focus the element", async () => {
        const mockFocus = mock(() => {});
        const element = document.createElement("input");

        document.body.appendChild(element);
        element.addEventListener("focus", mockFocus);

        userEvent.focus(element);
        expect(mockFocus).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input onFocus={mockFn} type="text" />,
        );
        const input = container.querySelector("input")!;

        userEvent.focus(input);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("blur", () => {
      it("should blur the element", async () => {
        const mockBlur = mock(() => {});
        const element = document.createElement("input");

        document.body.appendChild(element);
        element.addEventListener("blur", mockBlur);

        userEvent.blur(element);
        expect(mockBlur).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input onBlur={mockFn} type="text" />,
        );
        const input = container.querySelector("input")!;

        userEvent.focus(input);
        userEvent.blur(input);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("select", () => {
      it("should select the element", async () => {
        const element = document.createElement("select");
        const option1 = document.createElement("option");
        const option2 = document.createElement("option");
        option1.value = "Foo";
        option2.value = "Bar";
        element.appendChild(option1);
        element.appendChild(option2);
        document.body.appendChild(element);

        userEvent.select(element, "Bar");

        expect(option1.selected).toBeFalse();
        expect(option2.selected).toBeTrue();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <select onChange={mockFn}>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>,
        );
        const select = container.querySelector("select")!;

        userEvent.select(select, "2");
        expect(select.value).toBe("2");
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("deselect", () => {
      it("should deselect the element", async () => {
        const element = document.createElement("select");
        const option1 = document.createElement("option");
        const option2 = document.createElement("option");
        option1.value = "Foo";
        option2.value = "Bar";
        option2.selected = true;
        element.appendChild(option1);
        element.appendChild(option2);
        document.body.appendChild(element);

        userEvent.deselect(element, "Bar");

        expect(option1.selected).toBeFalse();
        expect(option2.selected).toBeFalse();
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <select onChange={mockFn}>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>,
        );
        const select = container.querySelector("select")!;

        userEvent.select(select, "2");
        userEvent.deselect(select, "2");
        expect(select.value).toBeEmpty();
        expect(mockFn).toHaveBeenCalledTimes(2);
      });
    });
    describe("upload", () => {
      it("should upload the element", async () => {
        const file = new File(["foo"], "foo.txt", {
          type: "text/plain",
        });
        const element = document.createElement("input");
        element.type = "file";
        document.body.appendChild(element);

        userEvent.upload(element, file);

        expect(element.files).toContain(file);
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input type="file" onChange={mockFn} />,
        );
        const input = container.querySelector("input")!;
        const file = new File(["foo"], "foo.txt", {
          type: "text/plain",
        });

        userEvent.upload(input, file);
        expect(input.files).toContain(file);
        expect(mockFn).toHaveBeenCalled();
      });
    });
    describe("tab", () => {
      it("should tab the element", async () => {
        const mockTab = mock(() => {});
        document.body.addEventListener("keydown", mockTab);

        userEvent.tab();
        expect(mockTab).toHaveBeenCalled();
      });

      it.todo("should work with render", async () => {
        const { container } = await render(<input type="text" />);
        const input = container.querySelector("input")!;

        userEvent.tab();
        expect(input.isEqualNode(document.activeElement)).toBeTrue();
      });
    });
    describe("paste", () => {
      it("should paste the element", async () => {
        const mockPaste = mock(() => {});
        const element = document.createElement("input");
        document.body.appendChild(element);
        element.addEventListener("paste", mockPaste);

        userEvent.paste(element, "Foo");
        expect(mockPaste).toHaveBeenCalled();
        expect(element).toHaveValue("Foo");
      });

      it.todo("should work with render", async () => {
        const mockFn = mock(() => {});
        const { container } = await render(
          <input onPaste={mockFn} type="text" />,
        );
        const input = container.querySelector("input")!;

        userEvent.paste(input, "Hello World");
        expect(input.value).toBe("Hello World");
        expect(mockFn).toHaveBeenCalled();
      });
    });
  });
});
