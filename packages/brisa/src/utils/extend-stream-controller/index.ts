import { RenderInitiator } from '@/public-constants';
import type { ComponentType, RequestContext } from '@/types';
import { getTransferedServerStoreToClient } from '@/utils/transfer-store-service';

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
  flushAndUnsupenseAllReady(): void;
  addId(id: string): void;
  generateComponentId(): void;
  getComponentId(): string;
  getParentComponentId(): string;
  removeComponentId(): void;
  transferStoreToClient(suspenseId?: number): void;
  hasId(id: string): boolean;
  hasHeadTag: boolean;
  applySuspense: boolean;
  insideHeadTag: boolean;
  hasUnsuspense: boolean;
  areSignalsInjected: boolean;
  hasActionRPC: boolean;
  styleSheetsChunks: string[];
};

type SuspensedState = {
  chunk: string;
  openTags: number;
  closeTags: number;
};

const wrapUnsuspenseTag = (chunk: string, id: number) =>
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
  const componentIDs: string[] = [];
  const openWebComponents: symbol[] = [];
  const suspensePromises: Promise<void>[] = [];
  const finishDocument = Promise.withResolvers<void>();
  const suspensedMap = new Map<number, SuspensedState>();
  const styleSheetsChunks: string[] = [];
  const getSuspensedState = (id: number) =>
    suspensedMap.get(id) ?? { chunk: '', openTags: 0, closeTags: 0 };

  let storeTransfered = false;
  let initialComponentId: number;

  return {
    head,
    styleSheetsChunks,
    hasHeadTag: false,
    insideHeadTag: false,
    hasUnsuspense: false,
    hasActionRPC: false,
    areSignalsInjected: request.method === 'POST',
    applySuspense,
    generateComponentId() {
      if (!initialComponentId) {
        initialComponentId = millisecondsSinceStartOfMonth();
      }
      componentIDs.push((initialComponentId++).toString(36));
    },
    getComponentId() {
      return componentIDs.at(-1) ?? '';
    },
    getParentComponentId() {
      return componentIDs.at(-2) ?? '';
    },
    removeComponentId() {
      componentIDs.pop();
    },
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
      const store = getTransferedServerStoreToClient(request);
      const areSignalsInjected = this.areSignalsInjected;

      if (store.size === 0) return;

      const serializedStore = JSON.stringify([...store]);
      const isFromRPC =
        request.renderInitiator === RenderInitiator.SPA_NAVIGATION ||
        request.renderInitiator === RenderInitiator.SERVER_ACTION;
      let script;

      if (isFromRPC) {
        script = `<script type="application/json" id="S">${serializedStore}</script>`;
      } else if (areSignalsInjected && storeTransfered) {
        script = `<script>for(let [k, v] of ${serializedStore}){ _s?.set?.(k, v); _S.push([k, v])}</script>`;
      } else if (areSignalsInjected && !storeTransfered) {
        script = `<script>window._S=${serializedStore};for(let [k, v] of _S) _s?.set?.(k, v)</script>`;
      } else if (storeTransfered && !areSignalsInjected) {
        script = `<script>for(let e of ${serializedStore}) _S.push(e)</script>`;
      } else {
        script = `<script>window._S=${serializedStore}</script>`;
      }

      this.enqueue(script, suspenseId);

      (request as any).webStore.clear();
      storeTransfered = true;
    },
    hasId(id) {
      return ids.has(id);
    },
    startTag(chunk, suspenseId) {
      if (!suspenseId) {
        // chunk=null when is a fragment
        if (chunk) controller.enqueue(chunk);
        return;
      }

      const state = getSuspensedState(suspenseId);

      state.openTags++;
      state.chunk += chunk ?? '';
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
        const isClosingHTMLTag = chunk === '</html>';

        // unsuspense inside the document html
        if (isClosingHTMLTag) {
          this.transferStoreToClient();
        }

        // chunk=null when is a fragment
        if (chunk) controller.enqueue(chunk);

        // The document is finished, this promise is useful to
        // start unsuspending the components, outside the head
        // tag then is not conflicting with diff on navigating
        // to another pages.
        if (isClosingHTMLTag) {
          await this.waitSuspensedPromises();
        }

        return;
      }

      const state = getSuspensedState(suspenseId);

      state.closeTags++;
      state.chunk += chunk ?? '';
      suspensedMap.set(suspenseId, state);
    },
    flushAndUnsupenseAllReady() {
      for (const [suspenseId, state] of suspensedMap.entries()) {
        if (state.closeTags !== state.openTags) continue;
        controller.enqueue(wrapUnsuspenseTag(state.chunk, suspenseId));
        suspensedMap.delete(suspenseId);
      }
    },
    suspensePromise(promise: Promise<void>) {
      suspensePromises.push(
        Promise.all([finishDocument.promise, promise]).then(() =>
          this.flushAndUnsupenseAllReady(),
        ),
      );
    },
    async waitSuspensedPromises() {
      if (suspensePromises.length === 0) return;
      finishDocument.resolve();
      await Promise.all(suspensePromises);
    },
    nextSuspenseIndex() {
      return suspensePromises.length + 1;
    },
  };
}

/**
 * The reason of using this function is to generate an initial id value to
 * increment then for each component and return it as radix 36, which is
 * a string representation of the number much shorter than the decimal one or
 * using crypto.randomUUID() which is too long and more expensive in order to
 * generate a unique id for each component.
 *
 * Instead of using 0 as initial value, it's important to have a different
 * initial value in each navigation, to avoid conflicts with components ids
 * after diffing the new page conserving the old components ids.
 *
 * The probability of collision is very low, but it's not zero.
 */
function millisecondsSinceStartOfMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return now.getTime() - startOfMonth.getTime();
}
