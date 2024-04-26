import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { describe, expect, it, afterEach, mock } from "bun:test";

let resolveRPC: (res: Response, args?: unknown[]) => Promise<void>;

async function initBrowser() {
  GlobalRegistrator.register();
  await import(".");
  resolveRPC = window._rpc;
}

describe("utils", () => {
  afterEach(() => {
    window._s = window._S = undefined;
    GlobalRegistrator.unregister();
  });

  describe("resolve-rpc", () => {
    describe("when navigate", () => {
      it("should redirect to a different page", async () => {
        const res = new Response(null, {
          headers: {
            "X-Navigate": "http://localhost/some-page",
          },
        });

        await initBrowser();
        await resolveRPC(res);

        expect(location.toString()).toBe("http://localhost/some-page");
      });
    });

    it("should update the store", async () => {
      const res = new Response(null, {
        headers: {
          "X-S": JSON.stringify([["foo", "bar"]]),
        },
      });

      await initBrowser();
      // Init store
      window._s = {
        Map: new Map(),
        get: (key: string) => window._s.Map.get(key),
        set: (key: string, value: any) => window._s.Map.set(key, value),
      };

      await resolveRPC(res);

      expect(window._s.get("foo")).toBe("bar");
    });

    it("should update the store without initialize (no signals, only server store with transferToClient)", async () => {
      const res = new Response(null, {
        headers: {
          "X-S": JSON.stringify([["foo", "bar"]]),
        },
      });

      let error = false;

      await initBrowser();
      await resolveRPC(res).catch(() => {
        error = true;
      });

      expect(window._s).toBeUndefined();
      expect(window._S).toEqual([["foo", "bar"]]);
      expect(error).toBe(false);
    });

    it("should encode emojis work in X-S header", async () => {
      const res = new Response(null, {
        headers: {
          "X-S": encodeURIComponent(JSON.stringify([["foo", "🚀"]])),
        },
      });

      let error = false;

      await initBrowser();
      await resolveRPC(res).catch(() => {
        error = true;
      });

      expect(window._s).toBeUndefined();
      expect(window._S).toEqual([["foo", "🚀"]]);
      expect(error).toBe(false);
    });

    describe("when receive streamed HTML", () => {
      it("should call the diff-dom-streaming library", async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("<html>"));
            controller.enqueue(encoder.encode("<head />"));
            controller.enqueue(encoder.encode("<body>"));

            controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

            controller.enqueue(encoder.encode("</body>"));
            controller.enqueue(encoder.encode("</html>"));
            controller.close();
          },
        });
        const res = new Response(stream, {
          headers: { "content-type": "text/html" },
        });

        await initBrowser();
        document.body.innerHTML = '<div class="foo">Foo</div>';

        await resolveRPC(res);
        expect(document.body.innerHTML).toBe('<div class="foo">Bar</div>');
      });
    });

    it("should call e.target.reset() if receive the X-Reset-Form header", async () => {
      const formEvent = {
        target: { reset: mock(() => {}) },
      };

      const res = new Response(null, {
        headers: {
          "X-Reset-Form": "1",
        },
      });

      await initBrowser();
      await resolveRPC(res, [formEvent]);

      expect(formEvent.target.reset).toHaveBeenCalled();
    });

    it('should not do transition with X-Mode header as "reactivity"', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module("diff-dom-streaming", () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("<html>"));
          controller.enqueue(encoder.encode("<head />"));
          controller.enqueue(encoder.encode("<body>"));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode("</body>"));
          controller.enqueue(encoder.encode("</html>"));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          "content-type": "text/html",
          "X-Mode": "reactivity",
        },
      });

      await initBrowser();
      await resolveRPC(res);

      expect(mockDiff).toBeCalledWith(document, expect.any, {
        onNextNode: expect.any(Function),
        transition: false,
      });
    });

    it('should do transition with X-Mode header as "transition"', async () => {
      const mockDiff = mock((...args: any) => {});

      mock.module("diff-dom-streaming", () => ({
        default: (...args: any) => mockDiff(...args),
      }));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("<html>"));
          controller.enqueue(encoder.encode("<head />"));
          controller.enqueue(encoder.encode("<body>"));

          controller.enqueue(encoder.encode('<div class="foo">Bar</div>'));

          controller.enqueue(encoder.encode("</body>"));
          controller.enqueue(encoder.encode("</html>"));
          controller.close();
        },
      });
      const res = new Response(stream, {
        headers: {
          "content-type": "text/html",
          "X-Mode": "transition",
        },
      });

      await initBrowser();
      await resolveRPC(res);

      expect(mockDiff).toBeCalledWith(document, expect.any, {
        onNextNode: expect.any(Function),
        transition: true,
      });
    });
  });
});
