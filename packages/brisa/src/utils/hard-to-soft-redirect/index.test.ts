import { describe, expect, it } from 'bun:test';
import extendRequestContext from '../extend-request-context';
import hardToSoftRedirect, { handleSPARedirects } from '.';

const req = extendRequestContext({
  originalRequest: new Request('https://test.com'),
});

describe('utils', () => {
  describe('hardToSoftRedirect', () => {
    it('should return a response with the navigate header', () => {
      const location = '/some-location';
      const response = hardToSoftRedirect({ req, location });

      expect(response.headers.get('X-Navigate')).toBe(location);
      expect(response.headers.has('X-Mode')).toBeFalse();
    });

    it('should return a response with the navigate header and the mode reactivity', () => {
      const location = '/some-location';
      const mode = 'reactivity';
      const response = hardToSoftRedirect({ req, location, mode });

      expect(response.headers.get('X-Navigate')).toBe(location);
      expect(response.headers.get('X-Mode')).toBe(mode);
    });

    it('should transfer the request store', async () => {
      const reqWithStore = extendRequestContext({ originalRequest: req });
      reqWithStore.store.set('foo', 'bar');
      reqWithStore.store.transferToClient(['foo']);
      const response = hardToSoftRedirect({
        req: reqWithStore,
        location: '/some-location',
      });

      expect(await response.json()).toEqual([['foo', 'bar']]);
    });
  });

  describe('handleSPARedirects', () => {
    it('should return the response as is when is not a hard redirect', () => {
      const res = new Response(null, { status: 200 });
      const response = handleSPARedirects(req, res);

      expect(response).toBe(res);
    });

    it('should return the response as is when is a hard redirect with INITIAL_REQUEST initiator', () => {
      const location = '/some-location';
      const res = new Response(null, {
        status: 302,
        headers: { Location: location },
      });
      req.initiator = 'INITIAL_REQUEST';
      const response = handleSPARedirects(req, res);

      expect(response).toBe(res);
    });

    it('should return the response as is when is a hard redirect with API_REQUEST initiator', () => {
      const location = '/some-location';
      const res = new Response(null, {
        status: 302,
        headers: { Location: location },
      });
      req.initiator = 'API_REQUEST';
      const response = handleSPARedirects(req, res);

      expect(response).toBe(res);
    });

    it('should return a soft redirect response when a SPA soft redirect (initiator SPA_NAVIGATION)', () => {
      const location = '/some-location';
      const res = new Response(null, {
        status: 302,
        headers: { Location: location },
      });
      req.initiator = 'SPA_NAVIGATION';
      const response = handleSPARedirects(req, res);

      expect(response.headers.get('X-Navigate')).toBe(location);
    });

    it('should return a soft redirect response when a SPA soft redirect (initiator SERVER_ACTION)', () => {
      const location = '/some-location';
      const res = new Response(null, {
        status: 302,
        headers: { Location: location },
      });
      req.initiator = 'SERVER_ACTION';
      const response = handleSPARedirects(req, res);

      expect(response.headers.get('X-Navigate')).toBe(location);
    });
  });
});
