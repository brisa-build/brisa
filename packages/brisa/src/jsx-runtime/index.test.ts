import { describe, it, expect } from 'bun:test';
import { Fragment as BrisaFragment, jsx } from '.';

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

    it('should transform a fragment with elements in the same way that the web components', () => {
      const output = BrisaFragment({
        children: [
          ' ',
          jsx('div', { children: 'some div' }),
          jsx('span', { children: 'some span' }),
        ],
      });
      const expected = [
        null,
        {},
        [
          isTransformedJSX([null, { key: undefined }, ' ']),
          isTransformedJSX(['div', { key: undefined }, 'some div']),
          isTransformedJSX(['span', { key: undefined }, 'some span']),
        ],
      ];

      expect(output).toEqual(isTransformedJSX(expected));
    });
  });
});

const isTransformedJSX = ([type, props, children]: any) =>
  Object.assign([type, { key: undefined, ...props }, children], {
    [Symbol.for('isJSX')]: true,
  });
