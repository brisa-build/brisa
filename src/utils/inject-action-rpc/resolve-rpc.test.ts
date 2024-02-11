import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { describe, expect, it, afterEach } from "bun:test";

let resolveRPC: (res: Response) => Promise<void>;

async function initBrowser() {
  GlobalRegistrator.register();
  await import("./resolve-rpc");
  resolveRPC = window._rpc;
}

describe("utils", () => {
  afterEach(() => {
    GlobalRegistrator.unregister();
  });

  describe("resolve-rpc", () => {
    it("should redirect to a different page", async () => {
      // const stream = new ReadableStream({
      //   start(controller) {
      //     controller.enqueue(new TextEncoder().encode(
      //       '{"action": "navigate", "params": ["http://localhost/some-page"]}'
      //     ));
      //     controller.close();
      //   },
      // });

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
});
