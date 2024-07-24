import { describe, it, expect, mock, afterEach } from 'bun:test';
import type { ServerWebSocket } from 'bun';

import extendRequestContext from '.';
import createContext from '@/utils/create-context';
import { contextProvider } from '@/utils/context-provider/server';
import type { RequestContext } from '@/types';
import { ENCRYPT_NONTEXT_PREFIX, ENCRYPT_PREFIX } from '@/utils/crypto';
import { toInline } from '@/helpers';
import { RenderInitiator } from '@/core/server';
import { getTransferedServerStoreToClient } from '@/utils/transfer-store-service';

describe('brisa core', () => {
  afterEach(() => {
    globalThis.sockets = undefined;
  });
  describe('extend request context', () => {
    it('should extent the request', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      expect(requestContext.route).toEqual(route);
      expect(requestContext.finalURL).toEqual(request.url);
      expect(requestContext.store).toBeInstanceOf(Map);
    });

    it('should work store', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set('foo', 'bar');
      expect(requestContext.store.get('foo')).toBe('bar');
    });

    it('should work store params', () => {
      const request = new Request('https://example.com?foo=bar');
      const store = new Map() as RequestContext['store'];
      const route = { path: '/' } as any;

      store.set('foo', 'baz');

      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        store,
      });
      expect(requestContext.store.get('foo')).toBe('baz');
    });

    it('should work webStore params (internal used by store.transferToClient function)', () => {
      const request = new Request('https://example.com?foo=bar');
      const webStore = new Map() as RequestContext['store'];
      const route = { path: '/' } as any;

      webStore.set('foo', 'baz');

      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        webStore,
      } as any);
      expect((requestContext as any).webStore.get('foo')).toBe('baz');
    });

    it('should encrypt transferToClient with options "encrypt"', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set('foo', 'bar');
      requestContext.store.transferToClient(['foo'], { encrypt: true });

      const transferedStore = getTransferedServerStoreToClient(requestContext);
      const value = transferedStore.get('foo');

      expect(value).not.toBe('bar');
      expect(value).toBeTypeOf('string');
      expect(value).toStartWith(ENCRYPT_PREFIX);
      expect(value).toHaveLength(ENCRYPT_PREFIX.length + 32);
    });

    it('should encrypt an object with transferToClient with options "encrypt"', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set('foo', { bar: 'baz' });
      requestContext.store.transferToClient(['foo'], { encrypt: true });

      const transferedStore = getTransferedServerStoreToClient(requestContext);
      const value = transferedStore.get('foo');

      expect(value).not.toBe('bar');
      expect(value).toBeTypeOf('string');
      expect(value).toStartWith(ENCRYPT_NONTEXT_PREFIX);
      expect(value).toHaveLength(ENCRYPT_NONTEXT_PREFIX.length + 32);
    });

    it('should work i18n', () => {
      const mockT = mock(() => 'foo');
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        i18n: {
          pages: {},
          locale: 'es',
          defaultLocale: 'en',
          locales: ['en', 'es'],
          t: mockT,
          overrideMessages: () => {},
        },
      });

      expect(requestContext.i18n.locale).toBe('es');
      expect(requestContext.i18n.defaultLocale).toBe('en');
      expect(requestContext.i18n.locales).toEqual(['en', 'es']);
      expect(requestContext.i18n.t<string>('some-key')).toBe('foo');
      expect(requestContext.i18n.overrideMessages).toBeTypeOf('function');
    });

    it('should be linked with websockets', () => {
      const requestId = 'some-id';
      const mockSend = mock((m: string | BufferSource) => 1);

      globalThis.sockets = new Map();
      globalThis.sockets.set(requestId, {
        send: (m: string) => mockSend(m),
      } as ServerWebSocket<unknown>);

      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
        id: requestId,
      });

      requestContext.ws.send('some message');

      expect(mockSend).toHaveBeenCalledWith('some message');
    });

    it('should return the default value when the context is not found', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const { useContext } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const context = createContext('foo');
      expect(useContext(context).value).toBe('foo');
    });

    it('should return the provider value when has a context', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const context = createContext('foo');
      const { useContext, store } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const ctx = contextProvider({ context, value: 'bar', store });
      expect(useContext(context).value).toBe('bar');
      ctx.clearProvider();
      expect(useContext(context).value).toBe('foo');
    });

    it('should return the last provider value when has multiple providers', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const context = createContext('foo');
      const { useContext, store } = extendRequestContext({
        originalRequest: request,
        route,
      });
      const ctxParent = contextProvider({
        context,
        value: 'bar',
        store,
      });
      const ctxChild = contextProvider({
        context,
        value: 'baz',
        store,
      });
      expect(useContext(context).value).toBe('baz');
      ctxChild.clearProvider();
      expect(useContext(context).value).toBe('bar');
      ctxParent.clearProvider();
      expect(useContext(context).value).toBe('foo');
    });

    it('should transferToClient works', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      requestContext.store.set('foo', 'bar');
      requestContext.store.set('baz', 'qux');
      requestContext.store.transferToClient(['foo']);
      const transferedStore = getTransferedServerStoreToClient(requestContext);
      expect(transferedStore.get('foo')).toBe('bar');
      expect(transferedStore.get('baz')).toBe(undefined);
    });

    it('should add the indicate function', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      const indicate = requestContext.indicate('foo');
      expect(indicate.id).toBe('__ind:foo');
      expect(indicate.value).toBe(false);
    });

    it('should work indicate with error', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      const indicate = requestContext.indicate('foo');
      expect(indicate.error.value).toBeUndefined();
    });

    it('should work css function', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      const { css } = requestContext;
      css`
        body {
          color: red;
        }
      `;
      css`
        body {
          background: blue;
        }
      `;
      expect(toInline((requestContext as any)._style)).toBe(
        toInline('body {color: red;}body {background: blue;}'),
      );
      (requestContext as any)._style = '';
      css`
        body {
          color: yellow;
        }
      `;
      expect(toInline((requestContext as any)._style)).toBe(
        toInline('body {color: yellow;}'),
      );
    });

    it('should have renderInitiator as "INITIAL_REQUEST" by default', () => {
      const request = new Request('https://example.com');
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      expect(requestContext.renderInitiator).toBe(
        RenderInitiator.INITIAL_REQUEST,
      );
    });

    it('should keep the renderInitiator of the originalRequest', () => {
      const request = new Request('https://example.com');
      // @ts-ignore
      request.renderInitiator = RenderInitiator.SERVER_ACTION;
      const route = {
        path: '/',
      } as any;
      const requestContext = extendRequestContext({
        originalRequest: request,
        route,
      });
      expect(requestContext.renderInitiator).toBe(
        RenderInitiator.SERVER_ACTION,
      );
    });
  });
});
