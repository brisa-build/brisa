import { describe, it, expect } from "bun:test";
import renderToReadableStream from ".";
import { BunriseRequest } from "..";

const testRequest = new BunriseRequest(new Request("http://test.com/"));

async function streamToText(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    result += value;
  }

  return result;
}

describe("bunrise core", () => {
  describe("renderToReadableStream", () => {
    it("should render a simple JSX element", async () => {
      const element = <div class="test">Hello World</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await streamToText(stream);

      const expected = `<div class="test">Hello World</div>`;
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
      const stream = renderToReadableStream(element, testRequest);
      const result = await streamToText(stream);
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
      const stream = renderToReadableStream(
        <AsyncComponent title="Test" />,
        testRequest,
      );
      const result = await streamToText(stream);
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
      const stream = renderToReadableStream(element, testRequest);
      const result = await streamToText(stream);
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
      const stream = renderToReadableStream(element, testRequest);
      const result = await streamToText(stream);
      const expected = "<div>Hello World</div>";

      const stream2 = await renderToReadableStream(
        element,
        new BunriseRequest(new Request("http://test.com/?name=Test")),
      );
      const result2 = await streamToText(stream2);
      const expected2 = "<div>Hello Test</div>";

      expect(result).toEqual(expected);
      expect(result2).toEqual(expected2);
    });

    it("should throw an error if the component throws an error", async () => {
      const Component = () => {
        throw new Error("Test");
      };

      try {
        await renderToReadableStream(<Component />, testRequest);
      } catch (e: any) {
        expect(e.message).toEqual("Test");
      }
    });

    it("should render the error component as fallback if the component throws an error", async () => {
      const Component = () => {
        throw new Error("Test");
      };

      Component.error = () => <div>Error</div>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await streamToText(stream);
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

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await streamToText(stream);
      expect(result).toEqual(
        "<div><h1>Parent component</h1><div>Error</div></div>",
      );
    });

    it("should work using the children prop", async () => {
      const Component = ({ children }: { children: JSX.Element }) => children;
      const AnotherComponent = ({ children }: { children: JSX.Element }) => (
        <div>
          <h1>another component</h1>
          {children}
        </div>
      );

      const stream = renderToReadableStream(
        <Component>
          <AnotherComponent>
            <script>{`alert('test')`}</script>
          </AnotherComponent>
        </Component>,
        testRequest,
      );
      const result = await streamToText(stream);
      expect(result).toEqual(
        "<div><h1>another component</h1><script>alert('test')</script></div>",
      );
    });

    it("should work with fragments", async () => {
      const Component = ({ children }: { children: JSX.Element }) => (
        <>
          <>This is</>
          {children}
          <b>test</b>
        </>
      );

      const stream = renderToReadableStream(
        <>
          <Component>
            <>{` a `}</>
          </Component>
        </>,
        testRequest,
      );
      const result = await streamToText(stream);
      expect(result).toEqual("This is a <b>test</b>");
    });

    it("should render a list of elements", async () => {
      const arrayOfNumbers = [0, 1, 2, 3, 4, 5];

      const Bold = ({ children }: { children: JSX.Element }) => (
        <b>{children}</b>
      );
      const Component = ({ children }: { children: JSX.Element[] }) => (
        <>{children}</>
      );

      const stream = renderToReadableStream(
        <Component>
          {arrayOfNumbers.map((v: number) => (
            <Bold>{v}</Bold>
          ))}
        </Component>,
        testRequest,
      );
      const result = await streamToText(stream);
      expect(result).toEqual(
        "<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b>",
      );
    });

    it("should work with booleans and numbers in the same way than React", async () => {
      const Component = () => (
        <>
          {true && <div>TRUE</div>}
          {false && <div>FALSE</div>}
          {1 && <div>TRUE</div>}
          {0 && <div>FALSE</div>}
        </>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await streamToText(stream);
      expect(result).toEqual("<div>TRUE</div><div>TRUE</div>0");
    });

    it("should be possible to render undefined and null", async () => {
      const Component = () => (
        <>
          <div class="empty">{undefined}</div>
          <div class="empty">{null}</div>
        </>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await streamToText(stream);
      expect(result).toEqual(
        '<div class="empty"></div><div class="empty"></div>',
      );
    });
  });
});
