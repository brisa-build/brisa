import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from "bun:test";
import { injectRPCCode, injectRPCLazyCode } from "." with { type: "macro" };
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { serialize } from "../serialization";

const rpcCode = await injectRPCCode();
const lazyRPCCode = await injectRPCLazyCode();
const INDICATOR_ID = "__ind:action";
const stringify = (obj: any) => encodeURIComponent(JSON.stringify(obj));
const requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);
let mockFetch: ReturnType<typeof spyOn>;

async function simulateRPC({
  elementName = "button",
  eventName = "click",
  debounceMs = 0,
  slowRequest = false,
  navigateTo = "",
  useIndicator = false,
  fails = false,
  failsThrowingAnError = false,
  dataActions = [] as [string, string][],
  callbackAfterRPC = () => {},
} = {}) {
  const el = document.createElement(elementName);

  // Simulate a button with a data-action-onClick attribute
  el.setAttribute(`data-action-on${eventName}`, "a1_1");
  el.setAttribute("data-action", "true");

  if (dataActions?.length) {
    el.setAttribute("data-actions", serialize(dataActions));
  }

  if (debounceMs) {
    el.setAttribute(`debounce${eventName}`, debounceMs.toString());
  }

  if (useIndicator) {
    el.setAttribute("indicator", `['${INDICATOR_ID}']`);
    el.setAttribute(`indicate${eventName}`, `${INDICATOR_ID}`);
  }

  document.body.appendChild(el);

  // Inject RPC code
  eval(lazyRPCCode);
  eval(rpcCode);

  // Simulate the document to be loaded to stop registering the actions
  document.dispatchEvent(new Event("DOMContentLoaded"));
  await Bun.sleep(0);

  // Simulate some actions after the RPC code is loaded and executed
  callbackAfterRPC();

  let headers = new Headers();

  if (navigateTo) {
    headers.set("X-Navigate", navigateTo);
  }

  // Mock fetch with the actions
  mockFetch = spyOn(window, "fetch").mockImplementation(async () => {
    if (slowRequest) await Bun.sleep(0);
    if (failsThrowingAnError) throw new Error("Some throwable error");
    return {
      headers,
      ok: fails ? false : true,
      text: async () => "Some error",
      body: {
        getReader: () => ({ read: async () => ({ done: true }) }),
      },
    } as any;
  });

  // Simulate the event
  el.dispatchEvent(
    eventName === "custom" ? new CustomEvent(eventName) : new Event(eventName),
  );

  // Wait the fetch to be processed
  await Bun.sleep(0);

  return mockFetch;
}

