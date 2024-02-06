import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
} from "bun:test";
import { injectActionRPCCode } from "." with { type: "macro" };
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const actionRPCCode = await injectActionRPCCode();

async function simulateRPC(actions: any[], debounceMs = 0) {
  const button = document.createElement("button");
  let times = 0;

  // Simulate a button with a data-action-onClick attribute
  button.setAttribute("data-action-onClick", "a1_1");
  button.setAttribute("data-action", "true");

  if (debounceMs) {
    button.setAttribute("onClick-debounce", debounceMs.toString());
  }

  document.body.appendChild(button);

  // Inject RPC code
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

  button.click();

  // wait "fetch" promise to resolve
  await Bun.sleep(0);

  return mockFetch;
}

describe("utils", () => {
  describe("inject-action-rpc", () => {
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
        defaultPrevented: false,
        NONE: 0,
        CAPTURING_PHASE: 1,
        AT_TARGET: 2,
        BUBBLING_PHASE: 3,
        type: "click",
        bubbles: true,
        cancelable: false,
        composed: true,
        layerX: 0,
        layerY: 0,
        pageX: 0,
        pageY: 0,
        detail: 0,
        altKey: false,
        button: 0,
        buttons: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: false,
        metaKey: false,
        movementX: 0,
        movementY: 0,
        screenX: 0,
        screenY: 0,
        shiftKey: false,
        pointerId: 0,
        width: 1,
        height: 1,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        altitudeAngle: 0,
        azimuthAngle: 0,
        isPrimary: false,
        coalescedEvents: [],
        predictedEvents: [],
      });
    });

    it('should debounce the "rpc" function with onClick-debounce attribute', async () => {
      const mockTimeout = spyOn(window, "setTimeout");
      const mockFetch = await simulateRPC(
        [{ action: "navigate", params: ["http://localhost/some-page"] }],
        100,
      );

      expect(mockTimeout).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      // The first timeout is to register the event during streaming
      expect(mockTimeout.mock.calls[1][1]).toBe(100);
    });
  });
});
