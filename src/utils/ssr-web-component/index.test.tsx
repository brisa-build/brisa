import { describe, expect, it } from "bun:test";
import SSRWebComponent from ".";
import { WebContext } from "@/types";
import extendRequestContext from "@/utils/extend-request-context";
import createContext from "@/utils/create-context";

const requestContext = extendRequestContext({
  originalRequest: new Request("http://localhost"),
});

describe("utils", () => {
  describe("SSRWebComponent", () => {
    it("should render a web component", async () => {
      const Component = () => <div>hello world</div>;
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "hello world",
      );
    });

    it("should render a web component with props", async () => {
      const Component = ({ name }: { name: string }) => <div>hello {name}</div>;
      const selector = "my-component";
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          name: "world",
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(
        output.props.children[0].props.children[0].props.children.join(""),
      ).toBe("hello world");
    });

    it("should render a web component with css template literal", async () => {
      const Component = ({}, { css }: WebContext) => {
        css`
          div {
            color: red;
          }
        `;

        return <div>hello world</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "hello world",
      );
      expect(output.props.children[0].props.children[1].type).toBe("style");
      expect(output.props.children[0].props.children[1].props.children).toBe(
        "div {color: red;}",
      );
    });

    it("should render a web component with a initial state", async () => {
      const Component = ({}, { state }: WebContext) => {
        const foo = state({ name: "world" });

        return <div>hello {foo.value.name}</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(
        output.props.children[0].props.children[0].props.children.join(""),
      ).toBe("hello world");
    });

    it("should render a web component with a derived state", async () => {
      const Component = ({}, { state, derived }: WebContext) => {
        const foo = state({ name: "wor" });
        const bar = derived(() => foo.value.name + "ld");

        return <div>hello {bar.value}</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(
        output.props.children[0].props.children[0].props.children.join(""),
      ).toBe("hello world");
    });

    it("should render a web component with a effect", async () => {
      const Component = ({}, { effect }: WebContext) => {
        effect(() => {
          document.title = "hello world";
        });

        return <div>hello world</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "hello world",
      );
    });

    it("should render a web component with a cleanup", async () => {
      const Component = ({}, { cleanup }: WebContext) => {
        cleanup(() => {
          document.title = "hello world";
        });

        return <div>hello world</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "hello world",
      );
    });

    it("should render a web component with a onMount", async () => {
      const Component = ({}, { onMount }: WebContext) => {
        onMount(() => {
          document.title = "hello world";
        });

        return <div>hello world</div>;
      };
      const selector = "my-component";
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "hello world",
      );
    });

    it("should render a web component with a children slot", async () => {
      const Component = ({ children }: any) => {
        return <div>hello {children}</div>;
      };

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: "world",
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children[0]).toBe(
        "hello ",
      );
      expect(
        output.props.children[0].props.children[0].props.children[1].type,
      ).toBe("slot");
      expect(output.props.children[1].props.children).toBe("world");
    });

    it("should work with async components", async () => {
      const Component = async ({ children }: any) => {
        return <div>hello {children}</div>;
      };

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: "world",
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children[0]).toBe(
        "hello ",
      );
      expect(
        output.props.children[0].props.children[0].props.children[1].type,
      ).toBe("slot");
      expect(output.props.children[1].props.children).toBe("world");
    });

    it("should work the suspense component in async components", async () => {
      const Component = async ({ children }: any) => {
        return <div>hello {children}</div>;
      };
      Component.suspense = () => <div>loading...</div>;

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: "world",
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "loading...",
      );
    });

    it("should render the error component when there is an error rendering the component", async () => {
      const Component = () => {
        throw new Error("some error");
      };
      Component.error = ({ error, name }: any) => (
        <div>
          Ops! {error.message}, hello {name}
        </div>
      );

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          name: "world",
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(
        output.props.children[0].props.children[0].props.children.join(""),
      ).toBe("Ops! some error, hello world");
    });

    it("should render the error component when there is an error rendering the suspense component", async () => {
      const Component = async () => {
        return <div>hello world</div>;
      };
      Component.suspense = () => {
        throw new Error("error");
      };
      Component.error = () => <div>Ops! error</div>;

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].type).toBe("template");
      expect(output.props.children[0].props.shadowrootmode).toBe("open");
      expect(output.props.children[0].props.children[0].type).toBe("div");
      expect(output.props.children[0].props.children[0].props.children).toBe(
        "Ops! error",
      );
    });

    it("should throw the error if there is no an error component", async () => {
      const Component = () => {
        throw new Error("error");
      };

      const selector = "my-component";

      try {
        (await SSRWebComponent(
          {
            Component,
            selector,
          },
          requestContext,
        )) as any;
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe("error");
      }
    });

    it('should work with "useContext"', async () => {
      const Ctx = createContext<{ name: string }>(
        {
          name: "world",
        },
        "name",
      );

      const Component = ({}, { useContext }: WebContext) => {
        const context = useContext<{ name: string }>(Ctx);

        return `hello ${context.value.name}`;
      };

      const selector = "my-component";

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output.type).toBe(selector);
      expect(output.props.children[0].props.children[0]).toBe("hello world");
    });
  });
});
