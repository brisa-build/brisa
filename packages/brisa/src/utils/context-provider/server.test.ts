import { describe, expect, it } from 'bun:test';
import {
  CONTEXT_STORE_ID,
  CURRENT_PROVIDER_ID,
  clearProvidersByWCSymbol,
  contextProvider,
  registerSlotToActiveProviders,
  restoreSlotProviders,
} from './server';
import createContext from '@/utils/create-context';
import extendRequestContext from '@/utils/extend-request-context';

describe('utils', () => {
  describe('server context provider', () => {
    it('should create a context provider', () => {
      const context = createContext('foo');
      const value = 'bar';
      const store = new Map();

      const res = contextProvider({ context, value, store });
      expect(res.clearProvider).toBeTypeOf('function');

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf('symbol');
      expect(providerStore.get(currentProviderId).value).toBe(value);

      res.clearProvider();

      const newContextStore = contextStore.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeUndefined();
      expect(newContextStore.get(newCurrentProviderId)).toBeUndefined();
    });

    it('should pause and restore a context provider', () => {
      const context = createContext('foo');
      const value = 'bar';
      const store = new Map();
      const webComponentSymbol = Symbol('web-component');

      const res = contextProvider({
        context,
        value,
        store,
        webComponentSymbol,
      });
      expect(res.clearProvider).toBeTypeOf('function');
      expect(res.pauseProvider).toBeTypeOf('function');
      expect(res.restoreProvider).toBeTypeOf('function');
      expect(res.isProviderPaused()).toBeFalse();
      expect(res.addSlot).toBeTypeOf('function');
      expect(res.hasSlot).toBeTypeOf('function');
      expect(res.hasSomeSlot).toBeTypeOf('function');
      expect(res.webComponentSymbol).toBeTypeOf('symbol');

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf('symbol');
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
      expect(currentProviderId3).toBeTypeOf('symbol');
      expect(providerStore3.get(currentProviderId3).value).toBe(value);
      expect(res.isProviderPaused()).toBeFalse();

      res.clearProvider();

      const newProviderStore = contextStore.get(context.id);
      const newCurrentProviderId = newProviderStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeUndefined();
      expect(newProviderStore.get(newCurrentProviderId)).toBeUndefined();
    });

    it('should return the last provider value on clean', () => {
      const context = createContext('foo');
      const value = 'bar';
      const store = new Map();

      const resParent = contextProvider({ context, value, store });
      expect(resParent.clearProvider).toBeTypeOf('function');

      const contextStore = store.get(CONTEXT_STORE_ID);
      const providerStore = contextStore.get(context.id);
      const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId).toBeTypeOf('symbol');
      expect(providerStore.get(currentProviderId).value).toBe(value);

      const value2 = 'baz';
      const res = contextProvider({
        context,
        value: value2,
        store,
      });
      expect(res.clearProvider).toBeTypeOf('function');

      const contextStore2 = contextStore.get(context.id);
      const currentProviderId2 = contextStore2.get(CURRENT_PROVIDER_ID);
      expect(currentProviderId2).toBeTypeOf('symbol');
      expect(contextStore2.get(currentProviderId2).value).toBe(value2);

      res.clearProvider();

      const newContextStore = contextStore.get(context.id);
      const newCurrentProviderId = newContextStore.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId).toBeTypeOf('symbol');
      expect(newContextStore.get(newCurrentProviderId).value).toBe('bar');

      resParent.clearProvider();

      const newContextStore2 = contextStore.get(context.id);
      const newCurrentProviderId2 = newContextStore2.get(CURRENT_PROVIDER_ID);
      expect(newCurrentProviderId2).toBeUndefined();
      expect(newContextStore2.get(newCurrentProviderId2)).toBeUndefined();
    });

    it('should be possible to register a slot', () => {
      const context = createContext('foo');
      const value = 'bar';
      const store = new Map();

      const res = contextProvider({ context, value, store });
      expect(res.clearProvider).toBeTypeOf('function');
      expect(res.addSlot).toBeTypeOf('function');
      expect(res.hasSlot).toBeTypeOf('function');

      res.addSlot('foo');
      expect(res.hasSomeSlot()).toBeTrue();
      expect(res.hasSlot('foo')).toBeTrue();
      expect(res.hasSlot('bar')).toBeFalse();
    });
  });

  describe('server registerSlotToActiveProviders', () => {
    it('should register the slot to active providers', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const context = createContext('foo');
      const value = 'bar';
      const store = req.store;
      const provider = contextProvider({ context, value, store });

      registerSlotToActiveProviders('foo-slot', req);

      expect(provider.value).toBe('bar');
      expect(provider.hasSlot('foo-slot')).toBeTrue();
    });

    it('should not register the slot to paused providers', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const context = createContext('foo');
      const store = req.store;
      const activeProv = contextProvider({ context, value: 'actived', store });
      const pausedProv = contextProvider({ context, value: 'paused', store });

      pausedProv.pauseProvider();
      registerSlotToActiveProviders('foo-slot', req);

      expect(activeProv.value).toBe('actived');
      expect(activeProv.isProviderPaused()).toBeFalse();
      expect(activeProv.hasSlot('foo-slot')).toBeTrue();

      expect(pausedProv.value).toBe('paused');
      expect(pausedProv.isProviderPaused()).toBeTrue();
      expect(pausedProv.hasSlot('foo-slot')).toBeFalse();
    });
  });

  describe('server restoreSlotProviders', () => {
    it('should restore the slot providers', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const context = createContext('foo');
      const store = req.store;

      const provider = contextProvider({ context, value: 'foo', store });
      const provider2 = contextProvider({ context, value: 'bar', store });
      const provider3 = contextProvider({ context, value: 'baz', store });
      const provider4 = contextProvider({ context, value: 'qux', store });

      provider.addSlot('foo');
      provider.pauseProvider();
      provider2.addSlot('bar');
      provider3.addSlot('');
      provider3.pauseProvider();
      provider4.pauseProvider();

      expect(provider.isProviderPaused()).toBeTrue();
      expect(provider2.isProviderPaused()).toBeFalse();
      expect(provider3.isProviderPaused()).toBeTrue();
      expect(provider4.isProviderPaused()).toBeTrue();

      const r = restoreSlotProviders('foo', req);

      expect(r.length).toBe(1);
      expect(r[0]).toEqual(provider);
      expect(provider.isProviderPaused()).toBeFalse();
      expect(provider2.isProviderPaused()).toBeFalse();
      expect(provider3.isProviderPaused()).toBeTrue();
      expect(provider4.isProviderPaused()).toBeTrue();

      const r2 = restoreSlotProviders('', req);

      expect(r2.length).toBe(1);
      expect(r2[0]).toEqual(provider3);
      expect(provider.isProviderPaused()).toBeFalse();
      expect(provider2.isProviderPaused()).toBeFalse();
      expect(provider3.isProviderPaused()).toBeFalse();
      expect(provider4.isProviderPaused()).toBeTrue();
    });

    it('should restore multiple slot providers', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const context = createContext('foo');
      const store = req.store;

      const provider = contextProvider({ context, value: 'foo', store });
      const provider2 = contextProvider({ context, value: 'bar', store });
      const provider3 = contextProvider({ context, value: 'baz', store });
      const provider4 = contextProvider({ context, value: 'qux', store });

      provider.addSlot('foo');
      provider.pauseProvider();
      provider2.addSlot('foo');
      provider2.pauseProvider();
      provider3.addSlot('foo');
      provider3.pauseProvider();
      provider4.addSlot('foo');
      provider4.pauseProvider();

      expect(provider.isProviderPaused()).toBeTrue();
      expect(provider2.isProviderPaused()).toBeTrue();
      expect(provider3.isProviderPaused()).toBeTrue();
      expect(provider4.isProviderPaused()).toBeTrue();

      const r = restoreSlotProviders('foo', req);

      expect(r.length).toBe(4);
      expect(r[0]).toEqual(provider);
      expect(r[1]).toEqual(provider2);
      expect(r[2]).toEqual(provider3);
      expect(r[3]).toEqual(provider4);
      expect(provider.isProviderPaused()).toBeFalse();
      expect(provider2.isProviderPaused()).toBeFalse();
      expect(provider3.isProviderPaused()).toBeFalse();
      expect(provider4.isProviderPaused()).toBeFalse();
    });
  });

  describe('server clearProvidersByWCSymbol', () => {
    it('should clear the providers by web component symbol', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const context = createContext('foo');
      const store = req.store;

      const webComponentSymbol = Symbol('foo');
      const webComponentSymbol2 = Symbol('bar');
      const webComponentSymbol3 = Symbol('baz');
      const webComponentSymbol4 = Symbol('qux');
      const currProviderSymbolId = 1;

      contextProvider({
        context,
        value: 'foo',
        store,
        webComponentSymbol: webComponentSymbol,
      });
      contextProvider({
        context,
        value: 'bar',
        store,
        webComponentSymbol: webComponentSymbol2,
      });
      contextProvider({
        context,
        value: 'baz',
        store,
        webComponentSymbol: webComponentSymbol3,
      });
      contextProvider({
        context,
        value: 'qux',
        store,
        webComponentSymbol: webComponentSymbol4,
      });

      expect(store.get(CONTEXT_STORE_ID).get(context.id).size).toBe(
        4 + currProviderSymbolId,
      );

      clearProvidersByWCSymbol(webComponentSymbol, req);
      expect(store.get(CONTEXT_STORE_ID).get(context.id).size).toBe(
        3 + currProviderSymbolId,
      );

      clearProvidersByWCSymbol(webComponentSymbol2, req);
      expect(store.get(CONTEXT_STORE_ID).get(context.id).size).toBe(
        2 + currProviderSymbolId,
      );

      clearProvidersByWCSymbol(webComponentSymbol3, req);
      expect(store.get(CONTEXT_STORE_ID).get(context.id).size).toBe(
        1 + currProviderSymbolId,
      );

      clearProvidersByWCSymbol(webComponentSymbol4, req);
      expect(store.get(CONTEXT_STORE_ID).get(context.id).size).toBe(0);
    });
  });
});
