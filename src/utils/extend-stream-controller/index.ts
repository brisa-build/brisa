export type ChunksOptions = {
  chunk: string;
  suspenseId?: number;
};

export type Controller = {
  enqueue(chunk: string, suspenseId?: number): void;
  nextSuspenseIndex(): number;
  suspensePromise(promise: Promise<void>): void;
  waitSuspensedPromises(): Promise<void>;
  startTag(chunk: string | null, suspenseId?: number): void;
  endTag(chunk: string | null, suspenseId?: number): void;
  flushAllReady(): void;
  hasHeadTag: boolean;
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
    `<template id="U:${id}">${chunk}`;

  const endSuspenseTag = (chunk: string, id: number) =>
    `${chunk}</template><script id="R:${id}">u$('${id}')</script>`;

  const wrapSuspenseTag = (chunk: string, id: number) =>
    startSuspenseTag(chunk, id) + endSuspenseTag("", id);

  return {
    hasHeadTag: false,
    startTag(chunk, suspenseId) {
      if (!suspenseId) {
        noSuspensedOpenTags++;
        // chunk=null when is a fragment
        if (chunk) controller.enqueue(chunk);
        return;
      }

      const state = getSuspensedState(suspenseId);

      state.openTags++;
      state.chunk += chunk ?? "";
      suspensedMap.set(suspenseId, state);
    },
    enqueue(chunk, suspenseId) {
      if (!suspenseId) return controller.enqueue(chunk);

      const state = getSuspensedState(suspenseId);

      state.chunk += chunk;

      return suspensedMap.set(suspenseId, state);
    },
    endTag(chunk, suspenseId) {
      if (!suspenseId) {
        noSuspensedCloseTags++;
        // chunk=null when is a fragment
        if (chunk) controller.enqueue(chunk);
        return this.flushAllReady();
      }

      const state = getSuspensedState(suspenseId);

      state.closeTags++;
      state.chunk += chunk ?? "";
      suspensedMap.set(suspenseId, state);

      this.flushAllReady();
    },
    flushAllReady() {
      if (noSuspensedOpenTags !== noSuspensedCloseTags) return;

      for (const [suspenseId, state] of suspensedMap.entries()) {
        if (state.closeTags !== state.openTags) continue;
        controller.enqueue(wrapSuspenseTag(state.chunk, suspenseId));
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