describe("utils", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
    window.requestAnimationFrame = requestAnimationFrame;
  });
  afterEach(() => {
    window._S = window._s = undefined;
    mockFetch?.mockRestore();
    GlobalRegistrator.unregister();
    globalThis.requestAnimationFrame = requestAnimationFrame;
  });

  describe("rpc", () => {
    it("should redirect to 404", async () => {
      await simulateRPC({ navigateTo: "http://localhost/?_not-found=1" });
      // Simulate the script to be loaded
      document.head.querySelector("script")?.dispatchEvent(new Event("load"));
      await Bun.sleep(0);
      expect(location.toString()).toBe("http://localhost/?_not-found=1");
    });

    it('should "fetch" receive a signal', async () => {
      await simulateRPC({ navigateTo: "http://localhost/some-page" });

      const signal = mockFetch.mock.calls[0][1].signal;

      expect(signal).toBeDefined();
      expect(signal.aborted).toBeFalse();
    });

    it('should serialize an event and call "rpc" with the correct parameters', async () => {
      const mockFetch = await simulateRPC();

      expect(mockFetch.mock.calls[0][0]).toBe(location.toString());
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");

      const [{ timeStamp, eventPhase, ...event }] = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as any,
      );

      expect(event).toEqual({
        defaultPrevented: true,
        NONE: 0,
        CAPTURING_PHASE: 1,
        AT_TARGET: 2,
        BUBBLING_PHASE: 3,
        type: "click",
        bubbles: false,
        cancelable: false,
        composed: false,
      });
    });

    it('should debounce the "rpc" function with debounceClick attribute', async () => {
      const mockTimeout = spyOn(window, "setTimeout");
      const mockFetch = await simulateRPC({
        debounceMs: 100,
        navigateTo: "http://localhost/some-page",
      });

      expect(mockTimeout).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      // The first timeout is to register the event during streaming
      expect(mockTimeout.mock.calls[1][1]).toBe(100);
    });

    it("should send FormData when the event is onSubmit in a form", async () => {
      const mockFetch = await simulateRPC({
        elementName: "form",
        eventName: "submit",
        navigateTo: "http://localhost/some-page",
      });

      expect(mockFetch.mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    });

    it("should send custom event serialized with _wc property", async () => {
      const mockFetch = await simulateRPC({
        eventName: "custom",
        navigateTo: "http://localhost/some-page",
      });

      const [event] = JSON.parse(mockFetch.mock.calls[0][1]?.body as any);
      expect(event._wc).toBeTrue();
    });

    it('should send the "x-action" header with the actionId', async () => {
      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
      });

      const headers = (mockFetch.mock.calls[0][1]?.headers ?? {}) as Record<
        string,
        string
      >;

      expect(headers["x-action"]).toBe("a1_1");
      expect(headers["x-s"]).toBeEmpty();
      expect(headers["x-actions"]).toBeEmpty();
    });

    it('should send the "x-s" header with the serialized store', async () => {
      window._S = [["a", "b"]];

      window._s = {
        Map: new Map(window._S),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      window._s.set("c", "d");

      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
      });

      const headers = (mockFetch.mock.calls[0][1]?.headers ?? {}) as Record<
        string,
        string
      >;

      expect(headers["x-action"]).toBe("a1_1");
      expect(headers["x-s"]).toBe(
        stringify([
          ["a", "b"],
          ["c", "d"],
        ]),
      );
      expect(headers["x-actions"]).toBeEmpty();
    });

    it('should send the "x-s" header with the serialized store if only are transferred store', async () => {
      window._s = undefined;
      window._S = [["c", "d"]];

      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
      });
      const headers = (mockFetch.mock.calls[0][1]?.headers ?? {}) as Record<
        string,
        string
      >;

      expect(headers["x-action"]).toBe("a1_1");
      expect(headers["x-s"]).toBe(stringify([["c", "d"]]));
      expect(headers["x-actions"]).toBeEmpty();
    });

    it('should add and remove the class "brisa-request" meanwhile the request is being processed and then success', async () => {
      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        useIndicator: true,
        slowRequest: true,
        debounceMs: 1,
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      // Simulate the script to be loaded
      document.head.querySelector("script")?.dispatchEvent(new Event("load"));
      await Bun.sleep(1);
      expect(element.classList.contains("brisa-request")).toBeFalse();
    });

    it('should add and remove the class "brisa-request" meanwhile the request is being processed and then fail req.ok === false', async () => {
      window._s = {
        Map: new Map(),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        useIndicator: true,
        slowRequest: true,
        fails: true,
        debounceMs: 1,
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      await Bun.sleep(1);
      expect(element.classList.contains("brisa-request")).toBeFalse();

      const errorMessage = window._s.get("e" + INDICATOR_ID);
      expect(errorMessage).toBe("Some error");
    });

    it('should add and remove the class "brisa-request" meanwhile the request is being processed and then fail throwing an error', async () => {
      window._s = {
        Map: new Map(),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        useIndicator: true,
        slowRequest: true,
        failsThrowingAnError: true,
        debounceMs: 1,
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      await Bun.sleep(1);
      expect(element.classList.contains("brisa-request")).toBeFalse();
      const errorMessage = window._s.get("e" + INDICATOR_ID);
      expect(errorMessage).toEqual("Some throwable error");
    });

    it("should communicate with store to the indicator store key", async () => {
      window._s = {
        Map: new Map(),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      expect(window._s.get(INDICATOR_ID)).toBeEmpty();

      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        useIndicator: true,
        slowRequest: true,
        debounceMs: 1,
      });

      expect(window._s.get(INDICATOR_ID)).toBeTrue();
      // Simulate the script to be loaded
      document.head.querySelector("script")?.dispatchEvent(new Event("load"));
      await Bun.sleep(1);
      expect(window._s.get(INDICATOR_ID)).toBeFalse();
    });

    it("should add the x-actions header with the serialized actions dependencies ids", async () => {
      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
        dataActions: [["onClick", "a1_2"]],
      });
      const headers = (mockFetch.mock.calls[0][1]?.headers ?? {}) as Record<
        string,
        string
      >;
      expect(headers["x-action"]).toBe("a1_1");
      expect(headers["x-actions"]).toBe("[['onClick','a1_2']]");
    });

    it("should not add the x-actions header when no data-actions", async () => {
      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
        dataActions: [],
      });
      const headers = (mockFetch.mock.calls[0][1]?.headers ?? {}) as Record<
        string,
        string
      >;
      expect(headers["x-action"]).toBe("a1_1");
      expect(headers["x-actions"]).toBeEmpty();
    });

    it('should register actions after server action doing a rerender with "data-action" attribute', async () => {
      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        callbackAfterRPC: () => {
          document.body.innerHTML = `<button data-action-onclick="a1_1" data-action></button>`;
          expect(document.body.innerHTML).toBe(
            `<button data-action-onclick="a1_1" data-action=""></button>`,
          );
        },
      });

      expect(document.body.innerHTML).toBe(
        `<button data-action-onclick="a1_1"></button>`,
      );
    });
  });

  describe("SPA Navigation", () => {
    const mockNavigationIntercept = mock((handler: () => {}) => {});
    async function simulateSPANavigation(
      url: string,
      {
        downloadRequest = null,
        hashChange = false,
      }: { downloadRequest?: string | null; hashChange?: boolean } = {},
    ) {
      const origin = `http://localhost`;
      let canIntercept = new URL(url).origin === origin;
      let fn: any;

      // Initial page (with same origin)
      location.href = origin;
      window.navigation = {
        addEventListener: (eventName: string, callback: any) => {
          if (eventName === "navigate") fn = callback;
        },
      };

      // Inject RPC code
      eval(lazyRPCCode);
      eval(rpcCode);

      // Simulate the event
      fn({
        destination: { url },
        scroll: () => {},
        hashChange,
        downloadRequest,
        canIntercept,
        intercept: ({ handler }: any) => {
          if (handler) {
            mockNavigationIntercept(handler);
            location.href = url;
          }
        },
      });
      await Bun.sleep(0);
    }

    beforeEach(() => {
      mockNavigationIntercept.mockClear();
    });

    it("should not work SPA navigation with different origin", async () => {
      await simulateSPANavigation("http://test.com/some-page");
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should not work SPA navigation with same origin but hashChange is true", async () => {
      await simulateSPANavigation("http://localhost/some-page", {
        hashChange: true,
      });
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should not work SPA navigation with 'download' attribute", async () => {
      await simulateSPANavigation("http://localhost/some-page", {
        downloadRequest: "name-of-file",
      });
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should not work SPA navigation with 'download' attribute as empty string", async () => {
      await simulateSPANavigation("http://localhost/some-page", {
        downloadRequest: "",
      });
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should not work SPA navigation with renderMode='native'", async () => {
      document.activeElement?.setAttribute("renderMode", "native");
      await simulateSPANavigation("http://localhost/some-page");
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should not work SPA navigation with some custom element with renderMode='native'", async () => {
      const page = "http://localhost/some-page";
      customElements.define(
        "custom-element",
        class extends HTMLElement {
          constructor() {
            super();
            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.innerHTML = `<a href="${page}" renderMode="native">Click me</a>`;
          }
        },
      );

      document.body.innerHTML = `<custom-element></custom-element>`;
      const customElement = document.querySelector("custom-element");
      // focus to the hyperlink to activate the document.activeElement.shadowRoot.activeElement
      customElement?.shadowRoot?.querySelector("a")?.focus();

      await simulateSPANavigation(page);
      expect(mockNavigationIntercept).not.toHaveBeenCalled();
    });

    it("should work SPA navigation with renderMode='reactivity'", async () => {
      document.activeElement?.setAttribute("rendermode", "reactivity");
      await simulateSPANavigation("http://localhost/some-page");
      expect(mockNavigationIntercept).toHaveBeenCalled();
    });

    it("should work SPA navigation with some custom element with renderMode='reactivity'", async () => {
      const page = "http://localhost/some-page";
      customElements.define(
        "custom-element",
        class extends HTMLElement {
          constructor() {
            super();
            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.innerHTML = `<a href="${page}" renderMode="reactivity">Click me</a>`;
          }
        },
      );

      document.body.innerHTML = `<custom-element></custom-element>`;
      const customElement = document.querySelector("custom-element");
      // focus to the hyperlink to activate the document.activeElement.shadowRoot.activeElement
      customElement?.shadowRoot?.querySelector("a")?.focus();

      await simulateSPANavigation(page);
      expect(mockNavigationIntercept).toHaveBeenCalled();
    });

    it("should work SPA navigation with renderMode='transition'", async () => {
      document.activeElement?.setAttribute("rendermode", "transition");
      await simulateSPANavigation("http://localhost/some-page");
      expect(mockNavigationIntercept).toHaveBeenCalled();
    });

    it("should work SPA navigation with some custom element with renderMode='transition'", async () => {
      const page = "http://localhost/some-page";
      customElements.define(
        "custom-element",
        class extends HTMLElement {
          constructor() {
            super();
            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.innerHTML = `<a href="${page}" renderMode="transition">Click me</a>`;
          }
        },
      );

      document.body.innerHTML = `<custom-element></custom-element>`;
      const customElement = document.querySelector("custom-element");
      // focus to the hyperlink to activate the document.activeElement.shadowRoot.activeElement
      customElement?.shadowRoot?.querySelector("a")?.focus();

      await simulateSPANavigation(page);
      expect(mockNavigationIntercept).toHaveBeenCalled();
    });

    it("should work SPA navigation", async () => {
      await simulateSPANavigation("http://localhost/some-page");
      expect(mockNavigationIntercept).toHaveBeenCalled();
      expect(location.href).toBe("http://localhost/some-page");
    });

    it("should add x-s (store header) during SPA navigation", async () => {
      window._S = [["a", "b"]];
      const res = new Response('<div id="some-id"></div>', {
        headers: { "content-type": "text/html" },
      });
      mockFetch = spyOn(window, "fetch").mockImplementation(async () => res);
      await simulateSPANavigation("http://localhost/some-page");
      expect(mockNavigationIntercept).toHaveBeenCalled();
      const handler = mockNavigationIntercept.mock.calls[0][0];
      await handler();
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][1].headers["x-s"]).toBe(
        encodeURIComponent(JSON.stringify([["a", "b"]])),
      );
    });

    it('should register actions after SPA navigation with "data-action" attribute', async () => {
      await simulateSPANavigation("http://localhost/some-page");

      const res = new Response("<div data-action></div>", {
        headers: { "content-type": "text/html" },
      });

      mockFetch = spyOn(window, "fetch").mockImplementation(async () => res);
      const handler = mockNavigationIntercept.mock.calls[0][0];
      await handler();

      expect(location.href).toBe("http://localhost/some-page");

      // Should remove data-action attribute after register the action
      expect(document.body.querySelector("[data-action]")).toBeNull();
    });
  });
});
