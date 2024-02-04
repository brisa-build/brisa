import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { injectActionRPCCode } from "." with { type: "macro" };
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const actionRPCCode = await injectActionRPCCode();

async function simulateRPC(actions: any[]) {
  const button = document.createElement("button");
  let times = 0;

  // Simulate a button with a data-action-onClick attribute
  button.setAttribute("data-action-onClick", "a1_1");
  button.setAttribute("data-action", "true");
  document.body.appendChild(button);

  // Inject RPC code
  eval(actionRPCCode);

  // Mock fetch with the actions
  spyOn(window, "fetch").mockImplementation(
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
}

describe("utils", () => {
  describe("inject-action-rpc", () => {
    beforeEach(() => {
      GlobalRegistrator.register();
    });
    afterEach(() => {
      GlobalRegistrator.unregister();
    });

    it("should redirect to 404", async () => {
      await simulateRPC([
        { action: "navigate", params: ["http://localhost/?_not-found=1"] },
      ]);
      expect(location.toString()).toBe("http://localhost/?_not-found=1");
    });
  });
});
