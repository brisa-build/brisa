import { describe, it, expect } from 'bun:test';
import { jsx } from '.';

describe('utils', () => {
  describe('jsx (createNode) SERVER', () => {
    it('should convert to object node in server-side', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' });

      expect(node).toEqual(
        isTransformedJSX(['div', { id: 'test' }, 'Hello World']),
      );
    });

    it('should convert a nested node to object node in server-side', () => {
      const node = jsx('div', {
        id: 'test',
        children: jsx('span', { children: 'Hello World' }) as any,
      });

      expect(node).toEqual(
        isTransformedJSX([
          'div',
          { id: 'test' },
          isTransformedJSX(['span', {}, 'Hello World']),
        ]),
      );
    });

    it('should append the "key" attribute to the props', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' }, 'key');

      expect(node).toEqual(
        isTransformedJSX(['div', { id: 'test', key: 'key' }, 'Hello World']),
      );
    });
  });
});

const isTransformedJSX = ([type, props, children]: any) =>
  Object.assign([type, { key: undefined, ...props }, children], {
    [Symbol.for('isJSX')]: true,
  });
