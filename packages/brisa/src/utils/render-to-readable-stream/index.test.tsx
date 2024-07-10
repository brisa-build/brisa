import { type MatchedRoute } from "bun";
import path from "node:path";
import {
  setSystemTime,
  afterEach,
  describe,
  expect,
  it,
  beforeEach,
  mock,
  spyOn,
} from "bun:test";
import renderToReadableStream from ".";
import { getConstants } from "@/constants";
import { normalizeQuotes, toInline } from "@/helpers";
import type { ComponentType, I18n, RequestContext, Translate } from "@/types";
import createContext from "@/utils/create-context";
import navigate from "@/utils/navigate";
import dangerHTML from "@/utils/danger-html";
import extendRequestContext from "@/utils/extend-request-context";
import notFound from "@/utils/not-found";
import SSRWebComponent from "@/utils/ssr-web-component";
import handleI18n from "@/utils/handle-i18n";
import { RenderInitiator } from "@/public-constants";

const emptyI18n = {
  locale: "",
  defaultLocale: "",
  locales: [],
  t: () => "",
  pages: {},
  overrideMessages: () => {},
} as I18n;

const FIXTURES_PATH = path.join(import.meta.dir, "..", "..", "__fixtures__");

const testRequest = extendRequestContext({
  originalRequest: new Request("http://test.com/"),
});
const testOptions = {
  request: testRequest,
  isPage: false,
};

let mockLog: ReturnType<typeof spyOn>;

