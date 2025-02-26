import { describe, it, expect } from 'bun:test';
import { Fragment as BrisaFragment, jsx, type JSXSymbolMark } from '.';
import type { BrisaElement } from '@/types';

describe('utils', () => {
  describe('jsx (createNode) SERVER', () => {
    it('should convert to object node in server-side', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' });

      expect(node).toEqual(
        transformedJSX(['div', { id: 'test' }, 'Hello World']),
      );
    });

    it('should convert a nested node to object node in server-side', () => {
      const node = jsx('div', {
        id: 'test',
        children: jsx('span', { children: 'Hello World' }) as any,
      });

      expect(node).toEqual(
        transformedJSX([
          'div',
          { id: 'test' },
          transformedJSX(['span', {}, 'Hello World']),
        ]),
      );
    });

    it('should append the "key" attribute to the props', () => {
      const node = jsx('div', { id: 'test', children: 'Hello World' }, 'key');

      expect(node).toEqual(
        transformedJSX(['div', { id: 'test', key: 'key' }, 'Hello World']),
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
      const expected: BrisaElement = [
        null,
        {},
        [
          transformedJSX([null, { key: undefined }, ' ']),
          transformedJSX(['div', { key: undefined }, 'some div']),
          transformedJSX(['span', { key: undefined }, 'some span']),
        ],
      ];

      expect(output).toEqual(transformedJSX(expected));
    });
  });
});

const JSX_SYMBOL = Symbol.for('isJSX');
const transformedJSX = ([type, props, children]: BrisaElement) =>
  Object.assign([type, { key: undefined, ...props }, children], {
    [JSX_SYMBOL]: true,
  }) as unknown as JSXSymbolMark & BrisaElement;
