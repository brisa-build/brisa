export type ChunksOptions = {
  chunk: string;
  suspenseId?: number;
};

export type Controller = {
  enqueue(chunk: string, suspenseId?: number): void;
  nextSuspenseIndex(): number;
  suspensePromise(promise: Promise<void>): void;
  waitSuspensedPromises(): Promise<void>;
  startTag(chunk: string, suspenseId?: number): void;
  endTag(chunk: string, suspenseId?: number): void;
  flushAllReady(): void;
};

type SuspensedState = {
  chunk: string;
  openTags: number;
  closeTags: number;
};

export default function extendStreamController(
  controller: ReadableStreamDefaultController<string>,
): Controller {
  const suspensePromises: Promise<void>[] = [];
  const suspensedMap = new Map<number, SuspensedState>();
  const getSuspensedState = (id: number) =>
    suspensedMap.get(id) ?? { chunk: "", openTags: 0, closeTags: 0 };

  let noSuspensedOpenTags = 0;
  let noSuspensedCloseTags = 0;

  const startSuspenseTag = (chunk: string, id: number) =>
    `<template id="U:${id}">${chunk}`

  const endSuspenseTag = (chunk: string, id: number) =>
    `${chunk}</template><script id="R:${id}">u$('${id}')</script>`

  const wrapSuspenseTag = (chunk: string, id: number) =>
    startSuspenseTag(chunk, id) + endSuspenseTag("", id)

  return {
    startTag(chunk, suspenseId) {
      if (!suspenseId) {
        noSuspensedOpenTags++;
        return controller.enqueue(chunk);
      }

      const state = getSuspensedState(suspenseId);

      state.openTags++;
      state.chunk += startSuspenseTag(chunk, suspenseId);
      suspensedMap.set(suspenseId, state);
    },
    enqueue(chunk, suspenseId) {
      if (!suspenseId) return controller.enqueue(chunk);

      const state = getSuspensedState(suspenseId);
      const isHTMLTextWithoutTags = state.openTags === 0;

      if (isHTMLTextWithoutTags) {
        state.chunk += wrapSuspenseTag(chunk, suspenseId);
        suspensedMap.set(suspenseId, state);
        return this.flushAllReady();
      }

      state.chunk += chunk;

      return suspensedMap.set(suspenseId, state);
    },
    endTag(chunk, suspenseId) {
      if (!suspenseId) {
        noSuspensedCloseTags++;
        controller.enqueue(chunk);
        return this.flushAllReady();
      }

      const state = getSuspensedState(suspenseId);

      state.closeTags++;
      state.chunk += endSuspenseTag(chunk, suspenseId);
      suspensedMap.set(suspenseId, state);

      this.flushAllReady();
    },
    flushAllReady() {
      if (noSuspensedOpenTags !== noSuspensedCloseTags) return;

      for (const [suspenseId, state] of suspensedMap.entries()) {
        if (state.closeTags !== state.openTags) continue;
        controller.enqueue(state.chunk);
        suspensedMap.delete(suspenseId);
      }
    },
    suspensePromise(promise: Promise<void>) {
      suspensePromises.push(promise);
    },
    async waitSuspensedPromises() {
      await Promise.all(suspensePromises);
      this.flushAllReady();
      return;
    },
    nextSuspenseIndex() {
      return suspensePromises.length + 1;
    },
  };
}
