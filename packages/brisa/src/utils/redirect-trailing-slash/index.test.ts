import { describe, it, expect, afterEach } from 'bun:test';

import redirectTrailingSlash from '.';
import extendRequestContext from '@/utils/extend-request-context';

const BASE_PATHS = ['', '/foo', '/foo/bar'];

describe('utils', () => {
  describe.each(BASE_PATHS)('redirectTrailingSlash %s', (basePath) => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it('should redirect without trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/foo/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response?.status).toBe(301);
      expect(response?.headers.get('location')).toBe(`https://example.com${basePath}/foo`);
    });

    it('should NOT redirect the home trailingSlash=false + trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).not.toBeDefined();
    });

    it('should NOT redirect the home trailingSlash=false + without trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).not.toBeDefined();
    });

    it('should NOT redirect the home trailingSlash=true + trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).not.toBeDefined();
    });

    it('should NOT redirect the home trailingSlash=true + without trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).not.toBeDefined();
    });

    it('should redirect with trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/foo`),
      });
      const response = redirectTrailingSlash(request);
      expect(response?.status).toBe(301);
      expect(response?.headers.get('location')).toBe(`https://example.com${basePath}/foo/`);
    });

    it('should not redirect when trailingSlash=true but already has the trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/foo/`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).toBeUndefined();
    });

    it('should not redirect when trailingSlash=false but already has no trailing slash', () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
          basePath,
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request(`https://example.com/foo`),
      });
      const response = redirectTrailingSlash(request);
      expect(response).toBeUndefined();
    });
  });
});
