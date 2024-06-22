import {
  it,
  describe,
  expect,
  mock,
  beforeEach,
  setSystemTime,
} from "bun:test";
import extendStreamController from ".";
import extendRequestContext from "@/utils/extend-request-context";
import { RenderInitiator } from "@/public-constants";

const request = extendRequestContext({
  originalRequest: new Request("http://localhost"),
});
const mockController = {
  enqueue: mock(() => { }),
} as any;
const controllerParams = { controller: mockController, request };

describe("extendStreamController", () => {
  beforeEach(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    mockController.enqueue.mockClear();
  });

  it("should enqueue directly the chunks without suspenseId", () => {
    const controller = extendStreamController(controllerParams);

    controller.startTag("<div>");
    controller.enqueue("Hello world!");
    controller.endTag("</div>");

    expect(mockController.enqueue.mock.calls).toEqual([
      ["<div>"],
      ["Hello world!"],
      ["</div>"],
    ]);
  });

  it("should not enqueue directly the suspensed chunks and do it later", async () => {
    const controller = extendStreamController(controllerParams);

    // Pending part before suspensed
    controller.startTag(`<div id="S:1">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    const suspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());

    // Another in the middle:
    controller.startTag("<div>");
    controller.enqueue("Another");

    // Finish the suspensed part in te middle of the another part
    controller.enqueue("Success!", suspenseId);

    // Finish the another part
    controller.endTag("</div>");

    await controller.waitSuspensedPromises();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      ["<div>"],
      ["Another"],
      ["</div>"],
      [
        `<template id="U:1">Success!</template><script id="R:1">u$('1')</script>`,
      ],
    ]);
  });

  it("should unsuspense at the end of the document and in order", async () => {
    const controller = extendStreamController(controllerParams);
    const firstSuspense = Promise.withResolvers<void>();
    const secondSuspense = Promise.withResolvers<void>();

    controller.startTag("<html>");

    // Pending part before suspensed
    controller.startTag(`<div id="S:1">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    // First suspensed part
    const suspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(firstSuspense.promise);
    firstSuspense.resolve();

    // Pending second part before suspensed
    controller.startTag(`<div id="S:2">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    // Second suspensed part
    const secondSuspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(secondSuspense.promise);

    controller.startTag("<div>");
    controller.enqueue("Another");
    controller.enqueue("Success!", suspenseId);
    controller.endTag("</div>");
    controller.endTag("</html>");

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<html>`],
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      [`<div id="S:2">`],
      ["Loading..."],
      ["</div>"],
      ["<div>"],
      ["Another"],
      ["</div>"],
      ["</html>"],
    ]);

    await Bun.sleep(0);

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<html>`],
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      [`<div id="S:2">`],
      ["Loading..."],
      ["</div>"],
      ["<div>"],
      ["Another"],
      ["</div>"],
      ["</html>"],
      [
        `<template id="U:1">Success!</template><script id="R:1">u$('1')</script>`,
      ],
    ]);

    controller.enqueue("Success 2!", secondSuspenseId);

    secondSuspense.resolve();
    await controller.waitSuspensedPromises();
    await Bun.sleep(0);

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<html>`],
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      [`<div id="S:2">`],
      ["Loading..."],
      ["</div>"],
      ["<div>"],
      ["Another"],
      ["</div>"],
      ["</html>"],
      [
        `<template id="U:1">Success!</template><script id="R:1">u$('1')</script>`,
      ],
      [
        `<template id="U:2">Success 2!</template><script id="R:2">u$('2')</script>`,
      ],
    ]);
  });

  it("should not enqueue directly the suspensed chunks and do it later with multiple suspenses", async () => {
    const controller = extendStreamController(controllerParams);
    const firstSuspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());
    const secondSuspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());

    controller.startTag(`<div id="S:1">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    controller.startTag(`<div id="S:2">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    controller.startTag("<h1>");
    controller.enqueue("Hello world");

    controller.startTag("<div>", secondSuspenseId);
    controller.enqueue("Success U2!", secondSuspenseId);
    controller.endTag("</div>", secondSuspenseId);

    controller.endTag("</h1>");
    controller.enqueue("Success U1!", firstSuspenseId);

    await controller.waitSuspensedPromises();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      [`<div id="S:2">`],
      ["Loading..."],
      ["</div>"],
      ["<h1>"],
      ["Hello world"],
      ["</h1>"],
      [
        `<template id="U:2"><div>Success U2!</div></template><script id="R:2">u$('2')</script>`,
      ],
      [
        `<template id="U:1">Success U1!</template><script id="R:1">u$('1')</script>`,
      ],
    ]);
  });

  it("should work with nested suspensed and success nodes", async () => {
    const controller = extendStreamController(controllerParams);
    const firstSuspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());
    const nestedSuspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());

    controller.startTag(`<div id="S:1">`);
    controller.enqueue("Loading S1...");
    controller.startTag(`<div id="S:2">`);
    controller.enqueue("Loading S2...");
    controller.endTag("</div>");
    controller.endTag("</div>");
    controller.startTag("<h1>");
    controller.enqueue("Hello world");
    controller.enqueue("Success U2!", nestedSuspenseId);
    controller.endTag("</h1>");
    controller.enqueue("Success U1!", firstSuspenseId);

    await controller.waitSuspensedPromises();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<div id="S:1">`],
      ["Loading S1..."],
      [`<div id="S:2">`],
      ["Loading S2..."],
      ["</div>"],
      ["</div>"],
      ["<h1>"],
      ["Hello world"],
      ["</h1>"],
      [
        `<template id="U:2">Success U2!</template><script id="R:2">u$('2')</script>`,
      ],
      [
        `<template id="U:1">Success U1!</template><script id="R:1">u$('1')</script>`,
      ],
    ]);
  });

  it("should work with suspensed fragment with different content", async () => {
    const controller = extendStreamController(controllerParams);
    const suspenseId = controller.nextSuspenseIndex();
    controller.suspensePromise(Promise.resolve());

    controller.startTag(`<div id="S:1">`);
    controller.enqueue("Loading...");
    controller.endTag("</div>");

    // <>This {'is'} a {'test'}</>
    controller.startTag(null, suspenseId);
    controller.enqueue("This ", suspenseId);
    controller.enqueue("is ", suspenseId);
    controller.enqueue("a ", suspenseId);
    controller.enqueue("test", suspenseId);
    controller.endTag(null, suspenseId);

    await controller.waitSuspensedPromises();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<div id="S:1">`],
      ["Loading..."],
      ["</div>"],
      [
        `<template id="U:1">This is a test</template><script id="R:1">u$('1')</script>`,
      ],
    ]);
  });

  it("should transferStoreToClient add _S to the window", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    // @ts-ignore
    req.webStore.set("test", "test");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<script>window._S=[["test","test"]]</script>`],
    ]);
  });

  it("should transferStoreToClient add _S and _s to the window when method is POST (from RPC)", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost", {
        method: "POST",
      }),
    });

    // @ts-ignore
    req.webStore.set("test", "test");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [
        `<script>window._S=[["test","test"]];for(let [k, v] of _S) _s?.set?.(k, v)</script>`,
      ],
    ]);
  });

  it('should transfer store to RPC (SPA_NAVIGATION) with script as JSON', () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    req.renderInitiator = RenderInitiator.SPA_NAVIGATION;

    // @ts-ignore
    req.webStore.set("test", "test");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<script type="application/json" id="S">[["test","test"]]</script>`],
    ]);
  })

  it('should transfer store to RPC (SERVER_ACTION) with script as JSON', () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    req.renderInitiator = RenderInitiator.SERVER_ACTION;

    // @ts-ignore
    req.webStore.set("test", "test");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<script type="application/json" id="S">[["test","test"]]</script>`],
    ]);
  })

  it("should transferStoreToClient set _S when already was transfered", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    // @ts-ignore
    req.webStore.set("some", "foo");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    // @ts-ignore
    req.webStore.set("another", "bar");

    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<script>window._S=[["some","foo"]]</script>`],
      [`<script>for(let e of [["another","bar"]]) _S.push(e)</script>`],
    ]);
  });

  it("should transferStoreToClient set _S and set signals when already was transfered and has signals", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    // @ts-ignore
    req.webStore.set("some", "foo");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.transferStoreToClient();

    controller.areSignalsInjected = true;
    // @ts-ignore
    req.webStore.set("another", "bar");

    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [`<script>window._S=[["some","foo"]]</script>`],
      [
        `<script>for(let [k, v] of [["another","bar"]]){ _s?.set?.(k, v); _S.push([k, v])}</script>`,
      ],
    ]);
  });

  it("should transferStoreToClient add _S and set signals when was not transfered and has signals", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });

    // @ts-ignore
    req.webStore.set("some", "foo");

    const controller = extendStreamController({
      controller: mockController,
      request: req,
    });
    controller.areSignalsInjected = true;
    controller.transferStoreToClient();

    expect(mockController.enqueue.mock.calls).toEqual([
      [
        `<script>window._S=[["some","foo"]];for(let [k, v] of _S) _s?.set?.(k, v)</script>`,
      ],
    ]);
  });

  it("should generateComponentId, getComponentId, getParentComponentId, and removeComponentId work correctly", () => {
    const controller = extendStreamController(controllerParams);

    controller.generateComponentId();
    expect(controller.getComponentId()).toBe("0");

    controller.generateComponentId();
    expect(controller.getComponentId()).toBe("1");
    expect(controller.getParentComponentId()).toBe("0");

    controller.generateComponentId();
    expect(controller.getComponentId()).toBe("2");
    expect(controller.getParentComponentId()).toBe("1");

    controller.generateComponentId();
    expect(controller.getComponentId()).toBe("3");
    expect(controller.getParentComponentId()).toBe("2");

    controller.removeComponentId();
    expect(controller.getComponentId()).toBe("2");
    expect(controller.getParentComponentId()).toBe("1");

    controller.generateComponentId();
    expect(controller.getComponentId()).toBe("4");
    expect(controller.getParentComponentId()).toBe("2");

    controller.removeComponentId();
    expect(controller.getComponentId()).toBe("2");
    expect(controller.getParentComponentId()).toBe("1");

    controller.removeComponentId();
    expect(controller.getComponentId()).toBe("1");
    expect(controller.getParentComponentId()).toBe("0");

    controller.removeComponentId();
    expect(controller.getComponentId()).toBe("0");
  });
});