describe("utils", () => {
  beforeEach(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    mockLog = spyOn(console, "log");
  });
  afterEach(() => {
    testRequest.store.clear();
    // @ts-ignore
    testRequest.webStore.clear();
    globalThis.mockConstants = undefined;
    // @ts-ignore
    globalThis.REGISTERED_ACTIONS = undefined;
    globalThis.FORCE_SUSPENSE_DEFAULT = undefined;
    mockLog.mockRestore();
  });

  describe("renderToReadableStream", () => {
    it("should render a simple JSX element", async () => {
      const element = <div class="test">Hello World</div>;
      const stream = renderToReadableStream(element, {
        ...testOptions,
        isPage: true,
      });
      const result = await Bun.readableStreamToText(stream);

      const expected = `<div class="test">Hello World</div>`;
      expect(result).toBe(expected);
      expect(mockLog.mock.calls.toString()).toContain(
        "You should have a <head> tag in your document. Please review your layout. You can experiment some issues with client JavaScript code without it.",
      );
    });

    it("should register the server action inside globalThis.REGISTERED_ACTIONS when is defined", async () => {
      globalThis.REGISTERED_ACTIONS = [];
      const element = (
        <div onClick={() => console.log("Hello Action")} class="test">
          Hello World
        </div>
      );
      const stream = renderToReadableStream(element, testOptions);
      await Bun.readableStreamToText(stream);

      expect(globalThis.REGISTERED_ACTIONS.length).toBe(1);

      const action = globalThis.REGISTERED_ACTIONS[0] as any;
      action();

      expect(mockLog).toHaveBeenCalledWith("Hello Action");
    });

    it("should NOT register the server action inside globalThis.REGISTERED_ACTIONS when is NOT defined", async () => {
      const element = (
        <div onClick={() => console.log("Hello Action")} class="test">
          Hello World
        </div>
      );
      const stream = renderToReadableStream(element, testOptions);
      await Bun.readableStreamToText(stream);

      expect(globalThis.REGISTERED_ACTIONS).toBeEmpty();
    });

    it("should render with a Request without RequextContext extension", async () => {
      const Component = ({ name }: { name: string }) => <div>Hello {name}</div>;
      const element = (
        <html>
          <head></head>
          <body>
            <Component name="Test" />
          </body>
        </html>
      );
      const stream = renderToReadableStream(element, {
        request: new Request("http://test.com/"),
      });
      const result = await Bun.readableStreamToText(stream);

      const expected = `<html><head></head><body><div>Hello Test</div></body></html>`;
      expect(result).toBe(expected);
    });

    it("should render the head with basepath attribute when has basePath", async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          basePath: "/docs",
        },
      };
      const Component = ({ name }: { name: string }) => <div>Hello {name}</div>;
      const element = (
        <html>
          <head></head>
          <body>
            <Component name="Test" />
          </body>
        </html>
      );
      const stream = renderToReadableStream(element, {
        request: new Request("http://test.com/"),
      });
      const result = await Bun.readableStreamToText(stream);

      const expected = `<html><head basepath="/docs"></head><body><div>Hello Test</div></body></html>`;
      expect(result).toBe(expected);
    });

    it('should not display the "head" tag warning if isPage=false', async () => {
      const element = <div class="test">Hello World</div>;
      const stream = renderToReadableStream(element, {
        ...testOptions,
        isPage: false,
      });
      const result = await Bun.readableStreamToText(stream);

      const expected = `<div class="test">Hello World</div>`;
      expect(result).toBe(expected);
      expect(mockLog.mock.calls.length).toBe(0);
    });

    it("should render an empty text node", () => {
      const element = <div class="test">{""}</div>;
      const stream = renderToReadableStream(element, testOptions);
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toBe(`<div class="test"></div>`);
    });

    it('should not display the "head" tag warning if the request is aborted', async () => {
      const request = extendRequestContext({
        originalRequest: new Request("http://test.com/"),
      });

      const SlowComponent = async () => {
        await Bun.sleep(10);
        return "Hello World";
      };

      const element = (
        <div class="test">
          <SlowComponent />
        </div>
      );
      const stream = renderToReadableStream(element, { request });

      request.signal.dispatchEvent(new Event("abort"));

      const result = await Bun.readableStreamToText(stream);
      const expected = `<div class="test">`;

      expect(result).toBe(expected);
      expect(mockLog.mock.calls.length).toBe(0);
    });

    it("should not log a warning when it has a <head> tag", async () => {
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testOptions);
      await Bun.readableStreamToText(stream);
      expect(mockLog.mock.calls.length).toEqual(0);
    });

    it('should display the "head" tag warning if isPage=true', async () => {
      const element = <div class="test">Hello World</div>;
      const stream = renderToReadableStream(element, {
        ...testOptions,
        isPage: true,
      });
      const result = await Bun.readableStreamToText(stream);

      const expected = `<div class="test">Hello World</div>`;
      expect(result).toBe(expected);
      expect(mockLog.mock.calls.toString()).toContain("No <head> tag");
    });

    it("should render a complex JSX element", async () => {
      const Component = ({ name, title }: { name: string; title: string }) => (
        <div title={title}>
          <h1>Hello {name}</h1>
          <p>This is a paragraph</p>
        </div>
      );
      const element = <Component name="World" title="Test" />;
      const stream = renderToReadableStream(element, testOptions);
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
        testOptions,
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
      const stream = renderToReadableStream(element, testOptions);
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
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      const expected = "<div>Hello World</div>";

      const stream2 = await renderToReadableStream(element, {
        ...testOptions,
        request: extendRequestContext({
          originalRequest: new Request("http://test.com/?name=Test"),
        }),
      });
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
        await renderToReadableStream(<Component />, testOptions);
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
        testOptions,
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

      const stream = renderToReadableStream(<Component />, testOptions);
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
        testOptions,
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
        testOptions,
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
        testOptions,
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

      const stream = renderToReadableStream(<ServerComponent />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<div>TRUE</div><div>TRUE</div>0");
    });

    it("should be possible to render in a tag {text|number} in a middle of string ", async () => {
      const Component = () => (
        <div>
          This is {1} {"example"}
        </div>
      );

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<div>This is 1 example</div>");
    });

    it("should be possible to render in a Fragment {text|number} in a middle of string", async () => {
      const Component = () => (
        <>
          This is {1} {"example"}
        </>
      );

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe('<div class="empty"></div><div class="empty"></div>');
    });

    it('should not be possible to send "undefined" as a attribute', async () => {
      const Component = ({ name }: { name: string }) => (
        <div title={name}>Hello {name}</div>
      );

      const stream = renderToReadableStream(
        <Component name={undefined as any} />,
        testOptions,
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
      req.i18n = { ...i18n, t: () => "", pages: {} } as any;
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
      const stream = renderToReadableStream(element, {
        ...testOptions,
        request: req,
      });
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
      req.i18n = { ...i18n, t: () => "", pages: {} } as any;
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
      const stream = renderToReadableStream(element, {
        ...testOptions,
        request: req,
      });
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
      const constants = getConstants();
      const request = extendRequestContext({
        originalRequest: new Request(testRequest),
        route: {
          filePath: "/index.js",
        } as MatchedRoute,
      });

      globalThis.mockConstants = {
        ...constants,
        BUILD_DIR: path.join(FIXTURES_PATH, "fakeBuild"),
      };

      const stream = renderToReadableStream(element, { request });
      const result = await Bun.readableStreamToText(stream);
      expect(result).not.toContain(
        `<script src="/_brisa/pages/_rpc-${constants.VERSION_HASH}.js"></script>`,
      );
      expect(result).toContain(
        `<script src="/_brisa/pages/_unsuspense-${constants.VERSION_HASH}.js"></script>`,
      );
    });

    it("should inject the unsuspense script with basePath", async () => {
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const constants = getConstants();
      const request = extendRequestContext({
        originalRequest: new Request(testRequest),
        route: {
          filePath: "/index.js",
        } as MatchedRoute,
      });

      globalThis.mockConstants = {
        ...constants,
        BUILD_DIR: path.join(FIXTURES_PATH, "fakeBuild"),
        CONFIG: {
          basePath: "/test",
        },
      };

      const stream = renderToReadableStream(element, { request });
      const result = await Bun.readableStreamToText(stream);
      expect(result).not.toContain(
        `<script src="/test/_brisa/pages/_rpc-${constants.VERSION_HASH}.js"></script>`,
      );
      expect(result).toContain(
        `<script src="/test/_brisa/pages/_unsuspense-${constants.VERSION_HASH}.js"></script>`,
      );
    });

    it("should inject the action rpc script", async () => {
      const constants = getConstants();
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const request = extendRequestContext({
        originalRequest: new Request(testRequest),
        route: {
          filePath: "/somepage.js",
        } as MatchedRoute,
      });

      globalThis.mockConstants = {
        ...constants,
        BUILD_DIR: path.join(FIXTURES_PATH, "fakeBuild"),
      };

      const stream = renderToReadableStream(element, { request });
      const result = await Bun.readableStreamToText(stream);
      expect(result).not.toContain(
        `<script src="/_brisa/pages/_unsuspense-${constants.VERSION_HASH}.js"></script>`,
      );
      expect(result).toContain(
        `<script src="/_brisa/pages/_rpc-${constants.VERSION_HASH}.js"></script>`,
      );
    });

    it("should inject the action rpc script with basePath", async () => {
      const constants = getConstants();
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const request = extendRequestContext({
        originalRequest: new Request(testRequest),
        route: {
          filePath: "/somepage.js",
        } as MatchedRoute,
      });

      globalThis.mockConstants = {
        ...constants,
        BUILD_DIR: path.join(FIXTURES_PATH, "fakeBuild"),
        CONFIG: {
          basePath: "/test",
        },
      };

      const stream = renderToReadableStream(element, { request });
      const result = await Bun.readableStreamToText(stream);
      expect(result).not.toContain(
        `<script src="/test/_brisa/pages/_unsuspense-${constants.VERSION_HASH}.js"></script>`,
      );
      expect(result).toContain(
        `<script src="/test/_brisa/pages/_rpc-${constants.VERSION_HASH}.js"></script>`,
      );
    });

    it("should inject client i18n script if some web component consumes translations", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          messages: {
            en: {
              hello: "test",
            },
          },
        },
        PAGES_DIR: path.join(FIXTURES_PATH, "pages"),
        BUILD_DIR: FIXTURES_PATH,
      };

      const request = extendRequestContext({
        originalRequest: extendRequestContext({
          originalRequest: new Request("http://test.com/en"),
        }),
        route: {
          src: "page-with-web-component.js",
          filePath: path.join(
            FIXTURES_PATH,
            "pages",
            "page-with-web-component.js",
          ),
        } as MatchedRoute,
      });

      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );

      handleI18n(request);

      const stream = renderToReadableStream(element, { request });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toBe(
        toInline(`
          <html lang="en" dir="ltr">
            <head></head>
            <body>
              <script src="/_brisa/pages/page-with-web-component-hash-en.js"></script>
              <script async fetchpriority="high" src="/_brisa/pages/page-with-web-component-hash.js"></script>
            </body>
          </html>
      `),
      );
    });

    it("should inject client i18n script if some web component consumes translations with basePath", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          messages: {
            en: {
              hello: "test",
            },
          },
        },
        PAGES_DIR: path.join(FIXTURES_PATH, "pages"),
        BUILD_DIR: FIXTURES_PATH,
        CONFIG: {
          basePath: "/test",
        },
      };

      const request = extendRequestContext({
        originalRequest: extendRequestContext({
          originalRequest: new Request("http://test.com/en"),
        }),
        route: {
          src: "page-with-web-component.js",
          filePath: path.join(
            FIXTURES_PATH,
            "pages",
            "page-with-web-component.js",
          ),
        } as MatchedRoute,
      });

      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );

      handleI18n(request);

      const stream = renderToReadableStream(element, { request });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toBe(
        toInline(`
          <html lang="en" dir="ltr">
            <head basepath="/test"></head>
            <body>
              <script src="/test/_brisa/pages/page-with-web-component-hash-en.js"></script>
              <script async fetchpriority="high" src="/test/_brisa/pages/page-with-web-component-hash.js"></script>
            </body>
          </html>
      `),
      );
    });

    it("should inject client i18n INLINE script if some web component consumes translations AND overrideMessages is used", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          messages: {
            en: {
              clientOne: "test",
              serverOne: "test2",
            },
          },
        },
        PAGES_DIR: path.join(FIXTURES_PATH, "pages"),
        BUILD_DIR: FIXTURES_PATH,
      };

      const request = extendRequestContext({
        originalRequest: extendRequestContext({
          originalRequest: new Request("http://test.com/en"),
        }),
        route: {
          src: "page-with-web-component.js",
          filePath: path.join(
            FIXTURES_PATH,
            "pages",
            "page-with-web-component.js",
          ),
        } as MatchedRoute,
      });

      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );

      handleI18n(request);

      request.i18n.overrideMessages(() => ({
        clientOne: "foo",
        serverOne: "bar",
      }));

      const stream = renderToReadableStream(element, { request });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toBe(
        toInline(`
          <html lang="en" dir="ltr">
            <head></head>
            <body>
              <script>window.i18nMessages={"clientOne":"foo"}</script>
              <script async fetchpriority="high" src="/_brisa/pages/page-with-web-component-hash.js"></script>
            </body>
          </html>
      `),
      );
    });

    it("should inject client i18n INLINE script if some web component consumes translations AND overrideMessages is used with basePath", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          messages: {
            en: {
              clientOne: "test",
              serverOne: "test2",
            },
          },
        },
        PAGES_DIR: path.join(FIXTURES_PATH, "pages"),
        BUILD_DIR: FIXTURES_PATH,
        CONFIG: {
          basePath: "/test",
        },
      };

      const request = extendRequestContext({
        originalRequest: extendRequestContext({
          originalRequest: new Request("http://test.com/en"),
        }),
        route: {
          src: "page-with-web-component.js",
          filePath: path.join(
            FIXTURES_PATH,
            "pages",
            "page-with-web-component.js",
          ),
        } as MatchedRoute,
      });

      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );

      handleI18n(request);

      request.i18n.overrideMessages(() => ({
        clientOne: "foo",
        serverOne: "bar",
      }));

      const stream = renderToReadableStream(element, { request });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toBe(
        toInline(`
          <html lang="en" dir="ltr">
            <head basepath="/test"></head>
            <body>
              <script>window.i18nMessages={"clientOne":"foo"}</script>
              <script async fetchpriority="high" src="/test/_brisa/pages/page-with-web-component-hash.js"></script>
            </body>
          </html>
      `),
      );
    });

    it("should render the style tag when the css is used in the component", async () => {
      const Component = ({}, { css }: RequestContext) => {
        css`
          .red {
            color: red;
          }
        `;
        css`
          .blue {
            color: blue;
          }
        `;

        return <div class="red">Hello</div>;
      };

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
          <style>.red {color: red;}.blue {color: blue;}</style>
          <div class="red">Hello</div>
        `),
      );
    });

    it("should add different styles in different components", async () => {
      const Component = ({}, { css }: RequestContext) => {
        css`
          .red {
            color: red;
          }
        `;

        return <div class="red">Hello</div>;
      };

      const Component2 = ({}, { css }: RequestContext) => {
        css`
          .blue {
            color: blue;
          }
        `;

        return <div class="blue">Hello</div>;
      };

      const stream = renderToReadableStream(
        <>
          <Component />
          <Component2 />
        </>,
        testOptions,
      );

      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
        toInline(`
          <style>.red {color: red;}</style>
          <div class="red">Hello</div>
          <style>.blue {color: blue;}</style>
          <div class="blue">Hello</div>
        `),
      );
    });

    it("should work an async generator component with css", async () => {
      const Component = async function* ({}, { css }: RequestContext) {
        yield <div class="red">Hello</div>;

        css`
          .red {
            color: red;
          }
        `;

        yield <div class="red">Foo</div>;
      };

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
        toInline(`
          <div class="red">Hello</div>
          <style>.red {color: red;}</style>
          <div class="red">Foo</div>
        `),
      );
    });

    it("should render the suspense component before if the async component support it", async () => {
      const Component = async () => {
        await Promise.resolve();
        return <div>Test</div>;
      };

      Component.suspense = () => <b>Loading...</b>;

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toStartWith(
        `<div id="S:1"><b>Loading...</b></div><template id="U:1"><div>Test</div></template><script id="R:1">u$('1')</script>`,
      );
    });

    it("should render the unsuspense part inside the html tag (when exists)", async () => {
      const Component = async () => {
        await Bun.sleep(0); // Next clock tick
        return <div>Test</div>;
      };

      Component.suspense = () => <b>Loading...</b>;

      const Page = () => (
        <html>
          <head></head>
          <body>
            <Component />
          </body>
        </html>
      );

      const stream = renderToReadableStream(<Page />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
        `<html><head></head><body><div id="S:1"><b>Loading...</b></div></body></html><template id="U:1"><div>Test</div></template><script id="R:1">u$('1')</script>`,
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

      const stream = renderToReadableStream(<Page />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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
        overrideMessages: () => {},
        locale: "en",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        pages: {},
      } as any;
      const element = (
        <html>
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toStartWith(`<html lang="en" dir="ltr"><head>`);
    });

    it("should translate the URLs to the correct path", async () => {
      testRequest.i18n = {
        overrideMessages: () => {},
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

      const stream = renderToReadableStream(<ChangeLocale />, testOptions);
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

    it("should use dynamic routes to the correct path", async () => {
      testRequest.i18n = {
        locale: "en",
        locales: ["en", "es", "it", "fr", "de"],
        defaultLocale: "en",
        t: ((v: string) => v.toUpperCase()) as Translate,
        overrideMessages: () => {},
        pages: {},
      };

      testRequest.route = {
        name: "/user/[username]",
        pathname: "/user/aralroca",
        params: {
          username: "aralroca",
        },
      } as unknown as MatchedRoute;

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

      const stream = renderToReadableStream(<ChangeLocale />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(
        toInline(`
          <ul>
            <li>
              <a href="/es/user/aralroca">ES</a>
            </li>
            <li>
              <a href="/it/user/aralroca">IT</a>
            </li>
            <li>
              <a href="/fr/user/aralroca">FR</a>
            </li>
            <li>
              <a href="/de/user/aralroca">DE</a>
            </li>
          </ul>
        `),
      );
    });

    it("should translate dynamic routes to the correct path", async () => {
      testRequest.i18n = {
        locale: "en",
        locales: ["en", "es", "it", "fr", "de"],
        defaultLocale: "en",
        t: ((v: string) => v.toUpperCase()) as Translate,
        overrideMessages: () => {},
        pages: {
          "/user/[username]": {
            en: "/user/[username]",
            es: "/usuario/[username]",
            it: "/utente/[username]",
            fr: "/utilisateur/[username]",
            de: "/benutzer/[username]",
          },
        },
      };

      testRequest.route = {
        name: "/user/[username]",
        pathname: "/user/aralroca",
        params: {
          username: "aralroca",
        },
      } as unknown as MatchedRoute;

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

      const stream = renderToReadableStream(<ChangeLocale />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(
        toInline(`
          <ul>
            <li>
              <a href="/es/usuario/aralroca">ES</a>
            </li>
            <li>
              <a href="/it/utente/aralroca">IT</a>
            </li>
            <li>
              <a href="/fr/utilisateur/aralroca">FR</a>
            </li>
            <li>
              <a href="/de/benutzer/aralroca">DE</a>
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
        overrideMessages: () => {},
        pages: {},
      } as any;
      const element = (
        <html lang="en">
          <head></head>
          <body></body>
        </html>
      );
      const stream = renderToReadableStream(element, testOptions);
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
        overrideMessages: () => {},
        pages: {},
      } as any;
      const home = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/">Test</a>, testOptions),
      );
      const withParam = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/test?some=true">Test</a>, testOptions),
      );
      const withHash = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/test#some">Test</a>, testOptions),
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
        overrideMessages: () => {},
        pages: {},
      } as any;
      const essencePage = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence">Test</a>, testOptions),
      );
      const withParam = await Bun.readableStreamToText(
        renderToReadableStream(
          <a href="/essence?some=true">Test</a>,
          testOptions,
        ),
      );
      const withHash = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence#some">Test</a>, testOptions),
      );

      testRequest.i18n = emptyI18n;
      expect(essencePage).toEqual(`<a href="/es/essence">Test</a>`);
      expect(withParam).toEqual(`<a href="/es/essence?some=true">Test</a>`);
      expect(withHash).toEqual(`<a href="/es/essence#some">Test</a>`);
    });

    it('should render the "a" tag with the locale if i18n is enabled with trailingSlash', async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          trailingSlash: true,
        },
      };

      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        overrideMessages: () => {},
        pages: {},
      } as any;
      const essencePage = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence">Test</a>, testOptions),
      );
      const withParam = await Bun.readableStreamToText(
        renderToReadableStream(
          <a href="/essence?some=true">Test</a>,
          testOptions,
        ),
      );
      const withHash = await Bun.readableStreamToText(
        renderToReadableStream(<a href="/essence#some">Test</a>, testOptions),
      );

      testRequest.i18n = emptyI18n;
      expect(essencePage).toEqual(`<a href="/es/essence/">Test</a>`);
      expect(withParam).toEqual(`<a href="/es/essence/?some=true">Test</a>`);
      expect(withHash).toEqual(`<a href="/es/essence/#some">Test</a>`);
    });

    it('should NOT render the "a" tag with the locale if the url is external', async () => {
      testRequest.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
        pages: {},
      } as any;
      const element = <a href="http://test.com/test">Test</a>;
      const stream = renderToReadableStream(element, testOptions);
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
      const stream = renderToReadableStream(element, testOptions);
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
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      testRequest.i18n = emptyI18n;
      expect(result).toBe(`<a href="/en/test">Test</a>`);
    });

    it("should not be possible to inject HTML as string directly in the JSX element", async () => {
      const element = <div>{`<script>alert('test')</script>`}</div>;
      const stream = renderToReadableStream(element, testOptions);
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
      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(
        `<div><h1>Example</h1>&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;</div>`,
      );
    });

    it('should be possible to inject HTML as string in the JSX using the "dangerHTML" helper', async () => {
      const element = <div>{dangerHTML(`<script>alert('test')</script>`)}</div>;
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(`<div><script>alert('test')</script></div>`);
    });

    it("should not be possible to inject HTML as children string directly in the JSX", async () => {
      const Component = () => <>{`<script>alert('test')</script>`}</>;
      const element = <Component />;
      const stream = renderToReadableStream(element, testOptions);
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
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe(`<script>alert('test')</script>`);
    });

    it("should render the head element with the canonical", () => {
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

      const stream = renderToReadableStream(element, {
        ...testOptions,
        head: Head as unknown as ComponentType,
      });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html><head><link rel="canonical" href="\/"><\/link><title>Test<\/title><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should render the head element with the title replacing the original title", () => {
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

      const stream = renderToReadableStream(element, {
        ...testOptions,
        head: Head as unknown as ComponentType,
      });
      const result = Bun.readableStreamToText(stream);
      expect(result).resolves.toMatch(
        /<html><head><title id="title">Test 2<\/title><\/head><body><\/body><\/html>/gm,
      );
    });

    it("should allow multiple ids outside the head (not ideal but should not break the render)", () => {
      const element = (
        <html>
          <head></head>
          <body>
            <h1 id="a">A</h1>
            <h1 id="a">B</h1>
          </body>
        </html>
      );

      const stream = renderToReadableStream(element, testOptions);
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

      const stream = renderToReadableStream(element, {
        ...testOptions,
        request: req,
      });

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
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog open><h1>Test</h1></dialog>");
    });

    it('should render "open" attribute without content in the "dialog" tag when opEN={true} (no lowercase)', async () => {
      const element = (
        <dialog open={true}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog open><h1>Test</h1></dialog>");
    });

    it('should not render "open" attribute in the "dialog" tag when opEN={false} (no lowercase)', async () => {
      const element = (
        <dialog open={false}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog><h1>Test</h1></dialog>");
    });

    it('should not render "open" attribute in the "dialog" tag when open={false}', async () => {
      const element = (
        <dialog open={false}>
          <h1>Test</h1>
        </dialog>
      );
      const stream = renderToReadableStream(element, testOptions);
      const result = await Bun.readableStreamToText(stream);
      expect(result).toBe("<dialog><h1>Test</h1></dialog>");
    });

    it("should serialize an attribute that is an object as a string", async () => {
      const element = <div data-test={{ a: 1, b: 2 }} />;
      const stream = renderToReadableStream(element, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);

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
        testOptions,
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

      const stream = renderToReadableStream(<Parent />, testOptions);

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
      const stream = renderToReadableStream(element, testOptions);
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
        testOptions,
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
        testOptions,
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
        testOptions,
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
        testOptions,
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

    it("should not conflict the same slot name in different web-components (SSR)", () => {
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
            Component={ThemeProvider}
            selector="theme-provider"
            color="blue"
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
          </SSRWebComponent>
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
        testOptions,
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
            <theme-provider color="blue">
              <template shadowrootmode="open">
                <context-provider context="{'defaultValue':{'color':'yellow'}}" value="{'color':'blue'}">
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
                  <div>blue</div>
                </template>
              </child-component>
            </theme-provider>
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
        testOptions,
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
        testOptions,
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
        testOptions,
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
        testOptions,
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
        testOptions,
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
        testOptions,
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

      const stream = renderToReadableStream(<Parent />, testOptions);

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
      const stream = renderToReadableStream(element, testOptions);
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

      const stream = renderToReadableStream(<Component />, testOptions);
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

      const stream = renderToReadableStream(element, testOptions);
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

    it("should transfer request store data into the web store working with suspense", () => {
      async function Component({}, { store }: RequestContext) {
        await Bun.sleep(0);
        store.set("test", "test");
        store.transferToClient(["test"]);

        return <div>TEST</div>;
      }

      Component.suspense = () => <div>Loading...</div>;

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

      const stream = renderToReadableStream(element, testOptions);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`<html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <div id="S:1"><div>Loading...</div></div>
          </body>
        </html>
        <template id="U:1"><div>TEST</div></template>
        <script id="R:1">u$('1')</script>
        <script>window._S=[["test","test"]]</script>
        `),
      );
    });

    it("should transfer request store with a component without head, body, and html tags", () => {
      const Component = ({}, { store }: RequestContext) => {
        store.set("test", "test");
        store.transferToClient(["test"]);

        return <div>TEST</div>;
      };

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`<div>TEST</div><script>window._S=[["test","test"]]</script>`),
      );
    });

    it("should transfer request store twice in a different way data with and without suspense", () => {
      async function ComponentWithSuspense({}, { store }: RequestContext) {
        await Bun.sleep(0);
        store.set("suspense", "foo");
        store.transferToClient(["suspense"]);

        return <div>Suspense</div>;
      }

      ComponentWithSuspense.suspense = () => <div>Loading...</div>;

      function ComponentWithoutSuspense({}, { store }: RequestContext) {
        store.set("no-suspense", "bar");
        store.transferToClient(["no-suspense"]);

        return <div>Without Suspense</div>;
      }

      const element = (
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <ComponentWithoutSuspense />
            <ComponentWithSuspense />
          </body>
        </html>
      );

      const stream = renderToReadableStream(element, testOptions);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(`<html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <div>Without Suspense</div>
            <div id="S:1"><div>Loading...</div></div>
            <script>window._S=[["no-suspense","bar"]]</script>
          </body>
        </html>
        <template id="U:1"><div>Suspense</div></template>
        <script id="R:1">u$('1')</script>
        <script>for(let e of [["suspense","foo"]]) _S.push(e)</script>
        `),
      );
    });

    it('should add the meta with noindex and soft redirect to 404 when the "notFound" method is called', async () => {
      const Component = () => {
        notFound();
        return <div>TEST</div>;
      };

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      const script404 = `(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()`;

      expect(result).toBe(
        toInline(`
          <meta name="robots" content="noindex" />
          <script>${script404}</script>
        `),
      );

      // Test script 404 behavior
      globalThis.location = {
        href: "http://localhost/",
        replace: mock((v) => v),
      } as any;

      eval(script404);
      expect(globalThis.location.replace).toHaveBeenCalledWith(
        "http://localhost/?_not-found=1",
      );
      globalThis.location = undefined as any;
    });

    it('should add the meta with noindex and soft redirect to 404 when the "notFound" method is called + transfer store to client', async () => {
      const Component = () => {
        notFound();
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.store.set("server-foo", "server-bar");
      request.store.set("foo", "bar");
      request.store.transferToClient(["foo"]);
      request.store.transferToClient(["foo"]);
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const script404 = `(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()`;

      expect(result).toBe(
        toInline(`
          <meta name="robots" content="noindex" />
          <script>window._S=[["foo","bar"]]</script>
          <script>${script404}</script>
        `),
      );

      // Test script 404 behavior
      globalThis.location = {
        href: "http://localhost/",
        replace: mock((v) => v),
      } as any;

      eval(script404);
      expect(globalThis.location.replace).toHaveBeenCalledWith(
        "http://localhost/?_not-found=1",
      );
      globalThis.location = undefined as any;
    });

    it('should add the meta with noindex and soft navigation (no redirect) to 404 when the "notFound" method is called from server action rerendering', async () => {
      const Component = () => {
        notFound();
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.renderInitiator = RenderInitiator.SERVER_ACTION;
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const script404 = `(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.assign(u.toString())})()`;

      expect(result).toBe(
        toInline(`
          <meta name="robots" content="noindex" />
          <script>${script404}</script>
        `),
      );

      // Test script 404 behavior
      globalThis.location = {
        href: "http://localhost/",
        assign: mock((v) => v),
      } as any;

      eval(script404);
      expect(globalThis.location.assign).toHaveBeenCalledWith(
        "http://localhost/?_not-found=1",
      );
      globalThis.location = undefined as any;
    });

    it('should add the meta with noindex and soft navigate (no redirect) to 404 when the "notFound" method is called + transfer store to client', async () => {
      const Component = () => {
        notFound();
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.renderInitiator = RenderInitiator.SERVER_ACTION;
      request.store.set("server-foo", "server-bar");
      request.store.set("foo", "bar");
      request.store.transferToClient(["foo"]);
      request.store.transferToClient(["foo"]);
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const script404 = `(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.assign(u.toString())})()`;

      expect(result).toBe(
        toInline(`
          <meta name="robots" content="noindex" />
          <script type="application/json" id="S">[["foo","bar"]]</script>
          <script>${script404}</script>
        `),
      );

      // Test script 404 behavior
      globalThis.location = {
        href: "http://localhost/",
        assign: mock((v) => v),
      } as any;

      eval(script404);
      expect(globalThis.location.assign).toHaveBeenCalledWith(
        "http://localhost/?_not-found=1",
      );
      globalThis.location = undefined as any;
    });

    it('should add the location.replace script when the "navigate" method is called during rendering', async () => {
      const Component = () => {
        navigate("http://localhost/foo");
        return <div>TEST</div>;
      };

      const stream = renderToReadableStream(<Component />, testOptions);
      const result = await Bun.readableStreamToText(stream);
      const scriptNavigate = `window._xm="reactivity";location.replace("http://localhost/foo")`;

      expect(result).toBe(toInline(`<script>${scriptNavigate}</script>`));

      // Test script navigate behavior
      globalThis.window = {} as any;
      globalThis.location = {
        replace: mock((v) => v),
      } as any;

      eval(scriptNavigate);
      expect(globalThis.location.replace).toHaveBeenCalledWith(
        "http://localhost/foo",
      );
      globalThis.location = undefined as any;
      globalThis.window = undefined as any;
    });

    it('should add the location.replace script transferring the client store when the "navigate" method is called during rendering', async () => {
      const Component = () => {
        navigate("http://localhost/foo");
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.store.set("foo", "bar");
      request.store.set("foo-client", "bar-client");
      request.store.transferToClient(["foo-client"]);
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const scriptNavigate = `window._xm="reactivity";location.replace("http://localhost/foo")`;
      const scriptStore = `window._S=[["foo-client","bar-client"]]`;

      expect(result).toBe(
        toInline(
          `<script>${scriptStore}</script><script>${scriptNavigate}</script>`,
        ),
      );

      // Test script navigate behavior
      globalThis.window = {} as any;
      globalThis.location = {
        replace: mock((v) => v),
      } as any;

      eval(scriptNavigate);
      expect(globalThis.location.replace).toHaveBeenCalledWith(
        "http://localhost/foo",
      );
      globalThis.location = undefined as any;
      globalThis.window = undefined as any;
    });

    it('should add the location.assign script when the "navigate" method is called during server action rerendering', async () => {
      const Component = () => {
        navigate("http://localhost/foo");
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.renderInitiator = RenderInitiator.SERVER_ACTION;
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const scriptNavigate = `window._xm="reactivity";location.assign("http://localhost/foo")`;

      expect(result).toBe(toInline(`<script>${scriptNavigate}</script>`));

      // Test script navigate behavior
      globalThis.window = {} as any;
      globalThis.location = {
        assign: mock((v) => v),
      } as any;

      eval(scriptNavigate);
      expect(globalThis.location.assign).toHaveBeenCalledWith(
        "http://localhost/foo",
      );
      globalThis.location = undefined as any;
      globalThis.window = undefined as any;
    });

    it('should add the location.assign script transferring the client store when the "navigate" method is called during server action rerendering', async () => {
      const Component = () => {
        navigate("http://localhost/foo");
        return <div>TEST</div>;
      };

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.renderInitiator = RenderInitiator.SERVER_ACTION;
      request.store.set("foo", "bar");
      request.store.set("foo-client", "bar-client");
      request.store.transferToClient(["foo-client"]);
      const stream = renderToReadableStream(<Component />, { request });
      const result = await Bun.readableStreamToText(stream);
      const scriptNavigate = `window._xm="reactivity";location.assign("http://localhost/foo")`;
      const scriptStore = '[["foo-client","bar-client"]]';

      expect(result).toBe(
        toInline(
          `<script type="application/json" id="S">${scriptStore}</script><script>${scriptNavigate}</script>`,
        ),
      );

      // Test script navigate behavior
      globalThis.window = {} as any;
      globalThis.location = {
        assign: mock((v) => v),
      } as any;

      eval(scriptNavigate);
      expect(globalThis.location.assign).toHaveBeenCalledWith(
        "http://localhost/foo",
      );
      globalThis.location = undefined as any;
      globalThis.window = undefined as any;
    });

    it("should log an error and not throw error to avoid breaking the rendering when component render fails", async () => {
      const Component = () => {
        throw new Error("test");
      };

      const stream = renderToReadableStream(
        <html>
          <head></head>
          <body>
            <Component />
          </body>
        </html>,
        testOptions,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toStartWith(toInline(`<html><head></head><body>`));
      expect(result).toContain(
        "Error in SSR of Component component with props {}",
      );
      expect(result).toEndWith(toInline(`</body></html>`));
      expect(mockLog.mock.calls.toString()).toContain(
        "Error in SSR of Component component with props {}",
      );
    });

    it("should display the name of the functional component in the error", async () => {
      function SomeTestComponent() {
        throw new Error("test");
      }

      const stream = renderToReadableStream(
        <html>
          <head></head>
          <body>
            <SomeTestComponent />
          </body>
        </html>,
        testOptions,
      );
      const result = await Bun.readableStreamToText(stream);
      expect(result).toStartWith(toInline(`<html><head></head><body>`));
      expect(result).toContain(
        "Error in SSR of SomeTestComponent component with props {}",
      );
      expect(result).toEndWith(toInline(`</body></html>`));
      expect(mockLog.mock.calls.toString()).toContain(
        "Error in SSR of SomeTestComponent component with props {}",
      );
    });

    it("should render correctly if there is an async event in some element", () => {
      async function ComponentWithAsyncEvent({}, { i18n }: RequestContext) {
        async function onAsyncEvent() {
          console.log("foo");
          await i18n.overrideMessages(async (messages) => ({
            ...messages,
            modalDictionary: { someKey: "Some key" },
          }));
        }

        return <button onClick={onAsyncEvent}>TEST</button>;
      }

      const element = <ComponentWithAsyncEvent />;

      const stream = renderToReadableStream(element, testOptions);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(toInline(`<button>TEST</button>`));
    });

    it("should keep the parent actionId correctly with nested server actions", () => {
      // Note: data-action-onclick and data-action are added in compile-time
      const Child = ({ onClickAction }: any) => (
        <button onClick={onClickAction} data-action-onclick="a3_1" data-action>
          TEST
        </button>
      );
      const Parent = ({ onClick }: any) => (
        <Child onClickAction={onClick} data-action-onclick="a2_1" data-action />
      );
      const GrantParent = () => (
        <Parent onClick={() => {}} data-action-onclick="a1_1" data-action />
      );

      Child._hasActions = Parent._hasActions = GrantParent._hasActions = true;

      const element = <GrantParent />;

      const stream = renderToReadableStream(element, testOptions);
      const result = Bun.readableStreamToText(stream);

      expect(result).resolves.toBe(
        toInline(
          `<!--o:0-->
            <!--o:1-->
              <!--o:2-->
                <button data-action-onclick="a1_1" data-action data-cid="2" data-actions="[[['onClickAction','a1_1','0']]]">
                TEST
               </button>
              <!--c:2-->
            <!--c:1-->
          <!--c:0-->`,
        ),
      );
    });

    it("should render a server component with async generator", async () => {
      async function* List() {
        yield <h2>Count: 0</h2>;
        yield <h2>Count: 1</h2>;
        yield <h2>Count: 2</h2>;
        yield <h2>Count: 3</h2>;
      }

      const stream = renderToReadableStream(<List />, testOptions);

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        "<h2>Count: 0</h2><h2>Count: 1</h2><h2>Count: 2</h2><h2>Count: 3</h2>",
      );
    });

    it("should render a server component with async generator and context", async () => {
      type TestContext = { name: string };
      const context = createContext<TestContext>({ name: "bar" });

      async function* List({}, { useContext }: RequestContext) {
        const contextSignal = useContext<TestContext>(context);
        yield <h2>{contextSignal.value.name}</h2>;
      }

      const stream = renderToReadableStream(
        <context-provider serverOnly context={context} value={{ name: "foo" }}>
          <List />
        </context-provider>,
        testOptions,
      );

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe("<h2>foo</h2>");
    });

    it("should render data-actions with only the action props", async () => {
      const Component = ({ foo }: any) => (
        <p data-action-onclick="a1_1" data-action>
          {foo}
        </p>
      );
      const onClick = () => {};
      onClick.actionId = "a1_1";
      onClick.cid = "1";
      const stream = renderToReadableStream(
        <Component foo="bar" onClick={onClick} />,
        testOptions,
      );
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        "<p data-action-onclick=\"a1_1\" data-action data-actions=\"[[['onClick','a1_1','1']]]\">bar</p>",
      );
    });

    it("should not render data-actions if any prop is an action", async () => {
      const Component = ({ foo }: any) => (
        <p data-action-onclick="a1_1" data-action>
          {foo}
        </p>
      );
      const onClick = () => {};
      onClick.actionId = "a1_1";
      const stream = renderToReadableStream(
        <Component foo="bar" bar="baz" />,
        testOptions,
      );
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe('<p data-action-onclick="a1_1" data-action>bar</p>');
    });

    it("should skip suspense when applySuspense is false", async () => {
      const Component = async () => <div>test</div>;
      Component.suspense = () => <div>suspense</div>;
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
        applySuspense: false,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe("<div>test</div>");
    });

    it("should do suspense when applySuspense is true", async () => {
      const Component = async () => <div>test</div>;
      Component.suspense = () => <div>suspense</div>;
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
        applySuspense: true,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<div id="S:1"><div>suspense</div></div><template id="U:1"><div>test</div></template><script id="R:1">u$('1')</script>`,
      );
    });

    it("should skip suspense when FORCE_SUSPENSE_DEFAULT=false", async () => {
      globalThis.FORCE_SUSPENSE_DEFAULT = false;
      const Component = async () => <div>test</div>;
      Component.suspense = () => <div>suspense</div>;
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe("<div>test</div>");
    });

    it("should add brisa-error-dialog when IS_DEVELOPMENT and IS_SERVE_PROCESS are true", async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: false,
        IS_DEVELOPMENT: true,
        IS_SERVE_PROCESS: true,
      };

      const Component = async () => (
        <html>
          <head></head>
          <body>test</body>
        </html>
      );
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<html><head></head><body>test<brisa-error-dialog skipSSR></brisa-error-dialog></body></html>`,
      );
    });

    it("should NOT add brisa-error-dialog when IS_SERVE_PROCESS is true but IS_DEVELOPMENT is false", async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        IS_SERVE_PROCESS: true,
      };

      const Component = async () => (
        <html>
          <head></head>
          <body>test</body>
        </html>
      );
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(`<html><head></head><body>test</body></html>`);
    });

    it("should NOT add brisa-error-dialog when IS_DEVELOPMENT is true but IS_SERVE_PROCESS is false", async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: false,
        IS_DEVELOPMENT: true,
        IS_SERVE_PROCESS: false,
      };

      const Component = async () => (
        <html>
          <head></head>
          <body>test</body>
        </html>
      );
      const stream = renderToReadableStream(<Component />, {
        ...testOptions,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(`<html><head></head><body>test</body></html>`);
    });

    it("should render comments wrapping a component with _hasActions=true", async () => {
      const Component = () => <div data-action>test</div>;
      Component._hasActions = true;

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.id = "123456";

      const stream = renderToReadableStream(
        <Component data-action-onclick="a1_1" data-action />,
        {
          ...testOptions,
          request,
        },
      );
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<!--o:0--><div data-action data-cid="0">test</div><!--c:0-->`,
      );
    });

    it("should render several comments with different final number to each component of a list", async () => {
      const Component = ({ foo }: any) => <div data-action>{foo}</div>;
      Component._hasActions = true;

      const List = ({ onClick }: any) => (
        <>
          <Component
            foo="bar"
            onClick={onClick}
            data-action-onclick="a1_1"
            data-action
          />
          <Component
            foo="baz"
            onClick={onClick}
            data-action-onclick="a2_1"
            data-action
          />
          <Component
            foo="foo"
            onClick={onClick}
            data-action-onclick="a3_1"
            data-action
          />
        </>
      );

      const request = extendRequestContext({
        originalRequest: new Request("http://localhost/"),
      });
      request.id = "123456";

      const stream = renderToReadableStream(<List />, {
        ...testOptions,
        request,
      });

      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        normalizeQuotes(
          `
            <!--o:0-->
              <div data-action data-cid="0">bar</div>
            <!--c:0-->
            
            <!--o:1-->
              <div data-action data-cid="1">baz</div>
            <!--c:1-->

            <!--o:2-->
              <div data-action data-cid="2">foo</div>
            <!--c:2-->`,
        ),
      );
    });

    it('should render the "key" attribute on a list of elements', async () => {
      const List = () => (
        <>
          <div key="1">foo</div>
          <div key="2">bar</div>
          <div key="3">baz</div>
        </>
      );

      const stream = renderToReadableStream(<List />, testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        `<div key="1">foo</div><div key="2">bar</div><div key="3">baz</div>`,
      );
    });
  });
});
