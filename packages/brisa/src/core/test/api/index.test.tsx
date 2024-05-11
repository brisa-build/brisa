import { render } from "@/core/test/api";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("test api", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });
  afterEach(() => {
    GlobalRegistrator.unregister();
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
      expect(document.body.contains(container)).toBeTrue();
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
});
