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

async function simulateRPC(
  actions: any[],
  { elementName = "button", eventName = "click", debounceMs = 0 } = {},
) {
  const el = document.createElement(elementName);
  let times = 0;

  // Simulate a button with a data-action-onClick attribute
  el.setAttribute(`data-action-on${eventName}`, "a1_1");
  el.setAttribute("data-action", "true");

  if (debounceMs) {
    el.setAttribute(`on${eventName}-debounce`, debounceMs.toString());
  }

  document.body.appendChild(el);

  // Inject RPC code
  eval(actionRPCLazyCode);
  eval(actionRPCCode);

  // Mock fetch with the actions
  const mockFetch = spyOn(window, "fetch").mockImplementation(
    async () =>
      ({
        body: {
          getReader: () => ({
            read: async () => {
              times += 1;

              return times <= actions.length
                ? {
                    value: Buffer.from(JSON.stringify(actions[times - 1])),
                    done: false,
                  }
                : { done: true };
            },
          }),
        },
      }) as any,
  );

  // Simulate the event
  el.dispatchEvent(new Event(eventName));

  // Wait the fetch to be processed
  await Bun.sleep(0);

  return mockFetch;
}

describe("utils", () => {
  describe("rpc", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
    });
    afterEach(() => {
      jest.restoreAllMocks();
      GlobalRegistrator.unregister();
    });

    it("should redirect to 404", async () => {
      await simulateRPC([
        { action: "navigate", params: ["http://localhost/?_not-found=1"] },
      ]);
      expect(location.toString()).toBe("http://localhost/?_not-found=1");
    });

    it('should serialize an event and call "rpc" with the correct parameters', async () => {
      const mockFetch = await simulateRPC([
        { action: "navigate", params: ["http://localhost/some-page"] },
      ]);

      expect(location.toString()).toBe("http://localhost/some-page");
      expect(mockFetch.mock.calls[0][0]).toBe("/_action/a1_1");
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

    it('should debounce the "rpc" function with onClick-debounce attribute', async () => {
      const mockTimeout = spyOn(window, "setTimeout");
      const mockFetch = await simulateRPC(
        [{ action: "navigate", params: ["http://localhost/some-page"] }],
        { debounceMs: 100 },
      );

      expect(mockTimeout).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      // The first timeout is to register the event during streaming
      expect(mockTimeout.mock.calls[1][1]).toBe(100);
    });

    it("should send FormData when the event is onSubmit in a form", async () => {
      const mockFetch = await simulateRPC(
        [{ action: "navigate", params: ["http://localhost/some-page"] }],
        { elementName: "form", eventName: "submit" },
      );

      expect(mockFetch.mock.calls[0][1]?.body).toBeInstanceOf(FormData);
    });
  });
});
