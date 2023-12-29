import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import renderToReadableStream from ".";
import getConstants from "../../constants";
import { toInline } from "../../helpers";
import { ComponentType, RequestContext, Translate } from "../../types";
import dangerHTML from "../danger-html";
import extendRequestContext from "../extend-request-context";
import SSRWebComponent from "../ssr-web-component";
import createContext from "../create-context";
import { MatchedRoute } from "bun";

const emptyI18n = {
  locale: "",
  defaultLocale: "",
  locales: [],
  t: () => "",
  pages: {},
};

const testRequest = extendRequestContext({
  originalRequest: new Request("http://test.com/"),
});
const mockConsoleError = mock(() => {});
const consoleError = console.error;
console.error = mockConsoleError;

describe("brisa core", () => {
  afterEach(() => {
    testRequest.store.clear();
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
      expect(result).toBe(expected);
      expect(mockConsoleError.mock.calls[0].at(0) as unknown as string).toEqual(
        "You should have a <head> tag in your document. Please review your layout. You can experiment some issues with browser JavaScript code without it.",
      );
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
      expect(result).toBe(expected);
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
      expect(result).toBe(expected);
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
      expect(result).toBe(expected);
    });

    it("should be possible to set and get store values", async () => {
      const ComponentChild = ({}, request: RequestContext) => (
        <div>Hello {request.store.get("testData").testName}</div>
      );

      const Component = (
        { name }: { name: string },
        request: RequestContext,
      ) => {
        const url = new URL(request.finalURL);
        const query = new URLSearchParams(url.search);
        const testName = query.get("name") || name;

        request.store.set("testData", { testName });
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

      expect(result).toBe(expected);
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

      Component.error = ({ name, error }: any) => (
        <div>
          Error {error.message}, hello {name}
        </div>
      );

      const stream = renderToReadableStream(
        <Component name="world" />,
        testRequest,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<div>Error Test, hello world</div>");
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
      expect(result).toBe(
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
      expect(result).toBe(
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
      expect(result).toBe("This is a <b>test</b>");
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
      expect(result).toBe("<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b>");
    });

    it("should render a list of SSR web components", async () => {
      const WebComponent = ({
        name,
        children,
      }: {
        name: string;
        children: JSX.Element;
      }) => (
        <div>
          Hello {name}
          {children}
        </div>
      );

      const ServerComponent = () => (
        <div>
          <h1>Test</h1>
          {Array.from({ length: 3 }, (_, i) => (
            <SSRWebComponent
              Component={WebComponent}
              selector="web-component"
              name={"World" + i}
            >
              <b> Child </b>
            </SSRWebComponent>
          ))}
        </div>
      );

      const stream = renderToReadableStream(<ServerComponent />, testRequest);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
        <div>
          <h1>Test</h1>
          <web-component name="World0">
            <template shadowrootmode="open">
            <div>Hello World0<slot></slot></div>
            </template>
            <b> Child </b>
          </web-component>
          <web-component name="World1">
            <template shadowrootmode="open">
              <div>Hello World1<slot></slot></div>
            </template>
            <b> Child </b>
          </web-component>
          <web-component name="World2">
            <template shadowrootmode="open">
              <div>Hello World2<slot></slot></div>
            </template>
            <b> Child </b>
          </web-component>
        </div>
      `),
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
      expect(result).toBe("<div>TRUE</div><div>TRUE</div>0");
    });

    it("should be possible to render in a tag {text|number} in a middle of string ", async () => {
      const Component = () => (
        <div>
          This is {1} {"example"}
        </div>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<div>This is 1 example</div>");
    });

    it("should be possible to render in a Fragment {text|number} in a middle of string", async () => {
      const Component = () => (
        <>
          This is {1} {"example"}
        </>
      );

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("This is 1 example");
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
      expect(result).toBe('<div class="empty"></div><div class="empty"></div>');
    });

    it('should not be possible to send "undefined" as a attribute', async () => {
      const Component = ({ name }: { name: string }) => (
        <div title={name}>Hello {name}</div>
      );

      const stream = renderToReadableStream(
        <Component name={undefined as any} />,
        testRequest,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<div>Hello </div>");
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
      req.i18n = { ...i18n, t: () => "", pages: {} };
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
        /<html lang="es" dir="ltr"><head><link rel="alternate" hreflang="en" href="https:\/\/test.com\/en" \/><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should inject the hrefLang attributes for rtl if the i18n is enabled and have hrefLangOrigin defined", () => {
      const req = extendRequestContext({
        originalRequest: new Request(testRequest),
      });
      const i18n = {
        locale: "ar",
        locales: ["en", "ar"],
        defaultLocale: "en",
      };
      req.i18n = { ...i18n, t: () => "", pages: {} };
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
        /<html lang="ar" dir="rtl"><head><link rel="alternate" hreflang="en" href="https:\/\/test.com\/en" \/><\/head><body><\/body><\/html>/gm,
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
      expect(result).toMatch(/<html><head><\/head><body><\/body><\/html>/gm);
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
      expect(result).toBe(
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
      expect(result).toBe(
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
      expect(result).toBe(
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
      expect(result).toBe(
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
      expect(result).toBe(
        toInline(`
        <div id="S:1">
          <b>Loading...</b>
        </div>
        <template id="U:1">
          <div>This is <b>is </b><i>an </i><b>example</b></div>
        </template>
        <script id="R:1">u$(\'1\')</script>`),
      );
    });

    it("should add the lang attribute inside the html tag when i18n locale exist", async () => {
      testRequest.i18n = {
        locale: "en",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        pages: {},
      };
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toStartWith(`<html lang="en" dir="ltr"><head>`);
    });

    it("should translate the URLs to the correct path", async () => {
      testRequest.i18n = {
        locale: "en",
        locales: ["en", "es", "it", "fr", "de"],
        defaultLocale: "en",
        t: ((v: string) => v.toUpperCase()) as Translate,
        pages: {
          "/about-us": {
            en: "/about-us",
            es: "/sobre-nosotros",
            it: "/chi-siamo",
            fr: "/a-propos",
            de: "/uber-uns",
          },
        },
      };

      testRequest.route = {
        name: "/about-us",
        pathname: "/about-us",
      } as MatchedRoute;

      function ChangeLocale(props: {}, { i18n, route }: RequestContext) {
        const { locales, locale, pages, t } = i18n;

        return (
          <ul>
            {locales.map((lang) => {
              const pathname = pages[route.name]?.[lang] ?? route.pathname;

              if (lang === locale) return null;

              return (
                <li>
                  <a href={`/${lang}${pathname}`}>{t(lang)}</a>
                </li>
              );
            })}
          </ul>
        );
      }

      const stream = renderToReadableStream(<ChangeLocale />, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(
        toInline(`
          <ul>
            <li>
              <a href="/es/sobre-nosotros">ES</a>
            </li>
            <li>
              <a href="/it/chi-siamo">IT</a>
            </li>
            <li>
              <a href="/fr/a-propos">FR</a>
            </li>
            <li>
              <a href="/de/uber-uns">DE</a>
            </li>
          </ul>
        `),
      );
    });

    it("should replace the lang attribute inside the html tag when i18n locale exist", async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        pages: {},
      };
      const element = (
        <html lang="en">
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toStartWith(`<html lang="es" dir="ltr"><head>`);
    });

    it('should render the "a" tag with the locale if the i18n is enabled and the link does not has locale', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        pages: {},
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

      testRequest.i18n = emptyI18n;
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
        pages: {},
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

      testRequest.i18n = emptyI18n;
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
        pages: {},
      };
      const element = <a href="http://test.com/test">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(`<a href="http://test.com/test">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the url is external and mailto protocol', async () => {
      testRequest.i18n = {
        ...emptyI18n,
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
      };
      const element = <a href="mailto:test@test.com">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = {} as any;
      expect(result).toBe(`<a href="mailto:test@test.com">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the i18n is enabled and the link already has some locale', async () => {
      testRequest.i18n = {
        ...emptyI18n,
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
      };
      const element = <a href="/en/test">Test</a>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(`<a href="/en/test">Test</a>`);
    });

    it("should not be possible to inject HTML as string directly in the JSX element", async () => {
      const element = <div>{`<script>alert('test')</script>`}</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
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
      expect(result).toBe(
        `<div><h1>Example</h1>&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;</div>`,
      );
    });

    it('should be possible to inject HTML as string in the JSX using the "dangerHTML" helper', async () => {
      const element = <div>{dangerHTML(`<script>alert('test')</script>`)}</div>;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(`<div><script>alert('test')</script></div>`);
    });

    it("should not be possible to inject HTML as children string directly in the JSX", async () => {
      const Component = () => <>{`<script>alert('test')</script>`}</>;
      const element = <Component />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
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
      expect(result).toBe(`<script>alert('test')</script>`);
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
        /<html><head><link rel="canonical" href="\/"><\/link><title>Test<\/title><\/head><body><\/body><\/html>/gm,
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
        /<html><head><title id="title">Test 2<\/title><\/head><body><\/body><\/html>/gm,
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
        /<html><head><\/head><body><h1 id="a">A<\/h1><h1 id="a">B<\/h1><\/body><\/html>/gm,
      );
    });

    it("should not finish the stream if the request is aborted", async () => {
      const originalRequest = new Request(testRequest, {
        signal: new AbortController().signal,
      });
      const req = extendRequestContext({ originalRequest });
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );

      const stream = renderToReadableStream(element, req);

      // wait the first chunk
      const reader = stream.getReader();
      const { done, value } = await reader.read();

      expect(done).toBe(false);
      expect(value).toBe("<html>");

      // abort the request
      req.signal.dispatchEvent(new Event("abort"));

      // just the next chunk is not ready aborted
      const { done: done2, value: value2 } = await reader.read();
      expect(done2).toBe(false);
      expect(value2).toBe("<head>");

      // Not continue reading because the request is aborted
      const { done: done3, value: value3 } = await reader.read();
      expect(done3).toBe(true);
      expect(value3).toBe(undefined);
    });

    it('should render "open" attribute without content in the "dialog" tag when open={true}', async () => {
      const element = (
        <dialog open={true}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog open><h1>Test</h1></dialog>");
    });

    it('should render "open" attribute without content in the "dialog" tag when opEN={true} (no lowercase)', async () => {
      const element = (
        <dialog open={true}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog open><h1>Test</h1></dialog>");
    });

    it('should not render "open" attribute in the "dialog" tag when opEN={false} (no lowercase)', async () => {
      const element = (
        <dialog open={false}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog><h1>Test</h1></dialog>");
    });

    it('should not render "open" attribute in the "dialog" tag when open={false}', async () => {
      const element = (
        <dialog open={false}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog><h1>Test</h1></dialog>");
    });

    it("should serialize an attribute that is an object as a string", async () => {
      const element = <div data-test={{ a: 1, b: 2 }} />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(`<div data-test="{'a':1,'b':2}"></div>`);
    });

    it('should work context with "useContext" hook without context-provider', async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const stream = renderToReadableStream(<Component />, testRequest);

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(`<div>bar</div>`);
    });

    it('should work context with "useContext" hook with context-provider', async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const stream = renderToReadableStream(
        <context-provider context={context} value={{ name: "foo" }}>
          <Component />
        </context-provider>,
        testRequest,
      );

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(
          `<context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo'}">
          <div>foo</div>
        </context-provider>
      `,
        ),
      );
    });

    it('should work context with "useContext" hook with context-provider and multiple providers', async () => {
      type TestContext = { name: string };

      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const Parent = () => {
        return Array.from({ length: 5 }, (_, i) => (
          <context-provider context={context} value={{ name: "foo" + i }}>
            <Component />
          </context-provider>
        ));
      };

      const stream = renderToReadableStream(<Parent />, testRequest);

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`<context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo0'}">
          <div>foo0</div>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo1'}">
          <div>foo1</div>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo2'}">
          <div>foo2</div>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo3'}">
          <div>foo3</div>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo4'}">
          <div>foo4</div>
        </context-provider>`),
      );
    });

    it('should work context with "useContext" hook with context-provider and multiple providers and nested context', async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const Parent = () => {
        return Array.from({ length: 5 }, (_, i) => (
          <context-provider context={context} value={{ name: "foo" + i }}>
            <context-provider context={context} value={{ name: "foo2" + i }}>
              <Component />
            </context-provider>
          </context-provider>
        ));
      };

      const element = <Parent />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`<context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo0'}">
          <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo20'}">
            <div>foo20</div>
          </context-provider>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo1'}">
          <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo21'}">
            <div>foo21</div>
          </context-provider>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo2'}">
          <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo22'}">
            <div>foo22</div>
          </context-provider>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo3'}">
          <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo23'}">
            <div>foo23</div>
          </context-provider>
        </context-provider>
        <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo4'}">
          <context-provider context="{'defaultValue':{'name':'bar'}}" value="{'name':'foo24'}">
            <div>foo24</div>
          </context-provider>
        </context-provider>`),
      );
    });

    it('should work "useContext" method with context-provider children prop', () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({
        color,
        children,
      }: Theme & { children: JSX.Element }) {
        return (
          <context-provider context={ThemeCtx} value={{ color }}>
            {children}
          </context-provider>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <ThemeProvider color="red">
          <ChildComponent />
        </ThemeProvider>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        `<context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}"><div>red</div></context-provider>`,
      );
    });

    it('should work "useContext" method with context-provider children prop and web-components (SSR)', () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({
        color,
        children,
      }: Theme & { children: JSX.Element }) {
        return (
          <context-provider context={ThemeCtx} value={{ color }}>
            {children}
          </context-provider>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
          ></SSRWebComponent>
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot></slot>
              </context-provider>
            </template>
            <child-component>
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
          </theme-provider>
        `),
      );
    });

    it('should work "useContext" method with context-provider slots with name and web-components (SSR)', () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
          ></SSRWebComponent>
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
            slot="with-theme"
          ></SSRWebComponent>
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
            <child-component slot="with-theme">
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
          </theme-provider>
        `),
      );
    });

    it("should ignore slotted content when there is a div wrapper without slot attribute", () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <div>
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
            ></SSRWebComponent>
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
              slot="with-theme"
            ></SSRWebComponent>
          </div>
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <div>
              <child-component>
                <template shadowrootmode="open">
                  <div>yellow</div>
                </template>
              </child-component>
              <child-component slot="with-theme">
                <template shadowrootmode="open">
                  <div>yellow</div>
                </template>
              </child-component>
            </div>
          </theme-provider>
        `),
      );
    });

    it("should apply slotted content when there is a div wrapper with slot attribute", () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <div slot="with-theme">
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
            ></SSRWebComponent>
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
              slot="with-theme"
            ></SSRWebComponent>
          </div>
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <div slot="with-theme">
              <child-component>
                <template shadowrootmode="open">
                  <div>red</div>
                </template>
              </child-component>
              <child-component slot="with-theme">
                <template shadowrootmode="open">
                  <div>red</div>
                </template>
              </child-component>
            </div>
          </theme-provider>
        `),
      );
    });

    it('should work "useContext" method with context-provider array of slots with name and web-components (SSR)', () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      function ServerComponent({ useTheme }: { useTheme: boolean }) {
        return (
          <>
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
              slot={useTheme ? "with-theme" : undefined}
            ></SSRWebComponent>
          </>
        );
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <ServerComponent useTheme={false} />
          <ServerComponent useTheme={true} />
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
            <child-component slot="with-theme">
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
          </theme-provider>
        `),
      );
    });

    it('should work "useContext" method with context-provider and repeated slots with name and web-components (SSR)', () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
            slot="with-theme"
          ></SSRWebComponent>
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
          ></SSRWebComponent>
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
            slot="with-theme"
          ></SSRWebComponent>
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <child-component slot="with-theme">
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
            <child-component slot="with-theme">
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
          </theme-provider>
        `),
      );
    });

    it("should not apply slotted context when slot attribute is in a server-component", () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ThemeProvider({ color }: Theme) {
        return (
          <>
            <context-provider context={ThemeCtx} value={{ color }}>
              <slot name="with-theme" />
            </context-provider>
            <slot />
          </>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      function ServerComponent() {
        return (
          <SSRWebComponent
            Component={ChildComponent}
            selector="child-component"
          />
        );
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ThemeProvider}
          selector="theme-provider"
          color="red"
        >
          <ServerComponent slot="with-theme" />
          <ServerComponent />
          <ServerComponent slot="with-theme" />
        </SSRWebComponent>,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <slot name="with-theme"></slot>
              </context-provider>
              <slot></slot>
            </template>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
            <child-component>
              <template shadowrootmode="open">
                <div>yellow</div>
              </template>
            </child-component>
          </theme-provider>
        `),
      );
    });

    it("should work context-provider inside another context-provider in web-components SSR", async () => {
      type Theme = { color: string };
      const ThemeCtx = createContext<Theme>({ color: "yellow" });

      function ColorTest({ color }: Theme) {
        return (
          <context-provider context={ThemeCtx} value={{ color }}>
            <context-provider context={ThemeCtx} value={{ color: "blue" }}>
              <SSRWebComponent
                Component={ChildComponent}
                selector="child-component"
              ></SSRWebComponent>
            </context-provider>
            <SSRWebComponent
              Component={ChildComponent}
              selector="child-component"
            ></SSRWebComponent>
          </context-provider>
        );
      }

      function ChildComponent({}, { useContext }: RequestContext) {
        const context = useContext(ThemeCtx);
        return <div>{context.value.color}</div>;
      }

      const stream = renderToReadableStream(
        <SSRWebComponent
          Component={ColorTest}
          selector="theme-provider"
          color="red"
        />,
        testRequest,
      );

      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`
          <theme-provider color="red">
            <template shadowrootmode="open">
              <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'red'}">
                <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'blue'}">
                  <child-component>
                    <template shadowrootmode="open">
                      <div>blue</div>
                    </template>
                  </child-component>
                </context-provider>
              <child-component>
              <template shadowrootmode="open">
                <div>red</div>
              </template>
            </child-component>
            </context-provider>
          </template>
        </theme-provider>`),
      );
    });

    it('should work context with "useContext" hook with "serverOnly" with context-provider', async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const stream = renderToReadableStream(
        <context-provider serverOnly context={context} value={{ name: "foo" }}>
          <Component />
        </context-provider>,
        testRequest,
      );

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(`<div>foo</div>`);
    });

    it('should work context with "useContext" hook  with "serverOnly" with context-provider and multiple providers', async () => {
      type TestContext = { name: string };

      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const Parent = () => {
        return Array.from({ length: 5 }, (_, i) => (
          <context-provider
            serverOnly
            context={context}
            value={{ name: "foo" + i }}
          >
            <Component />
          </context-provider>
        ));
      };

      const stream = renderToReadableStream(<Parent />, testRequest);

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<div>foo0</div><div>foo1</div><div>foo2</div><div>foo3</div><div>foo4</div>`,
      );
    });

    it('should work context with "useContext" hook with "serverOnly" with context-provider and multiple providers and nested context', async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      const Component = ({}, { useContext }: RequestContext) => {
        const contextSignal = useContext<TestContext>(context);
        return <div>{contextSignal.value.name}</div>;
      };

      const Parent = () => {
        return Array.from({ length: 5 }, (_, i) => (
          <context-provider
            serverOnly
            context={context}
            value={{ name: "foo" + i }}
          >
            <context-provider
              serverOnly
              context={context}
              value={{ name: "foo2" + i }}
            >
              <Component />
            </context-provider>
          </context-provider>
        ));
      };

      const element = <Parent />;
      const stream = renderToReadableStream(element, testRequest);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<div>foo20</div><div>foo21</div><div>foo22</div><div>foo23</div><div>foo24</div>`,
      );
    });

    it("should render [object Object] in case of rendering an object", async () => {
      const Component = () => {
        const object = {};
        return <div>{object}</div>;
      };

      const stream = renderToReadableStream(<Component />, testRequest);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(`<div>[object Object]</div>`);
    });

    it("should transfer request store data into the web store", () => {
      const Component = ({}, { store }: RequestContext) => {
        store.set("test", "test");
        store.transferToClient(["test"]);

        return <div>TEST</div>;
      };

      const element = (
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <Component />
          </body>
        </html>
      );

      const stream = renderToReadableStream(element, testRequest);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`<html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <div>TEST</div>
            <script>window._S=[["test","test"]]</script>
          </body>
        </html>`),
      );
    });
  });
});
