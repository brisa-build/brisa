import { describe, it, expect, mock, afterEach, afterAll } from "bun:test";
import renderToReadableStream from ".";
import dangerHTML from "../danger-html";
import getConstants from "../../constants";
import { ComponentType, RequestContext } from "../../types";
import extendRequestContext from "../../utils/extend-request-context";

const testRequest = extendRequestContext({
  originalRequest: new Request("http://test.com/"),
});
const mockConsoleError = mock(() => {});
const consoleError = console.error;
console.error = mockConsoleError;

describe("brisa core", () => {
  afterEach(() => {
    mockConsoleError.mockClear();
    globalThis.mockConstants = undefined;
  });
  afterAll(() => {
    console.error = consoleError;
  });
  describe("renderToReadableStream", () => {
    it("should render a simple JSX element", async () => {
      const element = <div class="test">Hello World</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);

      const expected = `<div class="test">Hello World</div>`;
      expect(result).toEqual(expected);
      expect(mockConsoleError.mock.calls[0]).toEqual([
        "You should have a <head> tag in your document. Please review your layout. You can experiment some issues with browser JavaScript code without it.",
      ]);
    });

    it("should not console.error when it has a <head> tag", async () => {
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      await Bun.readableStreamToText(stream);
      expect(mockConsoleError.mock.calls.length).toEqual(0);
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
      const result = await Bun.readableStreamToText(stream);
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
      const result = await Bun.readableStreamToText(stream);
      const expected =
        '<div title="Test"><h1>Hello test test</h1><p>This is a paragraph</p></div>';
      expect(result).toEqual(expected);
    });

    it("should be possible to access to the request object inside components", async () => {
      const Component = (
        { name, title }: { name: string; title: string },
        request: RequestContext,
      ) => (
        <div title={title}>
          <h1>Hello {name}</h1>
          <p>The URL is: {request.finalURL}</p>
        </div>
      );
      const element = <Component name="World" title="Test" />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      const expected =
        '<div title="Test"><h1>Hello World</h1><p>The URL is: http://test.com/</p></div>';
      expect(result).toEqual(expected);
    });

    it("should be possible to provide and consume context", async () => {
      const ComponentChild = ({}, request: RequestContext) => (
        <div>Hello {request.context.get("testData").testName}</div>
      );

      const Component = (
        { name }: { name: string },
        request: RequestContext,
      ) => {
        const url = new URL(request.finalURL);
        const query = new URLSearchParams(url.search);
        const testName = query.get("name") || name;

        request.context.set("testData", { testName });
        return <ComponentChild />;
      };

      const element = <Component name="World" />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      const expected = "<div>Hello World</div>";

      const stream2 = await renderToReadableStream(
        element,
        extendRequestContext({
          originalRequest: new Request("http://test.com/?name=Test"),
        }),
      );
      const result2 = await Bun.readableStreamToText(stream2);
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
      const result = await Bun.readableStreamToText(stream);
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
      const result = await Bun.readableStreamToText(stream);
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
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        "<div><h1>another component</h1><script>alert(&#x27;test&#x27;)</script></div>",
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
      const result = await Bun.readableStreamToText(stream);
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
      const result = await Bun.readableStreamToText(stream);
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
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual("<div>TRUE</div><div>TRUE</div>0");
    });

    it("should be possible to render in a tag {text|number} in a middle of string ", async () => {
      const Component = () => (
        <div>
          This is {1} {"example"}
        </div>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual("<div>This is 1 example</div>");
    });

    it("should be possible to render in a Fragment {text|number} in a middle of string", async () => {
      const Component = () => (
        <>
          This is {1} {"example"}
        </>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual("This is 1 example");
    });

    it("should be possible to render undefined and null", async () => {
      const Component = () => (
        <>
          <div class="empty">{undefined}</div>
          <div class="empty">{null}</div>
        </>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div class="empty"></div><div class="empty"></div>',
      );
    });

    it("should inject the hrefLang attributes if the i18n is enabled and have hrefLangOrigin defined", () => {
      const req = extendRequestContext({
        originalRequest: new Request(testRequest),
      });
      const i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
      };
      req.i18n = { ...i18n, t: () => "" };
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          ...i18n,
          hrefLangOrigin: "https://test.com",
        },
      };

      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, req);
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html lang="es"><head><link rel="alternate" hreflang="en" href="https:\/\/test.com\/en" \/><script>[\s\S]+<\/script><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should inject the unsuspense script", async () => {
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toMatch(
        /<html><head><script>[\s\S]+<\/script><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should render the suspense component before if the async component support it", async () => {
      const Component = async () => {
        await Promise.resolve();
        return <div>Test</div>;
      };

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toStartWith(
        `<div id="S:1"><b>Loading...</b></div><template id="U:1"><div>Test</div></template><script id="R:1">u$('1')</script>`,
      );
    });

    it("should render the rest of HTML meanhile the suspense component is loading", async () => {
      const Component = async () => {
        await Bun.sleep(0); // Next clock tick
        return <div>Test</div>;
      };

      Component.suspense = () => <b>Loading...</b>;

      const AnotherComponent = () => <h2>Another</h2>;

      const Page = () => (
        <>
          <Component />
          <AnotherComponent />
        </>
      );

      const stream = renderToReadableStream(<Page />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toStartWith(
        `<div id="S:1"><b>Loading...</b></div><h2>Another</h2><template id="U:1"><div>Test</div></template><script id="R:1">u$('1')</script>`,
      );
    });

    it("should be possible in tag suspense to render {text|number} in a middle of string ", async () => {
      const Component = () => (
        <div>
          This is {1} {"example"}
        </div>
      );

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div id="S:1"><b>Loading...</b></div><template id="U:1"><div>This is 1 example</div></template><script id="R:1">u$(\'1\')</script>',
      );
    });

    it("should be possible to render in a Fragment suspense {text|number} in a middle of string", async () => {
      const Component = () => (
        <>
          This is {1} {"example"}
        </>
      );

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div id="S:1"><b>Loading...</b></div><template id="U:1">This is 1 example</template><script id="R:1">u$(\'1\')</script>',
      );
    });

    it("should be possible to render in a Fragment suspense different tags and components", async () => {
      const Example = () => <>example</>;
      const Component = () => (
        <>
          This is <b>1</b> <Example />
        </>
      );

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div id="S:1"><b>Loading...</b></div><template id="U:1">This is <b>1</b> example</template><script id="R:1">u$(\'1\')</script>',
      );
    });

    it("should be possible to suspense with children {text|number} in a middle of string", async () => {
      const Example = ({ children }: { children: JSX.Element }) => children;
      const Component = () => (
        <Example>
          This is {1} {"example"}
        </Example>
      );

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div id="S:1"><b>Loading...</b></div><template id="U:1">This is 1 example</template><script id="R:1">u$(\'1\')</script>',
      );
    });

    it("should be possible to suspense a div with multiple items", async () => {
      const Component = () => (
        <div>
          This is <b>is </b>
          <i>an </i>
          <b>example</b>
        </div>
      );

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        '<div id="S:1"><b>Loading...</b></div><template id="U:1"><div>This is <b>is </b><i>an </i><b>example</b></div></template><script id="R:1">u$(\'1\')</script>',
      );
    });

    it("should add the lang attribute inside the html tag when i18n locale exist", async () => {
      testRequest.i18n = {
        locale: "en",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = undefined;
      expect(result).toStartWith(`<html lang="en"><head>`);
    });

    it("should replace the lang attribute inside the html tag when i18n locale exist", async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const element = (
        <html lang="en">
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = undefined;
      expect(result).toStartWith(`<html lang="es"><head>`);
    });

    it('should render the "a" tag with the locale if the i18n is enabled and the link does not has locale', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const home = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/">Test</a>, testRequest),
      );
      const withParam = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/test?some=true">Test</a>, testRequest),
      );
      const withHash = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/test#some">Test</a>, testRequest),
      );

      testRequest.i18n = undefined;
      expect(home).toEqual(`<a href="/es">Test</a>`);
      expect(withParam).toEqual(`<a href="/es/test?some=true">Test</a>`);
      expect(withHash).toEqual(`<a href="/es/test#some">Test</a>`);
    });

    it('should render the "a" tag with the locale if i18n is enabled, the link lacks locale but starts with a page with locale in its name', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const essencePage = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence">Test</a>, testRequest),
      );
      const withParam = await Bun.readableStreamToText(
        renderToReadableStream(
          <a href="/essence?some=true">Test</a>,
          testRequest,
        ),
      );
      const withHash = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence#some">Test</a>, testRequest),
      );

      testRequest.i18n = undefined;
      expect(essencePage).toEqual(`<a href="/es/essence">Test</a>`);
      expect(withParam).toEqual(`<a href="/es/essence?some=true">Test</a>`);
      expect(withHash).toEqual(`<a href="/es/essence#some">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the url is external', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const element = <a href="http://test.com/test">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = undefined;
      expect(result).toEqual(`<a href="http://test.com/test">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the url is external and mailto protocol', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const element = <a href="mailto:test@test.com">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = {} as any;
      expect(result).toEqual(`<a href="mailto:test@test.com">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the i18n is enabled and the link already has some locale', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };
      const element = <a href="/en/test">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = undefined as any;
      expect(result).toEqual(`<a href="/en/test">Test</a>`);
    });

    it("should not be possible to inject HTML as string directly in the JSX element", async () => {
      const element = <div>{`<script>alert('test')</script>`}</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        `<div>&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;</div>`,
      );
    });

    it("should not be possible to inject HTML as string directly in the JSX component", async () => {
      const Component = () => (
        <div>
          <h1>Example</h1>
          {`<script>alert('test')</script>`}
        </div>
      );
      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        `<div><h1>Example</h1>&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;</div>`,
      );
    });

    it('should be possible to inject HTML as string in the JSX using the "dangerHTML" helper', async () => {
      const element = <div>{dangerHTML(`<script>alert('test')</script>`)}</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(`<div><script>alert('test')</script></div>`);
    });

    it("should not be possible to inject HTML as children string directly in the JSX", async () => {
      const Component = () => <>{`<script>alert('test')</script>`}</>;
      const element = <Component />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(
        `&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;`,
      );
    });

    it('should be possible to inject HTML as children string in the JSX using the "dangerHTML" helper', async () => {
      const Component = () => (
        <>{dangerHTML(`<script>alert('test')</script>`)}</>
      );
      const element = <Component />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toEqual(`<script>alert('test')</script>`);
    });

    it("should render the head element with the canonical", () => {
      const req = extendRequestContext({
        originalRequest: new Request(testRequest),
      });
      const element = (
        <html>
          <head>
            <title>Test</title>
          </head>
          <body></body>
        </html>
      );

      function Head() {
        return <link rel="canonical" href="/" />;
      }

      const stream = renderToReadableStream(
        element,
        req,
        Head as unknown as ComponentType,
      );
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html><head><link rel="canonical" href="\/"><\/link><title>Test<\/title><script>[\s\S]+<\/script><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should render the head element with the title replacing the original title", () => {
      const req = extendRequestContext({
        originalRequest: new Request(testRequest),
      });
      const element = (
        <html>
          <head>
            <title id="title">Test</title>
          </head>
          <body></body>
        </html>
      );

      function Head() {
        return <title id="title">Test 2</title>;
      }

      const stream = renderToReadableStream(
        element,
        req,
        Head as unknown as ComponentType,
      );
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html><head><title id="title">Test 2<\/title><script>[\s\S]+<\/script><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should allow multiple ids outside the head (not ideal but should not break the render)", () => {
      const req = extendRequestContext({
        originalRequest: new Request(testRequest),
      });
      const element = (
        <html>
          <head></head>
          <body>
            <h1 id="a">A</h1>
            <h1 id="a">B</h1>
          </body>
        </html>
      );

      const stream = renderToReadableStream(element, req);
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html><head><script>[\s\S]+<\/script><\/head><body><h1 id="a">A<\/h1><h1 id="a">B<\/h1><\/body><\/html>/gm,
      );
    });
  });
});
