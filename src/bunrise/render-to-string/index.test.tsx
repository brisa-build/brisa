import { describe, it, expect } from "bun:test";
import renderToString from ".";
import { BunriseRequest } from "..";

const testRequest = new BunriseRequest(new Request("http://test.com/"));

describe("bunrise core", () => {
  describe("renderToString", () => {
    it("should render a simple JSX element", async () => {
      const element = <div>Hello World</div>;
      const result = await renderToString(element, testRequest);
      const expected = "<div>Hello World</div>";
      expect(result).toEqual(expected);
    });

    it("should render a complex JSX element", async () => {
      const Component = ({ name, title }: { name: string; title: string }) => (
        <div title={title}>
          <h1>Hello {name}</h1>
          <p>This is a paragraph</p>
        </div>
      );
      const element = <Component name="World" title="Test" />;
      const result = await renderToString(element, testRequest);
      const expected =
        '<div title="Test"><h1>Hello World</h1><p>This is a paragraph</p></div>';
      expect(result).toEqual(expected);
    });

    it("should work with async components", async () => {
      const AsyncChild = async ({ name }: { name: string }) => (
        <h1>
          Hello {await Promise.resolve("test")} {name}
        </h1>
      );
      const AsyncComponent = async ({ title }: { title: string }) => (
        <div title={title}>
          <AsyncChild name="test" />
          <p>This is a paragraph</p>
        </div>
      );

      const result = await renderToString(
        <AsyncComponent title="Test" />,
        testRequest,
      );
      const expected =
        '<div title="Test"><h1>Hello test test</h1><p>This is a paragraph</p></div>';
      expect(result).toEqual(expected);
    });

    it("should be possible to access to the request object inside components", async () => {
      const Component = (
        { name, title }: { name: string; title: string },
        request: Request,
      ) => (
        <div title={title}>
          <h1>Hello {name}</h1>
          <p>The URL is: {request.url}</p>
        </div>
      );
      const element = <Component name="World" title="Test" />;
      const result = await renderToString(element, testRequest);
      const expected =
        '<div title="Test"><h1>Hello World</h1><p>The URL is: http://test.com/</p></div>';
      expect(result).toEqual(expected);
    });

    it("should be possible to provide and consume context", async () => {
      const ComponentChild = ({}, request: BunriseRequest) => (
        <div>Hello {request.context.get("testData").testName}</div>
      );

      const Component = (
        { name }: { name: string },
        request: BunriseRequest,
      ) => {
        const url = new URL(request.url);
        const query = new URLSearchParams(url.search);
        const testName = query.get("name") || name;

        request.context.set("testData", { testName });
        return <ComponentChild />;
      };

      const element = <Component name="World" />;
      const result = await renderToString(element, testRequest);
      const expected = "<div>Hello World</div>";

      const result2 = await renderToString(
        element,
        new BunriseRequest(new Request("http://test.com/?name=Test")),
      );
      const expected2 = "<div>Hello Test</div>";

      expect(result).toEqual(expected);
      expect(result2).toEqual(expected2);
    });

    it("should throw an error if the component throws an error", async () => {
      const Component = () => {
        throw new Error("Test");
      };

      try {
        await renderToString(<Component />, testRequest);
      } catch (e: any) {
        expect(e.message).toEqual("Test");
      }
    });

    it("should render the error component as fallback if the component throws an error", async () => {
      const Component = () => {
        throw new Error("Test");
      };

      Component.error = () => <div>Error</div>;

      const result = await renderToString(<Component />, testRequest);
      expect(result).toEqual("<div>Error</div>");
    });

    it("should render the error component as fallback if the nested component throws an error", async () => {
      const ComponentChild = () => {
        throw new Error("Test");
      };

      ComponentChild.error = () => <div>Error</div>;

      const Component = () => {
        return (
          <div>
            <h1>Parent component</h1>
            <ComponentChild />
          </div>
        );
      };

      const result = await renderToString(<Component />, testRequest);
      expect(result).toEqual(
        "<div><h1>Parent component</h1><div>Error</div></div>",
      );
    });
  });
});
