import { describe, expect, it } from "bun:test";
import { CURRENT_PROVIDER_ID, contextProvider } from "./server";
import createContext from "../create-context";

describe("utils", () => {
  describe("context provider: server", () => {
    it("should create a context provider", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const cleanProviderFn = contextProvider({ context, value, store });
      expect(cleanProviderFn).toBeTypeOf("function");

      const contextStore = store.get(context.id);
      const currentProviderId = contextStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf("symbol");
      expect(contextStore.get(currentProviderId)).toBe(value);

      cleanProviderFn();

      const newContextStore = store.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeUndefined();
      expect(newContextStore.get(newCurrentProviderId)).toBeUndefined();
    });

    it("should return the last provider value on clean", () => {
      const context = createContext("foo");
      const value = "bar";
      const store = new Map();

      const cleanProviderParent = contextProvider({ context, value, store });
      expect(cleanProviderParent).toBeTypeOf("function");

      const contextStore = store.get(context.id);
      const currentProviderId = contextStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf("symbol");
      expect(contextStore.get(currentProviderId)).toBe(value);

      const value2 = "baz";
      const cleanProviderChild = contextProvider({
        context,
        value: value2,
        store,
      });
      expect(cleanProviderChild).toBeTypeOf("function");

      const contextStore2 = store.get(context.id);
      const currentProviderId2 = contextStore2.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId2).toBeTypeOf("symbol");
      expect(contextStore2.get(currentProviderId2)).toBe(value2);

      cleanProviderChild();

      const newContextStore = store.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeTypeOf("symbol");
      expect(newContextStore.get(newCurrentProviderId)).toBe("bar");

      cleanProviderParent();

      const newContextStore2 = store.get(context.id);
      const newCurrentProviderId2 = newContextStore2.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId2).toBeUndefined();
      expect(newContextStore2.get(newCurrentProviderId2)).toBeUndefined();
    });
  });
});
