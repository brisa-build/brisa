import { describe, expect, it } from "bun:test";
import {
  CONTEXT_STORE_ID,
  CURRENT_PROVIDER_ID,
  contextProvider,
} from "./server";
import createContext from "../create-context";

describe("utils", () => {
  describe("context provider: server", () => {
    it("should create a context provider", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const res = contextProvider({ context, value, store });
      expect(res.clearProvider).toBeTypeOf("function");

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf("symbol");
      expect(providerStore.get(currentProviderId).value).toBe(value);

      res.clearProvider();

      const newContextStore = contextStore.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeUndefined();
      expect(newContextStore.get(newCurrentProviderId)).toBeUndefined();
    });

    it("should pause and restore a context provider", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const res = contextProvider({ context, value, store });
      expect(res.clearProvider).toBeTypeOf("function");
      expect(res.pauseProvider).toBeTypeOf("function");
      expect(res.restoreProvider).toBeTypeOf("function");
      expect(res.isProviderPaused()).toBeFalse();

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf("symbol");
      expect(providerStore.get(currentProviderId).value).toBe(value);

      res.pauseProvider();

      const providerStore2 = contextStore.get(context.id);
      const currentProviderId2 = providerStore2.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId2).toBeUndefined();
      expect(providerStore2.get(currentProviderId2)).toBeUndefined();
      expect(res.isProviderPaused()).toBeTrue();

      res.restoreProvider();

      const providerStore3 = contextStore.get(context.id);
      const currentProviderId3 = providerStore3.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId3).toBeTypeOf("symbol");
      expect(providerStore3.get(currentProviderId3).value).toBe(value);
      expect(res.isProviderPaused()).toBeFalse();

      res.clearProvider();

      const newProviderStore = contextStore.get(context.id);
      const newCurrentProviderId = newProviderStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeUndefined();
      expect(newProviderStore.get(newCurrentProviderId)).toBeUndefined();
    });

    it("should return the last provider value on clean", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const resParent = contextProvider({ context, value, store });
      expect(resParent.clearProvider).toBeTypeOf("function");

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf("symbol");
      expect(providerStore.get(currentProviderId).value).toBe(value);

      const value2 = "baz";
      const res = contextProvider({
        context,
        value: value2,
        store,
      });
      expect(res.clearProvider).toBeTypeOf("function");

      const contextStore2 = contextStore.get(context.id);
      const currentProviderId2 = contextStore2.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId2).toBeTypeOf("symbol");
      expect(contextStore2.get(currentProviderId2).value).toBe(value2);

      res.clearProvider();

      const newContextStore = contextStore.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeTypeOf("symbol");
      expect(newContextStore.get(newCurrentProviderId).value).toBe("bar");

      resParent.clearProvider();

      const newContextStore2 = contextStore.get(context.id);
      const newCurrentProviderId2 = newContextStore2.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId2).toBeUndefined();
      expect(newContextStore2.get(newCurrentProviderId2)).toBeUndefined();
    });

    it("should be possible to register a slot", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const res = contextProvider({ context, value, store });
      expect(res.clearProvider).toBeTypeOf("function");
      expect(res.addSlot).toBeTypeOf("function");
      expect(res.hasSlot).toBeTypeOf("function");

      res.addSlot("foo");
      expect(res.hasSlot("foo")).toBeTrue();
      expect(res.hasSlot("bar")).toBeFalse();
    });
  });
});
