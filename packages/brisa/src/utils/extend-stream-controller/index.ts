import type { ComponentType, RequestContext } from "@/types";

export type ChunksOptions = {
  chunk: string;
  suspenseId?: number;
};

export type Controller = {
  enqueue(chunk: string, suspenseId?: number): void;
  head?: ComponentType;
  nextSuspenseIndex(): number;
  suspensePromise(promise: Promise<void>): void;
  waitSuspensedPromises(): Promise<void>;
  setCurrentWebComponentSymbol(symbol?: symbol): void;
  getCurrentWebComponentSymbol(): symbol | undefined;
  startTag(chunk: string | null, suspenseId?: number): void;
  endTag(chunk: string | null, suspenseId?: number): void;
  flushAllReady(): void;
  addId(id: string): void;
  transferStoreToClient(suspenseId?: number): void;
  hasId(id: string): boolean;
  hasHeadTag: boolean;
  applySuspense: boolean;
  insideHeadTag: boolean;
  hasUnsuspense: boolean;
  areSignalsInjected: boolean;
  hasActionRPC: boolean;
};

type SuspensedState = {
  chunk: string;
  openTags: number;
  closeTags: number;
};

const wrapSuspenseTag = (chunk: string, id: number) =>
  `<template id="U:${id}">${chunk}</template><script id="R:${id}">u$('${id}')</script>`;

export default function extendStreamController({
  controller,
  head,
  applySuspense = true,
  request,
}: {
  controller: ReadableStreamDefaultController<string>;
  head?: ComponentType;
  applySuspense?: boolean;
  request: RequestContext;
}): Controller {
  const ids = new Set<string>();
  const openWebComponents: symbol[] = [];
  const suspensePromises: Promise<void>[] = [];
  const suspensedMap = new Map<number, SuspensedState>();
  const getSuspensedState = (id: number) =>
    suspensedMap.get(id) ?? { chunk: "", openTags: 0, closeTags: 0 };

  let noSuspensedOpenTags = 0;
  let noSuspensedCloseTags = 0;
  let storeTransfered = false;

  return {
    head,
    hasHeadTag: false,
    insideHeadTag: false,
    hasUnsuspense: false,
    hasActionRPC: false,
    areSignalsInjected: false,
    applySuspense,
    setCurrentWebComponentSymbol(symbol) {
      if (symbol) openWebComponents.push(symbol);
      else openWebComponents.pop();
    },
    getCurrentWebComponentSymbol() {
      return openWebComponents.at(-1);
    },
    addId(id) {
      ids.add(id);
    },
    transferStoreToClient(suspenseId?: number) {
      const store = (request as any).webStore as Map<string, any>;
      const areSignalsInjected = this.areSignalsInjected;

      if (store.size === 0) return;

      const serializedStore = JSON.stringify([...store]);
      let script;

      if (areSignalsInjected && storeTransfered) {
        script = `<script>for(let [k, v] of ${serializedStore}) _s.Map.set(k, v); _S.set(k, v)</script>`;
      } else if (areSignalsInjected && !storeTransfered) {
        script = `<script>window._S=${serializedStore};for(let [k, v] of _S) _s.Map.set(k, v)</script>`;
      } else if (storeTransfered && !areSignalsInjected) {
        script = `<script>for(let [k, v] of ${serializedStore}) _S.set(k, v)</script>`;
      } else {
        script = `<script>window._S=${serializedStore}</script>`;
      }

      this.enqueue(script, suspenseId);

      store.clear();
      storeTransfered = true;
    },
    hasId(id) {
      return ids.has(id);
    },
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
    async endTag(chunk, suspenseId) {
      if (!suspenseId) {
        noSuspensedCloseTags++;
        // unsuspense inside the document html
        if (chunk === "</html>") {
          await this.waitSuspensedPromises();
          this.transferStoreToClient();
        }

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
