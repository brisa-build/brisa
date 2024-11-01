import { describe, it, expect } from 'bun:test';

import { Initiator } from '@/public-constants';
import type { RequestContext } from '@/types';
import getInitiator from '.';

describe('utils / getInitiator', () => {
  it('should return API_REQUEST when the first pathname part is "api" with i18n + GET', () => {
    const req = {
      finalURL: 'https://example.com/en/api/foo/bar',
      i18n: { locale: 'en' },
      method: 'GET',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.API_REQUEST);
  });

  it('should return API_REQUEST when the first pathname part is "api" with GET and without i18n', () => {
    const req = {
      finalURL: 'https://example.com/api/foo/bar',
      method: 'GET',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.API_REQUEST);
  });

  it('should return API_REQUEST when the first pathname part is "api" with i18n + POST', () => {
    const req = {
      finalURL: 'https://example.com/en/api/foo/bar',
      i18n: { locale: 'en' },
      method: 'POST',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.API_REQUEST);
  });

  it('should return API_REQUEST when the first pathname part is "api" with POST and without i18n', () => {
    const req = {
      finalURL: 'https://example.com/api/foo/bar',
      method: 'POST',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.API_REQUEST);
  });

  it('should return INITIAL_REQUEST when the method is not POST', () => {
    const req = {
      finalURL: 'https://example.com/foo/bar',
      method: 'GET',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.INITIAL_REQUEST);
  });

  it('should return SERVER_ACTION when the x-action header is present', () => {
    const req = {
      finalURL: 'https://example.com/foo/bar',
      method: 'POST',
      headers: new Headers([['x-action', 'foo']]),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.SERVER_ACTION);
  });

  it('should return SERVER_ACTION when the ?_aid param in a POST method is present', () => {
    const req = {
      finalURL: 'https://example.com/foo/bar?_aid=a1_1',
      method: 'POST',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.SERVER_ACTION);
  });

  it('should return SPA_NAVIGATION when none of the conditions are met', () => {
    const req = {
      finalURL: 'https://example.com/foo/bar',
      method: 'POST',
      headers: new Headers(),
    } as RequestContext;

    expect(getInitiator(req)).toBe(Initiator.SPA_NAVIGATION);
  });
});
