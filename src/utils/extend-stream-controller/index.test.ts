import { it, describe, expect, mock, beforeEach } from "bun:test";
import extendStreamController from ".";

const mockController = {
  enqueue: mock(() => { }),
} as any;

describe("extendStreamController", () => {
  beforeEach(() => {
    mockController.enqueue.mockClear();
  })

  it('should enqueue directly the chunks without suspenseId', () => {
    const controller = extendStreamController(mockController);

    controller.enqueue({ chunk: "<div>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Hello world!" });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });

    expect(mockController.enqueue.mock.calls).toEqual([
      ["<div>"],
      ["Hello world!"],
      ["</div>"],
    ]);
  })

  it("should not enqueue directly the suspensed chunks and do it later", () => {
    const controller = extendStreamController(mockController);

    // Suspensed start
    controller.enqueue({ chunk: "<div id='S:1'>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Loading..." });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });

    const suspenseId = controller.nextSuspenseIndex();

    // Another in the middle:
    controller.enqueue({ chunk: "<div>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Another" });

    // Suspensed finish
    controller.enqueue({ chunk: "<template id='U:1'>", suspenseId, isOpenOfTag: true });
    controller.enqueue({ chunk: "Success!", suspenseId });

    // Ends the other in the middle
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });

    // Ends the suspensed
    controller.enqueue({ chunk: "</template>", suspenseId, isEndOfTag: true });

    expect(mockController.enqueue.mock.calls).toEqual([
      ["<div id='S:1'>"],
      ["Loading..."],
      ["</div>"],
      ["<div>"],
      ["Another"],
      ["</div>"],
      ["<template id='U:1'>Success!</template><script>u$('1')</script>"],
    ]);
  })

  it("should not enqueue directly the suspensed chunks and do it later with multiple suspenses", () => {
    const controller = extendStreamController(mockController);
    const firstSuspenseId = controller.nextSuspenseIndex();
    const secondSuspenseId = controller.nextSuspenseIndex();

    controller.enqueue({ chunk: "<div id='S:1'>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Loading..." });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });
    controller.enqueue({ chunk: "<div id='S:2'>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Loading..." });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });
    controller.enqueue({ chunk: "<h1>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Hello world" });
    controller.enqueue({ chunk: "<template id='U:2'>", suspenseId: secondSuspenseId, isOpenOfTag: true });
    controller.enqueue({ chunk: "Success U2!", suspenseId: secondSuspenseId });
    controller.enqueue({ chunk: "<template id='U:1'>", suspenseId: firstSuspenseId, isOpenOfTag: true });
    controller.enqueue({ chunk: "</h1>", isEndOfTag: true });
    controller.enqueue({ chunk: "Success U1!", suspenseId: firstSuspenseId });
    controller.enqueue({ chunk: "</template>", suspenseId: secondSuspenseId, isEndOfTag: true });
    controller.enqueue({ chunk: "</template>", suspenseId: firstSuspenseId, isEndOfTag: true });

    expect(mockController.enqueue.mock.calls).toEqual([
      ["<div id='S:1'>"],
      ["Loading..."],
      ["</div>"],
      ["<div id='S:2'>"],
      ["Loading..."],
      ["</div>"],
      ["<h1>"],
      ["Hello world"],
      ['</h1>'],
      ["<template id='U:2'>Success U2!</template><script>u$('2')</script>"],
      ["<template id='U:1'>Success U1!</template><script>u$('1')</script>"],
    ]);
  });

  it('should work with nested suspensed and success nodes', () => {
    const controller = extendStreamController(mockController);
    const firstSuspenseId = controller.nextSuspenseIndex();
    const nestedSuspenseId = controller.nextSuspenseIndex();

    controller.enqueue({ chunk: "<div id='S:1'>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Loading S1..." });
    controller.enqueue({ chunk: "<div id='S:2'>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Loading S2..." });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });
    controller.enqueue({ chunk: "</div>", isEndOfTag: true });
    controller.enqueue({ chunk: "<div>", isOpenOfTag: true });
    controller.enqueue({ chunk: "<h1>", isOpenOfTag: true });
    controller.enqueue({ chunk: "Hello world" });
    controller.enqueue({ chunk: "<template id='U:2'>", suspenseId: nestedSuspenseId, isOpenOfTag: true });
    controller.enqueue({ chunk: "Success U2!", suspenseId: nestedSuspenseId });
    controller.enqueue({ chunk: "<template id='U:1'>", suspenseId: firstSuspenseId, isOpenOfTag: true });
    controller.enqueue({ chunk: "</h1>", isEndOfTag: true });
    controller.enqueue({ chunk: "Success U1!", suspenseId: firstSuspenseId });
    controller.enqueue({ chunk: "</template>", suspenseId: nestedSuspenseId, isEndOfTag: true });
    controller.enqueue({ chunk: "</template>", suspenseId: firstSuspenseId, isEndOfTag: true });

    expect(mockController.enqueue.mock.calls).toEqual([
      ["<div id='S:1'>"],
      ["Loading S1..."],
      ["<div id='S:2'>"],
      ["Loading S2..."],
      ["</div>"],
      ["</div>"],
      ["<div>"],
      ["<h1>"],
      ["Hello world"],
      ['</h1>'],
      ["<template id='U:2'>Success U2!</template><script>u$('2')</script>"],
      ["<template id='U:1'>Success U1!</template><script>u$('1')</script>"],
    ]);
  });
});