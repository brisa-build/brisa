import { describe, it, expect } from 'bun:test';
import createResponseHeadersContext from '.';

describe('createResponseHeadersContext', () => {
  it('should return an immutable snapshot of the original headers', () => {
    const originalHeaders = new Headers({ 'x-test': '123' });
    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot();

    expect(snapshot.get('x-test')).toBe('123');

    snapshot.set('x-test', '456');
    expect(originalHeaders.get('x-test')).toBe('123');
    expect(snapshot.get('x-test')).toBe('456');
  });

  it('should return a new headers object with the same values as the original', () => {
    const originalHeaders = new Headers({ 'content-type': 'application/json' });
    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot();

    expect(snapshot.get('content-type')).toBe('application/json');
    expect(snapshot).not.toBe(originalHeaders);
  });

  it('should correctly append headers from HeadersInit (Headers instance)', () => {
    const originalHeaders = new Headers({ 'x-original': 'keep' });
    const additionalHeaders = new Headers({ 'x-added': 'new' });

    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot(additionalHeaders);

    expect(snapshot.get('x-original')).toBe('keep');
    expect(snapshot.get('x-added')).toBe('new');
    expect(originalHeaders.has('x-added')).toBe(false);
  });

  it('should correctly append headers from HeadersInit (plain object)', () => {
    const originalHeaders = new Headers({ 'cache-control': 'no-cache' });
    const additionalHeaders = { 'x-custom': 'custom-value' };

    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot(additionalHeaders);

    expect(snapshot.get('cache-control')).toBe('no-cache');
    expect(snapshot.get('x-custom')).toBe('custom-value');
    expect(originalHeaders.has('x-custom')).toBe(false);
  });

  it('should correctly append headers from HeadersInit (array of tuples)', () => {
    const originalHeaders = new Headers({ 'x-static': 'unchanged' });
    const additionalHeaders: [string, string][] = [
      ['x-array', 'value-from-array'],
    ];

    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot(additionalHeaders);

    expect(snapshot.get('x-static')).toBe('unchanged');
    expect(snapshot.get('x-array')).toBe('value-from-array');
    expect(originalHeaders.has('x-array')).toBe(false);
  });

  it('should correctly handle multiple headers with the same name', () => {
    const originalHeaders = new Headers({ 'x-duplicate': 'first' });
    const additionalHeaders: [string, string][] = [['x-duplicate', 'second']];

    const context = createResponseHeadersContext(originalHeaders, 200);
    const snapshot = context.headersSnapshot(additionalHeaders);

    expect(snapshot.get('x-duplicate')).toBe('first, second');
    expect(originalHeaders.get('x-duplicate')).toBe('first');
  });

  it('should correctly set the responseStatus', () => {
    const context = createResponseHeadersContext(new Headers(), 404);
    expect(context.responseStatus).toBe(404);
  });
});
