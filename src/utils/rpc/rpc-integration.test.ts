import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
} from "bun:test";
import {
  injectActionRPCCode,
  injectActionRPCLazyCode,
} from "." with { type: "macro" };
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const actionRPCCode = await injectActionRPCCode();
const actionRPCLazyCode = await injectActionRPCLazyCode();
const INDICATOR_ID = "__ind:action";

async function simulateRPC({
  elementName = "button",
  eventName = "click",
  debounceMs = 0,
  slowRequest = false,
  navigateTo = "",
  htmlChunks = [],
  useIndicator = false,
  fails = false,
  failsThrowingAnError = false,
} = {}) {
  const el = document.createElement(elementName);
  let times = 0;

  // Simulate a button with a data-action-onClick attribute
  el.setAttribute(`data-action-on${eventName}`, "a1_1");
  el.setAttribute("data-action", "true");

  if (debounceMs) {
    el.setAttribute(`debounce${eventName}`, debounceMs.toString());
  }

  if (useIndicator) {
    el.setAttribute("indicator", `['${INDICATOR_ID}']`);
    el.setAttribute(`indicate${eventName}`, `${INDICATOR_ID}`);
  }

  document.body.appendChild(el);

  // Inject RPC code
  eval(actionRPCLazyCode);
  eval(actionRPCCode);

  let headers = new Headers();

  if (navigateTo) {
    headers.set("X-Navigate", navigateTo);
  }

  // Mock fetch with the actions
  const mockFetch = spyOn(window, "fetch").mockImplementation(async () => {
    if (slowRequest) await Bun.sleep(0);
    if (failsThrowingAnError) throw new Error("Some throwable error");
    return {
      headers,
      ok: fails ? false : true,
      text: async () => "Some error",
      body: {
        getReader: () => {
          return {
            read: async () => {
              times += 1;

              return times <= htmlChunks.length
                ? {
                    value: Buffer.from(JSON.stringify(htmlChunks[times - 1])),
                    done: false,
                  }
                : { done: true };
            },
          };
        },
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
  describe("rpc", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
      window._S = window._s = undefined;
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    });
    afterEach(() => {
      jest.restoreAllMocks();
      GlobalRegistrator.unregister();
    });

    it("should redirect to 404", async () => {
      await simulateRPC({ navigateTo: "http://localhost/?_not-found=1" });
      expect(location.toString()).toBe("http://localhost/?_not-found=1");
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

    it("should send custom event serialized with _custom property", async () => {
      const mockFetch = await simulateRPC({
        eventName: "custom",
        navigateTo: "http://localhost/some-page",
      });

      const [event] = JSON.parse(mockFetch.mock.calls[0][1]?.body as any);
      expect(event._custom).toBeTrue();
    });

    it('should send the "x-action" header with the actionId', async () => {
      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
      });

      expect(mockFetch.mock.calls[0][1]?.headers).toEqual({
        "x-action": "a1_1",
      });
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

      expect(mockFetch.mock.calls[0][1]?.headers).toEqual({
        "x-action": "a1_1",
        "x-s": `[["a","b"],["c","d"]]`,
      });
    });

    it('should send the "x-s" header with the serialized store if only are transferred store', async () => {
      window._s = undefined;
      window._S = [["c", "d"]];

      const mockFetch = await simulateRPC({
        navigateTo: "http://localhost/some-page",
      });

      expect(mockFetch.mock.calls[0][1]?.headers).toEqual({
        "x-action": "a1_1",
        "x-s": `[["c","d"]]`,
      });
    });

    it('should add and remove the class "brisa-request" meanwhile the request is being processed and then success', async () => {
      await simulateRPC({
        navigateTo: "http://localhost/some-page",
        useIndicator: true,
        slowRequest: true,
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      await Bun.sleep(0);
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
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      await Bun.sleep(0);
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
      });

      const element = document.body.firstChild as HTMLElement;

      expect(element.classList.contains("brisa-request")).toBeTrue();
      await Bun.sleep(0);
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
      });

      expect(window._s.get(INDICATOR_ID)).toBeTrue();
      await Bun.sleep(0);
      expect(window._s.get(INDICATOR_ID)).toBeFalse();
    });
  });
});
